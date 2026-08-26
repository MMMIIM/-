import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  loadSemanticGatewayEnvironment,
  readSemanticGatewayRuntimeConfig,
  safeSemanticGatewayRuntimeSummary
} from '../../packages/semantic-contracts/runtime-config.js';
import { OpenAICompatibleProvider } from '../../services/semantic-gateway/src/provider/openai-compatible-provider.js';
import {
  buildSemanticAdjudicationPrompt,
  SEMANTIC_ADJUDICATION_MAX_OUTPUT_TOKENS,
  SEMANTIC_ADJUDICATION_PROMPT_VERSION
} from '../src/pipeline/semantic-adjudication-prompt.js';
import {
  SEMANTIC_ADJUDICATION_FRAGMENT_SCHEMA,
  validateSemanticAdjudicationFragment
} from '../src/pipeline/evidence-support-review-evaluator.js';

const directory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(directory, '../..');
const resultPath = path.resolve(repoRoot, 'backend/eval/reports/semantic-adjudication-capability-latest.json');
const envFile = path.resolve(repoRoot, 'services/semantic-gateway/.env');
const CANDIDATES = Object.freeze([
  'deepseek-ai/DeepSeek-V4-Pro',
  'deepseek-ai/DeepSeek-V3.2',
  'deepseek-ai/DeepSeek-V4-Flash'
]);
const TASK_TYPE = 'semantic_adjudication_v1';
const SCHEMA_NAME = 'semantic_adjudication_fragment_v1';
const MAX_CALLS = CANDIDATES.length;

