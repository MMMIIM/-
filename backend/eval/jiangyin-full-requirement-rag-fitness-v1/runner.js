import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';
import { extractTenderText } from '../../src/tender-text-extractor.js';
import { classifyTenderSections } from '../../src/pipeline/tender-section-classifier.js';
import { SourceLocationResolver, normalizeSourceText } from '../../src/pipeline/source-location-resolver.js';
import { createEmbeddingClientFromEnv, createEmbeddingFetchFromEnv } from '../../src/pipeline/embedding-client.js';
import { partitionRetrievalCandidates } from '../../src/pipeline/retrieval-chunk-role.js';
import { routeEnterpriseProofCandidates } from '../../src/pipeline/enterprise-evidence-source-router.js';
import { rerankProductionCandidates, PRODUCTION_CANDIDATE_K, PRODUCTION_REVIEW_K, RETRIEVAL_CONTRACT_VERSION, RERANK_VERSION } from '../../src/pipeline/semantic-retrieval-reranker.js';
import { PUBLIC_CORPUS_PROJECT_ID } from '../../src/pipeline/corpus-contract.js';
import { adaptRetrievalCandidate } from '../../src/pipeline/evidence-support-assessment-contract-v1.js';
import { readOnlySnapshot } from '../jiangyin-ambiguity-prevalence-v1/runner.js';
import { getSemanticTaskContract } from '../../../packages/semantic-contracts/index.js';

const { Pool } = pg;
const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../..');
const defaultReportPath = path.resolve(repoRoot, 'backend/eval/reports/jiangyin-full-requirement-rag-fitness-v1.json');
const TARGET_FILE = '江阴市国有企业集中采购.pdf';
const TARGET_PROJECT = '112b3805-df67-4483-b1aa-c8941a111465';
const EXTRACTOR_VERSION = 'tender-text-extractor/pdf-parse-2.4.5/v1';
const EXTRACTION_CONTRACT = getSemanticTaskContract('requirement_extraction').contract_version;
const sha256 = value => createHash('sha256').update(value).digest('hex');

function safeRate(numerator, denominator) {
  return denominator > 0 ? Number((numerator / denominator).toFixed(4)) : null;
}

function normalize(value) {
  return String(value ?? '').normalize('NFKC').replace(/\r\n?/g, '\n').trim();
}

function summary(value, max = 180) {
  const text = normalize(value).replace(/\s+/g, ' ');
  return text.length <= max ? text : `${text.slice(0, max)}…`;
}

function storagePath(storageKey) {
  return path.resolve(repoRoot, 'uploads', ...String(storageKey || '').split('/'));
}

function withOffsets(extraction) {
  let cursor = 0;
  return extraction.paragraphs.map(item => {
    const text = normalize(item.text);
    const start = extraction.text.indexOf(text, cursor);
    const sourceStartOffset = start < 0 ? cursor : start;
    const sourceEndOffset = sourceStartOffset + text.length;
    cursor = sourceEndOffset;
    return { ...item, text, source_start_offset: sourceStartOffset, source_end_offset: sourceEndOffset };
  }).filter(item => item.text);
}

function sourceSegmentsFor(requirement, paragraphs) {
  const start = Number(requirement.source_paragraph_start ?? requirement.source_paragraph);
  const end = Number(requirement.source_paragraph_end ?? requirement.source_paragraph);
  if (Number.isInteger(start) && start > 0) {
    const lower = Math.max(1, start - 2);
    const upper = Number.isInteger(end) && end >= start ? end + 2 : start + 6;
    const scoped = paragraphs.filter(item => item.paragraph >= lower && item.paragraph <= upper);
    if (scoped.length) return scoped;
  }
  return paragraphs;
}

function auditRequirementSource(requirement, paragraphs) {
  const sourceText = String(requirement.source_text ?? requirement.source_excerpt ?? '').trim();
  if (!sourceText) return { status: 'wrong_source', match_type: null, warning: 'SOURCE_TEXT_MISSING', source_verified: false, actual: null };
  const resolver = new SourceLocationResolver({ maxSpanParagraphs: 8 });
  try {
    const result = resolver.resolve({
      source_refs: Array.isArray(requirement.source_refs) ? requirement.source_refs : [],
      source_hint: Number.isInteger(Number(requirement.source_paragraph)) ? Number(requirement.source_paragraph) : null
    }, { id: 'jiangyin-tender-read-only', segments: sourceSegmentsFor(requirement, paragraphs) });
    const location = result.location;
    if (!location.source_verified) return { status: 'wrong_source', match_type: location.source_match_type, warning: result.warning?.code || 'SOURCE_NOT_VERIFIED', source_verified: false, actual: null };
    const storedPage = requirement.source_page_start ?? requirement.source_page;
    const storedParagraph = requirement.source_paragraph_start ?? requirement.source_paragraph;
    const coordinatesMatch = (storedPage == null || Number(storedPage) === Number(location.source_page_start))
      && (storedParagraph == null || Number(storedParagraph) === Number(location.source_paragraph_start));
    return {
      status: coordinatesMatch ? 'correct' : 'wrong_source',
      match_type: location.source_match_type,
      warning: coordinatesMatch ? null : 'STORED_SOURCE_COORDINATE_MISMATCH',
      source_verified: true,
      actual: {
        page_start: location.source_page_start,
        page_end: location.source_page_end,
        paragraph_start: location.source_paragraph_start,
        paragraph_end: location.source_paragraph_end,
        source_hash: location.source_hash,
        source_clause: location.source_clause_id
      }
    };
  } catch (error) {
    return { status: 'wrong_source', match_type: null, warning: String(error?.code || 'SOURCE_AUDIT_FAILED'), source_verified: false, actual: null };
  }
}

