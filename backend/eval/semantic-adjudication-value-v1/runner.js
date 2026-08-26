import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  loadSemanticGatewayEnvironment,
  readSemanticGatewayRuntimeConfig,
  safeSemanticGatewayRuntimeSummary
} from '../../../packages/semantic-contracts/runtime-config.js';
import { OpenAICompatibleProvider } from '../../../services/semantic-gateway/src/provider/openai-compatible-provider.js';
import {
  adaptRetrievalCandidate
} from '../../src/pipeline/evidence-support-assessment-contract-v1.js';
import {
  EvidenceSupportReviewEvaluator,
  SEMANTIC_ADJUDICATION_FRAGMENT_SCHEMA,
  validateSemanticAdjudicationFragment
} from '../../src/pipeline/evidence-support-review-evaluator.js';
import { runDeterministicEvidenceChecks } from '../../src/pipeline/evidence-support-responsibility.js';
import {
  buildSemanticAdjudicationPrompt,
  SEMANTIC_ADJUDICATION_MAX_OUTPUT_TOKENS,
  SEMANTIC_ADJUDICATION_PROMPT_VERSION
} from '../../src/pipeline/semantic-adjudication-prompt.js';

const directory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(directory, '../../..');
const casesPath = path.resolve(directory, 'cases.json');
const defaultResultPath = path.resolve(repoRoot, 'backend/eval/reports/semantic-adjudication-value-v1-latest.json');
const envFile = path.resolve(repoRoot, 'services/semantic-gateway/.env');
const MODEL = 'deepseek-ai/DeepSeek-V4-Flash';
const TASK_TYPE = 'semantic_adjudication_v1';
const SCHEMA_NAME = 'semantic_adjudication_fragment_v1';

const sha256 = value => createHash('sha256').update(String(value)).digest('hex');
const percentile = (values, p) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, index)];
};

export function loadValueCases({ fsImpl = fs } = {}) {
  const packet = JSON.parse(fsImpl.readFileSync(casesPath, 'utf8'));
  if (packet.model_generated_oracle !== 0 || packet.oracle_owner !== 'HUMAN_AUTHORED_BEFORE_MODEL_CALL') {
    throw new Error('VALUE_EVAL_ORACLE_INVALID');
  }
  if (!Array.isArray(packet.cases) || packet.cases.length < 12 || packet.cases.length > 16) {
    throw new Error('VALUE_EVAL_CASE_COUNT_INVALID');
  }
  return packet;
}

function toAdapter(item) {
  return adaptRetrievalCandidate({
    requirement: { req_id: item.case_id, text: item.requirement_text },
    candidate: { candidate_id: `SAV1-CAND-${item.case_id}` },
    sourceSpan: {
      source_span_id: `SAV1-SPAN-${item.case_id}`,
      source_text: item.evidence_text
    },
    material: {
      material_id: `SAV1-MATERIAL-${item.case_id}`,
      document_id: `SAV1-DOC-${item.case_id}`,
      material_type: 'technical_solution',
      source_type: 'internal'
    },
    lineage: { project_id: 'SAFE_SYNTHETIC_EVAL_ONLY', eval_case_id: item.case_id }
  });
}

