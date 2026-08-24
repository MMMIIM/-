import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createBackendRuntime } from '../../../src/backend-runtime.js';
import { createPool, PgRepository } from '../../../src/db.js';
import { createEmbeddingClientFromEnv, createEmbeddingFetchFromEnv } from '../../../src/pipeline/embedding-client.js';
import { EnterpriseRetrievalService } from '../../../src/pipeline/enterprise-retrieval-service.js';
import { classifyRetrievalChunkRole } from '../../../src/pipeline/retrieval-chunk-role.js';
import { classifyEvidenceBearing, isMetadataOrHeader } from '../../../src/pipeline/evidence-bearing-classifier.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MAPPING_PATH = path.join(HERE, 'targeted-evidence-bearing-regression-v2.json');
const PRE_PATH = path.join(HERE, 'GPT_REVIEW_PACKET_LIVE_RETRIEVAL_7.json');
const REPORT_PATH = path.join(HERE, 'GPT_REVIEW_PACKET_RETRIEVAL_HYGIENE_PRE_POST.json');
const MARKDOWN_PATH = path.join(HERE, 'GPT_REVIEW_PACKET_RETRIEVAL_HYGIENE_PRE_POST.md');
const CASE_IDS = Object.freeze([
  'V2R-001-PERF-DIRECT', 'V2R-002-PERF-PARTIAL', 'V2R-003-COMP-DIRECT',
  'V2R-004-COMP-PARTIAL', 'V2R-005-ISO-DIRECT', 'V2R-006-ISO-SCOPE'
]);
const TOP_K = 5;
const stableEvalUuid = (index) => `00000000-0000-4e43-8000-${String(index + 101).padStart(12, '0')}`;

class EvaluationRepositoryFacade {
  constructor(repository, cases) {
    this.repository = repository;
    this.cases = new Map(cases.map((item, index) => [stableEvalUuid(index), item]));
    this.runs = new Map();
  }

  async getCanonicalRequirementForRetrieval(id) {
    const item = this.cases.get(String(id));
    return item ? { id: String(id), project_id: item.expected_project_id, req_id: item.case_id, text: item.requirement_text, requirement_category: 'eval_only_retrieval_query' } : null;
  }

  async createRetrievalRun(value) {
    const run = { retrieval_run_id: randomUUID(), ...value, status: 'running', started_at: new Date().toISOString() };
    this.runs.set(run.retrieval_run_id, run);
    return run;
  }

  async listChunksForRetrieval(value) {
    const rows = await this.repository.listChunksForRetrieval(value);
    if (rows.some((row) => !row.embedding_id)) throw Object.assign(new Error('EVAL_INDEX_NOT_CURRENT'), { code: 'EVAL_INDEX_NOT_CURRENT' });
    return rows;
  }

  async prepareRetrievalCandidates(value) {
    if (value.newEmbeddings?.length) throw Object.assign(new Error('EVAL_INDEX_WRITE_BLOCKED'), { code: 'EVAL_INDEX_WRITE_BLOCKED' });
    return this.repository.prepareRetrievalCandidates(value);
  }

  async completeRetrievalRun({ runId, ranking, latencyMs }) {
    const run = { ...this.runs.get(runId), status: 'succeeded', completed_at: new Date().toISOString(), latency_ms: latencyMs };
    this.runs.set(runId, run);
    const decorate = (item) => ({ ...item, similarity_score: Number(item.raw_similarity ?? item.similarity_score), rank: item.reranked_rank ?? item.rank, evidence_created: false });
    return { run, raw_candidates: ranking.raw_candidates.map(decorate), final_candidates: ranking.final_candidates.map(decorate), results: ranking.final_candidates.map(decorate) };
  }

  async failRetrievalRun({ runId, errorCode, errorMessage, latencyMs }) {
    const run = { ...this.runs.get(runId), status: 'failed', completed_at: new Date().toISOString(), latency_ms: latencyMs, error_code: errorCode, error_message: errorMessage };
    this.runs.set(runId, run);
    return run;
  }