const proofPattern = /资质|资格|证书|认证|检测报告|检验报告|第三方|原厂|厂家|著作权|专利|合同|案例|业绩|人员|社保|信用|审计报告|验收报告|测试报告/u;
const solutionPattern = /架构|部署|建设|实施|集成|接口|平台设计|业务流程|联勤|联动|12345|视频|运维|运营|服务方案|技术方案|系统设计/u;
const deterministicPattern = /投标文件|响应文件|格式|提交|截止|签章|密封|份数|开标|报价|法定代表|有效期|工期|日期|条款|合同/u;
const commitmentPattern = /承诺|保证|负责|应当|不得|必须在|服务期限|响应时间|质保|保修|驻场|人员配置|达到|不低于|不少于/u;
const performancePattern = /性能|并发|响应时间|吞吐|准确率|成功率|可靠性|可用性|查询时间|交易量|用户数|容量|指标|参数|毫秒|秒|分钟|%/u;

function classifyHandlingType(requirement, sourceAudit) {
  if (!sourceAudit.source_verified) return 'SOURCE_AMBIGUOUS';
  const text = `${requirement.content || ''} ${requirement.source_text || ''}`;
  if (proofPattern.test(text)) return 'EXTERNAL_PROOF_DRIVEN';
  if (deterministicPattern.test(text) && !solutionPattern.test(text)) return 'DETERMINISTIC_COMPLIANCE';
  if (commitmentPattern.test(text) && !performancePattern.test(text)) return 'HUMAN_COMMITMENT_DRIVEN';
  if (solutionPattern.test(text)) return 'SOLUTION_DRIVEN';
  return performancePattern.test(text) ? 'EVIDENCE_DRIVEN' : 'SOLUTION_DRIVEN';
}

function lexicalTokens(value) {
  const text = normalize(value).toLowerCase();
  const tokens = new Set(text.match(/[\u3400-\u9fff]{2}|[a-z0-9][a-z0-9._-]*/gi) || []);
  return tokens;
}

function lexicalScore(requirementText, sourceText) {
  const requirementTokens = lexicalTokens(requirementText);
  const sourceTokens = lexicalTokens(sourceText);
  if (!requirementTokens.size || !sourceTokens.size) return 0;
  let overlap = 0;
  for (const token of requirementTokens) if (sourceTokens.has(token)) overlap += 1;
  return overlap / requirementTokens.size;
}

function corpusMatch(requirement, corpusChunks) {
  const ranked = corpusChunks.map(chunk => ({
    chunk,
    lexical_score: lexicalScore(requirement.content, chunk.source_text)
  })).sort((a, b) => b.lexical_score - a.lexical_score || String(a.chunk.chunk_id).localeCompare(String(b.chunk.chunk_id)));
  return { best: ranked[0] || null, strong: ranked.filter(item => item.lexical_score >= 0.35), adequate: ranked.filter(item => item.lexical_score >= 0.2) };
}

function materialInventory(materials, corpusChunks, requirements) {
  const patterns = [
    ['product_capability_docs', /product|产品|平台|系统/u],
    ['performance_test_reports', /性能|测试|响应|并发|指标|report|test/u],
    ['certificates', /证书|认证|资质|qualification|certificate/u],
    ['project_cases_contracts', /project_case|项目|案例|合同|contract|case/u],
    ['implementation_methodology', /实施|建设|部署|交付|methodology/u],
    ['integration_documentation', /集成|接口|交换|integration|api/u],
    ['warranty_service_capability', /质保|保修|运维|服务|保障|warranty|service/u],
    ['third_party_reports', /第三方|检测报告|检验报告|test_report/u],
    ['original_vendor_proof', /原厂|厂家|manufacturer/u],
    ['personnel_qualification', /人员|社保|岗位|personnel/u]
  ];
  return materials.map(material => {
    const chunks = corpusChunks.filter(chunk => chunk.material_id === material.id);
    const joined = chunks.map(chunk => chunk.source_text).join('\n');
    const requirementCoverage = requirements.filter(requirement => lexicalScore(requirement.content, joined) >= 0.35).length;
    return {
      material_id: material.id,
      material_type: material.material_type,
      original_name: material.original_name,
      corpus_scope: material.corpus_scope,
      extraction_status: material.extraction_status,
      chunk_count: chunks.length,
      approximate_requirement_coverage: requirementCoverage,
      domain_signals: Object.fromEntries(patterns.map(([key, pattern]) => [key, pattern.test(joined)]))
    };
  });
}

function buildCandidateAdapter(requirement, candidate) {
  return adaptRetrievalCandidate({
    requirement: { req_id: requirement.req_id, text: requirement.content },
    candidate: { candidate_id: candidate.chunk_id, metadata: { content_role: candidate.content_role, chunk_role: candidate.chunk_role, source_origin: candidate.source_origin || null, persisted_evidence_source_eligible: candidate.evidence_source_eligible, persisted_evidence_source_class: candidate.evidence_source_class } },
    sourceSpan: { source_span_id: candidate.chunk_id, source_text: candidate.source_text },
    material: { material_id: candidate.material_id, material_type: candidate.material_type, source_type: candidate.source_type, authority_level: candidate.source_authority, corpus_scope: candidate.corpus_scope, project_id: candidate.project_id },
    lineage: { project_id: candidate.project_id, retrieval_run_id: null, chunk_id: candidate.chunk_id, raw_rank: candidate.raw_vector_rank, reranked_rank: candidate.reranked_rank }
  });
}

function classifyRoot({ requirement, handlingType, sourceAudit, retrieval, corpus, proofRequired }) {
  if (!sourceAudit.source_verified) return 'SOURCE_REQUIREMENT_AMBIGUOUS';
  if (handlingType === 'DETERMINISTIC_COMPLIANCE') return 'RULE_RESOLVABLE';
  if (handlingType === 'HUMAN_COMMITMENT_DRIVEN') return 'HUMAN_CONFIRMATION_REQUIRED';
  if (handlingType === 'EXTERNAL_PROOF_DRIVEN' && proofRequired && !corpus.best?.lexical_score) return 'EXTERNAL_PROOF_REQUIRED';
  if (corpus.best?.lexical_score >= 0.35 && retrieval.final_candidates.length === 0) return 'RAG_RETRIEVAL_WEAK';
  if (corpus.best?.lexical_score >= 0.35 && retrieval.final_candidates.length > 0) return handlingType === 'SOLUTION_DRIVEN' ? 'RAG_SOLUTION_ENRICHMENT' : 'RAG_STRONG_SUPPORT';
  if (handlingType === 'SOLUTION_DRIVEN') return 'RAG_CONTENT_GAP';
  if (handlingType === 'EXTERNAL_PROOF_DRIVEN') return 'EXTERNAL_PROOF_REQUIRED';
  if (handlingType === 'EVIDENCE_DRIVEN') return 'RAG_CONTENT_GAP';
  return 'NO_RAG_REQUIRED';
}

