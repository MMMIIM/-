import { createHash } from 'node:crypto';
import { sanitizeAuditJson } from './audit.js';
import { AppError } from './errors.js';
import { routeRequirement } from './pipeline/chapter-router.js';
import {
  assertMandatoryRequirementMetadata,
  detectMandatoryScopeRules
} from './pipeline/mandatory-requirement.js';
import { classifyTenderSections } from './pipeline/tender-section-classifier.js';
import {
  aggregateRequirementCandidates,
  chunkExtractedText,
  resolveRequirementChunkBudget
} from './pipeline/requirement-chunker.js';
import { SourceLocationResolver } from './pipeline/source-location-resolver.js';
import { summarizeSourceReadiness } from './requirement-source-service.js';
import { DocumentCapabilityDetector } from './pipeline/document-capability-detector.js';
import { clearUnverifiedLocation, deriveCandidateSourceStatus } from './pipeline/requirement-source-status.js';
import { requireFormalActorId } from './request-actor.js';

const MAX_EXTRACTED_CHARACTERS = 300_000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function assertValidParseJobId(jobId) {
  if (!UUID_PATTERN.test(String(jobId || ''))) {
    throw new AppError('INVALID_JOB_ID', '需求解析任务 ID 格式无效。', 400);
  }
  return jobId;
}

