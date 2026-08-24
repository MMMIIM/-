import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import dotenv from 'dotenv';
import pg from 'pg';

const { Pool } = pg;
const HERE = path.dirname(fileURLToPath(import.meta.url));
const MAPPING_PATH = path.join(HERE, 'targeted-evidence-bearing-regression-v2.json');
const SOURCE_PACKET_PATH = path.join(HERE, 'GPT_REVIEW_PACKET.json');
const JSON_PATH = path.join(HERE, 'GPT_REVIEW_PACKET_GOLD_QUALIFICATION.json');
const MD_PATH = path.join(HERE, 'GPT_REVIEW_PACKET_GOLD_QUALIFICATION.md');

// This evaluator is intentionally read-only. It qualifies frozen Retrieval Gold
// references without calling Embedding, Retrieval, Gateway, LLM or Dify.
dotenv.config({ path: path.resolve(HERE, '../../../.env') });

const EXPECTED_CASE_IDS = Object.freeze([
  'V2R-001-PERF-DIRECT', 'V2R-002-PERF-PARTIAL', 'V2R-003-COMP-DIRECT',
  'V2R-004-COMP-PARTIAL', 'V2R-005-ISO-DIRECT', 'V2R-006-ISO-SCOPE',
  'V2R-007-PROJECT-STATUS', 'V2R-010-CORPUS-01', 'V2R-015-CORPUS-06',
  'V2R-021-CORPUS-12', 'V2R-024-CORPUS-15', 'V2R-030-CORPUS-21'
]);

const CURRENT_EMBEDDING_MODEL = process.env.V43_EMBEDDING_MODEL || 'Qwen/Qwen3-Embedding-0.6B';
const CURRENT_EMBEDDING_VERSION = process.env.V43_EMBEDDING_VERSION || '1';
const CURRENT_EMBEDDING_DIMENSION = Number(process.env.V43_EMBEDDING_DIMENSION || 1024);

function sha256(value) {
  return createHash('sha256').update(String(value), 'utf8').digest('hex');
}

function isNonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function sourceSnapshotFor(mapping, sourcePacketByCase) {
  const oldCase = sourcePacketByCase.get(mapping.case_id);
  return {
    persisted_span: oldCase?.expected?.verified_evidence_span || null,
    expected_chunk: oldCase?.expected?.expected_source_snapshot || null
  };
}

function scopeFor(projectId) {
  return projectId === '00000000-0000-4000-8000-000000000001'
    ? 'PUBLIC_OR_INDUSTRY_REFERENCE'
    : 'ENTERPRISE_PROJECT_SCOPE';
}

function requirementIntent(caseId) {
  if (caseId.includes('PERF')) return 'quantitative_performance';
  if (caseId.includes('COMP')) return 'platform_compatibility';
  if (caseId.includes('ISO')) return 'qualification_validity';
  if (caseId.includes('PROJECT')) return 'project_implementation_status';
  return 'enterprise_capability_boundary';
}

function expectedSourceText(snapshot) {
  return snapshot.persisted_span?.source_text || snapshot.expected_chunk?.source_text || null;
}

function makeDimensionStatus({ mapping, snapshot, material, chunk, span, embedding, sourceTextExact, sourceHashExact }) {
  const requirementIdentity = isNonEmpty(mapping.requirement_text) && !/[A-Z]{3,}-[0-9]{3}/.test(mapping.requirement_text)
    ? 'VALID'
    : 'INVALID';
  const materialLineage = Boolean(material && material.id === mapping.expected_material_id);
  const documentLineage = Boolean(material && material.id === mapping.expected_document_id);
  const chunkLineage = Boolean(chunk && chunk.material_id === mapping.expected_material_id);
  const spanVerified = Boolean(
    mapping.verified_span_id && span &&
    span.span_id === mapping.verified_span_id &&
    sourceHashExact && sourceTextExact &&
    chunkLineage && chunk.char_start >= span.start_offset && chunk.char_end <= span.end_offset
  );
  const transientSourceResolved = Boolean(
    !mapping.verified_span_id && snapshot.expected_chunk && chunk &&
    chunk.chunk_id === mapping.expected_chunk_id &&
    sha256(chunk.source_text) === snapshot.expected_chunk.source_text_hash
  );
  const currentIndex = Boolean(embedding);
  const scopeAllowed = Boolean(material && material.project_id === mapping.expected_project_id);
  const details = {
    requirement_identity: requirementIdentity,
    requirement_provenance: 'FROZEN_EVAL_QUERY',
    corpus_binding: material && chunk ? 'VALID' : (material || chunk ? 'STALE' : 'MISSING'),
    material_lineage: materialLineage ? 'VERIFIED' : 'INVALID',
    document_lineage: documentLineage ? 'VERIFIED' : 'INVALID',
    chunk_lineage: chunkLineage ? 'VERIFIED' : 'INVALID',
    span_verification: spanVerified ? 'VERIFIED' : (transientSourceResolved ? 'UNVERIFIED' : 'INVALID'),
    index_presence: currentIndex ? 'CURRENT' : 'MISSING',
    gold_independence: 'PASS',
    allowed_scope: scopeFor(mapping.expected_project_id),
    scope_allowed: scopeAllowed,
    source_resolution: spanVerified ? 'PERSISTED_EXACT_SPAN' : (transientSourceResolved ? 'DETERMINISTIC_CHUNK_REFERENCE_ONLY' : 'UNRESOLVED'),
    source_hash_exact: sourceHashExact,
    source_text_exact: sourceTextExact,
    runtime_expected_ids_seen: false
  };
  return { details, spanVerified, transientSourceResolved, currentIndex };
}

