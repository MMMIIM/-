import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateRetrievalFixture, loadRetrievalEvalFixture } from '../eval/retrieval-eval/benchmark.js';

test('deterministic Retrieval Eval covers production-shaped positive, negative and no-answer cases', () => {
  const report = evaluateRetrievalFixture(loadRetrievalEvalFixture());
  assert.equal(report.schema_pass_rate, 1);
  assert.equal(report.query_count, 8);
  assert.equal(report.source_traceability_rate, 1);
  assert.equal(report.scope_violation_rate, 0);
  assert.equal(report.duplicate_retrieval_rate, 0);
  assert.equal(report.no_answer_accuracy, 1);
  assert.ok(report.expected_requirement_recall >= 0.85);
  assert.ok(report.mrr >= 0.9);
  assert.equal(report.unsupported_content_count, 0);
});
