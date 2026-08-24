import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';
import { classifyEvidenceBearing } from '../../../src/pipeline/evidence-bearing-classifier.js';
import { classifyRequiredEvidenceDimensions } from '../../../src/pipeline/evidence-context-expansion.js';
import { classifyRetrievalChunkRole } from '../../../src/pipeline/retrieval-chunk-role.js';

const { Pool } = pg;
const HERE = path.dirname(fileURLToPath(import.meta.url));
const MAPPING_PATH = path.join(HERE, 'targeted-evidence-bearing-regression-v2.json');
const LIVE_PACKET_PATH = path.join(HERE, 'GPT_REVIEW_PACKET_LIVE_RETRIEVAL_7.json');
const JSON_PATH = path.join(HERE, 'GPT_REVIEW_PACKET_RETRIEVAL_EVAL_INTEGRITY.json');
const MD_PATH = path.join(HERE, 'GPT_REVIEW_PACKET_RETRIEVAL_EVAL_INTEGRITY.md');
const CASE_IDS = Object.freeze([
  'V2R-001-PERF-DIRECT', 'V2R-002-PERF-PARTIAL', 'V2R-003-COMP-DIRECT',
  'V2R-004-COMP-PARTIAL', 'V2R-005-ISO-DIRECT', 'V2R-006-ISO-SCOPE',
  'V2R-007-PROJECT-STATUS'
]);

dotenv.config({ path: path.resolve(HERE, '../../../.env') });

const sha256 = value => createHash('sha256').update(String(value), 'utf8').digest('hex');
const text = value => String(value ?? '');

// These are review expectations, not HUMAN_GOLD and never feed runtime ranking.
// They make the 35-candidate audit independent from the runtime classifier.
const EXPECTED_CLASSIFICATIONS = Object.freeze({
  'V2R-001-PERF-DIRECT': ['METADATA_OR_HEADER', 'TOPIC_RELEVANT_ONLY', 'METADATA_OR_HEADER', 'EVIDENCE_BEARING', 'TOPIC_RELEVANT_ONLY'],
  'V2R-002-PERF-PARTIAL': ['EVIDENCE_BEARING', 'METADATA_OR_HEADER', 'TOPIC_RELEVANT_ONLY', 'IRRELEVANT', 'IRRELEVANT'],
  'V2R-003-COMP-DIRECT': ['EVIDENCE_BEARING', 'METADATA_OR_HEADER', 'TOPIC_RELEVANT_ONLY', 'TOPIC_RELEVANT_ONLY', 'IRRELEVANT'],
  'V2R-004-COMP-PARTIAL': ['EVIDENCE_BEARING', 'METADATA_OR_HEADER', 'IRRELEVANT', 'METADATA_OR_HEADER', 'TOPIC_RELEVANT_ONLY'],
  'V2R-005-ISO-DIRECT': ['EVIDENCE_BEARING', 'EVIDENCE_BEARING', 'METADATA_OR_HEADER', 'METADATA_OR_HEADER', 'TOPIC_RELEVANT_ONLY'],
  'V2R-006-ISO-SCOPE': ['EVIDENCE_BEARING', 'METADATA_OR_HEADER', 'EVIDENCE_BEARING', 'METADATA_OR_HEADER', 'TOPIC_RELEVANT_ONLY'],
  'V2R-007-PROJECT-STATUS': ['METADATA_OR_HEADER', 'METADATA_OR_HEADER', 'METADATA_OR_HEADER', 'EVIDENCE_BEARING', 'METADATA_OR_HEADER']
});

const EXPECTED_REASONS = Object.freeze({
  'V2R-001-PERF-DIRECT': ['title-only metadata', 'capability description lacks a test record or metric', 'title-only metadata', 'performance test record carries quantitative facts', 'generic validation statement'],
  'V2R-002-PERF-PARTIAL': ['adverse P95 measurement', 'title-only metadata', 'support-hours topic without requested threshold', 'unrelated technical instruction', 'generic product principle'],
  'V2R-003-COMP-DIRECT': ['tested requested environments', 'title-only metadata', 'open-source policy lacks requested environments', 'generic company capability', 'workflow status text'],
  'V2R-004-COMP-PARTIAL': ['matrix records partial/not-verified status for requested scope', 'title-only metadata', 'unrelated commit note', 'title-only metadata', 'performance record is not database-scope evidence'],
  'V2R-005-ISO-DIRECT': ['controlled record states current ISO 27001 validity', 'exact ISO 27001 fields and validity', 'title-only metadata', 'wrong certificate title-only metadata', 'ISO 9001 is the wrong certificate type'],
  'V2R-006-ISO-SCOPE': ['enterprise certificate facts are boundary evidence; project-subject scope is unresolved', 'title-only metadata', 'ISO 27001 facts are boundary evidence; project-subject scope is unresolved', 'wrong certificate title-only metadata', 'ISO 9001 is the wrong certificate type'],
  'V2R-007-PROJECT-STATUS': ['title-only metadata', 'title-only metadata', 'title-only metadata', 'equivalent completed-and-accepted project candidate', 'title-only metadata']
});

