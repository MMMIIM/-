import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { buildValueBaseline, loadValueCases, runSemanticAdjudicationValueV1, scoreValueResults } from '../eval/semantic-adjudication-value-v1/runner.js';

const MODEL = 'deepseek-ai/DeepSeek-V4-Flash';
const testReportPath = fileURLToPath(new URL('../eval/reports/semantic-adjudication-value-v1-test.json', import.meta.url));
const networkTestReportPath = fileURLToPath(new URL('../eval/reports/semantic-adjudication-value-v1-network-test.json', import.meta.url));

test('value V1 packet is human-owned, UTF-8 intact, and every case is genuinely ambiguous', async () => {
  const packet = loadValueCases();
  assert.equal(packet.cases.length, 12);
  assert.equal(packet.model_generated_oracle, 0);
  assert.equal(packet.oracle_owner, 'HUMAN_AUTHORED_BEFORE_MODEL_CALL');
  const categories = new Set(packet.cases.map(item => item.category));
  for (const category of [
    'HIGH_RELEVANCE_NOT_SUFFICIENT', 'SEMANTIC_PARAPHRASE', 'ROLE_RESPONSIBILITY_STRENGTH',
    'PARTIAL_SUPPORT', 'NATURAL_LANGUAGE_CONFLICT', 'GENUINELY_UNCERTAIN'
  ]) assert.equal(categories.has(category), true);
  const baseline = buildValueBaseline(packet);
  assert.equal(baseline.cases.every(item => item.router_result === 'NEEDS_SEMANTIC_ADJUDICATION'), true);
  assert.equal(baseline.cases.every(item => item.prompt.includes(item.evidence.source_text)), true);
  const raw = await readFile(new URL('../eval/semantic-adjudication-value-v1/cases.json', import.meta.url));
  assert.match(raw.toString('utf8'), /系统应在并发用户不少于1000时保持稳定响应/);
});

