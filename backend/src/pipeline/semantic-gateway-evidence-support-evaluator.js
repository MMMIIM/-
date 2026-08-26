import { AppError } from '../errors.js';
import {
  EVIDENCE_SUPPORT_GATEWAY_CONTRACT_VERSION,
  EVIDENCE_SUPPORT_GATEWAY_INSTRUCTION,
  EVIDENCE_SUPPORT_GATEWAY_TASK_TYPE,
  createEvidenceSupportGatewayInput,
  serializeEvidenceSupportGatewayInput,
  validateEvidenceSupportGatewayResponse
} from './evidence-support-assessment-gateway-contract-v1.js';
import {
  SemanticGatewayError,
  createSemanticGatewayClientFromEnv
} from './semantic-gateway-client.js';
import {
  assembleEvidenceSupportAssessment,
  routeEvidenceSupport
} from './evidence-support-responsibility.js';

function auditFor(extra = {}) {
  return {
    provider: 'semantic_gateway',
    task_type: EVIDENCE_SUPPORT_GATEWAY_TASK_TYPE,
    ...extra
  };
}

function mapGatewayError(error) {
  if (error instanceof AppError) {
    return new SemanticGatewayError(
      error.code,
      error.message,
      auditFor({ technical_error_code: error.code }),
      error.status || 422
    );
  }
  if (!(error instanceof SemanticGatewayError)) {
    return new SemanticGatewayError(
      'PROVIDER_FAILURE',
      'Evidence Support Gateway provider 调用失败。',
      auditFor({ technical_error_code: error?.code || error?.name || 'UNKNOWN' }),
      502
    );
  }
  const technicalCode = error.code;
  const codeMap = {
    GATEWAY_HTTP_ERROR: 'GATEWAY_HTTP_FAILURE',
    GATEWAY_RESPONSE_PAYLOAD_MISSING: 'OUTPUT_MISSING',
    GATEWAY_INVALID_JSON: 'OUTPUT_NOT_JSON',
    GATEWAY_TRUNCATED_JSON: 'OUTPUT_NOT_JSON',
    GATEWAY_ENVELOPE_INVALID: 'ENVELOPE_INVALID',
    GATEWAY_TASK_TYPE_MISMATCH: 'ENVELOPE_INVALID',
    TASK_UNSUPPORTED: 'TASK_UNSUPPORTED',
    GATEWAY_NOT_CONFIGURED: 'ASSESSMENT_UNAVAILABLE',
    GATEWAY_NETWORK_ERROR: 'ASSESSMENT_UNAVAILABLE',
    GATEWAY_TIMEOUT: 'ASSESSMENT_UNAVAILABLE',
    PROVIDER_UNAVAILABLE: 'ASSESSMENT_UNAVAILABLE',
    PROVIDER_TIMEOUT: 'ASSESSMENT_UNAVAILABLE',
    PROVIDER_HTTP_FAILURE: 'ASSESSMENT_UNAVAILABLE',
    PROVIDER_OUTPUT_INVALID: 'ASSESSMENT_UNAVAILABLE',
    OUTPUT_SCHEMA_INVALID: 'ASSESSMENT_UNAVAILABLE',
    INTERNAL_GATEWAY_ERROR: 'ASSESSMENT_UNAVAILABLE'
  };
  const mappedCode = codeMap[technicalCode] || technicalCode;
  if (mappedCode === technicalCode) return error;
  return new SemanticGatewayError(
    mappedCode,
    mappedCode === 'ASSESSMENT_UNAVAILABLE'
      ? 'Evidence Support 评估服务当前不可用。'
      : 'Evidence Support Gateway 输出或请求契约无效。',
    {
      ...auditFor(),
      ...(error.audit || {}),
      technical_error_code: technicalCode
    },
    error.status || 502
  );
}

function sourceAdapterMap(adapters) {
  if (!Array.isArray(adapters) || adapters.length === 0 || adapters.some(adapter => (
    !adapter || adapter.adapter_version == null || !adapter.source || !adapter.source.source_id
  ))) {
    throw new SemanticGatewayError(
      'EVIDENCE_SUPPORT_ADAPTER_REQUIRED',
      'Evidence Support evaluator 必须使用官方 Source Adapter。',
      auditFor({ technical_error_code: 'EVIDENCE_SUPPORT_ADAPTER_REQUIRED' }),
      422
    );
  }
  return new Map(adapters.map(adapter => [adapter.source.source_id, adapter]));
}

function conflictObservationsForSource(conflicts, sourceId) {
  return conflicts.flatMap(conflict => conflict.sources
    .filter(source => source.source_id === sourceId)
    .map(source => ({
      conflict_group_id: conflict.conflict_group_id,
      dimension: conflict.dimension,
      observed_value: structuredClone(source.observed_value),
      source_id: source.source_id,
      source_span_id: source.source_span_id,
      support_excerpt: source.support_excerpt,
      reason_codes: conflict.reason_codes
    })));
}

