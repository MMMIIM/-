import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SemanticGatewayError } from '../src/pipeline/semantic-gateway-client.js';
import { runEvidenceSupportProbe } from '../scripts/evidence-support-provider-probe.js';

const baseEnv = {
  ALLOW_LIVE_PROVIDER_PROBE: 'true',
  SEMANTIC_GATEWAY_PROVIDER: 'openai_compatible',
  SEMANTIC_GATEWAY_API_BASE: 'http://127.0.0.1:18082',
  SEMANTIC_GATEWAY_API_KEY: 'service-key',
  SEMANTIC_GATEWAY_PROVIDER_API_BASE: 'https://api.siliconflow.cn/v1',
  SEMANTIC_GATEWAY_PROVIDER_API_KEY: 'provider-key',
  SEMANTIC_GATEWAY_MODEL: 'Qwen/Qwen2.5-7B-Instruct'
};

function tempResult() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'semantic-gateway-probe-'));
  return { directory, resultPath: path.join(directory, 'probe.json'), envFile: path.join(directory, 'missing.env') };
}

function mockFetch(status) {
  return async () => new Response('{}', { status, headers: { 'content-type': 'application/json' } });
}

function evaluatorThat({ fetchImpl, error = null, status = 200 } = {}) {
  return ({ fetchImpl: transport }) => ({
    async assess() {
      if (fetchImpl !== false) await transport('http://127.0.0.1:18082/workflows/run', { method: 'POST' });
      if (error) throw error;
      return { assessments: [], warnings: [] };
    }
  });
}

async function runFixture(options = {}) {
  const temp = tempResult();
  const output = [];
  const result = await runEvidenceSupportProbe({
    env: baseEnv,
    envFile: temp.envFile,
    resultPath: temp.resultPath,
    stdout: value => output.push(JSON.parse(value)),
    ...options
  });
  const persisted = JSON.parse(fs.readFileSync(temp.resultPath, 'utf8'));
  fs.rmSync(temp.directory, { recursive: true, force: true });
  return { result, persisted, output };
}

test('successful mock/test probe emits and persists one safe result', async () => {
  const { result, persisted, output } = await runFixture({
    fetchImpl: mockFetch(200),
    evaluatorFactory: evaluatorThat()
  });
  assert.equal(output.length, 1);
  assert.equal(result.final_probe_status, 'PASS');
  assert.equal(persisted.final_probe_status, 'PASS');
  assert.equal(persisted.provider_call_count, 1);
  assert.equal(persisted.canonical_schema_valid, true);
});

test('Gateway/local failure still emits a persisted safe result with zero Provider calls', async () => {
  const error = new SemanticGatewayError('GATEWAY_NETWORK_ERROR', 'network failure');
  const { result, persisted } = await runFixture({
    evaluatorFactory: evaluatorThat({ fetchImpl: false, error })
  });
  assert.equal(result.final_probe_status, 'FAILED');
  assert.equal(persisted.technical_error_class, 'GATEWAY_NETWORK_ERROR');
  assert.equal(persisted.provider_call_count, 0);
});

test('Provider failure still emits a safe result and accounts one Provider call', async () => {
  const error = new SemanticGatewayError('ASSESSMENT_UNAVAILABLE', 'provider unavailable', { technical_error_code: 'PROVIDER_TIMEOUT' });
  const { persisted } = await runFixture({
    fetchImpl: mockFetch(502),
    evaluatorFactory: evaluatorThat({ error })
  });
  assert.equal(persisted.technical_error_class, 'PROVIDER_TIMEOUT');
  assert.equal(persisted.provider_call_count, 1);
  assert.equal(persisted.provider_reached, false);
  assert.equal(persisted.provider_adapter_invoked, true);
  assert.equal(persisted.provider_http_reached, false);
  assert.equal(persisted.canonical_schema_valid, false);
  assert.equal(persisted.failure_classifications.includes('SYNTACTIC_JSON_PRESENTATION_ERROR'), false);
});

test('canonical schema failure is captured after a successful Gateway response', async () => {
  const error = new SemanticGatewayError('ASSESSMENT_UNAVAILABLE', 'schema failure', { technical_error_code: 'OUTPUT_SCHEMA_INVALID' });
  const { persisted } = await runFixture({
    fetchImpl: mockFetch(200),
    evaluatorFactory: evaluatorThat({ error })
  });
  assert.equal(persisted.provider_call_count, 1);
  assert.equal(persisted.model_response_reached, true);
  assert.equal(persisted.canonical_envelope_valid, true);
  assert.equal(persisted.canonical_schema_valid, false);
});

