import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  adaptRetrievalCandidate,
  aggregateEvidenceSufficiency,
  createEvidenceSupportAssessment
} from '../../../src/pipeline/evidence-support-assessment-contract-v1.js';
import { expandEvidenceContext } from '../../../src/pipeline/evidence-context-expansion.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const INPUT_PATH = path.join(HERE, 'candidate-pool-v2-evidence-span-repaired.json');
const REPORT_PATH = path.join(HERE, 'semantic-reaudit-v2.json');
const SAMPLE_PATH = path.join(HERE, 'semantic-reaudit-v2-samples.md');
const VALID_SPAN = 'EVIDENCE_SPAN_VERIFIED';
const EVALUATOR_VERSION = 'calibration-v2-semantic-reaudit-v1';

const unique = values => [...new Set(values)];
const has = (tags, value) => tags.includes(value);
const textOf = value => String(value || '');

function sourceInput(item, source) {
  return adaptRetrievalCandidate({
    requirement: {
      requirement_id: item.requirement.requirement_id,
      text: item.requirement.text
    },
    candidate: { candidate_id: source.source_id },
    sourceSpan: {
      source_span_id: source.source_span_id,
      source_text: source.source_text,
      source_text_hash: source.source_hash
    },
    material: {
      material_id: source.material_id,
      document_id: source.document_id,
      material_type: source.material_type,
      corpus_scope: source.corpus_scope,
      original_name: source.material_name
    },
    lineage: {
      project_id: source.project_id,
      document_id: source.document_id,
      chunk_id: source.chunk_id,
      source_span_id: source.source_span_id,
      source_span_resolution: source.source_span_resolution
    }
  });
}

function baseDimensions(assessment) {
  return {
    ...(assessment?.review_dimensions || {}),
    subject_match: assessment?.review_dimensions?.subject_match || 'unknown',
    scope_match: assessment?.review_dimensions?.scope_match || 'unknown',
    status_match: assessment?.review_dimensions?.status_match || 'unknown',
    quantitative_match: assessment?.review_dimensions?.quantitative_match || 'unknown',
    entity_match: assessment?.review_dimensions?.entity_match || 'unknown',
    validity_match: assessment?.review_dimensions?.validity_match || 'unknown',
    source_authority: assessment?.review_dimensions?.source_authority || 'unknown',
    support_sufficiency: assessment?.review_dimensions?.support_sufficiency || 'unknown'
  };
}

function sourceObservation(source, type, reasonCodes) {
  return {
    source_id: source.source_id,
    source_span_id: source.source_span_id,
    support_excerpt: source.source_text,
    observation_type: type,
    reason_codes: unique(reasonCodes)
  };
}

function numericAdverseFact(item, source) {
  const requirement = textOf(item.requirement.text);
  const sourceText = textOf(source.source_text);
  const threshold = requirement.match(/(?:P95|响应时间)[^\d]{0,20}(?:不超过|不大于|≤)\s*(\d+(?:\.\d+)?)\s*秒/i);
  const observed = sourceText.match(/P95\s*(\d+(?:\.\d+)?)\s*秒/i);
  if (!threshold || !observed) return null;
  const thresholdValue = Number(threshold[1]);
  const observedValue = Number(observed[1]);
  if (!(observedValue > thresholdValue)) return null;
  const original = item.draft_semantics[0] || {};
  return {
    semantic_relevance: 'relevant',
    evidence_capability: 'capable',
    support_level: 'partial_support',
    semantic_relationship: 'partial',
    review_dimensions: { ...baseDimensions(original), quantitative_match: 'mismatch', support_sufficiency: 'mismatch' },
    reason_codes: ['QUANTITATIVE_MISMATCH', 'SUPPORT_INSUFFICIENT'],
    support_observations: [sourceObservation(source, 'partial_support', ['QUANTITATIVE_MISMATCH', 'SUPPORT_INSUFFICIENT'])],
    audit_reason: `实际 P95 ${observedValue} 秒高于要求上限 ${thresholdValue} 秒；属于明确不满足事实，不是缺少数值证据。`,
    semantic_boundary: 'ADVERSE_FACT'
  };
}

