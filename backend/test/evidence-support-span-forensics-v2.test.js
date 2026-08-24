import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../eval/evidence-support/calibration-v2');
const read = name => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));

test('forensics distinguishes lineage verification from evidence span verification', () => {
  const report = read('evidence-span-forensics-v2.json');
  assert.deepEqual(report.root_cause, { review_packet_rendering_bug: false, candidate_source_span_selection_bug: true, both: false });
  assert.equal(report.case_metrics.total, 37);
  assert.equal(report.case_metrics.source_lineage_verified, 37);
  assert.equal(report.case_metrics.evidence_span_verified, 36);
  assert.equal(report.case_metrics.evidence_span_invalid, 1);
  assert.equal(report.case_metrics.evidence_span_ambiguous, 0);
  assert.equal(report.source_metrics.source_lineage_verified, 38);
  assert.equal(report.source_metrics.evidence_span_verified, 37);
  assert.equal(report.source_metrics.evidence_span_invalid, 1);
  assert.equal(report.source_metrics.evidence_span_ambiguous, 0);
  assert.equal(report.model_calls, 0);
  assert.equal(report.provider_calls, 0);
  assert.equal(report.embedding_calls, 0);
  assert.equal(report.db_mutation, false);
});

test('Batch 1 repaired spans contain actual business text and preserve exact offsets/hashes', () => {
  const report = read('evidence-span-forensics-v2.json');
  const batch = report.cases.filter(item => item.batch_01);
  assert.equal(batch.length, 10);
  const performance = batch.find(item => item.case_id === 'V2R-001-PERF-DIRECT');
  const compatibility = batch.find(item => item.case_id === 'V2R-003-COMP-DIRECT');
  const iso = batch.find(item => item.case_id === 'V2R-005-ISO-DIRECT');
  assert.match(performance.sources[0].repaired_span.source_text, /P95 1\.9 秒/);
  assert.match(compatibility.sources[0].repaired_span.source_text, /x86_64 \+ Ubuntu 22\.04 \+ PostgreSQL 14/);
  assert.match(iso.sources[0].repaired_span.source_text, /有效至：2027-11-30/);
  for (const item of batch.filter(item => item.case_id !== 'V2R-009-ISO-CONFLICT')) {
    assert.ok(item.sources.every(source => source.evidence_span_status === 'EVIDENCE_SPAN_VERIFIED'));
    assert.ok(item.sources.every(source => Number.isInteger(source.repaired_span.start_offset)));
    assert.ok(item.sources.every(source => /^[0-9a-f]{64}$/.test(source.repaired_span.source_hash)));
  }
});

test('ISO conflict is rejected when the second source has no expiry fact', () => {
  const report = read('evidence-span-forensics-v2.json');
  const conflict = report.conflict;
  assert.equal(conflict.conflict_gold_valid, false);
  assert.deepEqual(conflict.actual_conflicting_values, []);
  assert.equal(conflict.classification, 'GOLD_DESIGN_INVALID');
  const caseReport = report.cases.find(item => item.case_id === 'V2R-009-ISO-CONFLICT');
  assert.equal(caseReport.case_still_valid, false);
  assert.equal(caseReport.case_status, 'EVIDENCE_SPAN_INVALID');
  assert.equal(caseReport.sources[1].evidence_span_status, 'EVIDENCE_SPAN_INVALID');
  assert.equal(caseReport.sources[1].reason, 'CONFLICT_DIMENSION_NOT_OBSERVED_IN_SOURCE');
});

test('repaired pool and V2 packet remain blocked and never prefill human decisions', () => {
  const pool = read('candidate-pool-v2-evidence-span-repaired.json');
  const packet = read('human-review-batch-01-v2.json');
  assert.equal(pool.classification, 'HUMAN_REVIEW_BLOCKED_BY_EVIDENCE_SPAN_QUALITY');
  assert.equal(packet.status, 'HUMAN_REVIEW_BLOCKED_BY_EVIDENCE_SPAN_QUALITY');
  assert.equal(packet.case_count, 10);
  assert.ok(packet.cases.every(item => item.review_decision.reviewer_decision === null));
  assert.ok(packet.cases.every(item => item.system_draft.provenance === 'SYSTEM_DRAFT_UNREVIEWED'));
  assert.equal(packet.model_calls, 0);
  assert.equal(packet.provider_calls, 0);
  assert.equal(packet.embedding_calls, 0);
  assert.equal(packet.dataset_frozen, false);
  assert.equal(packet.calibration_executed, false);
  const performance = packet.cases.find(item => item.case_id === 'V2R-001-PERF-DIRECT');
  assert.match(performance.sources[0].source_text, /P95 1\.9 秒/);
  assert.match(performance.sources[0].context_before, /性能测试记录/);
});