export class SemanticGatewayEvidenceSupportEvaluator {
  constructor({ client, evaluatorVersion = EVIDENCE_SUPPORT_GATEWAY_CONTRACT_VERSION } = {}) {
    this.client = client;
    this.version = evaluatorVersion;
  }

  async assess({ requirement, adapters, sources } = {}) {
    if (!this.client || typeof this.client.run !== 'function') {
      throw new SemanticGatewayError(
        'ASSESSMENT_UNAVAILABLE',
        'Evidence Support 评估服务尚未配置。',
        auditFor({ technical_error_code: 'GATEWAY_NOT_CONFIGURED' }),
        503
      );
    }
    if (!Array.isArray(adapters) || adapters.length === 0) {
      throw new SemanticGatewayError(
        'EVIDENCE_SUPPORT_ADAPTER_REQUIRED',
        'Evidence Support evaluator 必须使用 Retrieval Candidate 或 approved Evidence Fact Adapter。',
        auditFor({ technical_error_code: 'EVIDENCE_SUPPORT_ADAPTER_REQUIRED' }),
        422
      );
    }
    let input;
    try {
      input = createEvidenceSupportGatewayInput({ requirement, adapters, sources });
    } catch (error) {
      throw mapGatewayError(error);
    }

    // Deterministic checks own objective exclusions and contradictions.  Only
    // unresolved semantic relationships are allowed to cross the provider
    // boundary; this keeps ranking and source eligibility from becoming an
    // implicit support decision.
    const routing = routeEvidenceSupport({
      requirement,
      adapters,
      evaluatorVersion: this.version
    });
    if (routing.decision === 'DETERMINISTIC_RESOLUTION') {
      return {
        assessments: routing.assessments,
        warnings: [],
        audit: auditFor({
          routing_version: routing.routing_version,
          routing_decision: routing.decision,
          routing_metrics: routing.metrics,
          llm_call_count: 0
        }),
        aggregate: routing.aggregate
      };
    }
    let gatewayResponse;
    try {
      gatewayResponse = await this.client.run({
        task_type: EVIDENCE_SUPPORT_GATEWAY_TASK_TYPE,
        task_instruction: EVIDENCE_SUPPORT_GATEWAY_INSTRUCTION,
        task_payload_json: serializeEvidenceSupportGatewayInput(input)
      });
    } catch (error) {
      throw mapGatewayError(error);
    }
    let validated;
    try {
      validated = validateEvidenceSupportGatewayResponse(gatewayResponse, input);
    } catch (error) {
      throw mapGatewayError(error);
    }
    const bySource = sourceAdapterMap(adapters || sources || []);
    try {
      const checksBySource = new Map(routing.checks.map(check => [check.source_id, check]));
      const assessments = validated.assessments.map(item => {
        const adapter = bySource.get(item.source_id);
        if (!adapter) {
          throw new SemanticGatewayError('SCHEMA_INVALID', 'Gateway 返回了未请求的 Source。', gatewayResponse.audit, 422);
        }
        return assembleEvidenceSupportAssessment({
          adapter,
          deterministicCheck: checksBySource.get(item.source_id),
          semanticObservation: {
            assessment_status: 'available',
            semantic_relevance: item.semantic_relevance,
            evidence_capability: item.evidence_capability,
            support_level: item.support_level,
            semantic_relationship: item.semantic_relationship,
            review_dimensions: item.review_dimensions,
            reason_codes: item.reason_codes,
            support_observations: item.support_observations,
            conflict_observations: conflictObservationsForSource(validated.conflict_observations, item.source_id)
          },
          evaluatorVersion: this.version
        });
      });
      return {
        assessments,
        warnings: validated.warnings,
        audit: {
          ...validated.audit,
          routing_version: routing.routing_version,
          routing_decision: routing.decision,
          routing_metrics: routing.metrics,
          llm_call_count: 1
        },
        aggregate: null
      };
    } catch (error) {
      throw mapGatewayError(error);
    }
  }

  async evaluate(input) {
    return this.assess(input);
  }
}

export function createSemanticGatewayEvidenceSupportEvaluatorFromEnv({
  env = process.env,
  fetchImpl = fetch,
  logger,
  timeoutMs
} = {}) {
  return new SemanticGatewayEvidenceSupportEvaluator({
    client: createSemanticGatewayClientFromEnv({
      env,
      fetchImpl,
      logger,
      timeoutMs,
      taskType: EVIDENCE_SUPPORT_GATEWAY_TASK_TYPE
    }),
    evaluatorVersion: EVIDENCE_SUPPORT_GATEWAY_CONTRACT_VERSION
  });
}

export function mapEvidenceSupportGatewayError(error) {
  return mapGatewayError(error);
}
