import { AppError } from '../errors.js';
import { canonicalizeRequirements } from './canonical-requirements.js';
import { planChapters } from './chapter-router.js';
import { createClaimGate } from './claim-gate.js';
import { sanitizeDocument } from './document-sanitizer.js';
import { validateDocument } from './document-validator.js';
import { buildTraceabilityMatrix } from './traceability-service.js';
import { createResponseEnvelope } from './response-envelope.js';

export const PIPELINE_STATES = [
  'created', 'canonicalized', 'planned', 'claims_gated',
  'drafted', 'sanitized', 'validated', 'finalized'
];

export class GenerationAudit {
  constructor() {
    this.state = 'created';
    this.events = [{ sequence: 0, state: 'created' }];
  }

  advance(nextState) {
    const currentIndex = PIPELINE_STATES.indexOf(this.state);
    if (nextState !== PIPELINE_STATES[currentIndex + 1]) {
      throw Object.assign(new Error(`非法状态迁移：${this.state} → ${nextState}`), { code: 'PIPELINE_STATE_INVALID' });
    }
    this.state = nextState;
    this.events.push({ sequence: this.events.length, state: nextState });
  }

  fail(error) {
    if (this.state !== 'failed') {
      this.state = 'failed';
      this.events.push({
        sequence: this.events.length,
        state: 'failed',
        error_code: error?.code || 'PIPELINE_FAILED',
        error_message: error?.message || '4.3 流水线失败。'
      });
    }
  }

  snapshot() {
    return { state: this.state, events: this.events.map((event) => ({ ...event })) };
  }
}

function normalizeDrafts(drafts) {
  if (!Array.isArray(drafts) || drafts.length === 0) {
    throw Object.assign(new Error('Mock writer 未返回章节草稿。'), { code: 'WRITER_OUTPUT_INVALID' });
  }
  return drafts.map((section) => {
    if (!section || typeof section !== 'object' || typeof section.draft_text !== 'string' || !section.draft_text.trim()) {
      throw Object.assign(new Error('Mock writer 章节格式无效。'), { code: 'WRITER_OUTPUT_INVALID' });
    }
    return {
      id: String(section.id || '').trim(),
      title: String(section.title || '').trim(),
      requirement_ids: Array.isArray(section.requirement_ids) ? [...section.requirement_ids] : [],
      draft_text: section.draft_text.trim()
    };
  });
}

function failureValidation(error) {
  return {
    valid: false,
    risk_status: 'critical',
    errors: [{ code: error.code || 'PIPELINE_FAILED', message: error.message || '4.3 流水线失败。' }],
    warnings: [],
    coverage: 0
  };
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
}

export async function runDeterministicPipeline({ rawRequirements, writer, title = '4.3 确定性技术响应' }) {
  const audit = new GenerationAudit();
  let requirements = [];
  let baselineRequirements = [];
  let sections = [];
  let traceability = [];
  try {
    requirements = canonicalizeRequirements(rawRequirements);
    baselineRequirements = structuredClone(requirements);
    const preflight = validateDocument({
      baselineRequirements,
      requirements,
      phase: 'preflight'
    });
    if (!preflight.valid) throw Object.assign(new Error('Requirement 预检失败。'), { code: 'REQUIREMENT_PREFLIGHT_FAILED' });
    audit.advance('canonicalized');

    const chapters = planChapters(requirements);
    audit.advance('planned');

    const claimGate = createClaimGate(requirements);
    audit.advance('claims_gated');

    const writerContext = deepFreeze({
      requirements: structuredClone(requirements),
      chapters: structuredClone(chapters),
      claimGate: {
        requirement_ids: [...claimGate.requirement_ids],
        supported_commitments: structuredClone(claimGate.supported_commitments)
      }
    });
    sections = normalizeDrafts(await writer.write(writerContext));
    audit.advance('drafted');

    sections = sanitizeDocument(sections, claimGate);
    audit.advance('sanitized');

    const validation = validateDocument({
      baselineRequirements,
      requirements,
      sections,
      claimGate,
      phase: 'final'
    });
    if (!validation.valid) {
      const error = Object.assign(new Error('文档终检失败。'), {
        code: 'DOCUMENT_VALIDATION_FAILED', validation
      });
      audit.fail(error);
      traceability = validation.traceability || buildTraceabilityMatrix(requirements, sections);
      return {
        ok: false,
        error,
        envelope: createResponseEnvelope({ title, requirements, sections, traceability, validation, audit: audit.snapshot() })
      };
    }
    audit.advance('validated');

    traceability = buildTraceabilityMatrix(requirements, sections);
    audit.advance('finalized');
    return {
      ok: true,
      envelope: createResponseEnvelope({ title, requirements, sections, traceability, validation, audit: audit.snapshot() })
    };
  } catch (caught) {
    const error = caught instanceof Error ? caught : new Error(String(caught));
    audit.fail(error);
    const validation = failureValidation(error);
    return {
      ok: false,
      error,
      envelope: createResponseEnvelope({ title, requirements, sections, traceability, validation, audit: audit.snapshot() })
    };
  }
}

export class DeterministicPipelineService {
  constructor({ repository, writer, logger = console }) {
    this.repository = repository;
    this.writer = writer;
    this.logger = logger;
  }

  async generate({ projectId, requirements, title }) {
    if (!projectId || !(await this.repository.getProject(projectId))) {
      throw new AppError('PROJECT_NOT_FOUND', '项目不存在。', 404);
    }
    const job = await this.repository.createJob({
      projectId,
      inputs: { schema_version: '4.3', requirement_ids: requirements?.map((item) => item.req_id) || [] }
    });
    await this.repository.updateJob(job.id, 'running');
    const startedAt = Date.now();
    const pipelineResult = await runDeterministicPipeline({ rawRequirements: requirements, writer: this.writer, title });

    if (!pipelineResult.ok) {
      const errorCode = pipelineResult.error?.code || 'PIPELINE_FAILED';
      const errorMessage = pipelineResult.error?.message || '4.3 流水线失败。';
      try {
        await this.repository.recordFailedGeneration({
          job,
          responsePayloadJson: pipelineResult.envelope,
          errorCode,
          errorMessage,
          workflowVersion: '4.3',
          runtimeMs: Date.now() - startedAt
        });
      } catch (auditError) {
        this.logger.error('Failed to persist 4.3 pipeline audit', {
          jobId: job.id,
          error: auditError instanceof Error ? auditError.message : String(auditError)
        });
      }
      await this.repository.updateJob(job.id, 'failed', { code: errorCode, message: errorMessage });
      const appError = new AppError(errorCode, errorMessage, 422);
      appError.pipeline = pipelineResult;
      throw appError;
    }

    const envelope = pipelineResult.envelope;
    const parsed = {
      raw: envelope,
      title: envelope.document.title,
      markdown: envelope.document.markdown,
      sections: envelope.document.sections.map(({ id, title: sectionTitle }) => ({ id, title: sectionTitle })),
      warnings: envelope.warnings,
      riskStatus: envelope.risk_status
    };
    const persisted = await this.repository.completeGeneration({
      job,
      parsed,
      workflowVersion: '4.3',
      runtimeMs: Date.now() - startedAt
    });
    return { job: { ...job, status: 'succeeded' }, ...persisted, envelope };
  }
}