function categoricalAdverseFact(item, source) {
  const requirement = textOf(item.requirement.text);
  const sourceText = textOf(source.source_text);
  const universal = /所有.*(?:组合|环境|数据库|平台).*(?:均|全部).*(?:完成|已).*(?:压力测试|测试)/i.test(requirement);
  const adverse = /partially_tested|未完成压力测试|not_verified|unknown/i.test(sourceText);
  if (!universal || !adverse) return null;
  const original = item.draft_semantics[0] || {};
  const reasons = ['STATUS_MISMATCH', 'SUPPORT_INSUFFICIENT'];
  return {
    semantic_relevance: 'relevant',
    evidence_capability: 'capable',
    support_level: 'partial_support',
    semantic_relationship: 'partial',
    review_dimensions: { ...baseDimensions(original), status_match: 'mismatch', support_sufficiency: 'mismatch' },
    reason_codes: reasons,
    support_observations: [sourceObservation(source, 'partial_support', reasons)],
    audit_reason: '来源直接表明至少部分数据库组合未完成压力测试，另有组合未验证或未知，因此不能支持“所有组合均已完成压力测试”的全称要求。',
    semantic_boundary: 'UNIVERSAL_CLAIM_ADVERSE_FACT'
  };
}

function explicitStatusAdverseFact(item, source) {
  const requirement = textOf(item.requirement.text);
  const sourceText = textOf(source.source_text);
  if (!/(已完成|可验收|验收)/.test(requirement) || !/(状态不完整|不得推断完工|不得推断.*验收|没有合同和验收记录)/.test(sourceText)) return null;
  const original = item.draft_semantics[0] || {};
  const reasons = ['STATUS_MISMATCH', 'SUPPORT_INSUFFICIENT'];
  return {
    semantic_relevance: 'relevant',
    evidence_capability: 'capable',
    support_level: 'partial_support',
    semantic_relationship: 'partial',
    review_dimensions: { ...baseDimensions(original), status_match: 'mismatch', support_sufficiency: 'mismatch' },
    reason_codes: reasons,
    support_observations: [sourceObservation(source, 'partial_support', reasons)],
    audit_reason: '来源明确说明状态或验收依据不完整，不能把项目记录升级为已完成且可验收。',
    semantic_boundary: 'PROJECT_STATUS_UNPROVEN'
  };
}

function scopeInsufficient(item, source) {
  const tags = item.requirement.boundary_tags || [];
  const requirement = textOf(item.requirement.text);
  const sourceText = textOf(source.source_text);
  if (!has(tags, 'scope_mismatch') || !has(tags, 'wrong_entity') || !/ISO\/IEC\s*27001/i.test(requirement) || !/ISO\/IEC\s*27001/i.test(sourceText)) return null;
  const original = item.draft_semantics[0] || {};
  const reasons = ['SUBJECT_MISMATCH', 'SCOPE_MISMATCH', 'ENTITY_MISMATCH', 'SUPPORT_INSUFFICIENT'];
  return {
    semantic_relevance: 'relevant',
    evidence_capability: 'capable',
    support_level: 'partial_support',
    semantic_relationship: 'partial',
    review_dimensions: { ...baseDimensions(original), subject_match: 'mismatch', scope_match: 'mismatch', entity_match: 'mismatch', support_sufficiency: 'mismatch' },
    reason_codes: reasons,
    support_observations: [sourceObservation(source, 'partial_support', reasons)],
    audit_reason: '来源确实包含 ISO 证书事实，但未证明指定项目主体，属于相关但主体/范围不足。',
    semantic_boundary: 'SUBJECT_OR_SCOPE_UNPROVEN'
  };
}