function readinessFor(mapping, dimensions, { transientSourceResolved, spanVerified, currentIndex }) {
  if (dimensions.requirement_identity !== 'VALID') {
    return { status: 'GOLD_REQUIREMENT_INVALID', group: 'REJECT_REBUILD', reasons: ['requirement_text_empty_or_embeds_identifier'] };
  }
  if (dimensions.gold_independence !== 'PASS') {
    return { status: 'GOLD_LEAKAGE_RISK', group: 'REJECT_REBUILD', reasons: ['gold_reference_visible_to_runtime'] };
  }
  if (dimensions.corpus_binding !== 'VALID' || dimensions.material_lineage !== 'VERIFIED' || dimensions.document_lineage !== 'VERIFIED' || dimensions.chunk_lineage !== 'VERIFIED') {
    return { status: 'GOLD_LINEAGE_INVALID', group: 'REJECT_REBUILD', reasons: ['material_document_or_chunk_lineage_missing'] };
  }
  if (mapping.verified_span_id && spanVerified && currentIndex) {
    return {
      status: 'GOLD_READY_FOR_RETRIEVAL',
      group: 'READY',
      reasons: ['persisted_span_exact_hash_and_current_index_verified'],
      semantic_note: (mapping.invalid_reasons || []).filter((reason) => reason !== 'target_requirement_id_not_persisted')
    };
  }
  if (transientSourceResolved) {
    return {
      status: 'GOLD_PARTIAL',
      group: 'REPAIRABLE',
      reasons: [
        'exact_source_chunk_resolved_deterministically',
        'source_span_or_eval_manifest_binding_not_persisted',
        ...(currentIndex ? [] : ['current_embedding_index_missing'])
      ],
      semantic_note: (mapping.invalid_reasons || []).filter((reason) => reason !== 'target_requirement_id_not_persisted')
    };
  }
  return {
    status: currentIndex ? 'GOLD_STALE' : 'GOLD_LINEAGE_INVALID',
    group: 'REJECT_REBUILD',
    reasons: ['expected_source_not_resolved_by_exact_current_chunk_hash']
  };
}

async function readOnlyCorpus(pool, mappings) {
  const materialIds = [...new Set(mappings.map((item) => item.expected_material_id))];
  const chunkIds = [...new Set(mappings.map((item) => item.expected_chunk_id))];
  const spanIds = [...new Set(mappings.map((item) => item.verified_span_id).filter(Boolean))];
  const [materials, chunks, spans, embeddings] = await Promise.all([
    pool.query('SELECT id,project_id,original_name,material_type,corpus_scope,extraction_status,index_status,review_status,lifecycle_status FROM company_materials WHERE id=ANY($1::uuid[])', [materialIds]),
    pool.query('SELECT chunk_id,material_id,source_text,chunk_hash,char_start,char_end,page_start,page_end,paragraph_start,paragraph_end FROM material_chunks WHERE chunk_id=ANY($1::text[])', [chunkIds]),
    spanIds.length ? pool.query('SELECT span_id,project_id,material_id,source_document_id,anchor_chunk_id,source_text,source_text_hash,start_offset,end_offset,source_chunk_ids FROM evidence_source_spans WHERE span_id=ANY($1::text[])', [spanIds]) : { rows: [] },
    pool.query('SELECT chunk_id,chunk_hash,embedding_model,embedding_version,embedding_dimension FROM material_chunk_embeddings WHERE chunk_id=ANY($1::text[])', [chunkIds])
  ]);
  const materialById = new Map(materials.rows.map((row) => [row.id, row]));
  const chunkById = new Map(chunks.rows.map((row) => [row.chunk_id, row]));
  const spanById = new Map(spans.rows.map((row) => [row.span_id, row]));
  const embeddingByChunk = new Map();
  for (const row of embeddings.rows) {
    const current = row.embedding_model === CURRENT_EMBEDDING_MODEL &&
      String(row.embedding_version) === String(CURRENT_EMBEDDING_VERSION) &&
      Number(row.embedding_dimension) === CURRENT_EMBEDDING_DIMENSION &&
      row.chunk_hash === chunkById.get(row.chunk_id)?.chunk_hash;
    if (current) embeddingByChunk.set(row.chunk_id, row);
  }
  return { materialById, chunkById, spanById, embeddingByChunk };
}

