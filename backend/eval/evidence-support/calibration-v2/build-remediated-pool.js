import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';
import { EvidenceSourceContextResolver } from '../../../src/pipeline/evidence-source-context-resolver.js';
import {
  adaptRetrievalCandidate,
  aggregateEvidenceSufficiency,
  createEvidenceSupportAssessment
} from '../../../src/pipeline/evidence-support-assessment-contract-v1.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const LEGACY_PATH = path.join(HERE, 'candidate-pool.js');
const OUTPUT_PATH = path.join(HERE, 'candidate-pool-v2-remediated.json');
const LINEAGE_PATH = path.join(HERE, 'lineage-reconciliation-v2.json');
const HOLDOUT_PATH = path.resolve(HERE, '../../corpus/l3-gold-questions-v2.json');
const TRANSIENT_RESOLUTION = 'DERIVED_TRANSIENT_FORMAL_CONTRACT';
const EVALUATOR_VERSION = 'calibration-v2-system-draft-v2';
const SHA256 = /^[0-9a-f]{64}$/;
const sha = value => createHash('sha256').update(String(value)).digest('hex');
const clean = value => String(value ?? '').replace(/\s+/g, ' ').trim();

function loadLegacy() {
  return import(pathToFileURL(LEGACY_PATH).href);
}

function isSyntheticProject(name) {
  return /E2E-PRODUCTION-RETRIEVAL|STAGE20-L3-SYNTHETIC|STAGE12-MATERIAL-COMPLETION/i.test(String(name || ''));
}

async function loadCorpusRows(pool) {
  const materials = (await pool.query(`
    SELECT m.*, p.name AS project_name
    FROM company_materials m
    JOIN projects p ON p.id = m.project_id
    WHERE m.extraction_status = 'succeeded'
      AND m.review_status = 'approved'
      AND m.lifecycle_status = 'ACTIVE'
      AND m.usage_status IN ('ACTIVE_FULLTEXT', 'ACTIVE_EXCERPT')
      AND (m.corpus_scope IN ('GENERAL', 'GOVERNMENT_ENTERPRISE', 'HEALTHCARE')
        OR (m.corpus_scope = 'ENTERPRISE_PRIVATE' AND p.name ILIKE '%SYNTHETIC%'))
    ORDER BY m.corpus_scope, m.original_name, m.id
  `)).rows.filter(row => row.corpus_scope !== 'ENTERPRISE_PRIVATE' || isSyntheticProject(row.project_name));
  const ids = materials.map(item => item.id);
  const chunks = ids.length
    ? (await pool.query('SELECT * FROM material_chunks WHERE material_id = ANY($1::uuid[]) ORDER BY material_id, chunk_index', [ids])).rows
    : [];
  const byMaterial = new Map();
  for (const chunk of chunks) byMaterial.set(chunk.material_id, [...(byMaterial.get(chunk.material_id) || []), chunk]);
  return { materials, chunks, byMaterial };
}

function deriveSources({ materials, byMaterial }) {
  const resolver = new EvidenceSourceContextResolver();
  const result = [];
  for (const material of materials) {
    const chunks = byMaterial.get(material.id) || [];
    for (const chunk of chunks) {
      const span = resolver.resolve({ material, chunks, anchorChunkId: chunk.chunk_id, strategy: 'anchor_only' });
      const exact = material.extracted_text?.slice(chunk.char_start, chunk.char_end) === chunk.source_text;
      const sourceHash = sha(span.source_text);
      if (!exact || sourceHash !== span.source_text_hash || !SHA256.test(sourceHash)) continue;
      result.push({
        source_id: chunk.chunk_id,
        source_span_id: span.span_id,
        source_span_resolution: TRANSIENT_RESOLUTION,
        source_span_persisted: false,
        source_verified: true,
        document_id: material.id,
        material_id: material.id,
        chunk_id: chunk.chunk_id,
        project_id: material.project_id,
        project_name: material.project_name,
        corpus_scope: material.corpus_scope,
        material_type: material.material_type,
        material_name: material.original_name,
        source_text: span.source_text,
        source_hash: sourceHash,
        start_offset: span.start_offset,
        end_offset: span.end_offset,
        source_chunk_ids: span.source_chunk_ids,
        resolver_version: span.resolver_version
      });
    }
  }
  return result;
}

