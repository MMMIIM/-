import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../eval/evidence-support/calibration-v2');

test('targeted Retrieval Gold is qualified per case instead of blanket GOLD_INVALID', () => {
  const packet = JSON.parse(fs.readFileSync(path.join(HERE, 'GPT_REVIEW_PACKET_GOLD_QUALIFICATION.json'), 'utf8'));
  assert.equal(packet.schema_version, '4.3-targeted-retrieval-gold-qualification-v1');
  assert.equal(packet.case_count, 12);
  assert.equal(packet.case_level_results_complete, true);
  assert.equal(packet.live_retrieval_executed, false);
  assert.deepEqual(packet.external_calls, { embedding: 0, llm: 0, dify: 0, automatic_retry: 0 });
  assert.equal(packet.database_writes, 0);
  assert.equal(packet.mapping_eval, 'NOT_EXECUTED');
  assert.equal(packet.aggregate.GOLD_READY_FOR_RETRIEVAL, 0);
  assert.equal(packet.aggregate.GOLD_PARTIAL, 5);
  assert.equal(packet.aggregate.GOLD_REQUIREMENT_INVALID, 0);
  assert.equal(packet.aggregate.GOLD_LINEAGE_INVALID, 0);
  assert.equal(packet.aggregate.RETRIEVAL_GOLD_BINDING_REQUIRES_DERIVATION, 7);
  assert.equal(packet.aggregate.GOLD_CORPUS_MISMATCH, 0);
  assert.equal(packet.aggregate.span_verified, 0);
  assert.equal(packet.aggregate.current_index_verified, 9);
  assert.equal(packet.aggregate.frozen_eval_query, 12);
  assert.equal(packet.aggregate.formal_tender_requirement, 0);
  assert.equal(packet.independence.gold_leakage_audit, 'PASS');
  assert.equal(packet.independence.runtime_sees_expected_ids, false);
  assert.equal(packet.cases.length, 12);
  for (const item of packet.cases) {
    assert.match(item.eval_requirement_id, /^EVAL-RET-\d{3}$/);
    assert.equal(item.requirement.provenance, 'FROZEN_EVAL_QUERY');
    assert.equal(item.dimensions.gold_independence, 'PASS');
    assert.equal(item.execution.status, 'NOT_EXECUTED');
    assert.equal(item.execution.runtime_expected_ids_seen, false);
    assert.equal(item.safety.db_write_performed, false);
    assert.ok(item.expected_source.expected_source_text);
  }
  assert.deepEqual(packet.cases.filter((item) => item.readiness.status === 'GOLD_READY_FOR_RETRIEVAL'), []);
  for (const item of packet.cases.filter((item) => item.case_id.startsWith('V2R-00'))) {
    assert.equal(item.readiness.status, 'RETRIEVAL_GOLD_BINDING_REQUIRES_DERIVATION');
    assert.equal(item.dimensions.span_source_exact_in_expected_chunk, false);
    assert.equal(item.dimensions.span_chunk_identity, true);
  }
});