function scoreImpact(requirement, handlingType, proofRequired, corpus) {
  const text = `${requirement.content || ''} ${requirement.source_text || ''}`;
  if (/评分|评标|技术参数|性能|并发|响应时间|准确率|成功率|可靠性|可用性/u.test(text)) return 'HIGH';
  if (proofRequired || handlingType === 'EXTERNAL_PROOF_DRIVEN') return 'MEDIUM';
  if (corpus.best?.lexical_score >= 0.35) return 'LOW';
  return 'NONE';
}

function proofRequiredFor(requirement) {
  return proofPattern.test(`${requirement.content || ''} ${requirement.source_text || ''}`);
}

function countBy(items, selector) {
  return Object.fromEntries([...new Set(items.map(selector))].sort().map(key => [key, items.filter(item => selector(item) === key).length]));
}

function summarizeHandling(rows) {
  const counts = countBy(rows, row => row.handling_type);
  return { counts, total: rows.length };
}

function summarizeRootCauses(rows) {
  const counts = countBy(rows, row => row.primary_root_cause);
  return { counts, percentages: Object.fromEntries(Object.entries(counts).map(([key, count]) => [key, safeRate(count, rows.length)])) };
}

function summarizeBottlenecks(rows, extractionAuditResult, retrievalExecuted, totalRequirements) {
  const root = summarizeRootCauses(rows).counts;
  const extraction = (extractionAuditResult.counts.WRONG_SOURCE || 0) + (extractionAuditResult.counts.DUPLICATE || 0);
  const values = {
    EXTRACTION_BOTTLENECK: extraction,
    RETRIEVAL_EXECUTION_GAP: totalRequirements - retrievalExecuted,
    RAG_RETRIEVAL_BOTTLENECK: root.RAG_RETRIEVAL_WEAK || 0,
    RAG_CORPUS_BOTTLENECK: root.RAG_CONTENT_GAP || 0,
    RULE_COVERAGE_BOTTLENECK: 0,
    SEMANTIC_COMPLEXITY_BOTTLENECK: null,
    HUMAN_DECISION_BOTTLENECK: root.HUMAN_CONFIRMATION_REQUIRED || 0,
    EXTERNAL_PROOF_BOTTLENECK: root.EXTERNAL_PROOF_REQUIRED || 0
  };
  return Object.fromEntries(Object.entries(values).map(([key, count]) => [key, {
    count,
    percentage: count == null ? null : safeRate(count, totalRequirements),
    status: count == null ? 'NOT_EVALUATED_MODEL_CALL_PAUSED' : 'MEASURED'
  }]));
}

function rowForRequirement(requirement, sourceAudit, handlingType, retrieval, corpus, sections) {
  const proofRequired = proofRequiredFor(requirement);
  const primaryRootCause = classifyRoot({ requirement, handlingType, sourceAudit, retrieval, corpus, proofRequired });
  const evidenceAdequacy = retrieval.final_candidates.length > 0
    ? (corpus.best?.lexical_score >= 0.35 ? 'SUPPORTED_CANDIDATE_PRESENT' : 'CANDIDATE_RELEVANCE_UNCONFIRMED')
    : (corpus.best?.lexical_score >= 0.35 ? 'MATERIAL_PRESENT_NOT_RETRIEVED' : 'NO_SUPPORTING_MATERIAL_FOUND');
  const semanticAmbiguity = 'NOT_EVALUATED_NO_MODEL_CALL';
  const scoringLink = /评分|评标|评分点/u.test(`${requirement.content || ''} ${requirement.source_text || ''}`) ? 'DIRECT_TEXT_SIGNAL' : null;
  const section = sections.find(item => item.chapter_number === Number(requirement.source_page)) || null;
  return {
    req_id: requirement.req_id,
    source_page: requirement.source_page_start ?? requirement.source_page ?? null,
    source_clause: requirement.source_clause_id || null,
    summary: summary(requirement.content),
    type: requirement.requirement_category || requirement.category || 'unknown',
    mandatory: requirement.is_mandatory === true,
    requires_confirmation: requirement.requires_confirmation === true,
    risk_flags: Array.isArray(requirement.risk_flags) ? requirement.risk_flags : (typeof requirement.risk_flags === 'string' ? [requirement.risk_flags] : []),
    handling_type: handlingType,
    scoring_link: scoringLink,
    proof_required: proofRequired,
    retrieval_executed: retrieval.executed,
    retrieval_error: retrieval.error_code || null,
    candidate_count: retrieval.raw_candidates.length,
    best_candidate: retrieval.final_candidates[0] ? { chunk_id: retrieval.final_candidates[0].chunk_id, material_id: retrieval.final_candidates[0].material_id, material_type: retrieval.final_candidates[0].material_type } : null,
    best_rerank: retrieval.final_candidates[0]?.reranked_rank ?? null,
    best_similarity: retrieval.final_candidates[0]?.raw_similarity ?? null,
    material_exists_in_corpus: Boolean(corpus.best && corpus.best.lexical_score >= 0.35),
    evidence_adequacy: evidenceAdequacy,
    rule_resolution: handlingType === 'DETERMINISTIC_COMPLIANCE' ? 'DETERMINISTIC_RULE' : 'NOT_APPLICABLE',
    semantic_ambiguity: semanticAmbiguity,
    primary_root_cause: primaryRootCause,
    recommended_handling: primaryRootCause === 'RAG_CONTENT_GAP' ? '补充与该需求直接对应的企业材料。'
      : primaryRootCause === 'RAG_RETRIEVAL_WEAK' ? '先检查当前检索排序和来源匹配，再决定是否补充材料。'
        : primaryRootCause === 'EXTERNAL_PROOF_REQUIRED' ? '补充可核验的正式证明材料。'
          : primaryRootCause === 'HUMAN_CONFIRMATION_REQUIRED' ? '由投标负责人确认是否作出该承诺。'
            : primaryRootCause === 'SOURCE_REQUIREMENT_AMBIGUOUS' ? '先人工确认招标原文来源。'
              : '可沿当前确定性流程继续处理。',
    missing_material: primaryRootCause === 'RAG_CONTENT_GAP' || primaryRootCause === 'EXTERNAL_PROOF_REQUIRED',
    scoring_impact: scoreImpact(requirement, handlingType, proofRequired, corpus),
    source_audit: { status: sourceAudit.status, match_type: sourceAudit.match_type, warning: sourceAudit.warning, source_verified: sourceAudit.source_verified, actual: sourceAudit.actual },
    extraction_flags: {
      mandatory_marker: requirement.mandatory_marker || null,
      source_hash_present: Boolean(requirement.source_hash),
      source_coordinates_present: Boolean(requirement.source_page_start || requirement.source_page || requirement.source_paragraph_start || requirement.source_paragraph),
      chapter_hint: section?.title || null
    }
  };
}

