import pg from 'pg';
import { sanitizeAuditJson, sanitizeAuditText } from './audit.js';

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
    return rows;
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
