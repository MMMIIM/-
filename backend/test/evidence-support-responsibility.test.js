import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  adaptRetrievalCandidate,
  aggregateEvidenceSufficiency
} from '../src/pipeline/evidence-support-assessment-contract-v1.js';
import {
  EVIDENCE_SUPPORT_GATEWAY_CONTRACT_VERSION,
  EVIDENCE_SUPPORT_GATEWAY_TASK_TYPE
} from '../src/pipeline/evidence-support-assessment-gateway-contract-v1.js';
import { SemanticGatewayError } from '../src/pipeline/semantic-gateway-client.js';
import {
  EVIDENCE_SUPPORT_FIELD_OWNERS,
  assembleEvidenceSupportAssessment,
  routeEvidenceSupport,
  runDeterministicEvidenceChecks
} from '../src/pipeline/evidence-support-responsibility.js';
import {
  SEMANTIC_ADJUDICATION_PROMPT_VERSION,
  buildSemanticAdjudicationPrompt
} from '../src/pipeline/semantic-adjudication-prompt.js';
import { SemanticGatewayEvidenceSupportEvaluator } from '../src/pipeline/semantic-gateway-evidence-support-evaluator.js';

const sha = value => createHash('sha256').update(String(value)).digest('hex');
const requirement = { requirement_id: 'REQ-RESP-001', text: '系统平均响应时间应不超过1.4秒。' };
const dimensions = (overrides = {}) => Object.fromEntries([
  'subject_match', 'scope_match', 'status_match', 'quantitative_match',
  'entity_match', 'validity_match', 'source_authority', 'support_sufficiency'
].map(name => [name, overrides[name] || 'match']));

function adapter(id, sourceText, metadata = {}) {
  return adaptRetrievalCandidate({
    requirement,
    candidate: {
      candidate_id: id,
      metadata: { retrieval_score: 0.99, ...metadata }
    },
    sourceSpan: {
      source_span_id: `SPAN-${id}`,
      source_text: sourceText,
      source_text_hash: sha(sourceText)
    },
    material: {
      material_id: `MAT-${id}`,
      material_type: 'technical_whitepaper',
      content_role: 'performance_test'
    },
    lineage: { project_id: 'PROJECT-RESP', retrieval_run_id: 'RUN-RESP', chunk_id: `CHUNK-${id}` }
  });
}

function gatewayAssessment(source, overrides = {}) {
  return {
    source_id: source.source.source_id,
    source_span_id: source.source.source_span_id,
    semantic_relevance: 'relevant',
    evidence_capability: 'capable',
    support_level: 'full_support',
    semantic_relationship: 'direct',
    review_dimensions: dimensions(),
    reason_codes: [],
    support_observations: [],
    ...overrides
  };
}

function gatewayClientFor(response, { error } = {}) {
  return {
    calls: 0,
    async run() {
      this.calls += 1;
      if (error) throw error;
      return response;
    }
  };
}

function gatewayResponse(adapters, overrides = {}) {
  return {
    envelope: {
      schema_version: EVIDENCE_SUPPORT_GATEWAY_CONTRACT_VERSION,
      task_type: EVIDENCE_SUPPORT_GATEWAY_TASK_TYPE,
      status: 'success',
      data: {
        assessments: adapters.map(source => gatewayAssessment(source)),
        conflict_observations: []
      },
      warnings: [],
      ...overrides
    },
    audit: { provider: 'test', task_type: EVIDENCE_SUPPORT_GATEWAY_TASK_TYPE }
  };
}

test('high rerank similarity does not imply support', () => {
  const source = adapter('CAND-HIGH-RANK', '资料介绍了系统总体建设方向。');
  const routed = routeEvidenceSupport({ requirement, adapters: [source] });
  assert.equal(routed.metrics.total_candidates, 1);
  assert.equal(routed.decision, 'NEEDS_SEMANTIC_ADJUDICATION');
  assert.equal(routed.assessments.length, 0);
  assert.notEqual(routed.aggregate?.status, 'EVIDENCE_REVIEW_READY');
});

test('deterministic source exclusion resolves without an LLM call', async () => {
  const source = adapter('CAND-SYSTEM', '系统派生状态：仅用于运行审计。', { source_origin: 'system_derived' });
  const client = gatewayClientFor(gatewayResponse([source]));
  const result = await new SemanticGatewayEvidenceSupportEvaluator({ client }).assess({ requirement, adapters: [source] });
  assert.equal(client.calls, 0);
  assert.equal(result.audit.llm_call_count, 0);
  assert.equal(aggregateEvidenceSufficiency(result.assessments).status, 'NO_RELEVANT_EVIDENCE');
});