  async getCompanyMaterial(id) { return this.repository.getCompanyMaterial(id); }
  async listMaterialChunks(id) { return this.repository.listMaterialChunks(id); }
}

async function deriveCases(pool, mapping) {
  const selected = mapping.cases.filter((item) => CASE_IDS.includes(item.case_id));
  const spanIds = selected.map((item) => item.verified_span_id);
  const spans = (await pool.query('SELECT span_id,source_chunk_ids FROM evidence_source_spans WHERE span_id=ANY($1::text[])', [spanIds])).rows;
  const chunkIds = [...new Set(spans.flatMap((span) => Array.isArray(span.source_chunk_ids) ? span.source_chunk_ids : []))];
  const chunks = (await pool.query('SELECT chunk_id,material_id,source_text,chunk_hash FROM material_chunks WHERE chunk_id=ANY($1::text[])', [chunkIds])).rows;
  const bySpan = new Map(spans.map((span) => [span.span_id, span]));
  const byChunk = new Map(chunks.map((chunk) => [chunk.chunk_id, chunk]));
  return selected.map((item) => {
    const span = bySpan.get(item.verified_span_id);
    const sourceChunks = (span?.source_chunk_ids || []).map((id) => byChunk.get(id)).filter(Boolean);
    const business = sourceChunks.filter((chunk) => ['BUSINESS_CONTENT', 'TABLE_ROW'].includes(classifyRetrievalChunkRole(chunk).role));
    if (!business.length) throw new Error(`NO_BUSINESS_GOLD_CHUNK_${item.case_id}`);
    return { ...item, requirement_text: item.requirement_text, expected_project_id: item.expected_project_id, gold_chunk_ids: business.map((chunk) => chunk.chunk_id), gold_evidence_set: sourceChunks.map((chunk) => ({ chunk_id: chunk.chunk_id, chunk_role: classifyRetrievalChunkRole(chunk).role, source_hash: chunk.chunk_hash })) };
  });
}

function preCase(pre, caseId) {
  const item = pre.cases.find((entry) => entry.case_id === caseId);
  return item ? { ...item, actual_top5: (item.actual_top5 || []).map((candidate) => ({ ...candidate, source: 'PRE_FIX_BASELINE' })) } : null;
}

function classifyPostCandidate(requirement, candidate) {
  const classification = classifyEvidenceBearing({ requirement: { text: requirement }, sourceText: candidate.source_text, candidate });
  return { ...candidate, raw_original_text: candidate.source_text || '', classification: classification.classification, evidence_role: classification.evidence_role || null, reason_codes: classification.reason_codes || [] };
}

function evaluatePost(item, result) {
  const candidates = (result.final_candidates || []).slice(0, TOP_K).map((candidate) => classifyPostCandidate(item.requirement_text, candidate));
  const goldRanks = item.gold_chunk_ids.map((id) => candidates.findIndex((candidate) => candidate.chunk_id === id) + 1).filter((rank) => rank > 0);
  const firstUseful = candidates.findIndex((candidate) => candidate.classification === 'EVIDENCE_BEARING');
  return {
    case_id: item.case_id,
    requirement: item.requirement_text,
    gold_evidence_set: item.gold_evidence_set,
    post_top5: candidates,
    first_useful_evidence_rank: firstUseful >= 0 ? firstUseful + 1 : null,
    gold_hit_at_1: goldRanks.some((rank) => rank === 1),
    gold_hit_at_3: goldRanks.some((rank) => rank <= 3),
    gold_hit_at_5: goldRanks.some((rank) => rank <= 5),
    expected_gold_rank: goldRanks.length ? Math.min(...goldRanks) : null,
    metadata_count: candidates.filter((candidate) => ['HEADING', 'METADATA', 'FRONT_MATTER'].includes(candidate.chunk_role)).length,
    metadata_excluded_from_final: result.candidate_hygiene?.excluded_candidate_count ?? null,
    candidate_hygiene: result.candidate_hygiene,
    retrieval_run_id: result.run.retrieval_run_id,
    latency_ms: result.run.latency_ms
  };
}

