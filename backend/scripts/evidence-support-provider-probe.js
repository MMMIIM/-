import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSemanticGatewayEnvironment, validateSemanticGatewayLiveConfig } from '../../packages/semantic-contracts/runtime-config.js';
import { adaptRetrievalCandidate, aggregateEvidenceSufficiency } from '../src/pipeline/evidence-support-assessment-contract-v1.js';
import { createSemanticGatewayEvidenceSupportEvaluatorFromEnv } from '../src/pipeline/semantic-gateway-evidence-support-evaluator.js';
import { EVIDENCE_SUPPORT_GATEWAY_CONTRACT_VERSION } from '../src/pipeline/evidence-support-assessment-gateway-contract-v1.js';

const directory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(directory, '../..');
const packetPath = path.resolve(directory, '../eval/evidence-support/calibration-v2/GPT_REVIEW_PACKET_EVIDENCE_SUFFICIENCY_OFFLINE_V3.json');
const defaultResultPath = path.resolve(directory, '../eval/reports/semantic-gateway-provider-probe-latest.json');
const CASE_ID = 'V2R-001-PERF-DIRECT';

const PROVIDER_ERROR_CODES = new Set([
  'PROVIDER_UNAVAILABLE',
  'PROVIDER_TIMEOUT',
  'PROVIDER_HTTP_FAILURE',
  'PROVIDER_OUTPUT_INVALID',
  'OUTPUT_SCHEMA_INVALID'
]);
const MODEL_RESPONSE_ERROR_CODES = new Set([
  'PROVIDER_OUTPUT_INVALID',
  'OUTPUT_SCHEMA_INVALID',
  'GATEWAY_INVALID_JSON',
  'GATEWAY_TRUNCATED_JSON'
]);

function buildCase() {
  const packet = JSON.parse(fs.readFileSync(packetPath, 'utf8'));
  const item = packet.cases.find(candidate => candidate.case_id === CASE_ID) || packet.cases[0];
  const requirement = { req_id: item.requirement.requirement_id, text: item.requirement.text };
  const adapters = item.frozen_evidence_inputs.map((source, index) => adaptRetrievalCandidate({
    requirement,
    candidate: { candidate_id: source.candidate_id, metadata: { raw_rank: source.raw_rank, source_eligibility: source.source_eligibility } },
    sourceSpan: {
      source_span_id: `PROBE-SPAN-${source.candidate_id}-${index + 1}`,
      source_text: source.source_text,
      source_text_hash: source.source_text_hash
    },
    material: { material_id: source.lineage.material_id, document_id: source.lineage.document_id },
    lineage: { ...source.lineage, project_id: 'STAGE20-S-SYNTHETIC-PROBE' }
  }));
  return { caseId: item.case_id, requirement, adapters };
}

function createProbeResult({ startedAt, resultPath }) {
  return {
    schema_version: 'stage20-live-probe-v1',
    case_id: CASE_ID,
    started_at: startedAt,
    completed_at: null,
    latency_ms: null,
    logical_request_count: 1,
    gateway_reached: false,
    gateway_http_status: null,
    gateway_service_auth_status: 'NOT_REACHED',
    provider_call_count: 0,
    provider_adapter_invoked: false,
    fetch_invoked: false,
    provider_http_reached: false,
    provider_reached: false,
    provider_name: null,
    provider_model: null,
    provider_http_status: null,
    provider_failure_stage: null,
    provider_error_name: null,
    provider_safe_error_code: null,
    provider_safe_error_message: null,
    provider_cause_name: null,
    provider_cause_code: null,
    provider_cause_message: null,
    provider_authentication_status: 'NOT_REACHED',
    model_response_reached: false,
    canonical_envelope_valid: false,
    canonical_schema_valid: false,
    normalization_status: 'NOT_REACHED',
    technical_error_class: null,
    model_content: null,
    parsed_json: null,
    json_parse_success: null,
    markdown_fence_present: null,
    legacy_schema_detected: null,
    schema_validation_errors: [],
    envelope_validation_errors: [],
    failure_classifications: [],
    legacy_fallback_used: false,
    dify_call_count: 0,
    embedding_call_count: 0,
    final_probe_status: 'RUNNING',
    normalized_assessment: null,
    result_file: path.relative(repoRoot, resultPath).replaceAll('\\', '/')
  };
}

