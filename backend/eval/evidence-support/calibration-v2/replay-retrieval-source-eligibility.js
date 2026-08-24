import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  classifyRetrievalChunkRole,
  classifySubstantiveCandidate,
  requirementExplicitlyRequestsMetadata
} from '../../../src/pipeline/retrieval-chunk-role.js';
import {
  classifyEvidenceSourceEligibility,
  isDerivedArtifactClass
} from '../../../src/pipeline/retrieval-source-eligibility.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const INPUT_PATH = path.join(HERE, 'GPT_REVIEW_PACKET_SUBSTANTIVE_HYGIENE_OFFLINE.json');
export const INTEGRITY_PACKET_PATH = path.join(HERE, 'GPT_REVIEW_PACKET_RETRIEVAL_EVAL_INTEGRITY.json');
export const REPORT_PATH = path.join(HERE, 'GPT_REVIEW_PACKET_EVIDENCE_SOURCE_ELIGIBILITY_OFFLINE.json');
export const MARKDOWN_PATH = path.join(HERE, 'GPT_REVIEW_PACKET_EVIDENCE_SOURCE_ELIGIBILITY_OFFLINE.md');
export const POST_V4_REPORT_PATH = path.join(HERE, 'GPT_REVIEW_PACKET_EVIDENCE_SOURCE_ELIGIBILITY_POST_V4.json');
export const POST_V4_MARKDOWN_PATH = path.join(HERE, 'GPT_REVIEW_PACKET_EVIDENCE_SOURCE_ELIGIBILITY_POST_V4.md');
export const CASE_IDS = Object.freeze([
  'V2R-001-PERF-DIRECT', 'V2R-002-PERF-PARTIAL', 'V2R-003-COMP-DIRECT',
  'V2R-004-COMP-PARTIAL', 'V2R-005-ISO-DIRECT', 'V2R-006-ISO-SCOPE'
]);
export const TOP_K = 5;

const CONTEXT_ROLES = new Set(['HEADING', 'METADATA', 'FRONT_MATTER']);
const DECISION_BEARING_CLASS = 'EVIDENCE_BEARING';
const GPT_EXPECTATION_SOURCE = 'GPT_REVIEWED_REGRESSION_EXPECTATION';
const AUTO_EXPECTATION_SOURCE = 'AUTO_DRAFT_EXPECTATION';
const PENDING_EXPECTATION_SOURCE = 'PENDING_GPT_REVIEW';

// Evaluation-only, independently reviewed regression expectations. These are
// not production rules and are intentionally keyed by fixture identity.
const CONFIRMED_FALSE_POSITIVE_EXPECTATIONS = Object.freeze({
  'MCH-A9CA772011E7045D8F035A43E6681BE8': ['INTERNAL_PROCESS_ARTIFACT', 'GPT_CONFIRMED_PROMPT_INSTRUCTION'],
  'MCH-9F70D2B858350FCFD93FFDA7C66F95DE': ['INTERNAL_PROCESS_ARTIFACT', 'GPT_CONFIRMED_EVAL_GOVERNANCE'],
  'MCH-889DDF9919EF0E6485406DAB6A159A11': ['SYSTEM_DERIVED_ARTIFACT', 'GPT_CONFIRMED_STATUS_DERIVED'],
  'MCH-6BA94F47BCD831E596F751A2BEA49AB8': ['INTERNAL_PROCESS_ARTIFACT', 'GPT_CONFIRMED_TEST_PROCESS'],
  'MCH-2684A33DDF84C68B4CA59C348136BB30': ['INTERNAL_PROCESS_ARTIFACT', 'GPT_CONFIRMED_CODE_PROCESS'],
  'MCH-10C2129A5D37AB29824CE98DF6E32F0D': ['INTERNAL_PROCESS_ARTIFACT', 'GPT_CONFIRMED_PRESENTATION_LABEL'],
  'MCH-555802B2C6B93AE17E478E4ECC99308A': ['NON_AUDITABLE_CLAIM', 'GPT_CONFIRMED_LOW_SPECIFICITY_CLAIM'],
  'MCH-DDCF46F5C7751B5B84EA724E094CBCFB': ['CONTROL_PLANE_ARTIFACT', 'GPT_CONFIRMED_CONTROL_PLANE'],
  'MCH-363BD137AFF31336472D4E7F4F537C8F': ['SYSTEM_DERIVED_ARTIFACT', 'GPT_CONFIRMED_STATUS_DERIVED'],
  'MCH-52CC0CDE792C8009A7790CA3F184A28E': ['NON_AUDITABLE_CLAIM', 'GPT_CONFIRMED_LABEL_LIKE_NOUN_PHRASE']
});

