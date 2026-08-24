import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import {
  adaptRetrievalCandidate,
  aggregateEvidenceSufficiency,
  createEvidenceSupportAssessment,
  ProviderNeutralEvidenceSupportEvaluator
} from '../../../src/pipeline/evidence-support-assessment-contract-v1.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = path.resolve(__dirname, '../../../..');
const CAPTURE_PATH = path.join(__dirname, 'GPT_REVIEW_PACKET_STAGE17_FINAL_LIVE_6.json');
const JSON_OUTPUT_PATH = path.join(__dirname, 'GPT_REVIEW_PACKET_EVIDENCE_SUFFICIENCY_OFFLINE.json');
const MARKDOWN_OUTPUT_PATH = path.join(__dirname, 'GPT_REVIEW_PACKET_EVIDENCE_SUFFICIENCY_OFFLINE.md');

export const OFFLINE_PACKET_SCHEMA_VERSION = 'stage20-evidence-sufficiency-offline-v1';
export const OFFLINE_EVALUATOR_VERSION = 'offline-fixture-evaluator-v1';
export const OFFLINE_CASE_IDS = Object.freeze([
  'V2R-001-PERF-DIRECT',
  'V2R-002-PERF-PARTIAL',
  'V2R-003-COMP-DIRECT',
  'V2R-004-COMP-PARTIAL',
  'V2R-005-ISO-DIRECT',
  'V2R-006-ISO-SCOPE'
]);

const sha256 = value => createHash('sha256').update(String(value)).digest('hex');
const REQUIRED = 'REQUIRED_DIMENSION';
const SUPPORTING = 'SUPPORTING_DIMENSION';
const NOT_APPLICABLE = 'NOT_APPLICABLE';
const UNRESOLVED = 'UNRESOLVED_REQUIRED_DIMENSION';

const allMatch = (overrides = {}) => ({
  subject_match: 'match',
  scope_match: 'match',
  status_match: 'match',
  quantitative_match: 'match',
  entity_match: 'match',
  validity_match: 'match',
  source_authority: 'match',
  support_sufficiency: 'match',
  ...overrides
});