const GOLD_ROLES = Object.freeze({
  'V2R-001-PERF-DIRECT': 'SUPPORTING',
  'V2R-002-PERF-PARTIAL': 'ADVERSE',
  'V2R-003-COMP-DIRECT': 'SUPPORTING',
  'V2R-004-COMP-PARTIAL': 'ADVERSE',
  'V2R-005-ISO-DIRECT': 'SUPPORTING',
  'V2R-006-ISO-SCOPE': 'BOUNDARY',
  'V2R-007-PROJECT-STATUS': 'BOUNDARY'
});

function sqlArray(values) {
  return values.map(value => `'${String(value).replaceAll("'", "''")}'`).join(',');
}

async function readCorpus(pool, mappings) {
  const chunkIds = [...new Set(mappings.flatMap(item => [item.expected_chunk_id]))];
  const spanIds = [...new Set(mappings.map(item => item.verified_span_id).filter(Boolean))];
  const materials = await pool.query(`SELECT id, project_id FROM company_materials WHERE id=ANY(ARRAY[${sqlArray(mappings.map(item => item.expected_material_id))}]::uuid[])`);
  const chunks = await pool.query(`SELECT chunk_id, material_id, source_text, chunk_hash, char_start, char_end FROM material_chunks WHERE chunk_id=ANY(ARRAY[${sqlArray(chunkIds)}]::text[])`);
  const spans = await pool.query(`SELECT span_id, material_id, source_document_id, anchor_chunk_id, source_text, source_text_hash, start_offset, end_offset, source_chunk_ids FROM evidence_source_spans WHERE span_id=ANY(ARRAY[${sqlArray(spanIds)}]::text[])`);
  const allSpanChunkIds = [...new Set(spans.rows.flatMap(row => Array.isArray(row.source_chunk_ids) ? row.source_chunk_ids : []))];
  const additionalIds = allSpanChunkIds.filter(id => !chunkIds.includes(id));
  const additional = additionalIds.length
    ? await pool.query(`SELECT chunk_id, material_id, source_text, chunk_hash, char_start, char_end FROM material_chunks WHERE chunk_id=ANY(ARRAY[${sqlArray(additionalIds)}]::text[])`)
    : { rows: [] };
  return {
    materials: new Map(materials.rows.map(row => [row.id, row])),
    chunks: new Map([...chunks.rows, ...additional.rows].map(row => [row.chunk_id, row])),
    spans: new Map(spans.rows.map(row => [row.span_id, row]))
  };
}

