import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { createBackendRuntime } from '../../../src/backend-runtime.js';
import { adaptRetrievalCandidate, aggregateEvidenceSufficiency } from '../../../src/pipeline/evidence-support-assessment-contract-v1.js';
import { createSemanticGatewayEvidenceSupportEvaluatorFromEnv } from '../../../src/pipeline/semantic-gateway-evidence-support-evaluator.js';
import { EVIDENCE_SUPPORT_GATEWAY_CONTRACT_VERSION, EVIDENCE_SUPPORT_GATEWAY_TASK_TYPE } from '../../../src/pipeline/evidence-support-assessment-gateway-contract-v1.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKET_PATH = path.join(__dirname, 'GPT_REVIEW_PACKET_EVIDENCE_SUFFICIENCY_OFFLINE_V3.json');
const OUTPUT_PATH = path.join(__dirname, 'STAGE20_EVIDENCE_SUFFICIENCY_LIVE_VALIDATION.json');
const MARKDOWN_PATH = path.join(__dirname, 'STAGE20_EVIDENCE_SUFFICIENCY_LIVE_VALIDATION.md');

const sha256 = value => createHash('sha256').update(String(value)).digest('hex');
const safeText = value => typeof value === 'string' ? value : '';

function safeAudit(audit = {}) {
  const result = {};
  for (const key of [
    'provider', 'task_type', 'http_status', 'request_id', 'timeout_ms',
    'response_classification', 'error_code', 'technical_error_code',
    'gateway_error_code', 'received_task_type'
  ]) {
    if (audit[key] != null) result[key] = audit[key];
  }
  const raw = audit.raw_response_payload_json;
  if (typeof raw === 'string') {
    result.raw_response_payload_json = raw;
    result.raw_response_sha256 = sha256(raw);
    result.raw_response_char_count = raw.length;
  }
  return result;
}

function requirementOf(value) {
  return {
    requirement_id: value.requirement_id,
    text: value.text
  };
}

function adapterFromFrozen(requirement, item, sourceSpanId = `OFFLINE-SPAN-${item.candidate_id}`) {
  const sourceText = safeText(item.source_text);
  const lineage = item.lineage || {};
  return adaptRetrievalCandidate({
    requirement: requirementOf(requirement),
    candidate: {
      candidate_id: item.candidate_id,
      metadata: {
        raw_rank: item.raw_rank ?? null,
        raw_similarity: item.raw_similarity ?? null,
        chunk_role: item.chunk_role ?? null,
        source_eligibility: item.source_eligibility ?? null,
        requirement_relative_classification: item.requirement_relative_classification ?? null
      }
    },
    sourceSpan: {
      source_span_id: sourceSpanId,
      source_text: sourceText,
      source_text_hash: item.source_text_hash,
      lineage
    },
    material: {
      material_id: lineage.material_id,
      document_id: lineage.document_id,
      source_eligibility: item.source_eligibility ?? null
    },
    lineage
  });
}

function redactedCaseInput(item) {
  return {
    requirement_id: item.requirement.requirement_id,
    requirement_text: item.requirement.text,
    source_count: item.adapters.length,
    source_ids: item.adapters.map(adapter => adapter.source.source_id),
    source_hashes: item.adapters.map(adapter => adapter.source.source_text_hash)
  };
}

function expectedForCase(caseItem) {
  return {
    status: caseItem.expected?.status || null,
    reason_codes: caseItem.expected?.reason_codes || [],
    required_dimensions: caseItem.expected?.required_dimensions || {},
    unresolved_required_dimensions: caseItem.expected?.unresolved_required_dimensions || [],
    adverse_evidence: caseItem.expected?.adverse_evidence ?? null,
    technical_status: caseItem.expected?.technical_status || caseItem.technical_status || 'NOT_APPLICABLE',
    oracle_provenance: caseItem.oracle_provenance || null
  };
}