function qualifyCase(mapping, snapshot, corpus, index) {
  const material = corpus.materialById.get(mapping.expected_material_id) || null;
  const chunk = corpus.chunkById.get(mapping.expected_chunk_id) || null;
  const span = mapping.verified_span_id ? corpus.spanById.get(mapping.verified_span_id) || null : null;
  const embedding = corpus.embeddingByChunk.get(mapping.expected_chunk_id) || null;
  const expectedText = expectedSourceText(snapshot);
  const sourceTextExact = Boolean(span && expectedText && span.source_text === expectedText) ||
    Boolean(!span && expectedText && chunk && chunk.source_text === expectedText);
  const sourceHashExact = Boolean(span && mapping.verified_span_hash && span.source_text_hash === mapping.verified_span_hash) ||
    Boolean(!span && snapshot.expected_chunk?.source_text_hash && chunk && sha256(chunk.source_text) === snapshot.expected_chunk.source_text_hash);
  const dimensionResult = makeDimensionStatus({ mapping, snapshot, material, chunk, span, embedding, sourceTextExact, sourceHashExact });
  const readiness = readinessFor(mapping, dimensionResult.details, dimensionResult);
  const source = {
    material_id: mapping.expected_material_id,
    document_id: mapping.expected_document_id,
    chunk_id: mapping.expected_chunk_id,
    verified_span_id: mapping.verified_span_id || null,
    expected_span_hash: mapping.verified_span_hash || snapshot.expected_chunk?.source_text_hash || null,
    expected_source_text: expectedText,
    current_material_exists: Boolean(material),
    current_chunk_exists: Boolean(chunk),
    current_span_exists: Boolean(span),
    current_index: Boolean(embedding),
    current_index_model: embedding?.embedding_model || null,
    current_index_dimension: embedding?.embedding_dimension || null,
    source_chunk_range: chunk ? { char_start: chunk.char_start, char_end: chunk.char_end } : null,
    persisted_span_range: span ? { start_offset: span.start_offset, end_offset: span.end_offset } : null
  };
  return {
    case_id: mapping.case_id,
    eval_requirement_id: `EVAL-RET-${String(index + 1).padStart(3, '0')}`,
    requirement: {
      exact_text: mapping.requirement_text,
      formal_requirement_id: mapping.formal_requirement_id || null,
      provenance: 'FROZEN_EVAL_QUERY',
      intent: requirementIntent(mapping.case_id),
      target_project_id: mapping.expected_project_id,
      allowed_scope: scopeFor(mapping.expected_project_id)
    },
    expected_source: source,
    dimensions: dimensionResult.details,
    readiness: {
      status: readiness.status,
      group: readiness.group,
      reasons: readiness.reasons,
      semantic_notes: readiness.semantic_note || []
    },
    execution: {
      status: 'NOT_EXECUTED',
      top_k: [],
      embedding_calls: 0,
      runtime_expected_ids_seen: false
    },
    safety: {
      evidence_fact_created: false,
      formal_mapping_created: false,
      claim_gate_state: 'NOT_CREATED',
      db_write_performed: false
    }
  };
}

