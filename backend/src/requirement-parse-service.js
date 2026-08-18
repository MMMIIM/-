import { createHash } from 'node:crypto';
import { sanitizeAuditJson } from './audit.js';
import { AppError } from './errors.js';
import { routeRequirement } from './pipeline/chapter-router.js';

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
    return new AppError(error.code, error.message, Number(error.status) || 502, error);
  }
  return new AppError('TENDER_PARSE_FAILED', '招标需求解析失败，请稍后重试。', 500, error);
}

export class RequirementParseService {
  constructor({ repository, storage, textExtractor, extractionGateway, logger = console }) {
    this.repository = repository;
    this.storage = storage;
    this.textExtractor = textExtractor;
    this.extractionGateway = extractionGateway;
    this.logger = logger;
  }

  async start({ projectId, tenderFileId }) {
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
    await this.repository.updateParseJob(job.id, 'running');
    const startedAt = Date.now();
    let extraction;
    try {
      const buffer = await this.storage.read(tenderFile.storage_key);
      extraction = await this.textExtractor({
        fileName: tenderFile.original_name,
        mimeType: tenderFile.mime_type,
        buffer
      });
      if (extraction.text.length > MAX_EXTRACTED_CHARACTERS) {
        throw new AppError(
          'TENDER_TEXT_TOO_LARGE',
          `提取文本超过 ${MAX_EXTRACTED_CHARACTERS.toLocaleString('zh-CN')} 字符，请拆分文件后重试。`,
          422
        );
      }
      const gatewayResult = await this.extractionGateway.extract({
        fileName: tenderFile.original_name,
        text: extraction.text,
        paragraphs: extraction.paragraphs
      });
      const warnings = [...extraction.warnings, ...gatewayResult.warnings];
      return await this.repository.completeParseJob({
        jobId: job.id,
        candidates: gatewayResult.candidates,
        summary: {
          file_name: tenderFile.original_name,
          requirement_count: gatewayResult.candidates.length,
          page_count: extraction.pages.length || null,
          paragraph_count: extraction.paragraphs.length
        },
        warnings,
        gatewayAudit: sanitizeAuditJson(gatewayResult.audit),
        extractedTextSha256: createHash('sha256').update(extraction.text).digest('hex'),
        extractedCharacterCount: extraction.text.length,
        runtimeMs: Date.now() - startedAt
      });
    } catch (caught) {
      const error = normalizeError(caught);
      try {
        await this.repository.failParseJob({
          jobId: job.id,
          errorCode: error.code,
          errorMessage: error.message,
          warnings: extraction?.warnings || [],
          gatewayAudit: sanitizeAuditJson(caught?.audit),
          extractedTextSha256: extraction?.text
            ? createHash('sha256').update(extraction.text).digest('hex')
            : null,
          extractedCharacterCount: extraction?.text?.length ?? null,
          runtimeMs: Date.now() - startedAt
        });
      } catch (auditError) {
        this.logger.error('Failed to persist tender parse audit', {
          parseJobId: job.id,
          error: auditError instanceof Error ? auditError.message : String(auditError)
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

  async confirm(jobId) {
    assertValidParseJobId(jobId);
    const job = await this.repository.getParseJob(jobId);
    if (!job) throw new AppError('TENDER_PARSE_JOB_NOT_FOUND', '需求解析任务不存在。', 404);
    if (job.status !== 'succeeded') {
      throw new AppError('TENDER_PARSE_NOT_READY', '仅成功完成的解析任务可以确认需求基线。', 409);
    }
    if (!job.candidates?.length) {
      throw new AppError('REQUIREMENTS_REQUIRED', '解析任务没有可确认的候选需求。', 422);
    }
    const requirements = job.candidates.map((candidate) => ({
      ...candidate,
      target_sections: routeRequirement({ req_id: candidate.req_id, text: candidate.content })
    }));
    try {
      return await this.repository.confirmRequirementBaseline({ jobId, requirements });
    } catch (error) {
      if (error?.code === 'REQUIREMENT_BASELINE_FROZEN' || error?.code === '23505') {
        throw new AppError('REQUIREMENT_BASELINE_FROZEN', '需求基线已经确认，不能增删改合并。', 409);
      }
      throw error;
    }
  }
}
