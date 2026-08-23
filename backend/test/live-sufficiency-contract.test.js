import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LIVE_CALIBRATION_CASES,
  classifierInput,
  goldAssessment
} from '../eval/sufficiency/live-calibration-set.js';
import {
  aggregateSufficiencyAssessment,
  assessSufficiencyCase,
  validateSufficiencyEnvelope
} from '../eval/sufficiency/live-classifier.js';

test('live calibration has 32 independent cases, four domains and five candidates per case', () => {
  assert.equal(LIVE_CALIBRATION_CASES.length, 32);
  assert.deepEqual([...new Set(LIVE_CALIBRATION_CASES.map((item) => item.domain))].sort(), [
    'ENTERPRISE_PRIVATE', 'GENERAL', 'GOVERNMENT_ENTERPRISE', 'HEALTHCARE'
  ]);
  for (const item of LIVE_CALIBRATION_CASES) {
    assert.equal(item.candidates.length, 5);
    assert.ok(item.candidates.some((candidate) => Object.hasOwn(candidate, 'gold_classification')));
    const safe = classifierInput(item);
    assert.ok(safe.candidates.every((candidate) => !Object.hasOwn(candidate, 'gold_classification')));
    assert.ok(safe.candidates.every((candidate) => !Object.hasOwn(candidate, 'gold_support_span')));
  }
});

test('classifier contract validates source-bound spans and deterministic aggregation', () => {
  const item = LIVE_CALIBRATION_CASES.find((candidate) => candidate.expected_status === 'CONFLICTING_EVIDENCE');
  const assessments = goldAssessment(item);
  const validated = validateSufficiencyEnvelope({
    envelope: { status: 'success', data: { candidate_assessments: assessments, conflict_groups: [{ candidate_ids: [item.candidates[0].candidate_id, item.candidates[1].candidate_id], fact_key: 'synthetic_fact', support_spans: assessments.slice(0, 2).map(({ candidate_id, support_span }) => ({ candidate_id, support_span })) }] } },
    audit: { provider: 'mock' }
  }, item.candidates);
  assert.equal(aggregateSufficiencyAssessment(validated), 'CONFLICTING_EVIDENCE');
});

test('invalid classifier output is technical failure, never insufficient evidence', async () => {
  const item = LIVE_CALIBRATION_CASES[0];
  const result = await assessSufficiencyCase({
    run: async () => ({
      envelope: {
        status: 'success',
        data: {
          candidate_assessments: item.candidates.map((candidate, index) => ({
            candidate_id: candidate.candidate_id,
            classification: index === 0 ? 'DIRECT_SUPPORT' : 'UNRELATED',
            support_span: index === 0 ? 'not in source' : null,
            reason_code: index === 0 ? 'DIRECT_SOURCE_SUPPORT' : 'UNRELATED_SOURCE'
          })),
          conflict_groups: []
        }
      },
      audit: { provider: 'mock' }
    })
  }, item);
  assert.equal(result.ok, false);
  assert.equal(result.retrieval_status, 'SUFFICIENCY_ASSESSMENT_FAILED');
  assert.equal(result.error_code, 'CLASSIFIER_OUTPUT_INVALID');
});