const normalize = (value) => String(value ?? '').normalize('NFKC').replace(/\r\n?/g, '\n').trim();
const rankOf = (candidate, fallback) => Number(candidate.raw_vector_rank ?? candidate.rank ?? fallback);

function independentExpectedSourceEligibility(candidate) {
  const override = CONFIRMED_FALSE_POSITIVE_EXPECTATIONS[candidate.chunk_id];
  if (override) return { value: override[0], reason: override[1], provenance: GPT_EXPECTATION_SOURCE };
  const source = normalize(candidate.source_text ?? candidate.raw_original_text);
  const materialType = String(candidate.material_type ?? '').toLowerCase();
  const authority = String(candidate.source_authority ?? candidate.authority_level ?? '').toLowerCase();
  const sourceType = String(candidate.source_type ?? '').toLowerCase();
  if (/representative[_ -]?synthetic|not[_ -]?real[_ -]?customer[_ -]?data|synthetic[_ -]?test[_ -]?material|(?:^|\n)material[_ -]?id\s*[:=]/i.test(source)) return { value: 'EVAL_ARTIFACT', reason: 'INDEPENDENT_EVAL_METADATA_RULE' };
  if (/control[ _-]?plane|claim[ _-]?gate|writer output|source[- ]of[- ]truth|系统状态|系统负责|控制面|控制平面|确定性传播/i.test(source)) return { value: 'CONTROL_PLANE_ARTIFACT', reason: 'INDEPENDENT_CONTROL_PLANE_RULE' };
  if (/prompt|e2e|eval|provider|model|commit|tests?\s+pass|project data scope|keycloak|idp|docx|template|apache|agpl|open source|检查仓库|当前直接相关代码|技术 enum|不要自研|开源组件|兼容实现|用户界面优先|客户私有数据|决策[:：]/i.test(source)) return { value: 'INTERNAL_PROCESS_ARTIFACT', reason: 'INDEPENDENT_PROCESS_LANGUAGE_RULE' };
  const compact = source.replace(/[，,、。；;：:（）()\s]/g, '');
  if ((compact.length <= 12 && !/[\d%]/.test(source)) || (source.length <= 24 && !/[\n，,：:；;]/.test(source) && !/[\d%]/.test(source))) return { value: 'NON_AUDITABLE_CLAIM', reason: 'INDEPENDENT_LOW_SPECIFICITY_RULE' };
  if (['official', 'authoritative', 'administrative_regulation', 'national_law', 'government'].includes(authority) || ['official', 'authoritative_reference', 'official_standard', 'government_guidance', 'industry_guidance', 'policy', 'regulation', 'law'].includes(sourceType)) return { value: 'AUTHORITATIVE_REFERENCE_FACT', reason: 'INDEPENDENT_AUTHORITY_PROVENANCE' };
  const materialMap = { company_profile: 'ORIGINAL_BUSINESS_FACT', product: 'ORIGINAL_BUSINESS_FACT', personnel: 'ORIGINAL_BUSINESS_FACT', product_documentation: 'ORIGINAL_TECHNICAL_FACT', technical_solution: 'ORIGINAL_TECHNICAL_FACT', technical_whitepaper: 'ORIGINAL_TECHNICAL_FACT', delivery_capability: 'ORIGINAL_TECHNICAL_FACT', project_case: 'ORIGINAL_PROJECT_FACT', historical_bid: 'ORIGINAL_PROJECT_FACT', case: 'ORIGINAL_PROJECT_FACT', qualification: 'ORIGINAL_QUALIFICATION_FACT' };
  if (materialMap[materialType]) return { value: materialMap[materialType], reason: 'INDEPENDENT_MATERIAL_PROVENANCE' };
  return { value: 'UNKNOWN', reason: 'INDEPENDENT_PROVENANCE_UNAVAILABLE' };
}