export function buildValueBaseline(packet = loadValueCases()) {
  const cases = packet.cases.map(item => {
    const adapter = toAdapter(item);
    const requirement = adapter.requirement;
    const deterministic = runDeterministicEvidenceChecks({ requirement, adapter });
    const serialized = JSON.stringify({ requirement: item.requirement_text, evidence: item.evidence_text });
    const roundTrip = JSON.parse(serialized);
    if (roundTrip.requirement !== item.requirement_text || roundTrip.evidence !== item.evidence_text) {
      throw new Error(`UTF8_INPUT_INTEGRITY_FAILED:${item.case_id}`);
    }
    return {
      case_id: item.case_id,
      category: item.category,
      expected_semantic_relationship: item.expected_semantic_relationship,
      unsafe_if_supported: item.unsafe_if_supported === true,
      allowed_reason_code_family: [...(item.allowed_reason_code_family || [])],
      oracle_rationale: item.oracle_rationale,
      requirement: { requirement_id: requirement.requirement_id, text: requirement.text },
      evidence: { source_id: adapter.source.source_id, source_span_id: adapter.source.source_span_id, source_text: adapter._source_text },
      deterministic_findings: deterministic,
      router_result: deterministic.decision,
      prompt: buildSemanticAdjudicationPrompt({
        requirement,
        candidateEvidence: { source_text: adapter._source_text },
        deterministicFindings: deterministic,
        unresolvedQuestion: item.unresolved_question
      }),
      payload: {
        task_type: TASK_TYPE,
        requirement: { requirement_id: requirement.requirement_id, text: requirement.text },
        evidence: { source_id: adapter.source.source_id, source_span_id: adapter.source.source_span_id, source_text: adapter._source_text },
        deterministic_findings: deterministic,
        unresolved_question: item.unresolved_question
      }
    };
  });
  const deterministicResolved = cases.filter(item => item.router_result !== 'NEEDS_SEMANTIC_ADJUDICATION');
  if (deterministicResolved.length) {
    throw new Error(`VALUE_EVAL_NOT_AMBIGUOUS:${deterministicResolved.map(item => item.case_id).join(',')}`);
  }
  return {
    schema_version: packet.schema_version,
    oracle_owner: packet.oracle_owner,
    model_generated_oracle: packet.model_generated_oracle,
    cases
  };
}

