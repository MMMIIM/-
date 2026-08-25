import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadSemanticGatewayEnvironment, readSemanticGatewayRuntimeConfig, safeSemanticGatewayRuntimeSummary, validateSemanticGatewayRuntimeConfig } from '../../packages/semantic-contracts/runtime-config.js';
import { getSemanticGatewayTask } from '../src/pipeline/semantic-gateway-task-registry.js';

const directory = dirname(fileURLToPath(import.meta.url));
const gatewayEnvFile = resolve(directory, '../../services/semantic-gateway/.env');
const gatewayTaskType = 'evidence_support_assessment';

async function request(baseUrl, { key, body, fetchImpl = fetch } = {}) {
  const headers = { 'content-type': 'application/json' };
  if (key) headers.authorization = `Bearer ${key}`;
  const response = await fetchImpl(`${baseUrl}/workflows/run`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body || { inputs: { task_type: '__semantic_gateway_preflight__', task_instruction: 'preflight', task_payload_json: '{}' } })
  });
  let payload = null;
  try { payload = await response.json(); } catch (_error) { /* safe status-only diagnostic */ }
  return { status: response.status, payload };
}

export async function runSemanticGatewayPreflight({ env = process.env, fetchImpl = fetch, stdout = console.log, stderr = console.error } = {}) {
  const runtimeEnv = loadSemanticGatewayEnvironment({ env, envFile: gatewayEnvFile });
  const runtime = readSemanticGatewayRuntimeConfig(runtimeEnv);
  const validation = validateSemanticGatewayRuntimeConfig(runtimeEnv, { requireProvider: true });
  const summary = safeSemanticGatewayRuntimeSummary(runtime);
  const result = {
    preflight: 'SEMANTIC_GATEWAY_PREFLIGHT',
    configuration_source: runtimeEnv === env ? 'process_environment' : 'services/semantic-gateway/.env_or_process_environment',
    ...summary,
    canonical_task_registered: Boolean(getSemanticGatewayTask(gatewayTaskType)),
    dify_fallback_enabled: false,
    health: 'NOT_REACHED',
    ready: 'NOT_REACHED',
    service_auth: { correct_key: 'NOT_REACHED', wrong_key: 'NOT_REACHED', missing_key: 'NOT_REACHED' },
    status: 'FAIL',
    errors: [...validation.errors]
  };
  if (!validation.valid) {
    stderr(JSON.stringify(result));
    return 1;
  }
  const gatewayBase = runtime.gatewayApiBase;
  if (!gatewayBase) {
    result.errors.push('MISSING_GATEWAY_BASE');
    stderr(JSON.stringify(result));
    return 1;
  }
  try {
    const health = await fetchImpl(`${gatewayBase}/health`);
    result.health = health.status === 200 ? 'PASS' : `HTTP_${health.status}`;
    const ready = await fetchImpl(`${gatewayBase}/ready`);
    result.ready = ready.status === 200 ? 'PASS' : `HTTP_${ready.status}`;
    if (health.status !== 200 || ready.status !== 200) {
      result.errors.push('GATEWAY_NOT_READY');
      stderr(JSON.stringify(result));
      return 1;
    }
    const correct = await request(gatewayBase, { key: runtime.serviceApiKey, fetchImpl });
    const wrong = await request(gatewayBase, { key: `${runtime.serviceApiKey}.wrong`, fetchImpl });
    const missing = await request(gatewayBase, { fetchImpl });
    result.service_auth = {
      correct_key: correct.status === 422 && correct.payload?.error_code === 'TASK_UNSUPPORTED' ? 'PASS' : `HTTP_${correct.status}`,
      wrong_key: wrong.status === 401 && wrong.payload?.error_code === 'AUTH_INVALID' ? 'PASS' : `HTTP_${wrong.status}`,
      missing_key: missing.status === 401 && missing.payload?.error_code === 'AUTH_INVALID' ? 'PASS' : `HTTP_${missing.status}`
    };
    const authPass = Object.values(result.service_auth).every(status => status === 'PASS');
    if (!authPass) result.errors.push('SERVICE_AUTH_CONTRACT_INVALID');
    result.status = authPass ? 'PASS' : 'FAIL';
    (result.status === 'PASS' ? stdout : stderr)(JSON.stringify(result));
    return result.status === 'PASS' ? 0 : 1;
  } catch (error) {
    result.errors.push(error?.code || error?.name || 'PREFLIGHT_FAILED');
    stderr(JSON.stringify(result));
    return 1;
  }
}

async function main() {
  process.exitCode = await runSemanticGatewayPreflight();
}

const isMain = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (isMain) await main();