function expectedLookup(integrityPacket, caseId, chunkId) {
  return (integrityPacket.candidate_reclassification || []).find((item) => item.case_id === caseId && item.chunk_id === chunkId) ?? null;
}

function annotate(candidate, caseId, integrityPacket) {
  const role = classifyRetrievalChunkRole(candidate);
  const substantive = classifySubstantiveCandidate(candidate);
  const sourceEligibility = classifyEvidenceSourceEligibility(candidate);
  const expected = independentExpectedSourceEligibility(candidate);
  const relative = expectedLookup(integrityPacket, caseId, candidate.chunk_id);
  const expectationProvenance = expected.provenance || AUTO_EXPECTATION_SOURCE;
  return {
    ...candidate,
    source_text: candidate.source_text ?? candidate.raw_original_text ?? '',
    chunk_role: role.role,
    chunk_role_reason: role.reason,
    substantive_candidate: substantive.substantive_candidate,
    substantive_class: substantive.substantive_class,
    substantive_reason: substantive.substantive_reason,
    evidence_source_eligible: sourceEligibility.evidence_source_eligible,
    evidence_source_class: sourceEligibility.evidence_source_class,
    evidence_source_reason: sourceEligibility.evidence_source_reason,
    low_specificity_claim: sourceEligibility.low_specificity_claim,
    evidence_source_version: sourceEligibility.evidence_source_version,
    candidate_eligibility: substantive.substantive_candidate && sourceEligibility.evidence_source_eligible ? 'EVIDENCE_ELIGIBLE' : 'CONTEXT_ONLY',
    candidate_exclusion_reason: substantive.substantive_candidate ? (sourceEligibility.evidence_source_eligible ? null : sourceEligibility.evidence_source_reason) : substantive.substantive_reason,
    expected_source_eligibility: expected.value,
    expected_source_eligibility_reason: expected.reason,
    source_eligibility_expectation_provenance: expectationProvenance,
    gpt_reviewed_source_eligibility: expectationProvenance === GPT_EXPECTATION_SOURCE ? expected.value : null,
    gpt_reviewed_source_eligibility_reason: expectationProvenance === GPT_EXPECTATION_SOURCE ? expected.reason : null,
    decision_bearing_expectation_source: relative ? GPT_EXPECTATION_SOURCE : PENDING_EXPECTATION_SOURCE,
    requirement_relative_classification: relative?.GPT_REVIEW_EXPECTED_CLASSIFICATION ?? 'NOT_REVIEWED_IN_EXISTING_PACKET',
    raw_vector_rank: rankOf(candidate, 0)
  };
}

function phase1Eligible(requirement, candidate) {
  if (CONTEXT_ROLES.has(candidate.chunk_role)) return requirementExplicitlyRequestsMetadata(requirement);
  return true;
}

function phaseCandidates(requirement, raw, caseId, integrityPacket, phase) {
  const annotated = raw.map((candidate) => annotate(candidate, caseId, integrityPacket));
  const candidates = phase === 'PRE'
    ? annotated
    : annotated.filter((candidate) => phase1Eligible(requirement, candidate)
      && (phase === 'POST_V1' || candidate.substantive_candidate)
      && (!['POST_V3', 'POST_V4'].includes(phase) || candidate.evidence_source_eligible));
  return candidates.slice(0, TOP_K).map((candidate, index) => ({
    ...candidate,
    phase_rank: index + 1,
    phase,
    phase_eligibility: ['POST_V3', 'POST_V4'].includes(phase) ? 'FINAL_EVIDENCE_ELIGIBLE' : phase === 'POST_V2' ? 'SUBSTANTIVE_EVIDENCE_CANDIDATE' : phase === 'POST_V1' ? 'STRUCTURAL_EVIDENCE_CANDIDATE' : 'LEGACY_BASELINE'
  }));
}

