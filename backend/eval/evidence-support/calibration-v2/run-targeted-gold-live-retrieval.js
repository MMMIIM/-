import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createBackendRuntime } from '../../../src/backend-runtime.js';
import { createPool, PgRepository } from '../../../src/db.js';
import { createEmbeddingClientFromEnv, createEmbeddingFetchFromEnv } from '../../../src/pipeline/embedding-client.js';
import { EnterpriseRetrievalService } from '../../../src/pipeline/enterprise-retrieval-service.js';
import { expandEvidenceContext } from '../../../src/pipeline/evidence-context-expansion.js';
import { classifyEvidenceBearing, isMetadataOrHeader } from '../../../src/pipeline/evidence-bearing-classifier.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const QUALIFICATION_PATH = path.join(HERE, 'GPT_REVIEW_PACKET_GOLD_QUALIFICATION.json');
const REPORT_PATH = path.join(HERE, 'GPT_REVIEW_PACKET_LIVE_RETRIEVAL_7.json');
const MARKDOWN_PATH = path.join(HERE, 'GPT_REVIEW_PACKET_LIVE_RETRIEVAL_7.md');
const TOP_K = 5;
const CONTEXT_DIMENSIONS = Object.freeze(['subject_match', 'entity_match', 'scope_match', 'status_match', 'validity_match', 'quantitative_match']);

const stableEvalUuid = (index) => `00000000-0000-4e43-8000-${String(index + 1).padStart(12, '0')}`;
const normalize = (value) => String(value ?? '').normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase();
const isNearDuplicate = (left, right) => {
  const a = normalize(left?.source_text);
  const b = normalize(right?.source_text);
  if (!a || !b) return false;
  return a === b || (Math.min(a.length, b.length) >= 30 && (a.includes(b) || b.includes(a)));
};

/**
 * Production EnterpriseRetrievalService requires a canonical Requirement row.
 * This evaluation-only facade supplies frozen independent query objects in
 * memory while delegating corpus reads and pgvector ranking to PgRepository.
 * It deliberately refuses to embed or write missing index rows and keeps
 * retrieval-run audit in memory, so no formal Requirement or production audit
 * row is created for an eval-only identity.
 */
class EvaluationRepositoryFacade {
  constructor(repository, cases) {
    this.repository = repository;
    this.cases = new Map(cases.map((item, index) => [stableEvalUuid(index), item]));
    this.runs = new Map();
  }

  async getCanonicalRequirementForRetrieval(id) {
    const item = this.cases.get(String(id));
    if (!item) return null;
    return {
      id: String(id),
      project_id: item.requirement.target_project_id,
      req_id: item.eval_requirement_id,
      text: item.requirement.exact_text,
      requirement_category: 'eval_only_retrieval_query'
    };
  }

  async createRetrievalRun(value) {
    const run = {
      retrieval_run_id: randomUUID(),
      requirement_id: value.requirementDbId,
      requirement_ref: value.requirementRef,
      project_id: value.projectId,
      query_text: value.queryText,
      query_hash: value.queryHash,
      embedding_model: value.model,
      embedding_version: value.version,
      embedding_dimension: value.dimension,
      top_k: value.topK,
      filters: value.filters,
      status: 'running',
      started_at: new Date().toISOString(),
      semantic_metadata: value.semanticMetadata || {}
    };
    this.runs.set(run.retrieval_run_id, run);
    return run;
  }

  async listChunksForRetrieval(value) {
    const rows = await this.repository.listChunksForRetrieval(value);
    if (rows.some((row) => !row.embedding_id)) {
      throw Object.assign(new Error('评测语料存在未索引 Chunk，阻止额外 Embedding/数据库写入。'), { code: 'EVAL_INDEX_NOT_CURRENT' });
    }
    return rows;
  }