const CASE_RULES = Object.freeze({
  'V2R-001-PERF-DIRECT': {
    selected_chunk_id: 'MCH-0FBD3599DAF932016F62EB9634B997AF',
    excerpt: '结果：平均 1.4 秒，P95 1.9 秒。',
    expected_status: 'EVIDENCE_REVIEW_READY',
    reason_codes: [],
    assessment_rationale: 'direct source-bound support',
    adverse_evidence: false,
    expected_dimensions: {
      subject_match: [REQUIRED, 'match'],
      entity_match: [REQUIRED, 'match'],
      scope_match: [REQUIRED, 'match'],
      status_match: [REQUIRED, 'match'],
      validity_match: [SUPPORTING, 'match'],
      quantitative_match: [REQUIRED, 'match']
    },
    unresolved_required_dimensions: []
  },
  'V2R-002-PERF-PARTIAL': {
    selected_chunk_id: 'MCH-0FBD3599DAF932016F62EB9634B997AF',
    excerpt: '结果：平均 1.4 秒，P95 1.9 秒。',
    expected_status: 'INSUFFICIENT_EVIDENCE',
    reason_codes: ['QUANTITATIVE_MISMATCH', 'SUPPORT_INSUFFICIENT'],
    adverse_evidence: true,
    expected_dimensions: {
      subject_match: [REQUIRED, 'match'],
      entity_match: [REQUIRED, 'match'],
      scope_match: [REQUIRED, 'match'],
      status_match: [SUPPORTING, 'match'],
      validity_match: [SUPPORTING, 'match'],
      quantitative_match: [REQUIRED, 'mismatch']
    },
    unresolved_required_dimensions: []
  },
  'V2R-003-COMP-DIRECT': {
    selected_chunk_id: 'MCH-7F11A857F9B5A05D9B22E30CD4F1BEE0',
    excerpt: 'x86_64 + Ubuntu 22.04 + PostgreSQL 14：tested',
    expected_status: 'EVIDENCE_REVIEW_READY',
    reason_codes: [],
    assessment_rationale: 'direct source-bound support',
    adverse_evidence: false,
    expected_dimensions: {
      subject_match: [REQUIRED, 'match'],
      entity_match: [REQUIRED, 'match'],
      scope_match: [REQUIRED, 'match'],
      status_match: [REQUIRED, 'match'],
      quantitative_match: [NOT_APPLICABLE, 'unknown'],
      validity_match: [SUPPORTING, 'unknown']
    },
    unresolved_required_dimensions: []
  },
  'V2R-004-COMP-PARTIAL': {
    selected_chunk_id: 'MCH-7F11A857F9B5A05D9B22E30CD4F1BEE0',
    excerpt: '国产数据库组合：unknown',
    expected_status: 'INSUFFICIENT_EVIDENCE',
    reason_codes: ['SUPPORT_INSUFFICIENT', 'STATUS_UNKNOWN'],
    adverse_evidence: false,
    expected_dimensions: {
      subject_match: [REQUIRED, 'match'],
      entity_match: [REQUIRED, 'unknown'],
      scope_match: [UNRESOLVED, 'unknown'],
      status_match: [UNRESOLVED, 'unknown'],
      quantitative_match: [UNRESOLVED, 'unknown'],
      validity_match: [SUPPORTING, 'unknown']
    },
    unresolved_required_dimensions: ['scope_match', 'status_match', 'quantitative_match']
  },
  'V2R-005-ISO-DIRECT': {
    selected_chunk_id: 'MCH-A4C2632EF9126FADD349C3004E1C2D84',
    excerpt: '名称：ISO/IEC 27001\n编号：CM-Q-27001-2024\n状态：active\n有效至：2027-11-30',
    expected_status: 'EVIDENCE_REVIEW_READY',
    reason_codes: [],
    assessment_rationale: 'direct source-bound support',
    adverse_evidence: false,
    expected_dimensions: {
      subject_match: [REQUIRED, 'match'],
      entity_match: [REQUIRED, 'match'],
      scope_match: [REQUIRED, 'match'],
      status_match: [REQUIRED, 'match'],
      validity_match: [REQUIRED, 'match'],
      quantitative_match: [NOT_APPLICABLE, 'unknown']
    },
    unresolved_required_dimensions: []
  },
  'V2R-006-ISO-SCOPE': {
    selected_chunk_id: 'MCH-A4C2632EF9126FADD349C3004E1C2D84',
    excerpt: '名称：ISO/IEC 27001\n编号：CM-Q-27001-2024\n状态：active\n有效至：2027-11-30',
    expected_status: 'INSUFFICIENT_EVIDENCE',
    reason_codes: ['SCOPE_MISMATCH', 'ENTITY_MISMATCH', 'SUPPORT_INSUFFICIENT'],
    adverse_evidence: false,
    expected_dimensions: {
      subject_match: [REQUIRED, 'mismatch'],
      entity_match: [REQUIRED, 'mismatch'],
      scope_match: [REQUIRED, 'mismatch'],
      status_match: [SUPPORTING, 'unknown'],
      validity_match: [SUPPORTING, 'unknown'],
      quantitative_match: [NOT_APPLICABLE, 'unknown']
    },
    unresolved_required_dimensions: []
  }
});

function requirementFor(caseItem) {
  return {
    requirement_id: caseItem.case_id,
    text: caseItem.requirement_exact_text
  };
}

function frozenInputs(caseItem) {
  return (caseItem.final_candidates || []).map(candidate => ({
    candidate_id: candidate.chunk_id,
    chunk_id: candidate.chunk_id,
    raw_rank: candidate.raw_rank,
    raw_similarity: candidate.raw_similarity,
    source_text: candidate.raw_source_text,
    source_text_hash: sha256(candidate.raw_source_text),
    chunk_role: candidate.chunk_role,
    source_eligibility: candidate.source_eligibility,
    substantive_class: candidate.substantive_class,
    requirement_relative_classification: candidate.requirement_relative_classification,
    lineage: {
      material_id: candidate.material_id,
      document_id: candidate.document_id,
      chunk_id: candidate.chunk_id
    }
  }));
}

