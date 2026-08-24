import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../eval/evidence-support/calibration-v2');

test('targeted GPT review packet contains all 12 cases and no metric-only completion', () => {
  const packet = JSON.parse(fs.readFileSync(path.join(HERE, 'GPT_REVIEW_PACKET.json'), 'utf8'));
  assert.equal(packet.case_count, 12);
  assert.equal(packet.case_level_results_complete, true);
  assert.equal(packet.raw_source_included, true);
  assert.equal(packet.gpt_review_packet_available, true);
  assert.equal(packet.gpt_review_status, 'PENDING_REVIEW');
  assert.equal(packet.eval_complete, false);
  assert.equal(packet.cases.length, 12);
  for (const item of packet.cases) {
    assert.ok(item.case_id);
    assert.ok(item.requirement.original_text);
    assert.ok(item.expected.material_id);
    assert.ok(item.expected.document_id);
    assert.ok(item.expected.chunk_id);
    assert.ok(item.expected.verified_evidence_span?.source_text || item.expected.expected_source_snapshot?.source_text);
    assert.ok(Array.isArray(item.actual.top_k));
    assert.ok(item.final.failure_layer);
  }
  assert.equal(packet.cases.filter(item => item.final.failure_layer === 'GOLD_INVALID').length, 12);
});
