import test from 'node:test';
import assert from 'node:assert/strict';
import {
  readSemanticGatewayRuntimeConfig,
  safeSemanticGatewayRuntimeSummary,
  validateSemanticGatewayRuntimeConfig,
  validateSemanticGatewayLiveConfig
} from '../../packages/semantic-contracts/runtime-config.js';
import { runSemanticGatewayPreflight } from '../scripts/semantic-gateway-preflight.js';
import { runRuntimeConfigStaticCheck } from '../scripts/runtime-config-static-check.js';

const providerEnv = {
  SEMANTIC_GATEWAY_PROVIDER: 'openai_compatible',
  SEMANTIC_GATEWAY_API_BASE: 'http://127.0.0.1:18082',
  SEMANTIC_GATEWAY_API_KEY: 'service-key',
  SEMANTIC_GATEWAY_PROVIDER_API_BASE: 'https://api.siliconflow.cn/v1',
  SEMANTIC_GATEWAY_PROVIDER_API_KEY: 'provider-key',
  SEMANTIC_GATEWAY_MODEL: 'Qwen/Qwen2.5-7B-Instruct',
  SEMANTIC_GATEWAY_TIMEOUT_MS: '120000'
};

test('canonical runtime config keeps service and Provider keys separate', () => {
  const config = readSemanticGatewayRuntimeConfig(providerEnv);
  assert.equal(config.serviceApiKey, 'service-key');
  assert.equal(config.providerApiKey, 'provider-key');
  assert.notEqual(config.serviceApiKey, config.providerApiKey);
  assert.equal(config.providerApiBase, 'https://api.siliconflow.cn/v1');
  assert.equal(config.gatewayApiBase, 'http://127.0.0.1:18082');
  assert.deepEqual(validateSemanticGatewayRuntimeConfig(providerEnv), { valid: true, errors: [], config });
  const summary = safeSemanticGatewayRuntimeSummary(config);
  assert.equal(summary.service_key_present, true);
  assert.equal(summary.provider_key_present, true);
  assert.equal(Object.hasOwn(summary, 'serviceApiKey'), false);
  assert.equal(Object.hasOwn(summary, 'providerApiKey'), false);
});

test('legacy/API_BASE or Dify/V43 variables cannot configure canonical Provider', () => {
  const legacyOnly = validateSemanticGatewayRuntimeConfig({
    SEMANTIC_GATEWAY_PROVIDER: 'openai_compatible',
    SEMANTIC_GATEWAY_API_KEY: 'service-key',
    SEMANTIC_GATEWAY_API_BASE: 'https://legacy-gateway.invalid',
    V43_GATEWAY_API_BASE: 'https://legacy.invalid',
    V43_GATEWAY_API_KEY: 'legacy-key',
    DIFY_API_BASE: 'https://dify.invalid',
    DIFY_API_KEY: 'legacy-key'
  });
  assert.equal(legacyOnly.valid, false);
  assert.deepEqual(legacyOnly.errors, ['MISSING_PROVIDER_BASE', 'MISSING_PROVIDER_KEY']);
});

test('Provider key cannot satisfy Gateway service auth and service key cannot satisfy Provider auth', () => {
  const missingProvider = validateSemanticGatewayRuntimeConfig({
    SEMANTIC_GATEWAY_PROVIDER: 'openai_compatible',
    SEMANTIC_GATEWAY_API_KEY: 'service-key',
    SEMANTIC_GATEWAY_PROVIDER_API_BASE: 'https://api.siliconflow.cn/v1',
    SEMANTIC_GATEWAY_MODEL: 'Qwen/Qwen2.5-7B-Instruct'
  });
  assert.deepEqual(missingProvider.errors, ['MISSING_PROVIDER_KEY']);
  const missingService = validateSemanticGatewayRuntimeConfig({
    SEMANTIC_GATEWAY_PROVIDER: 'openai_compatible',
    SEMANTIC_GATEWAY_PROVIDER_API_BASE: 'https://api.siliconflow.cn/v1',
    SEMANTIC_GATEWAY_PROVIDER_API_KEY: 'provider-key',
    SEMANTIC_GATEWAY_MODEL: 'Qwen/Qwen2.5-7B-Instruct'
  });
  assert.deepEqual(missingService.errors, ['MISSING_SERVICE_KEY']);
});

test('canonical live config rejects mock and missing gateway base before any Provider call', () => {
  const mock = validateSemanticGatewayLiveConfig({
    ...providerEnv,
    SEMANTIC_GATEWAY_PROVIDER: 'mock'
  });
  assert.equal(mock.valid, false);
  assert.ok(mock.errors.includes('LIVE_PROVIDER_MOCK_FORBIDDEN'));

  const missingBase = validateSemanticGatewayLiveConfig({
    ...providerEnv,
    SEMANTIC_GATEWAY_API_BASE: ''
  });
  assert.equal(missingBase.valid, false);
  assert.deepEqual(missingBase.errors, ['MISSING_GATEWAY_BASE']);
});

test('static runtime config guard covers canonical names, roles, secrets and legacy isolation', () => {
  const result = runRuntimeConfigStaticCheck();
  assert.equal(result.status, 'PASS');
  assert.deepEqual(result.issues, []);
  assert.equal(result.checks.live_mock_rejected, true);
  assert.equal(result.checks.legacy_isolated, true);
});

test('preflight verifies health, readiness and service-auth negative controls without model calls', async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url, options });
    if (url.endsWith('/health')) return new Response(JSON.stringify({ status: 'ok' }), { status: 200 });
    if (url.endsWith('/ready')) return new Response(JSON.stringify({ status: 'ready', provider_configured: true }), { status: 200 });
    const auth = options.headers?.authorization;
    if (auth === 'Bearer service-key') return new Response(JSON.stringify({ error_code: 'TASK_UNSUPPORTED' }), { status: 422 });
    return new Response(JSON.stringify({ error_code: 'AUTH_INVALID' }), { status: 401 });
  };
  const output = [];
  const exitCode = await runSemanticGatewayPreflight({
    env: providerEnv,
    fetchImpl,
    stdout: value => output.push(JSON.parse(value)),
    stderr: value => { throw new Error(value); }
  });
  assert.equal(exitCode, 0);
  assert.equal(output[0].status, 'PASS');
  assert.deepEqual(output[0].service_auth, { correct_key: 'PASS', wrong_key: 'PASS', missing_key: 'PASS' });
  assert.equal(calls.length, 5);
});