function splitGold(caseRecord) {
  const source = Array.isArray(caseRecord.gold_evidence_set) ? caseRecord.gold_evidence_set : [];
  const goldEvidenceSet = source.filter((item) => !CONTEXT_ROLES.has(item.chunk_role)).map((item) => ({ ...item, gold_role: 'BUSINESS_EVIDENCE_CHUNK' }));
  const goldContextSet = source.filter((item) => CONTEXT_ROLES.has(item.chunk_role)).map((item) => ({ ...item, gold_role: 'CONTEXT_HEADING_CHUNK' }));
  return { gold_evidence_set: goldEvidenceSet, gold_context_set: goldContextSet, gold_evidence_chunk_ids: goldEvidenceSet.map((item) => item.chunk_id), gold_context_chunk_ids: goldContextSet.map((item) => item.chunk_id) };
}

function idsForExpectedClassification(integrityPacket, caseId, expectedClass) {
  return new Set((integrityPacket.candidate_reclassification || []).filter((item) => item.case_id === caseId && item.GPT_REVIEW_EXPECTED_CLASSIFICATION === expectedClass).map((item) => item.chunk_id));
}

function firstRank(candidates, ids) {
  const found = candidates.find((candidate) => ids.has(candidate.chunk_id));
  return found ? found.phase_rank : null;
}

function rankMetrics(itemRecords, idKey) {
  const hit = (item, rank) => item.phase_candidates.some((candidate) => candidate.phase_rank <= rank && item[idKey].has(candidate.chunk_id));
  const first = itemRecords.map((item) => firstRank(item.phase_candidates, item[idKey])).filter((rank) => Number.isInteger(rank));
  return {
    denominator: itemRecords.length,
    hit_at_1: itemRecords.filter((item) => hit(item, 1)).length / itemRecords.length,
    hit_at_3: itemRecords.filter((item) => hit(item, 3)).length / itemRecords.length,
    hit_at_5: itemRecords.filter((item) => hit(item, 5)).length / itemRecords.length,
    mrr: itemRecords.reduce((sum, item) => sum + (firstRank(item.phase_candidates, item[idKey]) ? 1 / firstRank(item.phase_candidates, item[idKey]) : 0), 0) / itemRecords.length,
    first_rank_by_case: itemRecords.map((item) => ({ case_id: item.case_id, rank: firstRank(item.phase_candidates, item[idKey]) }))
  };
}

function hygieneMetrics(cases) {
  const count = (rank, predicate) => cases.reduce((sum, item) => sum + item.phase_candidates.slice(0, rank).filter(predicate).length, 0);
  const top5 = cases.reduce((sum, item) => sum + item.phase_candidates.length, 0);
  const substantive = count(5, (candidate) => candidate.substantive_candidate);
  const finalEligible = count(5, (candidate) => candidate.evidence_source_eligible);
  return {
    metadata_at_1: count(1, (candidate) => CONTEXT_ROLES.has(candidate.chunk_role)),
    metadata_at_3: count(3, (candidate) => CONTEXT_ROLES.has(candidate.chunk_role)),
    metadata_at_5: count(5, (candidate) => CONTEXT_ROLES.has(candidate.chunk_role)),
    non_substantive_at_1: count(1, (candidate) => !candidate.substantive_candidate),
    non_substantive_at_3: count(3, (candidate) => !candidate.substantive_candidate),
    non_substantive_at_5: count(5, (candidate) => !candidate.substantive_candidate),
    non_evidence_source_at_1: count(1, (candidate) => !candidate.evidence_source_eligible),
    non_evidence_source_at_3: count(3, (candidate) => !candidate.evidence_source_eligible),
    non_evidence_source_at_5: count(5, (candidate) => !candidate.evidence_source_eligible),
    derived_artifact_leakage_at_5: count(5, (candidate) => isDerivedArtifactClass(candidate.evidence_source_class)),
    internal_process_artifact_leakage_at_5: count(5, (candidate) => candidate.evidence_source_class === 'INTERNAL_PROCESS_ARTIFACT'),
    low_specificity_claim_at_5: count(5, (candidate) => candidate.low_specificity_claim),
    substantive_candidate_rate_at_5: top5 ? substantive / top5 : 0,
    final_evidence_eligible_rate_at_5: top5 ? finalEligible / top5 : 0
  };
}

