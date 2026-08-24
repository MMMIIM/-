import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCalibrationV2Document } from '../eval/evidence-support/calibration-v2/candidate-pool.js';
import { auditCalibrationV2 } from '../eval/evidence-support/calibration-v2/audit.js';

test('V2 candidate pool is separate from legacy V1 and has no synthetic source', () => {
  const document = buildCalibrationV2Document();
  assert.equal(document.schema_version, '4.3-evidence-support-calibration-v2-candidate-pool');
  assert.equal(document.classification, 'CANDIDATE_POOL_ONLY / SYSTEM_DRAFT / UNREVIEWED');
  assert.ok(document.candidate_count > 0);
  assert.equal(document.synthetic_source_cases, 0);
  assert.equal(document.model_calls, 0);
  assert.equal(document.provider_calls, 0);
  assert.ok(document.cases.every(item => item.retrieval_shape === 'CURATED_REAL_SOURCE'));
});

test('every V2 source keeps valid hash, chunk and raw excerpt without claiming a span', () => {
  const document = buildCalibrationV2Document();
  const sources = document.cases.flatMap(item => item.sources);
  assert.ok(sources.length >= 10);
  assert.ok(sources.every(source => /^[0-9a-f]{64}$/u.test(source.source_hash)));
  assert.ok(sources.every(source => source.chunk_id && source.source_text));
  assert.ok(sources.every(source => source.source_span_id === null));
  assert.ok(sources.every(source => source.source_span_status === 'PENDING_FORMAL_SPAN_ID'));
});

test('draft Gold is never presented as human-reviewed Gold', () => {
  const document = buildCalibrationV2Document();
  assert.ok(document.cases.every(item => item.draft_gold.provenance === 'SYSTEM_DRAFT / UNREVIEWED'));
  assert.ok(document.cases.every(item => item.draft_gold.gold_status === null));
  assert.ok(document.cases.every(item => item.review.decision === 'PENDING'));
});

test('offline audit checks holdout overlap without consuming holdout labels', () => {
  const audit = auditCalibrationV2();
  assert.equal(audit.holdout_exact_query_overlap, 0);
  assert.equal(audit.holdout_source_span_overlap, 0);
  assert.equal(audit.model_calls, 0);
  assert.equal(audit.provider_calls, 0);
  assert.equal(audit.human_reviewed_count, 0);
  assert.equal(audit.document_id_coverage, 0);
  assert.equal(audit.source_span_id_coverage, 0);
});

