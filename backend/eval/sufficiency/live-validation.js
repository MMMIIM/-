import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createBackendRuntime } from '../../src/backend-runtime.js';
import { createPool } from '../../src/db.js';
import { assessSufficiencyCase, SUFFICIENCY_CLASSIFIER_VERSION } from './live-classifier.js';
import { LIVE_CALIBRATION_CASES } from './live-calibration-set.js';

const ROOT = new URL('../../', import.meta.url);
const QUALITY_REPORT = new URL('../reports/stage20-retrieval-quality-experiments.json', import.meta.url);
const NO_ANSWER_REPORT = new URL('../reports/stage20-no-answer-formal-forensics-details.json', import.meta.url);
const GOLD_QUESTIONS = new URL('../corpus/l3-gold-questions-v2.json', import.meta.url);
const OUTPUT_PATH = process.env.SUFFICIENCY_LIVE_REPORT_PATH || new URL('../reports/stage20-live-sufficiency-validation.json', import.meta.url);
const EXPECTED_NEGATIVE_STATUS = new Map([
  ['GEN-025', 'NO_RELEVANT_EVIDENCE'],
  ['GOV-039', 'INSUFFICIENT_EVIDENCE'],
  ['HEALTH-040', 'INSUFFICIENT_EVIDENCE'],
  ['ENT-005', 'INSUFFICIENT_EVIDENCE'],
  ['ENT-012', 'INSUFFICIENT_EVIDENCE'],
  ['ENT-014', 'CONFLICTING_EVIDENCE'],
  ['ENT-015', 'INSUFFICIENT_EVIDENCE'],
  ['ENT-023', 'INSUFFICIENT_EVIDENCE'],
  ['ENT-024', 'INSUFFICIENT_EVIDENCE'],
  ['ENT-025', 'INSUFFICIENT_EVIDENCE'],
  ['ENT-026', 'CONFLICTING_EVIDENCE'],
  ['ENT-027', 'INSUFFICIENT_EVIDENCE'],
  ['ENT-028', 'INSUFFICIENT_EVIDENCE'],
  ['ENT-032', 'INSUFFICIENT_EVIDENCE']
]);

const readJson = async (url) => JSON.parse(await readFile(url, 'utf8'));
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const hostOf = (base) => { try { return new URL(base).hostname; } catch { return 'invalid'; } };
const portOf = (base) => { try { const url = new URL(base); return Number(url.port || (url.protocol === 'https:' ? 443 : 80)); } catch { return null; } };
const percentile95 = (values) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1)];
};
const average = (values) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;

function toCandidate(item, source, index) {
  return {
    candidate_id: `${item.chunk_id}:${index + 1}`,
    source_type: item.material_type || 'unknown',
    material_metadata: {
      material_name: item.material_name || 'unknown',
      corpus_scope: item.corpus_scope || 'unknown',
      lifecycle_status: item.lifecycle_status || 'ACTIVE',
      effective_status: item.effective_status || 'current'
    },
    safe_excerpt: String(source?.source_text || source?.source_text_preview || '').slice(0, 1200),
    similarity: Number(item.similarity ?? item.score ?? item.similarity_score ?? 0),
    lineage: {
      material_id: item.material_id || source?.material_id || null,
      chunk_id: item.chunk_id,
      source_hash: source?.chunk_hash || null
    }
  };
}

async function loadSources(pool, chunkIds) {
  if (!chunkIds.length) return new Map();
  const { rows } = await pool.query(`
    SELECT c.chunk_id, c.material_id, c.source_text, c.chunk_hash,
           m.original_name AS material_name, m.material_type, m.corpus_scope,
           m.lifecycle_status, m.effective_status
    FROM material_chunks c
    JOIN company_materials m ON m.id = c.material_id
    WHERE c.chunk_id = ANY($1::text[])
  `, [chunkIds]);
  return new Map(rows.map((row) => [row.chunk_id, row]));
}

function rankingRows(quality, strategy) {
  const detail = quality.detailed.find((item) => item.strategy === strategy);
  if (!detail) throw new Error(`missing ranking strategy: ${strategy}`);
  return new Map(detail.per_question.map((item) => [item.query_id, item]));
}

