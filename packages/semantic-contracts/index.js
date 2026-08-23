const object = value => value && typeof value === 'object' && !Array.isArray(value);

export const GATEWAY_INPUT_SCHEMA = Object.freeze({
  type: 'object',
  required: Object.freeze(['task_type', 'task_instruction', 'task_payload_json']),
  properties: Object.freeze({
    task_type: Object.freeze({ type: 'string' }),
    task_instruction: Object.freeze({ type: 'string' }),
    task_payload_json: Object.freeze({ type: 'string' })
  })
});

export const SEMANTIC_TASK_CONTRACTS = Object.freeze({
  requirement_extraction: Object.freeze({
    task_type: 'requirement_extraction',
    contract_version: '4.3-requirement-extraction',
    data_required: Object.freeze(['requirements']),
    data_allowed: Object.freeze(['requirements']),
    parser: 'semantic-gateway-envelope-v1'
  }),
  response_planning: Object.freeze({
    task_type: 'response_planning',
    contract_version: '4.3-response-planning',
    data_required: Object.freeze(['response_plans']),
    data_allowed: Object.freeze(['response_plans']),
    parser: 'semantic-gateway-envelope-v1'
  }),
  claim_generation: Object.freeze({
    task_type: 'claim_generation',
    contract_version: '4.3-claim-generation',
    data_required: Object.freeze(['claims']),
    data_allowed: Object.freeze(['claims']),
    parser: 'semantic-gateway-envelope-v1'
  }),
  section_drafting: Object.freeze({
    task_type: 'section_drafting',
    contract_version: '4.3-section-drafting',
    data_required: Object.freeze(['chapter_id', 'content_markdown']),
    data_allowed: Object.freeze(['chapter_id', 'content_markdown']),
    parser: 'semantic-gateway-envelope-v1'
  }),
  targeted_revision: Object.freeze({
    task_type: 'targeted_revision',
    contract_version: '4.3-targeted-revision',
    data_required: Object.freeze(['revised_text']),
    data_allowed: Object.freeze(['revised_text']),
    parser: 'semantic-gateway-envelope-v1'
  }),
  // Compatibility-only document generation path retained for existing callers.
  draft_sections: Object.freeze({
    task_type: 'draft_sections',
    contract_version: '4.3-gateway',
    data_required: Object.freeze(['sections']),
    data_allowed: Object.freeze(['sections']),
    parser: 'semantic-gateway-envelope-v1',
    compatibility_only: true
  }),
  evidence_support_assessment: Object.freeze({
    task_type: 'evidence_support_assessment',
    contract_version: '4.3-evidence-support-assessment-v1',
    data_required: Object.freeze(['assessments', 'conflict_observations']),
    data_allowed: Object.freeze(['assessments', 'conflict_observations']),
    parser: 'evidence-support-assessment-envelope-v1',
    strict_transport: true
  })
});

export const SEMANTIC_TASK_INSTRUCTIONS = Object.freeze({
  requirement_extraction: '仅提取候选需求及来源原文，不生成 REQ-ID、来源坐标或最终 mandatory 值。',
  response_planning: '仅基于已确认 Requirement 生成响应计划，不生成业务审批结论。',
  claim_generation: '仅基于 Requirement、Plan 与 approved Evidence 生成原子 Claim 候选。',
  section_drafting: '仅基于后端提供的已授权上下文生成章节候选正文。',
  targeted_revision: '仅修订后端指定的文本片段，不新增事实或承诺。',
  draft_sections: '仅根据后端提供的 canonical requirements 与章节计划生成章节草稿。',
  evidence_support_assessment: '仅观察 Requirement 与 Source 的语义支持关系，禁止创建 Evidence、Fact、Mapping、Claim 或最终业务状态。'
});

export const SEMANTIC_TASK_TYPES = Object.freeze(Object.keys(SEMANTIC_TASK_CONTRACTS));

export function getSemanticTaskContract(taskType) {
  return SEMANTIC_TASK_CONTRACTS[String(taskType || '')] || null;
}

export function resolveSemanticTaskInstruction(taskType) {
  return SEMANTIC_TASK_INSTRUCTIONS[String(taskType || '')] || null;
}

export function createGatewayEnvelope({ taskType, status = 'success', data, warnings = [] }) {
  const contract = getSemanticTaskContract(taskType);
  if (!contract) throw new Error(`Unsupported semantic task: ${taskType}`);
  return {
    schema_version: contract.contract_version,
    task_type: taskType,
    status,
    data,
    warnings
  };
}

function assertObject(value, label) {
  if (!object(value)) throw new Error(`${label} must be an object`);
}

function assertArray(value, label) {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
}

