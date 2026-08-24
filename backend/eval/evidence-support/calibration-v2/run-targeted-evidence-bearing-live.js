import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createBackendRuntime } from '../../../src/backend-runtime.js';
import { createPool, PgRepository } from '../../../src/db.js';
import { createEmbeddingClientFromEnv, createEmbeddingFetchFromEnv } from '../../../src/pipeline/embedding-client.js';
import { EnterpriseRetrievalService } from '../../../src/pipeline/enterprise-retrieval-service.js';
import { EvidenceSourceSpanService } from '../../../src/evidence-source-span-service.js';
import { expandEvidenceContext } from '../../../src/pipeline/evidence-context-expansion.js';
import { classifyEvidenceBearing } from '../../../src/pipeline/evidence-bearing-classifier.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MAPPING_PATH = path.join(HERE, 'targeted-evidence-bearing-regression-v2.json');
const REPORT_PATH = path.join(HERE, 'targeted-evidence-bearing-live-v1.json');
const TOP_K = 5;

function classifyMiss({ expected, result, evaluations }) {
  if (!expected?.formal_requirement_id) return 'GOLD_INVALID';
  if (!result) return 'OTHER';
  const top5 = result.raw_candidates || [];
  if (!top5.some(item => item.material_id === expected.expected_material_id)) return 'MATERIAL_NOT_RETRIEVED';
  if (!top5.some(item => (item.source_document_id || item.material_id) === expected.expected_document_id)) return 'DOCUMENT_NOT_RETRIEVED';
  if (!top5.some(item => item.chunk_id === expected.expected_chunk_id)) return 'EVIDENCE_CHUNK_NOT_RETRIEVED';
  if (evaluations.some(item => ['METADATA_OR_HEADER', 'TOPIC_RELEVANT_ONLY'].includes(item.classification.classification))) return 'METADATA_POLLUTION';
  return 'SPAN_SELECTION_FAILURE';
}

async function evaluateCase({ mapping, service, spanService, repository }) {
  if (!mapping.formal_requirement_id || mapping.mapping_status !== 'VALID') {
    return { case_id: mapping.case_id, status: 'GOLD_INVALID', mapping_status: mapping.mapping_status, invalid_reasons: mapping.invalid_reasons || [], embedding_call: false };
  }
  const requirement = await repository.getCanonicalRequirementForRetrieval(mapping.formal_requirement_id);
  if (!requirement) return { case_id: mapping.case_id, status: 'GOLD_INVALID', mapping_status: 'FORMAL_REQUIREMENT_NOT_FOUND', embedding_call: false };
  const result = await service.retrieve(requirement.id, { top_k: TOP_K });
  const evaluations = [];
  for (const candidate of (result.raw_candidates || []).slice(0, TOP_K)) {
    try {
      const span = await spanService.resolveFromRetrieval({ projectId: requirement.project_id, requirementId: requirement.req_id, retrievalRunId: result.run.retrieval_run_id, anchorChunkId: candidate.chunk_id });
      const material = await repository.getCompanyMaterial(candidate.material_id);
      const chunks = await repository.listMaterialChunks(candidate.material_id);
      const context = expandEvidenceContext({ requirement, exactSpan: { source_id: candidate.chunk_id, source_span_id: span.span_id, anchor_chunk_id: candidate.chunk_id, source_text: span.source_text }, material, chunks, missingDimensions: ['subject_match', 'entity_match', 'scope_match', 'status_match', 'validity_match', 'quantitative_match'] });
      const classification = classifyEvidenceBearing({ requirement, candidate, sourceText: span.source_text, context });
      evaluations.push({ rank: candidate.rank, material_id: candidate.material_id, document_id: candidate.source_document_id || candidate.material_id, chunk_id: candidate.chunk_id, score: candidate.similarity_score, source_excerpt: span.source_text, classification, span: classification.classification === 'EVIDENCE_BEARING' ? { span_id: span.span_id, source_text_hash: span.source_text_hash, chunk_id: candidate.chunk_id } : null });
    } catch (error) {
      evaluations.push({ rank: candidate.rank, material_id: candidate.material_id, document_id: candidate.source_document_id || candidate.material_id, chunk_id: candidate.chunk_id, score: candidate.similarity_score, source_excerpt: candidate.source_text || '', classification: { classification: 'IRRELEVANT', reason_codes: [error?.code || 'SOURCE_SPAN_FAILED'] }, span: null });
    }
  }
  const expectedHit = index => evaluations.slice(0, index).some(item => item.chunk_id === mapping.expected_chunk_id && item.classification.classification === 'EVIDENCE_BEARING');
  const selected = evaluations[0];
  const hit5 = expectedHit(5);
  return {
    case_id: mapping.case_id,
    status: 'EXECUTED',
    requirement_id: requirement.req_id,
    retrieval_run_id: result.run.retrieval_run_id,
    latency_ms: result.run.latency_ms,
    top5: evaluations,
    gold_hit_at_1: expectedHit(1),
    gold_hit_at_3: expectedHit(3),
    gold_hit_at_5: hit5,
    qualified_span: Boolean(hit5 && selected?.span),
    miss_reason: hit5 ? null : classifyMiss({ expected: mapping, result, evaluations }),
    embedding_call: true
  };
}