  async prepareRetrievalCandidates(value) {
    if (Array.isArray(value.newEmbeddings) && value.newEmbeddings.length > 0) {
      throw Object.assign(new Error('Gold live runner 不允许为缺失索引写入新向量。'), { code: 'EVAL_INDEX_WRITE_BLOCKED' });
    }
    return this.repository.prepareRetrievalCandidates(value);
  }

  async completeRetrievalRun({ runId, ranking, latencyMs }) {
    const run = this.runs.get(runId);
    if (!run) throw new Error('EVAL_RETRIEVAL_RUN_NOT_FOUND');
    const completed = { ...run, status: 'succeeded', completed_at: new Date().toISOString(), latency_ms: latencyMs };
    this.runs.set(runId, completed);
    const decorate = (item) => ({ ...item, similarity_score: Number(item.raw_similarity ?? item.similarity_score), rank: item.reranked_rank ?? item.rank, evidence_created: false });
    return {
      run: completed,
      raw_candidates: ranking.raw_candidates.map(decorate),
      final_candidates: ranking.final_candidates.map(decorate),
      results: ranking.final_candidates.map(decorate)
    };
  }

  async failRetrievalRun({ runId, errorCode, errorMessage, latencyMs }) {
    const run = this.runs.get(runId);
    if (!run) return null;
    const failed = { ...run, status: 'failed', completed_at: new Date().toISOString(), latency_ms: latencyMs, error_code: errorCode, error_message: errorMessage };
    this.runs.set(runId, failed);
    return failed;
  }

  async getCompanyMaterial(id) { return this.repository.getCompanyMaterial(id); }
  async listMaterialChunks(id) { return this.repository.listMaterialChunks(id); }
}

function classifyCandidate({ requirement, candidate, material, chunks }) {
  const sourceText = String(candidate.source_text || '');
  const context = expandEvidenceContext({
    requirement,
    exactSpan: { source_id: candidate.chunk_id, anchor_chunk_id: candidate.chunk_id, source_text: sourceText },
    material,
    chunks,
    missingDimensions: CONTEXT_DIMENSIONS
  });
  const classification = classifyEvidenceBearing({ requirement, candidate, sourceText, context });
  return { classification, context };
}

function top5Metrics({ candidates, expected }) {
  const expectedChunkRank = candidates.findIndex((item) => item.chunk_id === expected.chunk_id);
  const expectedMaterial = candidates.some((item) => item.material_id === expected.material_id);
  const expectedDocument = candidates.some((item) => (item.source_document_id || item.material_id) === expected.document_id);
  const uniqueMaterials = new Set(candidates.map((item) => item.material_id)).size;
  const uniqueDocuments = new Set(candidates.map((item) => item.source_document_id || item.material_id)).size;
  let nearDuplicates = 0;
  for (let i = 0; i < candidates.length; i += 1) {
    if (candidates.slice(0, i).some((previous) => isNearDuplicate(previous, candidates[i]))) nearDuplicates += 1;
  }
  return {
    expected_chunk_rank: expectedChunkRank >= 0 ? expectedChunkRank + 1 : null,
    gold_hit_at_1: expectedChunkRank === 0,
    gold_hit_at_3: expectedChunkRank >= 0 && expectedChunkRank < 3,
    gold_hit_at_5: expectedChunkRank >= 0 && expectedChunkRank < 5,
    material_hit_at_5: expectedMaterial,
    document_hit_at_5: expectedDocument,
    mrr: expectedChunkRank >= 0 ? 1 / (expectedChunkRank + 1) : 0,
    unique_materials_at_5: uniqueMaterials,
    unique_documents_at_5: uniqueDocuments,
    near_duplicate_chunks_at_5: nearDuplicates
  };
}

