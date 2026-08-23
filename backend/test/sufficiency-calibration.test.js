import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('sufficiency calibration set covers all routing statuses with source-bound spans', async () => {
  const fixture = JSON.parse(await readFile(new URL('../eval/sufficiency/calibration-set.json', import.meta.url), 'utf8'));
  const statuses = new Set(fixture.cases.map((item) => item.expected_status));
  assert.deepEqual([...statuses].sort(), [
    'CONFLICTING_EVIDENCE',
    'EVIDENCE_REVIEW_READY',
    'INSUFFICIENT_EVIDENCE',
    'NO_RELEVANT_EVIDENCE'
  ]);
  for (const item of fixture.cases) {
    if (item.semantic_status === 'DIRECT_SUPPORT') {
      assert.equal(typeof item.support_span, 'string');
      assert.ok(item.candidate.source_excerpt.includes(item.support_span));
    }
    if (item.semantic_status === 'UNRELATED') assert.equal(item.support_span, null);
  }
});