function frozenRawPool(caseItem) {
  return (caseItem.raw_candidate_pool || []).map(candidate => ({
    candidate_id: candidate.chunk_id,
    raw_rank: candidate.raw_rank,
    raw_similarity: candidate.raw_similarity,
    source_text: candidate.raw_source_text,
    source_text_hash: sha256(candidate.raw_source_text),
    chunk_role: candidate.chunk_role,
    candidate_eligibility: candidate.candidate_eligibility,
    source_eligibility: candidate.source_eligibility,
    requirement_relative_classification: candidate.requirement_relative_classification,
    final_phase_rank: candidate.final_phase_rank,
    final_eligible: candidate.final_eligible,
    lineage: {
      material_id: candidate.material_id,
      document_id: candidate.document_id,
      chunk_id: candidate.chunk_id
    }
  }));
}

function selectCandidate(caseItem, rule) {
  const candidate = (caseItem.final_candidates || []).find(item => item.chunk_id === rule.selected_chunk_id);
  if (!candidate) throw new Error(`冻结案例缺少选择的来源：${caseItem.case_id}/${rule.selected_chunk_id}`);
  return candidate;
}

function adaptSource(caseItem, candidate) {
  const sourceText = candidate.raw_source_text;
  return adaptRetrievalCandidate({
    requirement: requirementFor(caseItem),
    candidate: {
      candidate_id: candidate.chunk_id,
      metadata: {
        raw_rank: candidate.raw_rank,
        chunk_role: candidate.chunk_role,
        requirement_relative_classification: candidate.requirement_relative_classification
      }
    },
    sourceSpan: {
      source_span_id: `OFFLINE-SPAN-${candidate.chunk_id}`,
      source_text: sourceText,
      source_text_hash: sha256(sourceText)
    },
    material: {
      material_id: candidate.material_id,
      document_id: candidate.document_id,
      source_eligibility: candidate.source_eligibility
    },
    lineage: {
      material_id: candidate.material_id,
      document_id: candidate.document_id,
      chunk_id: candidate.chunk_id,
      source_span_resolution: 'OFFLINE_FROZEN_CAPTURE'
    }
  });
}

function observationFor(caseId, sourceText, excerpt) {
  const common = {
    semantic_relevance: 'relevant',
    evidence_capability: 'capable',
    review_dimensions: allMatch(),
    support_observations: [{
      support_excerpt: excerpt,
      observation_type: 'direct_support',
      reason_codes: []
    }]
  };
  switch (caseId) {
    case 'V2R-001-PERF-DIRECT':
      return { ...common, support_level: 'full_support', semantic_relationship: 'direct' };
    case 'V2R-002-PERF-PARTIAL':
      return {
        ...common,
        support_level: 'insufficient',
        semantic_relationship: 'partial',
        review_dimensions: allMatch({ quantitative_match: 'mismatch' }),
        reason_codes: ['QUANTITATIVE_MISMATCH', 'SUPPORT_INSUFFICIENT'],
        support_observations: [{ support_excerpt: excerpt, observation_type: 'partial_support', reason_codes: ['QUANTITATIVE_MISMATCH'] }]
      };
    case 'V2R-003-COMP-DIRECT':
      return {
        ...common,
        support_level: 'full_support',
        semantic_relationship: 'direct',
        review_dimensions: allMatch({ quantitative_match: 'unknown', validity_match: 'unknown' })
      };
    case 'V2R-004-COMP-PARTIAL':
      return {
        ...common,
        support_level: 'partial_support',
        semantic_relationship: 'partial',
        review_dimensions: allMatch({
          entity_match: 'unknown',
          scope_match: 'unknown',
          status_match: 'unknown',
          quantitative_match: 'unknown',
          validity_match: 'unknown',
          support_sufficiency: 'mismatch'
        }),
        reason_codes: ['SUPPORT_INSUFFICIENT', 'STATUS_UNKNOWN'],
        support_observations: [{ support_excerpt: excerpt, observation_type: 'partial_support', reason_codes: ['SUPPORT_INSUFFICIENT', 'STATUS_UNKNOWN'] }]
      };
    case 'V2R-005-ISO-DIRECT':
      return {
        ...common,
        support_level: 'full_support',
        semantic_relationship: 'direct',
        review_dimensions: allMatch({ quantitative_match: 'unknown' })
      };
    case 'V2R-006-ISO-SCOPE':
      return {
        ...common,
        support_level: 'insufficient',
        semantic_relationship: 'partial',
        review_dimensions: allMatch({
          subject_match: 'mismatch',
          entity_match: 'mismatch',
          scope_match: 'mismatch',
          status_match: 'unknown',
          validity_match: 'unknown',
          quantitative_match: 'unknown',
          support_sufficiency: 'mismatch'
        }),
        reason_codes: ['SCOPE_MISMATCH', 'ENTITY_MISMATCH', 'SUPPORT_INSUFFICIENT'],
        support_observations: [{ support_excerpt: excerpt, observation_type: 'partial_support', reason_codes: ['SCOPE_MISMATCH', 'ENTITY_MISMATCH'] }]
      };
    default:
      throw new Error(`未定义离线案例：${caseId}`);
  }
}