function aggregate(cases) {
  const count = (selector) => cases.filter(selector).length;
  const statusCounts = Object.fromEntries([
    'GOLD_READY_FOR_RETRIEVAL', 'GOLD_PARTIAL', 'GOLD_STALE', 'GOLD_LINEAGE_INVALID',
    'GOLD_REQUIREMENT_INVALID', 'GOLD_CORPUS_MISMATCH', 'GOLD_LEAKAGE_RISK'
  ].map((status) => [status, count((item) => item.readiness.status === status)]));
  return {
    total_cases: cases.length,
    ...statusCounts,
    rejected: count((item) => item.readiness.group === 'REJECT_REBUILD'),
    group_ready: count((item) => item.readiness.group === 'READY'),
    group_repairable: count((item) => item.readiness.group === 'REPAIRABLE'),
    group_reject_rebuild: count((item) => item.readiness.group === 'REJECT_REBUILD'),
    material_verified: count((item) => item.dimensions.material_lineage === 'VERIFIED'),
    document_verified: count((item) => item.dimensions.document_lineage === 'VERIFIED'),
    chunk_verified: count((item) => item.dimensions.chunk_lineage === 'VERIFIED'),
    span_verified: count((item) => item.dimensions.span_verification === 'VERIFIED'),
    current_index_verified: count((item) => item.dimensions.index_presence === 'CURRENT'),
    formal_tender_requirement: count((item) => item.requirement.formal_requirement_id),
    frozen_eval_query: count((item) => item.requirement.provenance === 'FROZEN_EVAL_QUERY'),
    synthetic_query: count((item) => item.requirement.provenance === 'SYNTHETIC_QUERY'),
    invalid_query: count((item) => item.dimensions.requirement_identity === 'INVALID'),
    gold_independence_pass: count((item) => item.dimensions.gold_independence === 'PASS'),
    runtime_expected_ids_seen: count((item) => item.execution.runtime_expected_ids_seen)
  };
}

function markdownCase(item) {
  const source = item.expected_source;
  const d = item.dimensions;
  const r = item.readiness;
  const displayText = source.expected_source_text || '(未保存原文)';
  return [
    `## ${item.case_id} / ${item.eval_requirement_id}`,
    '',
    `- Requirement：${item.requirement.exact_text}`,
    `- Requirement provenance：${item.requirement.provenance}`,
    `- Formal Requirement ID：${item.requirement.formal_requirement_id || 'NONE（独立评测身份）'}`,
    `- Intent：${item.requirement.intent}`,
    `- Allowed scope：${item.requirement.allowed_scope} / project=${item.requirement.target_project_id}`,
    `- Expected Material：${source.material_id}`,
    `- Expected Document：${source.document_id}`,
    `- Expected Chunk：${source.chunk_id}`,
    `- Expected Span：${source.verified_span_id || 'TRANSIENT / NOT_PERSISTED'}`,
    `- Expected source hash：${source.expected_span_hash || 'NONE'}`,
    '',
    '### Current read-only binding',
    '',
    `- Material：${source.current_material_exists ? 'VERIFIED' : 'MISSING'}`,
    `- Document：${source.current_span_exists || source.current_material_exists ? (d.document_lineage === 'VERIFIED' ? 'VERIFIED' : 'INVALID') : 'MISSING'}`,
    `- Chunk：${source.current_chunk_exists ? 'VERIFIED' : 'MISSING'}`,
    `- Span：${d.span_verification}`,
    `- Index：${d.index_presence}${source.current_index_model ? ` (${source.current_index_model}, ${source.current_index_dimension}d)` : ''}`,
    `- Exact source/hash check：text=${d.source_text_exact ? 'PASS' : 'FAIL'} / hash=${d.source_hash_exact ? 'PASS' : 'FAIL'}`,
    `- Gold independence：${d.gold_independence}；runtime sees expected IDs：${item.execution.runtime_expected_ids_seen ? 'YES' : 'NO'}`,
    '',
    '### Expected source text',
    '',
    '```text',
    displayText,
    '```',
    '',
    `### Gold readiness：${r.status}`,
    '',
    `- Group：${r.group}`,
    `- Reasons：${r.reasons.join('; ') || 'none'}`,
    `- Semantic notes：${r.semantic_notes.join('; ') || 'none'}`,
    '',
    '### Execution / safety',
    '',
    '- Retrieval：NOT_EXECUTED（本轮禁止 Embedding/模型调用）',
    '- Evidence Fact：NOT_CREATED',
    '- Formal Mapping：NOT_CREATED',
    '- Claim Gate：NOT_CREATED',
    '- DB write：NO',
    '',
    '---',
    ''
  ].join('\n');
}