function sourceCounts(cases) {
  const counts = { source_eligible: 0, source_ineligible: 0, unknown: 0, derived_artifact: 0, internal_process_artifact: 0, low_specificity_claim: 0 };
  for (const item of cases) for (const candidate of item.raw_candidate_pool) {
    if (candidate.evidence_source_eligible) counts.source_eligible += 1;
    else if (candidate.evidence_source_class === 'UNKNOWN') counts.unknown += 1;
    else counts.source_ineligible += 1;
    if (isDerivedArtifactClass(candidate.evidence_source_class)) counts.derived_artifact += 1;
    if (candidate.evidence_source_class === 'INTERNAL_PROCESS_ARTIFACT') counts.internal_process_artifact += 1;
    if (candidate.low_specificity_claim) counts.low_specificity_claim += 1;
  }
  return counts;
}

function aggregatePhase(cases, phase) {
  const inputs = cases.map((item) => item[phase]);
  const exact = rankMetrics(inputs, 'goldEvidenceIds');
  const decision = rankMetrics(inputs, 'decisionBearingIds');
  return { exact_gold: exact, decision_bearing: decision, hygiene: hygieneMetrics(inputs), raw_candidate_count: cases.reduce((sum, item) => sum + item.raw_candidate_count, 0), rejected_non_substantive_count: cases.reduce((sum, item) => sum + item.rejected_non_substantive_count, 0) };
}

export function replayCase(caseRecord, integrityPacket, { includePostV4 = false } = {}) {
  const requirement = { text: caseRecord.requirement };
  const raw = (caseRecord.raw_candidate_pool || caseRecord.candidate_hygiene?.all_candidates || []).slice().sort((a, b) => rankOf(a, 0) - rankOf(b, 0));
  const annotated = raw.map((candidate) => annotate(candidate, caseRecord.case_id, integrityPacket));
  const gold = splitGold(caseRecord);
  const decisionBearingIds = idsForExpectedClassification(integrityPacket, caseRecord.case_id, DECISION_BEARING_CLASS);
  const phases = {};
  const phaseNames = ['PRE', 'POST_V1', 'POST_V2', 'POST_V3', ...(includePostV4 ? ['POST_V4'] : [])];
  for (const phase of phaseNames) phases[phase.toLowerCase()] = phaseCandidates(requirement, annotated, caseRecord.case_id, integrityPacket, phase);
  const buildMetric = (phaseCandidatesValue) => ({ phase_candidates: phaseCandidatesValue, goldEvidenceIds: new Set(gold.gold_evidence_chunk_ids), decisionBearingIds: new Set(decisionBearingIds) });
  const result = {
    case_id: caseRecord.case_id,
    requirement: caseRecord.requirement,
    gold_evidence_set: gold.gold_evidence_set,
    gold_context_set: gold.gold_context_set,
    decision_bearing_gold_chunk_ids: [...decisionBearingIds],
    raw_candidate_count: raw.length,
    rejected_non_substantive_count: annotated.filter((candidate) => !candidate.substantive_candidate).length,
    raw_candidate_pool: annotated,
    pre: { case_id: caseRecord.case_id, phase: 'PRE', ...buildMetric(phases.pre), metrics: { exact_gold: rankMetrics([buildMetric(phases.pre)], 'goldEvidenceIds'), decision_bearing: rankMetrics([buildMetric(phases.pre)], 'decisionBearingIds'), hygiene: hygieneMetrics([{ phase_candidates: phases.pre }]) } },
    post_v1: { case_id: caseRecord.case_id, phase: 'POST_V1', ...buildMetric(phases.post_v1), metrics: { exact_gold: rankMetrics([buildMetric(phases.post_v1)], 'goldEvidenceIds'), decision_bearing: rankMetrics([buildMetric(phases.post_v1)], 'decisionBearingIds'), hygiene: hygieneMetrics([{ phase_candidates: phases.post_v1 }]) } },
    post_v2: { case_id: caseRecord.case_id, phase: 'POST_V2', ...buildMetric(phases.post_v2), metrics: { exact_gold: rankMetrics([buildMetric(phases.post_v2)], 'goldEvidenceIds'), decision_bearing: rankMetrics([buildMetric(phases.post_v2)], 'decisionBearingIds'), hygiene: hygieneMetrics([{ phase_candidates: phases.post_v2 }]) } },
    post_v3: { case_id: caseRecord.case_id, phase: 'POST_V3', ...buildMetric(phases.post_v3), metrics: { exact_gold: rankMetrics([buildMetric(phases.post_v3)], 'goldEvidenceIds'), decision_bearing: rankMetrics([buildMetric(phases.post_v3)], 'decisionBearingIds'), hygiene: hygieneMetrics([{ phase_candidates: phases.post_v3 }]) } }
  };
  if (includePostV4) result.post_v4 = { case_id: caseRecord.case_id, phase: 'POST_V4', ...buildMetric(phases.post_v4), metrics: { exact_gold: rankMetrics([buildMetric(phases.post_v4)], 'goldEvidenceIds'), decision_bearing: rankMetrics([buildMetric(phases.post_v4)], 'decisionBearingIds'), hygiene: hygieneMetrics([{ phase_candidates: phases.post_v4 }]) } };
  return result;
}

