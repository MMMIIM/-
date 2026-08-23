import { SemanticGatewayError } from '../../src/pipeline/semantic-gateway-client.js';
import { classifierInput } from './live-calibration-set.js';

export const SUFFICIENCY_CLASSIFIER_VERSION = 'sufficiency-v1-candidate';
export const SUFFICIENCY_TASK_TYPE = 'sufficiency_assessment';
export const CLASSIFICATIONS = new Set(['DIRECT_SUPPORT', 'PARTIAL_SUPPORT', 'CONTEXT_ONLY', 'UNRELATED', 'CONTRADICTORY']);
export const REASON_CODES = new Set([
  'DIRECT_SOURCE_SUPPORT',
  'PARTIAL_SOURCE_SUPPORT',
  'CONTEXT_ONLY',
  'UNRELATED_SOURCE',
  'CONTRADICTORY_SOURCE',
  'MISSING_REQUIRED_DETAIL',
  'SCOPE_MISMATCH',
  'LIFECYCLE_NOT_CURRENT'
]);

export const SUFFICIENCY_TASK_INSTRUCTION = [
  '你是检索充分性观察器，只做候选证据的语义观察，不做最终路由决定。',
  '输入包含一个 query 和最终 Top5 candidates。',
  '只能依据候选安全摘录和元数据判断，不能创建事实、答案、Claim 或 Evidence。',
  '严格返回 JSON object，data 只能包含 candidate_assessments 和 conflict_groups。',
  'candidate_assessments 必须覆盖每个 candidate_id，字段为 candidate_id、classification、support_span、reason_code。',
  'classification 只能是 DIRECT_SUPPORT、PARTIAL_SUPPORT、CONTEXT_ONLY、UNRELATED、CONTRADICTORY。',
  'DIRECT_SUPPORT、PARTIAL_SUPPORT、CONTRADICTORY 必须提供来自对应 safe_excerpt 的完整 support_span；其余类型 support_span 必须为 null。',
  'reason_code 只能是 DIRECT_SOURCE_SUPPORT、PARTIAL_SOURCE_SUPPORT、CONTEXT_ONLY、UNRELATED_SOURCE、CONTRADICTORY_SOURCE、MISSING_REQUIRED_DETAIL、SCOPE_MISMATCH、LIFECYCLE_NOT_CURRENT。',
  '如果多个候选对同一个事实给出互相冲突的可验证摘录，conflict_groups 中记录 candidate_ids、fact_key、support_spans；不要选择哪一个为真。',
  '不得输出最终 retrieval_status，也不得输出候选之外的 candidate_id。'
].join('\n');

export function makeSufficiencyPayload(caseItem) {
  return classifierInput(caseItem);
}

function invalid(detail, audit = {}) {
  return new SemanticGatewayError('CLASSIFIER_OUTPUT_INVALID', `充分性分类器输出无效：${detail}`, {
    ...audit,
    error_code: 'CLASSIFIER_OUTPUT_INVALID'
  }, 422);
}

function assertPlainObject(value, label, audit) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw invalid(`${label} 必须是对象。`, audit);
}

function validateSupportSpan(item, candidate, audit) {
  const requiresSpan = ['DIRECT_SUPPORT', 'PARTIAL_SUPPORT', 'CONTRADICTORY'].includes(item.classification);
  if (requiresSpan) {
    if (typeof item.support_span !== 'string' || !item.support_span.trim()) throw invalid(`${item.candidate_id} 缺少 support_span。`, audit);
    if (!candidate.safe_excerpt.includes(item.support_span)) throw invalid(`${item.candidate_id} support_span 不在候选原文中。`, audit);
  } else if (item.support_span !== null) {
    throw invalid(`${item.candidate_id} 非支持类必须将 support_span 设为 null。`, audit);
  }
}

