import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { classifyEvidenceBearing } from '../src/pipeline/evidence-bearing-classifier.js';

const HERE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../eval/evidence-support/calibration-v2');

test('Gold lineage invariant rejects persisted multi-chunk spans and records deterministic repaired slices', () => {
  const packet = JSON.parse(fs.readFileSync(path.join(HERE, 'GPT_REVIEW_PACKET_RETRIEVAL_EVAL_INTEGRITY.json'), 'utf8'));
  assert.equal(packet.external_calls.embedding, 0);
  assert.equal(packet.gold_binding_audit.length, 7);
  assert.equal(packet.gold_binding_audit.filter(item => item.persisted_span_validity === 'VALID_MULTI_CHUNK_EVIDENCE_SPAN').length, 7);
  assert.equal(packet.gold_binding_audit.filter(item => item.classification === 'RETRIEVAL_GOLD_BINDING_REQUIRES_DERIVATION').length, 7);
  assert.equal(packet.gold_binding_audit.filter(item => item.repaired_binding?.status === 'RETRIEVAL_GOLD_DERIVED').length, 7);
  const iso = packet.gold_binding_audit.find(item => item.case_id === 'V2R-005-ISO-DIRECT');
  assert.equal(iso.expected.chunk_id, 'MCH-0820CC5A439CB986C62E46213029CC71');
  assert.equal(iso.repaired_binding.chunk_id, 'MCH-A4C2632EF9126FADD349C3004E1C2D84');
  assert.equal(iso.repaired_binding.note.includes('not HUMAN_GOLD'), true);
  assert.equal(packet.human_gold_modified, false);
});

test('35-candidate audit is separate from runtime classifier and records review expectations', () => {
  const packet = JSON.parse(fs.readFileSync(path.join(HERE, 'GPT_REVIEW_PACKET_RETRIEVAL_EVAL_INTEGRITY.json'), 'utf8'));
  assert.equal(packet.candidate_reclassification.length, 35);
  assert.equal(packet.gpt_review_status, 'GPT_REVIEWED_REGRESSION_EXPECTATION');
  assert.ok(packet.candidate_reclassification.every(item => item.human_gold === false));
  assert.ok(packet.candidate_reclassification.every(item => item.GPT_REVIEW_EXPECTED_CLASSIFICATION));
  assert.equal(packet.metadata_pollution.metadata_total, 14);
  assert.equal(packet.metadata_pollution.metadata_at_1.candidate_count, 2);
  assert.equal(packet.metadata_pollution.metadata_at_3.candidate_count, 10);
  assert.equal(packet.metadata_pollution.metadata_at_5.candidate_count, 14);
  assert.equal(packet.offline_metrics.decision_bearing_hit_at_5, 1);
  assert.equal(packet.offline_metrics.denominator, 6);
  assert.equal(packet.offline_metrics.decision_bearing_hit_at_3, 5 / 6);
  assert.equal(packet.offline_metrics.gold_expected_rank_mrr, 0.6805555555555555);
  assert.equal(packet.audit_summary.corrected_evidence_bearing_count, 9);
  assert.equal(packet.audit_summary.false_positive_count, 4);
  assert.equal(packet.audit_summary.persisted_evidence_spans_valid, 7);
  assert.equal(packet.audit_summary.repaired_eval_bindings_valid, 7);
});

test('classifier audit expectations reject the three confirmed false positives', () => {
  const packet = JSON.parse(fs.readFileSync(path.join(HERE, 'GPT_REVIEW_PACKET_RETRIEVAL_EVAL_INTEGRITY.json'), 'utf8'));
  for (const key of [
    ['V2R-001-PERF-DIRECT', 2],
    ['V2R-003-COMP-DIRECT', 3],
    ['V2R-005-ISO-DIRECT', 5]
  ]) {
    const item = packet.candidate_reclassification.find(value => value.case_id === key[0] && value.rank === key[1]);
    assert.equal(item.GPT_REVIEW_EXPECTED_CLASSIFICATION, 'TOPIC_RELEVANT_ONLY');
    assert.notEqual(item.runtime_previous_classification, 'TOPIC_RELEVANT_ONLY');
  }
  const direct = classifyEvidenceBearing({
    requirement: { text: '企业应提供当前有效的 ISO/IEC 27001 认证信息。' },
    sourceText: '名称：ISO 9001\n编号：CM-Q-9001-2025\n状态：active\n有效至：2028-03-31'
  });
  assert.equal(direct.classification, 'TOPIC_RELEVANT_ONLY');
});

test('qualification packet has no READY Gold after exact-span invariant enforcement', () => {
  const packet = JSON.parse(fs.readFileSync(path.join(HERE, 'GPT_REVIEW_PACKET_GOLD_QUALIFICATION.json'), 'utf8'));
  assert.equal(packet.aggregate.GOLD_READY_FOR_RETRIEVAL, 0);
  assert.equal(packet.aggregate.GOLD_LINEAGE_INVALID, 0);
  assert.equal(packet.aggregate.RETRIEVAL_GOLD_BINDING_REQUIRES_DERIVATION, 7);
  assert.equal(packet.external_calls.embedding, 0);
});