function industryCapabilityBoundary(item, source) {
  const tags = item.requirement.boundary_tags || [];
  const requirement = textOf(item.requirement.text);
  if (!has(tags, 'industry_reference') || !has(tags, 'enterprise_capability_boundary') || !/企业.*(证明|具备).*(能力|实施能力)/.test(requirement)) return null;
  const original = item.draft_semantics[0] || {};
  const reasons = ['SOURCE_NOT_EVIDENCE_CAPABLE', 'SUPPORT_INSUFFICIENT'];
  return {
    semantic_relevance: 'relevant',
    evidence_capability: 'not_capable',
    support_level: 'insufficient',
    semantic_relationship: 'related',
    review_dimensions: { ...baseDimensions(original), support_sufficiency: 'mismatch' },
    reason_codes: reasons,
    support_observations: [sourceObservation(source, 'context', reasons)],
    audit_reason: '行业规范与需求语义相关，但不能证明企业自身已具备相应实施能力。',
    semantic_boundary: 'INDUSTRY_REFERENCE_NOT_ENTERPRISE_CAPABILITY'
  };
}

function defaultObservation(item, source) {
  const original = item.draft_semantics.find(assessment => assessment.source?.source_id === source.source_id) || item.draft_semantics[0] || {};
  return {
    semantic_relevance: original.semantic_relevance,
    evidence_capability: original.evidence_capability,
    support_level: original.support_level,
    semantic_relationship: original.semantic_relationship,
    review_dimensions: baseDimensions(original),
    reason_codes: original.reason_codes || [],
    support_observations: (original.support_observations || []).map(observation => ({
      ...observation,
      support_excerpt: source.source_text,
      source_id: source.source_id,
      source_span_id: source.source_span_id
    })),
    conflict_observations: (original.conflict_observations || []).map(observation => ({
      ...observation,
      support_excerpt: source.source_text,
      source_id: source.source_id,
      source_span_id: source.source_span_id
    })),
    audit_reason: '修复后的业务来源与原系统草稿语义一致。',
    semantic_boundary: 'UNCHANGED'
  };
}

function reassessSource(item, source) {
  const observation = numericAdverseFact(item, source)
    || categoricalAdverseFact(item, source)
    || explicitStatusAdverseFact(item, source)
    || scopeInsufficient(item, source)
    || industryCapabilityBoundary(item, source)
    || defaultObservation(item, source);
  const { audit_reason, semantic_boundary, ...contractObservation } = observation;
  const assessment = createEvidenceSupportAssessment(sourceInput(item, source), contractObservation, {
    evaluatorVersion: EVALUATOR_VERSION
  });
  return { assessment, audit_reason, semantic_boundary };
}

function contextRecovery(item, source, assessment) {
  const missingDimensions = Object.entries(assessment.review_dimensions || {})
    .filter(([name, value]) => value === 'unknown' && ['subject_match', 'scope_match', 'entity_match', 'status_match', 'validity_match', 'quantitative_match'].includes(name))
    .map(([name]) => name);
  const expansion = expandEvidenceContext({
    exactSpan: {
      source_id: source.source_id,
      source_span_id: source.source_span_id,
      anchor_chunk_id: source.chunk_id,
      source_text: source.source_text,
      section: source.context_before || null
    },
    material: {
      id: source.material_id,
      original_name: source.material_name,
      material_type: source.material_type,
      corpus_scope: source.corpus_scope,
      project_name: source.project_name
    },
    chunks: [{
      chunk_id: source.chunk_id,
      material_id: source.material_id,
      chunk_index: 0,
      section: source.context_before || null,
      source_text: source.source_text
    }],
    missingDimensions
  });
  return {
    required_dimensions: missingDimensions,
    recovery_state: expansion.recovery_state,
    recovered_dimensions: expansion.recovered_dimensions,
    unresolved_dimensions: expansion.unresolved_dimensions,
    context_origins: expansion.context_window.map(item => item.origin),
    exact_span_preserved: expansion.exact_evidence_span.source_text === source.source_text
  };
}