async function buildPositiveCases(pool, quality, goldQuestions, strategy) {
  const questions = goldQuestions.questions.filter((item) => item.expected_no_answer !== true && Array.isArray(item.expected_material_ids) && item.expected_material_ids.length > 0);
  if (questions.length !== 121) throw new Error(`positive validation set must contain 121 cases, got ${questions.length}`);
  const rows = rankingRows(quality, strategy);
  const selected = questions.map((question) => {
    const row = rows.get(question.query_id);
    if (!row) throw new Error(`missing persisted ranking row: ${question.query_id}`);
    return row.selected.slice(0, 5);
  });
  const chunkIds = [...new Set(selected.flat().map((item) => item.chunk_id))];
  const sources = await loadSources(pool, chunkIds);
  return questions.map((question, index) => ({
    id: question.query_id,
    query: question.text,
    expected_status: 'EVIDENCE_REVIEW_READY',
    candidates: selected[index].map((item, candidateIndex) => toCandidate(item, sources.get(item.chunk_id), candidateIndex))
  }));
}

async function buildNegativeCases(pool, noAnswer) {
  const rows = noAnswer.details;
  if (rows.length !== 14) throw new Error(`negative validation set must contain 14 cases, got ${rows.length}`);
  const chunkIds = [...new Set(rows.flatMap((item) => item.top5.map((candidate) => candidate.chunk_id)))];
  const sources = await loadSources(pool, chunkIds);
  return rows.map((row) => ({
    id: row.golden_question_id,
    query: row.query,
    expected_status: EXPECTED_NEGATIVE_STATUS.get(row.golden_question_id),
    candidates: row.top5.map((item, index) => toCandidate(item, sources.get(item.chunk_id), index))
  }));
}

function summarizeRun(cases, results, { includeDetails = false } = {}) {
  const expected = cases.map((item) => item.expected_status);
  const predicted = results.map((item) => item.retrieval_status);
  const negativeCount = Math.max(1, expected.filter((status) => status !== 'EVIDENCE_REVIEW_READY').length);
  const positiveCount = Math.max(1, expected.filter((status) => status === 'EVIDENCE_REVIEW_READY').length);
  const safeNegative = expected.filter((status, index) => status !== 'EVIDENCE_REVIEW_READY' && predicted[index] !== 'EVIDENCE_REVIEW_READY').length / negativeCount;
  const falseAccept = expected.filter((status, index) => status !== 'EVIDENCE_REVIEW_READY' && predicted[index] === 'EVIDENCE_REVIEW_READY').length / negativeCount;
  const falseReject = expected.filter((status, index) => status === 'EVIDENCE_REVIEW_READY' && predicted[index] !== 'EVIDENCE_REVIEW_READY').length / positiveCount;
  const conflicts = expected.filter((status) => status === 'CONFLICTING_EVIDENCE').length;
  const conflictDetected = expected.filter((status, index) => status === 'CONFLICTING_EVIDENCE' && predicted[index] === 'CONFLICTING_EVIDENCE').length / Math.max(1, conflicts);
  const spanChecks = results.filter((item) => item.ok).flatMap((item) => item.assessments || []);
  const requiredSpans = spanChecks.filter((item) => ['DIRECT_SUPPORT', 'PARTIAL_SUPPORT', 'CONTRADICTORY'].includes(item.classification));
  const spanValidity = requiredSpans.length ? requiredSpans.filter((item) => typeof item.support_span === 'string' && item.support_span.length > 0).length / requiredSpans.length : null;
  const latencies = results.map((item) => item.elapsed_ms).filter((item) => Number.isFinite(item));
  const errorCodeCounts = Object.fromEntries(Object.entries(results.filter((item) => !item.ok).reduce((counts, item) => {
    const code = item.error_code || 'SUFFICIENCY_ASSESSMENT_FAILED';
    counts[code] = (counts[code] || 0) + 1;
    return counts;
  }, {})));
  const summary = {
    case_count: cases.length,
    json_validity: results.filter((item) => item.ok).length / Math.max(1, cases.length),
    status_accuracy: expected.filter((status, index) => status === predicted[index]).length / Math.max(1, cases.length),
    safe_non_answer_accuracy: safeNegative,
    false_accept_rate: falseAccept,
    false_reject_rate: falseReject,
    conflict_detection_accuracy: conflictDetected,
    support_span_validity: spanValidity,
    technical_assessment_failures: results.filter((item) => !item.ok).length,
    error_code_counts: errorCodeCounts,
    average_latency_ms: average(latencies),
    p95_latency_ms: percentile95(latencies),
    model_calls: cases.length,
    token_usage: null,
    estimated_cost: null
  };
  if (includeDetails) summary.cases = Object.fromEntries(results.map((result, index) => [cases[index].id, {
    expected: expected[index], predicted: predicted[index], ok: result.ok, error_code: result.error_code || null
  }]));
  return summary;
}