function buildCases(packet) {
  const cases = packet.cases.map(caseItem => {
    const requirement = requirementOf(caseItem.requirement);
    const adapters = caseItem.frozen_evidence_inputs.map(item => adapterFromFrozen(requirement, item));
    return {
      case_id: caseItem.case_id,
      kind: 'canonical_v3.1_case',
      requirement,
      adapters,
      expected: expectedForCase(caseItem),
      source_excerpt: caseItem.evidence_detail?.[0]?.exact_span?.support_excerpt || null
    };
  });

  const subject = packet.negative_controls.find(item => item.control_id === 'EXPLICIT_SUBJECT_MISMATCH');
  if (subject) {
    const requirement = requirementOf(subject.runtime_assessment.requirement);
    const source = subject.runtime_assessment.source;
    cases.push({
      case_id: subject.control_fixture_id,
      kind: 'negative_control',
      requirement,
      adapters: [adapterFromFrozen(requirement, {
        candidate_id: source.source_id,
        source_text: subject.source_text,
        source_text_hash: source.source_text_hash,
        source_eligibility: 'ELIGIBLE',
        lineage: source.lineage
      }, source.source_span_id)],
      expected: {
        status: subject.result_status,
        reason_codes: ['SUBJECT_MISMATCH', 'SUPPORT_INSUFFICIENT'],
        required_dimensions: { subject_match: { expected: 'mismatch' }, entity_match: { expected: 'unknown' }, support_sufficiency: { expected: 'mismatch' } },
        unresolved_required_dimensions: ['entity_match'],
        adverse_evidence: true,
        technical_status: 'NOT_APPLICABLE',
        oracle_provenance: { case_status_expectation_provenance: 'GPT_REVIEWED_EXPECTATION' }
      },
      source_excerpt: subject.source_text
    });
  }

  const conflict = packet.negative_controls.find(item => item.control_id === 'CONFLICTING_EVIDENCE');
  if (conflict) {
    const requirement = requirementOf(conflict.runtime_assessments[0].requirement);
    cases.push({
      case_id: conflict.control_fixture_id,
      kind: 'negative_control',
      requirement,
      adapters: conflict.runtime_assessments.map((runtimeAssessment, index) => {
        const source = runtimeAssessment.source;
        const evidence = index === 0 ? conflict.evidence_a : conflict.evidence_b;
        return adapterFromFrozen(requirement, {
          candidate_id: source.source_id,
          source_text: evidence.source_text,
          source_text_hash: source.source_text_hash,
          source_eligibility: 'ELIGIBLE',
          lineage: source.lineage
        }, source.source_span_id);
      }),
      expected: {
        status: conflict.result_status,
        reason_codes: ['QUANTITATIVE_MISMATCH', 'SUPPORT_INSUFFICIENT'],
        required_dimensions: { quantitative_match: { expected: 'mismatch' }, support_sufficiency: { expected: 'mismatch' } },
        unresolved_required_dimensions: [],
        adverse_evidence: true,
        technical_status: 'NOT_APPLICABLE',
        oracle_provenance: { case_status_expectation_provenance: 'GPT_REVIEWED_EXPECTATION' }
      },
      source_excerpt: `${conflict.evidence_a.source_text} / ${conflict.evidence_b.source_text}`
    });
  }
  return cases;
}

function technicalControlEvidence(packet) {
  const control = packet.negative_controls.find(item => item.control_id === 'TECHNICAL_FAILURE_SEPARATION');
  return control ? {
    case_id: control.control_fixture_id,
    kind: 'negative_control',
    execution: 'NOT_EXECUTED',
    expected_status: control.result_status,
    technical_error_type: control.technical_error_type,
    reason: '不会通过改变 endpoint 或注入失败来制造技术故障；本轮不增加非业务调用。'
  } : null;
}