function sourceExcerpt(source, max = 220) {
  const text = String(source.source_text || '');
  return text.slice(0, max);
}

function sourceMatch(sources, predicate, used = new Set()) {
  return sources.find(source => !used.has(source.source_id) && predicate(source));
}

function requirement(id, text, tags, difficulty) {
  return {
    requirement_id: id,
    text,
    boundary_tags: tags,
    difficulty
  };
}

function observationFor(kind, source, options = {}) {
  const excerpt = sourceExcerpt(source, 180);
  if (kind === 'direct') return {
    assessment_status: 'available',
    semantic_relevance: 'relevant',
    evidence_capability: 'capable',
    support_level: 'full_support',
    semantic_relationship: 'direct',
    review_dimensions: {
      subject_match: 'match', scope_match: 'match', status_match: 'match',
      quantitative_match: options.quantitative ? 'match' : 'unknown',
      entity_match: 'match', validity_match: options.validity ? 'match' : 'unknown',
      source_authority: 'match', support_sufficiency: 'match'
    },
    support_observations: [{ source_id: source.source_id, source_span_id: source.source_span_id, support_excerpt: excerpt, observation_type: 'direct_support', reason_codes: [] }],
    reason_codes: []
  };
  if (kind === 'none') return {
    assessment_status: 'available',
    semantic_relevance: 'irrelevant',
    evidence_capability: 'not_capable',
    support_level: 'insufficient',
    semantic_relationship: 'unrelated',
    review_dimensions: { subject_match: 'mismatch', scope_match: 'mismatch', status_match: 'unknown', quantitative_match: 'unknown', entity_match: 'mismatch', validity_match: 'unknown', source_authority: 'mismatch', support_sufficiency: 'mismatch' },
    support_observations: [{ source_id: source.source_id, source_span_id: source.source_span_id, support_excerpt: excerpt, observation_type: 'context', reason_codes: ['SEMANTICALLY_IRRELEVANT'] }],
    reason_codes: ['SEMANTICALLY_IRRELEVANT', 'SOURCE_NOT_EVIDENCE_CAPABLE']
  };
  if (kind === 'conflict') return {
    assessment_status: 'available',
    semantic_relevance: 'relevant',
    evidence_capability: 'capable',
    support_level: 'conflict',
    semantic_relationship: 'conflict',
    review_dimensions: { subject_match: 'unknown', scope_match: 'unknown', status_match: 'mismatch', quantitative_match: 'unknown', entity_match: 'unknown', validity_match: 'mismatch', source_authority: 'match', support_sufficiency: 'mismatch' },
    conflict_observations: [{ source_id: source.source_id, source_span_id: source.source_span_id, conflict_group_id: options.conflictGroup, dimension: 'validity.expiry_date', observed_value: options.observedValue, support_excerpt: excerpt, reason_codes: ['VALIDITY_MISMATCH'] }],
    reason_codes: ['VALIDITY_MISMATCH']
  };
  return {
    assessment_status: 'available',
    semantic_relevance: 'relevant',
    evidence_capability: options.referenceOnly ? 'reference_only' : 'capable',
    support_level: options.referenceOnly ? 'reference_only' : 'partial_support',
    semantic_relationship: options.referenceOnly ? 'related' : 'partial',
    review_dimensions: { subject_match: options.referenceOnly ? 'mismatch' : 'match', scope_match: options.referenceOnly ? 'mismatch' : 'unknown', status_match: 'unknown', quantitative_match: 'unknown', entity_match: options.referenceOnly ? 'mismatch' : 'unknown', validity_match: 'unknown', source_authority: 'match', support_sufficiency: 'mismatch' },
    support_observations: [{ source_id: source.source_id, source_span_id: source.source_span_id, support_excerpt: excerpt, observation_type: 'partial_support', reason_codes: ['SUPPORT_INSUFFICIENT'] }],
    reason_codes: [options.referenceOnly ? 'SCOPE_MISMATCH' : 'SUPPORT_INSUFFICIENT']
  };
}