function contextWindow(inputs, selectedId) {
  const index = inputs.findIndex(item => item.chunk_id === selectedId);
  return inputs.slice(Math.max(0, index - 1), Math.min(inputs.length, index + 2)).map(item => ({
    chunk_id: item.chunk_id,
    raw_rank: item.raw_rank,
    source_text: item.source_text,
    role: item.chunk_id === selectedId ? 'selected_source' : 'context_only'
  }));
}

function expectedDimensionMetrics(caseResults) {
  let required = 0;
  let correct = 0;
  let unresolvedRequired = 0;
  let unresolvedCorrect = 0;
  for (const item of caseResults) {
    const runtime = item.runtime_assessment.review_dimensions;
    for (const [dimension, detail] of Object.entries(item.expected.required_dimensions)) {
      const { classification, expected: expectedValue } = detail;
      if (classification === REQUIRED || classification === UNRESOLVED) {
        required += 1;
        if (runtime[dimension] === expectedValue) correct += 1;
      }
      if (classification === UNRESOLVED) {
        unresolvedRequired += 1;
        if (runtime[dimension] === 'unknown') unresolvedCorrect += 1;
      }
    }
  }
  return {
    required_dimension_accuracy: { correct, total: required, rate: required ? correct / required : 1 },
    unresolved_required_dimension_accuracy: {
      correct: unresolvedCorrect,
      total: unresolvedRequired,
      rate: unresolvedRequired ? unresolvedCorrect / unresolvedRequired : 1
    }
  };
}

function buildConflictControl() {
  const requirement = { requirement_id: 'CONTROL-CONFLICT', text: '系统平均响应时间应不超过1.4秒。' };
  const source = (id, text, value) => adaptRetrievalCandidate({
    requirement,
    candidate: { candidate_id: id },
    sourceSpan: { source_span_id: `SPAN-${id}`, source_text: text, source_text_hash: sha256(text) },
    material: { material_id: `MAT-${id}` },
    lineage: { chunk_id: id }
  });
  const firstText = '系统平均响应时间为1.4秒。';
  const secondText = '系统平均响应时间为2.1秒。';
  const firstInput = source('CONFLICT-A', firstText, '1.4秒');
  const secondInput = source('CONFLICT-B', secondText, '2.1秒');
  const make = (input, text, value) => createEvidenceSupportAssessment(input, {
    semantic_relevance: 'relevant',
    evidence_capability: 'capable',
    support_level: 'full_support',
    semantic_relationship: 'direct',
    review_dimensions: allMatch(),
    support_observations: [{ support_excerpt: text, observation_type: 'direct_support', reason_codes: [] }],
    conflict_observations: [{
      conflict_group_id: 'CONTROL-QUANTITY',
      dimension: 'quantitative_match',
      observed_value: value,
      support_excerpt: text,
      reason_codes: ['HUMAN_REVIEW_REQUIRED']
    }]
  }, { evaluatorVersion: OFFLINE_EVALUATOR_VERSION });
  const aggregate = aggregateEvidenceSufficiency([make(firstInput, firstText, '1.4秒'), make(secondInput, secondText, '2.1秒')]);
  return { control_id: 'CONFLICTING_EVIDENCE', result_status: aggregate.status, passed: aggregate.status === 'CONFLICTING_EVIDENCE', assessment_count: 2 };
}

