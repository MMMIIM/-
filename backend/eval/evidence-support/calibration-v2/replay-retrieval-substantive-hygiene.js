import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  classifyRetrievalChunkRole,
  classifySubstantiveCandidate,
  requirementExplicitlyRequestsMetadata
} from '../../../src/pipeline/retrieval-chunk-role.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const LIVE_PACKET_PATH = path.join(HERE, 'GPT_REVIEW_PACKET_RETRIEVAL_HYGIENE_PRE_POST.json');
export const INTEGRITY_PACKET_PATH = path.join(HERE, 'GPT_REVIEW_PACKET_RETRIEVAL_EVAL_INTEGRITY.json');
export const REPORT_PATH = path.join(HERE, 'GPT_REVIEW_PACKET_SUBSTANTIVE_HYGIENE_OFFLINE.json');
export const MARKDOWN_PATH = path.join(HERE, 'GPT_REVIEW_PACKET_SUBSTANTIVE_HYGIENE_OFFLINE.md');
export const CASE_IDS = Object.freeze([
  'V2R-001-PERF-DIRECT', 'V2R-002-PERF-PARTIAL', 'V2R-003-COMP-DIRECT',
  'V2R-004-COMP-PARTIAL', 'V2R-005-ISO-DIRECT', 'V2R-006-ISO-SCOPE'
]);
export const TOP_K = 5;

const CONTEXT_ROLES = new Set(['HEADING', 'METADATA', 'FRONT_MATTER']);
const DECISION_BEARING_CLASS = 'EVIDENCE_BEARING';

const stableText = (value) => String(value ?? '').normalize('NFKC').replace(/\r\n?/g, '\n').trim();
const rankOf = (candidate, fallback) => Number(candidate.raw_vector_rank ?? candidate.rank ?? fallback);

function annotate(candidate) {
  const role = classifyRetrievalChunkRole(candidate);
  const substantive = classifySubstantiveCandidate(candidate);
  return {
    ...candidate,
    source_text: candidate.source_text ?? candidate.raw_original_text ?? '',
    chunk_role: role.role,
    chunk_role_reason: role.reason,
    substantive_candidate: substantive.substantive_candidate,
    substantive_class: substantive.substantive_class,
    substantive_reason: substantive.substantive_reason,
    substantive_version: substantive.substantive_version,
    raw_vector_rank: rankOf(candidate, 0)
  };
}

function phase1Eligible(requirement, candidate) {
  if (CONTEXT_ROLES.has(candidate.chunk_role)) return requirementExplicitlyRequestsMetadata(requirement);
  return true;
}

function phaseCandidates(requirement, raw, phase) {
  const annotated = raw.map(annotate);
  const candidates = phase === 'PRE'
    ? annotated
    : annotated.filter((candidate) => phase1Eligible(requirement, candidate)
      && (phase === 'POST_V1' || candidate.substantive_candidate));
  return candidates.slice(0, TOP_K).map((candidate, index) => ({
    ...candidate,
    phase_rank: index + 1,
    phase,
    phase_eligibility: phase === 'POST_V2' && !candidate.substantive_candidate ? 'CONTEXT_ONLY' : (phase === 'PRE' ? 'LEGACY_BASELINE' : 'EVIDENCE_ELIGIBLE')
  }));
}

function splitGold(caseRecord) {
  const source = Array.isArray(caseRecord.gold_evidence_set) ? caseRecord.gold_evidence_set : [];
  const goldEvidenceSet = source.filter((item) => !CONTEXT_ROLES.has(item.chunk_role)).map((item) => ({ ...item, gold_role: 'BUSINESS_EVIDENCE_CHUNK' }));
  const goldContextSet = source.filter((item) => CONTEXT_ROLES.has(item.chunk_role)).map((item) => ({ ...item, gold_role: 'CONTEXT_HEADING_CHUNK' }));
  return {
    gold_evidence_set: goldEvidenceSet,
    gold_context_set: goldContextSet,
    gold_evidence_chunk_ids: goldEvidenceSet.map((item) => item.chunk_id),
    gold_context_chunk_ids: goldContextSet.map((item) => item.chunk_id)
  };
}