async function readGatewayInfo(runtime) {
  const apiBase = String(runtime.env.V43_GATEWAY_API_BASE || '').trim().replace(/\/+$/, '');
  const apiKey = String(runtime.env.V43_GATEWAY_API_KEY || '').trim();
  if (!apiBase || !apiKey) throw new Error('GATEWAY_NOT_CONFIGURED');
  const response = await fetch(`${apiBase}/info`, { method: 'GET', headers: { Authorization: `Bearer ${apiKey}` } });
  if (!response.ok) throw new Error(`GATEWAY_INFO_HTTP_${response.status}`);
  const info = await response.json();
  return {
    provider: 'semantic_gateway',
    gateway_host: hostOf(apiBase),
    gateway_port: portOf(apiBase),
    application_name: String(info.name || info.app_name || 'unknown').slice(0, 120),
    model: typeof info.model === 'string' ? info.model.slice(0, 120) : (typeof info.model_name === 'string' ? info.model_name.slice(0, 120) : null),
    temperature: runtime.env.V43_GATEWAY_TEMPERATURE ? Number(runtime.env.V43_GATEWAY_TEMPERATURE) : null,
    workflow_version: runtime.env.V43_GATEWAY_WORKFLOW_VERSION || null,
    timeout_ms: Number(runtime.env.V43_GATEWAY_TIMEOUT_MS) || 30_000
  };
}

async function runCases(client, cases, runLabel) {
  const results = [];
  for (const item of cases) {
    const result = await assessSufficiencyCase(client, item);
    results.push({ ...result, run_label: runLabel });
  }
  return results;
}

function stabilitySummary(cases, first, second) {
  const statuses = cases.map((_, index) => first[index].retrieval_status === second[index].retrieval_status);
  const assessmentConsistency = cases.map((_, index) => {
    if (!first[index].ok || !second[index].ok) return false;
    return JSON.stringify(first[index].assessments) === JSON.stringify(second[index].assessments);
  });
  const conflictCases = cases.map((item, index) => item.expected_status === 'CONFLICTING_EVIDENCE' ? index : -1).filter((index) => index >= 0);
  return {
    final_status_consistency: statuses.filter(Boolean).length / Math.max(1, statuses.length),
    candidate_classification_consistency: assessmentConsistency.filter(Boolean).length / Math.max(1, assessmentConsistency.length),
    conflict_status_consistency: conflictCases.filter((index) => statuses[index]).length / Math.max(1, conflictCases.length),
    second_run_model_calls: second.length
  };
}

const runtime = createBackendRuntime();
const info = await readGatewayInfo(runtime);
const pool = createPool(runtime.env.DATABASE_URL);
const quality = await readJson(QUALITY_REPORT);
const noAnswer = await readJson(NO_ANSWER_REPORT);
const goldQuestions = await readJson(GOLD_QUESTIONS);
const client = runtime.createSemanticGatewayClient({ logger: { warn() {} } });
const calibrationFirst = await runCases(client, LIVE_CALIBRATION_CASES, 'calibration');
const calibrationFirstSummary = summarizeRun(LIVE_CALIBRATION_CASES, calibrationFirst, { includeDetails: true });
let calibrationSecond = [];
let stability = null;
if (calibrationFirstSummary.technical_assessment_failures === 0) {
  calibrationSecond = await runCases(client, LIVE_CALIBRATION_CASES, 'stability');
  stability = stabilitySummary(LIVE_CALIBRATION_CASES, calibrationFirst, calibrationSecond);
}