export function buildOfflineReport({ inputPacket, integrityPacket, includePostV4 = false }) {
  const cases = (inputPacket.cases || []).filter((item) => CASE_IDS.includes(item.case_id)).map((item) => replayCase(item, integrityPacket, { includePostV4 }));
  const phases = { pre: aggregatePhase(cases, 'pre'), post_v1: aggregatePhase(cases, 'post_v1'), post_v2: aggregatePhase(cases, 'post_v2'), post_v3: aggregatePhase(cases, 'post_v3') };
  if (includePostV4) phases.post_v4 = aggregatePhase(cases, 'post_v4');
  const finalPhase = includePostV4 ? phases.post_v4 : phases.post_v3;
  const falsePositiveIds = Object.keys(CONFIRMED_FALSE_POSITIVE_EXPECTATIONS);
  const finalPhaseKey = includePostV4 ? 'post_v4' : 'post_v3';
  const allConfirmedExcluded = falsePositiveIds.every((chunkId) => cases.every((item) => !item[finalPhaseKey].phase_candidates.some((candidate) => candidate.chunk_id === chunkId)));
  const iso9001 = cases.find((item) => item.case_id === 'V2R-005-ISO-DIRECT')?.raw_candidate_pool.find((candidate) => candidate.original_name === 'qualification-iso9001.md');
  const iso9001Expected = (integrityPacket.candidate_reclassification || []).find((item) => item.case_id === 'V2R-005-ISO-DIRECT' && item.chunk_id === iso9001?.chunk_id);
  const boundary = cases.find((item) => item.case_id === 'V2R-006-ISO-SCOPE')?.raw_candidate_pool.find((candidate) => candidate.chunk_id === 'MCH-70376020855F97D43106A81E5F040C7F');
  const knownDecisionGoldRetained = finalPhase.decision_bearing.hit_at_5 === 1;
  const allCandidates = cases.flatMap((item) => item.raw_candidate_pool);
  const gptReviewedExpectationCount = allCandidates.filter((candidate) => candidate.source_eligibility_expectation_provenance === GPT_EXPECTATION_SOURCE).length;
  const autoExpectationCount = allCandidates.filter((candidate) => candidate.source_eligibility_expectation_provenance === AUTO_EXPECTATION_SOURCE).length;
  const wronglyAttributedGptLabels = allCandidates.filter((candidate) => candidate.source_eligibility_expectation_provenance !== GPT_EXPECTATION_SOURCE && candidate.gpt_reviewed_source_eligibility !== null).length;
  const v2r001Rank = finalPhase.decision_bearing.first_rank_by_case.find((item) => item.case_id === 'V2R-001-PERF-DIRECT')?.rank ?? null;
  const quality = {
    decision_bearing: finalPhase.decision_bearing,
    exact_gold: finalPhase.exact_gold,
    v2r001_first_decision_bearing_rank: v2r001Rank,
    v2r006_boundary_source_eligible: boundary?.evidence_source_eligible === true
  };
  const postV4Pass = includePostV4
    && finalPhase.hygiene.metadata_at_5 === 0
    && finalPhase.hygiene.non_substantive_at_5 === 0
    && finalPhase.hygiene.non_evidence_source_at_5 === 0
    && finalPhase.hygiene.derived_artifact_leakage_at_5 === 0
    && finalPhase.hygiene.internal_process_artifact_leakage_at_5 === 0
    && finalPhase.hygiene.low_specificity_claim_at_5 === 0
    && finalPhase.decision_bearing.hit_at_3 === 1
    && finalPhase.decision_bearing.hit_at_5 === 1
    && finalPhase.exact_gold.hit_at_3 === 1
    && finalPhase.exact_gold.hit_at_5 === 1
    && v2r001Rank !== null && v2r001Rank <= 2
    && quality.v2r006_boundary_source_eligible
    && allConfirmedExcluded
    && wronglyAttributedGptLabels === 0;
  return {
    schema_version: includePostV4 ? '4.3-retrieval-source-eligibility-post-v4-offline-v1' : '4.3-retrieval-source-eligibility-offline-v1',
    title: 'P0 EVIDENCE SOURCE ELIGIBILITY CHECKPOINT',
    evaluation_phase: includePostV4 ? 'POST_V4' : 'POST_V3',
    generated_at: new Date().toISOString(),
    structural_hygiene: { phase1_preserved: true, phase2a_preserved: true, structural_false_negative_confirmed: 0 },
    source_eligibility: { total_candidate_occurrences: cases.reduce((sum, item) => sum + item.raw_candidate_count, 0), ...sourceCounts(cases), confirmed_false_positive_expectation_count: falsePositiveIds.length, gpt_reviewed_expectation_count: gptReviewedExpectationCount, auto_expectation_count: autoExpectationCount, wrongly_attributed_gpt_labels_remaining: wronglyAttributedGptLabels },
    phases,
    quality,
    acceptance: {
      metadata_at_5_zero: finalPhase.hygiene.metadata_at_5 === 0,
      non_substantive_at_5_zero: finalPhase.hygiene.non_substantive_at_5 === 0,
      non_evidence_source_at_5_zero: finalPhase.hygiene.non_evidence_source_at_5 === 0,
      derived_artifact_leakage_at_5_zero: finalPhase.hygiene.derived_artifact_leakage_at_5 === 0,
      internal_process_artifact_leakage_at_5_zero: finalPhase.hygiene.internal_process_artifact_leakage_at_5 === 0,
      low_specificity_claim_at_5_zero: finalPhase.hygiene.low_specificity_claim_at_5 === 0,
      broken_decision_bearing_gold: finalPhase.decision_bearing.hit_at_5 < 1,
      all_confirmed_source_eligibility_corrections_excluded: allConfirmedExcluded,
      wrongly_attributed_gpt_labels_remaining: wronglyAttributedGptLabels,
      iso9001_source_eligible: iso9001?.evidence_source_eligible === true,
      iso9001_evidence_bearing: iso9001Expected?.GPT_REVIEW_EXPECTED_CLASSIFICATION === 'EVIDENCE_BEARING',
      v2r006_boundary_source_eligible: boundary?.evidence_source_eligible === true,
      verified_original_facts_retained: knownDecisionGoldRetained,
      post_v3_pass: phases.post_v3.hygiene.metadata_at_5 === 0
        && phases.post_v3.hygiene.non_substantive_at_5 === 0
        && phases.post_v3.hygiene.non_evidence_source_at_5 === 0
        && phases.post_v3.hygiene.derived_artifact_leakage_at_5 === 0
        && phases.post_v3.hygiene.internal_process_artifact_leakage_at_5 === 0
        && phases.post_v3.hygiene.low_specificity_claim_at_5 === 0
        && phases.post_v3.decision_bearing.hit_at_5 === 1
        && allConfirmedExcluded && iso9001?.evidence_source_eligible === true
        && iso9001Expected?.GPT_REVIEW_EXPECTED_CLASSIFICATION !== 'EVIDENCE_BEARING'
        && boundary?.evidence_source_eligible === true
        && phases.post_v3.decision_bearing.hit_at_5 === 1
        && knownDecisionGoldRetained,
      ...(includePostV4 ? { post_v4_pass: postV4Pass } : {})
    },
    anti_laundering: { final_top5_system_derived_artifacts: phases.post_v3.hygiene.derived_artifact_leakage_at_5, final_top5_internal_process_artifacts: phases.post_v3.hygiene.internal_process_artifact_leakage_at_5 },
    gpt_review_status: 'PENDING_REVIEW',
    eval_complete: false,
    safety: { embedding_requests: 0, llm_requests: 0, dify_requests: 0, automatic_retry: 0, production_writes: false }
  };
}