async function assessCase(evaluator, item) {
  const started = performance.now();
  try {
    const result = await evaluator.assess({ requirement: item.requirement, adapters: item.adapters });
    const aggregate = aggregateEvidenceSufficiency(result.assessments);
    return {
      case_id: item.case_id,
      kind: item.kind,
      canonical_input: redactedCaseInput(item),
      source_excerpt: item.source_excerpt,
      expected: item.expected,
      actual: {
        status: aggregate.status,
        assessment_count: aggregate.assessment_count,
        reason_codes: aggregate.reason_codes,
        assessments: result.assessments.map(assessment => ({
          source_id: assessment.source.source_id,
          semantic_relevance: assessment.semantic_relevance,
          evidence_capability: assessment.evidence_capability,
          support_level: assessment.support_level,
          semantic_relationship: assessment.semantic_relationship,
          review_dimensions: assessment.review_dimensions,
          reason_codes: assessment.reason_codes,
          support_observations: assessment.support_observations,
          conflict_observations: assessment.conflict_observations
        })),
        warnings: result.warnings || [],
        blocking_conflicts: aggregate.blocking_conflicts
      },
      provider_audit: safeAudit(result.audit),
      pass: aggregate.status === item.expected.status,
      technical_error: null,
      latency_ms: Math.round(performance.now() - started),
      retry_count: 0
    };
  } catch (error) {
    return {
      case_id: item.case_id,
      kind: item.kind,
      canonical_input: redactedCaseInput(item),
      source_excerpt: item.source_excerpt,
      expected: item.expected,
      actual: null,
      provider_audit: safeAudit(error?.audit),
      pass: false,
      technical_error: {
        error_code: error?.code || error?.name || 'UNKNOWN',
        error_class: error?.audit?.error_classification || error?.code || 'UNKNOWN',
        safe_message: error?.message || 'provider call failed'
      },
      latency_ms: Math.round(performance.now() - started),
      retry_count: 0
    };
  }
}

function shouldStopAfterFailure(result) {
  const code = result.technical_error?.error_code;
  return Boolean(code && [
    'TASK_UNSUPPORTED', 'ENVELOPE_INVALID', 'SCHEMA_INVALID', 'OUTPUT_NOT_JSON',
    'OUTPUT_MISSING', 'GATEWAY_HTTP_FAILURE', 'GATEWAY_HTTP_ERROR',
    'GATEWAY_NETWORK_ERROR', 'GATEWAY_TIMEOUT', 'ASSESSMENT_UNAVAILABLE'
  ].includes(code));
}

function summaryMarkdown(report) {
  const lines = [
    '# Stage20 Evidence Sufficiency Live Validation',
    '',
    `- Generated at: ${report.generated_at}`,
    `- Provider: ${report.remote.provider}`,
    `- Gateway host: ${report.remote.gateway_host}`,
    `- Gateway port: ${report.remote.gateway_port}`,
    `- Task: ${report.remote.task_type}`,
    `- Contract: ${report.remote.contract_version}`,
    `- Automatic retry: ${report.execution.automatic_retry}`,
    `- External workflow calls: ${report.execution.provider_workflow_calls}`,
    '',
    '## Case results',
    ''
  ];
  for (const result of report.case_results) {
    lines.push(`- ${result.case_id}: expected=${result.expected.status}, actual=${result.actual?.status || 'NOT_AVAILABLE'}, ${result.pass ? 'PASS' : 'FAIL'}, ${result.latency_ms}ms`);
  }
  if (report.technical_control) lines.push(`- ${report.technical_control.case_id}: ${report.technical_control.execution}`);
  lines.push('', '## Safety', '', '- No formal DB state was written.', '- No Evidence Review, Evidence, Fact, Mapping, Claim, Readiness, or Writer lifecycle was invoked.', '- No prompt, API key, or complete provider request was printed to the terminal.');
  return `${lines.join('\n')}\n`;
}