test('model content and exact schema diagnostics are persisted for a failed probe', async () => {
  const diagnostic = {
    model_content: '{"data":{"assessments":[{"confidence":"high"}]}}',
    parsed_json: { data: { assessments: [{ confidence: 'high' }] } },
    json_parse_success: true,
    markdown_fence_present: false,
    provider_http_status: 200,
    schema_validation_errors: [{
      path: 'provider.data',
      expected: 'canonical task data',
      observed_category: 'gateway_envelope',
      validator_code: 'ENVELOPE_ERROR',
      message: 'Provider returned a Gateway envelope where task data was required.'
    }],
    envelope_validation_errors: [],
    legacy_schema_detected: true,
    legacy_schema_tokens_observed: ['confidence'],
    finish_reason: 'stop',
    prompt_tokens: 100,
    completion_tokens: 200,
    total_tokens: 300,
    response_model: 'mock-model',
    response_id: 'response-1',
    provider_trace_id: 'trace-1',
    model_content_length_chars: 42,
    output_truncated: false,
    generation_config: { response_format: { type: 'json_object' }, max_tokens: 3200, temperature: 0.1, top_p: 0.9, top_k: 20, frequency_penalty: 0, stream: false },
    outbound_prompt_diagnostics: { instruction_sha256: 'hash', instruction_char_count: 12, payload_sha256: 'hash2', payload_char_count: 10, contamination: false }
  };
  const error = new SemanticGatewayError('ASSESSMENT_UNAVAILABLE', 'schema failure', { technical_error_code: 'OUTPUT_SCHEMA_INVALID' });
  const temp = tempResult();
  const output = [];
  const persistedResult = await runEvidenceSupportProbe({
    env: baseEnv,
    envFile: temp.envFile,
    resultPath: temp.resultPath,
    fetchImpl: async () => new Response(JSON.stringify({ error_code: 'OUTPUT_SCHEMA_INVALID', probe_diagnostics: diagnostic }), {
      status: 422,
      headers: { 'content-type': 'application/json' }
    }),
    evaluatorFactory: evaluatorThat({ error }),
    stdout: value => output.push(JSON.parse(value))
  });
  const persisted = JSON.parse(fs.readFileSync(temp.resultPath, 'utf8'));
  fs.rmSync(temp.directory, { recursive: true, force: true });
  assert.equal(persistedResult.final_probe_status, 'FAILED');
  assert.equal(persisted.json_parse_success, true);
  assert.equal(persisted.legacy_schema_detected, true);
  assert.equal(persisted.provider_http_status, 200);
  assert.equal(persisted.provider_http_reached, false);
  assert.equal(persisted.schema_validation_errors[0].path, 'provider.data');
  assert.equal(persisted.failure_classifications.includes('LEGACY_SCHEMA_OUTPUT'), true);
  assert.deepEqual(persisted.legacy_schema_tokens_observed, ['confidence']);
  assert.equal(persisted.finish_reason, 'stop');
  assert.equal(persisted.completion_tokens, 200);
  assert.equal(persisted.generation_config.max_tokens, 3200);
  assert.equal(persisted.outbound_prompt_legacy_contamination, 'NO');
  assert.equal(JSON.stringify(output).includes('Authorization'), false);
});

test('truncation diagnostics are retained and never repaired into a canonical result', async () => {
  const diagnostic = {
    provider_adapter_invoked: true,
    fetch_invoked: true,
    provider_http_reached: true,
    provider_http_status: 200,
    finish_reason: 'length',
    prompt_tokens: 20,
    completion_tokens: 3200,
    total_tokens: 3220,
    model_content_length_chars: 14000,
    output_truncated: true,
    json_parse_success: false,
    legacy_schema_tokens_observed: ['evidence_bearing']
  };
  const error = new SemanticGatewayError('ASSESSMENT_UNAVAILABLE', 'provider output unavailable', {
    technical_error_code: 'PROVIDER_OUTPUT_INVALID'
  });
  const temp = tempResult();
  const result = await runEvidenceSupportProbe({
    env: baseEnv,
    envFile: temp.envFile,
    resultPath: temp.resultPath,
    fetchImpl: async () => new Response(JSON.stringify({ error_code: 'PROVIDER_OUTPUT_INVALID', probe_diagnostics: diagnostic }), {
      status: 502,
      headers: { 'content-type': 'application/json' }
    }),
    evaluatorFactory: evaluatorThat({ error }),
    stdout: () => {}
  });
  const persisted = JSON.parse(fs.readFileSync(temp.resultPath, 'utf8'));
  fs.rmSync(temp.directory, { recursive: true, force: true });
  assert.equal(result.final_probe_status, 'FAILED');
  assert.equal(persisted.output_truncated, true);
  assert.equal(persisted.failure_classifications.includes('OUTPUT_TRUNCATED'), true);
  assert.equal(persisted.failure_classifications.includes('MODEL_OUTPUT_INTEGRITY'), true);
  assert.equal(persisted.canonical_schema_valid, false);
  assert.equal(persisted.normalized_assessment, null);
});

test('persisted and printed probe results contain no credentials or Authorization header', async () => {
  const serviceSecret = 'service-secret-value-that-must-not-appear';
  const providerSecret = 'provider-secret-value-that-must-not-appear';
  const { persisted, output } = await runFixture({
    env: { ...baseEnv, SEMANTIC_GATEWAY_API_KEY: serviceSecret, SEMANTIC_GATEWAY_PROVIDER_API_KEY: providerSecret },
    fetchImpl: mockFetch(200),
    evaluatorFactory: evaluatorThat()
  });
  const serialized = JSON.stringify({ persisted, output });
  assert.equal(serialized.includes(serviceSecret), false);
  assert.equal(serialized.includes(providerSecret), false);
  assert.equal(serialized.includes('Authorization'), false);
  assert.equal(serialized.includes('Bearer'), false);
});
