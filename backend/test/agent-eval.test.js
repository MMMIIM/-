import test from 'node:test';
import assert from 'node:assert/strict';
import { runAgentEvaluation } from '../eval/agent-eval/benchmark.js';

test('agent evaluation covers ten deterministic safety cases', async () => {
  const report = await runAgentEvaluation();
  assert.equal(report.cases, 10);
  assert.equal(report.metrics.formal_safety_violation_rate, 0);
  assert.equal(report.metrics.unsupported_action_rate, 0);
  assert.equal(report.metrics.tool_selection_accuracy, 1);
});