function technicalCode(error) {
  const candidate = error?.audit?.technical_error_code || error?.code || error?.name;
  return typeof candidate === 'string' && /^[A-Z0-9_:-]{1,80}$/.test(candidate)
    ? candidate
    : 'PROBE_FAILED';
}

function providerStatusFromError(error) {
  const status = Number(error?.audit?.provider_http_status);
  return Number.isInteger(status) && status >= 100 && status <= 599 ? status : null;
}

function observedFetch(fetchImpl, result) {
  return async (url, options) => {
    const headers = new Headers(options?.headers || {});
    headers.set('x-semantic-gateway-diagnostic', 'probe-v1');
    const response = await fetchImpl(url, { ...options, headers });
    result.gateway_reached = true;
    result.gateway_http_status = response.status;
    result.gateway_service_auth_status = response.status === 401 ? 'FAIL' : 'PASS';
    try {
      const body = await response.clone().json();
      if (body?.probe_diagnostics && typeof body.probe_diagnostics === 'object') {
        result._diagnostics = body.probe_diagnostics;
      }
    } catch (_error) {
      // The canonical client remains responsible for the actual response parse.
    }
    return response;
  };
}

function normalizedAssessment(assessments) {
  if (!Array.isArray(assessments)) return null;
  return assessments.map(item => ({
    assessment_id: item.assessment_id,
    assessment_version: item.assessment_version,
    input_kind: item.input_kind,
    source: item.source,
    assessment_status: item.assessment_status,
    semantic_relevance: item.semantic_relevance,
    evidence_capability: item.evidence_capability,
    support_level: item.support_level,
    semantic_relationship: item.semantic_relationship,
    review_dimensions: item.review_dimensions,
    reason_codes: item.reason_codes,
    support_observations: item.support_observations,
    conflict_observations: item.conflict_observations
  }));
}

function markProviderCall(result, errorCode = null) {
  const providerError = PROVIDER_ERROR_CODES.has(errorCode);
  const gatewayReturnedSuccess = result.gateway_http_status === 200;
  if (!providerError && !gatewayReturnedSuccess) return;
  result.provider_call_count = 1;
  if (providerError && !result.provider_adapter_invoked) result.provider_adapter_invoked = true;
  if (gatewayReturnedSuccess && !result.provider_adapter_invoked) result.provider_adapter_invoked = true;
  result.provider_reached = result.provider_http_reached === true;
  result.provider_http_status = providerStatusFromError(result._error) ?? result.provider_http_status ?? (gatewayReturnedSuccess ? 200 : null);
  result.provider_authentication_status = result.provider_http_status === 401 || result.provider_http_status === 403
    ? 'FAIL'
    : result.provider_http_reached ? 'PASS' : 'NOT_VERIFIED';
  result.model_response_reached = gatewayReturnedSuccess || MODEL_RESPONSE_ERROR_CODES.has(errorCode);
}

function redactDiagnosticText(value) {
  return String(value)
    .replace(/Bearer\s+[^\s"']+/gi, 'Bearer [REDACTED]')
    .replace(/(authorization|semantic_gateway_(?:provider_)?api_key)\s*[:=]\s*[^\s,;}]+/gi, '$1: [REDACTED]');
}

function safeDiagnosticValue(value) {
  if (typeof value === 'string') return redactDiagnosticText(value).slice(0, 200000);
  if (Array.isArray(value)) return value.map(item => safeDiagnosticValue(item));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, safeDiagnosticValue(item)]));
  }
  return value ?? null;
}