function auditGoldBinding(mapping, corpus) {
  const expectedChunk = corpus.chunks.get(mapping.expected_chunk_id) || null;
  const span = mapping.verified_span_id ? corpus.spans.get(mapping.verified_span_id) || null : null;
  const expectedMaterial = corpus.materials.get(mapping.expected_material_id) || null;
  const spanChunkIds = Array.isArray(span?.source_chunk_ids) ? span.source_chunk_ids : [];
  const containingChunks = span
    ? spanChunkIds.filter(chunkId => text(corpus.chunks.get(chunkId)?.source_text).includes(text(span.source_text)))
    : [];
  const chunksContainedBySpan = span
    ? spanChunkIds.filter(chunkId => text(span.source_text).includes(text(corpus.chunks.get(chunkId)?.source_text)))
    : [];
  const repairedChunkId = chunksContainedBySpan
    .sort((left, right) => text(corpus.chunks.get(right)?.source_text).length - text(corpus.chunks.get(left)?.source_text).length)[0] || null;
  const repairedChunk = repairedChunkId ? corpus.chunks.get(repairedChunkId) : null;
  const sourceChunks = spanChunkIds.map((chunkId) => corpus.chunks.get(chunkId)).filter(Boolean);
  const checks = {
    expected_material_exists: Boolean(expectedMaterial),
    expected_chunk_exists: Boolean(expectedChunk),
    span_exists: Boolean(span),
    span_source_exact_in_expected_chunk: Boolean(span && expectedChunk && expectedChunk.source_text.includes(span.source_text)),
    span_chunk_identity: Boolean(span && span.anchor_chunk_id === mapping.expected_chunk_id),
    span_material_identity: Boolean(span && span.material_id === mapping.expected_material_id),
    span_document_identity: Boolean(span && span.source_document_id === mapping.expected_document_id),
    span_hash_exact: Boolean(span && mapping.verified_span_hash && span.source_text_hash === mapping.verified_span_hash && span.source_text_hash === sha256(span.source_text)),
    span_offsets_present: Boolean(span && Number.isInteger(Number(span.start_offset)) && Number.isInteger(Number(span.end_offset)) && Number(span.end_offset) >= Number(span.start_offset)),
    span_source_chunks_exist: sourceChunks.length === spanChunkIds.length,
    span_source_chunks_same_material: sourceChunks.length === spanChunkIds.length && sourceChunks.every((chunk) => chunk.material_id === mapping.expected_material_id)
  };
  const persistedSpanValid = [
    checks.expected_material_exists,
    checks.span_exists,
    checks.span_material_identity,
    checks.span_document_identity,
    checks.span_hash_exact,
    checks.span_offsets_present,
    checks.span_source_chunks_exist,
    checks.span_source_chunks_same_material
  ].every(Boolean);
  const retrievalGoldBindingValid = persistedSpanValid
    && checks.expected_chunk_exists
    && checks.span_source_exact_in_expected_chunk
    && checks.span_chunk_identity;
  const alternate = containingChunks
    .filter(chunkId => chunkId !== mapping.expected_chunk_id)
    .map(chunkId => ({ chunk_id: chunkId, source_text: corpus.chunks.get(chunkId)?.source_text || null }));
  return {
    case_id: mapping.case_id,
    gold_role: GOLD_ROLES[mapping.case_id] || 'REFERENCE',
    classification: retrievalGoldBindingValid ? 'RETRIEVAL_GOLD_BINDING_VALID' : 'RETRIEVAL_GOLD_BINDING_REQUIRES_DERIVATION',
    persisted_span_validity: persistedSpanValid ? 'VALID_MULTI_CHUNK_EVIDENCE_SPAN' : 'PERSISTED_EVIDENCE_SPAN_INVALID',
    checks,
    expected: {
      material_id: mapping.expected_material_id,
      document_id: mapping.expected_document_id,
      chunk_id: mapping.expected_chunk_id,
      chunk_raw_text: expectedChunk?.source_text || null,
      span_id: mapping.verified_span_id || null,
      span_raw_text: span?.source_text || null,
      span_hash: span?.source_text_hash || null,
      span_start_offset: span?.start_offset ?? null,
      span_end_offset: span?.end_offset ?? null,
      span_anchor_chunk_id: span?.anchor_chunk_id || null,
      span_source_chunk_ids: spanChunkIds
    },
    derived_gold_evidence_set: sourceChunks.map((chunk) => {
      const role = classifyRetrievalChunkRole(chunk).role;
      return {
        chunk_id: chunk.chunk_id,
        chunk_role: role,
        retrieval_gold_role: ['BUSINESS_CONTENT', 'TABLE_ROW'].includes(role) ? GOLD_ROLES[mapping.case_id] : 'CONTEXT_HEADING_CHUNK',
        counts_as_decision_bearing_gold: ['BUSINESS_CONTENT', 'TABLE_ROW'].includes(role),
        source_hash: chunk.chunk_hash
      };
    }),
    alternate_business_bearing_chunks: alternate,
    repaired_binding: repairedChunk ? {
      status: span && repairedChunk.material_id === mapping.expected_material_id && text(span.source_text).includes(text(repairedChunk.source_text)) ? 'RETRIEVAL_GOLD_DERIVED' : 'RETRIEVAL_GOLD_DERIVATION_FAILED',
      material_id: mapping.expected_material_id,
      document_id: mapping.expected_document_id,
      chunk_id: repairedChunk.chunk_id,
      repaired_span_id: `REPAIRED_EVAL_SPAN_${repairedChunk.chunk_id}`,
      source_text: repairedChunk.source_text,
      source_hash: sha256(repairedChunk.source_text),
      source_match_type: 'EXACT_SUBSTRING_OF_PERSISTED_MULTI_CHUNK_SPAN',
      source_resolution_method: 'OFFLINE_GOLD_LINEAGE_REPAIR',
      note: 'Evaluation-only deterministic business-bearing chunk derived from a valid multi-chunk Evidence Span; not persisted as Evidence Source Span and not HUMAN_GOLD.'
    } : null,
    root_cause: mapping.case_id === 'V2R-005-ISO-DIRECT' || mapping.case_id === 'V2R-006-ISO-SCOPE'
      ? 'Gold span was stored over a multi-chunk source, but the expected chunk points to a title-only anchor; the business-bearing chunk is separate.'
      : null,
    repair_action: repairedChunk
      ? 'REBIND_TO_REPAIRED_EXACT_CHUNK_SLICE_AFTER_INDEPENDENT_LINEAGE_CHECK'
      : 'NONE'
  };
}

