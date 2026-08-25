import { randomUUID } from 'node:crypto';
import http from 'node:http';
import {
  SEMANTIC_TASK_TYPES,
  SEMANTIC_GATEWAY_ERROR_CODES,
  getSemanticTaskContract,
  createGatewayEnvelope
} from '../../../packages/semantic-contracts/index.js';
import { createMockProvider } from './provider/mock-provider.js';
import { OpenAICompatibleProvider } from './provider/openai-compatible-provider.js';
import { createSemanticTaskRouter } from './task-router.js';
import {
  readSemanticGatewayRuntimeConfig,
  safeSemanticGatewayRuntimeSummary,
  validateSemanticGatewayRuntimeConfig
} from '../../../packages/semantic-contracts/runtime-config.js';

const safeErrorCodes = new Set(SEMANTIC_GATEWAY_ERROR_CODES);

function configFromEnv(env = process.env) {
  const runtime = readSemanticGatewayRuntimeConfig(env);
  const providerName = runtime.provider;
  const timeoutMs = runtime.timeoutMs;
  const runtimeValidation = validateSemanticGatewayRuntimeConfig(env, {
    requireProvider: providerName === 'openai_compatible'
  });
  return {
    providerName,
    apiKey: runtime.serviceApiKey,
    provider: providerName === 'mock'
      ? createMockProvider({ model: runtime.model })
      : new OpenAICompatibleProvider({
        baseUrl: runtime.providerApiBase,
        apiKey: runtime.providerApiKey,
        model: runtime.model,
        timeoutMs,
        logger: console
      }),
    timeoutMs,
    runtimeValidation,
    runtimeSummary: safeSemanticGatewayRuntimeSummary(runtime)
  };
}

function providerReady(config) {
  return Boolean(config.apiKey)
    && (config.providerName === 'mock' || Boolean(config.provider?.configured));
}

function errorCode(error) {
  if (safeErrorCodes.has(error?.code)) return error.code;
  if (error?.message === 'source excerpt is not source-bound' || error?.message === 'support excerpt is not source-bound' || error?.message === 'conflict excerpt is not source-bound') return 'SUPPORT_SPAN_INVALID';
  if (error?.message === 'TASK_UNSUPPORTED') return 'TASK_UNSUPPORTED';
  return 'INTERNAL_GATEWAY_ERROR';
}

function statusFor(code) {
  if (code === 'AUTH_INVALID') return 401;
  if (code === 'TASK_UNSUPPORTED' || code === 'INPUT_SCHEMA_INVALID' || code === 'OUTPUT_SCHEMA_INVALID' || code === 'SUPPORT_SPAN_INVALID') return 422;
  if (code === 'PROVIDER_TIMEOUT') return 504;
  if (code === 'PROVIDER_HTTP_FAILURE' || code === 'PROVIDER_UNAVAILABLE' || code === 'PROVIDER_OUTPUT_INVALID') return 502;
  return 500;
}

function safeMessage(code) {
  return {
    AUTH_INVALID: 'Gateway authentication failed.',
    TASK_UNSUPPORTED: 'The requested semantic task is not registered.',
    INPUT_SCHEMA_INVALID: 'Gateway input does not match the task contract.',
    PROVIDER_UNAVAILABLE: 'Semantic provider is unavailable.',
    PROVIDER_TIMEOUT: 'Semantic provider request timed out.',
    PROVIDER_HTTP_FAILURE: 'Semantic provider returned an HTTP failure.',
    PROVIDER_OUTPUT_INVALID: 'Semantic provider output failed strict JSON validation.',
    OUTPUT_SCHEMA_INVALID: 'Semantic output failed the task schema.',
    SUPPORT_SPAN_INVALID: 'Semantic support span is not source-bound.',
    INTERNAL_GATEWAY_ERROR: 'Semantic gateway internal error.'
  }[code] || 'Semantic gateway error.';
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) throw Object.assign(new Error('empty body'), { code: 'INPUT_SCHEMA_INVALID' });
  try { return JSON.parse(raw); } catch (_error) { throw Object.assign(new Error('invalid JSON body'), { code: 'INPUT_SCHEMA_INVALID' }); }
}

function writeJson(response, status, value) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  response.end(JSON.stringify(value));
}

function probeDiagnosticsRequested(request) {
  return String(request.headers['x-semantic-gateway-diagnostic'] || '') === 'probe-v1';
}

function legacySchemaDetected(value) {
  const assessments = Array.isArray(value?.data?.assessments)
    ? value.data.assessments
    : Array.isArray(value?.assessments) ? value.assessments : [];
  return assessments.length > 0 && assessments.some(item => (
    item && typeof item === 'object'
    && ['confidence', 'evidence_type', 'notes'].some(key => Object.prototype.hasOwnProperty.call(item, key))
    && !['semantic_relevance', 'evidence_capability', 'semantic_relationship', 'review_dimensions', 'reason_codes', 'support_observations']
      .some(key => Object.prototype.hasOwnProperty.call(item, key))
  ));
}