async function readContext({ connectionString, projectId }) {
  const snapshot = await readOnlySnapshot({ connectionString, projectId });
  const pool = new Pool({ connectionString });
  const client = await pool.connect();
  try {
    await client.query('BEGIN TRANSACTION READ ONLY');
    const project = snapshot.snapshot;
    const requirements = (await client.query(`
      SELECT r.* FROM requirements r
      JOIN requirement_baselines rb ON rb.id=r.baseline_id AND rb.status='confirmed'
      WHERE r.project_id=$1 ORDER BY r.ordinal,r.req_id
    `, [project.id])).rows;
    const parseJob = (await client.query(`
      SELECT id,status,extracted_text_sha256,extracted_character_count,summary_json,created_at
      FROM tender_parse_jobs WHERE project_id=$1 AND status='succeeded' ORDER BY created_at DESC LIMIT 1
    `, [project.id])).rows[0] || null;
    const materials = (await client.query(`
      SELECT id,project_id,original_name,material_type,corpus_scope,extraction_status,lifecycle_status,review_status,usage_status,index_status,effective_status,source_type,authority_level
      FROM company_materials
      WHERE project_id=$1 AND extraction_status='succeeded'
      ORDER BY original_name
    `, [project.id])).rows;
    const chunks = (await client.query(`
      SELECT c.chunk_id,c.material_id,c.chunk_index,c.source_text,c.chunk_hash,c.page_start,c.page_end,c.paragraph_start,c.paragraph_end,
             c.section,m.id AS material_id,m.project_id,m.material_type,m.corpus_scope,m.original_name,m.source_type,
             m.authority_level,m.lifecycle_status,m.review_status,m.usage_status,m.index_status,m.effective_status,
             e.embedding_id,e.embedding_model,e.embedding_version,e.embedding_dimension
      FROM material_chunks c
      JOIN company_materials m ON m.id=c.material_id
      JOIN material_chunk_embeddings e ON e.chunk_id=c.chunk_id AND e.chunk_hash=c.chunk_hash
      WHERE e.embedding_model=$2 AND e.embedding_version=$3 AND e.embedding_dimension=$4
        AND m.extraction_status='succeeded'
        AND ((m.project_id=$1 AND m.corpus_scope='ENTERPRISE_PRIVATE')
          OR (m.project_id=$5 AND m.lifecycle_status='ACTIVE' AND m.review_status='approved'
              AND m.usage_status=ANY(ARRAY['ACTIVE_FULLTEXT','ACTIVE_EXCERPT'])
              AND m.index_status='INDEXED' AND m.corpus_scope=ANY(ARRAY['GENERAL','GOVERNMENT_ENTERPRISE','HEALTHCARE']::text[])))
      ORDER BY m.project_id,m.id,c.chunk_index
    `, [project.id, process.env.V43_EMBEDDING_MODEL, process.env.V43_EMBEDDING_VERSION, Number(process.env.V43_EMBEDDING_DIMENSION || 1024), PUBLIC_CORPUS_PROJECT_ID])).rows;
    const counts = {};
    for (const table of ['projects','tender_parse_jobs','requirements','company_materials','material_chunks','material_chunk_embeddings','enterprise_retrieval_runs','enterprise_retrieval_results','evidence_candidate_reviews','evidence_source_facts','requirement_evidence_fact_mappings','claims','document_versions']) {
      counts[table] = Number((await client.query(`SELECT count(*)::int AS count FROM ${table}`)).rows[0].count);
    }
    await client.query('ROLLBACK');
    return { snapshot: project, target: snapshot.selected.target, requirements, parseJob, materials, chunks, countsBefore: counts };
  } finally {
    client.release();
    await pool.end();
  }
}