function classifyCandidates(livePacket) {
  return livePacket.cases.flatMap(item => item.actual_top5.map(candidate => {
    const corrected = classifyEvidenceBearing({
      requirement: { text: item.requirement_exact_text },
      sourceText: candidate.raw_original_text,
      candidate: {}
    });
    const expectedIndex = Math.max(0, Number(candidate.rank) - 1);
    const expectedClassification = EXPECTED_CLASSIFICATIONS[item.case_id]?.[expectedIndex] || 'IRRELEVANT';
    return {
      case_id: item.case_id,
      rank: candidate.rank,
      requirement: item.requirement_exact_text,
      chunk_id: candidate.chunk_id,
      material_id: candidate.material_id,
      document_id: candidate.document_id,
      raw_chunk_text: candidate.raw_original_text,
      required_factual_dimensions: corrected.required_dimensions,
      runtime_previous_classification: candidate.runtime_heuristic_classification,
      corrected_runtime_classification: corrected.classification,
      corrected_supported_dimensions: corrected.supported_dimensions,
      corrected_reason_codes: corrected.reason_codes,
      GPT_REVIEW_EXPECTED_CLASSIFICATION: expectedClassification,
      GPT_REVIEW_EXPECTED_REASON: EXPECTED_REASONS[item.case_id]?.[expectedIndex] || 'case-level review expectation',
      review_status: 'GPT_REVIEWED_REGRESSION_EXPECTATION',
      human_gold: false,
      equivalent_supporting_evidence_candidate: item.case_id === 'V2R-007-PROJECT-STATUS' && candidate.chunk_id === 'MCH-268A148B9BD7EA6BF0B470DDE0EA8425' ? true : false,
      expected_classification_matches_runtime: corrected.classification === expectedClassification
    };
  }));
}

function auditSummary(candidateAudit, goldAudits) {
  const previousEvidenceBearing = candidateAudit.filter(item => item.runtime_previous_classification === 'EVIDENCE_BEARING').length;
  const correctedEvidenceBearing = candidateAudit.filter(item => item.corrected_runtime_classification === 'EVIDENCE_BEARING').length;
  const falsePositives = candidateAudit.filter(item => item.runtime_previous_classification === 'EVIDENCE_BEARING' && item.GPT_REVIEW_EXPECTED_CLASSIFICATION !== 'EVIDENCE_BEARING').length;
  const falseNegatives = candidateAudit.filter(item => item.runtime_previous_classification !== 'EVIDENCE_BEARING' && item.GPT_REVIEW_EXPECTED_CLASSIFICATION === 'EVIDENCE_BEARING').length;
  const persistedValidBindings = goldAudits.filter(item => item.classification === 'RETRIEVAL_GOLD_BINDING_VALID').length;
  const persistedSpanValid = goldAudits.filter(item => item.persisted_span_validity === 'VALID_MULTI_CHUNK_EVIDENCE_SPAN').length;
  const repairedValidBindings = goldAudits.filter(item => item.repaired_binding?.status === 'RETRIEVAL_GOLD_DERIVED').length;
  return {
    candidate_count: candidateAudit.length,
    previous_evidence_bearing_count: previousEvidenceBearing,
    corrected_evidence_bearing_count: correctedEvidenceBearing,
    false_positive_count: falsePositives,
    false_negative_count: falseNegatives,
    persisted_valid_bindings: persistedValidBindings,
    persisted_invalid_bindings: goldAudits.length - persistedValidBindings,
    persisted_evidence_spans_valid: persistedSpanValid,
    retrieval_gold_bindings_require_derivation: goldAudits.filter(item => item.classification === 'RETRIEVAL_GOLD_BINDING_REQUIRES_DERIVATION').length,
    repaired_eval_bindings_valid: repairedValidBindings,
    repaired_eval_bindings_human_gold: false
  };
}