function missReason({ expected, finalCandidates, rawCandidates, classifications }) {
  if (finalCandidates.some((item) => item.chunk_id === expected.chunk_id)) return null;
  if (rawCandidates.some((item) => item.chunk_id === expected.chunk_id)) return 'RANKING_MISS';
  if (classifications.some((item) => item.classification.classification === 'METADATA_OR_HEADER')) return 'METADATA_POLLUTION';
  if (classifications.filter((item) => item.classification.classification === 'TOPIC_RELEVANT_ONLY').length >= 3) return 'QUERY_SEMANTIC_MISS';
  if (new Set(finalCandidates.map((item) => item.material_id)).size < finalCandidates.length) return 'DUPLICATE_CHUNK_CROWDING';
  return 'QUERY_SEMANTIC_MISS';
}

async function evaluateCase({ item, index, service, facade }) {
  const expected = item.expected_source;
  const requirementUuid = stableEvalUuid(index);
  const started = Date.now();
  try {
    const result = await service.retrieve(requirementUuid, { top_k: TOP_K });
    const finalCandidates = (result.final_candidates || []).slice(0, TOP_K);
    const rawCandidates = (result.raw_candidates || []).slice(0, 20);
    const evaluated = [];
    for (const candidate of finalCandidates) {
      const material = await facade.getCompanyMaterial(candidate.material_id);
      const chunks = await facade.listMaterialChunks(candidate.material_id);
      const { classification, context } = classifyCandidate({ requirement: { text: item.requirement.exact_text, requirement_category: 'eval_only_retrieval_query' }, candidate, material, chunks });
      evaluated.push({
        rank: candidate.rank,
        raw_vector_rank: candidate.raw_vector_rank,
        material_id: candidate.material_id,
        document_id: candidate.source_document_id || candidate.material_id,
        chunk_id: candidate.chunk_id,
        score: Number(candidate.similarity_score),
        raw_original_text: candidate.source_text || '',
        runtime_heuristic_classification: classification.classification,
        heuristic_reason_codes: classification.reason_codes || [],
        context_recovery_rate: context.context_recovery_rate,
        context_recovery_state: context.recovery_state
      });
    }
    const metrics = top5Metrics({ candidates: finalCandidates, expected });
    const metadataCandidates = evaluated.filter((item) => isMetadataOrHeader(item.raw_original_text));
    const topicCandidates = evaluated.filter((item) => item.runtime_heuristic_classification === 'TOPIC_RELEVANT_ONLY');
    const expectedRawRank = rawCandidates.findIndex((candidate) => candidate.chunk_id === expected.chunk_id);
    const resultCase = {
      case_id: item.case_id,
      eval_requirement_id: item.eval_requirement_id,
      requirement_exact_text: item.requirement.exact_text,
      expected: {
        material_id: expected.material_id,
        document_id: expected.document_id,
        chunk_id: expected.chunk_id,
        verified_source_text: expected.expected_source_text,
        source_span_id: expected.verified_span_id,
        source_hash: expected.expected_span_hash,
        index_status: item.dimensions.index_presence
      },
      retrieval_run_id: result.run.retrieval_run_id,
      latency_ms: result.run.latency_ms ?? (Date.now() - started),
      actual_top5: evaluated,
      formal_metrics: metrics,
      raw_top20_forensics: expectedRawRank >= 0 && !metrics.gold_hit_at_5
        ? rawCandidates.map((candidate) => ({ rank: candidate.rank, material_id: candidate.material_id, document_id: candidate.source_document_id || candidate.material_id, chunk_id: candidate.chunk_id, score: Number(candidate.similarity_score), raw_original_text: candidate.source_text || '' }))
        : [],
      miss_forensics: metrics.gold_hit_at_5 ? null : {
        expected_chunk_raw_rank: expectedRawRank >= 0 ? expectedRawRank + 1 : null,
        classification: missReason({ expected, finalCandidates, rawCandidates, classifications: evaluated.map((entry) => ({ classification: { classification: entry.runtime_heuristic_classification } })) }),
        expected_chunk_current_index: item.dimensions.index_presence === 'CURRENT'
      },
      heuristic_audit: {
        metadata_candidates: metadataCandidates.length,
        metadata_false_evidence_classifications: metadataCandidates.filter((item) => item.runtime_heuristic_classification === 'EVIDENCE_BEARING').length,
        topic_only_candidates: topicCandidates.length,
        topic_only_false_evidence_classifications: topicCandidates.filter((item) => item.runtime_heuristic_classification === 'EVIDENCE_BEARING').length
      },
      status: 'SUCCEEDED',
      semantic_support_result: 'NOT_EXECUTED_MODEL_PROHIBITED'
    };
    return resultCase;
  } catch (error) {
    return {
      case_id: item.case_id,
      eval_requirement_id: item.eval_requirement_id,
      requirement_exact_text: item.requirement.exact_text,
      expected: { ...item.expected_source, index_status: item.dimensions.index_presence },
      retrieval_run_id: facade.runs.get(requirementUuid)?.retrieval_run_id || null,
      latency_ms: Date.now() - started,
      actual_top5: [],
      raw_top20_forensics: [],
      formal_metrics: { expected_chunk_rank: null, gold_hit_at_1: false, gold_hit_at_3: false, gold_hit_at_5: false, material_hit_at_5: false, document_hit_at_5: false, mrr: 0, unique_materials_at_5: 0, unique_documents_at_5: 0, near_duplicate_chunks_at_5: 0 },
      miss_forensics: { classification: 'TECHNICAL_FAILURE', error_code: error?.code || 'RETRIEVAL_FAILED', expected_chunk_current_index: item.dimensions.index_presence === 'CURRENT' },
      heuristic_audit: { metadata_candidates: 0, metadata_false_evidence_classifications: 0, topic_only_candidates: 0, topic_only_false_evidence_classifications: 0 },
      status: 'TECHNICAL_FAILURE',
      error_code: error?.code || 'RETRIEVAL_FAILED',
      error_message: error?.message || 'Retrieval failed.',
      semantic_support_result: 'NOT_REACHED'
    };
  }
}