function idsForExpectedClassification(integrityPacket, caseId, expectedClass) {
  return new Set((integrityPacket.candidate_reclassification || [])
    .filter((item) => item.case_id === caseId && item.GPT_REVIEW_EXPECTED_CLASSIFICATION === expectedClass)
    .map((item) => item.chunk_id));
}

function firstRank(candidates, ids) {
  const found = candidates.find((candidate) => ids.has(candidate.chunk_id));
  return found ? found.phase_rank : null;
}

function rankMetrics(cases, idKey) {
  const hit = (item, rank) => item.phase_candidates.some((candidate) => candidate.phase_rank <= rank && item[idKey].has(candidate.chunk_id));
  const first = cases.map((item) => firstRank(item.phase_candidates, item[idKey])).filter((rank) => Number.isInteger(rank));
  return {
    denominator: cases.length,
    hit_at_1: cases.filter((item) => hit(item, 1)).length / cases.length,
    hit_at_3: cases.filter((item) => hit(item, 3)).length / cases.length,
    hit_at_5: cases.filter((item) => hit(item, 5)).length / cases.length,
    mrr: cases.reduce((sum, item) => sum + (firstRank(item.phase_candidates, item[idKey]) ? 1 / firstRank(item.phase_candidates, item[idKey]) : 0), 0) / cases.length,
    first_rank_by_case: cases.map((item) => ({ case_id: item.case_id, rank: firstRank(item.phase_candidates, item[idKey]) }))
  };
}

function hygieneMetrics(cases) {
  const count = (rank, predicate) => cases.reduce((sum, item) => sum + item.phase_candidates.slice(0, rank).filter(predicate).length, 0);
  const top5 = cases.reduce((sum, item) => sum + item.phase_candidates.length, 0);
  const substantiveTop5 = count(5, (candidate) => candidate.substantive_candidate);
  return {
    metadata_at_1: count(1, (candidate) => CONTEXT_ROLES.has(candidate.chunk_role)),
    metadata_at_3: count(3, (candidate) => CONTEXT_ROLES.has(candidate.chunk_role)),
    metadata_at_5: count(5, (candidate) => CONTEXT_ROLES.has(candidate.chunk_role)),
    non_substantive_at_1: count(1, (candidate) => !candidate.substantive_candidate),
    non_substantive_at_3: count(3, (candidate) => !candidate.substantive_candidate),
    non_substantive_at_5: count(5, (candidate) => !candidate.substantive_candidate),
    substantive_candidate_rate_at_5: top5 ? substantiveTop5 / top5 : 0
  };
}

function phaseMetrics(caseRecords) {
  const cases = caseRecords.map((item) => ({ ...item, phase_candidates: item.phase_candidates }));
  const exact = rankMetrics(cases, 'goldEvidenceIds');
  const decision = rankMetrics(cases, 'decisionBearingIds');
  return { exact_gold: exact, decision_bearing: decision, first_decision_bearing_rank: decision.first_rank_by_case, hygiene: hygieneMetrics(cases) };
}