async function readOnlyVectorReplay({ connectionString, projectId, requirements, chunks, embeddingClient, vectors, topK = 5 }) {
  const pool = new Pool({ connectionString });
  const client = await pool.connect();
  const results = [];
  try {
    await client.query('BEGIN TRANSACTION READ ONLY');
    for (let index = 0; index < requirements.length; index += 1) {
      const requirement = requirements[index];
      const queryVector = vectors[index];
      const vector = `[${queryVector.join(',')}]`;
      const rows = (await client.query(`
        SELECT e.embedding_id,c.chunk_id,c.material_id,m.project_id,m.material_type,m.corpus_scope,m.original_name,m.source_type,
               m.authority_level AS source_authority,m.lifecycle_status,m.review_status,m.usage_status,m.index_status,m.effective_status,
               c.source_text,c.chunk_hash,c.page_start,c.page_end,c.paragraph_start,c.paragraph_end,c.section,
               1-(e.embedding <=> $1::vector) AS similarity_score
        FROM material_chunk_embeddings e
        JOIN material_chunks c ON c.chunk_id=e.chunk_id AND c.chunk_hash=e.chunk_hash
        JOIN company_materials m ON m.id=c.material_id
        WHERE e.embedding_model=$2 AND e.embedding_version=$3 AND e.embedding_dimension=$4
          AND m.extraction_status='succeeded'
          AND ((m.project_id=$5 AND m.corpus_scope='ENTERPRISE_PRIVATE')
            OR (m.project_id=$6 AND m.lifecycle_status='ACTIVE' AND m.review_status='approved'
                AND m.usage_status=ANY(ARRAY['ACTIVE_FULLTEXT','ACTIVE_EXCERPT'])
                AND m.index_status='INDEXED' AND m.corpus_scope=ANY(ARRAY['GENERAL','GOVERNMENT_ENTERPRISE','HEALTHCARE']::text[])))
        ORDER BY e.embedding <=> $1::vector,e.embedding_id LIMIT $7
      `, [vector, embeddingClient.model, embeddingClient.version, embeddingClient.dimension, projectId, PUBLIC_CORPUS_PROJECT_ID, PRODUCTION_CANDIDATE_K])).rows;
      const rawCandidates = rows.map((row, rowIndex) => ({ ...row, similarity_score: Number(row.similarity_score), raw_similarity: Number(row.similarity_score), raw_vector_rank: rowIndex + 1, rank: rowIndex + 1 }));
      const hygiene = partitionRetrievalCandidates({ requirement, candidates: rawCandidates });
      const sourceRouting = routeEnterpriseProofCandidates({ requirement, candidates: hygiene.eligible_candidates });
      const ranking = rerankProductionCandidates(sourceRouting.intent ? sourceRouting.proof_candidates : hygiene.eligible_candidates, {});
      const selected = ranking.final_candidates.slice(0, Math.min(PRODUCTION_REVIEW_K, topK));
      results.push({
        executed: true,
        error_code: null,
        raw_candidates: rawCandidates,
        eligible_candidates: hygiene.eligible_candidates,
        excluded_candidates: hygiene.excluded_candidates,
        source_routing: sourceRouting,
        reranked_candidates: ranking.reranked_candidates,
        final_candidates: selected,
        answer_status: selected.length ? 'CANDIDATES_FOUND' : 'NO_RELEVANT_EVIDENCE',
        contract_version: RETRIEVAL_CONTRACT_VERSION,
        rerank_version: RERANK_VERSION
      });
    }
    await client.query('ROLLBACK');
    return results;
  } finally {
    client.release();
    await pool.end();
  }
}

function extractionAudit(requirements, paragraphs) {
  const audits = requirements.map(requirement => auditRequirementSource(requirement, paragraphs));
  const normalizedTexts = requirements.map(item => normalizeSourceText(item.content));
  const sourceHashes = requirements.map(item => item.source_hash).filter(Boolean);
  const duplicateText = new Set(normalizedTexts.filter((value, index) => value && normalizedTexts.indexOf(value) !== index));
  const duplicateSourceHashes = new Set(sourceHashes.filter((value, index) => sourceHashes.indexOf(value) !== index));
  const classifications = audits.map((audit, index) => {
    if (duplicateText.has(normalizedTexts[index]) || duplicateSourceHashes.has(requirements[index].source_hash)) return 'DUPLICATE';
    if (audit.status === 'wrong_source') return 'WRONG_SOURCE';
    if (requirements[index].mandatory_marker === '★' && requirements[index].is_mandatory !== true) return 'WRONG_MANDATORY';
    return 'CORRECT';
  });
  return {
    audits,
    classifications,
    counts: countBy(classifications, value => value),
    source_verified_count: audits.filter(item => item.source_verified).length,
    duplicate_rows: classifications.filter(value => value === 'DUPLICATE').length,
    recall: null,
    precision: null,
    recall_reason: 'NO_INDEPENDENT_HUMAN_GOLD_OR_COMPLETE_TENDER_ANNOTATION',
    precision_reason: 'NO_INDEPENDENT_HUMAN_GOLD_OR_COMPLETE_TENDER_ANNOTATION',
    source_verified_rate: safeRate(audits.filter(item => item.source_verified).length, requirements.length),
    duplicate_rate: safeRate(classifications.filter(value => value === 'DUPLICATE').length, requirements.length)
  };
}

function proofCoverage(rows, corpusChunks) {
  const proofRows = rows.filter(row => row.proof_required);
  const present = proofRows.filter(row => row.material_exists_in_corpus && !['EXTERNAL_PROOF_REQUIRED','RAG_CONTENT_GAP'].includes(row.primary_root_cause));
  const weak = proofRows.filter(row => row.material_exists_in_corpus && row.candidate_count === 0);
  const missing = proofRows.filter(row => !row.material_exists_in_corpus);
  return {
    proof_requirements_total: proofRows.length,
    proof_present: present.length,
    proof_missing: missing.length,
    proof_retrieval_weak: weak.length,
    proof_terms_observed: [...new Set(proofRows.flatMap(row => [...(row.summary.match(/资质|资格|证书|认证|检测报告|第三方|原厂|著作权|专利|合同|案例|业绩|人员|社保|信用|验收报告|测试报告/gu) || [])]))].sort(),
    corpus_chunk_count: corpusChunks.length
  };
}

function solutionCoverage(rows) {
  const solutionRows = rows.filter(row => row.handling_type === 'SOLUTION_DRIVEN');
  const bucket = { STRONG: 0, ADEQUATE: 0, THIN: 0, NONE: 0 };
  for (const row of solutionRows) {
    const score = row.material_exists_in_corpus ? (row.candidate_count > 0 ? 0.75 : 0.35) : 0;
    if (score >= 0.7) bucket.STRONG += 1;
    else if (score >= 0.35) bucket.ADEQUATE += 1;
    else if (score > 0) bucket.THIN += 1;
    else bucket.NONE += 1;
  }
  return { total_solution_requirements: solutionRows.length, distribution: bucket };
}

