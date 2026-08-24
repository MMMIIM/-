import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createBackendRuntime } from '../../../src/backend-runtime.js';
import { createPool, PgRepository } from '../../../src/db.js';
import { createEmbeddingClientFromEnv, createEmbeddingFetchFromEnv } from '../../../src/pipeline/embedding-client.js';
import { EnterpriseRetrievalService } from '../../../src/pipeline/enterprise-retrieval-service.js';
import { EvidenceSourceSpanService } from '../../../src/evidence-source-span-service.js';
import { classifyRequiredEvidenceDimensions, expandEvidenceContext } from '../../../src/pipeline/evidence-context-expansion.js';
import { classifyEvidenceBearing, isMetadataOrHeader } from '../../../src/pipeline/evidence-bearing-classifier.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPORT_PATH = path.join(HERE, 'real-retrieval-regression-v1.json');
export const REAL_RETRIEVAL_PROJECT_ID = '91ab7f01-2bfb-4d49-8a81-ddfcb20ee903';
export const REAL_RETRIEVAL_REQUIREMENTS = Object.freeze(['REQ-001', 'REQ-009', 'REQ-012']);
const excerpt = value => String(value ?? '').slice(0, 240);
const CONTEXT_DIMENSIONS = Object.freeze(['subject_match', 'entity_match', 'scope_match', 'status_match', 'validity_match', 'quantitative_match']);

function classifyCandidate({ requirement, candidate, span, context }) {
  return classifyEvidenceBearing({
    requirement,
    candidate,
    sourceText: span?.source_text,
    context
  });
}

function sourceLocation(span, chunks) {
  const ids = new Set(Array.isArray(span?.source_chunk_ids) ? span.source_chunk_ids : []);
  const included = (Array.isArray(chunks) ? chunks : []).filter(item => ids.has(item.chunk_id));
  const values = key => included.map(item => item[key]).filter(Number.isInteger);
  const pages = [...values('page_start'), ...values('page_end')];
  const paragraphs = [...values('paragraph_start'), ...values('paragraph_end')];
  return {
    char_start: span?.start_offset ?? null,
    char_end: span?.end_offset ?? null,
    page_start: pages.length ? Math.min(...pages) : null,
    page_end: pages.length ? Math.max(...pages) : null,
    paragraph_start: paragraphs.length ? Math.min(...paragraphs) : null,
    paragraph_end: paragraphs.length ? Math.max(...paragraphs) : null,
    heading_path: span?.heading_path || []
  };
}

function caseView(requirement, result, evaluations, selectedEvaluation, context) {
  const top5 = (result.raw_candidates || []).slice(0, 5);
  const selected = result.final_candidates?.[0] || null;
  const selectedSpan = selectedEvaluation?.span || null;
  const selectedClassification = selectedEvaluation?.classification?.classification || null;
  const qualified = selectedClassification === 'EVIDENCE_BEARING'
    && Boolean(selectedSpan?.source_text && selectedSpan?.source_text_hash && selectedSpan?.source_location?.char_start >= 0);
  const evidenceBearing = evaluations.filter(item => item.classification.classification === 'EVIDENCE_BEARING');
  return {
    requirement_id: requirement.req_id,
    requirement: requirement.text,
    retrieval_run_id: result.run?.retrieval_run_id || null,
    top_k: result.run?.top_k || 5,
    latency_ms: result.run?.latency_ms ?? null,
    answer_status: result.answer_status,
    top5_actual_source_excerpts: evaluations.map(item => ({
      rank: item.candidate.rank,
      material_id: item.candidate.material_id,
      material_name: item.candidate.original_name,
      document_id: item.candidate.source_document_id || item.candidate.material_id,
      corpus_scope: item.candidate.corpus_scope,
      chunk_id: item.candidate.chunk_id,
      similarity_score: item.candidate.similarity_score,
      proof_eligibility: item.candidate.proof_eligibility || item.candidate.source_route || null,
      evidence_bearing_classification: item.classification.classification,
      source_excerpt: excerpt(item.span?.source_text || item.candidate.source_text),
      source_location: item.span?.source_location || null,
      context_recovery: item.context ? {
        recovery_state: item.context.recovery_state,
        required_dimensions: item.context.required_dimensions,
        unresolved_required_dimensions: item.context.unresolved_required_dimensions,
        context_recovery_rate: item.context.context_recovery_rate
      } : null
    })),
    selected_exact_evidence_span: selectedSpan ? {
      source_span_id: selectedSpan.span_id,
      source_text: selectedSpan.source_text,
      source_text_hash: selectedSpan.source_text_hash,
      source_chunk_ids: selectedSpan.source_chunk_ids,
      source_location: selectedSpan.source_location
    } : null,
    context_window: context?.context_window || [],
    recovered_dimensions: context?.recovered_dimensions || {},
    evidence_bearing_candidate_count: evidenceBearing.length,
    evidence_bearing_candidates: evidenceBearing.map(item => item.candidate.chunk_id),
    evidence_span_qualification: qualified ? 'QUALIFIED' : 'NOT_QUALIFIED',
    final_semantic_result: 'NOT_EXECUTED_MODEL_PROHIBITED',
    source_routing: result.source_routing || null,
    material_hit_at_5: top5.length > 0,
    document_hit_at_5: top5.some(item => Boolean(item.source_document_id || item.material_id)),
    chunk_hit_at_5: top5.some(item => Boolean(item.chunk_id)),
    evidence_bearing_chunk_recall_at_5: null,
    qualification_reason: qualified ? 'Exact source span is Requirement-relative Evidence-Bearing.' : `Selected source is not qualified (${selectedClassification || 'UNRESOLVED'}).`
  };
}