function safeProbeDiagnostics({ providerAudit = null, validationErrors = [], envelopeErrors = [], parsedJson = null } = {}) {
  const audit = providerAudit && typeof providerAudit === 'object' ? providerAudit : {};
  const modelContent = typeof audit.model_content === 'string' ? audit.model_content : null;
  return {
    model_content: modelContent && modelContent.length <= 200000 ? modelContent : modelContent ? `${modelContent.slice(0, 200000)}…` : null,
    parsed_json: audit.parsed_json ?? parsedJson,
    json_parse_success: typeof audit.json_parse_success === 'boolean' ? audit.json_parse_success : null,
    markdown_fence_present: typeof audit.markdown_fence_present === 'boolean' ? audit.markdown_fence_present : null,
    provider_http_status: Number.isInteger(audit.http_status) ? audit.http_status : null,
    schema_validation_errors: Array.isArray(validationErrors) ? validationErrors : [],
    envelope_validation_errors: Array.isArray(envelopeErrors) ? envelopeErrors : [],
    legacy_schema_detected: legacySchemaDetected(audit.parsed_json ?? parsedJson)
  };
}

export function createStandaloneGatewayHandler({ env = process.env, config = configFromEnv(env), logger = console } = {}) {
  const router = config.taskRouter || createSemanticTaskRouter({ provider: config.provider });
  return async function handle(request, response) {
    const requestId = randomUUID();
    const started = Date.now();
    const diagnosticsRequested = probeDiagnosticsRequested(request);
    if (request.method === 'GET' && request.url === '/health') {
      writeJson(response, 200, { status: 'ok', service: 'semantic-gateway', request_id: requestId });
      return;
    }
    if (request.method === 'GET' && request.url === '/ready') {
      const ready = providerReady(config);
      writeJson(response, ready ? 200 : 503, {
        status: ready ? 'ready' : 'not_ready',
        provider: config.providerName,
        task_registry_loaded: SEMANTIC_TASK_TYPES.length > 0,
        provider_configured: ready
      });
      return;
    }
    if (request.method !== 'POST' || request.url !== '/workflows/run') {
      writeJson(response, 404, { error_code: 'NOT_FOUND', message: 'Not found.' });
      return;
    }
    const expectedKey = config.apiKey;
    const authorization = String(request.headers.authorization || '');
    if (!expectedKey || authorization !== `Bearer ${expectedKey}`) {
      writeJson(response, 401, { error_code: 'AUTH_INVALID', message: safeMessage('AUTH_INVALID'), request_id: requestId });
      return;
    }
    let taskType;
    try {
      const body = await readJson(request);
      const inputs = body?.inputs;
      taskType = inputs?.task_type;
      const contract = getSemanticTaskContract(taskType);
      if (!contract || typeof inputs?.task_instruction !== 'string' || !inputs.task_instruction.trim() || typeof inputs?.task_payload_json !== 'string') {
        throw Object.assign(new Error('task input invalid'), { code: contract ? 'INPUT_SCHEMA_INVALID' : 'TASK_UNSUPPORTED' });
      }
      let payload;
      try { payload = JSON.parse(inputs.task_payload_json); } catch (_error) { throw Object.assign(new Error('task_payload_json invalid'), { code: 'INPUT_SCHEMA_INVALID' }); }
      const routed = await router.dispatch({ taskType, payload });
      const { data } = routed;
      const envelope = createGatewayEnvelope({ taskType, data, warnings: [] });
      const elapsed = Date.now() - started;
      logger?.info?.('Semantic gateway request', {
        request_id: requestId,
        task_type: taskType,
        contract_version: contract.contract_version,
        provider: config.providerName,
        model: config.provider?.model || 'mock-semantic-v1',
        latency_ms: elapsed,
        http_status: 200,
        input_bytes: Buffer.byteLength(inputs.task_payload_json),
        output_bytes: Buffer.byteLength(JSON.stringify(envelope))
      });
      const result = { data: { outputs: { response_payload_json: JSON.stringify(envelope) } } };
      if (diagnosticsRequested) {
        result.probe_diagnostics = safeProbeDiagnostics({ providerAudit: routed.provider_audit });
      }
      writeJson(response, 200, result);
    } catch (error) {
      const code = errorCode(error);
      const elapsed = Date.now() - started;
      logger?.warn?.('Semantic gateway request failed', {
        request_id: requestId,
        task_type: taskType || null,
        provider: config.providerName,
        latency_ms: elapsed,
        error_classification: code
      });
      const result = { error_code: code, message: safeMessage(code), request_id: requestId };
      if (diagnosticsRequested) {
        result.probe_diagnostics = safeProbeDiagnostics({
          providerAudit: error?.provider_audit,
          validationErrors: error?.validation_diagnostics,
          envelopeErrors: error?.envelope_validation_diagnostics
        });
      }
      writeJson(response, statusFor(code), result);
    }
  };
}

export function createStandaloneGatewayServer(options = {}) {
  return http.createServer(createStandaloneGatewayHandler(options));
}

export function gatewayConfigFromEnv(env = process.env) {
  return configFromEnv(env);
}

export function validateGatewayRuntimeConfig(env = process.env) {
  const config = configFromEnv(env);
  return {
    ...config.runtimeValidation,
    summary: config.runtimeSummary
  };
}