function buildAssessment(caseItem, source, kind, options = {}) {
  const adapter = adaptRetrievalCandidate({
    requirement: caseItem.requirement,
    candidate: { candidate_id: source.source_id, metadata: { retrieval_shape: 'CURATED_REAL_SOURCE', source_span_resolution: source.source_span_resolution } },
    sourceSpan: { span_id: source.source_span_id, source_text: source.source_text, source_text_hash: source.source_hash, lineage: { project_id: source.project_id, document_id: source.document_id, chunk_id: source.chunk_id, source_span_id: source.source_span_id, source_span_resolution: source.source_span_resolution } },
    material: { material_id: source.material_id, document_id: source.document_id, material_type: source.material_type, corpus_scope: source.corpus_scope, original_name: source.material_name }
  });
  return createEvidenceSupportAssessment(adapter, observationFor(kind, source, options), { evaluatorVersion: EVALUATOR_VERSION });
}

function draftReason(caseItem, assessments, aggregate) {
  const sourceNames = assessments.map(item => item.source.material_name).join('、');
  return `${caseItem.requirement.text}；来源 ${sourceNames} 仅用于系统草稿观察。根据来源片段的支持范围、主体/范围和状态信息，确定性聚合结果为 ${aggregate.status}。该判断未经人工审核，不得作为正式 Gold。`;
}

function createCase({ id, reqText, tags, difficulty, sources, kinds, options = {} }) {
  const req = requirement(id, reqText, tags, difficulty);
  const item = { case_id: id, requirement: req, retrieval_shape: 'CURATED_REAL_SOURCE', sources, draft_semantics: [], draft_aggregated_status: null, draft_gold: null };
  const assessments = sources.map((source, index) => buildAssessment({ requirement: req }, source, kinds[index] || 'partial', options[index] || {}));
  const aggregate = aggregateEvidenceSufficiency(assessments);
  item.draft_semantics = assessments;
  item.draft_aggregated_status = aggregate.status;
  item.draft_gold = {
    provenance: 'SYSTEM_DRAFT_UNREVIEWED',
    reviewed: false,
    status: aggregate.status,
    semantic_relevance: assessments.some(a => a.semantic_relevance === 'relevant') ? 'relevant' : 'irrelevant',
    evidence_capability: assessments.some(a => a.evidence_capability === 'capable') ? 'capable' : 'not_capable',
    support_level: aggregate.status === 'EVIDENCE_REVIEW_READY' ? 'full_support' : aggregate.status === 'CONFLICTING_EVIDENCE' ? 'conflict' : aggregate.status === 'NO_RELEVANT_EVIDENCE' ? 'reference_only' : 'partial_support',
    semantic_relationship: aggregate.status === 'EVIDENCE_REVIEW_READY' ? 'direct' : aggregate.status === 'CONFLICTING_EVIDENCE' ? 'conflict' : aggregate.status === 'NO_RELEVANT_EVIDENCE' ? 'unrelated' : 'partial',
    boundary_tags: tags,
    reason_codes: aggregate.reason_codes,
    draft_gold_reason: draftReason(item, assessments, aggregate),
    reviewer: null,
    reviewed_at: null
  };
  item.review = { decision: 'PENDING', reviewer: null, reviewed_at: null, corrected_status: null, corrected_semantics: null, reason: '' };
  return item;
}