function buildTechnicalControl(caseItem, candidate) {
  const input = adaptSource(caseItem, candidate);
  const assessment = new ProviderNeutralEvidenceSupportEvaluator().assess(input);
  return assessment.then(result => {
    const aggregate = aggregateEvidenceSufficiency([result]);
    return {
      control_id: 'TECHNICAL_FAILURE_SEPARATION',
      technical_status: result.assessment_status,
      result_status: aggregate.status,
      passed: result.assessment_status === 'unavailable' && aggregate.status === 'ASSESSMENT_UNAVAILABLE',
      must_not_be_business_insufficient: aggregate.status !== 'INSUFFICIENT_EVIDENCE'
    };
  });
}

function buildCaseResult(caseItem) {
  const rule = CASE_RULES[caseItem.case_id];
  const inputs = frozenInputs(caseItem);
  const selected = selectCandidate(caseItem, rule);
  const input = adaptSource(caseItem, selected);
  const observation = observationFor(caseItem.case_id, selected.raw_source_text, rule.excerpt);
  const assessment = createEvidenceSupportAssessment(input, observation, { evaluatorVersion: OFFLINE_EVALUATOR_VERSION });
  const aggregate = aggregateEvidenceSufficiency([assessment]);
  const excerptStart = selected.raw_source_text.indexOf(rule.excerpt);
  if (excerptStart < 0) throw new Error(`冻结案例支持片段不在来源原文中：${caseItem.case_id}`);
  const expectedDimensions = Object.fromEntries(Object.entries(rule.expected_dimensions).map(([key, [classification, value]]) => [key, { classification, expected: value }]));
  return {
    case_id: caseItem.case_id,
    requirement: {
      requirement_id: caseItem.case_id,
      text: caseItem.requirement_exact_text,
      exact: true
    },
    oracle_provenance: {
      runtime_assessment: 'AUTO_DRAFT',
      expected_assessment: 'GPT_REVIEWED',
      human_gold: 'NONE',
      promotion: 'NOT_PERMITTED'
    },
    frozen_evidence_inputs: inputs,
    frozen_raw_candidate_pool: frozenRawPool(caseItem),
    selected_evidence_ids: [selected.chunk_id],
    evidence_detail: [{
      source_id: selected.chunk_id,
      source_text: selected.raw_source_text,
      source_text_hash: sha256(selected.raw_source_text),
      exact_span: {
        span_id: `OFFLINE-SPAN-${selected.chunk_id}`,
        start_offset: excerptStart,
        end_offset: excerptStart + rule.excerpt.length,
        support_excerpt: rule.excerpt,
        support_excerpt_hash: sha256(rule.excerpt)
      },
      context_window: contextWindow(inputs, selected.chunk_id),
      lineage: {
        material_id: selected.material_id,
        document_id: selected.document_id,
        chunk_id: selected.chunk_id
      }
    }],
    runtime_assessment: assessment,
    runtime_aggregate: aggregate,
    expected: {
      status: rule.expected_status,
      reason_codes: rule.reason_codes,
      assessment_rationale: rule.assessment_rationale || null,
      required_dimensions: expectedDimensions,
      unresolved_required_dimensions: rule.unresolved_required_dimensions,
      adverse_evidence: rule.adverse_evidence,
      conflict_observations: [],
      technical_status: 'NOT_APPLICABLE'
    },
    technical_status: 'SUCCESS',
    side_effects: {
      evidence_support_assessment_persisted: false,
      evidence_review_created: false,
      evidence_created: false,
      evidence_fact_created: false,
      mapping_created: false,
      approval_changed: false,
      readiness_changed: false,
      claim_gate_triggered: false,
      writer_triggered: false
    }
  };
}