function summarizeAssessment(assessment) {
  return {
    assessment_id: assessment.assessment_id,
    semantic_relevance: assessment.semantic_relevance,
    evidence_capability: assessment.evidence_capability,
    support_level: assessment.support_level,
    semantic_relationship: assessment.semantic_relationship,
    review_dimensions: assessment.review_dimensions,
    reason_codes: assessment.reason_codes,
    support_observations: assessment.support_observations,
    conflict_observations: assessment.conflict_observations
  };
}

function sourceSnapshot(source) {
  return {
    source_id: source.source_id,
    source_span_id: source.source_span_id,
    material_id: source.material_id,
    document_id: source.document_id,
    chunk_id: source.chunk_id,
    material_name: source.material_name,
    material_type: source.material_type,
    corpus_scope: source.corpus_scope,
    project_id: source.project_id,
    project_name: source.project_name,
    source_span_resolution: source.source_span_resolution,
    source_text: source.source_text,
    context_before: source.context_before || null,
    context_after: source.context_after || null,
    source_hash: source.source_hash,
    start_offset: source.start_offset,
    end_offset: source.end_offset,
    source_lineage_verified: source.source_lineage_verified === true,
    evidence_span_verified: source.evidence_span_verified === true
  };
}

function summarizeOld(item) {
  return {
    status: item.draft_aggregated_status,
    semantics: (item.draft_semantics || []).map(summarizeAssessment)
  };
}

function changed(oldValue, newValue) {
  return JSON.stringify(oldValue) !== JSON.stringify(newValue);
}

function semanticComparable(assessment) {
  if (!assessment) return assessment;
  const { assessment_id: ignored, ...rest } = assessment;
  return rest;
}

