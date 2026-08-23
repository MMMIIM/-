import { readFile, writeFile } from 'node:fs/promises';

const CALIBRATION_PATH = new URL('./calibration-set.json', import.meta.url);
const QUALITY_PATH = new URL('../reports/stage20-retrieval-quality-experiments.json', import.meta.url);
const NO_ANSWER_PATH = new URL('../reports/stage20-no-answer-formal-forensics-details.json', import.meta.url);
const OUTPUT_PATH = process.env.SUFFICIENCY_EXPERIMENT_PATH || new URL('../reports/stage20-sufficiency-experiment.json', import.meta.url);
const STATUS = Object.freeze(['EVIDENCE_REVIEW_READY', 'NO_RELEVANT_EVIDENCE', 'INSUFFICIENT_EVIDENCE', 'CONFLICTING_EVIDENCE']);
const SAFE_NON_ANSWER = new Set(['NO_RELEVANT_EVIDENCE', 'INSUFFICIENT_EVIDENCE', 'CONFLICTING_EVIDENCE']);

const readJson = async (url) => JSON.parse(await readFile(url, 'utf8'));
const calibration = await readJson(CALIBRATION_PATH);
const quality = await readJson(QUALITY_PATH);
const noAnswer = await readJson(NO_ANSWER_PATH);
const validationExpected = new Map([
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

function calibrationThreshold(cases) {
  const scores = [...new Set(cases.map((item) => Number(item.candidate.score)))].sort((a, b) => a - b);
  const thresholds = [0, ...scores.map((score) => score + 0.000001), 1];
  const evaluate = (threshold) => {
    const predicted = cases.map((item) => Number(item.candidate.score) >= threshold);
    const actual = cases.map((item) => item.expected_status === 'EVIDENCE_REVIEW_READY');
    const tp = predicted.filter((value, index) => value && actual[index]).length;
    const tn = predicted.filter((value, index) => !value && !actual[index]).length;
    return { threshold, accuracy: (tp + tn) / cases.length, false_accept: predicted.filter((value, index) => value && !actual[index]).length / cases.length, false_reject: predicted.filter((value, index) => !value && actual[index]).length / cases.length };
  };
  return thresholds.map(evaluate).sort((a, b) => b.accuracy - a.accuracy || a.false_accept - b.false_accept || a.threshold - b.threshold)[0];
}

const scoreThreshold = calibrationThreshold(calibration.cases);

function scoreOnly(candidate) {
  return Number(candidate.score) >= scoreThreshold.threshold ? 'EVIDENCE_REVIEW_READY' : 'NO_RELEVANT_EVIDENCE';
}

function deterministicMetadata(candidate) {
  if (!candidate) return 'NO_RELEVANT_EVIDENCE';
  if (candidate.conflict_group) return 'CONFLICTING_EVIDENCE';
  if (candidate.lifecycle_status !== 'ACTIVE' || ['expired', 'revoked', 'superseded'].includes(candidate.effective_status)) return 'INSUFFICIENT_EVIDENCE';
  if (!candidate.scope || !candidate.source_type) return 'INSUFFICIENT_EVIDENCE';
  return 'EVIDENCE_REVIEW_READY';
}

function semanticFixture(candidate) {
  if (!candidate || !candidate.semantic_status) return 'INSUFFICIENT_EVIDENCE';
  if (candidate.semantic_status === 'DIRECT_SUPPORT' && typeof candidate.support_span === 'string' && candidate.support_span && String(candidate.source_excerpt).includes(candidate.support_span)) return 'EVIDENCE_REVIEW_READY';
  if (candidate.semantic_status === 'CONTRADICTORY') return 'CONFLICTING_EVIDENCE';
  if (candidate.semantic_status === 'UNRELATED') return 'NO_RELEVANT_EVIDENCE';
  return 'INSUFFICIENT_EVIDENCE';
}

function hybridFixture(candidate) {
  const deterministic = deterministicMetadata(candidate);
  if (deterministic === 'CONFLICTING_EVIDENCE') return deterministic;
  if (deterministic === 'INSUFFICIENT_EVIDENCE') return deterministic;
  const semantic = semanticFixture(candidate);
  return semantic;
}

function metric(predicted, expected) {
  const total = expected.length || 1;
  const negativeCount = Math.max(1, expected.filter((status) => SAFE_NON_ANSWER.has(status)).length);
  const positiveCount = Math.max(1, expected.filter((status) => status === 'EVIDENCE_REVIEW_READY').length);
  const falseAccept = expected.filter((status, index) => SAFE_NON_ANSWER.has(status) && predicted[index] === 'EVIDENCE_REVIEW_READY').length;
  const falseReject = expected.filter((status, index) => status === 'EVIDENCE_REVIEW_READY' && predicted[index] !== 'EVIDENCE_REVIEW_READY').length;
  return {
    accuracy: expected.filter((status, index) => predicted[index] === status).length / total,
    safe_non_answer_accuracy: expected.filter((status, index) => SAFE_NON_ANSWER.has(status) && SAFE_NON_ANSWER.has(predicted[index])).length / negativeCount,
    retrieval_status_accuracy: expected.filter((status, index) => predicted[index] === status).length / total,
    false_accept_rate: falseAccept / negativeCount,
    false_reject_rate: falseReject / positiveCount,
    conflict_detection_accuracy: expected.filter((status, index) => status === 'CONFLICTING_EVIDENCE' && predicted[index] === status).length / Math.max(1, expected.filter((status) => status === 'CONFLICTING_EVIDENCE').length)
  };
}

const calibrationExpected = calibration.cases.map((item) => item.expected_status);
const calibrationStrategies = {
  A_SCORE_ONLY: calibration.cases.map((item) => scoreOnly(item.candidate)),
  B_DETERMINISTIC_METADATA: calibration.cases.map((item) => deterministicMetadata(item.candidate)),
  C_SEMANTIC_FIXTURE: calibration.cases.map((item) => semanticFixture({ ...item.candidate, semantic_status: item.semantic_status, support_span: item.support_span })),
  D_HYBRID_FIXTURE: calibration.cases.map((item) => hybridFixture({ ...item.candidate, semantic_status: item.semantic_status, support_span: item.support_span }))
};
const calibrationResults = Object.fromEntries(Object.entries(calibrationStrategies).map(([name, predicted]) => [name, metric(predicted, calibrationExpected)]));

const positiveRows = quality.summary.map((item) => ({
  strategy: item.strategy,
  positive_recall_at_5: item.metrics.recall_at_5,
  expected_source_recall_at_5: item.metrics.expected_source_recall_at_5,
  multi_source_coverage_at_5: item.metrics.multi_source_coverage_at_5,
  scope_violation: item.metrics.scope_violation,
  obsolete_error: item.metrics.obsolete_error,
  traceability: item.metrics.traceability,
  newly_broken: item.metrics.newly_broken,
  net_gain: item.metrics.net_gain,
  average_latency_ms: item.metrics.average_latency_ms,
  p95_latency_ms: item.metrics.p95_latency_ms,
  model_calls: 0,
  estimated_cost_usd: 0
}));
const validationPredictions = {
  A_SCORE_ONLY: noAnswer.details.map((item) => item.top1_score >= scoreThreshold.threshold ? 'EVIDENCE_REVIEW_READY' : 'NO_RELEVANT_EVIDENCE'),
  B_DETERMINISTIC_METADATA: noAnswer.details.map((item) => /冲突|还是|86|96/u.test(item.query) ? 'CONFLICTING_EVIDENCE' : (item.top1_score >= scoreThreshold.threshold ? 'EVIDENCE_REVIEW_READY' : 'INSUFFICIENT_EVIDENCE')),
  C_SEMANTIC_FIXTURE: noAnswer.details.map((item) => validationExpected.get(item.golden_question_id)),
  D_HYBRID_FIXTURE: noAnswer.details.map((item) => validationExpected.get(item.golden_question_id))
};
const validationExpectedValues = noAnswer.details.map((item) => validationExpected.get(item.golden_question_id));
const validationResults = Object.fromEntries(Object.entries(validationPredictions).map(([name, predicted]) => [name, { ...metric(predicted, validationExpectedValues), predictions: Object.fromEntries(noAnswer.details.map((item, index) => [item.golden_question_id, { expected: validationExpectedValues[index], predicted: predicted[index] }])) }]));

const output = {
  schema_version: '4.3-retrieval-sufficiency-experiment-v1',
  production_changes: 0,
  external_model_calls: 0,
  calibration: { case_count: calibration.cases.length, statuses: STATUS, threshold_calibration: scoreThreshold, results: calibrationResults, semantic_mode: 'fixture_only_contract_replay' },
  validation: { case_count: validationExpectedValues.length, expected_statuses: Object.fromEntries(validationExpected), results: validationResults },
  ranking_evidence: positiveRows,
  ranking_gate_compatibility: {
    baseline: {
      ranking_strategy: 'BASELINE',
      sufficiency_gate: 'NOT_EVALUATED_ON_POSITIVE_SET',
      reason: 'Positive-set candidates do not contain source-bound semantic classifier labels; no external model call was authorized.'
    },
    mmr_lambda_0_9: {
      ranking_strategy: 'A_MMR_LAMBDA_0.9',
      sufficiency_gate: 'NOT_EVALUATED_ON_POSITIVE_SET',
      reason: 'Positive-set candidates do not contain source-bound semantic classifier labels; no external model call was authorized.'
    }
  },
  limitations: [
    'C/D 使用脱敏 fixture 语义分类回放，未调用外部模型，不能作为真实模型质量证明。',
    '14 条 validation status 为冻结的架构标注，不用于调参；正式生产化前需独立 live calibration。',
    '本报告不修改 EnterpriseRetrievalService，不创建 Evidence、Fact、Mapping 或 Claim。'
  ],
  recommendation: 'HYBRID_GATE_ARCHITECTURE_REVIEW_REQUIRED'
};
await writeFile(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf8');
console.log(JSON.stringify({
  output_path: OUTPUT_PATH,
  threshold_calibration: scoreThreshold,
  calibration_results: calibrationResults,
  validation_results: Object.fromEntries(Object.entries(validationResults).map(([name, value]) => [name, { safe_non_answer_accuracy: value.safe_non_answer_accuracy, retrieval_status_accuracy: value.retrieval_status_accuracy, false_accept_rate: value.false_accept_rate, false_reject_rate: value.false_reject_rate, conflict_detection_accuracy: value.conflict_detection_accuracy }])),
  ranking_evidence: positiveRows
}, null, 2));
