import test from 'node:test';
import assert from 'node:assert/strict';
import {
  OFFLINE_CASE_IDS,
  runOfflineEvidenceSufficiency
} from '../eval/evidence-support/calibration-v2/evidence-sufficiency-offline.js';

test('Stage20 offline baseline evaluates all six frozen cases with exact source evidence', async () => {
  const packet = await runOfflineEvidenceSufficiency();
  assert.deepEqual(packet.cases.map(item => item.case_id), OFFLINE_CASE_IDS);
  assert.equal(packet.cases.length, 6);
  assert.equal(packet.gpt_review_status, 'PENDING_REVIEW');
  assert.equal(packet.eval_complete, false);
  assert.deepEqual(packet.external_calls, { embedding: 0, llm: 0, dify: 0 });
  for (const item of packet.cases) {
    assert.ok(item.requirement.exact);
    assert.ok(item.frozen_evidence_inputs.length > 0);
    assert.equal(item.frozen_raw_candidate_pool.length, 20);
    const detail = item.evidence_detail[0];
    assert.ok(detail.source_text.includes(detail.exact_span.support_excerpt));
    assert.equal(detail.source_text_hash.length, 64);
    assert.ok(detail.context_window.length > 0);
    assert.equal(item.side_effects.evidence_fact_created, false);
    assert.equal(item.side_effects.mapping_created, false);
    assert.equal(item.side_effects.claim_gate_triggered, false);
    assert.equal(item.side_effects.writer_triggered, false);
  }
});

test('offline semantic statuses preserve direct, adverse, partial and scope boundaries', async () => {
  const packet = await runOfflineEvidenceSufficiency();
  const byId = new Map(packet.cases.map(item => [item.case_id, item]));
  assert.equal(byId.get('V2R-001-PERF-DIRECT').runtime_aggregate.status, 'EVIDENCE_REVIEW_READY');
  assert.equal(byId.get('V2R-002-PERF-PARTIAL').runtime_aggregate.status, 'INSUFFICIENT_EVIDENCE');
  assert.equal(byId.get('V2R-002-PERF-PARTIAL').runtime_assessment.review_dimensions.quantitative_match, 'mismatch');
  assert.equal(byId.get('V2R-003-COMP-DIRECT').runtime_aggregate.status, 'EVIDENCE_REVIEW_READY');
  assert.equal(byId.get('V2R-004-COMP-PARTIAL').runtime_aggregate.status, 'INSUFFICIENT_EVIDENCE');
  assert.deepEqual(byId.get('V2R-004-COMP-PARTIAL').expected.unresolved_required_dimensions, ['scope_match', 'status_match', 'quantitative_match']);
  assert.equal(byId.get('V2R-005-ISO-DIRECT').runtime_aggregate.status, 'EVIDENCE_REVIEW_READY');
  assert.equal(byId.get('V2R-006-ISO-SCOPE').runtime_aggregate.status, 'INSUFFICIENT_EVIDENCE');
  assert.equal(byId.get('V2R-006-ISO-SCOPE').runtime_assessment.review_dimensions.scope_match, 'mismatch');
  assert.equal(packet.metrics.unsafe_false_supported, 0);
});

test('offline negative controls distinguish adverse, conflict and technical unavailable', async () => {
  const packet = await runOfflineEvidenceSufficiency();
  const controls = new Map(packet.negative_controls.map(item => [item.control_id, item]));
  assert.equal(controls.get('ADVERSE_QUANTITATIVE_EVIDENCE').passed, true);
  assert.equal(controls.get('WRONG_SCOPE_BOUNDARY').passed, true);
  assert.equal(controls.get('CONFLICTING_EVIDENCE').result_status, 'CONFLICTING_EVIDENCE');
  assert.equal(controls.get('CONFLICTING_EVIDENCE').passed, true);
  assert.equal(controls.get('TECHNICAL_FAILURE_SEPARATION').technical_status, 'unavailable');
  assert.equal(controls.get('TECHNICAL_FAILURE_SEPARATION').result_status, 'ASSESSMENT_UNAVAILABLE');
  assert.equal(controls.get('TECHNICAL_FAILURE_SEPARATION').must_not_be_business_insufficient, true);
});

test('offline baseline keeps oracle provenance explicit and never promotes AUTO_DRAFT', async () => {
  const packet = await runOfflineEvidenceSufficiency();
  assert.equal(packet.oracle_provenance.runtime_assessment, 'AUTO_DRAFT');
  assert.equal(packet.oracle_provenance.expected_assessment, 'GPT_REVIEWED');
  assert.equal(packet.oracle_provenance.human_gold_cases, 0);
  assert.equal(packet.oracle_provenance.auto_promotion, false);
  for (const item of packet.cases) {
    assert.equal(item.oracle_provenance.promotion, 'NOT_PERMITTED');
  }
});