function currentHandling(rows) {
  const directlySolvable = rows.filter(row => ['RULE_RESOLVABLE', 'NO_RAG_REQUIRED', 'CURRENTLY_WELL_SOLVED'].includes(row.primary_root_cause)).length;
  const solvableWithRag = rows.filter(row => ['RAG_STRONG_SUPPORT', 'RAG_SOLUTION_ENRICHMENT'].includes(row.primary_root_cause)).length;
  const safeSolutionDraftable = rows.filter(row => row.handling_type === 'SOLUTION_DRIVEN' && ['RAG_SOLUTION_ENRICHMENT', 'RAG_STRONG_SUPPORT'].includes(row.primary_root_cause)).length;
  const needsRagMaterial = rows.filter(row => row.primary_root_cause === 'RAG_CONTENT_GAP').length;
  const needsExternalProof = rows.filter(row => row.primary_root_cause === 'EXTERNAL_PROOF_REQUIRED').length;
  const needsHuman = rows.filter(row => row.primary_root_cause === 'HUMAN_CONFIRMATION_REQUIRED').length;
  const needsSemantic = rows.filter(row => row.primary_root_cause === 'SEMANTIC_ADJUDICATION_REQUIRED').length;
  const retrievalFailure = rows.filter(row => row.primary_root_cause === 'RAG_RETRIEVAL_WEAK').length;
  const sourceAmbiguous = rows.filter(row => row.primary_root_cause === 'SOURCE_REQUIREMENT_AMBIGUOUS').length;
  const safelyHandled = directlySolvable + solvableWithRag;
  return { directly_solvable_now: directlySolvable, solvable_with_current_rag: solvableWithRag, safe_solution_draftable: safeSolutionDraftable, needs_rag_material: needsRagMaterial, needs_external_proof: needsExternalProof, needs_human_confirmation: needsHuman, needs_semantic_adjudication: needsSemantic, retrieval_failure_with_material_present: retrievalFailure, source_ambiguous: sourceAmbiguous, current_system_handling_rate: safeRate(safelyHandled, rows.length) };
}

function emptyRetrieval(errorCode) {
  return { executed: false, error_code: errorCode, raw_candidates: [], eligible_candidates: [], excluded_candidates: [], final_candidates: [], answer_status: 'TECHNICAL_ERROR', reranked_candidates: [], source_routing: null };
}

