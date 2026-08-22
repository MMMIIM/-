import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateCorpusL3 } from '../eval/corpus/l3-eval.js';
import { loadL3SyntheticManifest, validateL3SyntheticManifest } from '../eval/corpus/l3-synthetic-enterprise/build.js';
import { evaluateRealPublicCorpus } from '../eval/corpus/real-l3-eval.js';

test('L3 synthetic enterprise corpus is clearly fictional, active for eval and lifecycle complete', () => {
  const manifest = loadL3SyntheticManifest();
  const result = validateL3SyntheticManifest(manifest);
  assert.equal(result.ok, true, result.errors.join(','));
  assert.equal(result.counts.materials, 17);
  assert.equal(result.counts.active, 17);
  assert.equal(manifest.subject, '杭州景云数科有限公司');
  assert.ok(manifest.materials.every((item) => item.synthetic_test_material === true));
});

test('L3 controlled quality cases remain visible and do not become formal proof', () => {
  const manifest = loadL3SyntheticManifest();
  const cases = new Set(manifest.materials.map((item) => item.controlled_case).filter(Boolean));
  for (const expected of manifest.controlled_cases) assert.ok(cases.has(expected), expected);
  assert.ok(manifest.materials.find((item) => item.controlled_case === 'expired_qualification' && item.effective_status === 'expired'));
  assert.ok(manifest.materials.find((item) => item.controlled_case === 'conflicting_company_fact'));
  assert.ok(manifest.materials.find((item) => item.controlled_case === 'unsupported_marketing_sla'));
});

test('L3 eval reports the current 90% retrieval baseline as corpus work, not an architecture failure', () => {
  const report = evaluateCorpusL3();
  assert.equal(report.external_provider_calls, 0);
  assert.equal(report.current_retrieval_baseline.recall_at_5, 0.9);
  assert.equal(report.current_retrieval_baseline.scope_violation_rate, 0);
  assert.deepEqual({
    general: report.scopes.general.active,
    government: report.scopes.government.active,
    healthcare: report.scopes.healthcare.active,
    enterprise: report.scopes.enterprise.active,
  }, { general: 10, government: 15, healthcare: 15, enterprise: 17 });
  assert.equal(report.corpus_l3, 'IN_PROGRESS');
  assert.ok(report.corpus_gaps_remaining.length > 0);
  assert.equal(report.checks.formal_safety_boundary_violations.pass, true);
});

test('real official excerpt wave is deterministic, traceable and provider-free', () => {
  const report = evaluateRealPublicCorpus();
  assert.equal(report.discovered, 40);
  assert.deepEqual(report.by_scope, {
    GENERAL: { discovered: 10, processed: 10, active: 10 },
    GOVERNMENT_ENTERPRISE: { discovered: 15, processed: 15, active: 15 },
    HEALTHCARE: { discovered: 15, processed: 15, active: 15 },
  });
  assert.equal(report.metrics.business_question_coverage, 1);
  assert.equal(report.metrics.recall_at_5, 1);
  assert.equal(report.metrics.source_traceability, 1);
  assert.equal(report.metrics.no_answer_accuracy, 1);
  assert.equal(report.provider_calls, 0);
  assert.equal(report.external_calls, 0);
  assert.equal(Object.values(report.checks).every(Boolean), true);
});
