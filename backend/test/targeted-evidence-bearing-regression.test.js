import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import { validateTargetedEvidenceBearingSet } from '../eval/evidence-support/calibration-v2/targeted-evidence-bearing-regression.js';
import { reclassifyRealRetrievalReport } from '../eval/evidence-support/calibration-v2/reclassify-real-retrieval-regression.js';

test('targeted Gold mapping does not promote legacy metadata spans and exposes formal requirement gaps', () => {
  const report = validateTargetedEvidenceBearingSet();
  assert.equal(report.requirement_relative_mapping_count, 12);
  assert.equal(report.executable_case_count, 0);
  assert.equal(report.gold_validated_count, 0);
  assert.equal(report.gold_invalid_count, 12);
  assert.equal(report.retrieval_executed, false);
  assert.equal(report.provider_calls, 0);
});

test('offline reclassification separates heuristic labels from Gold and exposes legacy metadata false evidence', async () => {
  const output = path.join(os.tmpdir(), `real-retrieval-v2-test-${process.pid}.json`);
  const report = await reclassifyRealRetrievalReport({
    output
  });
  assert.equal(report.embedding_calls, 0);
  assert.equal(report.metrics.metadata_header_false_evidence_rate, 0);
  assert.equal(report.metrics.legacy_metadata_header_false_evidence_count, 7);
  assert.equal(report.metrics.legacy_metadata_header_false_evidence_rate, 1);
  assert.equal(report.metrics.topic_relevant_false_evidence_rate, 0);
  assert.equal(report.metrics.legacy_topic_relevant_false_evidence_count, 4);
  assert.equal(report.metrics.gold_backed_evidence_bearing_hit_at_5, 'NOT_EXECUTED');
  await fs.rm(output, { force: true });
});