function applyDiagnostics(result, diagnostics) {
  if (!diagnostics || typeof diagnostics !== 'object') return;
  if (typeof diagnostics.provider_adapter_invoked === 'boolean') {
    result.provider_adapter_invoked = diagnostics.provider_adapter_invoked;
  }
  if (typeof diagnostics.fetch_invoked === 'boolean') {
    result.fetch_invoked = diagnostics.fetch_invoked;
  }
  if (typeof diagnostics.provider_http_reached === 'boolean') {
    result.provider_http_reached = diagnostics.provider_http_reached;
  }
  result.provider_failure_stage = typeof diagnostics.failure_stage === 'string' ? diagnostics.failure_stage : result.provider_failure_stage;
  result.provider_error_name = typeof diagnostics.error_name === 'string' ? diagnostics.error_name : result.provider_error_name;
  result.provider_safe_error_code = typeof diagnostics.safe_error_code === 'string' ? diagnostics.safe_error_code : result.provider_safe_error_code;
  result.provider_safe_error_message = typeof diagnostics.safe_error_message === 'string' ? diagnostics.safe_error_message : result.provider_safe_error_message;
  result.provider_cause_name = typeof diagnostics.cause_name === 'string' ? diagnostics.cause_name : result.provider_cause_name;
  result.provider_cause_code = typeof diagnostics.cause_code === 'string' ? diagnostics.cause_code : result.provider_cause_code;
  result.provider_cause_message = typeof diagnostics.cause_message === 'string' ? diagnostics.cause_message : result.provider_cause_message;
  result.model_content = safeDiagnosticValue(diagnostics.model_content);
  result.parsed_json = safeDiagnosticValue(diagnostics.parsed_json);
  result.json_parse_success = diagnostics.json_parse_success === true
    ? true
    : diagnostics.json_parse_success === false ? false : result.json_parse_success;
  if (typeof diagnostics.markdown_fence_present === 'boolean') {
    result.markdown_fence_present = diagnostics.markdown_fence_present;
  }
  if (typeof diagnostics.legacy_schema_detected === 'boolean') {
    result.legacy_schema_detected = diagnostics.legacy_schema_detected;
  }
  result.schema_validation_errors = Array.isArray(diagnostics.schema_validation_errors)
    ? safeDiagnosticValue(diagnostics.schema_validation_errors) : [];
  result.envelope_validation_errors = Array.isArray(diagnostics.envelope_validation_errors)
    ? safeDiagnosticValue(diagnostics.envelope_validation_errors) : [];
  const providerStatus = Number(diagnostics.provider_http_status);
  if (Number.isInteger(providerStatus) && providerStatus >= 100 && providerStatus <= 599) {
    result.provider_http_status = providerStatus;
  }
  result.provider_reached = result.provider_http_reached === true;
  const classifications = [];
  if (result.json_parse_success === false) classifications.push('SYNTACTIC_JSON_PRESENTATION_ERROR');
  if (result.legacy_schema_detected) classifications.push('LEGACY_SCHEMA_OUTPUT');
  if (result.envelope_validation_errors.length) classifications.push('ENVELOPE_ERROR');
  if (result.schema_validation_errors.length) classifications.push('CANONICAL_FIELD_ERROR');
  result.failure_classifications = [...new Set(classifications)];
}

function applyFailure(result, error) {
  applyDiagnostics(result, result._diagnostics);
  const code = technicalCode(error);
  result._error = error;
  result.technical_error_class = code;
  if (result.gateway_reached && result.gateway_service_auth_status === 'NOT_REACHED') {
    result.gateway_service_auth_status = result.gateway_http_status === 401 ? 'FAIL' : 'PASS';
  }
  markProviderCall(result, code);
  result.canonical_envelope_valid = result.gateway_http_status === 200
    && !['GATEWAY_ENVELOPE_INVALID', 'GATEWAY_RESPONSE_PAYLOAD_MISSING', 'GATEWAY_INVALID_JSON', 'GATEWAY_TRUNCATED_JSON'].includes(code);
  result.canonical_schema_valid = false;
  result.normalization_status = ['GATEWAY_INVALID_JSON', 'GATEWAY_TRUNCATED_JSON'].includes(code)
    ? 'FAIL'
    : result.gateway_http_status === 200 ? 'PASS' : 'NOT_REACHED';
  result.final_probe_status = 'FAILED';
}