function metadataStats(candidates) {
  const byRank = rank => candidates.filter(item => Number(item.rank) <= rank && item.corrected_runtime_classification === 'METADATA_OR_HEADER').length;
  const cases = [...new Set(candidates.map(item => item.case_id))];
  const caseRate = rank => cases.filter(caseId => candidates.some(item => item.case_id === caseId && Number(item.rank) <= rank && item.corrected_runtime_classification === 'METADATA_OR_HEADER')).length / cases.length;
  return {
    metadata_total: candidates.filter(item => item.corrected_runtime_classification === 'METADATA_OR_HEADER').length,
    metadata_at_1: { candidate_count: candidates.filter(item => Number(item.rank) === 1 && item.corrected_runtime_classification === 'METADATA_OR_HEADER').length, case_rate: caseRate(1) },
    metadata_at_3: { candidate_count: byRank(3), case_rate: caseRate(3) },
    metadata_at_5: { candidate_count: byRank(5), share: byRank(5) / candidates.length, case_rate: caseRate(5) }
  };
}

function offlineMetrics(livePacket, candidateAudit, goldAudits) {
  const decisionCases = ['V2R-001-PERF-DIRECT', 'V2R-002-PERF-PARTIAL', 'V2R-003-COMP-DIRECT', 'V2R-004-COMP-PARTIAL', 'V2R-005-ISO-DIRECT', 'V2R-006-ISO-SCOPE'];
  const candidatesByCase = new Map(decisionCases.map(caseId => [caseId, candidateAudit.filter(item => item.case_id === caseId)]));
  const goldByCase = new Map(goldAudits.map(item => [item.case_id, item]));
  const caseMetrics = decisionCases.map(caseId => {
    const gold = goldByCase.get(caseId);
    const candidates = candidatesByCase.get(caseId) || [];
    const expectedChunk = gold?.repaired_binding?.status === 'RETRIEVAL_GOLD_DERIVED'
      ? gold.repaired_binding.chunk_id
      : gold?.expected.chunk_id;
    const rank = candidates.find(item => item.chunk_id === expectedChunk)?.rank ?? null;
    const usefulRank = candidates.find(item => item.GPT_REVIEW_EXPECTED_CLASSIFICATION === 'EVIDENCE_BEARING')?.rank ?? null;
    return { case_id: caseId, expected_chunk_id: expectedChunk, expected_rank: rank, useful_evidence_first_rank: usefulRank, hit_at_1: rank === 1, hit_at_3: Number.isInteger(rank) && rank <= 3, hit_at_5: Number.isInteger(rank) && rank <= 5, mrr: rank ? 1 / rank : 0 };
  });
  const ratio = key => caseMetrics.filter(item => item[key]).length / caseMetrics.length;
  const average = key => caseMetrics.reduce((sum, item) => sum + item[key], 0) / caseMetrics.length;
  return {
    denominator: caseMetrics.length,
    decision_bearing_hit_at_1: ratio('hit_at_1'),
    decision_bearing_hit_at_3: ratio('hit_at_3'),
    decision_bearing_hit_at_5: ratio('hit_at_5'),
    gold_expected_rank_mrr: average('mrr'),
    useful_evidence_first_rank_distribution: Object.fromEntries([...new Set(caseMetrics.map(item => item.useful_evidence_first_rank))].sort((a, b) => (a ?? 99) - (b ?? 99)).map(rank => [String(rank ?? 'NOT_FOUND'), caseMetrics.filter(item => item.useful_evidence_first_rank === rank).length])),
    cases_hit_at_5_but_useful_evidence_rank_ge_4: caseMetrics.filter(item => item.hit_at_5 && Number(item.useful_evidence_first_rank) >= 4).map(item => item.case_id),
    case_metrics: caseMetrics,
    excluded_from_decision_metrics: ['V2R-007-PROJECT-STATUS (GOLD_DESIGN_AMBIGUOUS; equivalent candidate needs review)']
  };
}