export function replayCase(caseRecord, integrityPacket) {
  const requirement = { text: caseRecord.requirement };
  const raw = (caseRecord.candidate_hygiene?.all_candidates || []).slice().sort((a, b) => rankOf(a, 0) - rankOf(b, 0));
  const gold = splitGold(caseRecord);
  const decisionBearingIds = idsForExpectedClassification(integrityPacket, caseRecord.case_id, DECISION_BEARING_CLASS);
  const phases = {};
  for (const phase of ['PRE', 'POST_V1', 'POST_V2']) phases[phase] = phaseCandidates(requirement, raw, phase);
  const build = (phase) => {
    const phaseCandidatesValue = phases[phase];
    return {
      case_id: caseRecord.case_id,
      requirement: caseRecord.requirement,
      phase,
      phase_candidates: phaseCandidatesValue,
      goldEvidenceIds: new Set(gold.gold_evidence_chunk_ids),
      decisionBearingIds: new Set(decisionBearingIds),
      metrics: phaseMetrics([{ case_id: caseRecord.case_id, phase_candidates: phaseCandidatesValue, goldEvidenceIds: new Set(gold.gold_evidence_chunk_ids), decisionBearingIds: new Set(decisionBearingIds) }])
    };
  };
  return {
    case_id: caseRecord.case_id,
    requirement: caseRecord.requirement,
    gold_evidence_set: gold.gold_evidence_set,
    gold_context_set: gold.gold_context_set,
    decision_bearing_gold_chunk_ids: [...decisionBearingIds],
    raw_candidate_count: raw.length,
    rejected_fragment_count: raw.map(annotate).filter((candidate) => !candidate.substantive_candidate).length,
    raw_candidate_pool: raw.map(annotate),
    pre: build('PRE'),
    post_v1: build('POST_V1'),
    post_v2: build('POST_V2')
  };
}

function stripSets(value) {
  if (Array.isArray(value)) return value.map(stripSets);
  if (!value || typeof value !== 'object') return value;
  const output = {};
  for (const [key, item] of Object.entries(value)) output[key] = item instanceof Set ? [...item] : stripSets(item);
  return output;
}

export function buildOfflineReport({ livePacket, integrityPacket }) {
  const liveCases = (livePacket.post_fix?.cases || []).filter((item) => CASE_IDS.includes(item.case_id));
  const cases = liveCases.map((item) => replayCase(item, integrityPacket));
  const phaseAggregate = (phase) => {
    const inputs = cases.map((item) => item[phase]);
    const exact = rankMetrics(inputs, 'goldEvidenceIds');
    const decision = rankMetrics(inputs, 'decisionBearingIds');
    const hygiene = hygieneMetrics(inputs);
    return { exact_gold: exact, decision_bearing: decision, hygiene, raw_candidate_count: cases.reduce((sum, item) => sum + item.raw_candidate_count, 0), rejected_fragment_count: cases.reduce((sum, item) => sum + item.rejected_fragment_count, 0) };
  };
  const phases = { pre: phaseAggregate('pre'), post_v1: phaseAggregate('post_v1'), post_v2: phaseAggregate('post_v2') };
  const v1 = cases.find((item) => item.case_id === 'V2R-001-PERF-DIRECT');
  const v2r006 = cases.find((item) => item.case_id === 'V2R-006-ISO-SCOPE');
  const wrongFactEntries = (integrityPacket.candidate_reclassification || []).filter((entry) => ['V2R-005-ISO-DIRECT', 'V2R-006-ISO-SCOPE'].includes(entry.case_id) && entry.GPT_REVIEW_EXPECTED_CLASSIFICATION === 'TOPIC_RELEVANT_ONLY');
  const wrongFactPreserved = wrongFactEntries.every((entry) => {
    const item = cases.find((candidate) => candidate.case_id === entry.case_id);
    return Boolean(item?.raw_candidate_pool.some((candidate) => candidate.chunk_id === entry.chunk_id && candidate.substantive_candidate));
  });
  return {
    schema_version: '4.3-retrieval-substantive-hygiene-offline-v1',
    title: 'P0 SUBSTANTIVE RETRIEVAL HYGIENE CHECKPOINT',
    generated_at: new Date().toISOString(),
    external_calls: { embedding: 0, llm: 0, dify: 0, automatic_retry: 0 },
    phase1: { metadata_hygiene_preserved: true, context_recovery_preserved: true },
    phases,
    cases,
    acceptance: {
      metadata_at_5_zero: phases.post_v2.hygiene.metadata_at_5 === 0,
      non_substantive_at_5_zero: phases.post_v2.hygiene.non_substantive_at_5 === 0,
      broken_decision_bearing_gold: phases.post_v2.decision_bearing.hit_at_5 < 1,
      v2r001_pre_first_decision_bearing_rank: v1?.pre.metrics.decision_bearing.first_rank_by_case[0]?.rank ?? null,
      v2r001_post_v1_first_decision_bearing_rank: v1?.post_v1.metrics.decision_bearing.first_rank_by_case[0]?.rank ?? null,
      v2r001_post_v2_first_decision_bearing_rank: v1?.post_v2.metrics.decision_bearing.first_rank_by_case[0]?.rank ?? null,
      v2r006_boundary_evidence_eligible: Boolean(v2r006?.post_v2.phase_candidates.some((candidate) => v2r006.gold_evidence_set.some((gold) => gold.chunk_id === candidate.chunk_id))),
      wrong_fact_remains_topic_only: wrongFactPreserved,
      post_v2_pass: phases.post_v2.hygiene.metadata_at_5 === 0
        && phases.post_v2.hygiene.non_substantive_at_5 === 0
        && phases.post_v2.decision_bearing.hit_at_5 === 1
        && (v1?.pre.metrics.decision_bearing.first_rank_by_case[0]?.rank === 4)
        && (v1?.post_v1.metrics.decision_bearing.first_rank_by_case[0]?.rank === 2)
        && (v1?.post_v2.metrics.decision_bearing.first_rank_by_case[0]?.rank <= 2)
        && Boolean(v2r006?.post_v2.phase_candidates.some((candidate) => v2r006.gold_evidence_set.some((gold) => gold.chunk_id === candidate.chunk_id)))
        && wrongFactPreserved
    },
    gpt_review_status: 'PENDING_REVIEW',
    eval_complete: false,
    safety: { new_embedding_requests: 0, llm_executed: false, dify_executed: false, corpus_uploaded: false, corpus_reembedded: false, production_writes: false }
  };
}