export async function runTargetedEvidenceBearingLive({ env = null, mappingPath = MAPPING_PATH, reportPath = REPORT_PATH } = {}) {
  const mapping = JSON.parse(await fs.readFile(mappingPath, 'utf8'));
  const runtime = createBackendRuntime({ env: env || process.env });
  const pool = createPool(runtime.env.DATABASE_URL);
  const repository = new PgRepository(pool);
  const report = { schema_version: '4.3-targeted-evidence-bearing-live-v1', mapping_schema_version: mapping.schema_version, model_calls: 0, llm_calls: 0, dify_calls: 0, automatic_retry: false, embedding_calls: 0, cases: [], status: 'BLOCKED_GOLD_INVALID' };
  let transport = null;
  try {
    const executable = (mapping.cases || []).filter(item => item.formal_requirement_id && item.mapping_status === 'VALID');
    if (executable.length === 0) {
      report.cases = (mapping.cases || []).map(item => ({ case_id: item.case_id, status: 'GOLD_INVALID', mapping_status: item.mapping_status, invalid_reasons: item.invalid_reasons || [], embedding_call: false }));
      report.metrics = { hit_at_1: 'NOT_EXECUTED', hit_at_3: 'NOT_EXECUTED', hit_at_5: 'NOT_EXECUTED', material_hit_at_5: 'NOT_EXECUTED', document_hit_at_5: 'NOT_EXECUTED', expected_chunk_hit_at_5: 'NOT_EXECUTED', qualified_span_rate: 'NOT_EXECUTED', metadata_header_false_evidence_rate: 'NOT_EXECUTED', topic_relevant_false_evidence_rate: 'NOT_EXECUTED', proof_routing_precision: 'NOT_EXECUTED', miss_forensics: { GOLD_INVALID: report.cases.length } };
      await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
      return report;
    }
    transport = createEmbeddingFetchFromEnv({ env: runtime.env });
    const embeddingClient = createEmbeddingClientFromEnv({ env: runtime.env, fetchImpl: transport.fetchImpl });
    const service = new EnterpriseRetrievalService({ repository, embeddingClient, defaultTopK: TOP_K });
    const spanService = new EvidenceSourceSpanService({ repository });
    for (const item of mapping.cases || []) {
      const result = await evaluateCase({ mapping: item, service, spanService, repository });
      report.cases.push(result);
      if (result.embedding_call) report.embedding_calls += 1;
    }
    const executed = report.cases.filter(item => item.status === 'EXECUTED');
    const rate = key => executed.length ? executed.filter(item => item[key]).length / executed.length : 'NOT_EXECUTED';
    const missForensics = Object.fromEntries(executed.filter(item => item.miss_reason).map(item => [item.miss_reason, (executed.filter(candidate => candidate.miss_reason === item.miss_reason).length)]));
    report.metrics = { hit_at_1: rate('gold_hit_at_1'), hit_at_3: rate('gold_hit_at_3'), hit_at_5: rate('gold_hit_at_5'), qualified_span_rate: rate('qualified_span'), miss_forensics: missForensics, note: 'Only pre-verified Requirement-relative mappings count as Gold.' };
    report.status = executed.length === executable.length ? 'PASS_OR_FAIL_METRIC_READY' : 'PARTIAL_GOLD_INVALID';
    await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    return report;
  } finally {
    if (transport) await transport.close();
    await pool.end();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const report = await runTargetedEvidenceBearingLive();
  console.log(JSON.stringify({ status: report.status, embedding_calls: report.embedding_calls, case_count: report.cases.length, executable_count: report.cases.filter(item => item.status === 'EXECUTED').length, metrics: report.metrics }));
}