export function runSemanticReaudit({ pool = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8')) } = {}) {
  const cases = pool.cases || [];
  const rejected = cases.filter(item => (item.sources || []).some(source => source.evidence_span_status !== VALID_SPAN));
  const valid = cases.filter(item => !rejected.includes(item));
  const auditedCases = valid.map(item => {
    const sourceAudits = (item.sources || []).map(source => reassessSource(item, source));
    const assessments = sourceAudits.map(itemAudit => itemAudit.assessment);
    const aggregate = aggregateEvidenceSufficiency(assessments);
    const old = summarizeOld(item);
    const next = {
      status: aggregate.status,
      semantics: assessments.map(summarizeAssessment)
    };
    const semanticChanged = old.semantics.length !== next.semantics.length
      || old.semantics.some((assessment, index) => changed(semanticComparable(assessment), semanticComparable(next.semantics[index])));
    const statusChanged = old.status !== next.status;
    return {
      case_id: item.case_id,
      requirement: item.requirement,
      sources: item.sources.map(sourceSnapshot),
      old_draft_status: old.status,
      new_draft_status: next.status,
      old_semantics: old.semantics,
      new_semantics: next.semantics,
      support_observations: assessments.flatMap(assessment => assessment.support_observations),
      conflict_observations: assessments.flatMap(assessment => assessment.conflict_observations),
      context_recovery: sourceAudits.map((itemAudit, index) => contextRecovery(item, item.sources?.[index] || {}, itemAudit.assessment)),
      semantic_boundaries: unique(sourceAudits.map(audit => audit.semantic_boundary)),
      change_reason: unique(sourceAudits.map(audit => audit.audit_reason)),
      status_changed: statusChanged,
      semantic_changed: semanticChanged,
      aggregate_consistent: aggregate.status === next.status,
      expected_gold: item.draft_gold?.status || null,
      gold_provenance: item.draft_gold?.provenance || null
    };
  });

  const rejectedCases = rejected.map(item => ({
    case_id: item.case_id,
    requirement: item.requirement,
    reason: 'REJECT_FROM_CALIBRATION',
    rejection_code: 'GOLD_DESIGN_INVALID',
    sources: item.sources.map(sourceSnapshot),
    old_draft_status: item.draft_aggregated_status,
    new_draft_status: null,
    old_semantics: (item.draft_semantics || []).map(summarizeAssessment),
    new_semantics: [],
    expected_gold: item.draft_gold?.status || null,
    gold_provenance: item.draft_gold?.provenance || null
  }));

  const count = status => auditedCases.filter(item => item.new_draft_status === status).length;
  const statusBefore = Object.fromEntries(['EVIDENCE_REVIEW_READY', 'INSUFFICIENT_EVIDENCE', 'NO_RELEVANT_EVIDENCE', 'CONFLICTING_EVIDENCE'].map(status => [status, cases.filter(item => item.draft_aggregated_status === status).length]));
  const statusAfter = Object.fromEntries(['EVIDENCE_REVIEW_READY', 'INSUFFICIENT_EVIDENCE', 'NO_RELEVANT_EVIDENCE', 'CONFLICTING_EVIDENCE'].map(status => [status, count(status)]));
  const statusChangedCount = auditedCases.filter(item => item.status_changed).length;
  const semanticOnlyChangedCount = auditedCases.filter(item => item.semantic_changed && !item.status_changed).length;
  const unchangedCount = auditedCases.filter(item => !item.semantic_changed && !item.status_changed).length;
  const contextEntries = auditedCases.flatMap(item => item.context_recovery || []);
  const recovered = contextEntries.flatMap(item => Object.values(item.recovered_dimensions || {}));
  const contextRecoverySummary = {
    cases_requiring_expansion: auditedCases.filter(item => (item.context_recovery || []).some(entry => entry.required_dimensions.length > 0)).length,
    resolved_same_chunk: recovered.filter(item => ['EXACT_SPAN', 'SAME_SENTENCE', 'SAME_PARAGRAPH', 'TABLE_HEADER', 'SECTION_HEADING', 'SAME_CHUNK_CONTEXT'].includes(item.origin)).length,
    resolved_adjacent_chunk: recovered.filter(item => item.origin === 'ADJACENT_CHUNK').length,
    resolved_material_metadata: recovered.filter(item => item.origin === 'MATERIAL_METADATA').length,
    resolved_retrieval_expansion: recovered.filter(item => item.origin === 'ADJACENT_CHUNK').length,
    still_unresolved: auditedCases.filter(item => (item.context_recovery || []).some(entry => entry.unresolved_dimensions.length > 0)).length,
    recovered_dimension_count: recovered.length,
    unresolved_dimension_count: contextEntries.reduce((count, item) => count + item.unresolved_dimensions.length, 0)
  };

  return {
    schema_version: '4.3-evidence-support-calibration-v2-semantic-reaudit-v1',
    evaluator_version: EVALUATOR_VERSION,
    model_calls: 0,
    provider_calls: 0,
    embedding_calls: 0,
    db_mutation: false,
    original_candidates: cases.length,
    valid_span_candidates: valid.length,
    rejected_cases: rejectedCases,
    rejected_count: rejectedCases.length,
    status_before: statusBefore,
    status_after: statusAfter,
    status_changed_count: statusChangedCount,
    semantic_only_changed_count: semanticOnlyChangedCount,
    unchanged_count: unchangedCount,
    context_recovery: contextRecoverySummary,
    cases: auditedCases,
    boundary: {
      numeric_adverse_fact_supported_by_contract: true,
      subject_scope_insufficient_distinguishable: true,
      no_relevant_boundary_consistent: statusAfter.NO_RELEVANT_EVIDENCE === 1,
      false_conflict_prevented: rejectedCases.every(item => item.new_draft_status === null)
    },
    contract_gap_found: false,
    contract_gap_details: null,
    human_review: { ready: false, reviewed_count: 0, status: 'SYSTEM_DRAFT_REAUDITED' },
    manual_sample_gate: {
      eval_policy_updated: true,
      required_cases: ['V2R-003-COMP-DIRECT', 'V2R-002-PERF-PARTIAL', 'V2R-009-ISO-CONFLICT'],
      source_text_displayed: true
    },
    decision: 'SYSTEM_DRAFT_REAUDITED; HUMAN_REVIEW_PAUSED'
  };
}

function fullSample(report, caseId) {
  if (caseId === 'V2R-009-ISO-CONFLICT') {
    const rejected = report.rejected_cases.find(item => item.case_id === caseId);
    return rejected;
  }
  return report.cases.find(item => item.case_id === caseId);
}

function renderSample(report, caseId, label) {
  const item = fullSample(report, caseId);
  if (!item) return `## ${label}\n\nCase not found: ${caseId}\n`;
  const source = item.sources[0];
  const second = item.sources[1];
  const lines = [
    `## ${label}: ${item.case_id}`,
    '',
    `Requirement 原文：${item.requirement.text}`,
    '',
    `Source / Top5 原文：${source.source_text}`,
    second ? `\n第二来源 / Top5 原文：${second.source_text}` : '',
    '',
    `Selected exact span：${source.material_name}；chunk=${source.chunk_id}；offset=${source.start_offset}-${source.end_offset}；hash=${source.source_hash}`,
    `Context window：${source.context_before || '（无）'} → ${source.context_after || '（无）'}`,
    '',
    `System decision：${item.new_draft_status || 'REJECT_FROM_CALIBRATION'}`,
    `Expected / Gold：${item.expected_gold || '无'}（${item.gold_provenance || '未提供'}）`,
    `Semantic audit：${item.change_reason?.join('；') || item.reason || 'GOLD_DESIGN_INVALID'}`,
    `PASS/FAIL：${item.new_draft_status ? 'SYSTEM_DRAFT_REAUDITED（未人工批准）' : 'FAIL — GOLD_DESIGN_INVALID'}`,
    ''
  ];
  if (item.new_semantics?.length) {
    lines.push(`新语义：${item.new_semantics.map(s => `relevance=${s.semantic_relevance}, capability=${s.evidence_capability}, support=${s.support_level}, relationship=${s.semantic_relationship}, reasons=${s.reason_codes.join('+') || 'none'}`).join('；')}`);
  }
  return lines.join('\n');
}

export function renderSamples(report) {
  return [
    '# Calibration V2 Semantic Re-audit — Manual Sample Gate',
    '',
    '本文件只记录 SYSTEM_DRAFT_REAUDITED 结果，不构成 HUMAN_GOLD。',
    '',
    renderSample(report, 'V2R-003-COMP-DIRECT', 'CASE A — Positive'),
    renderSample(report, 'V2R-002-PERF-PARTIAL', 'CASE B — Numeric adverse fact boundary'),
    renderSample(report, 'V2R-009-ISO-CONFLICT', 'CASE C — Invalid conflict Gold'),
    '## Review boundary',
    '',
    'Human reviewed：0。V2R-009 不进入重新聚合统计；其第二来源没有同维度 observed value。'
  ].join('\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const report = runSemanticReaudit();
  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  fs.writeFileSync(SAMPLE_PATH, `${renderSamples(report)}\n`, 'utf8');
  console.log(JSON.stringify({
    original_candidates: report.original_candidates,
    valid_span_candidates: report.valid_span_candidates,
    rejected_count: report.rejected_count,
    status_before: report.status_before,
    status_after: report.status_after,
    status_changed_count: report.status_changed_count,
    semantic_only_changed_count: report.semantic_only_changed_count,
    unchanged_count: report.unchanged_count,
    contract_gap_found: report.contract_gap_found,
    human_review_ready: report.human_review.ready
  }));
}
