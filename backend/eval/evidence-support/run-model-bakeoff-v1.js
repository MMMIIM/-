import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSemanticGatewayEnvironment, readSemanticGatewayRuntimeConfig, validateSemanticGatewayLiveConfig } from '../../../packages/semantic-contracts/runtime-config.js';
import { OpenAICompatibleProvider } from '../../../services/semantic-gateway/src/provider/openai-compatible-provider.js';
import { createStandaloneGatewayServer } from '../../../services/semantic-gateway/src/gateway.js';
import { SemanticGatewayClient } from '../../src/pipeline/semantic-gateway-client.js';
import { SemanticGatewayEvidenceSupportEvaluator } from '../../src/pipeline/semantic-gateway-evidence-support-evaluator.js';
import { adaptRetrievalCandidate, aggregateEvidenceSufficiency } from '../../src/pipeline/evidence-support-assessment-contract-v1.js';
import { EVIDENCE_SUPPORT_PROVIDER_JSON_SCHEMA } from '../../src/pipeline/evidence-support-assessment-gateway-contract-v1.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '../../..');
const PACKET_PATH = path.join(HERE, 'calibration-v2', 'GPT_REVIEW_PACKET_EVIDENCE_SUFFICIENCY_OFFLINE_V3.json');
const SERVICE_ENV_PATH = path.join(REPO_ROOT, 'services/semantic-gateway/.env');
const REPORT_DIR = path.join(REPO_ROOT, 'backend/eval/reports/stage20-model-bakeoff-v1');
const AGGREGATE_PATH = path.join(REPORT_DIR, 'aggregate.json');
const MODELS = Object.freeze([
  'deepseek-ai/DeepSeek-V4-Pro',
  'deepseek-ai/DeepSeek-V3.2',
  'deepseek-ai/DeepSeek-V4-Flash',
  'Qwen/Qwen2.5-7B-Instruct'
]);
const TASK_TYPE = 'evidence_support_assessment';
const CAPABILITY_TIMEOUT_MS = 30_000;
const CASE_TIMEOUT_MS = 120_000;

function safeErrorCode(error) {
  const value = String(error?.code || error?.audit?.technical_error_code || error?.audit?.gateway_error_code || '').trim();
  return /^[A-Z0-9_:-]{1,80}$/.test(value) ? value : 'BAKEOFF_ERROR';
}

