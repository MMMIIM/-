import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildHumanReviewBatch01Final } from '../eval/evidence-support/calibration-v2/build-human-review-batch-01-final.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPORT_PATH = path.resolve(HERE, '../eval/evidence-support/calibration-v2/semantic-reaudit-v2.json');
const report = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'));

test('final Batch 1 selects ten active representative cases and excludes V2R-009', () => {
  const { packet } = buildHumanReviewBatch01Final({ report });
  assert.equal(packet.active_candidate_count, 36);
  assert.equal(packet.rejected_count, 1);
  assert.equal(packet.case_count, 10);
  assert.ok(!packet.selected_case_ids.includes('V2R-009-ISO-CONFLICT'));
  assert.deepEqual(packet.status_counts, {
    EVIDENCE_REVIEW_READY: 3,
    INSUFFICIENT_EVIDENCE: 6,
    NO_RELEVANT_EVIDENCE: 1,
    CONFLICTING_EVIDENCE: 0
  });
  assert.equal(packet.rejected_cases[0].rejection_code, 'GOLD_DESIGN_INVALID');
});

test('every human review decision remains null and every case has calibration rationale', () => {
  const { packet } = buildHumanReviewBatch01Final({ report });
  assert.ok(packet.cases.every(item => item.why_this_case_is_in_calibration));
  assert.ok(packet.cases.every(item => Object.values(item.review_decision).every(value => value === null)));
  assert.equal(packet.automatic_human_approval, false);
  assert.equal(packet.dataset_frozen, false);
  assert.equal(packet.calibration_executed, false);
  assert.equal(packet.manual_sample_gate_ready, true);
  assert.equal(packet.model_calls, 0);
  assert.equal(packet.provider_calls, 0);
  assert.equal(packet.embedding_calls, 0);
});

test('packet preserves repaired business Evidence text and technical lineage', () => {
  const { packet, markdown } = buildHumanReviewBatch01Final({ report });
  const performance = packet.cases.find(item => item.case_id === 'V2R-002-PERF-PARTIAL');
  const iso = packet.cases.find(item => item.case_id === 'V2R-005-ISO-DIRECT');
  assert.match(performance.sources[0].source_text, /P95 1\.9 秒/);
  assert.match(iso.sources[0].source_text, /有效至：2027-11-30/);
  assert.ok(performance.sources[0].source_hash);
  assert.ok(performance.sources[0].chunk_id);
  for (const item of packet.cases) {
    assert.ok(item.sources.every(source => source.evidence_span_verified === true));
    assert.ok(item.sources.every(source => source.source_lineage_verified === true));
    assert.match(markdown, new RegExp(item.case_id));
  }
  assert.match(markdown, /WHY_THIS_CASE_IS_IN_CALIBRATION/);
  assert.match(markdown, /APPROVE/);
  assert.match(markdown, /CHANGE/);
  assert.match(markdown, /REJECT/);
});