function mockFetch() {
  const requests = [];
  const fetchImpl = async (url, init = {}) => {
    if (String(url).includes('/models?sub_type=chat')) {
      requests.push({ method: 'GET', url: String(url) });
      return new Response(JSON.stringify({ data: [{ id: MODEL }] }), { status: 200 });
    }
    const body = JSON.parse(init.body);
    requests.push({ method: 'POST', url: String(url), body });
    const payload = JSON.parse(body.messages[1].content);
    const relationshipByCase = {
      'SAV1-A01': ['partial', 'partial_support'], 'SAV1-A02': ['partial', 'partial_support'],
      'SAV1-B01': ['direct', 'full_support'], 'SAV1-B02': ['direct', 'full_support'],
      'SAV1-C01': ['partial', 'partial_support'], 'SAV1-C02': ['partial', 'partial_support'],
      'SAV1-D01': ['partial', 'partial_support'], 'SAV1-D02': ['partial', 'partial_support'],
      'SAV1-E01': ['conflict', 'conflict'], 'SAV1-E02': ['conflict', 'conflict'],
      'SAV1-F01': ['unknown', 'unknown'], 'SAV1-F02': ['unknown', 'unknown']
    };
    const caseId = payload.requirement.requirement_id;
    const [relationship, supportLevel] = relationshipByCase[caseId];
    const fragment = {
      semantic_relevance: relationship === 'unknown' ? 'unknown' : 'relevant',
      evidence_capability: relationship === 'unknown' ? 'unknown' : 'capable',
      support_level: supportLevel,
      semantic_relationship: relationship,
      review_dimensions: Object.fromEntries([
        'subject_match', 'scope_match', 'status_match', 'quantitative_match',
        'entity_match', 'validity_match', 'source_authority', 'support_sufficiency'
      ].map(name => [name, 'unknown'])),
      reason_codes: [],
      support_observations: []
    };
    return new Response(JSON.stringify({
      model: MODEL,
      id: `synthetic-${caseId}`,
      choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(fragment) } }],
      usage: { prompt_tokens: 100, completion_tokens: 80, total_tokens: 180 }
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  return { fetchImpl, requests };
}

test('value V1 runner is isolated and sends one UTF-8 json_schema request per case', async () => {
  const { fetchImpl, requests } = mockFetch();
  const output = [];
  const result = await runSemanticAdjudicationValueV1({
    env: {
      ALLOW_LIVE_SEMANTIC_ADJUDICATION_VALUE_V1: 'true',
      SEMANTIC_GATEWAY_PROVIDER: 'openai_compatible',
      SEMANTIC_GATEWAY_PROVIDER_API_BASE: 'https://synthetic.invalid/v1',
      SEMANTIC_GATEWAY_PROVIDER_API_KEY: 'synthetic-key',
      SEMANTIC_GATEWAY_MODEL: 'Qwen/Qwen2.5-7B-Instruct'
    },
    fetchImpl,
    stdout: value => output.push(value),
    resultPath: testReportPath
  });
  assert.equal(result.utf8_input_integrity, 'PASS');
  assert.equal(result.production_db_writes, 0);
  assert.equal(result.knowledge_base_writes, 0);
  assert.equal(result.vector_store_writes, 0);
  assert.equal(result.formal_state_writes, 0);
  assert.equal(result.case_results.length, 12);
  assert.equal(result.external_calls.inference, 12);
  assert.equal(requests.filter(request => request.method === 'GET').length, 1);
  const posts = requests.filter(request => request.method === 'POST');
  assert.equal(posts.length, 12);
  assert.equal(posts.every(request => request.body.model === MODEL), true);
  assert.equal(posts.every(request => request.body.enable_thinking === false), true);
  assert.equal(posts.every(request => request.body.max_tokens === 800), true);
  assert.equal(posts.every(request => request.body.response_format.type === 'json_schema'), true);
  assert.equal(posts.every(request => request.body.messages[0].content.includes('判断')), true);
  assert.equal(result.metrics.unsafe_false_supported, 0);
  assert.equal(result.metrics.semantic_accuracy, 1);
  assert.equal(JSON.stringify(output).includes('synthetic-key'), false);
});

test('value metrics treat uncertain outcomes as safe but not as human-review reduction', () => {
  const metrics = scoreValueResults([
    { correct: true, actual: 'direct', expected: 'direct', unsafe_false_supported: false, fragment_schema_valid: true, json_parse_success: true, latency_ms: 10, category: 'SEMANTIC_PARAPHRASE', prompt_tokens: 1, completion_tokens: 2, total_tokens: 3 },
    { correct: true, actual: 'unknown', expected: 'unknown', unsafe_false_supported: false, fragment_schema_valid: true, json_parse_success: true, latency_ms: 20, category: 'GENUINELY_UNCERTAIN', prompt_tokens: 1, completion_tokens: 2, total_tokens: 3 },
    { correct: false, actual: 'direct', expected: 'partial', unsafe_false_supported: true, fragment_schema_valid: true, json_parse_success: true, latency_ms: 30, category: 'HIGH_RELEVANCE_NOT_SUFFICIENT', prompt_tokens: 1, completion_tokens: 2, total_tokens: 3 }
  ]);
  assert.equal(metrics.uncertain_count, 1);
  assert.equal(metrics.correct_decisive_resolution_count, 1);
  assert.equal(metrics.safe_resolution_rate, 1 / 3);
  assert.equal(metrics.unsafe_false_supported, 1);
  assert.equal(metrics.value, 'INSUFFICIENT_OR_UNSAFE_VALUE');
});

test('value V1 model-list transport failure produces a safe persisted report without inference', async () => {
  const result = await runSemanticAdjudicationValueV1({
    env: {
      ALLOW_LIVE_SEMANTIC_ADJUDICATION_VALUE_V1: 'true',
      SEMANTIC_GATEWAY_PROVIDER: 'openai_compatible',
      SEMANTIC_GATEWAY_PROVIDER_API_BASE: 'https://synthetic.invalid/v1',
      SEMANTIC_GATEWAY_PROVIDER_API_KEY: 'secret-must-not-be-persisted',
      SEMANTIC_GATEWAY_MODEL: MODEL
    },
    fetchImpl: async () => { throw Object.assign(new Error('network unavailable'), { code: 'PROVIDER_UNAVAILABLE' }); },
    stdout: () => {},
    resultPath: networkTestReportPath
  });
  assert.equal(result.stop_reason, 'PROVIDER_UNAVAILABLE');
  assert.equal(result.external_calls.model_list, 1);
  assert.equal(result.external_calls.inference, 0);
  assert.equal(result.case_results.length, 0);
  assert.equal(JSON.stringify(result).includes('secret-must-not-be-persisted'), false);
});