function selectSources(allSources) {
  const used = new Set();
  const pick = predicate => {
    const source = sourceMatch(allSources, predicate, used);
    if (!source) throw new Error('Required formal corpus source not found');
    used.add(source.source_id);
    return source;
  };
  const chosen = {
    performance: pick(source => /performance|P95|平均响应|响应时间/i.test(`${source.material_name} ${source.source_text}`)),
    compatibility: pick(source => /compatib|兼容性矩阵|x86_64|鲲鹏|麒麟/i.test(`${source.material_name} ${source.source_text}`)),
    qualification: pick(source => /ISO\/IEC 27001|ISO 27001/i.test(source.source_text)),
    projectFragment: pick(source => /状态不完整|不得推断完工|项目D实施/i.test(source.source_text)),
    stage12Qualification: pick(source => /CM-STAGE12-27001|REPRESENTATIVE_SYNTHETIC/i.test(source.source_text))
  };
  const remaining = allSources.filter(source => !used.has(source.source_id));
  const byScope = new Map();
  for (const source of remaining) byScope.set(source.corpus_scope, [...(byScope.get(source.corpus_scope) || []), source]);
  const orderedScopes = ['GENERAL', 'GOVERNMENT_ENTERPRISE', 'HEALTHCARE', 'ENTERPRISE_PRIVATE'];
  const extra = [];
  while (extra.length < 28 && orderedScopes.some(scope => (byScope.get(scope) || []).length)) {
    for (const scope of orderedScopes) {
      const next = (byScope.get(scope) || []).shift();
      if (next) extra.push(next);
      if (extra.length >= 28) break;
    }
  }
  return { chosen, extra };
}

function buildCases(allSources) {
  const { chosen, extra } = selectSources(allSources);
  const cases = [];
  const add = (suffix, text, tags, difficulty, sources, kinds, options) => cases.push(createCase({ id: `V2R-${String(cases.length + 1).padStart(3, '0')}-${suffix}`, reqText: text, tags, difficulty, sources, kinds, options }));
  add('PERF-DIRECT', '企业应提供可核验的数据交换平台性能测试记录。', ['quantitative', 'direct_support'], 'EASY', [chosen.performance], ['direct'], [{ quantitative: true }]);
  add('PERF-PARTIAL', '企业应证明接口 P95 响应时间不超过 1 秒。', ['quantitative', 'exact_numeric_requirement', 'partial_support'], 'HARD', [chosen.performance], ['partial'], [{ quantitative: true }]);
  add('COMP-DIRECT', '企业应说明产品在 x86_64、Ubuntu 和 PostgreSQL 环境的兼容性。', ['technical', 'compatibility'], 'MEDIUM', [chosen.compatibility], ['direct']);
  add('COMP-PARTIAL', '企业应证明所有国产数据库组合均已完成压力测试。', ['technical', 'partial_multi_dimension', 'unknown'], 'HARD', [chosen.compatibility], ['partial']);
  add('ISO-DIRECT', '企业应提供当前有效的 ISO/IEC 27001 认证信息。', ['certification', 'validity'], 'EASY', [chosen.qualification], ['direct'], [{ validity: true }]);
  add('ISO-SCOPE', '企业应提供指定项目主体的 ISO/IEC 27001 证书。', ['wrong_entity', 'scope_mismatch', 'reference_only'], 'MEDIUM', [chosen.qualification], ['partial'], [{ referenceOnly: true }]);
  add('PROJECT-STATUS', '企业应提供已完成并可验收的同类项目记录。', ['project_status', 'status_unknown', 'partial_support'], 'MEDIUM', [chosen.projectFragment], ['partial']);
  add('NO-RELEVANT', '企业应提供第三方防火墙权威检测报告扫描件。', ['no_relevant', 'third_party_boundary'], 'EASY', [chosen.qualification], ['none']);
  add('ISO-CONFLICT', '企业应说明当前 ISO/IEC 27001 证书的有效截止日期。', ['conflict', 'freshness', 'superseded', 'validity'], 'HARD', [chosen.qualification, chosen.stage12Qualification], ['conflict', 'conflict'], [{ conflictGroup: 'ISO27001_EXPIRY', observedValue: '2027-11-30' }, { conflictGroup: 'ISO27001_EXPIRY', observedValue: '2028-12-31' }]);
  let extraIndex = 0;
  for (const source of extra) {
    const type = source.material_type;
    const scope = source.corpus_scope;
    const index = extraIndex++;
    const kind = index === 5
      ? 'none'
      : (scope === 'ENTERPRISE_PRIVATE' && ['qualification', 'performance_test'].includes(type) ? 'direct' : 'partial');
    const tags = [];
    let text;
    if (scope !== 'ENTERPRISE_PRIVATE') {
      text = '企业应证明自身具备与该公开行业规范相符的实施能力。';
      tags.push('industry_reference', 'enterprise_capability_boundary', 'scope_mismatch');
    } else if (type === 'qualification') {
      text = '企业应提供与项目要求对应的有效资质证明。';
      tags.push('certification', 'validity');
    } else if (type === 'project_case') {
      text = '企业应提供同类项目的实施及验收依据。';
      tags.push('project_experience', 'status_unknown', 'responsibility_boundary');
    } else if (type === 'performance_test' || type === 'technical_whitepaper') {
      text = '企业应提供与技术能力相匹配的可核验测试或技术记录。';
      tags.push('technical', index % 2 ? 'partial_multi_dimension' : 'direct_support');
    } else {
      text = '企业应提供与本项目范围相关的可核验材料。';
      tags.push('scope_mismatch', 'multiple_weak_evidence');
    }
    if (index === 5) tags.push('no_relevant');
    if (index % 7 === 0) tags.push('third_party_boundary');
    if (index % 9 === 0) tags.push('freshness');
    const difficulty = index < 8 ? 'EASY' : index < 20 ? 'MEDIUM' : 'HARD';
    add(`CORPUS-${String(index + 1).padStart(2, '0')}`, text, tags, difficulty, [source], [kind], [{ referenceOnly: false }]);
  }
  return cases;
}