export function validateSufficiencyEnvelope(gatewayResponse, candidates) {
  const { envelope, audit } = gatewayResponse;
  if (envelope.status !== 'success') {
    throw new SemanticGatewayError('SUFFICIENCY_ASSESSMENT_FAILED', '充分性分类器未返回成功状态。', audit, 502);
  }
  assertPlainObject(envelope.data, 'data', audit);
  if (Object.keys(envelope.data).some((key) => !['candidate_assessments', 'conflict_groups'].includes(key))) {
    throw invalid('data 包含未声明字段。', audit);
  }
  if (!Array.isArray(envelope.data.candidate_assessments)) throw invalid('candidate_assessments 必须是数组。', audit);
  if (envelope.data.candidate_assessments.length !== candidates.length) throw invalid('candidate_assessments 未覆盖全部候选。', audit);

  const byId = new Map(candidates.map((candidate) => [candidate.candidate_id, candidate]));
  const seen = new Set();
  const assessments = envelope.data.candidate_assessments.map((item) => {
    assertPlainObject(item, 'candidate_assessments 项', audit);
    const allowed = new Set(['candidate_id', 'classification', 'support_span', 'reason_code']);
    if (Object.keys(item).some((key) => !allowed.has(key))) throw invalid('candidate_assessments 项包含未声明字段。', audit);
    if (typeof item.candidate_id !== 'string' || !byId.has(item.candidate_id) || seen.has(item.candidate_id)) throw invalid('candidate_id 不存在或重复。', audit);
    if (!CLASSIFICATIONS.has(item.classification)) throw invalid(`${item.candidate_id} classification 无效。`, audit);
    if (!REASON_CODES.has(item.reason_code)) throw invalid(`${item.candidate_id} reason_code 无效。`, audit);
    validateSupportSpan(item, byId.get(item.candidate_id), audit);
    seen.add(item.candidate_id);
    return {
      candidate_id: item.candidate_id,
      classification: item.classification,
      support_span: item.support_span,
      reason_code: item.reason_code
    };
  });

  const conflictGroups = envelope.data.conflict_groups === undefined ? [] : envelope.data.conflict_groups;
  if (!Array.isArray(conflictGroups)) throw invalid('conflict_groups 必须是数组。', audit);
  const normalizedConflicts = conflictGroups.map((group) => {
    assertPlainObject(group, 'conflict_groups 项', audit);
    if (!Array.isArray(group.candidate_ids) || group.candidate_ids.length < 2 || group.candidate_ids.some((id) => !byId.has(id))) {
      throw invalid('conflict_groups candidate_ids 无效。', audit);
    }
    if (typeof group.fact_key !== 'string' || !group.fact_key.trim()) throw invalid('conflict_groups fact_key 无效。', audit);
    if (!Array.isArray(group.support_spans)) throw invalid('conflict_groups support_spans 必须是数组。', audit);
    for (const span of group.support_spans) {
      assertPlainObject(span, 'conflict_groups support_spans 项', audit);
      if (!byId.has(span.candidate_id) || typeof span.support_span !== 'string' || !span.support_span.trim() || !byId.get(span.candidate_id).safe_excerpt.includes(span.support_span)) {
        throw invalid('conflict_groups support_span 不可验证。', audit);
      }
    }
    return { candidate_ids: [...new Set(group.candidate_ids)], fact_key: group.fact_key.trim(), support_spans: group.support_spans.map((span) => ({ candidate_id: span.candidate_id, support_span: span.support_span })) };
  });
  return { assessments, conflict_groups: normalizedConflicts, audit };
}

export function aggregateSufficiencyAssessment(result) {
  if (!result || !Array.isArray(result.assessments)) return 'SUFFICIENCY_ASSESSMENT_FAILED';
  if (result.conflict_groups.length > 0 || result.assessments.some((item) => item.classification === 'CONTRADICTORY')) return 'CONFLICTING_EVIDENCE';
  if (result.assessments.some((item) => item.classification === 'DIRECT_SUPPORT')) return 'EVIDENCE_REVIEW_READY';
  if (result.assessments.some((item) => item.classification === 'PARTIAL_SUPPORT')) return 'INSUFFICIENT_EVIDENCE';
  return 'NO_RELEVANT_EVIDENCE';
}

export async function assessSufficiencyCase(client, caseItem, { now = Date.now } = {}) {
  const started = now();
  try {
    const gatewayResponse = await client.run({
      task_type: SUFFICIENCY_TASK_TYPE,
      task_instruction: SUFFICIENCY_TASK_INSTRUCTION,
      task_payload_json: JSON.stringify(makeSufficiencyPayload(caseItem))
    });
    const validated = validateSufficiencyEnvelope(gatewayResponse, caseItem.candidates);
    return {
      ok: true,
      retrieval_status: aggregateSufficiencyAssessment(validated),
      assessments: validated.assessments,
      conflict_groups: validated.conflict_groups,
      elapsed_ms: Math.max(0, now() - started),
      audit: { provider: 'semantic_gateway', task_type: SUFFICIENCY_TASK_TYPE }
    };
  } catch (error) {
    return {
      ok: false,
      retrieval_status: 'SUFFICIENCY_ASSESSMENT_FAILED',
      error_code: error.code || 'SUFFICIENCY_ASSESSMENT_FAILED',
      elapsed_ms: Math.max(0, now() - started),
      audit: { provider: 'semantic_gateway', task_type: SUFFICIENCY_TASK_TYPE }
    };
  }
}

