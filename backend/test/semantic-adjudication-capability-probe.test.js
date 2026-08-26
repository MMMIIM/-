import test from 'node:test';
import assert from 'node:assert/strict';
import { runSemanticAdjudicationCapabilityProbe } from '../scripts/semantic-adjudication-capability-probe.js';
import { SEMANTIC_ADJUDICATION_FRAGMENT_SCHEMA } from '../src/pipeline/evidence-support-review-evaluator.js';

const MODELS = [
  'deepseek-ai/DeepSeek-V4-Pro',
  'deepseek-ai/DeepSeek-V3.2',
  'deepseek-ai/DeepSeek-V4-Flash'
];

function mockFetchFactory() {
  const requests = [];
  const fetchImpl = async (url, init = {}) => {
    const body = init.body ? JSON.parse(init.body) : null;
    requests.push({ url: String(url), method: init.method || 'GET', body });
    if (String(url).includes('/models?sub_type=chat')) {
      return new Response(JSON.stringify({ data: MODELS.map(id => ({ id })) }), { status: 200 });
    }
    const fragment = {
      semantic_relevance: 'relevant',
      evidence_capability: 'capable',
      support_level: 'full_support',
      semantic_relationship: 'direct',
      review_dimensions: {
        subject_match: 'match', scope_match: 'match', status_match: 'unknown',
        quantitative_match: 'unknown', entity_match: 'match', validity_match: 'unknown',
        source_authority: 'unknown', support_sufficiency: 'match'
      },
      reason_codes: [],
      support_observations: []
    };
    return new Response(JSON.stringify({
      id: `mock-${body.model}`,
      model: body.model,
      choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(fragment) } }],
      usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  return { fetchImpl, requests };
}

test('capability probe uses one strict json_schema request per available candidate', async () => {
  const { fetchImpl, requests } = mockFetchFactory();
  const output = [];
  const result = await runSemanticAdjudicationCapabilityProbe({
    env: {
      ALLOW_LIVE_SEMANTIC_ADJUDICATION_PROBE: 'true',
      SEMANTIC_GATEWAY_PROVIDER: 'openai_compatible',
      SEMANTIC_GATEWAY_PROVIDER_API_BASE: 'https://provider.invalid/v1',
      SEMANTIC_GATEWAY_PROVIDER_API_KEY: 'synthetic-key',
      SEMANTIC_GATEWAY_MODEL: 'Qwen/Qwen2.5-7B-Instruct',
      SEMANTIC_GATEWAY_TIMEOUT_MS: '120000'
    },
    fetchImpl,
    stdout: value => output.push(value)
  });
  assert.equal(result.external_call_count, 3);
  assert.equal(requests.filter(request => request.method === 'GET').length, 1);
  const completionRequests = requests.filter(request => request.method === 'POST');
  assert.equal(completionRequests.length, 3);
  assert.deepEqual(completionRequests.map(request => request.body.model), MODELS);
  for (const request of completionRequests) {
    assert.equal(request.body.response_format.type, 'json_schema');
    assert.equal(request.body.response_format.json_schema.name, 'semantic_adjudication_fragment_v1');
    assert.equal(request.body.response_format.json_schema.strict, true);
    assert.deepEqual(request.body.response_format.json_schema.schema, SEMANTIC_ADJUDICATION_FRAGMENT_SCHEMA);
    assert.equal(request.body.max_tokens, 800);
  }
  assert.equal(result.candidate_results.every(candidate => candidate.result === 'PASS'), true);
  assert.equal(result.anti_drift.qwen_calls, 0);
  assert.equal(result.anti_drift.dify_calls, 0);
  assert.equal(result.anti_drift.embedding_calls, 0);
  assert.equal(JSON.stringify(output).includes('synthetic-key'), false);
});

test('capability probe does not infer model availability after provider authentication failure', async () => {
  const output = [];
  const result = await runSemanticAdjudicationCapabilityProbe({
    env: {
      ALLOW_LIVE_SEMANTIC_ADJUDICATION_PROBE: 'true',
      SEMANTIC_GATEWAY_PROVIDER: 'openai_compatible',
      SEMANTIC_GATEWAY_PROVIDER_API_BASE: 'https://provider.invalid/v1',
      SEMANTIC_GATEWAY_PROVIDER_API_KEY: 'synthetic-key',
      SEMANTIC_GATEWAY_MODEL: 'Qwen/Qwen2.5-7B-Instruct'
    },
    fetchImpl: async () => new Response(JSON.stringify({ error: { code: 'invalid_api_key', message: 'denied' } }), { status: 401 }),
    stdout: value => output.push(value)
  });
  assert.equal(result.external_call_count, 0);
  assert.equal(result.provider_model_list.authentication, 'FAIL');
  assert.equal(result.candidate_results.every(candidate => candidate.technical_error_class === 'PROVIDER_AUTH_FAILED'), true);
  assert.equal(JSON.stringify(output).includes('synthetic-key'), false);
});