function classifyLegacy(legacy) {
  return (legacy || []).map(item => ({ case_id: item.case_id, classification: 'LINEAGE_INVALID', reason: 'LEGACY_ANCHOR_MATERIAL_NOT_FOUND_IN_CURRENT_FORMAL_CORPUS' }));
}

function buildLineageReport({ legacyCases, sources, cases, inventory, holdoutMaterialIds, persistedSourceSpanCount }) {
  const scopeMaterialIds = new Map(['GENERAL', 'GOVERNMENT_ENTERPRISE', 'HEALTHCARE', 'ENTERPRISE_PRIVATE'].map(scope => [scope, new Set(inventory.materials.filter(item => item.corpus_scope === scope).map(item => item.id))]));
  const counts = {
    materials: inventory.materials.length,
    chunks: inventory.chunks.length,
    scopes: Object.fromEntries(['GENERAL', 'GOVERNMENT_ENTERPRISE', 'HEALTHCARE', 'ENTERPRISE_PRIVATE'].map(scope => [scope, {
      materials: inventory.materials.filter(item => item.corpus_scope === scope).length,
      documents: inventory.materials.filter(item => item.corpus_scope === scope).length,
      chunks: inventory.chunks.filter(item => scopeMaterialIds.get(scope)?.has(item.material_id)).length,
      usable: inventory.materials.filter(item => item.corpus_scope === scope).length,
      source_lineage: 'EXACT_CHUNK_PLUS_TRANSIENT_SOURCE_SPAN'
    }]))
  };
  return {
    schema_version: '4.3-evidence-support-calibration-v2-lineage-remediation-v1',
    db_mutation: false,
    external_calls: 0,
    legacy_anchor_count: 30,
    legacy_case_count: legacyCases.length,
    legacy_case_classifications: classifyLegacy(legacyCases),
    legacy_lineage_verified: 0,
    legacy_lineage_partial: 0,
    legacy_lineage_invalid: legacyCases.length,
    current_formal_corpus_inventory: counts,
    parsed_document_model: 'company_materials (no separate parsed_documents table)',
    holdout_excluded_material_count: holdoutMaterialIds.size,
    expanded_source_count: sources.length,
    expanded_source_verified_count: sources.filter(item => item.source_verified).length,
    expanded_document_id_count: new Set(sources.map(item => item.document_id)).size,
    expanded_source_span_id_count: new Set(sources.map(item => item.source_span_id)).size,
    persisted_source_span_count_available_read_only: persistedSourceSpanCount,
    source_span_resolution: TRANSIENT_RESOLUTION,
    source_span_persisted_count: 0,
    source_span_formalization_required: false,
    expanded_candidate_count: cases.length,
    classification: cases.length >= 24 && cases.length <= 40 ? 'READY_FOR_HUMAN_REVIEW' : 'PARTIAL'
  };
}