function aggregate(cases) {
  const successful = cases.filter((item) => item.status === 'SUCCEEDED');
  const ratio = (key) => successful.length ? successful.filter((item) => item.formal_metrics[key]).length / successful.length : null;
  const sum = (key) => successful.reduce((total, item) => total + Number(item.formal_metrics[key] || 0), 0);
  const auditSum = (key) => successful.reduce((total, item) => total + Number(item.heuristic_audit[key] || 0), 0);
  const missCases = cases.filter((item) => item.miss_forensics?.classification);
  const missCount = missCases.filter((item) => !item.formal_metrics.gold_hit_at_5).length;
  return {
    executed_cases: cases.length,
    retrieval_success_count: successful.length,
    technical_failure_count: cases.length - successful.length,
    embedding_calls: null,
    expected_chunk_hit_at_1: ratio('gold_hit_at_1'),
    expected_chunk_hit_at_3: ratio('gold_hit_at_3'),
    expected_chunk_hit_at_5: ratio('gold_hit_at_5'),
    expected_material_hit_at_5: ratio('material_hit_at_5'),
    expected_document_hit_at_5: ratio('document_hit_at_5'),
    expected_rank_mrr: successful.length ? sum('mrr') / successful.length : null,
    unique_materials_at_5: successful.length ? sum('unique_materials_at_5') / successful.length : null,
    unique_documents_at_5: successful.length ? sum('unique_documents_at_5') / successful.length : null,
    near_duplicate_chunks_at_5: sum('near_duplicate_chunks_at_5'),
    metadata_returned_count: auditSum('metadata_candidates'),
    metadata_false_evidence_classifications: auditSum('metadata_false_evidence_classifications'),
    topic_only_returned_count: auditSum('topic_only_candidates'),
    topic_only_false_evidence_classifications: auditSum('topic_only_false_evidence_classifications'),
    miss_count: missCount,
    miss_forensics: Object.fromEntries(['RANKING_MISS', 'QUERY_SEMANTIC_MISS', 'METADATA_POLLUTION', 'DUPLICATE_CHUNK_CROWDING', 'SCOPE_FILTER_ERROR', 'INDEX_ERROR', 'TECHNICAL_FAILURE'].map((key) => [key, missCases.filter((item) => item.miss_forensics?.classification === key).length]))
  };
}