function markdown(report) {
  const finalPhase = report.evaluation_phase || 'POST_V3';
  const phaseLabel = finalPhase === 'POST_V4' ? 'PRE / POST_V1 / POST_V2 / POST_V3 / POST_V4' : 'PRE / POST_V1 / POST_V2 / POST_V3';
  const lines = ['# P0 EVIDENCE SOURCE ELIGIBILITY CHECKPOINT', '', `- EVALUATION_PHASE: \`${finalPhase}\``, '- GPT_REVIEW_STATUS: `PENDING_REVIEW`', '- EVAL_COMPLETE: `NO`', '- Offline replay only. Embedding, LLM and Dify calls: 0.', '', '## Source eligibility summary', '```json', JSON.stringify({ structural_hygiene: report.structural_hygiene, source_eligibility: report.source_eligibility, quality: report.quality, acceptance: report.acceptance, anti_laundering: report.anti_laundering }, null, 2), '```', '', `## ${phaseLabel} metrics`, '```json', JSON.stringify(report.phases, null, 2), '```', ''];
  for (const item of report.cases ?? []) {
    lines.push(`## ${item.case_id}`, '', `Requirement: ${item.requirement}`, '', '### Gold Evidence / Context', '```json', JSON.stringify({ gold_evidence_set: item.gold_evidence_set, gold_context_set: item.gold_context_set }, null, 2), '```', '', `Raw candidate occurrences: ${item.raw_candidate_count}`, `Rejected non-substantive occurrences: ${item.rejected_non_substantive_count}`, '', '### All raw candidates with runtime result, expectation and provenance', '```json', JSON.stringify(item.raw_candidate_pool, null, 2), '```', '', `### ${phaseLabel}`, '```json', JSON.stringify({ pre: item.pre, post_v1: item.post_v1, post_v2: item.post_v2, post_v3: item.post_v3, ...(item.post_v4 ? { post_v4: item.post_v4 } : {}) }, null, 2), '```', '');
  }
  return `${lines.join('\n')}\n`;
}

export async function runOfflineReplay({ inputPath = INPUT_PATH, integrityPath = INTEGRITY_PACKET_PATH, reportPath = REPORT_PATH, markdownPath = MARKDOWN_PATH, includePostV4 = false } = {}) {
  const inputPacket = JSON.parse(await fs.readFile(inputPath, 'utf8'));
  const integrityPacket = JSON.parse(await fs.readFile(integrityPath, 'utf8'));
  const report = buildOfflineReport({ inputPacket, integrityPacket, includePostV4 });
  const reportWithCases = { ...report, cases: (inputPacket.cases || []).filter((item) => CASE_IDS.includes(item.case_id)).map((item) => replayCase(item, integrityPacket, { includePostV4 })) };
  await fs.writeFile(reportPath, `${JSON.stringify(reportWithCases, null, 2)}\n`, 'utf8');
  await fs.writeFile(markdownPath, markdown(reportWithCases), 'utf8');
  return reportWithCases;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const report = await runOfflineReplay();
  console.log(JSON.stringify({ status: 'SOURCE_ELIGIBILITY_OFFLINE_PENDING_REVIEW', post_v3_pass: report.acceptance.post_v3_pass, source_eligibility: report.source_eligibility, phases: report.phases, external_calls: report.safety }));
}
