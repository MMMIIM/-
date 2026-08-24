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
  assert.equal(byId.get('V2R-002-PERF-PARTIAL').runtime_assessment.support_level, 'insufficient');
  assert.equal(byId.get('V2R-002-PERF-PARTIAL').runtime_assessment.review_dimensions.quantitative_match, 'mismatch');
  assert.notEqual(byId.get('V2R-002-PERF-PARTIAL').runtime_assessment.review_dimensions.support_sufficiency, 'match');
  assert.equal(byId.get('V2R-003-COMP-DIRECT').runtime_aggregate.status, 'EVIDENCE_REVIEW_READY');
  assert.equal(byId.get('V2R-004-COMP-PARTIAL').runtime_aggregate.status, 'INSUFFICIENT_EVIDENCE');
  assert.equal(byId.get('V2R-004-COMP-PARTIAL').expected.required_dimensions.entity_match.classification, 'SUPPORTING_DIMENSION');
  assert.equal(byId.get('V2R-004-COMP-PARTIAL').expected.required_dimensions.entity_match.expected, 'unknown');
  assert.deepEqual(byId.get('V2R-004-COMP-PARTIAL').expected.unresolved_required_dimensions, ['scope_match', 'status_match', 'quantitative_match']);
  assert.equal(byId.get('V2R-005-ISO-DIRECT').runtime_aggregate.status, 'EVIDENCE_REVIEW_READY');
  assert.equal(byId.get('V2R-006-ISO-SCOPE').runtime_aggregate.status, 'INSUFFICIENT_EVIDENCE');
  assert.equal(byId.get('V2R-006-ISO-SCOPE').runtime_assessment.review_dimensions.subject_match, 'unknown');
  assert.equal(byId.get('V2R-006-ISO-SCOPE').runtime_assessment.review_dimensions.entity_match, 'unknown');
  assert.equal(byId.get('V2R-006-ISO-SCOPE').runtime_assessment.review_dimensions.scope_match, 'unknown');
  assert.deepEqual(byId.get('V2R-006-ISO-SCOPE').expected.unresolved_required_dimensions, ['subject_match', 'entity_match', 'scope_match']);
  assert.equal(byId.get('V2R-006-ISO-SCOPE').expected.required_dimensions.subject_match.classification, 'UNRESOLVED_REQUIRED_DIMENSION');
  assert.equal(byId.get('V2R-006-ISO-SCOPE').runtime_assessment.reason_codes.includes('SUBJECT_MISMATCH'), false);
  assert.equal(packet.metrics.unsafe_false_supported, 0);
  assert.equal(packet.metrics.automated_required_dimension_accuracy.total, 25);
  assert.equal(packet.metrics.automated_unresolved_dimension_accuracy.total, 6);
  assert.equal(packet.metrics.gpt_reviewed_required_dimension_accuracy.total, 9);
  assert.equal(packet.metrics.gpt_reviewed_unresolved_dimension_accuracy.total, 6);
});