function markdownCase(item) {
  const expected = item.expected;
  const lines = [
    `## ${item.case_id} / ${item.eval_requirement_id}`,
    '',
    `- Requirement：${item.requirement_exact_text}`,
    `- Expected Material：${expected.material_id}`,
    `- Expected Document：${expected.document_id}`,
    `- Expected Chunk：${expected.chunk_id}`,
    `- Expected verified source text：`,
    '',
    '```text',
    expected.verified_source_text || '(none)',
    '```',
    '',
    `- Retrieval Run ID：${item.retrieval_run_id || 'NONE'}`,
    `- Status：${item.status}`,
    `- Latency：${item.latency_ms ?? '—'} ms`,
    `- Expected Chunk Rank：${item.formal_metrics.expected_chunk_rank ?? 'NOT_FOUND'}`,
    `- Gold-backed Hit@1：${item.formal_metrics.gold_hit_at_1 ? 'PASS' : 'FAIL'}`,
    `- Gold-backed Hit@3：${item.formal_metrics.gold_hit_at_3 ? 'PASS' : 'FAIL'}`,
    `- Gold-backed Hit@5：${item.formal_metrics.gold_hit_at_5 ? 'PASS' : 'FAIL'}`,
    `- Material Hit@5：${item.formal_metrics.material_hit_at_5 ? 'PASS' : 'FAIL'}`,
    `- Document Hit@5：${item.formal_metrics.document_hit_at_5 ? 'PASS' : 'FAIL'}`,
    `- MRR：${item.formal_metrics.mrr}`,
    '',
    '### Actual Top5',
    ''
  ];
  for (const candidate of item.actual_top5 || []) {
    lines.push(`#### Rank ${candidate.rank}`);
    lines.push(`- Material：${candidate.material_id}`);
    lines.push(`- Document：${candidate.document_id}`);
    lines.push(`- Chunk：${candidate.chunk_id}`);
    lines.push(`- Score：${candidate.score}`);
    lines.push(`- Raw original text：`);
    lines.push('```text');
    lines.push(candidate.raw_original_text || '(empty)');
    lines.push('```');
    lines.push(`- Runtime heuristic classification：${candidate.runtime_heuristic_classification}`);
    lines.push('');
  }
  lines.push('### Duplicate / heuristic audit', '');
  lines.push(`- Unique Materials@5：${item.formal_metrics.unique_materials_at_5}`);
  lines.push(`- Unique Documents@5：${item.formal_metrics.unique_documents_at_5}`);
  lines.push(`- Near-Duplicate Chunks@5：${item.formal_metrics.near_duplicate_chunks_at_5}`);
  lines.push(`- Metadata candidates：${item.heuristic_audit.metadata_candidates}`);
  lines.push(`- Metadata false Evidence-Bearing：${item.heuristic_audit.metadata_false_evidence_classifications}`);
  lines.push(`- Topic-only candidates：${item.heuristic_audit.topic_only_candidates}`);
  lines.push(`- Topic-only false Evidence-Bearing：${item.heuristic_audit.topic_only_false_evidence_classifications}`);
  if (item.miss_forensics) lines.push('', '### Miss forensics', '', `- ${JSON.stringify(item.miss_forensics)}`);
  lines.push('', '- Semantic support / Mapping / Claim Gate / Writer：NOT_EXECUTED', '', '---', '');
  return lines.join('\n');
}