function assertText(value, label) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} must be non-empty text`);
}

function assertExactKeys(value, allowed, label) {
  const unknown = Object.keys(value).filter(key => !allowed.includes(key));
  if (unknown.length) throw new Error(`${label} contains unsupported fields`);
}

const relevance = new Set(['relevant', 'weakly_relevant', 'irrelevant', 'unknown']);
const capability = new Set(['capable', 'reference_only', 'not_capable', 'unknown']);
const support = new Set(['full_support', 'partial_support', 'conflict', 'insufficient', 'reference_only', 'unknown']);
const relationship = new Set(['direct', 'partial', 'related', 'conflict', 'unrelated', 'unknown']);
const dimensionValues = new Set(['match', 'mismatch', 'unknown']);
const dimensions = ['subject_match', 'scope_match', 'status_match', 'quantitative_match', 'entity_match', 'validity_match', 'source_authority', 'support_sufficiency'];

function validateEvidenceData(data, payload) {
  assertObject(data, 'data');
  assertExactKeys(data, ['assessments', 'conflict_observations'], 'data');
  assertArray(data.assessments, 'data.assessments');
  assertArray(data.conflict_observations, 'data.conflict_observations');
  const sources = Array.isArray(payload?.sources) ? payload.sources : [];
  const sourceById = new Map(sources.map(source => [source.source_id, source]));
  if (data.assessments.length !== sources.length) throw new Error('assessment count must equal source count');
  const seen = new Set();
  for (const [index, item] of data.assessments.entries()) {
    assertObject(item, `data.assessments[${index}]`);
    assertExactKeys(item, ['source_id', 'source_span_id', 'semantic_relevance', 'evidence_capability', 'support_level', 'semantic_relationship', 'review_dimensions', 'reason_codes', 'support_observations'], `data.assessments[${index}]`);
    const source = sourceById.get(item.source_id);
    if (!source || source.source_span_id !== item.source_span_id || seen.has(item.source_id)) throw new Error('assessment source lineage invalid');
    seen.add(item.source_id);
    if (!relevance.has(item.semantic_relevance) || !capability.has(item.evidence_capability) || !support.has(item.support_level) || !relationship.has(item.semantic_relationship)) throw new Error('assessment enum invalid');
    assertObject(item.review_dimensions, 'review_dimensions');
    if (Object.keys(item.review_dimensions).length !== dimensions.length || dimensions.some(name => !dimensionValues.has(item.review_dimensions[name]))) throw new Error('review_dimensions invalid');
    assertArray(item.reason_codes, 'reason_codes');
    assertArray(item.support_observations, 'support_observations');
    for (const [obsIndex, observation] of item.support_observations.entries()) {
      assertObject(observation, `support_observations[${obsIndex}]`);
      assertExactKeys(observation, ['source_id', 'source_span_id', 'support_excerpt', 'observation_type', 'reason_codes'], 'support_observation');
      if (observation.source_id !== item.source_id || observation.source_span_id !== item.source_span_id) throw new Error('support observation lineage invalid');
      assertText(observation.support_excerpt, 'support_excerpt');
      if (!String(source.source_text || '').includes(observation.support_excerpt)) throw new Error('support excerpt is not source-bound');
      if (!['direct_support', 'partial_support', 'context', 'contradiction'].includes(observation.observation_type)) throw new Error('observation_type invalid');
      assertArray(observation.reason_codes, 'observation.reason_codes');
    }
  }
  if (seen.size !== sources.length) throw new Error('assessments do not cover all sources');
  for (const [index, conflict] of data.conflict_observations.entries()) {
    assertObject(conflict, `data.conflict_observations[${index}]`);
    assertExactKeys(conflict, ['conflict_group_id', 'dimension', 'sources', 'reason_codes'], 'conflict_observation');
    assertText(conflict.conflict_group_id, 'conflict_group_id');
    assertText(conflict.dimension, 'conflict.dimension');
    assertArray(conflict.sources, 'conflict.sources');
    if (conflict.sources.length < 2) throw new Error('conflict requires two sources');
    assertArray(conflict.reason_codes, 'conflict.reason_codes');
    const values = new Set();
    for (const sourceObservation of conflict.sources) {
      assertObject(sourceObservation, 'conflict source');
      assertExactKeys(sourceObservation, ['source_id', 'source_span_id', 'observed_value', 'support_excerpt'], 'conflict source');
      const source = sourceById.get(sourceObservation.source_id);
      if (!source || source.source_span_id !== sourceObservation.source_span_id) throw new Error('conflict source lineage invalid');
      assertText(sourceObservation.support_excerpt, 'conflict support_excerpt');
      if (!String(source.source_text || '').includes(sourceObservation.support_excerpt)) throw new Error('conflict excerpt is not source-bound');
      values.add(JSON.stringify(sourceObservation.observed_value));
    }
    if (values.size < 2) throw new Error('conflict must contain different observations');
  }
  return data;
}

export function validateTaskData(taskType, data, payload = {}) {
  const contract = getSemanticTaskContract(taskType);
  if (!contract) throw new Error('TASK_UNSUPPORTED');
  assertObject(data, 'data');
  assertExactKeys(data, contract.data_allowed, 'data');
  for (const key of contract.data_required) {
    if (!Object.prototype.hasOwnProperty.call(data, key)) throw new Error(`missing data.${key}`);
  }
  if (taskType === 'evidence_support_assessment') return validateEvidenceData(data, payload);
  if (taskType === 'requirement_extraction' || taskType === 'response_planning' || taskType === 'claim_generation' || taskType === 'draft_sections') assertArray(data[contract.data_required[0]], `data.${contract.data_required[0]}`);
  if (taskType === 'section_drafting') {
    assertText(data.chapter_id, 'data.chapter_id');
    assertText(data.content_markdown, 'data.content_markdown');
  }
  if (taskType === 'targeted_revision') assertText(data.revised_text, 'data.revised_text');
  return data;
}
