import test from 'node:test';
import assert from 'node:assert/strict';
import { runStage20Acceptance } from '../eval/stage20/acceptance.js';

test('Stage 20 合成项目贯通准备、材料复核、生成、投标检查与 Word 交付边界', async () => {
  const result = await runStage20Acceptance();
  assert.equal(result.external_provider_calls, 0);
  assert.equal(result.flow.project_preparation, 'PASS');
  assert.equal(result.flow.tender_upload, 'PASS');
  assert.equal(result.flow.tender_parse, 'PASS');
  assert.equal(result.flow.canonical_requirements, 'PASS');
  assert.equal(result.flow.generation, 'PASS');
  assert.equal(result.flow.word_export, 'PASS');
  assert.equal(result.flow.refresh_persistence, 'PASS');
  assert.equal(result.flow.idempotency, 'PASS');
  assert.equal(result.metrics.requirement_count, 4);
  assert.equal(result.metrics.plan_count, 4);
  assert.ok(result.metrics.docx_bytes > 0);
  assert.equal(result.safety.rejected_claims_excluded_from_writer, true);
  assert.equal(result.safety.mandatory_coverage, true);
  assert.equal(result.safety.false_formal_success, true);
});