export async function runTargetedGoldLiveRetrieval({ env = null, qualificationPath = QUALIFICATION_PATH, reportPath = REPORT_PATH, markdownPath = MARKDOWN_PATH } = {}) {
  const qualification = JSON.parse(await fs.readFile(qualificationPath, 'utf8'));
  const executable = (qualification.cases || []).filter((item) => item.readiness.status === 'GOLD_READY_FOR_RETRIEVAL');
  if (executable.length !== 7) throw new Error(`TARGETED_GOLD_EXECUTABLE_COUNT_${executable.length}`);
  const runtime = createBackendRuntime({ env: env || process.env });
  const pool = createPool(runtime.env.DATABASE_URL);
  const repository = new PgRepository(pool);
  const facade = new EvaluationRepositoryFacade(repository, executable);
  const transport = createEmbeddingFetchFromEnv({ env: runtime.env });
  const realEmbeddingClient = createEmbeddingClientFromEnv({ env: runtime.env, fetchImpl: transport.fetchImpl });
  const embeddingCounter = { count: 0 };
  const embeddingClient = {
    ...realEmbeddingClient,
    embed: async (...args) => {
      embeddingCounter.count += 1;
      return realEmbeddingClient.embed(...args);
    }
  };
  const service = new EnterpriseRetrievalService({ repository: facade, embeddingClient, defaultTopK: TOP_K });
  const report = {
    schema_version: '4.3-targeted-gold-live-retrieval-v1',
    title: 'P0 7-CASE LIVE RETRIEVAL CHECKPOINT',
    generated_at: new Date().toISOString(),
    executable_cases: executable.map((item) => item.case_id),
    denominator: 7,
    model_calls: 0,
    llm_calls: 0,
    dify_calls: 0,
    automatic_retry: false,
    mapping_executed: false,
    human_gold_modified: false,
    production_requirement_created: false,
    production_retrieval_audit_writes: 0,
    cases: [],
    metrics: {},
    gpt_review_status: 'PENDING_REVIEW',
    eval_complete: false
  };
  try {
    for (let index = 0; index < executable.length; index += 1) {
      const result = await evaluateCase({ item: executable[index], index, service, facade });
      report.cases.push(result);
    }
    report.metrics = aggregate(report.cases);
    report.embedding_calls = embeddingCounter.count;
    report.metrics.embedding_calls = embeddingCounter.count;
    report.status = report.metrics.technical_failure_count === 0 ? 'PASS_PENDING_GPT_REVIEW' : 'PARTIAL_TECHNICAL_FAILURE';
    await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    const markdown = [
      '# GPT REVIEW PACKET — LIVE RETRIEVAL 7',
      '',
      '- This packet contains all seven Gold-backed cases and their raw Top5 text.',
      '- Formal Gold Hit@K is based only on expected Chunk identity; heuristic Evidence-Bearing classification is diagnostic.',
      '- No LLM, Dify, Mapping, Evidence Fact, Claim Gate or Writer path was executed.',
      '',
      '## Execution',
      '',
      `- Cases：${report.cases.length}`,
      `- Embedding calls：${report.embedding_calls}`,
      `- Retrieval success：${report.metrics.retrieval_success_count}`,
      `- Technical failures：${report.metrics.technical_failure_count}`,
      `- GPT_REVIEW_STATUS：${report.gpt_review_status}`,
      `- EVAL_COMPLETE：${report.eval_complete ? 'YES' : 'NO'}`,
      '',
      '## Formal Gold Metrics',
      '',
      '```json',
      JSON.stringify(report.metrics, null, 2),
      '```',
      '',
      '## Case-level results',
      '',
      ...report.cases.map(markdownCase),
      '## Safety',
      '',
      '- Formal Requirement creation：NO',
      '- Evidence Fact / Mapping / Claim Gate / Writer：NOT_EXECUTED',
      '- MMR：NOT_EXECUTED',
      '- LLM calls：0',
      '- Dify calls：0'
    ].join('\n');
    await fs.writeFile(markdownPath, markdown, 'utf8');
    return report;
  } finally {
    await transport.close();
    await pool.end();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const report = await runTargetedGoldLiveRetrieval();
  console.log(JSON.stringify({ status: report.status, embedding_calls: report.embedding_calls, retrieval_success_count: report.metrics.retrieval_success_count, metrics: report.metrics }));
}