function safeErrorMessage(error) {
  const value = String(error?.message || '').replace(/Bearer\s+[^\s"']+/gi, 'Bearer [REDACTED]');
  return value.replace(/https?:\/\/[^\s"']+/gi, '[URL_REDACTED]').slice(0, 240);
}

function timeoutSignal(timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return { controller, clear: () => clearTimeout(timer) };
}

async function fetchJson(url, options = {}, timeoutMs = CAPABILITY_TIMEOUT_MS, fetchImpl = fetch) {
  const { controller, clear } = timeoutSignal(timeoutMs);
  try {
    const response = await fetchImpl(url, { ...options, signal: controller.signal });
    let body = null;
    try { body = await response.json(); } catch (_error) { /* safe metadata only */ }
    return { response, body };
  } catch (error) {
    throw Object.assign(new Error(error?.name === 'AbortError' ? 'Provider capability request timed out.' : 'Provider capability request failed.'), {
      code: error?.name === 'AbortError' ? 'TIMEOUT' : safeErrorCode(error),
      cause: error
    });
  } finally {
    clear();
  }
}

function modelIds(body) {
  const values = Array.isArray(body?.data) ? body.data : [];
  return values.map(value => typeof value?.id === 'string' ? value.id : '').filter(Boolean);
}

function safeProviderStatus(response) {
  return Number.isInteger(response?.status) ? response.status : null;
}

function capabilitySchema() {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['status', 'items'],
    properties: {
      status: { type: 'string', enum: ['ok'] },
      items: { type: 'array' }
    }
  };
}

async function capabilityProbe({ baseUrl, apiKey, model, fetchImpl = fetch }) {
  const request = {
    model,
    messages: [
      { role: 'system', content: 'Return only the requested JSON object.' },
      { role: 'user', content: 'Return exactly {"status":"ok","items":[]}. This is a capability probe with no project data.' }
    ],
    response_format: {
      type: 'json_schema',
      json_schema: { name: 'stage20_model_bakeoff_capability_v1', strict: true, schema: capabilitySchema() }
    },
    max_tokens: 100,
    temperature: 0,
    stream: false
  };
  let result;
  try {
    result = await fetchJson(`${baseUrl.replace(/\/+$/, '')}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    }, CAPABILITY_TIMEOUT_MS, fetchImpl);
  } catch (error) {
    return {
      model_available: null,
      json_schema_supported: false,
      provider_http_status: null,
      authentication_status: 'NOT_REACHED',
      non_streaming_chat: 'NOT_REACHED',
      reason_code: safeErrorCode(error)
    };
  }
  const status = safeProviderStatus(result.response);
  const auth = status === 401 || status === 403 ? 'FAIL' : status && status >= 200 && status < 300 ? 'PASS' : 'NOT_REACHED';
  if (!result.response.ok) {
    return {
      model_available: null,
      json_schema_supported: false,
      provider_http_status: status,
      authentication_status: auth,
      non_streaming_chat: 'FAIL',
      reason_code: status === 400 || status === 404 || status === 422 ? 'JSON_SCHEMA_UNSUPPORTED_OR_INVALID' : `HTTP_${status || 'UNKNOWN'}`
    };
  }
  const content = result.body?.choices?.[0]?.message?.content;
  let parsed = null;
  try { parsed = JSON.parse(String(content)); } catch (_error) { /* capability failure */ }
  const valid = parsed?.status === 'ok' && Array.isArray(parsed?.items);
  return {
    model_available: null,
    json_schema_supported: valid,
    provider_http_status: status,
    authentication_status: 'PASS',
    non_streaming_chat: 'PASS',
    reason_code: valid ? null : 'JSON_SCHEMA_RESPONSE_INVALID',
    finish_reason: typeof result.body?.choices?.[0]?.finish_reason === 'string' ? result.body.choices[0].finish_reason : null,
    prompt_tokens: Number.isInteger(result.body?.usage?.prompt_tokens) ? result.body.usage.prompt_tokens : null,
    completion_tokens: Number.isInteger(result.body?.usage?.completion_tokens) ? result.body.usage.completion_tokens : null
  };
}

function buildCase(item) {
  const requirement = { req_id: item.requirement.requirement_id, text: item.requirement.text };
  const adapters = item.frozen_evidence_inputs.map((source, index) => adaptRetrievalCandidate({
    requirement,
    candidate: {
      candidate_id: source.candidate_id,
      metadata: { raw_rank: source.raw_rank, source_eligibility: source.source_eligibility }
    },
    sourceSpan: {
      source_span_id: `BAKEOFF-SPAN-${source.candidate_id}-${index + 1}`,
      source_text: source.source_text,
      source_text_hash: source.source_text_hash
    },
    material: { material_id: source.lineage.material_id, document_id: source.lineage.document_id },
    lineage: { ...source.lineage, project_id: 'STAGE20-S-SYNTHETIC-BAKEOFF' }
  }));
  return { caseId: item.case_id, requirement, adapters, oracle: item.expected, evidenceDetail: item.evidence_detail, runtimeAssessment: item.runtime_assessment };
}

function observedDiagnostics(diagnostics) {
  const value = diagnostics && typeof diagnostics === 'object' ? diagnostics : {};
  return {
    provider_http_status: Number.isInteger(value.provider_http_status) ? value.provider_http_status : null,
    provider_adapter_invoked: value.provider_adapter_invoked === true,
    provider_http_reached: value.provider_http_reached === true,
    finish_reason: typeof value.finish_reason === 'string' ? value.finish_reason : null,
    prompt_tokens: Number.isInteger(value.prompt_tokens) ? value.prompt_tokens : null,
    completion_tokens: Number.isInteger(value.completion_tokens) ? value.completion_tokens : null,
    total_tokens: Number.isInteger(value.total_tokens) ? value.total_tokens : null,
    response_model: typeof value.response_model === 'string' ? value.response_model : null,
    output_truncated: value.output_truncated === true,
    json_parse_success: value.json_parse_success === true,
    legacy_schema_detected: value.legacy_schema_detected === true,
    legacy_schema_tokens_observed: Array.isArray(value.legacy_schema_tokens_observed)
      ? value.legacy_schema_tokens_observed.filter(item => typeof item === 'string').slice(0, 20)
      : [],
    generation_config: value.generation_config && typeof value.generation_config === 'object'
      ? { response_format: value.generation_config.response_format, max_tokens: value.generation_config.max_tokens, temperature: value.generation_config.temperature, stream: value.generation_config.stream }
      : null
  };
}

function setEqual(a = [], b = []) {
  return JSON.stringify([...new Set(a)].sort()) === JSON.stringify([...new Set(b)].sort());
}

function caseMetrics({ caseData, assessments, aggregate, diagnostics, error = null }) {
  const expectedStatus = caseData.oracle?.status || null;
  const selected = assessments?.find(item => item.source?.source_id === caseData.evidenceDetail?.source_id) || assessments?.[0] || null;
  const dimensions = caseData.oracle?.required_dimensions || {};
  const dimensionEntries = Object.entries(dimensions);
  const dimensionCorrect = selected
    ? dimensionEntries.filter(([name, spec]) => selected.review_dimensions?.[name] === spec.expected).length
    : 0;
  const expectedRelationship = caseData.runtimeAssessment?.semantic_relationship || null;
  const expectedReasons = caseData.oracle?.reason_codes || [];
  const observedReasons = aggregate?.reason_codes || [];
  const businessStatus = aggregate?.status || null;
  const technicalFailure = Boolean(error) || businessStatus === 'ASSESSMENT_UNAVAILABLE';
  const unsafeFalseSupported = expectedStatus !== 'EVIDENCE_REVIEW_READY' && businessStatus === 'EVIDENCE_REVIEW_READY' ? 1 : 0;
  return {
    case_id: caseData.caseId,
    expected_status: expectedStatus,
    observed_status: businessStatus,
    status_match: expectedStatus !== null && expectedStatus === businessStatus,
    selected_source_id: caseData.evidenceDetail?.source_id || null,
    selected_relationship: selected?.semantic_relationship || null,
    expected_relationship: expectedRelationship,
    relationship_match: Boolean(expectedRelationship && selected?.semantic_relationship === expectedRelationship),
    required_dimension_correct: dimensionCorrect,
    required_dimension_total: dimensionEntries.length,
    required_dimension_accuracy: dimensionEntries.length ? dimensionCorrect / dimensionEntries.length : null,
    expected_reason_codes: expectedReasons,
    observed_reason_codes: observedReasons,
    reason_code_match: setEqual(expectedReasons, observedReasons),
    unsafe_false_supported: unsafeFalseSupported,
    technical_failure: technicalFailure,
    technical_error: error ? safeErrorCode(error) : null,
    malformed_output: diagnostics?.json_parse_success === false || diagnostics?.provider_http_status === 200 && !aggregate,
    truncation: diagnostics?.output_truncated === true,
    legacy_schema_output: diagnostics?.legacy_schema_detected === true || diagnostics?.legacy_schema_tokens_observed?.length > 0,
    semantic_repair_fallback: false
  };
}

function median(values) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

function percentile(values, percentileValue) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  return sorted[Math.min(sorted.length - 1, Math.ceil((percentileValue / 100) * sorted.length) - 1)];
}

function estimateCost(totalInputTokens, totalOutputTokens, env) {
  const inputRate = Number(env.SEMANTIC_GATEWAY_INPUT_COST_PER_1M_TOKENS);
  const outputRate = Number(env.SEMANTIC_GATEWAY_OUTPUT_COST_PER_1M_TOKENS);
  if (!Number.isFinite(inputRate) || !Number.isFinite(outputRate)) return null;
  return (totalInputTokens * inputRate + totalOutputTokens * outputRate) / 1_000_000;
}

async function startEvalGateway({ provider, serviceKey }) {
  const server = createStandaloneGatewayServer({
    config: { apiKey: serviceKey, providerName: 'openai_compatible', provider },
    logger: { info() {}, warn() {} }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  return { server, baseUrl: `http://127.0.0.1:${address.port}` };
}

async function runModel({ model, structuredOutputMode, runtime, cases, env, fetchImpl = fetch }) {
  const responseFormat = structuredOutputMode === 'json_schema'
    ? { type: 'json_schema', json_schema: { name: 'evidence_support_assessment_v1', strict: true, schema: EVIDENCE_SUPPORT_PROVIDER_JSON_SCHEMA } }
    : { type: 'json_object' };
  const provider = new OpenAICompatibleProvider({
    baseUrl: runtime.providerApiBase,
    apiKey: runtime.providerApiKey,
    model,
    timeoutMs: CASE_TIMEOUT_MS,
    fetchImpl,
    generationConfig: { response_format: responseFormat, max_tokens: 3200, temperature: 0.1, top_p: 0.9, top_k: 20, frequency_penalty: 0, stream: false },
    logger: { warn() {} }
  });
  const gateway = await startEvalGateway({ provider, serviceKey: runtime.serviceApiKey });
  const casesOutput = [];
  try {
    for (const caseData of cases) {
      const started = Date.now();
      let providerDiagnostics = null;
      let gatewayCallCount = 0;
      const observedFetch = async (url, options) => {
        gatewayCallCount += 1;
        const headers = new Headers(options?.headers || {});
        headers.set('x-semantic-gateway-diagnostic', 'probe-v1');
        const response = await fetchImpl(url, { ...options, headers });
        try {
          const body = await response.clone().json();
          providerDiagnostics = observedDiagnostics(body?.probe_diagnostics);
        } catch (_error) { /* client performs canonical parsing */ }
        return response;
      };
      const client = new SemanticGatewayClient({
        apiBase: gateway.baseUrl,
        apiKey: runtime.serviceApiKey,
        user: 'stage20-model-bakeoff-v1',
        fetchImpl: observedFetch,
        timeoutMs: CASE_TIMEOUT_MS,
        taskTimeouts: { [TASK_TYPE]: CASE_TIMEOUT_MS },
        configuredTaskType: TASK_TYPE,
        configSource: 'stage20_model_bakeoff_eval'
      });
      const evaluator = new SemanticGatewayEvidenceSupportEvaluator({ client });
      let assessments = null;
      let aggregate = null;
      let error = null;
      try {
        assessments = (await evaluator.assess({ requirement: caseData.requirement, adapters: caseData.adapters })).assessments;
        aggregate = aggregateEvidenceSufficiency(assessments);
      } catch (caught) {
        error = caught;
      }
      const latency = Date.now() - started;
      const diagnostics = providerDiagnostics || {};
      const metrics = caseMetrics({ caseData, assessments: assessments || [], aggregate, diagnostics, error });
      casesOutput.push({
        ...metrics,
        model,
        provider: 'SiliconFlow',
        structured_output_mode: structuredOutputMode,
        latency_ms: latency,
        provider_call_count: diagnostics.provider_adapter_invoked ? 1 : 0,
        gateway_request_count: gatewayCallCount,
        provider_reached: diagnostics.provider_http_reached,
        provider_http_status: diagnostics.provider_http_status,
        finish_reason: diagnostics.finish_reason,
        prompt_tokens: diagnostics.prompt_tokens,
        completion_tokens: diagnostics.completion_tokens,
        total_tokens: diagnostics.total_tokens,
        json_parse: diagnostics.json_parse_success ? 'PASS' : error ? 'FAIL' : 'NOT_REPORTED',
        canonical_schema: aggregate ? 'PASS' : 'FAIL',
        normalized_assessment: assessments ? assessments.map(item => ({
          source_id: item.source?.source_id || null,
          semantic_relevance: item.semantic_relevance,
          evidence_capability: item.evidence_capability,
          support_level: item.support_level,
          semantic_relationship: item.semantic_relationship,
          review_dimensions: item.review_dimensions,
          reason_codes: item.reason_codes,
          support_observation_count: Array.isArray(item.support_observations) ? item.support_observations.length : 0
        })) : [],
        aggregate_status: aggregate?.status || null,
        technical_error: error ? { code: safeErrorCode(error), message: safeErrorMessage(error) } : null,
        effective_generation: diagnostics.generation_config || { response_format: { type: structuredOutputMode }, max_tokens: 3200, temperature: 0.1, stream: false }
      });
    }
  } finally {
    await new Promise(resolve => gateway.server.close(resolve));
  }
  const totalInputTokens = casesOutput.reduce((sum, item) => sum + (item.prompt_tokens || 0), 0);
  const totalOutputTokens = casesOutput.reduce((sum, item) => sum + (item.completion_tokens || 0), 0);
  const statusMatches = casesOutput.filter(item => item.status_match).length;
  const relationshipMatches = casesOutput.filter(item => item.relationship_match).length;
  const reasonMatches = casesOutput.filter(item => item.reason_code_match).length;
  const schemaPasses = casesOutput.filter(item => item.canonical_schema === 'PASS').length;
  return {
    model,
    provider: 'SiliconFlow',
    structured_output_mode: structuredOutputMode,
    cases_executed: casesOutput.length,
    logical_requests: casesOutput.length,
    provider_calls: casesOutput.reduce((sum, item) => sum + item.provider_call_count, 0),
    cases: casesOutput,
    metrics: {
      canonical_schema_pass_rate: casesOutput.length ? schemaPasses / casesOutput.length : null,
      semantic_accuracy: casesOutput.length ? statusMatches / casesOutput.length : null,
      relationship_accuracy: casesOutput.length ? relationshipMatches / casesOutput.length : null,
      reason_code_accuracy: casesOutput.length ? reasonMatches / casesOutput.length : null,
      unsafe_false_supported: casesOutput.reduce((sum, item) => sum + item.unsafe_false_supported, 0),
      technical_failures: casesOutput.filter(item => item.technical_failure).length,
      malformed_outputs: casesOutput.filter(item => item.malformed_output).length,
      truncations: casesOutput.filter(item => item.truncation).length,
      legacy_schema_outputs: casesOutput.filter(item => item.legacy_schema_output).length,
      semantic_repair_fallbacks: casesOutput.filter(item => item.semantic_repair_fallback).length,
      median_latency_ms: median(casesOutput.map(item => item.latency_ms)),
      p95_latency_ms: percentile(casesOutput.map(item => item.latency_ms), 95),
      average_total_tokens: casesOutput.length ? (totalInputTokens + totalOutputTokens) / casesOutput.length : null,
      total_input_tokens: totalInputTokens,
      total_output_tokens: totalOutputTokens,
      total_tokens: totalInputTokens + totalOutputTokens,
      estimated_cost: estimateCost(totalInputTokens, totalOutputTokens, env)
    }
  };
}

function summarizeModel(result, capability) {
  return {
    model: result.model,
    model_available: capability.model_available,
    json_schema_supported: capability.json_schema_supported,
    cases_executed: result.cases_executed,
    schema_pass_rate: result.metrics.canonical_schema_pass_rate,
    semantic_accuracy: result.metrics.semantic_accuracy,
    unsafe_false_supported: result.metrics.unsafe_false_supported,
    relationship_accuracy: result.metrics.relationship_accuracy,
    reason_code_accuracy: result.metrics.reason_code_accuracy,
    technical_failures: result.metrics.technical_failures,
    malformed_outputs: result.metrics.malformed_outputs,
    median_latency_ms: result.metrics.median_latency_ms,
    total_tokens: result.metrics.total_tokens,
    estimated_cost: result.metrics.estimated_cost
  };
}

export { buildCase, caseMetrics };

export async function runModelBakeoff({ env: providedEnv, fetchImpl = fetch } = {}) {
  const env = loadSemanticGatewayEnvironment({ env: providedEnv || process.env, envFile: SERVICE_ENV_PATH });
  const liveConfig = validateSemanticGatewayLiveConfig(env);
  const runtime = readSemanticGatewayRuntimeConfig(env);
  if (!liveConfig.valid) {
    return { status: 'BLOCKED_CONFIG', config_errors: liveConfig.errors };
  }
  const packet = JSON.parse(fs.readFileSync(PACKET_PATH, 'utf8'));
  const cases = packet.cases.map(buildCase);
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const models = [];
  let modelsResult;
  try {
    modelsResult = await fetchJson(`${runtime.providerApiBase.replace(/\/+$/, '')}/models?sub_type=chat`, {
      method: 'GET', headers: { Authorization: `Bearer ${runtime.providerApiKey}` }
    }, CAPABILITY_TIMEOUT_MS, fetchImpl);
  } catch (error) {
    const blocked = {
      schema_version: 'stage20-model-bakeoff-v1',
      dataset: 'Stage20-S Evidence Sufficiency Offline V3.1 accepted six-case set',
      provider: 'SiliconFlow',
      status: 'BLOCKED_PROVIDER_NETWORK',
      provider_http_status: null,
      safe_error_code: safeErrorCode(error),
      external_calls: { capability_models_get: 0, capability_structured_probes: 0, logical_case_requests: 0, retries: 0, dify: 0, embedding: 0 },
      production_model_changed: false
    };
    fs.writeFileSync(AGGREGATE_PATH, JSON.stringify(blocked, null, 2));
    return blocked;
  }
  if (modelsResult.response.status === 401 || modelsResult.response.status === 403) {
    return { status: 'BLOCKED_PROVIDER_AUTH', provider_http_status: modelsResult.response.status };
  }
  if (!modelsResult.response.ok) {
    return { status: 'BLOCKED_PROVIDER_MODELS', provider_http_status: modelsResult.response.status };
  }
  const availableIds = new Set(modelIds(modelsResult.body));
  for (const model of MODELS) {
    const capability = await capabilityProbe({ baseUrl: runtime.providerApiBase, apiKey: runtime.providerApiKey, model, fetchImpl });
    capability.model_available = availableIds.has(model);
    if (capability.authentication_status === 'FAIL') {
      models.push({ model, capability, result: { model, cases_executed: 0, provider_calls: 1, cases: [], metrics: {} } });
      continue;
    }
    if (!capability.model_available) {
      models.push({ model, capability, result: { model, cases_executed: 0, provider_calls: 0, cases: [], metrics: {} } });
      continue;
    }
    const mode = capability.json_schema_supported ? 'json_schema' : 'json_object';
    const result = await runModel({ model, structuredOutputMode: mode, runtime, cases, env, fetchImpl });
    models.push({ model, capability, result });
    fs.writeFileSync(path.join(REPORT_DIR, `${model.replace(/[^a-zA-Z0-9._-]+/g, '_')}.json`), JSON.stringify({ schema_version: 'stage20-model-bakeoff-v1', ...result, capability }, null, 2));
  }
  const summaries = models.map(item => item.result.cases_executed ? summarizeModel(item.result, item.capability) : {
    model: item.model,
    model_available: item.capability.model_available,
    json_schema_supported: item.capability.json_schema_supported,
    cases_executed: 0,
    schema_pass_rate: null,
    semantic_accuracy: null,
    unsafe_false_supported: 0,
    relationship_accuracy: null,
    reason_code_accuracy: null,
    technical_failures: 0,
    malformed_outputs: 0,
    median_latency_ms: null,
    total_tokens: 0,
    estimated_cost: null
  });
  const ranked = [...summaries].sort((a, b) => {
    const gate = item => item.unsafe_false_supported === 0 && item.schema_pass_rate === 1 && item.cases_executed === cases.length;
    if (gate(a) !== gate(b)) return gate(a) ? -1 : 1;
    return (b.semantic_accuracy || -1) - (a.semantic_accuracy || -1);
  });
  const aggregate = {
    schema_version: 'stage20-model-bakeoff-v1',
    dataset: 'Stage20-S Evidence Sufficiency Offline V3.1 accepted six-case set',
    provider: 'SiliconFlow',
    models: summaries,
    ranking: ranked.map(item => item.model),
    recommended_stage20_model: null,
    production_model_changed: false,
    external_calls: { capability_models_get: 1, capability_structured_probes: models.length, logical_case_requests: models.reduce((sum, item) => sum + item.result.cases_executed, 0), retries: 0, dify: 0, embedding: 0 },
    report_directory: path.relative(REPO_ROOT, REPORT_DIR).replaceAll('\\', '/'),
    status: 'COMPLETED'
  };
  const eligible = ranked.find(item => item.cases_executed === cases.length && item.schema_pass_rate === 1 && item.unsafe_false_supported === 0 && item.technical_failures === 0);
  aggregate.recommended_stage20_model = eligible?.model || null;
  fs.writeFileSync(AGGREGATE_PATH, JSON.stringify(aggregate, null, 2));
  return aggregate;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  try {
    if (process.env.ALLOW_STAGE20_MODEL_BAKEOFF !== 'true') {
      console.log(JSON.stringify({
        status: 'NOT_AUTHORIZED_FOR_LIVE',
        required_explicit_environment_flag: 'ALLOW_STAGE20_MODEL_BAKEOFF=true',
        external_calls: 0,
        production_model_changed: false
      }, null, 2));
      process.exitCode = 1;
    } else {
      const result = await runModelBakeoff();
      console.log(JSON.stringify(result, null, 2));
      process.exitCode = result.status === 'COMPLETED' ? 0 : 1;
    }
  } catch (error) {
    console.log(JSON.stringify({ status: 'FAILED', error_code: safeErrorCode(error), error_message: safeErrorMessage(error) }, null, 2));
    process.exitCode = 1;
  }
}