test('offline negative controls distinguish adverse, conflict and technical unavailable', async () => {
  const packet = await runOfflineEvidenceSufficiency();
  const controls = new Map(packet.negative_controls.map(item => [item.control_id, item]));
  assert.equal(controls.get('ADVERSE_QUANTITATIVE_EVIDENCE').passed, true);
  assert.equal(controls.get('WRONG_SCOPE_BOUNDARY').passed, true);
  assert.equal(controls.get('EXPLICIT_SUBJECT_MISMATCH').passed, true);
  assert.equal(controls.get('EXPLICIT_SUBJECT_MISMATCH').runtime_assessment.review_dimensions.subject_match, 'mismatch');
  assert.equal(controls.get('EXPLICIT_SUBJECT_MISMATCH').aggregate_result.status, 'INSUFFICIENT_EVIDENCE');
  assert.equal(controls.get('EXPLICIT_SUBJECT_MISMATCH').requirement_subject, 'ENTITY_A');
  assert.equal(controls.get('EXPLICIT_SUBJECT_MISMATCH').evidence_subject, 'ENTITY_B');
  assert.match(controls.get('EXPLICIT_SUBJECT_MISMATCH').source_text, /认证主体：ENTITY_B/u);
  assert.equal(controls.get('CONFLICTING_EVIDENCE').result_status, 'CONFLICTING_EVIDENCE');
  assert.equal(controls.get('CONFLICTING_EVIDENCE').passed, true);
  assert.equal(controls.get('CONFLICTING_EVIDENCE').control_fixture_id, 'NEG-CONFLICT-001');
  assert.equal(controls.get('CONFLICTING_EVIDENCE').runtime_assessments.length, 2);
  assert.equal(controls.get('CONFLICTING_EVIDENCE').fact_key, 'average_response_time');
  assert.equal(controls.get('CONFLICTING_EVIDENCE').runtime_assessments[0].support_level, 'full_support');
  assert.equal(controls.get('CONFLICTING_EVIDENCE').runtime_assessments[0].review_dimensions.quantitative_match, 'match');
  assert.equal(controls.get('CONFLICTING_EVIDENCE').runtime_assessments[1].support_level, 'insufficient');
  assert.equal(controls.get('CONFLICTING_EVIDENCE').runtime_assessments[1].review_dimensions.quantitative_match, 'mismatch');
  assert.ok(controls.get('CONFLICTING_EVIDENCE').runtime_assessments[1].reason_codes.includes('QUANTITATIVE_MISMATCH'));
  assert.equal(controls.get('CONFLICTING_EVIDENCE').evidence_a.adverse_to_requirement, false);
  assert.equal(controls.get('CONFLICTING_EVIDENCE').evidence_b.adverse_to_requirement, true);
  assert.equal(controls.get('TECHNICAL_FAILURE_SEPARATION').technical_status, 'unavailable');
  assert.equal(controls.get('TECHNICAL_FAILURE_SEPARATION').result_status, 'ASSESSMENT_UNAVAILABLE');
  assert.equal(controls.get('TECHNICAL_FAILURE_SEPARATION').control_fixture_id, 'NEG-TECHNICAL-001');
  assert.equal(controls.get('TECHNICAL_FAILURE_SEPARATION').technical_error_type, 'PROVIDER_TIMEOUT');
  assert.equal(controls.get('TECHNICAL_FAILURE_SEPARATION').must_not_be_business_insufficient, true);
  assert.equal(packet.metrics.core_case_count, 6);
  assert.equal(packet.metrics.negative_control_cases_excluded, true);
});

test('offline baseline keeps oracle provenance explicit and never promotes AUTO_DRAFT', async () => {
  const packet = await runOfflineEvidenceSufficiency();
  assert.equal(packet.oracle_provenance.field_level, true);
  assert.ok(packet.oracle_provenance.case_status_expectation_provenance.GPT_REVIEWED_EXPECTATION >= 6);
  assert.equal(packet.oracle_provenance.human_gold_cases, 0);
  assert.equal(packet.oracle_provenance.auto_promotion, false);
  for (const item of packet.cases) {
    assert.equal(item.oracle_provenance.promotion, 'NOT_PERMITTED');
    assert.equal(item.oracle_provenance.case_status_expectation_provenance, 'GPT_REVIEWED_EXPECTATION');
    assert.equal(item.oracle_provenance.expected_assessment, undefined);
  }
  assert.equal(packet.cases[0].oracle_provenance.dimension_expectation_provenance.subject_match, 'PENDING_GPT_REVIEW');
  assert.equal(packet.cases[2].oracle_provenance.dimension_expectation_provenance.subject_match, 'PENDING_GPT_REVIEW');
  assert.equal(packet.cases[2].oracle_provenance.dimension_expectation_provenance.status_match, 'PENDING_GPT_REVIEW');
  assert.equal(packet.cases[1].oracle_provenance.dimension_expectation_provenance.quantitative_match, 'GPT_REVIEWED_EXPECTATION');
  assert.equal(packet.cases[1].oracle_provenance.adverse_evidence_expectation_provenance, 'GPT_REVIEWED_EXPECTATION');
  assert.equal(packet.metrics.pending_oracle_fields.total, packet.oracle_provenance.pending_field_count);
});