function normalizeError(error) {
  if (error instanceof AppError) return error;
  if (error?.code && typeof error.message === 'string') {
    const normalized = new AppError(error.code, error.message, Number(error.status) || 502, error);
    normalized.audit = error.audit;
    return normalized;
  }
  return new AppError('TENDER_PARSE_FAILED', '招标需求解析失败，请稍后重试。', 500, error);
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function scheduleImmediately(task) {
  setImmediate(task);
}

export class RequirementParseService {
  constructor({
    repository,
    storage,
    textExtractor,
    extractionGateway,
    logger = console,
    env = process.env,
    chunkBudget = resolveRequirementChunkBudget(env),
    capabilityDetector = new DocumentCapabilityDetector(),
    scheduler = scheduleImmediately
  }) {
    this.repository = repository;
    this.storage = storage;
    this.textExtractor = textExtractor;
    this.extractionGateway = extractionGateway;
    this.logger = logger;
    this.chunkBudget = chunkBudget;
    this.capabilityDetector = capabilityDetector;
    this.scheduler = scheduler;
    this.sourceLocationResolver = new SourceLocationResolver();
  }

  async start({ projectId, tenderFileId, waitForCompletion = false }) {
    const project = await this.repository.getProject(projectId);
    if (!project) throw new AppError('PROJECT_NOT_FOUND', '项目不存在。', 404);
    if (await this.repository.getRequirementBaseline(projectId)) {
      throw new AppError('REQUIREMENT_BASELINE_FROZEN', '需求基线已经确认，不能重新解析或替换。', 409);
    }
    const tenderFile = await this.repository.getTenderFile(tenderFileId);
    if (!tenderFile || tenderFile.project_id !== projectId) {
      throw new AppError('TENDER_FILE_NOT_FOUND', '招标文件不存在或不属于当前项目。', 404);
    }

    const job = await this.repository.createParseJob({ projectId, tenderFileId });
    const runningJob = await this.repository.updateParseJob(job.id, 'running', { phase: 'text_extraction' });
    if (waitForCompletion) return this.processJob({ job: runningJob || job, tenderFile, project });

    this.scheduler(() => {
      this.processJob({ job: runningJob || job, tenderFile, project }).catch((error) => {
        this.logger.error('Tender parse background task failed', {
          parseJobId: job.id,
          errorCode: error?.code || 'TENDER_PARSE_FAILED'
        });
      });
    });
    return {
      ...(runningJob || job), status: 'running', phase: 'text_extraction',
      file_name: tenderFile.original_name, total_chunks: 0, completed_chunks: 0
    };
  }

  async processJob({ job, tenderFile, project = null }) {
    if (typeof this.repository.claimParseJob === 'function') {
      const claimed = await this.repository.claimParseJob(job.id);
      if (!claimed) return this.repository.getParseJob(job.id);
      job = claimed;
    }
    const startedAt = Date.now();
    let extraction;
    let sectionAnalysis;
    let mandatoryScopeRules = [];
    let chunks = [];
    let failedChunkNumber = null;
    try {
      const buffer = await this.storage.read(tenderFile.storage_key);
      this.capabilityDetector.assertSupported(this.capabilityDetector.detect({
        fileName: tenderFile.original_name, mimeType: tenderFile.mime_type, buffer
      }));
      try {
        extraction = await this.textExtractor({
          fileName: tenderFile.original_name, mimeType: tenderFile.mime_type, buffer
        });
      } catch (extractionError) {
        this.capabilityDetector.assertSupported(this.capabilityDetector.detect({
          fileName: tenderFile.original_name, mimeType: tenderFile.mime_type, buffer, extractionError
        }));
        throw extractionError;
      }
      const documentCapability = this.capabilityDetector.assertSupported(this.capabilityDetector.detect({
        fileName: tenderFile.original_name, mimeType: tenderFile.mime_type, buffer, extraction
      }));
      if (extraction.text.length > MAX_EXTRACTED_CHARACTERS) {
        throw new AppError(
          'TENDER_TEXT_TOO_LARGE',
          `提取文本超过 ${MAX_EXTRACTED_CHARACTERS.toLocaleString('zh-CN')} 字符，请拆分文件后重试。`,
          422
        );
      }

      const extractedTextSha256 = sha256(extraction.text);
      await this.repository.updateParseJobProgress({
        jobId: job.id,
        phase: 'section_classification',
        extractedTextSha256,
        extractedCharacterCount: extraction.text.length
      });
      sectionAnalysis = classifyTenderSections(extraction);
      if (!sectionAnalysis.technicalSection) {
        throw new AppError('NO_TECHNICAL_REQUIREMENTS_FOUND', '未识别到可处理的技术或项目需求章节。', 422);
      }
      mandatoryScopeRules = detectMandatoryScopeRules(sectionAnalysis.technicalSection);
      await this.repository.saveParseDocumentAnalysis({
        jobId: job.id,
        sections: sectionAnalysis.sections,
        mandatoryScopeRules
      });
      const extractionScope = sectionAnalysis.technicalSection;
      const extractionSummary = {
        file_name: tenderFile.original_name,
        page_count: extraction.pages.length || null,
        paragraph_count: extraction.paragraphs.length,
        character_count: extraction.text.length,
        extraction_section: extractionScope.title,
        extraction_section_character_count: extractionScope.character_count,
        used_fulltext_fallback: sectionAnalysis.usedFullTextFallback,
        document_capability: documentCapability
      };
      await this.repository.updateParseJobProgress({
        jobId: job.id, phase: 'chunking', summary: extractionSummary,
        extractedTextSha256, extractedCharacterCount: extraction.text.length
      });

      chunks = chunkExtractedText({
        text: extractionScope.content_text,
        paragraphs: extractionScope.paragraphs,
        singleCallThreshold: this.chunkBudget.singleCallThreshold,
        characterBudget: this.chunkBudget.characterBudget,
        tokenBudget: this.chunkBudget.tokenBudget
      }).map((chunk) => ({ ...chunk, content_sha256: sha256(chunk.text) }));
      const persistedChunks = await this.repository.initializeParseChunks(job.id, chunks);
      if (Array.isArray(persistedChunks)) {
        const ids = new Map(persistedChunks.map((item) => [item.chunk_number, item.id]));
        chunks = chunks.map((chunk) => ({ ...chunk, id: ids.get(chunk.chunk_number) || null }));
      }

      const chunkResults = [];
      const warnings = [...extraction.warnings, ...sectionAnalysis.warnings];
      for (const chunk of chunks) {
        failedChunkNumber = chunk.chunk_number;
        await this.repository.startParseChunk(job.id, chunk.chunk_number);
        const chunkStartedAt = Date.now();
        try {
          const gatewayResult = await this.extractionGateway.extract({
            fileName: tenderFile.original_name, text: chunk.text,
            paragraphs: chunk.segments, chunk,
            projectName: project?.name || project?.project_name || project?.title || tenderFile.original_name,
            sectionName: extractionScope.title,
            chunkCount: chunks.length
          });
          const resolvedCandidates = gatewayResult.candidates.map((candidate) => ({
            candidate,
            resolution: this.sourceLocationResolver.resolve(candidate, chunk)
          }));
          const candidates = resolvedCandidates.map(({ candidate, resolution }) => ({
            ...candidate, ...resolution.location
          }));
          const runtimeMs = Date.now() - chunkStartedAt;
          await this.repository.completeParseChunk({
            jobId: job.id, chunkNumber: chunk.chunk_number,
            candidateCount: candidates.length, runtimeMs,
            gatewayAudit: sanitizeAuditJson(gatewayResult.audit)
          });
          warnings.push(...gatewayResult.warnings.map((warning) => ({
            ...warning, chunk_number: chunk.chunk_number
          })));
          warnings.push(...resolvedCandidates.filter(({ resolution }) => resolution.warning).map(({ candidate, resolution }) => ({
            ...resolution.warning, chunk_number: chunk.chunk_number,
            candidate_index: candidate.candidate_index
          })));
          chunkResults.push({ chunk_number: chunk.chunk_number, candidates });
        } catch (caught) {
          const error = normalizeError(caught);
          const runtimeMs = Date.now() - chunkStartedAt;
          await this.repository.failParseChunk({
            jobId: job.id, chunkNumber: chunk.chunk_number,
            errorCode: error.code, errorMessage: error.message, runtimeMs,
            gatewayAudit: sanitizeAuditJson(caught?.audit)
          });
          error.failedChunkNumber = chunk.chunk_number;
          error.chunkRuntimeMs = runtimeMs;
          throw error;
        }
      }

      failedChunkNumber = null;
      await this.repository.updateParseJobProgress({
        jobId: job.id, phase: 'aggregating',
        totalChunks: chunks.length, completedChunks: chunks.length
      });
      const candidates = aggregateRequirementCandidates(chunkResults, { mandatoryScopeRules, documentText: extraction.text });
      return await this.repository.completeParseJob({
        jobId: job.id,
        candidates,
        summary: {
          ...extractionSummary, chunk_count: chunks.length,
          single_call_threshold: this.chunkBudget.singleCallThreshold,
          character_budget: this.chunkBudget.characterBudget,
          token_budget: this.chunkBudget.tokenBudget,
          empty_chunk_count: chunkResults.filter((result) => result.candidates.length === 0).length,
          requirement_count: candidates.length,
          canonicalization_audit: candidates.audit
        },
        warnings,
        gatewayAudit: {
          provider: 'semantic_gateway', task_type: 'requirement_extraction',
          processing: 'serial_chunks', chunk_count: chunks.length
        },
        extractedTextSha256,
        extractedCharacterCount: extraction.text.length,
        runtimeMs: Date.now() - startedAt
      });
    } catch (caught) {
      const error = normalizeError(caught);
      const actualFailedChunk = error.failedChunkNumber ?? failedChunkNumber;
      const safeMessage = actualFailedChunk
        ? `分片 ${actualFailedChunk}/${chunks.length} 处理失败：${error.message}`
        : error.message;
      try {
        await this.repository.failParseJob({
          jobId: job.id, errorCode: error.code, errorMessage: safeMessage,
          warnings: [...(extraction?.warnings || []), ...(sectionAnalysis?.warnings || [])],
          gatewayAudit: sanitizeAuditJson(caught?.audit),
          extractedTextSha256: extraction?.text ? sha256(extraction.text) : null,
          extractedCharacterCount: extraction?.text?.length ?? null,
          runtimeMs: Date.now() - startedAt,
          failedChunkNumber: actualFailedChunk,
          summary: {
            chunk_count: chunks.length, failed_chunk_number: actualFailedChunk,
            failed_chunk_runtime_ms: error.chunkRuntimeMs ?? null
          }
        });
      } catch (auditError) {
        this.logger.error('Failed to persist tender parse audit', {
          parseJobId: job.id, errorCode: error.code,
          auditError: auditError instanceof Error ? auditError.message : String(auditError)
        });
      }
      throw error;
    }
  }

  async get(jobId) {
    assertValidParseJobId(jobId);
    const job = await this.repository.getParseJob(jobId);
    if (!job) throw new AppError('TENDER_PARSE_JOB_NOT_FOUND', '需求解析任务不存在。', 404);
    return job;
  }

  async confirm(jobId, input = {}) {
    assertValidParseJobId(jobId);
    const job = await this.repository.getParseJob(jobId);
    if (!job) throw new AppError('TENDER_PARSE_JOB_NOT_FOUND', '需求解析任务不存在。', 404);
    if (job.status !== 'succeeded') {
      throw new AppError('TENDER_PARSE_NOT_READY', '仅全部分片成功并完成汇总校验的解析任务可以确认需求基线。', 409);
    }
    if (!job.candidates?.length) {
      throw new AppError('REQUIREMENTS_REQUIRED', '解析任务没有可确认的候选需求。', 422);
    }
    const readiness = summarizeSourceReadiness(job.candidates);
    if (readiness.mandatory_provisional_pending) {
      throw new AppError('MANDATORY_PROVISIONAL_CONFIRMATION_REQUIRED', `仍有 ${readiness.mandatory_provisional_pending} 条来源未定位的实质性要求，必须逐条人工确认或排除。`, 422);
    }
    if (readiness.pending) {
      throw new AppError('CANDIDATE_DECISIONS_PENDING', `仍有 ${readiness.pending} 条候选尚未人工处理，不能确认基线。`, 422);
    }
    if (!readiness.included) {
      throw new AppError('INCLUDED_REQUIREMENTS_REQUIRED', '至少需要保留一条候选需求。', 422);
    }
    const confirmedBy = requireFormalActorId(input.confirmed_by);
    let requirements;
    try {
      requirements = job.candidates.filter((candidate) => candidate.candidate_decision === undefined || candidate.candidate_decision === 'include').map((candidate) => {
        assertMandatoryRequirementMetadata(candidate);
        const sourceStatus = deriveCandidateSourceStatus(candidate);
        if (sourceStatus === 'provisional' && !candidate.confirmed_at) {
          throw new AppError('PROVISIONAL_CONFIRMATION_REQUIRED', `${candidate.req_id} 必须明确确认后才能进入暂定基线。`, 422);
        }
        if (candidate.is_mandatory && sourceStatus === 'provisional' && candidate.confirmation_type !== 'provisional_individual') {
          throw new AppError('MANDATORY_PROVISIONAL_CONFIRMATION_REQUIRED', `${candidate.req_id} 为实质性要求，必须逐条人工确认。`, 422);
        }
        return {
          ...clearUnverifiedLocation(candidate), source_status: sourceStatus,
          target_sections: routeRequirement({ req_id: candidate.req_id, text: candidate.content })
        };
      });
    } catch (error) {
      throw new AppError(
        error.code || 'REQUIREMENT_MANDATORY_METADATA_INVALID',
        error.message || 'Requirement mandatory 信息校验失败。',
        422,
        error
      );
    }
    try {
      return await this.repository.confirmRequirementBaseline({ jobId, requirements, confirmedBy });
    } catch (error) {
      if (error?.code === 'REQUIREMENT_BASELINE_FROZEN' || error?.code === '23505') {
        throw new AppError('REQUIREMENT_BASELINE_FROZEN', '需求基线已经确认，不能增删改合并。', 409);
      }
      throw error;
    }
  }
}