const sha256 = value => createHash('sha256').update(String(value)).digest('hex');
const nowIso = () => new Date().toISOString();
const safeText = value => String(value ?? '').replace(/Bearer\s+[^\s"']+/gi, 'Bearer [REDACTED]').slice(0, 200);

function safeModelListError(error) {
  return {
    http_status: Number.isInteger(error?.status) ? error.status : null,
    error_class: error?.name === 'AbortError' ? 'TIMEOUT' : 'MODEL_LIST_UNAVAILABLE'
  };
}

function syntheticCase() {
  const requirement = { requirement_id: 'SYN-ADJ-001', text: '系统应支持数据导出。' };
  const evidence = {
    source_id: 'SYN-EVIDENCE-001',
    source_span_id: 'SYN-SPAN-001',
    source_text: '平台支持以 CSV 格式导出记录。'
  };
  const unresolvedQuestion = '该证据是否足以支持所要求的数据导出能力？';
  const instruction = buildSemanticAdjudicationPrompt({
    requirement,
    candidateEvidence: evidence,
    deterministicFindings: { semantic_relationship: 'unknown', support_sufficiency: 'unknown' },
    unresolvedQuestion
  });
  return {
    requirement,
    evidence,
    instruction,
    payload: {
      task_type: TASK_TYPE,
      requirement,
      evidence,
      deterministic_findings: { semantic_relationship: 'unknown', support_sufficiency: 'unknown' },
      unresolved_question: unresolvedQuestion
    }
  };
}

function baseCandidate(model, instructionHash) {
  return {
    model,
    requested_model: model,
    response_model: null,
    model_available: 'NOT_VERIFIED',
    model_id_match: false,
    availability_source: null,
    provider_authentication: 'NOT_REACHED',
    provider_http_status: null,
    gateway_http_status: null,
    model_response_reached: false,
    json_schema_supported: 'INCONCLUSIVE',
    response_format: { type: 'json_schema', name: SCHEMA_NAME, strict: true },
    json_schema_used: true,
    finish_reason: null,
    prompt_tokens: null,
    completion_tokens: null,
    total_tokens: null,
    latency_ms: null,
    json_parse_success: false,
    semantic_fragment_schema_valid: false,
    normalization_status: 'NOT_REACHED',
    technical_error_class: null,
    provider_request_id: null,
    provider_trace_id: null,
    instruction_sha256: instructionHash,
    prompt_version: SEMANTIC_ADJUDICATION_PROMPT_VERSION,
    max_output_tokens: SEMANTIC_ADJUDICATION_MAX_OUTPUT_TOKENS,
    retry_count: 0,
    fallback_used: false,
    result: 'NOT_RUN'
  };
}

function classifyProviderFailure(error, transport = {}) {
  const status = Number(error?.provider_audit?.http_status || transport.http_status);
  if (status === 401 || status === 403) return 'PROVIDER_AUTH_FAILED';
  if (status === 404) return 'MODEL_NOT_AVAILABLE';
  if (status === 400) return transport.error_code === 'json_schema' ? 'JSON_SCHEMA_UNSUPPORTED' : 'PROVIDER_REQUEST_INVALID';
  if (error?.provider_audit?.output_truncated) return 'OUTPUT_TRUNCATED';
  if (error?.provider_audit?.json_parse_success === false) return 'JSON_INVALID';
  if (error?.code === 'PROVIDER_TIMEOUT') return 'PROVIDER_UNAVAILABLE';
  if (error?.code === 'PROVIDER_HTTP_FAILURE' || error?.code === 'PROVIDER_UNAVAILABLE') return 'PROVIDER_UNAVAILABLE';
  return 'TECHNICAL_UNKNOWN';
}

function observedProviderFetch(fetchImpl, transport) {
  return async (url, options) => {
    const response = await fetchImpl(url, options);
    transport.http_status = response.status;
    try {
      const body = await response.clone().json();
      const error = body?.error;
      if (error && typeof error === 'object') {
        transport.error_code = typeof error.code === 'string' ? error.code.slice(0, 80) : null;
        const message = typeof error.message === 'string' ? error.message : '';
        transport.error_message = safeText(message);
        if (/json[_ -]?schema|response[_ -]?format|structured/i.test(`${transport.error_code || ''} ${message}`)) {
          transport.error_code = 'json_schema';
        }
      }
    } catch (_error) {
      // The provider adapter remains responsible for normal response parsing.
    }
    return response;
  };
}

async function listModels({ baseUrl, apiKey, fetchImpl = fetch }) {
  const target = `${String(baseUrl).replace(/\/+$/, '')}/models?sub_type=chat`;
  const response = await fetchImpl(target, {
    method: 'GET',
    headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' }
  });
  let body = null;
  try { body = await response.json(); } catch (_error) { body = null; }
  if (response.status === 401 || response.status === 403) {
    const error = new Error('provider model-list authentication failed');
    error.status = response.status;
    throw error;
  }
  if (!response.ok) {
    const error = new Error('provider model-list unavailable');
    error.status = response.status;
    throw error;
  }
  const entries = Array.isArray(body?.data) ? body.data : [];
  return new Set(entries.map(item => typeof item === 'string' ? item : item?.id).filter(Boolean));
}

function markAvailable(candidate, availableModels) {
  if (!availableModels) return;
  candidate.availability_source = 'GET /models?sub_type=chat';
  candidate.model_id_match = availableModels.has(candidate.model);
  candidate.model_available = candidate.model_id_match ? 'YES' : 'NO';
}

function applyAudit(candidate, audit = {}) {
  candidate.provider_http_status = Number.isInteger(audit.http_status) ? audit.http_status : candidate.provider_http_status;
  candidate.response_model = typeof audit.response_model === 'string' ? audit.response_model : candidate.response_model;
  candidate.finish_reason = typeof audit.finish_reason === 'string' ? audit.finish_reason : candidate.finish_reason;
  candidate.prompt_tokens = Number.isInteger(audit.prompt_tokens) ? audit.prompt_tokens : candidate.prompt_tokens;
  candidate.completion_tokens = Number.isInteger(audit.completion_tokens) ? audit.completion_tokens : candidate.completion_tokens;
  candidate.total_tokens = Number.isInteger(audit.total_tokens) ? audit.total_tokens : candidate.total_tokens;
  candidate.latency_ms = Number.isInteger(audit.latency_ms) ? audit.latency_ms : candidate.latency_ms;
  candidate.provider_request_id = typeof audit.response_id === 'string' ? audit.response_id : candidate.provider_request_id;
  candidate.provider_trace_id = typeof audit.provider_trace_id === 'string' ? audit.provider_trace_id : candidate.provider_trace_id;
  candidate.model_response_reached = audit.http_status === 200 && typeof audit.model_content_length_chars === 'number';
}

async function probeCandidate({ model, runtime, caseData, instructionHash, fetchImpl = fetch }) {
  const candidate = baseCandidate(model, instructionHash);
  const transport = {};
  const started = Date.now();
  const provider = new OpenAICompatibleProvider({
    baseUrl: runtime.providerApiBase,
    apiKey: runtime.providerApiKey,
    model,
    timeoutMs: runtime.timeoutMs,
    fetchImpl: observedProviderFetch(fetchImpl, transport),
    logger: { warn() {} },
    generationConfig: {
      response_format: {
        type: 'json_schema',
        json_schema: { name: SCHEMA_NAME, strict: true, schema: SEMANTIC_ADJUDICATION_FRAGMENT_SCHEMA }
      },
      max_tokens: SEMANTIC_ADJUDICATION_MAX_OUTPUT_TOKENS,
      temperature: 0.1,
      top_p: 0.9,
      top_k: 20,
      frequency_penalty: 0,
      stream: false
    }
  });
  try {
    const result = await provider.invoke({ instruction: caseData.instruction, payload: caseData.payload });
    const audit = result.provider_audit || {};
    applyAudit(candidate, audit);
    candidate.model_available = 'YES';
    candidate.model_id_match = true;
    candidate.provider_authentication = 'PASS';
    candidate.json_schema_supported = 'YES';
    candidate.json_parse_success = audit.json_parse_success === true;
    candidate.normalization_status = 'PASS';
    validateSemanticAdjudicationFragment(result.data);
    candidate.semantic_fragment_schema_valid = true;
    candidate.result = candidate.finish_reason === 'length' ? 'FAIL' : 'PASS';
    if (candidate.finish_reason === 'length') candidate.technical_error_class = 'OUTPUT_TRUNCATED';
    return candidate;
  } catch (error) {
    applyAudit(candidate, error?.provider_audit || {});
    candidate.provider_http_status = candidate.provider_http_status || transport.http_status || null;
    if (candidate.provider_http_status === 200) {
      candidate.model_available = 'YES';
      candidate.model_id_match = true;
      candidate.json_schema_supported = 'YES';
    }
    candidate.provider_authentication = candidate.provider_http_status === 401 || candidate.provider_http_status === 403
      ? 'FAIL' : candidate.provider_http_status ? 'PASS' : 'NOT_VERIFIED';
    if (candidate.provider_http_status === 200) candidate.model_response_reached = true;
    candidate.technical_error_class = classifyProviderFailure(error, transport);
    if (candidate.technical_error_class === 'JSON_SCHEMA_UNSUPPORTED') candidate.json_schema_supported = 'NO';
    candidate.result = 'FAIL';
    return candidate;
  } finally {
    if (!candidate.latency_ms) candidate.latency_ms = Date.now() - started;
  }
}

function persist(result) {
  fs.mkdirSync(path.dirname(resultPath), { recursive: true });
  fs.writeFileSync(resultPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
}

function finishResult(result, stdout) {
  result.completed_at = nowIso();
  persist(result);
  stdout(JSON.stringify(result));
  return result;
}

export async function runSemanticAdjudicationCapabilityProbe({
  env = process.env,
  fetchImpl = fetch,
  stdout = console.log
} = {}) {
  const gatewayEnv = loadSemanticGatewayEnvironment({ env, envFile });
  const runtime = readSemanticGatewayRuntimeConfig(gatewayEnv);
  const caseData = syntheticCase();
  const instructionHash = sha256(caseData.instruction);
  const result = {
    schema_version: 'semantic-adjudication-capability-v1',
    task_type: TASK_TYPE,
    prompt_version: SEMANTIC_ADJUDICATION_PROMPT_VERSION,
    instruction_sha256: instructionHash,
    completed_at: null,
    runtime: {
      ...safeSemanticGatewayRuntimeSummary(runtime),
      production_model_changed: false
    },
    candidate_results: CANDIDATES.map(model => baseCandidate(model, instructionHash)),
    anti_drift: {
      model_specific_prompt_count: 0,
      model_specific_canonical_schema_count: 0,
      model_specific_business_branch_count: 0,
      production_model_changed: false,
      qwen_calls: 0,
      dify_calls: 0,
      embedding_calls: 0,
      retry_count: 0,
      fallback_count: 0
    },
    provider_model_list: { attempted: false, http_status: null, authentication: 'NOT_REACHED' },
    external_call_count: 0,
    result_file: 'backend/eval/reports/semantic-adjudication-capability-latest.json'
  };

  if (gatewayEnv.ALLOW_LIVE_SEMANTIC_ADJUDICATION_PROBE !== 'true') {
    result.candidate_results.forEach(candidate => {
      candidate.technical_error_class = 'PROBE_NOT_AUTHORIZED';
      candidate.result = 'NOT_RUN';
    });
    return finishResult(result, stdout);
  }

  if (runtime.provider !== 'openai_compatible' || !runtime.providerApiBase || !runtime.providerApiKey) {
    result.candidate_results.forEach(candidate => {
      candidate.technical_error_class = 'PROVIDER_UNAVAILABLE';
      candidate.result = 'NOT_RUN';
    });
    return finishResult(result, stdout);
  }

  let availableModels = null;
  result.provider_model_list.attempted = true;
  try {
    availableModels = await listModels({ baseUrl: runtime.providerApiBase, apiKey: runtime.providerApiKey, fetchImpl });
    result.provider_model_list.http_status = 200;
    result.provider_model_list.authentication = 'PASS';
    result.candidate_results.forEach(candidate => markAvailable(candidate, availableModels));
  } catch (error) {
    result.provider_model_list.http_status = Number.isInteger(error?.status) ? error.status : null;
    result.provider_model_list.authentication = error?.status === 401 || error?.status === 403 ? 'FAIL' : 'NOT_VERIFIED';
    if (result.provider_model_list.authentication === 'FAIL') {
      result.candidate_results.forEach(candidate => {
        candidate.model_available = 'NOT_VERIFIED';
        candidate.technical_error_class = 'PROVIDER_AUTH_FAILED';
        candidate.result = 'NOT_RUN';
      });
      return finishResult(result, stdout);
    }
  }

  for (const candidate of result.candidate_results) {
    if (candidate.model_available === 'NO') {
      candidate.technical_error_class = 'MODEL_NOT_AVAILABLE';
      candidate.result = 'NOT_RUN';
      continue;
    }
    const probed = await probeCandidate({ model: candidate.model, runtime, caseData, instructionHash, fetchImpl });
    Object.assign(candidate, probed);
    result.external_call_count += 1;
  }
  return finishResult(result, stdout);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await runSemanticAdjudicationCapabilityProbe();
  if (result.candidate_results.some(candidate => candidate.result === 'PASS')) process.exitCode = 0;
  else process.exitCode = 1;
}