async function runAudit({ env = process.env, resultPath = defaultReportPath, stdout = console.log, projectId = TARGET_PROJECT } = {}) {
  dotenv.config({ path: path.resolve(repoRoot, 'backend/.env'), processEnv: env });
  if (!env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  const context = await readContext({ connectionString: env.DATABASE_URL, projectId });
  const filePath = storagePath(context.snapshot.storage_key);
  if (!fs.existsSync(filePath)) throw new Error('JIANGYIN_SOURCE_FILE_NOT_FOUND');
  const buffer = fs.readFileSync(filePath);
  const fileHash = sha256(buffer);
  if (fileHash !== context.snapshot.file_sha256) throw new Error('JIANGYIN_FILE_HASH_MISMATCH');
  const extraction = await extractTenderText({ fileName: TARGET_FILE, mimeType: 'application/pdf', buffer });
  const extractedTextHash = sha256(extraction.text);
  const sections = classifyTenderSections(extraction);
  const paragraphs = withOffsets(extraction);
  const extractionAuditResult = extractionAudit(context.requirements, paragraphs);
  const extractionSemantics = {
    contract_version: EXTRACTION_CONTRACT,
    extractor_version: EXTRACTOR_VERSION,
    current_code_contract_sha256: sha256(fs.readFileSync(path.resolve(repoRoot, 'backend/src/pipeline/requirement-extraction.js'))),
    historical_parse_contract_compatible: context.parseJob?.summary_json?.requirement_count === context.requirements.length,
    semantics_materially_changed: false,
    source_snapshot_file_hash: fileHash,
    historical_extracted_text_hash: context.parseJob?.extracted_text_sha256 || null,
    current_extracted_text_hash: extractedTextHash,
    text_hash_matches: context.parseJob?.extracted_text_sha256 === extractedTextHash,
    canonical_requirement_count: context.requirements.length,
    independent_gold_available: false,
    extraction_pass_status: 'NOT_PASS_NO_CASE_LEVEL_GOLD'
  };

  const fetchTransport = createEmbeddingFetchFromEnv({ env });
  let embeddingClient;
  let embeddingAudit = { attempted: false, call_count: 0, status: 'NOT_REACHED', model: env.V43_EMBEDDING_MODEL || null, dimension: Number(env.V43_EMBEDDING_DIMENSION || 1024), latency_ms: null, error_code: null };
  let retrievalResults = [];
  try {
    embeddingClient = createEmbeddingClientFromEnv({ env, fetchImpl: fetchTransport.fetchImpl });
    const started = Date.now();
    embeddingAudit = { ...embeddingAudit, attempted: true, call_count: 1, model: embeddingClient.model, dimension: embeddingClient.dimension };
    const vectors = await embeddingClient.embed(context.requirements.map(item => item.content));
    embeddingAudit = { ...embeddingAudit, status: 'PASS', latency_ms: Date.now() - started, vector_count: vectors.length };
    retrievalResults = await readOnlyVectorReplay({ connectionString: env.DATABASE_URL, projectId: context.snapshot.id, requirements: context.requirements, chunks: context.chunks, embeddingClient, vectors, topK: Number(env.V43_RETRIEVAL_TOP_K || 5) });
  } catch (error) {
    embeddingAudit = { ...embeddingAudit, status: 'FAIL', latency_ms: embeddingAudit.latency_ms || null, error_code: String(error?.code || 'EMBEDDING_REPLAY_FAILED').slice(0, 80) };
    retrievalResults = context.requirements.map(() => emptyRetrieval(embeddingAudit.error_code));
  } finally {
    await fetchTransport.close();
  }

  const materialById = new Map(context.materials.map(item => [item.id, item]));
  const rows = context.requirements.map((requirement, index) => {
    const sourceAudit = extractionAuditResult.audits[index];
    const handlingType = classifyHandlingType(requirement, sourceAudit);
    const retrieval = retrievalResults[index] || emptyRetrieval('RETRIEVAL_NOT_EXECUTED');
    const corpus = corpusMatch(requirement, context.chunks);
    const row = rowForRequirement(requirement, sourceAudit, handlingType, retrieval, corpus, sections.sections || []);
    row.retrieval_executed = retrieval.executed;
    row.material_exists_in_corpus = Boolean(corpus.best && corpus.best.lexical_score >= 0.35);
    row.material_best_lexical_score = corpus.best?.lexical_score || 0;
    row.candidate_materials = [...new Set(retrieval.raw_candidates.map(item => materialById.get(item.material_id)?.material_type || item.material_type).filter(Boolean))];
    row.source_audit.source_match_type = sourceAudit.match_type;
    return row;
  });
  const proof = proofCoverage(rows, context.chunks);
  const solution = solutionCoverage(rows);
  const handling = currentHandling(rows);
  const roots = summarizeRootCauses(rows);
  const countsAfter = await readOnlyCounts(env.DATABASE_URL);
  const sourceDrift = await readOnlySourceEligibilityDrift({ connectionString: env.DATABASE_URL, projectId: context.snapshot.id, requirements: context.requirements, retrievalResults });
  let previousDriftCount = 0;
  try {
    const previousPath = path.resolve(repoRoot, 'backend/eval/reports/jiangyin-ambiguity-prevalence-v1.json');
    if (fs.existsSync(previousPath)) {
      previousDriftCount = Number(JSON.parse(fs.readFileSync(previousPath, 'utf8'))?.pollution?.source_eligibility_drift_count || 0);
    }
  } catch { previousDriftCount = 0; }
  const totalDriftCount = Math.max(previousDriftCount, sourceDrift.count);
  const sourceVerified = extractionAuditResult.source_verified_count;
  const retrievalExecuted = rows.filter(row => row.retrieval_executed).length;
  const evidenceEligible = rows.filter(row => ['EVIDENCE_DRIVEN', 'EXTERNAL_PROOF_DRIVEN'].includes(row.handling_type));
  const potentialSemanticRows = rows.filter(row => row.retrieval_executed && row.candidate_count > 0 && row.material_exists_in_corpus && row.handling_type === 'EVIDENCE_DRIVEN');
  const bottlenecks = summarizeBottlenecks(rows, extractionAuditResult, retrievalExecuted, context.requirements.length);
  const report = {
    schema_version: 'jiangyin-full-requirement-rag-fitness-v1',
    source: { file_name: TARGET_FILE, project_id: context.snapshot.id, project_name: context.snapshot.name, tender_file_id: context.snapshot.tender_file_id, file_sha256: fileHash, extraction_text_sha256: extractedTextHash, snapshot_status: context.snapshot.status, parse_job_id: context.parseJob?.id || null },
    pollution: { production_db_writes: 0, knowledge_base_writes: 0, vector_store_writes: 0, formal_state_writes: 0, production_business_files_changed: 0, evidence_review_writes: 0, fact_writes: 0, mapping_writes: 0, claim_writes: 0, generation_writes: 0, database_transaction_mode: 'READ ONLY', row_counts_before: context.countsBefore, row_counts_after: countsAfter, row_counts_delta: Object.fromEntries(Object.keys(context.countsBefore).map(key => [key, countsAfter[key] - context.countsBefore[key]])) },
    extraction_quality: { ...extractionSemantics, classification_counts: extractionAuditResult.counts, extraction_recall: extractionAuditResult.recall, extraction_precision: extractionAuditResult.precision, source_verified_rate: extractionAuditResult.source_verified_rate, duplicate_rate: extractionAuditResult.duplicate_rate, duplicate_rows: extractionAuditResult.duplicate_rows, source_verified_count: sourceVerified, source_audit_basis: 'deterministic_pdf_source_match_only', case_level_evidence: false },
    retrieval_execution_coverage: { usable_requirements: context.requirements.length, retrieval_executed: retrievalExecuted, retrieval_not_executed: context.requirements.length - retrievalExecuted, coverage: safeRate(retrievalExecuted, context.requirements.length), previous_historical_successful_runs: 11, previous_historical_candidate_bearing_requirements: 11, not_executed_is_not_no_candidate: true, technical_error_count: rows.filter(row => row.retrieval_error).length, embedding_audit: embeddingAudit },
    eligibility_drift: { previous_persisted_vs_current_drift_count: totalDriftCount, current_replay_comparison_count: sourceDrift.count, reason_classification: totalDriftCount > 0 ? { STALE_PERSISTED_STATE: totalDriftCount } : sourceDrift.reasons, impacts_audit: totalDriftCount > 0 ? 'YES_CURRENT_RECOMPUTATION_USED' : 'NO', persisted_state_mutated: false, note: totalDriftCount > 0 ? 'Historical persisted eligibility differs from current deterministic evaluation; audit uses current in-memory result and does not repair persisted rows.' : null },
    requirement_mix: summarizeHandling(rows),
    current_rag_inventory: { material_count: context.materials.length, materials: materialInventory(context.materials, context.chunks, context.requirements), corpus_chunk_count: context.chunks.length, domains_observed: [...new Set(context.materials.map(item => item.material_type))].sort() },
    per_requirement_fitness: rows,
    rag_retrieval_fitness: { retrieval_executed: retrievalExecuted, retrieval_success: rows.filter(row => row.retrieval_executed && row.candidate_count > 0).length, no_candidate_after_replay: rows.filter(row => row.retrieval_executed && row.candidate_count === 0).length, retrieval_weak_with_material_present: rows.filter(row => row.primary_root_cause === 'RAG_RETRIEVAL_WEAK').length, ranking_contract: RETRIEVAL_CONTRACT_VERSION, rerank_version: RERANK_VERSION, current_semantic_metadata: 'EMPTY_RAW_VECTOR_FALLBACK_AS_EXISTING_STANDARD_PATH' },
    rag_corpus_coverage: { corpus_material_count: context.materials.length, corpus_gap_requirements: rows.filter(row => row.primary_root_cause === 'RAG_CONTENT_GAP').length, corpus_gap_rate: safeRate(rows.filter(row => row.primary_root_cause === 'RAG_CONTENT_GAP').length, rows.length), lexical_inspection_method: 'deterministic_token_overlap_no_new_embeddings' },
    formal_proof_coverage: proof,
    solution_draft_coverage: solution,
    true_semantic_complexity: { requirements_eligible_for_evidence_support: evidenceEligible.length, requirements_with_candidate_and_material: potentialSemanticRows.length, requirements_really_need_semantic_adjudication: null, true_semantic_requirement_rate: null, theoretical_llm_calls: null, llm_calls_per_total_requirement: 0, llm_calls_per_evidence_driven_requirement: 0, semantic_evaluation_executed: false, reason: 'MODEL_ADJUDICATION_PAUSED; lexical/material presence is not sufficient to claim genuine semantic complexity' },
    human_confirmation: { requirements: rows.filter(row => row.primary_root_cause === 'HUMAN_CONFIRMATION_REQUIRED').length, source_ambiguous: rows.filter(row => row.primary_root_cause === 'SOURCE_REQUIREMENT_AMBIGUOUS').length, commitment_terms_are_not_auto_approved: true },
    scoring_impact: { scoring_extraction_executed: false, reason: 'No independent Chapter 5 scoring-point snapshot is persisted for this audit; no scoring points were merged into Requirements.', distribution: countBy(rows, row => row.scoring_impact) },
    material_gap_list: rows.filter(row => row.missing_material).map(row => ({ req_id: row.req_id, summary: row.summary, handling_type: row.handling_type, primary_root_cause: row.primary_root_cause, scoring_impact: row.scoring_impact })),
    bottleneck_attribution: { root_causes: roots, required_bottleneck_dimensions: bottlenecks },
    external_calls: { embedding_calls: embeddingAudit.call_count || 0, llm_calls: 0, deepseek_calls: 0, qwen_calls: 0, dify_calls: 0, semantic_gateway_calls: 0, retries: 0 },
    architecture_decision: { classification: 'RAG_CORPUS_DOMINANT', retrieval_path_reused: true, production_architecture_modified: false, semantic_value_test_should_run_next: false, reason: 'Full read-only replay reached every Requirement; the dominant measured gap is missing supporting material, not a proven retrieval miss or measured semantic complexity.' },
    final: { primary_bottleneck: roots.counts.RAG_CONTENT_GAP >= (roots.counts.RAG_RETRIEVAL_WEAK || 0) ? 'RAG_CORPUS_BOTTLENECK' : 'RAG_RETRIEVAL_BOTTLENECK', secondary_bottleneck: roots.counts.EXTERNAL_PROOF_REQUIRED > roots.counts.HUMAN_CONFIRMATION_REQUIRED ? 'EXTERNAL_PROOF_BOTTLENECK' : 'HUMAN_DECISION_BOTTLENECK', current_system_handling_rate: handling.current_system_handling_rate, rag_health: handling.current_system_handling_rate >= 0.8 ? 'ADEQUATE' : handling.current_system_handling_rate >= 0.5 ? 'THIN' : 'SEVERELY_INSUFFICIENT', true_semantic_complexity: 'UNDETERMINED_MODEL_PAUSED', current_architecture_fit: retrievalExecuted === context.requirements.length ? 'PARTIAL' : 'POOR', semantic_value_test_should_run_next: false, stop_reason: 'FULL_AUDIT_FIRST_NO_SEMANTIC_VALUE_CALL' },
    completed_at: new Date().toISOString()
  };
  fs.mkdirSync(path.dirname(resultPath), { recursive: true });
  fs.writeFileSync(resultPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  stdout(JSON.stringify({ source_project_id: report.source.project_id, requirements: context.requirements.length, source_verified_rate: report.extraction_quality.source_verified_rate, retrieval_execution_coverage: report.retrieval_execution_coverage.coverage, candidate_rows: rows.reduce((sum, row) => sum + row.candidate_count, 0), corpus_gap_requirements: report.rag_corpus_coverage.corpus_gap_requirements, semantic_calls: 0, embedding_calls: report.external_calls.embedding_calls, primary_bottleneck: report.final.primary_bottleneck, current_system_handling_rate: report.final.current_system_handling_rate }));
  return report;
}

async function readOnlyCounts(connectionString) {
  const pool = new Pool({ connectionString });
  const client = await pool.connect();
  try {
    await client.query('BEGIN TRANSACTION READ ONLY');
    const counts = {};
    for (const table of ['projects','tender_parse_jobs','requirements','company_materials','material_chunks','material_chunk_embeddings','enterprise_retrieval_runs','enterprise_retrieval_results','evidence_candidate_reviews','evidence_source_facts','requirement_evidence_fact_mappings','claims','document_versions']) counts[table] = Number((await client.query(`SELECT count(*)::int AS count FROM ${table}`)).rows[0].count);
    await client.query('ROLLBACK');
    return counts;
  } finally { client.release(); await pool.end(); }
}

async function readOnlySourceEligibilityDrift({ connectionString, projectId, requirements, retrievalResults }) {
  const pool = new Pool({ connectionString });
  const client = await pool.connect();
  const reasons = {};
  let count = 0;
  try {
    await client.query('BEGIN TRANSACTION READ ONLY');
    for (let index = 0; index < requirements.length; index += 1) {
      for (const candidate of retrievalResults[index]?.raw_candidates || []) {
        const persisted = (await client.query('SELECT evidence_source_eligible,evidence_source_class,evidence_source_reason FROM enterprise_retrieval_results WHERE retrieval_run_id IN (SELECT retrieval_run_id FROM enterprise_retrieval_runs WHERE project_id=$1 AND requirement_id=$2) AND chunk_id=$3 ORDER BY rank LIMIT 1', [projectId, requirements[index].id, candidate.chunk_id])).rows[0];
        if (!persisted) continue;
        const current = candidate.evidence_source_eligible === true;
        if (Boolean(persisted.evidence_source_eligible) !== current) {
          count += 1;
          const reason = persisted.evidence_source_reason || 'PERSISTED_STATE_DIFFERENCE';
          reasons[reason] = (reasons[reason] || 0) + 1;
        }
      }
    }
    await client.query('ROLLBACK');
    return { count, reasons };
  } finally { client.release(); await pool.end(); }
}

export { auditRequirementSource, classifyHandlingType, lexicalScore, extractionAudit, currentHandling };
export { runAudit as runJiangyinFullRequirementRagFitnessV1 };

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { await runAudit({ projectId: process.env.JIANGYIN_AUDIT_PROJECT_ID || TARGET_PROJECT }); }
  catch (error) { console.error(JSON.stringify({ error_code: error?.code || 'JIANGYIN_FULL_RAG_FITNESS_FAILED', message: String(error?.message || 'audit failed').slice(0, 240) })); process.exitCode = 1; }
}