const calibrationReady = calibrationFirstSummary.technical_assessment_failures === 0
  && (stability?.final_status_consistency || 0) >= 0.95
  && (stability?.conflict_status_consistency || 0) >= 0.95;
const frozenVersion = calibrationReady ? SUFFICIENCY_CLASSIFIER_VERSION : null;
const validation = {};
if (calibrationReady) {
  const negativeCases = await buildNegativeCases(pool, noAnswer);
  const positiveBaseline = await buildPositiveCases(pool, quality, goldQuestions, 'BASELINE');
  const positiveMmr = await buildPositiveCases(pool, quality, goldQuestions, 'A_MMR_LAMBDA_0.9');
  const baselineResults = await runCases(client, [...positiveBaseline, ...negativeCases], 'validation_baseline');
  const mmrResults = await runCases(client, [...positiveMmr, ...negativeCases], 'validation_mmr_0_9');
  validation.BASELINE_GATE = {
    positive: summarizeRun(positiveBaseline, baselineResults.slice(0, positiveBaseline.length)),
    negative: summarizeRun(negativeCases, baselineResults.slice(positiveBaseline.length), { includeDetails: true })
  };
  validation.MMR_LAMBDA_0_9_GATE = {
    positive: summarizeRun(positiveMmr, mmrResults.slice(0, positiveMmr.length)),
    negative: summarizeRun(negativeCases, mmrResults.slice(positiveMmr.length), { includeDetails: true })
  };
}
await pool.end();

const output = {
  schema_version: '4.3-live-sufficiency-validation-v1',
  classifier_version: frozenVersion,
  classifier_version_candidate: SUFFICIENCY_CLASSIFIER_VERSION,
  provider: info,
  calibration: {
    dataset: 'independent-live-calibration-set',
    case_count: LIVE_CALIBRATION_CASES.length,
    first_pass: calibrationFirstSummary,
    stability,
    second_pass_executed: calibrationSecond.length > 0
  },
  validation,
  ranking_evidence: quality.summary.filter((item) => ['BASELINE', 'A_MMR_LAMBDA_0.9'].includes(item.strategy)).map((item) => ({
    strategy: item.strategy,
    recall_at_5: item.metrics.recall_at_5,
    expected_source_recall_at_5: item.metrics.expected_source_recall_at_5,
    newly_broken: item.metrics.newly_broken,
    scope_violation: item.metrics.scope_violation,
    obsolete_error: item.metrics.obsolete_error,
    traceability: item.metrics.traceability
  })),
  safety: {
    candidate_input_is_safe_excerpt_only: true,
    gold_labels_sent_to_model: false,
    validation_labels_used_for_tuning: false,
    technical_failures_are_not_business_status: true,
    external_model_calls: calibrationFirst.length + calibrationSecond.length + Object.values(validation).reduce((sum, value) => sum + (value.positive?.model_calls || 0) + (value.negative?.model_calls || 0), 0),
    token_usage: null,
    cost: null
  },
  decision: calibrationReady ? 'LIVE_CALIBRATION_FROZEN_VALIDATION_COMPLETED' : 'LIVE_CALIBRATION_BLOCKED',
  limitations: ['SemanticGatewayClient only exposes the allowed response_payload_json; provider token usage/cost was unavailable and is reported as null.']
};
await writeFile(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf8');
console.log(JSON.stringify({
  report_path: OUTPUT_PATH,
  classifier_version: frozenVersion,
  calibration: { case_count: LIVE_CALIBRATION_CASES.length, status_accuracy: calibrationFirstSummary.status_accuracy, false_accept_rate: calibrationFirstSummary.false_accept_rate, technical_failures: calibrationFirstSummary.technical_assessment_failures, stability },
  validation: Object.fromEntries(Object.entries(validation).map(([key, value]) => [key, { positive_ready_rate: value.positive?.status_accuracy ?? null, negative_safe_accuracy: value.negative?.safe_non_answer_accuracy ?? null, negative_exact_status_accuracy: value.negative?.status_accuracy ?? null, false_accept_rate: value.negative?.false_accept_rate ?? null, conflict_detection_accuracy: value.negative?.conflict_detection_accuracy ?? null }]))
}, null, 2));