export async function runOfflineEvidenceSufficiency({ capturePath = CAPTURE_PATH } = {}) {
  const capture = JSON.parse(fs.readFileSync(capturePath, 'utf8'));
  const casesById = new Map((capture.cases || []).map(item => [item.case_id, item]));
  const missing = OFFLINE_CASE_IDS.filter(id => !casesById.has(id));
  if (missing.length) throw new Error(`冻结六案例缺失：${missing.join(', ')}`);
  const cases = OFFLINE_CASE_IDS.map(id => buildCaseResult(casesById.get(id)));
  const dimensionMetrics = expectedDimensionMetrics(cases);
  const businessStatusCorrect = cases.filter(item => item.runtime_aggregate.status === item.expected.status).length;
  const nonReadyCases = cases.filter(item => item.expected.status !== 'EVIDENCE_REVIEW_READY');
  const falseSupported = nonReadyCases.filter(item => item.runtime_aggregate.status === 'EVIDENCE_REVIEW_READY').length;
  const technicalControl = await buildTechnicalControl(casesById.get(OFFLINE_CASE_IDS[0]), selectCandidate(casesById.get(OFFLINE_CASE_IDS[0]), CASE_RULES[OFFLINE_CASE_IDS[0]]));
  const conflictControl = buildConflictControl();
  const adverseControl = {
    control_id: 'ADVERSE_QUANTITATIVE_EVIDENCE',
    case_id: 'V2R-002-PERF-PARTIAL',
    result_status: cases[1].runtime_aggregate.status,
    passed: cases[1].runtime_aggregate.status !== 'EVIDENCE_REVIEW_READY' && cases[1].runtime_assessment.review_dimensions.quantitative_match === 'mismatch'
  };
  const wrongScopeControl = {
    control_id: 'WRONG_SCOPE_BOUNDARY',
    case_id: 'V2R-006-ISO-SCOPE',
    result_status: cases[5].runtime_aggregate.status,
    passed: cases[5].runtime_aggregate.status !== 'EVIDENCE_REVIEW_READY' && cases[5].runtime_assessment.review_dimensions.scope_match === 'mismatch'
  };
  const packet = {
    schema_version: OFFLINE_PACKET_SCHEMA_VERSION,
    title: 'Stage20 Evidence Sufficiency Offline Validation Baseline',
    generated_at: '2026-08-24',
    dataset_classification: 'REPRESENTATIVE_SYNTHETIC / FROZEN_STAGE17_CAPTURE',
    evaluation_scope: 'EvidenceSupportAssessment only; not Retrieval Hit@K evaluation',
    source_capture: path.relative(BACKEND_ROOT, capturePath).replaceAll('\\', '/'),
    evaluator: {
      version: OFFLINE_EVALUATOR_VERSION,
      mode: 'deterministic fixture assessment over frozen evidence inputs',
      provider_neutral_behavior: 'ASSESSMENT_UNAVAILABLE; never capable/direct',
      no_model_calls: true
    },
    cases,
    negative_controls: [adverseControl, wrongScopeControl, conflictControl, technicalControl],
    metrics: {
      business_status_accuracy: { correct: businessStatusCorrect, total: cases.length, rate: businessStatusCorrect / cases.length },
      ...dimensionMetrics,
      adverse_evidence_recognition: { correct: adverseControl.passed ? 1 : 0, total: 1, rate: adverseControl.passed ? 1 : 0 },
      conflict_recognition: { correct: conflictControl.passed ? 1 : 0, total: 1, rate: conflictControl.passed ? 1 : 0 },
      technical_failure_separation: { correct: technicalControl.passed ? 1 : 0, total: 1, rate: technicalControl.passed ? 1 : 0 },
      false_supported_rate: { false_supported: falseSupported, denominator: nonReadyCases.length, rate: nonReadyCases.length ? falseSupported / nonReadyCases.length : 0 },
      unsafe_false_supported: falseSupported,
      baseline_created_on_failure: 0
    },
    formal_db_mutations: {
      evidence_support_assessment: 0,
      evidence_review: 0,
      evidence: 0,
      evidence_fact: 0,
      mapping: 0,
      claim: 0,
      writer: 0,
      readiness: 0
    },
    external_calls: { embedding: 0, llm: 0, dify: 0 },
    oracle_provenance: {
      runtime_assessment: 'AUTO_DRAFT',
      expected_assessment: 'GPT_REVIEWED',
      human_gold_cases: 0,
      auto_promotion: false
    },
    gpt_review_status: 'PENDING_REVIEW',
    eval_complete: false,
    stage_status: { stage17: 'PASS / FROZEN', stage20: 'PARTIAL / BLOCKED' }
  };
  return packet;
}