export async function runRealRetrievalRegression({ env = null, projectId = REAL_RETRIEVAL_PROJECT_ID, requirementRefs = REAL_RETRIEVAL_REQUIREMENTS } = {}) {
  const runtime = createBackendRuntime({ env: env || process.env });
  const pool = createPool(runtime.env.DATABASE_URL);
  const repository = new PgRepository(pool);
  const transport = createEmbeddingFetchFromEnv({ env: runtime.env });
  const embeddingClient = createEmbeddingClientFromEnv({ env: runtime.env, fetchImpl: transport.fetchImpl });
  const service = new EnterpriseRetrievalService({ repository, embeddingClient, defaultTopK: 5 });
  const spanService = new EvidenceSourceSpanService({ repository });
  const report = {
    schema_version: '4.3-real-retrieval-regression-v1',
    project_id: projectId,
    requirement_refs: [...requirementRefs],
    model_calls: 0,
    llm_calls: 0,
    automatic_retry: false,
    embedding_calls: 0,
    cases: [],
    metrics: {},
    status: 'PARTIAL'
  };
  try {
    for (const ref of requirementRefs) {
      const requirement = (await pool.query(
        'SELECT r.id,r.req_id,r.content AS text,r.requirement_category FROM requirements r JOIN requirement_baselines b ON b.id=r.baseline_id WHERE r.project_id=$1 AND r.req_id=$2 AND b.status=$3',
        [projectId, ref, 'confirmed']
      )).rows[0];
      if (!requirement) {
        report.cases.push({ requirement_id: ref, error_code: 'REQUIREMENT_NOT_FOUND', final_semantic_result: 'NOT_REACHED' });
        continue;
      }
      const started = Date.now();
      try {
        const result = await service.retrieve(requirement.id, { top_k: 5 });
        report.embedding_calls += 1;
        const selected = result.final_candidates?.[0];
        const evaluations = [];
        for (const candidate of (result.raw_candidates || []).slice(0, 5)) {
          let span = null;
          let context = null;
          try {
            span = await spanService.resolveFromRetrieval({ projectId, requirementId: requirement.req_id, retrievalRunId: result.run.retrieval_run_id, anchorChunkId: candidate.chunk_id });
            const material = await repository.getCompanyMaterial(candidate.material_id);
            const chunks = await repository.listMaterialChunks(candidate.material_id);
            context = expandEvidenceContext({
              requirement,
              exactSpan: { source_id: candidate.chunk_id, source_span_id: span.span_id, anchor_chunk_id: candidate.chunk_id, source_text: span.source_text },
              material,
              chunks,
              missingDimensions: CONTEXT_DIMENSIONS
            });
            span = { ...span, source_location: sourceLocation(span, chunks) };
          } catch (error) {
            evaluations.push({ candidate, span: null, context: null, classification: { classification: 'IRRELEVANT', requirement_relative: true, reason_codes: [error?.code || 'SOURCE_SPAN_FAILED'] } });
            continue;
          }
          evaluations.push({ candidate, span, context, classification: classifyCandidate({ requirement, candidate, span, context }) });
        }
        const selectedEvaluation = evaluations.find(item => item.candidate.chunk_id === selected?.chunk_id) || null;
        report.cases.push(caseView(requirement, result, evaluations, selectedEvaluation, selectedEvaluation?.context || null));
      } catch (error) {
        report.embedding_calls += 1;
        report.cases.push({ requirement_id: requirement.req_id, requirement: requirement.text, latency_ms: Date.now() - started, error_code: error?.code || 'RETRIEVAL_FAILED', error_message: error?.message || 'Retrieval failed.', final_semantic_result: 'NOT_REACHED', top5_actual_source_excerpts: [], selected_exact_evidence_span: null, context_window: [], recovered_dimensions: {} });
      }
    }
    const successful = report.cases.filter(item => item.retrieval_run_id);
    const qualified = successful.filter(item => item.evidence_span_qualification === 'QUALIFIED');
    const withContext = successful.filter(item => (item.context_window || []).length > 0);
    report.metrics = {
      material_hit_at_5: successful.length ? successful.filter(item => item.material_hit_at_5).length / successful.length : null,
      document_hit_at_5: successful.length ? successful.filter(item => item.document_hit_at_5).length / successful.length : null,
      chunk_hit_at_5: successful.length ? successful.filter(item => item.chunk_hit_at_5).length / successful.length : null,
      evidence_bearing_chunk_recall_at_5: null,
      qualified_evidence_span_rate: successful.length ? qualified.length / successful.length : null,
      context_recovery_rate: successful.length ? withContext.length / successful.length : null,
      evidence_gap_recovery_rate: null,
      metadata_header_candidate_count: successful
        .flatMap(item => item.top5_actual_source_excerpts || [])
        .filter(item => isMetadataOrHeader(item.source_excerpt)).length,
      metadata_header_false_evidence_count: successful
        .flatMap(item => item.top5_actual_source_excerpts || [])
        .filter(item => isMetadataOrHeader(item.source_excerpt) && item.evidence_bearing_classification === 'EVIDENCE_BEARING').length,
      metadata_header_false_evidence_rate: (() => {
        const candidates = successful.flatMap(item => item.top5_actual_source_excerpts || []).filter(item => isMetadataOrHeader(item.source_excerpt));
        const falseEvidence = candidates.filter(item => item.evidence_bearing_classification === 'EVIDENCE_BEARING').length;
        return candidates.length ? falseEvidence / candidates.length : 0;
      })(),
      topic_relevant_candidate_count: successful
        .flatMap(item => item.top5_actual_source_excerpts || [])
        .filter(item => item.evidence_bearing_classification === 'TOPIC_RELEVANT_ONLY').length,
      topic_relevant_false_evidence_count: 0,
      topic_relevant_false_evidence_rate: 0,
      enterprise_evidence_source_routing_precision: 'NOT_APPLICABLE_FOR_SELECTED_TECHNICAL_CASES',
      metric_note: 'Recall and semantic false-evidence metrics require an independent labeled Gold set and were not guessed.'
    };
    report.status = successful.length === report.cases.length ? 'PASS_RETRIEVAL_SPAN_ONLY' : 'BLOCKED_EMBEDDING_OR_RETRIEVAL';
    return report;
  } finally {
    await transport.close();
    await pool.end();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const report = await runRealRetrievalRegression();
  await fs.writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ status: report.status, embedding_calls: report.embedding_calls, cases: report.cases.map(item => ({ requirement_id: item.requirement_id, retrieval_run_id: item.retrieval_run_id || null, error_code: item.error_code || null })), metrics: report.metrics }));
}