function markdown(packet) {
  const lines = [
    '# GPT REVIEW PACKET — RETRIEVAL EVAL INTEGRITY',
    '',
    '- External calls: 0',
    '- This is an offline integrity and classifier audit; it is not HUMAN_GOLD.',
    '- `GPT_REVIEW_EXPECTED_CLASSIFICATION` is a separate review expectation and never feeds runtime ranking.',
    '',
    '## Gold binding audit',
    '',
    '```json', JSON.stringify(packet.gold_binding_audit, null, 2), '```',
    '',
    '## Root causes / redesign',
    '',
    `- V2R-005：${packet.root_causes.V2R_005}`, 
    `- V2R-006：${packet.root_causes.V2R_006}`,
    `- V2R-007：${packet.root_causes.V2R_007}`,
    '',
    '## 35-candidate reclassification',
    '',
    '```json', JSON.stringify(packet.candidate_reclassification, null, 2), '```',
    '',
    '## Metadata pollution',
    '',
    '```json', JSON.stringify(packet.metadata_pollution, null, 2), '```',
    '',
    '## Offline metrics',
    '',
    '```json', JSON.stringify(packet.offline_metrics, null, 2), '```',
    '',
    '## Safety / stage',
    '',
    '- Evidence Fact：NOT_CREATED',
    '- Formal Mapping：NOT_CREATED',
    '- Claim Gate：NOT_EXECUTED',
    '- Writer：NOT_EXECUTED',
    '- Stage17：PENDING_EVAL_INTEGRITY_REVIEW',
    '- GPT review status：GPT_REVIEWED_REGRESSION_EXPECTATION',
    '- Human Gold：NO'
  ];
  return lines.join('\n');
}

export async function auditRetrievalEvalIntegrity({ mappingPath = MAPPING_PATH, livePacketPath = LIVE_PACKET_PATH, jsonPath = JSON_PATH, markdownPath = MD_PATH, pool: providedPool = null } = {}) {
  const mapping = JSON.parse(await fs.readFile(mappingPath, 'utf8'));
  const livePacket = JSON.parse(await fs.readFile(livePacketPath, 'utf8'));
  const selected = mapping.cases.filter(item => CASE_IDS.includes(item.case_id));
  if (selected.length !== CASE_IDS.length || livePacket.cases.length !== CASE_IDS.length) throw new Error('INTEGRITY_CASE_SET_INVALID');
  const pool = providedPool || new Pool({ connectionString: process.env.DATABASE_URL });
  const ownsPool = !providedPool;
  try {
    const corpus = await readCorpus(pool, selected);
    const goldAudits = selected.map(item => auditGoldBinding(item, corpus));
    const candidateAudit = classifyCandidates(livePacket);
    const packet = {
      schema_version: '4.3-retrieval-eval-integrity-v1',
      title: 'P0 RETRIEVAL EVAL INTEGRITY CHECKPOINT',
      generated_at: new Date().toISOString(),
      external_calls: { embedding: 0, llm: 0, dify: 0, automatic_retry: 0 },
      database_writes: 0,
      gold_binding_audit: goldAudits,
      audit_summary: auditSummary(candidateAudit, goldAudits),
      root_causes: {
        V2R_005: 'The persisted span contains the business-bearing ISO 27001 fields, but the expected Gold chunk is a title-only anchor. The previous qualification checked span hash/source text and source_chunk_ids but did not enforce expected_chunk_id === span anchor/source chunk identity.',
        V2R_006: 'The same title-only anchor mismatch exists; after rebind, the ISO 27001 facts remain a boundary candidate because the required project-subject scope is absent.',
        V2R_007: 'The only previous expected source explicitly says status is incomplete, so it cannot be the sole positive Gold. MCH-268A148B9BD7EA6BF0B470DDE0EA8425 is an equivalent supporting candidate requiring human/GPT verification, not automatic Gold promotion.'
      },
      candidate_reclassification: candidateAudit,
      metadata_pollution: metadataStats(candidateAudit),
      offline_metrics: offlineMetrics(livePacket, candidateAudit, goldAudits),
      stage17_decision: 'PENDING_EVAL_INTEGRITY_REVIEW',
      gpt_review_status: 'GPT_REVIEWED_REGRESSION_EXPECTATION',
      human_gold_modified: false,
      evidence_fact_created: false,
      formal_mapping_created: false,
      claim_gate_executed: false,
      writer_executed: false
    };
    await fs.writeFile(jsonPath, `${JSON.stringify(packet, null, 2)}\n`, 'utf8');
    await fs.writeFile(markdownPath, `${markdown(packet)}\n`, 'utf8');
    return packet;
  } finally {
    if (ownsPool) await pool.end();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const packet = await auditRetrievalEvalIntegrity();
  console.log(JSON.stringify({ status: 'AUDITED_OFFLINE', ...packet.audit_summary, metadata: packet.metadata_pollution, offline_metrics: packet.offline_metrics, json_path: JSON_PATH, markdown_path: MD_PATH }));
}
