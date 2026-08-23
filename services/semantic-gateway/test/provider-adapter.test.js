import test from 'node:test';
import assert from 'node:assert/strict';
import { OpenAICompatibleProvider } from '../src/provider/openai-compatible-provider.js';
import { getSemanticTaskContract, SEMANTIC_TASK_TYPES, validateTaskData } from '../../../packages/semantic-contracts/index.js';

test('shared task registry exposes one canonical contract set', () => {
  assert.deepEqual(SEMANTIC_TASK_TYPES.filter(task => task !== 'draft_sections'), [
    'requirement_extraction', 'response_planning', 'claim_generation',
    'section_drafting', 'targeted_revision', 'evidence_support_assessment'
  ]);
  assert.equal(getSemanticTaskContract('requirement_extraction').contract_version, '4.3-requirement-extraction');
  assert.equal(getSemanticTaskContract('evidence_support_assessment').contract_version, '4.3-evidence-support-assessment-v1');
});

test('OpenAI-compatible adapter parses strict JSON without repair', async () => {
  let request;
  const provider = new OpenAICompatibleProvider({
    baseUrl: 'https://provider.invalid/v1', apiKey: 'secret-test-key', model: 'mock-model',
    fetchImpl: async (url, options) => {
      request = { url, options };
      return new Response(JSON.stringify({ choices: [{ message: { content: '{"ok":true}' } }] }), { status: 200 });
    }
  });
  const result = await provider.invoke({ instruction: 'instruction', payload: { value: 1 } });
  assert.deepEqual(result.data, { ok: true });
  assert.equal(request.url, 'https://provider.invalid/v1/chat/completions');
  assert.equal(JSON.parse(request.options.body).response_format.type, 'json_object');
});

test('OpenAI-compatible adapter classifies invalid provider JSON', async () => {
  const provider = new OpenAICompatibleProvider({
    baseUrl: 'https://provider.invalid/v1', apiKey: 'secret-test-key', model: 'mock-model',
    fetchImpl: async () => new Response(JSON.stringify({ choices: [{ message: { content: '{' } }] }), { status: 200 })
  });
  await assert.rejects(() => provider.invoke({ instruction: 'instruction', payload: {} }), error => error.code === 'PROVIDER_OUTPUT_INVALID');
});

test('shared schema validator rejects extra fields', () => {
  assert.throws(() => validateTaskData('section_drafting', { chapter_id: 'c', content_markdown: 'x', extra: true }), /unsupported fields/);
});