function markdown(packet) {
  const lines = [
    '# GPT Review Packet — Evidence Sufficiency Offline Baseline',
    '',
    `- Schema: \`${packet.schema_version}\``,
    `- Scope: ${packet.evaluation_scope}`,
    `- Frozen cases: ${packet.cases.length}`,
    '- External calls: Embedding 0 / LLM 0 / Dify 0',
    '- Formal DB mutations: all 0; this packet is side-effect free.',
    `- GPT_REVIEW_STATUS: **${packet.gpt_review_status}**`,
    `- EVAL_COMPLETE: **${packet.eval_complete ? 'YES' : 'NO'}**`,
    '',
    '## Metrics',
    '',
    '```json',
    JSON.stringify(packet.metrics, null, 2),
    '```',
    '',
    '## Case-level evidence',
    ''
  ];
  for (const item of packet.cases) {
    lines.push(`### ${item.case_id}`);
    lines.push('');
    lines.push(`Requirement: ${item.requirement.text}`);
    lines.push(`Runtime status: **${item.runtime_aggregate.status}**; expected: **${item.expected.status}**`);
    lines.push(`Oracle: runtime=${item.oracle_provenance.runtime_assessment}, expected=${item.oracle_provenance.expected_assessment}, human_gold=${item.oracle_provenance.human_gold}`);
    lines.push(`Selected source: ${item.selected_evidence_ids.join(', ')}`);
    lines.push(`Frozen evidence inputs (${item.frozen_evidence_inputs.length}):`);
    for (const input of item.frozen_evidence_inputs) {
      lines.push(`- ${input.chunk_id} [rank ${input.raw_rank}] ${input.source_text.replaceAll('\n', ' / ')}`);
    }
    lines.push(`Source text: ${item.evidence_detail[0].source_text.replaceAll('\n', ' / ')}`);
    lines.push(`Exact support span: ${item.evidence_detail[0].exact_span.support_excerpt.replaceAll('\n', ' / ')}`);
    lines.push(`Context window: ${item.evidence_detail[0].context_window.map(entry => `${entry.role}:${entry.chunk_id}`).join(', ')}`);
    lines.push(`Required dimensions: ${Object.entries(item.expected.required_dimensions).map(([key, value]) => `${key}=${value.classification}/${value.expected}`).join('; ')}`);
    lines.push(`Runtime dimensions: ${JSON.stringify(item.runtime_assessment.review_dimensions)}`);
    lines.push(`Reason codes: ${item.expected.reason_codes.join(', ') || 'none'}`);
    lines.push(`Assessment rationale: ${item.expected.assessment_rationale || 'none'}`);
    lines.push(`Unresolved required dimensions: ${item.expected.unresolved_required_dimensions.join(', ') || 'none'}`);
    lines.push(`Adverse evidence: ${item.expected.adverse_evidence ? 'YES' : 'NO'}`);
    lines.push('');
  }
  lines.push('## Negative controls', '', '```json', JSON.stringify(packet.negative_controls, null, 2), '```', '');
  lines.push('## Safety boundary', '', 'Raw Retrieval Candidate remains a transient source-bound input. No Evidence, Evidence Fact, Mapping, Claim, approval, Readiness or Writer state is created or changed.', '');
  lines.push('## Review state', '', 'This is an offline deterministic baseline over frozen synthetic evidence. It is not a model-quality or Retrieval Hit@K result. Independent GPT review and any Human Gold decision remain pending.', '');
  return `${lines.join('\n').replace(/\n+$/, '')}\n`;
}

export async function writeOfflinePacket() {
  const packet = await runOfflineEvidenceSufficiency();
  fs.writeFileSync(JSON_OUTPUT_PATH, `${JSON.stringify(packet, null, 2)}\n`);
  fs.writeFileSync(MARKDOWN_OUTPUT_PATH, markdown(packet));
  return packet;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const packet = await writeOfflinePacket();
  const summary = {
    cases: packet.cases.length,
    business_status_accuracy: packet.metrics.business_status_accuracy,
    required_dimension_accuracy: packet.metrics.required_dimension_accuracy,
    unresolved_required_dimension_accuracy: packet.metrics.unresolved_required_dimension_accuracy,
    adverse_evidence_recognition: packet.metrics.adverse_evidence_recognition,
    conflict_recognition: packet.metrics.conflict_recognition,
    technical_failure_separation: packet.metrics.technical_failure_separation,
    unsafe_false_supported: packet.metrics.unsafe_false_supported,
    gpt_review_status: packet.gpt_review_status,
    eval_complete: packet.eval_complete
  };
  console.log(JSON.stringify(summary, null, 2));
}