function safeText(value) {
  return String(value ?? '').replace(/Bearer\s+[^\s"']+/gi, 'Bearer [REDACTED]').slice(0, 240);
}

function classifyFailure(error, transport) {
  const status = Number(error?.provider_audit?.http_status || transport.http_status);
  if (status === 401 || status === 403) return 'AUTH_FAILED';
  if (status === 400 || status === 422) return transport.schemaError ? 'JSON_SCHEMA_UNSUPPORTED' : 'REQUEST_INVALID';
  if (error?.provider_audit?.output_truncated) return 'OUTPUT_TRUNCATED';
  if (error?.provider_audit?.json_parse_success === false) return 'JSON_INVALID';
  if (error?.code === 'PROVIDER_TIMEOUT') return 'TIMEOUT';
  if (error?.code === 'PROVIDER_UNAVAILABLE' || error?.code === 'PROVIDER_HTTP_FAILURE') return 'PROVIDER_UNAVAILABLE';
  if (error?.code === 'SEMANTIC_ADJUDICATION_FRAGMENT_INVALID') return 'FRAGMENT_SCHEMA_INVALID';
  return 'OTHER_TECHNICAL_FAILURE';
}

function fetchWithEvalSettings(fetchImpl, transport, requests) {
  return async (url, options = {}) => {
    const next = { ...options };
    if (typeof next.body === 'string') {
      const body = JSON.parse(next.body);
      body.enable_thinking = false;
      requests.push({ model: body.model || null, body });
      next.body = JSON.stringify(body);
    }
    const response = await fetchImpl(url, next);
    transport.http_status = response.status;
    try {
      const body = await response.clone().json();
      const error = body?.error;
      const message = typeof error?.message === 'string' ? error.message : '';
      transport.schemaError = /json[_ -]?schema|response[_ -]?format|structured/i.test(`${error?.code || ''} ${message}`);
      transport.safe_error_code = typeof error?.code === 'string' ? error.code.slice(0, 80) : null;
      transport.safe_error_message = safeText(message);
    } catch (_error) {
      // Provider adapter owns response parsing; no response body is persisted.
    }
    return response;
  };
}

async function listModels({ runtime, fetchImpl }) {
  const url = `${runtime.providerApiBase.replace(/\/+$/, '')}/models?sub_type=chat`;
  const response = await fetchImpl(url, { method: 'GET', headers: { Authorization: `Bearer ${runtime.providerApiKey}`, Accept: 'application/json' } });
  const body = await response.json().catch(() => null);
  if (response.status === 401 || response.status === 403) return { status: response.status, auth: 'FAIL', models: new Set() };
  if (!response.ok) return { status: response.status, auth: 'NOT_VERIFIED', models: new Set() };
  const models = new Set((Array.isArray(body?.data) ? body.data : []).map(item => typeof item === 'string' ? item : item?.id).filter(Boolean));
  return { status: response.status, auth: 'PASS', models };
}

function publicAudit(audit = {}) {
  return {
    response_model: typeof audit.response_model === 'string' ? audit.response_model : null,
    provider_http_status: Number.isInteger(audit.http_status) ? audit.http_status : null,
    finish_reason: typeof audit.finish_reason === 'string' ? audit.finish_reason : null,
    prompt_tokens: Number.isInteger(audit.prompt_tokens) ? audit.prompt_tokens : null,
    completion_tokens: Number.isInteger(audit.completion_tokens) ? audit.completion_tokens : null,
    reasoning_tokens: Number.isInteger(audit.reasoning_tokens) ? audit.reasoning_tokens : null,
    total_tokens: Number.isInteger(audit.total_tokens) ? audit.total_tokens : null,
    latency_ms: Number.isInteger(audit.latency_ms) ? audit.latency_ms : null,
    provider_request_id: typeof audit.response_id === 'string' ? audit.response_id : null,
    provider_trace_id: typeof audit.provider_trace_id === 'string' ? audit.provider_trace_id : null
  };
}

async function invokeCase(item, runtime, fetchImpl) {
  const requests = [];
  const transport = {};
  const started = Date.now();
  const provider = new OpenAICompatibleProvider({
    baseUrl: runtime.providerApiBase,
    apiKey: runtime.providerApiKey,
    model: MODEL,
    timeoutMs: runtime.timeoutMs,
    fetchImpl: fetchWithEvalSettings(fetchImpl, transport, requests),
    logger: { warn() {} },
    generationConfig: {
      response_format: { type: 'json_schema', json_schema: { name: SCHEMA_NAME, strict: true, schema: SEMANTIC_ADJUDICATION_FRAGMENT_SCHEMA } },
      max_tokens: SEMANTIC_ADJUDICATION_MAX_OUTPUT_TOKENS,
      temperature: 0.1,
      top_p: 0.9,
      top_k: 20,
      frequency_penalty: 0,
      stream: false
    }
  });
  const output = {
    case_id: item.case_id,
    category: item.category,
    expected: item.expected_semantic_relationship,
    actual: 'unknown',
    correct: false,
    unsafe_false_supported: false,
    model: MODEL,
    enable_thinking: false,
    prompt_version: SEMANTIC_ADJUDICATION_PROMPT_VERSION,
    instruction_sha256: sha256(item.prompt),
    response_format: { type: 'json_schema', name: SCHEMA_NAME, strict: true },
    json_schema_used: true,
    json_parse_success: false,
    fragment_schema_valid: false,
    normalization_status: 'NOT_REACHED',
    retry_count: 0,
    fallback_used: false,
    technical_error_class: null,
    ...publicAudit(),
    request_count: 0
  };
  try {
    const response = await provider.invoke({ instruction: item.prompt, payload: item.payload });
    output.request_count = requests.length;
    const audit = response.provider_audit || {};
    Object.assign(output, publicAudit(audit));
    output.json_parse_success = audit.json_parse_success === true;
    output.normalization_status = 'PASS';
    validateSemanticAdjudicationFragment(response.data);
    const evaluator = new EvidenceSupportReviewEvaluator({ semanticAdjudicator: { adjudicate: async () => response.data } });
    const assembled = await evaluator.assess({ context: {
      project_id: 'SAFE_SYNTHETIC_EVAL_ONLY',
      requirement_id: item.requirement.requirement_id,
      requirement_text: item.requirement.text,
      retrieval_run_id: `SAV1-RUN-${item.case_id}`,
      retrieval_candidate_id: item.evidence.source_id,
      source_span_id: item.evidence.source_span_id,
      source_text: item.evidence.source_text,
      source_text_hash: sha256(item.evidence.source_text)
    } });
    output.fragment_schema_valid = Boolean(assembled?.assessment);
    output.actual = response.data?.semantic_relationship || 'unknown';
    output.correct = output.actual === output.expected;
    output.unsafe_false_supported = item.unsafe_if_supported === true
      && (output.actual === 'direct' || response.data?.support_level === 'full_support');
    output.result = output.correct && !output.unsafe_false_supported ? 'PASS' : 'FAIL';
  } catch (error) {
    output.request_count = requests.length;
    Object.assign(output, publicAudit(error?.provider_audit || {}));
    output.technical_error_class = classifyFailure(error, transport);
    output.result = 'FAIL';
  }
  output.latency_ms = output.latency_ms || Date.now() - started;
  return output;
}

export function scoreValueResults(results) {
  const total = results.length;
  const valid = results.filter(item => item.fragment_schema_valid && item.json_parse_success).length;
  const correct = results.filter(item => item.correct).length;
  const decisiveCorrect = results.filter(item => item.correct && item.actual !== 'unknown').length;
  const uncertain = results.filter(item => item.actual === 'unknown').length;
  const wrong = results.filter(item => !item.correct).length;
  const unsafe = results.filter(item => item.unsafe_false_supported).length;
  const latencies = results.map(item => item.latency_ms).filter(Number.isFinite);
  const categoryAccuracy = name => {
    const subset = results.filter(item => item.category === name);
    return subset.length ? subset.filter(item => item.correct).length / subset.length : null;
  };
  return {
    total_cases: total,
    valid_fragment_rate: total ? valid / total : 0,
    semantic_accuracy: total ? correct / total : 0,
    correct_decisive_resolution_count: decisiveCorrect,
    uncertain_count: uncertain,
    wrong_relationship_count: wrong,
    unsafe_false_supported: unsafe,
    partial_accuracy: categoryAccuracy('PARTIAL_SUPPORT'),
    conflict_accuracy: categoryAccuracy('NATURAL_LANGUAGE_CONFLICT'),
    high_relevance_hard_negative_accuracy: categoryAccuracy('HIGH_RELEVANCE_NOT_SUFFICIENT'),
    mean_latency_ms: latencies.length ? latencies.reduce((sum, value) => sum + value, 0) / latencies.length : null,
    median_latency_ms: percentile(latencies, 50),
    p95_latency_ms: latencies.length >= 5 ? percentile(latencies, 95) : null,
    prompt_tokens: results.reduce((sum, item) => sum + (item.prompt_tokens || 0), 0),
    completion_tokens: results.reduce((sum, item) => sum + (item.completion_tokens || 0), 0),
    total_tokens: results.reduce((sum, item) => sum + (item.total_tokens || 0), 0),
    safe_resolution_rate: total ? decisiveCorrect / total : 0,
    potential_human_review_reduction: total ? decisiveCorrect / total : 0,
    value: unsafe > 0 ? 'INSUFFICIENT_OR_UNSAFE_VALUE'
      : correct / Math.max(1, total) >= 0.8 && decisiveCorrect / Math.max(1, total) >= 0.7 ? 'STRONG_VALUE'
        : 'MARGINAL_VALUE'
  };
}

function persist(result, outputPath, fsImpl = fs) {
  fsImpl.mkdirSync(path.dirname(outputPath), { recursive: true });
  fsImpl.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
}

export async function runSemanticAdjudicationValueV1({
  env = process.env,
  fetchImpl = fetch,
  resultPath = defaultResultPath,
  stdout = console.log,
  fsImpl = fs
} = {}) {
  const packet = loadValueCases({ fsImpl });
  const baseline = buildValueBaseline(packet);
  const runtimeEnv = loadSemanticGatewayEnvironment({ env, envFile, fsImpl });
  const runtime = readSemanticGatewayRuntimeConfig(runtimeEnv);
  const result = {
    schema_version: 'semantic-adjudication-value-v1-runtime',
    completed_at: null,
    model: MODEL,
    enable_thinking: false,
    prompt_version: SEMANTIC_ADJUDICATION_PROMPT_VERSION,
    fragment_schema: SCHEMA_NAME,
    utf8_input_integrity: 'PASS',
    production_db_writes: 0,
    knowledge_base_writes: 0,
    vector_store_writes: 0,
    formal_state_writes: 0,
    production_business_files_changed: 0,
    eval_write_capable_production_dependency_count: 0,
    runtime: safeSemanticGatewayRuntimeSummary(runtime),
    baseline: {
      total_cases: baseline.cases.length,
      router_results: Object.fromEntries([...new Set(baseline.cases.map(item => item.router_result))].map(value => [value, baseline.cases.filter(item => item.router_result === value).length])),
      deterministic_unresolved_count: baseline.cases.filter(item => item.router_result === 'NEEDS_SEMANTIC_ADJUDICATION').length
    },
    model_list: { attempted: false, http_status: null, authentication: 'NOT_REACHED', model_available: 'NOT_REACHED', model_id_match: false },
    case_results: [],
    external_calls: { model_list: 0, inference: 0, retries: 0, qwen: 0, dify: 0, embedding: 0 },
    result_file: path.relative(repoRoot, resultPath).replaceAll('\\', '/')
  };
  if (runtimeEnv.ALLOW_LIVE_SEMANTIC_ADJUDICATION_VALUE_V1 !== 'true') {
    result.stop_reason = 'LIVE_VALUE_EVAL_NOT_AUTHORIZED';
  } else if (runtime.provider !== 'openai_compatible' || !runtime.providerApiBase || !runtime.providerApiKey) {
    result.stop_reason = 'PROVIDER_CONFIG_INVALID';
  } else {
    result.model_list.attempted = true;
    result.external_calls.model_list = 1;
    let models;
    try {
      models = await listModels({ runtime, fetchImpl });
    } catch (error) {
      result.stop_reason = 'PROVIDER_UNAVAILABLE';
      result.model_list.authentication = 'NOT_VERIFIED';
      result.model_list.error_class = classifyFailure(error, {});
      models = null;
    }
    if (!models) {
      // Keep the safe report path below; no inference is attempted after a
      // failed model-list preflight.
    } else {
      result.model_list.http_status = models.status;
      result.model_list.authentication = models.auth;
      result.model_list.model_available = models.models.has(MODEL) ? 'YES' : 'NO';
      result.model_list.model_id_match = models.models.has(MODEL);
    }
    if (models?.auth === 'PASS' && models.models.has(MODEL)) {
      for (const item of baseline.cases) {
        const itemResult = await invokeCase(item, runtime, fetchImpl);
        result.case_results.push(itemResult);
        result.external_calls.inference += itemResult.request_count;
      }
      result.metrics = scoreValueResults(result.case_results);
      result.value_gate = result.metrics.value;
      result.llm_semantic_adjudication_value_proven = result.metrics.unsafe_false_supported === 0
        ? (result.metrics.value === 'STRONG_VALUE' ? 'YES' : 'PARTIAL') : 'NO';
      result.recommendation = result.llm_semantic_adjudication_value_proven === 'YES'
        ? 'KEEP_AMBIGUOUS_ONLY_LLM' : result.llm_semantic_adjudication_value_proven === 'NO' ? 'HUMAN_REVIEW_ONLY' : 'MORE_EVIDENCE_REQUIRED';
    } else if (models) {
      result.stop_reason = models.auth === 'FAIL' ? 'AUTH_FAILED' : 'MODEL_NOT_AVAILABLE';
    }
  }
  result.completed_at = new Date().toISOString();
  persist(result, resultPath, fsImpl);
  stdout(JSON.stringify(result));
  return result;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await runSemanticAdjudicationValueV1();
  if (!result.metrics || result.metrics.unsafe_false_supported > 0) process.exitCode = 1;
}
