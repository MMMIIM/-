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
  assert.equal(persisted.provider_reached, true);
  assert.equal(persisted.canonical_schema_valid, false);
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