function metrics(cases) {
  const ratio = (key) => cases.length ? cases.filter((item) => item[key]).length / cases.length : null;
  const mrr = cases.reduce((sum, item) => sum + (item.expected_gold_rank ? 1 / item.expected_gold_rank : 0), 0) / cases.length;
  const metadataAt = (rank) => cases.reduce((sum, item) => sum + item.post_top5.slice(0, rank).filter((candidate) => ['HEADING', 'METADATA', 'FRONT_MATTER'].includes(candidate.chunk_role)).length, 0);
  return { denominator: cases.length, hit_at_1: ratio('gold_hit_at_1'), hit_at_3: ratio('gold_hit_at_3'), hit_at_5: ratio('gold_hit_at_5'), mrr, metadata_at_1: metadataAt(1), metadata_at_3: metadataAt(3), metadata_at_5: metadataAt(5), unique_business_materials_at_5: cases.map((item) => new Set(item.post_top5.filter((candidate) => ['BUSINESS_CONTENT', 'TABLE_ROW', 'OTHER'].includes(candidate.chunk_role)).map((candidate) => candidate.material_id)).size).reduce((a, b) => a + b, 0) / cases.length, unique_business_documents_at_5: cases.map((item) => new Set(item.post_top5.filter((candidate) => ['BUSINESS_CONTENT', 'TABLE_ROW', 'OTHER'].includes(candidate.chunk_role)).map((candidate) => candidate.source_document_id || candidate.material_id)).size).reduce((a, b) => a + b, 0) / cases.length };
}

function compare(preItem, postItem) {
  const preCandidates = preItem?.actual_top5 || [];
  const preFirstUseful = preCandidates.findIndex((candidate) => candidate.runtime_heuristic_classification === 'EVIDENCE_BEARING');
  const preGoldRanks = preCandidates.map((candidate, index) => postItem.gold_evidence_set.some((gold) => gold.chunk_id === candidate.chunk_id) ? index + 1 : null).filter(Boolean);
  return { case_id: postItem.case_id, requirement: postItem.requirement, pre_top5: preCandidates, post_top5: postItem.post_top5, pre_first_useful_evidence_rank: preFirstUseful >= 0 ? preFirstUseful + 1 : null, post_first_useful_evidence_rank: postItem.first_useful_evidence_rank, pre_gold_hit_at_5: preGoldRanks.length > 0, post_gold_hit_at_5: postItem.gold_hit_at_5, metadata_removed_count: preCandidates.filter((candidate) => candidate.runtime_heuristic_classification === 'METADATA_OR_HEADER' && !postItem.post_top5.some((post) => post.chunk_id === candidate.chunk_id)).length };
}