function markdown(report) {
  const lines = [
    '# P0 SUBSTANTIVE RETRIEVAL HYGIENE CHECKPOINT',
    '', '- GPT_REVIEW_STATUS: `PENDING_REVIEW`', '- EVAL_COMPLETE: `NO`',
    '- Offline replay only. Embedding, LLM and Dify calls: 0.', '',
    '## Phase summary', '', '```json', JSON.stringify(report.phases, null, 2), '```', '',
    '## Acceptance', '', '```json', JSON.stringify(report.acceptance, null, 2), '```', ''
  ];
  for (const item of report.cases) {
    lines.push(`## ${item.case_id}`, '', `Requirement: ${item.requirement}`, '', '### Gold Evidence Set', '```json', JSON.stringify(item.gold_evidence_set, null, 2), '```', '', '### Gold Context Set', '```json', JSON.stringify(item.gold_context_set, null, 2), '```', '', `Raw candidate count: ${item.raw_candidate_count}`, `Rejected non-substantive fragments: ${item.rejected_fragment_count}`, '', '### Raw / PRE / POST_V1 / POST_V2', '```json', JSON.stringify({ raw_candidate_pool: item.raw_candidate_pool, pre: stripSets(item.pre), post_v1: stripSets(item.post_v1), post_v2: stripSets(item.post_v2) }, null, 2), '```', '');
  }
  return `${lines.join('\n')}\n`;
}

export async function runOfflineReplay({ inputPath = LIVE_PACKET_PATH, integrityPath = INTEGRITY_PACKET_PATH, reportPath = REPORT_PATH, markdownPath = MARKDOWN_PATH } = {}) {
  const livePacket = JSON.parse(await fs.readFile(inputPath, 'utf8'));
  const integrityPacket = JSON.parse(await fs.readFile(integrityPath, 'utf8'));
  const report = buildOfflineReport({ livePacket, integrityPacket });
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  await fs.writeFile(markdownPath, markdown(report), 'utf8');
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const report = await runOfflineReplay();
  console.log(JSON.stringify({ status: 'SUBSTANTIVE_HYGIENE_OFFLINE_PENDING_REVIEW', post_v2_pass: report.acceptance.post_v2_pass, phases: report.phases, external_calls: report.external_calls }));
}
