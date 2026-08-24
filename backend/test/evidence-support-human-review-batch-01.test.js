import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BATCH_01_CASE_IDS, buildHumanReviewBatch01 } from '../eval/evidence-support/calibration-v2/build-human-review-batch-01.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const poolPath = path.resolve(here, '../eval/evidence-support/calibration-v2/candidate-pool-v2-remediated.json');

function loadPool() {
  return JSON.parse(fs.readFileSync(poolPath, 'utf8'));
}

test('human review batch 1 has deliberate 10-case boundary coverage and no auto approval', () => {
  const { packet } = buildHumanReviewBatch01({ pool: loadPool() });
  assert.deepEqual(BATCH_01_CASE_IDS, packet.cases.map(item => item.case_id));
  assert.equal(packet.case_count, 10);
  assert.deepEqual(packet.status_counts, {
    EVIDENCE_REVIEW_READY: 3,
    INSUFFICIENT_EVIDENCE: 4,
    NO_RELEVANT_EVIDENCE: 2,
    CONFLICTING_EVIDENCE: 1
  });
  assert.equal(packet.challenge_or_ambiguous_count, 1);
  assert.equal(packet.automatic_gold_approval, false);
  assert.equal(packet.dataset_frozen, false);
  assert.equal(packet.calibration_executed, false);
  assert.equal(packet.model_calls, 0);
  assert.equal(packet.provider_calls, 0);
  assert.equal(packet.embedding_calls, 0);
  assert.ok(packet.class_imbalance);
});

test('review decisions are empty and source excerpts are copied exactly from the sealed pool', () => {
  const pool = loadPool();
  const byId = new Map(pool.cases.map(item => [item.case_id, item]));
  const { packet } = buildHumanReviewBatch01({ pool });
  for (const item of packet.cases) {
    const original = byId.get(item.case_id);
    assert.ok(original);
    assert.equal(item.requirement.text, original.requirement.text);
    assert.deepEqual(item.sources.map(source => source.source_text), original.sources.map(source => source.source_text));
    assert.equal(item.review_decision.reviewer_decision, null);
    assert.equal(item.review_decision.reviewer_status_override, null);
    assert.equal(item.review_decision.reviewer_semantic_override, null);
    assert.equal(item.review_decision.reviewer_reason, null);
    assert.equal(item.review_decision.reviewed_at, null);
    assert.equal(item.system_draft.provenance, 'SYSTEM_DRAFT_UNREVIEWED');
  }
});

test('conflict and ambiguity remain visible without changing the formal draft status', () => {
  const { packet } = buildHumanReviewBatch01({ pool: loadPool() });
  const conflict = packet.cases.find(item => item.case_id === 'V2R-009-ISO-CONFLICT');
  const challenge = packet.cases.find(item => item.case_id === 'V2R-004-COMP-PARTIAL');
  assert.equal(conflict.system_draft.status, 'CONFLICTING_EVIDENCE');
  assert.equal(conflict.system_draft.conflict_observations.length, 2);
  assert.equal(challenge.system_draft.status, 'INSUFFICIENT_EVIDENCE');
  assert.ok(challenge.requirement.boundary_tags.includes('unknown'));
});