async function main() {
  const packet = JSON.parse(fs.readFileSync(PACKET_PATH, 'utf8'));
  const runtime = createBackendRuntime();
  const evaluator = createSemanticGatewayEvidenceSupportEvaluatorFromEnv({ env: runtime.env });
  const canonicalGatewayBase = String(runtime.env.SEMANTIC_GATEWAY_API_BASE || '').trim();
  if (!canonicalGatewayBase) {
    throw Object.assign(new Error('Canonical Semantic Gateway is not configured for evidence_support_assessment.'), {
      code: 'CANONICAL_GATEWAY_NOT_CONFIGURED'
    });
  }
  const target = new URL(canonicalGatewayBase);
  const cases = buildCases(packet);
  const technicalControl = technicalControlEvidence(packet);
  const report = {
    schema_version: 'stage20-evidence-sufficiency-live-v1',
    generated_at: new Date().toISOString(),
    source_packet: path.basename(PACKET_PATH),
    remote: {
      provider: 'semantic_gateway',
      gateway_host: target.hostname,
      gateway_port: target.port || (target.protocol === 'https:' ? '443' : '80'),
      task_type: EVIDENCE_SUPPORT_GATEWAY_TASK_TYPE,
      contract_version: EVIDENCE_SUPPORT_GATEWAY_CONTRACT_VERSION,
      app_name: null,
      published_version: null,
      model: null,
      prompt_version: null,
      contract_parity: 'NOT_VERIFIABLE_FROM_SAFE_INFO_ENDPOINT'
    },
    execution: {
      automatic_retry: 0,
      concurrency: 1,
      provider_workflow_calls: 0,
      stopped_after_failure: false,
      no_formal_db_mutation: true
    },
    case_results: [],
    technical_control: technicalControl,
    metrics: null,
    external_calls: { embedding: 0, llm: 0, dify: 0, provider: 0 }
  };

  for (const item of cases) {
    const result = await assessCase(evaluator, item);
    report.case_results.push(result);
    report.execution.provider_workflow_calls += 1;
    report.external_calls.provider += 1;
    if (shouldStopAfterFailure(result)) {
      report.execution.stopped_after_failure = true;
      break;
    }
  }

  const executed = report.case_results;
  report.execution.not_executed_case_ids = cases.slice(executed.length).map(item => item.case_id);
  const passCount = executed.filter(item => item.pass).length;
  const contractFailures = executed.filter(item => item.technical_error).length;
  report.metrics = {
    executed_case_count: executed.length,
    accepted_case_count: cases.length,
    pass_count: passCount,
    fail_count: executed.length - passCount,
    case_pass_rate: executed.length ? passCount / executed.length : 0,
    contract_failures: contractFailures,
    unsafe_false_supported: executed.filter(item => item.actual?.status === 'EVIDENCE_REVIEW_READY' && item.expected.status !== 'EVIDENCE_REVIEW_READY').length,
    technical_negative_control: technicalControl?.execution || 'MISSING'
  };
  if (report.metrics.contract_failures > 0) report.remote.contract_parity = 'REMOTE_CONTRACT_DRIFT';
  report.final_status = report.execution.stopped_after_failure || report.metrics.contract_failures > 0
    ? 'BLOCKED'
    : (report.metrics.pass_count === report.metrics.accepted_case_count && technicalControl?.execution === 'EXECUTED' ? 'PASS' : 'PARTIAL');

  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  fs.writeFileSync(MARKDOWN_PATH, summaryMarkdown(report), 'utf8');
  console.log(JSON.stringify({
    final_status: report.final_status,
    executed_case_count: report.metrics.executed_case_count,
    pass_count: report.metrics.pass_count,
    fail_count: report.metrics.fail_count,
    contract_failures: report.metrics.contract_failures,
    provider_workflow_calls: report.execution.provider_workflow_calls,
    technical_negative_control: report.technical_control?.execution || 'MISSING'
  }));
  if (report.final_status === 'BLOCKED') process.exitCode = 2;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) await main();