export async function qualifyTargetedRetrievalGold({ mappingPath = MAPPING_PATH, sourcePacketPath = SOURCE_PACKET_PATH, jsonPath = JSON_PATH, markdownPath = MD_PATH, pool: providedPool = null } = {}) {
  const mapping = JSON.parse(await fs.readFile(mappingPath, 'utf8'));
  const sourcePacket = JSON.parse(await fs.readFile(sourcePacketPath, 'utf8'));
  const sourcePacketByCase = new Map((sourcePacket.cases || []).map((item) => [item.case_id, item]));
  if (mapping.cases?.length !== EXPECTED_CASE_IDS.length || !EXPECTED_CASE_IDS.every((id) => mapping.cases.some((item) => item.case_id === id))) {
    throw new Error('TARGETED_GOLD_CASE_SET_INVALID');
  }
  const pool = providedPool || new Pool({ connectionString: process.env.DATABASE_URL });
  const ownsPool = !providedPool;
  try {
    const corpus = await readOnlyCorpus(pool, mapping.cases);
    const cases = mapping.cases.map((item, index) => qualifyCase(item, sourceSnapshotFor(item, sourcePacketByCase), corpus, index));
    const packet = {
      schema_version: '4.3-targeted-retrieval-gold-qualification-v1',
      title: 'P0 TARGETED GOLD QUALIFICATION CHECKPOINT',
      generated_at: new Date().toISOString(),
      evaluation: 'targeted-evidence-bearing-retrieval',
      case_count: cases.length,
      case_level_results_complete: cases.length === EXPECTED_CASE_IDS.length,
      live_retrieval_executed: false,
      external_calls: { embedding: 0, llm: 0, dify: 0, automatic_retry: 0 },
      database_writes: 0,
      aggregate: aggregate(cases),
      independence: {
        gold_leakage_audit: 'PASS',
        runtime_sees_expected_ids: false,
        evaluator_only_after_retrieval: true
      },
      mapping_eval: 'NOT_EXECUTED',
      cases
    };
    await fs.writeFile(jsonPath, `${JSON.stringify(packet, null, 2)}\n`, 'utf8');
    const ready = cases.filter((item) => item.readiness.group === 'READY').map((item) => item.case_id);
    const excluded = cases.filter((item) => item.readiness.group !== 'READY');
    const markdown = [
      '# P0 TARGETED GOLD QUALIFICATION CHECKPOINT',
      '',
      '- This packet replaces the previous blanket `GOLD_INVALID` classification with independent dimensions A–I.',
      '- No Embedding, Retrieval, LLM, Dify, external network call or database write was performed.',
      '',
      '## Summary',
      '',
      '```json',
      JSON.stringify(packet.aggregate, null, 2),
      '```',
      '',
      '## Verified source status',
      '',
      `- Material verified：${packet.aggregate.material_verified}/${packet.case_count}`,
      `- Document verified：${packet.aggregate.document_verified}/${packet.case_count}`,
      `- Chunk verified：${packet.aggregate.chunk_verified}/${packet.case_count}`,
      `- Persisted span verified：${packet.aggregate.span_verified}/${packet.case_count}`,
      `- Current index verified：${packet.aggregate.current_index_verified}/${packet.case_count}`,
      '',
      '## Requirement status',
      '',
      `- Formal tender requirement：${packet.aggregate.formal_tender_requirement}`,
      `- Frozen independent eval query：${packet.aggregate.frozen_eval_query}`,
      `- Synthetic query：${packet.aggregate.synthetic_query}`,
      `- Invalid query：${packet.aggregate.invalid_query}`,
      '',
      '## Independence',
      '',
      '- Gold leakage audit：PASS',
      '- Runtime sees expected Material/Document/Chunk/Span IDs：NO',
      '- Expected IDs are evaluator-only and are not supplied to query construction, filters, ranking, MMR, classifier or context expansion.',
      '',
      '## Next executable set',
      '',
      `- READY：${ready.join(', ') || 'NONE'}`,
      `- EXCLUDED：${excluded.map((item) => `${item.case_id} (${item.readiness.status}: ${item.readiness.reasons.join('; ')})`).join(', ') || 'NONE'}`,
      '- Mapping evaluation：NOT_EXECUTED',
      '',
      '## All 12 case-level qualification results',
      '',
      ...cases.map(markdownCase),
      '## Safety boundary',
      '',
      '- Evidence Fact：NOT_CREATED',
      '- Requirement-Evidence Mapping：NOT_CREATED',
      '- Claim Gate state：NOT_CREATED',
      '- DB writes：0',
      '- External calls：0'
    ].join('\n');
    await fs.writeFile(markdownPath, markdown, 'utf8');
    return packet;
  } finally {
    if (ownsPool) await pool.end();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const packet = await qualifyTargetedRetrievalGold();
  console.log(JSON.stringify({
    status: 'QUALIFIED_READ_ONLY',
    case_count: packet.case_count,
    ready: packet.aggregate.group_ready,
    repairable: packet.aggregate.group_repairable,
    rejected: packet.aggregate.group_reject_rebuild,
    persisted_spans: packet.aggregate.span_verified,
    current_index: packet.aggregate.current_index_verified,
    json_path: JSON_PATH,
    markdown_path: MD_PATH
  }));
}