function stripInternal(result) {
  const safe = { ...result };
  delete safe._error;
  delete safe._diagnostics;
  return safe;
}

function persistResult(result, resultPath) {
  fs.mkdirSync(path.dirname(resultPath), { recursive: true });
  fs.writeFileSync(resultPath, `${JSON.stringify(stripInternal(result), null, 2)}\n`, 'utf8');
}

export async function runEvidenceSupportProbe({
  env = process.env,
  fetchImpl = fetch,
  resultPath = defaultResultPath,
  envFile = path.resolve(directory, '../../services/semantic-gateway/.env'),
  stdout = console.log,
  evaluatorFactory = createSemanticGatewayEvidenceSupportEvaluatorFromEnv,
  buildCaseFn = buildCase,
  now = () => new Date()
} = {}) {
  const started = now();
  const result = createProbeResult({ startedAt: started.toISOString(), resultPath });
  try {
    if (env.ALLOW_LIVE_PROVIDER_PROBE !== 'true') {
      const error = new Error('LIVE_PROVIDER_PROBE_NOT_AUTHORIZED');
      error.code = 'LIVE_PROVIDER_PROBE_NOT_AUTHORIZED';
      throw error;
    }
    const gatewayEnv = loadSemanticGatewayEnvironment({
      env,
      envFile
    });
    const liveValidation = validateSemanticGatewayLiveConfig(gatewayEnv);
    result.provider_name = liveValidation.config.provider || null;
    result.provider_model = liveValidation.config.model || null;
    if (!liveValidation.valid) {
      const error = new Error('LIVE_CONFIG_INVALID');
      error.code = 'LIVE_CONFIG_INVALID';
      error.validation_errors = liveValidation.errors;
      throw error;
    }
    const target = new URL(liveValidation.config.gatewayApiBase);
    if (target.hostname !== '127.0.0.1' && target.hostname !== 'localhost') {
      const error = new Error('GATEWAY_TARGET_NOT_LOCAL');
      error.code = 'GATEWAY_TARGET_NOT_LOCAL';
      throw error;
    }
    const { caseId, requirement, adapters } = buildCaseFn();
    result.case_id = caseId;
    const evaluator = evaluatorFactory({ env: gatewayEnv, fetchImpl: observedFetch(fetchImpl, result) });
    const evaluation = await evaluator.assess({ requirement, adapters });
    applyDiagnostics(result, result._diagnostics);
    const aggregate = aggregateEvidenceSufficiency(evaluation.assessments);
    markProviderCall(result);
    result.gateway_service_auth_status = result.gateway_reached ? 'PASS' : 'NOT_REACHED';
    result.provider_authentication_status = 'PASS';
    result.canonical_envelope_valid = true;
    result.canonical_schema_valid = true;
    result.normalization_status = 'PASS';
    result.normalized_assessment = {
      contract_version: EVIDENCE_SUPPORT_GATEWAY_CONTRACT_VERSION,
      aggregate_status: aggregate.status,
      warnings_count: Array.isArray(evaluation.warnings) ? evaluation.warnings.length : 0,
      assessments: normalizedAssessment(evaluation.assessments)
    };
    result.final_probe_status = 'PASS';
  } catch (error) {
    applyFailure(result, error);
  } finally {
    const completed = now();
    result.completed_at = completed.toISOString();
    result.latency_ms = Math.max(0, completed.getTime() - started.getTime());
    const safeResult = stripInternal(result);
    try {
      persistResult(result, resultPath);
    } catch (_error) {
      safeResult.persist_error = 'RESULT_PERSISTENCE_FAILED';
      safeResult.final_probe_status = 'FAILED';
    }
    stdout(JSON.stringify(safeResult));
  }
  return stripInternal(result);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await runEvidenceSupportProbe();
  if (result.final_probe_status !== 'PASS') process.exitCode = 1;
}