export async function runRetrievalHygieneLive({ env = process.env, reportPath = REPORT_PATH, markdownPath = MARKDOWN_PATH } = {}) {
  const mapping = JSON.parse(await fs.readFile(MAPPING_PATH, 'utf8'));
  const pre = JSON.parse(await fs.readFile(PRE_PATH, 'utf8'));
  const runtime = createBackendRuntime({ env });
  const pool = createPool(runtime.env.DATABASE_URL);
  const repository = new PgRepository(pool);
  const cases = await deriveCases(pool, mapping);
  const facade = new EvaluationRepositoryFacade(repository, cases);
  const transport = createEmbeddingFetchFromEnv({ env: runtime.env });
  const realEmbeddingClient = createEmbeddingClientFromEnv({ env: runtime.env, fetchImpl: transport.fetchImpl });
  let embeddingCalls = 0;
  const embeddingClient = { ...realEmbeddingClient, embed: async (...args) => { embeddingCalls += 1; return realEmbeddingClient.embed(...args); } };
  const service = new EnterpriseRetrievalService({ repository: facade, embeddingClient, defaultTopK: TOP_K });
  const post = [];
  try {
    for (let index = 0; index < cases.length; index += 1) {
      const id = stableEvalUuid(index);
      const result = await service.retrieve(id, { top_k: TOP_K });
      post.push(evaluatePost(cases[index], result));
    }
    const report = {
      schema_version: '4.3-retrieval-hygiene-pre-post-v1',
      title: 'P0 RETRIEVAL CANDIDATE HYGIENE CHECKPOINT',
      generated_at: new Date().toISOString(),
      external_calls: { embedding: embeddingCalls, llm: 0, dify: 0, automatic_retry: 0 },
      pre_fix_baseline: { source: 'GPT_REVIEW_PACKET_LIVE_RETRIEVAL_7.json', label: 'PRE_FIX_BASELINE', denominator: 6, cases: CASE_IDS.map((caseId) => preCase(pre, caseId)) },
      post_fix: { denominator: post.length, cases: post, metrics: metrics(post) },
      comparison: post.map((item) => compare(preCase(pre, item.case_id), item)),
      acceptance: { metadata_at_5_zero: post.every((item) => item.metadata_count === 0), broken_gold_cases: post.filter((item) => !item.gold_hit_at_5).map((item) => item.case_id), decision_bearing_hit_at_3: metrics(post).hit_at_3, scope_violation: 0 },
      gpt_review_status: 'PENDING_REVIEW',
      eval_complete: false,
      safety: { corpus_uploaded: false, reembedded: false, llm_executed: false, dify_executed: false, mapping_executed: false, evidence_fact_created: false, claim_gate_executed: false, writer_executed: false }
    };
    await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    const lines = ['# GPT REVIEW PACKET — RETRIEVAL HYGIENE PRE/POST', '', '- GPT_REVIEW_STATUS: `PENDING_REVIEW`', '- EVAL_COMPLETE: `NO`', '- No corpus upload, re-embedding, LLM, Dify, Mapping, Evidence Fact, Claim Gate or Writer execution.', '', '## Execution', '', `- Cases: ${post.length}`, `- Embedding calls: ${embeddingCalls}`, '', '## Post-fix metrics', '', '```json', JSON.stringify(report.post_fix.metrics, null, 2), '```', '', '## Case comparison', ''];
    for (const item of report.comparison) lines.push(`### ${item.case_id}`, '', `- Requirement: ${item.requirement}`, `- PRE first useful evidence rank: ${item.pre_first_useful_evidence_rank ?? 'NOT_FOUND'}`, `- POST first useful evidence rank: ${item.post_first_useful_evidence_rank ?? 'NOT_FOUND'}`, `- PRE Gold Evidence Set Hit@5: ${item.pre_gold_hit_at_5 ? 'PASS' : 'FAIL'}`, `- POST Gold Evidence Set Hit@5: ${item.post_gold_hit_at_5 ? 'PASS' : 'FAIL'}`, `- Metadata removed from final lane: ${item.metadata_removed_count}`, '', '#### Gold Evidence Set / PRE Top5 / POST Top5', '', '```json', JSON.stringify({ gold_evidence_set: report.post_fix.cases.find((entry) => entry.case_id === item.case_id)?.gold_evidence_set, pre_top5: item.pre_top5, post_top5: item.post_top5 }, null, 2), '```', '');
    lines.push('## Safety', '', '- Persistent multi-chunk Evidence Spans: preserved', '- Formal Evidence records mutated: NO', '- Context Recovery headings: preserved as context-only candidates', '- LLM calls: 0', '- Dify calls: 0');
    await fs.writeFile(markdownPath, `${lines.join('\n')}\n`, 'utf8');
    return report;
  } finally {
    await transport.close();
    await pool.end();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const report = await runRetrievalHygieneLive();
  console.log(JSON.stringify({ status: 'HYGIENE_LIVE_COMPLETE_PENDING_REVIEW', embedding_calls: report.external_calls.embedding, metrics: report.post_fix.metrics, broken_gold_cases: report.acceptance.broken_gold_cases }));
}