test('explicit deterministic mismatch resolves without an LLM call', async () => {
  const source = adapter('CAND-MISMATCH', '系统平均响应时间为2.1秒。', {
    deterministic_dimensions: { quantitative_match: 'mismatch' }
  });
  const client = gatewayClientFor(gatewayResponse([source]));
  const result = await new SemanticGatewayEvidenceSupportEvaluator({ client }).assess({ requirement, adapters: [source] });
  assert.equal(client.calls, 0);
  assert.equal(result.assessments[0].review_dimensions.quantitative_match, 'mismatch');
  assert.equal(aggregateEvidenceSufficiency(result.assessments).status, 'CONFLICTING_EVIDENCE');
});

test('ambiguous relationship is the only path that permits one semantic call', async () => {
  const source = adapter('CAND-AMBIGUOUS', '系统平均响应时间约为1.4秒，测试条件另见项目记录。');
  const routed = routeEvidenceSupport({ requirement, adapters: [source] });
  assert.equal(routed.decision, 'NEEDS_SEMANTIC_ADJUDICATION');
  const client = gatewayClientFor(gatewayResponse([source]));
  const result = await new SemanticGatewayEvidenceSupportEvaluator({ client }).assess({ requirement, adapters: [source] });
  assert.equal(client.calls, 1);
  assert.equal(result.audit.routing_metrics.semantic_adjudication_required, 1);
  assert.equal(result.audit.llm_call_count, 1);
});

test('deterministic owner cannot be overwritten by semantic output', () => {
  const source = adapter('CAND-OWNER', '系统平均响应时间为2.1秒。', {
    deterministic_dimensions: { quantitative_match: 'mismatch' }
  });
  const check = runDeterministicEvidenceChecks({ requirement, adapter: source });
  const assessment = assembleEvidenceSupportAssessment({
    adapter: source,
    deterministicCheck: check,
    semanticObservation: gatewayAssessment(source)
  });
  assert.equal(assessment.review_dimensions.quantitative_match, 'mismatch');
  assert.equal(assessment.support_level, 'conflict');
  assert.equal(assessment.semantic_relationship, 'conflict');
});

test('semantic assessment remains transient and cannot create formal lifecycle state', async () => {
  const source = adapter('CAND-TRANSIENT', '系统平均响应时间约为1.4秒。');
  const client = gatewayClientFor(gatewayResponse([source]));
  const result = await new SemanticGatewayEvidenceSupportEvaluator({ client }).assess({ requirement, adapters: [source] });
  const assessment = result.assessments[0];
  assert.equal(Object.hasOwn(assessment, 'fact_id'), false);
  assert.equal(Object.hasOwn(assessment, 'mapping_id'), false);
  assert.equal(Object.hasOwn(assessment, 'claim_id'), false);
  assert.equal(Object.hasOwn(assessment, 'approval_status'), false);
});

test('technical failure remains ASSESSMENT_UNAVAILABLE', async () => {
  const source = adapter('CAND-TECHNICAL', '系统平均响应时间约为1.4秒。');
  const client = gatewayClientFor(null, { error: new SemanticGatewayError('PROVIDER_TIMEOUT', 'safe', {}, 504) });
  await assert.rejects(
    () => new SemanticGatewayEvidenceSupportEvaluator({ client }).assess({ requirement, adapters: [source] }),
    error => error.code === 'ASSESSMENT_UNAVAILABLE' && error.audit.technical_error_code === 'PROVIDER_TIMEOUT'
  );
});

test('field owner matrix identifies a single canonical owner per field', () => {
  assert.equal(EVIDENCE_SUPPORT_FIELD_OWNERS.source_eligibility.owner, 'DETERMINISTIC_RULE_LAYER');
  assert.equal(EVIDENCE_SUPPORT_FIELD_OWNERS.approved_evidence_fact.owner, 'EVIDENCE_REVIEW_HUMAN_LIFECYCLE');
  assert.equal(EVIDENCE_SUPPORT_FIELD_OWNERS.requirement_evidence_mapping.owner, 'CANONICAL_MAPPING_SERVICE');
  assert.equal(EVIDENCE_SUPPORT_FIELD_OWNERS.safe_claim.owner, 'CLAIM_GATE');
});

test('adjudication prompt is narrow and leaves deterministic ownership outside the model', () => {
  const prompt = buildSemanticAdjudicationPrompt({
    requirement,
    candidateEvidence: { source_text: '系统平均响应时间约为1.4秒。' },
    deterministicFindings: { quantitative_match: 'unknown' },
    unresolvedQuestion: '该材料是否足以证明当前要求的企业实施能力？'
  });
  assert.match(prompt, new RegExp(SEMANTIC_ADJUDICATION_PROMPT_VERSION));
  assert.match(prompt, /semantic_relationship/);
  assert.match(prompt, /support_observations/);
  assert.match(prompt, /不得重新计算或覆盖/);
  assert.match(prompt, /不创建事实、映射、Claim 或审批状态/);
});
