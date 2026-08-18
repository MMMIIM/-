import pg from 'pg';
import { sanitizeAuditJson, sanitizeAuditText } from './audit.js';
import { normalizeTenderFileRecord, normalizeUtf8FileName } from './file-name.js';

const { Pool } = pg;

export function createPool(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) throw new Error('DATABASE_URL is required');
  return new Pool({ connectionString });
}

export class PgRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async createProject({ name, deadline }) {
    const { rows } = await this.pool.query(
      `INSERT INTO projects (name, deadline) VALUES ($1, $2) RETURNING *`,
      [name, deadline || null]
    );
    return rows[0];
  }

  async listProjects() {
    const { rows } = await this.pool.query(`
      SELECT p.*, dv.version_number AS current_version, dv.risk_status
      FROM projects p LEFT JOIN document_versions dv ON dv.id = p.current_version_id
      ORDER BY p.updated_at DESC
    `);
    return rows;
  }

  async getProject(id) {
    const { rows } = await this.pool.query(`
      SELECT p.*, dv.version_number AS current_version, dv.risk_status
      FROM projects p LEFT JOIN document_versions dv ON dv.id = p.current_version_id
      WHERE p.id = $1
    `, [id]);
    return rows[0] || null;
  }

  async addTenderFile(file) {
    const { rows } = await this.pool.query(`
      INSERT INTO tender_files (project_id, original_name, storage_key, mime_type, size_bytes)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `, [file.projectId, file.originalName, file.storageKey, file.mimeType, file.sizeBytes]);
    await this.touchProject(file.projectId);
    return rows[0];
  }

  async listTenderFiles(projectId) {
    const { rows } = await this.pool.query(
      `SELECT * FROM tender_files WHERE project_id = $1 ORDER BY created_at DESC`, [projectId]
    );
    return rows.map(normalizeTenderFileRecord);
  }

  async getTenderFile(id) {
    const { rows } = await this.pool.query(
      `SELECT * FROM tender_files WHERE id = $1`, [id]
    );
    return normalizeTenderFileRecord(rows[0] || null);
  }

  async createParseJob({ projectId, tenderFileId }) {
    const { rows } = await this.pool.query(`
      INSERT INTO tender_parse_jobs (project_id, tender_file_id, status)
      VALUES ($1, $2, 'queued') RETURNING *
    `, [projectId, tenderFileId]);
    await this.touchProject(projectId);
    return rows[0];
  }

  async updateParseJob(id, status, { phase } = {}) {
    const { rows } = await this.pool.query(`
      UPDATE tender_parse_jobs
      SET status = $2, phase = COALESCE($3, phase),
        started_at = CASE WHEN $2 = 'running' THEN COALESCE(started_at, now()) ELSE started_at END,
        finished_at = CASE WHEN $2 IN ('succeeded', 'failed') THEN now() ELSE finished_at END,
        updated_at = now()
      WHERE id = $1 RETURNING *
    `, [id, status, phase || null]);
    return rows[0] || null;
  }

  async updateParseJobProgress({
    jobId,
    phase,
    totalChunks,
    completedChunks,
    summary,
    extractedTextSha256,
    extractedCharacterCount
  }) {
    const { rows } = await this.pool.query(`
      UPDATE tender_parse_jobs
      SET phase = $2,
        total_chunks = COALESCE($3, total_chunks),
        completed_chunks = COALESCE($4, completed_chunks),
        summary_json = summary_json || COALESCE($5::jsonb, '{}'::jsonb),
        extracted_text_sha256 = COALESCE($6, extracted_text_sha256),
        extracted_character_count = COALESCE($7, extracted_character_count),
        updated_at = now()
      WHERE id = $1 RETURNING *
    `, [
      jobId, phase, totalChunks ?? null, completedChunks ?? null,
      summary === undefined ? null : JSON.stringify(summary),
      extractedTextSha256 ?? null, extractedCharacterCount ?? null
    ]);
    return rows[0] || null;
  }

  async initializeParseChunks(jobId, chunks) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      for (const chunk of chunks) {
        await client.query(`
          INSERT INTO tender_parse_chunks (
            parse_job_id, chunk_number, character_count, estimated_token_count,
            source_start_offset, source_end_offset, source_start_page, source_end_page,
            source_start_paragraph, source_end_paragraph, starts_at_title_boundary,
            content_sha256
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [
          jobId, chunk.chunk_number, chunk.character_count, chunk.estimated_token_count,
          chunk.source_start_offset, chunk.source_end_offset,
          chunk.source_start_page, chunk.source_end_page,
          chunk.source_start_paragraph, chunk.source_end_paragraph,
          chunk.starts_at_title_boundary, chunk.content_sha256
        ]);
      }
      await client.query(`
        UPDATE tender_parse_jobs
        SET phase = 'extracting', total_chunks = $2, completed_chunks = 0, updated_at = now()
        WHERE id = $1
      `, [jobId, chunks.length]);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async startParseChunk(jobId, chunkNumber) {
    const { rows } = await this.pool.query(`
      UPDATE tender_parse_chunks
      SET status = 'running', started_at = now(), updated_at = now()
      WHERE parse_job_id = $1 AND chunk_number = $2 RETURNING *
    `, [jobId, chunkNumber]);
    return rows[0] || null;
  }

  async completeParseChunk({ jobId, chunkNumber, candidateCount, runtimeMs, gatewayAudit }) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`
        UPDATE tender_parse_chunks
        SET status = 'succeeded', candidate_count = $3, runtime_ms = $4,
          gateway_audit_json = $5::jsonb, finished_at = now(), updated_at = now()
        WHERE parse_job_id = $1 AND chunk_number = $2
      `, [
        jobId, chunkNumber, candidateCount, runtimeMs,
        gatewayAudit === undefined ? null : JSON.stringify(gatewayAudit)
      ]);
      await client.query(`
        UPDATE tender_parse_jobs
        SET completed_chunks = completed_chunks + 1, updated_at = now()
        WHERE id = $1
      `, [jobId]);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async failParseChunk({ jobId, chunkNumber, errorCode, errorMessage, runtimeMs, gatewayAudit }) {
    await this.pool.query(`
      UPDATE tender_parse_chunks
      SET status = 'failed', error_code = $3, error_message = $4, runtime_ms = $5,
        gateway_audit_json = $6::jsonb, finished_at = now(), updated_at = now()
      WHERE parse_job_id = $1 AND chunk_number = $2
    `, [
      jobId, chunkNumber, errorCode, errorMessage, runtimeMs,
      gatewayAudit === undefined ? null : JSON.stringify(gatewayAudit)
    ]);
  }

  async completeParseJob({
    jobId,
    candidates,
    summary,
    warnings,
    gatewayAudit,
    extractedTextSha256,
    extractedCharacterCount,
    runtimeMs
  }) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const jobResult = await client.query(`
        UPDATE tender_parse_jobs
        SET status = 'succeeded', phase = 'succeeded', completed_chunks = total_chunks,
          summary_json = $2::jsonb, warnings_json = $3::jsonb,
          gateway_audit_json = $4::jsonb, extracted_text_sha256 = $5,
          extracted_character_count = $6, runtime_ms = $7,
          finished_at = now(), updated_at = now()
        WHERE id = $1 AND status = 'running'
        RETURNING *
      `, [
        jobId,
        JSON.stringify(summary),
        JSON.stringify(warnings),
        gatewayAudit === undefined ? null : JSON.stringify(gatewayAudit),
        extractedTextSha256,
        extractedCharacterCount,
        runtimeMs
      ]);
      if (!jobResult.rows[0]) throw new Error('Parse job is not running');
      for (const candidate of candidates) {
        await client.query(`
          INSERT INTO requirement_candidates
            (parse_job_id, req_id, content, source_excerpt, source_page, source_paragraph,
             ordinal, sources_json)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
        `, [
          jobId, candidate.req_id, candidate.content, candidate.source_excerpt,
          candidate.source_page, candidate.source_paragraph, candidate.ordinal,
          JSON.stringify(candidate.sources || [])
        ]);
      }
      await client.query(`UPDATE projects SET status = 'requirements_review', updated_at = now() WHERE id = $1`, [
        jobResult.rows[0].project_id
      ]);
      await client.query('COMMIT');
      return this.getParseJob(jobId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async failParseJob({
    jobId,
    errorCode,
    errorMessage,
    warnings,
    gatewayAudit,
    extractedTextSha256,
    extractedCharacterCount,
    runtimeMs,
    failedChunkNumber,
    summary
  }) {
    const { rows } = await this.pool.query(`
      UPDATE tender_parse_jobs
      SET status = 'failed', phase = 'failed', warnings_json = $2::jsonb,
        gateway_audit_json = $3::jsonb,
        extracted_text_sha256 = COALESCE($4, extracted_text_sha256),
        extracted_character_count = COALESCE($5, extracted_character_count), runtime_ms = $6,
        error_code = $7, error_message = $8, failed_chunk_number = $9,
        summary_json = summary_json || COALESCE($10::jsonb, '{}'::jsonb),
        finished_at = now(), updated_at = now()
      WHERE id = $1 RETURNING *
    `, [
      jobId,
      JSON.stringify(warnings || []),
      gatewayAudit === undefined ? null : JSON.stringify(gatewayAudit),
      extractedTextSha256,
      extractedCharacterCount,
      runtimeMs,
      errorCode,
      errorMessage,
      failedChunkNumber ?? null,
      summary === undefined ? null : JSON.stringify(summary)
    ]);
    if (rows[0]?.project_id) await this.touchProject(rows[0].project_id);
    return rows[0] || null;
  }

  async listParseJobs(projectId) {
    const { rows } = await this.pool.query(`
      SELECT j.id, j.project_id, j.tender_file_id, f.original_name AS file_name,
        j.status, j.phase, j.total_chunks, j.completed_chunks, j.failed_chunk_number,
        j.summary_json, j.warnings_json, j.runtime_ms,
        j.error_code, j.error_message, j.started_at, j.finished_at,
        j.created_at, j.updated_at, count(c.id)::int AS requirement_count
      FROM tender_parse_jobs j
      JOIN tender_files f ON f.id = j.tender_file_id
      LEFT JOIN requirement_candidates c ON c.parse_job_id = j.id
      WHERE j.project_id = $1
      GROUP BY j.id, f.original_name
      ORDER BY j.created_at DESC
    `, [projectId]);
    return rows.map((row) => ({ ...row, file_name: normalizeUtf8FileName(row.file_name) }));
  }

  async getParseJob(id) {
    const { rows } = await this.pool.query(`
      SELECT j.id, j.project_id, j.tender_file_id, f.original_name AS file_name,
        j.status, j.phase, j.total_chunks, j.completed_chunks, j.failed_chunk_number,
        j.summary_json, j.warnings_json, j.runtime_ms,
        j.error_code, j.error_message, j.started_at, j.finished_at,
        j.created_at, j.updated_at
      FROM tender_parse_jobs j
      JOIN tender_files f ON f.id = j.tender_file_id
      WHERE j.id = $1
    `, [id]);
    if (!rows[0]) return null;
    const [candidates, chunks] = await Promise.all([this.pool.query(`
      SELECT id, req_id, content, source_excerpt, source_page, source_paragraph,
        ordinal, status, sources_json, created_at
      FROM requirement_candidates WHERE parse_job_id = $1 ORDER BY ordinal
    `, [id]), this.pool.query(`
      SELECT chunk_number, status, character_count, estimated_token_count,
        source_start_offset, source_end_offset, source_start_page, source_end_page,
        source_start_paragraph, source_end_paragraph, starts_at_title_boundary,
        candidate_count, runtime_ms, error_code, error_message, started_at, finished_at
      FROM tender_parse_chunks WHERE parse_job_id = $1 ORDER BY chunk_number
    `, [id])]);
    return {
      ...rows[0],
      file_name: normalizeUtf8FileName(rows[0].file_name),
      candidates: candidates.rows,
      chunks: chunks.rows
    };
  }

  async getRequirementBaseline(projectId) {
    const { rows } = await this.pool.query(`
      SELECT * FROM requirement_baselines
      WHERE project_id = $1 AND status = 'confirmed'
    `, [projectId]);
    if (!rows[0]) return null;
    const requirements = await this.pool.query(`
      SELECT id, req_id, content, source_excerpt, source_page, source_paragraph,
        target_sections, ordinal, created_at
      FROM requirements WHERE baseline_id = $1 ORDER BY ordinal
    `, [rows[0].id]);
    return { ...rows[0], requirements: requirements.rows };
  }

  async confirmRequirementBaseline({ jobId, requirements }) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const jobResult = await client.query(`
        SELECT * FROM tender_parse_jobs WHERE id = $1 FOR UPDATE
      `, [jobId]);
      const job = jobResult.rows[0];
      if (!job || job.status !== 'succeeded') {
        throw Object.assign(new Error('Parse job is not ready'), { code: 'TENDER_PARSE_NOT_READY' });
      }
      const existing = await client.query(`
        SELECT id FROM requirement_baselines WHERE project_id = $1
      `, [job.project_id]);
      if (existing.rows[0]) {
        throw Object.assign(new Error('Requirement baseline is frozen'), { code: 'REQUIREMENT_BASELINE_FROZEN' });
      }
      const baselineResult = await client.query(`
        INSERT INTO requirement_baselines (project_id, parse_job_id, status)
        VALUES ($1, $2, 'building') RETURNING *
      `, [job.project_id, job.id]);
      const baseline = baselineResult.rows[0];
      for (const requirement of requirements) {
        await client.query(`
          INSERT INTO requirements
            (baseline_id, project_id, req_id, content, source_excerpt,
             source_page, source_paragraph, target_sections, ordinal)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9)
        `, [
          baseline.id, job.project_id, requirement.req_id, requirement.content,
          requirement.source_excerpt, requirement.source_page, requirement.source_paragraph,
          JSON.stringify(requirement.target_sections), requirement.ordinal
        ]);
      }
      const confirmed = await client.query(`
        UPDATE requirement_baselines
        SET status = 'confirmed', confirmed_at = now()
        WHERE id = $1 RETURNING *
      `, [baseline.id]);
      await client.query(`
        UPDATE requirement_candidates SET status = 'confirmed' WHERE parse_job_id = $1
      `, [job.id]);
      await client.query(`
        UPDATE projects SET status = 'requirements_confirmed', updated_at = now() WHERE id = $1
      `, [job.project_id]);
      await client.query('COMMIT');
      return {
        baseline: confirmed.rows[0],
        requirements: requirements.map((requirement) => ({ ...requirement }))
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async createJob({ projectId, inputs }) {
    const { rows } = await this.pool.query(`
      INSERT INTO generation_jobs (project_id, status, request_inputs)
      VALUES ($1, 'queued', $2) RETURNING *
    `, [projectId || null, inputs]);
    if (projectId) await this.pool.query(`UPDATE projects SET status = 'generating', updated_at = now() WHERE id = $1`, [projectId]);
    return rows[0];
  }

  async updateJob(id, status, error = {}) {
    const { rows } = await this.pool.query(`
      UPDATE generation_jobs SET status = $2, error_code = $3, error_message = $4,
        started_at = CASE WHEN $2 = 'running' THEN COALESCE(started_at, now()) ELSE started_at END,
        finished_at = CASE WHEN $2 IN ('succeeded', 'failed') THEN now() ELSE finished_at END,
        updated_at = now()
      WHERE id = $1 RETURNING *
    `, [id, status, error.code || null, error.message || null]);
    if (status === 'failed' && rows[0]?.project_id) {
      await this.pool.query(`UPDATE projects SET status = 'failed', updated_at = now() WHERE id = $1`, [rows[0].project_id]);
    }
    return rows[0];
  }

  async recordFailedGeneration({
    job,
    responsePayloadJson,
    rawDifyResponseJson,
    rawResponseText,
    errorCode,
    errorMessage,
    workflowVersion,
    runtimeMs
  }) {
    const serializedResponsePayload = responsePayloadJson === undefined
      ? null
      : JSON.stringify(responsePayloadJson);
    const serializedDifyResponse = rawDifyResponseJson === undefined
      ? null
      : JSON.stringify(rawDifyResponseJson);
    const { rows } = await this.pool.query(`
      INSERT INTO generations (
        project_id, job_id, response_payload_json, raw_dify_response_json, raw_response_text,
        error_code, error_message, workflow_version, runtime_ms, status
      )
      VALUES ($1, $2, $3::jsonb, $4::jsonb, $5, $6, $7, $8, $9, 'failed')
      RETURNING id, project_id, job_id, status, error_code, error_message,
        workflow_version, runtime_ms, response_payload_json, raw_dify_response_json,
        raw_response_text, created_at
    `, [
      job.project_id,
      job.id,
      serializedResponsePayload,
      serializedDifyResponse,
      rawResponseText ?? null,
      errorCode,
      errorMessage,
      workflowVersion,
      runtimeMs
    ]);
    return rows[0];
  }

  async completeGeneration({ job, parsed, workflowVersion, runtimeMs }) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const serializedPayload = JSON.stringify(parsed.raw);
      const sanitizedDifyResponse = sanitizeAuditJson(parsed.audit?.rawDifyResponseJson);
      const serializedDifyResponse = sanitizedDifyResponse === undefined
        ? null
        : JSON.stringify(sanitizedDifyResponse);
      const generationResult = await client.query(`
        INSERT INTO generations (
          project_id, job_id, response_payload_json, raw_dify_response_json,
          raw_response_text, error_code, error_message, workflow_version, runtime_ms, status
        )
        VALUES ($1, $2, $3::jsonb, $4::jsonb, $5, NULL, NULL, $6, $7, 'succeeded') RETURNING *
      `, [
        job.project_id, job.id, serializedPayload, serializedDifyResponse,
        sanitizeAuditText(parsed.audit?.rawResponseText) ?? null, workflowVersion, runtimeMs
      ]);
      let version = null;
      if (job.project_id) {
        const versionResult = await client.query(`
          INSERT INTO document_versions
            (project_id, generation_id, version_number, title, content_markdown, sections_json, warnings_json, risk_status)
          SELECT $1, $2, COALESCE(MAX(version_number), 0) + 1, $3, $4, $5::jsonb, $6::jsonb, $7
          FROM document_versions WHERE project_id = $1 RETURNING *
        `, [
          job.project_id, generationResult.rows[0].id, parsed.title, parsed.markdown,
          JSON.stringify(parsed.sections), JSON.stringify(parsed.warnings), parsed.riskStatus
        ]);
        version = versionResult.rows[0];
        await client.query(`UPDATE projects SET status = 'review', updated_at = now() WHERE id = $1`, [job.project_id]);
      }
      await client.query(`UPDATE generation_jobs SET status = 'succeeded', finished_at = now(), updated_at = now() WHERE id = $1`, [job.id]);
      await client.query('COMMIT');
      return { generation: generationResult.rows[0], version };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async listJobs(projectId) {
    const { rows } = await this.pool.query(
      `SELECT id, project_id, status, error_code, error_message, started_at, finished_at, created_at, updated_at
       FROM generation_jobs WHERE project_id = $1 ORDER BY created_at DESC`, [projectId]
    );
    return rows;
  }

  async listGenerations(projectId) {
    const { rows } = await this.pool.query(`
      SELECT id, project_id, job_id, status, error_code, error_message,
        workflow_version, runtime_ms, created_at,
        response_payload_json IS NOT NULL AS has_response_payload_json,
        raw_dify_response_json IS NOT NULL AS has_raw_dify_response_json,
        raw_response_text IS NOT NULL AS has_raw_response_text
      FROM generations WHERE project_id = $1 ORDER BY created_at DESC
    `, [projectId]);
    return rows;
  }

  async listVersions(projectId) {
    const { rows } = await this.pool.query(
      `SELECT * FROM document_versions WHERE project_id = $1 ORDER BY version_number DESC`, [projectId]
    );
    return rows;
  }

  async getVersion(id) {
    const { rows } = await this.pool.query(`SELECT * FROM document_versions WHERE id = $1`, [id]);
    return rows[0] || null;
  }

  async confirmVersion(version, confirmationText) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const decision = await client.query(`
        INSERT INTO review_decisions (project_id, document_version_id, decision, confirmation_text)
        VALUES ($1, $2, 'confirmed', $3) RETURNING *
      `, [version.project_id, version.id, confirmationText || null]);
      const versionResult = await client.query(`
        UPDATE document_versions SET status = 'confirmed', confirmed_at = now() WHERE id = $1 RETURNING *
      `, [version.id]);
      await client.query(`
        UPDATE projects SET current_version_id = $2, status = 'confirmed', updated_at = now() WHERE id = $1
      `, [version.project_id, version.id]);
      await client.query('COMMIT');
      return { decision: decision.rows[0], version: versionResult.rows[0] };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async touchProject(id) {
    await this.pool.query(`UPDATE projects SET updated_at = now() WHERE id = $1`, [id]);
  }
}