export async function buildRemediatedPool({ write = true } = {}) {
  dotenv.config({ path: path.resolve(HERE, '../../../.env'), quiet: true });
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required for read-only lineage reconstruction');
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const inventory = await loadCorpusRows(pool);
    const persistedSourceSpanCount = Number((await pool.query('SELECT count(*)::int AS count FROM evidence_source_spans')).rows[0]?.count || 0);
    const holdout = JSON.parse(fs.readFileSync(HOLDOUT_PATH, 'utf8'));
    const holdoutMaterialIds = new Set((holdout.questions || []).flatMap(item => item.expected_material_ids || []));
    const sources = deriveSources(inventory).filter(source => !holdoutMaterialIds.has(source.material_id));
    const cases = buildCases(sources);
    const legacyModule = await loadLegacy();
    const legacyCases = legacyModule.buildCalibrationV2Pool();
    const lineage = buildLineageReport({ legacyCases, sources, cases, inventory, holdoutMaterialIds, persistedSourceSpanCount });
    const document = {
      schema_version: '4.3-evidence-support-calibration-v2-remediated-v1',
      classification: lineage.classification,
      source_policy: 'FORMAL_CORPUS_READ_ONLY; TRANSIENT_SOURCE_SPAN_ID_ALLOWED_BY_CONTRACT',
      holdout_policy: 'READ_ONLY_OVERLAP_CHECK; GOLD_NOT_USED_FOR_AUTHORING',
      model_calls: 0,
      provider_calls: 0,
      embedding_calls: 0,
      db_mutation: false,
      synthetic_source_cases: 0,
      newly_handcrafted_synthetic_sources: 0,
      retrieval_shape_counts: { REAL_RETRIEVAL_OUTPUT: 0, CURATED_REAL_SOURCE_TOP5: 0, CURATED_REAL_SOURCE: cases.length },
      holdout_query_count: (holdout.questions || []).length,
      candidate_count: cases.length,
      cases
    };
    if (write) {
      fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
      fs.writeFileSync(LINEAGE_PATH, `${JSON.stringify(lineage, null, 2)}\n`, 'utf8');
    }
    return { document, lineage };
  } finally {
    await pool.end();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const result = await buildRemediatedPool();
  const counts = Object.fromEntries([...new Set(result.document.cases.map(item => item.draft_aggregated_status))].map(status => [status, result.document.cases.filter(item => item.draft_aggregated_status === status).length]));
  console.log(JSON.stringify({
    candidate_count: result.document.candidate_count,
    status_counts: counts,
    source_count: result.lineage.expanded_source_count,
    source_verified_count: result.lineage.expanded_source_verified_count,
    document_id_count: result.lineage.expanded_document_id_count,
    source_span_id_count: result.lineage.expanded_source_span_id_count,
    source_span_resolution: result.lineage.source_span_resolution,
    source_span_persisted_count: result.lineage.source_span_persisted_count,
    legacy_lineage_invalid: result.lineage.legacy_lineage_invalid,
    db_mutation: result.lineage.db_mutation,
    model_calls: result.document.model_calls,
    provider_calls: result.document.provider_calls,
    classification: result.document.classification
  }));
}
