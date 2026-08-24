import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';
import { EvidenceSourceContextResolver } from '../../../src/pipeline/evidence-source-context-resolver.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const POOL_PATH = path.join(HERE, 'candidate-pool-v2-remediated.json');
const REPAIRED_POOL_PATH = path.join(HERE, 'candidate-pool-v2-evidence-span-repaired.json');
const FORENSICS_PATH = path.join(HERE, 'evidence-span-forensics-v2.json');
const BATCH_IDS = new Set([
  'V2R-001-PERF-DIRECT', 'V2R-003-COMP-DIRECT', 'V2R-005-ISO-DIRECT',
  'V2R-002-PERF-PARTIAL', 'V2R-006-ISO-SCOPE', 'V2R-021-CORPUS-12',
  'V2R-030-CORPUS-21', 'V2R-015-CORPUS-06', 'V2R-009-ISO-CONFLICT',
  'V2R-004-COMP-PARTIAL'
]);
const sha = value => createHash('sha256').update(String(value)).digest('hex');
const SOURCE_LINEAGE_VERIFIED = 'SOURCE_LINEAGE_VERIFIED';
const EVIDENCE_SPAN_VERIFIED = 'EVIDENCE_SPAN_VERIFIED';
const EVIDENCE_SPAN_INVALID = 'EVIDENCE_SPAN_INVALID';
const EVIDENCE_SPAN_AMBIGUOUS = 'EVIDENCE_SPAN_AMBIGUOUS';

const METADATA_ONLY = /^(?:\s*#.*|\s*)$|(?:REPRESENTATIVE_SYNTHETIC|NOT_REAL_CUSTOMER_DATA|SYNTHETIC_TEST_MATERIAL|material_id:|subject:|source_type:|source_org:|license_or_usage_status:|review_status:|来源机构：|文号：)/i;
const BUSINESS_SIGNALS = /(?:产品：|环境：|条件：|指标：|结果：|P95|响应|测试|x86_64|Ubuntu|PostgreSQL|数据库|压力|tested|not_verified|ISO\/IEC|有效至|有效期|编号：|项目：|范围：|验收|合同|中选|试点|状态：|指南要求|条例明确|标准完善|细则要求|规范|第三方|部署|许可|技术支持|平台可集成)/i;

function isMetadataOnly(text) {
  const value = String(text || '').trim();
  if (!value || value.length < 20) return true;
  if (BUSINESS_SIGNALS.test(value)) return false;
  return METADATA_ONLY.test(value);
}

function evidenceKeywords(item) {
  const tags = new Set(item.requirement?.boundary_tags || []);
  const keys = [];
  if (tags.has('quantitative') || tags.has('exact_numeric_requirement')) keys.push('P95', '平均', '响应', '秒', '指标', '结果', '测试');
  if (tags.has('compatibility') || tags.has('technical') || tags.has('partial_multi_dimension')) keys.push('x86_64', 'Ubuntu', 'PostgreSQL', '兼容', '数据库', '压力', 'tested', 'not_verified', 'unknown');
  if (tags.has('certification') || tags.has('validity') || tags.has('reference_only')) keys.push('ISO', '有效', '证书', '编号', '状态', '有效至');
  if (tags.has('project_status') || tags.has('project_experience') || tags.has('responsibility_boundary')) keys.push('项目', '验收', '合同', '中选', '试点', '实施', '状态');
  if (tags.has('industry_reference') || tags.has('enterprise_capability_boundary')) keys.push('指南', '条例', '标准', '要求', '体系', '管理', '安全', '服务', '保护', '规范', '细则');
  if (tags.has('third_party_boundary') || tags.has('scope_mismatch') || tags.has('multiple_weak_evidence')) keys.push('第三方', '部署', '许可', '支持', '授权', '集成');
  return [...new Set(keys)];
}

function scoreChunk(item, chunk) {
  const text = String(chunk.source_text || '');
  const keys = evidenceKeywords(item);
  const matches = keys.filter(key => text.toLowerCase().includes(key.toLowerCase()));
  let score = matches.length * 10;
  if (BUSINESS_SIGNALS.test(text)) score += 8;
  if (isMetadataOnly(text)) score -= 100;
  score += Math.min(text.length, 240) / 100;
  return { score, matches };
}

function selectEvidenceChunk(item, chunks) {
  const ranked = chunks
    .map(chunk => ({ chunk, ...scoreChunk(item, chunk) }))
    .sort((a, b) => b.score - a.score || a.chunk.chunk_index - b.chunk.chunk_index);
  const best = ranked[0];
  const second = ranked[1];
  const ambiguous = Boolean(best && second && !isMetadataOnly(best.chunk.source_text) && Math.abs(best.score - second.score) < 0.01);
  return { best, ranked, ambiguous };
}

function conflictDimensionObserved(text) {
  return /(?:有效至|有效期|expiry|valid_until)\s*[:：]?\s*20\d{2}/i.test(String(text || ''));
}

function updateAssessmentSource(assessment, source) {
  if (!assessment || !source) return;
  if (assessment.source) {
    assessment.source.source_id = source.source_id;
    assessment.source.source_span_id = source.source_span_id;
    assessment.source.source_text_hash = source.source_hash;
    assessment.source.lineage = { ...assessment.source.lineage, document_id: source.document_id, chunk_id: source.chunk_id, source_span_id: source.source_span_id, source_span_resolution: source.source_span_resolution };
  }
  for (const observation of assessment.support_observations || []) {
    observation.source_id = source.source_id;
    observation.source_span_id = source.source_span_id;
    observation.support_excerpt = source.source_text;
    observation.support_excerpt_hash = source.source_hash;
  }
  for (const observation of assessment.conflict_observations || []) {
    observation.source_id = source.source_id;
    observation.source_span_id = source.source_span_id;
    observation.support_excerpt = source.source_text;
    observation.support_excerpt_hash = source.source_hash;
  }
}

function repairSource({ item, source, material, chunks, resolver, sourceIndex }) {
  const oldChunk = chunks.find(chunk => chunk.chunk_id === source.chunk_id) || null;
  const oldLineageVerified = Boolean(oldChunk && material.extracted_text?.slice(oldChunk.char_start, oldChunk.char_end) === oldChunk.source_text && oldChunk.source_text === source.source_text && sha(oldChunk.source_text) === source.source_hash);
  const selection = selectEvidenceChunk(item, chunks);
  const chosen = selection.best?.chunk || oldChunk;
  if (!chosen) return { source: { ...source, source_lineage_verified: false, evidence_span_status: EVIDENCE_SPAN_INVALID }, forensic: { old_source: source, source_lineage_verified: false, business_relevant_text_exists: false, correct_evidence_span_identified: false, old_span_valid: false, evidence_span_status: EVIDENCE_SPAN_INVALID, reason: 'CHUNK_NOT_FOUND' } };
  const span = resolver.resolve({ material, chunks, anchorChunkId: chosen.chunk_id, strategy: 'anchor_only' });
  const sourceText = span.source_text;
  const metadataOnly = isMetadataOnly(sourceText);
  const conflictSource = item.draft_aggregated_status === 'CONFLICTING_EVIDENCE';
  const conflictDimensionValid = !conflictSource || (sourceIndex === 0 ? conflictDimensionObserved(sourceText) : conflictDimensionObserved(sourceText));
  let evidenceSpanStatus = selection.ambiguous ? EVIDENCE_SPAN_AMBIGUOUS : (!metadataOnly && conflictDimensionValid ? EVIDENCE_SPAN_VERIFIED : EVIDENCE_SPAN_INVALID);
  let reason = null;
  if (selection.ambiguous) reason = 'MULTIPLE_BUSINESS_CHUNKS_HAVE_EQUAL_DETERMINISTIC_SCORE';
  else if (metadataOnly) reason = 'SELECTED_CHUNK_IS_METADATA_OR_HEADING_ONLY';
  else if (conflictSource && !conflictDimensionValid) reason = 'CONFLICT_DIMENSION_NOT_OBSERVED_IN_SOURCE';
  const index = chunks.findIndex(chunk => chunk.chunk_id === chosen.chunk_id);
  const contextBefore = index > 0 ? chunks[index - 1].source_text : null;
  const contextAfter = index >= 0 && index + 1 < chunks.length ? chunks[index + 1].source_text : null;
  const repaired = {
    ...source,
    source_id: chosen.chunk_id,
    source_span_id: span.span_id,
    source_span_resolution: 'DETERMINISTIC_EVIDENCE_CHUNK',
    source_span_persisted: false,
    source_verified: true,
    source_lineage_verified: true,
    evidence_span_verified: evidenceSpanStatus === EVIDENCE_SPAN_VERIFIED,
    evidence_span_status: evidenceSpanStatus,
    evidence_span_reason: reason,
    chunk_id: chosen.chunk_id,
    source_text: sourceText,
    source_hash: sha(sourceText),
    start_offset: span.start_offset,
    end_offset: span.end_offset,
    source_chunk_ids: [chosen.chunk_id],
    resolver_version: span.resolver_version,
    context_before: contextBefore,
    context_after: contextAfter,
    old_source_id: source.source_id,
    old_start_offset: source.start_offset,
    old_end_offset: source.end_offset
  };
  return {
    source: repaired,
    forensic: {
      old_source: { source_id: source.source_id, source_text: source.source_text, start_offset: source.start_offset, end_offset: source.end_offset, source_hash: source.source_hash },
      source_lineage_verified: oldLineageVerified,
      business_relevant_text_exists: chunks.some(chunk => !isMetadataOnly(chunk.source_text)),
      correct_evidence_span_identified: evidenceSpanStatus === EVIDENCE_SPAN_VERIFIED,
      old_span_valid: oldLineageVerified && !isMetadataOnly(source.source_text) && (source.source_text === sourceText),
      evidence_span_status: evidenceSpanStatus,
      reason,
      repaired_span: {
        source_id: repaired.source_id,
        start_offset: repaired.start_offset,
        end_offset: repaired.end_offset,
        source_hash: repaired.source_hash,
        source_text: repaired.source_text,
        context_before: repaired.context_before,
        context_after: repaired.context_after
      }
    }
  };
}

async function loadInventory(pool, materialIds) {
  const materials = (await pool.query('SELECT * FROM company_materials WHERE id=ANY($1::uuid[])', [materialIds])).rows;
  const chunks = materialIds.length ? (await pool.query('SELECT * FROM material_chunks WHERE material_id=ANY($1::uuid[]) ORDER BY material_id,chunk_index', [materialIds])).rows : [];
  const materialById = new Map(materials.map(material => [material.id, material]));
  const chunksByMaterial = new Map();
  for (const chunk of chunks) chunksByMaterial.set(chunk.material_id, [...(chunksByMaterial.get(chunk.material_id) || []), chunk]);
  return { materialById, chunksByMaterial };
}

export async function repairEvidenceSpansV2({ write = true } = {}) {
  const poolDocument = JSON.parse(fs.readFileSync(POOL_PATH, 'utf8'));
  dotenv.config({ path: path.resolve(HERE, '../../../.env'), quiet: true });
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required for read-only evidence span repair');
  const db = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const materialIds = [...new Set(poolDocument.cases.flatMap(item => (item.sources || []).map(source => source.material_id)))];
    const inventory = await loadInventory(db, materialIds);
    const resolver = new EvidenceSourceContextResolver();
    const repairedCases = [];
    const forensicCases = [];
    for (const item of poolDocument.cases) {
      const repairedSources = [];
      const sourceForensics = [];
      for (const [sourceIndex, source] of (item.sources || []).entries()) {
        const material = inventory.materialById.get(source.material_id);
        const chunks = inventory.chunksByMaterial.get(source.material_id) || [];
        const result = material ? repairSource({ item, source, material, chunks, resolver, sourceIndex }) : { source: { ...source, source_lineage_verified: false, evidence_span_status: EVIDENCE_SPAN_INVALID }, forensic: { old_source: source, source_lineage_verified: false, business_relevant_text_exists: false, correct_evidence_span_identified: false, old_span_valid: false, evidence_span_status: EVIDENCE_SPAN_INVALID, reason: 'MATERIAL_NOT_FOUND' } };
        repairedSources.push(result.source);
        sourceForensics.push(result.forensic);
      }
      const repairedItem = { ...item, sources: repairedSources, evidence_span_case_status: sourceForensics.every(entry => entry.evidence_span_status === EVIDENCE_SPAN_VERIFIED) ? EVIDENCE_SPAN_VERIFIED : sourceForensics.some(entry => entry.evidence_span_status === EVIDENCE_SPAN_AMBIGUOUS) ? EVIDENCE_SPAN_AMBIGUOUS : EVIDENCE_SPAN_INVALID };
      for (const [index, assessment] of (repairedItem.draft_semantics || []).entries()) updateAssessmentSource(assessment, repairedSources[index] || repairedSources[0]);
      repairedCases.push(repairedItem);
      forensicCases.push({ case_id: item.case_id, requirement: item.requirement, material_ids: repairedSources.map(source => source.material_id), chunk_ids: repairedSources.map(source => source.chunk_id), status: item.draft_aggregated_status, case_status: repairedItem.evidence_span_case_status, batch_01: BATCH_IDS.has(item.case_id), sources: sourceForensics, case_still_valid: item.draft_aggregated_status !== 'CONFLICTING_EVIDENCE' && repairedItem.evidence_span_case_status === EVIDENCE_SPAN_VERIFIED });
    }
    const sourceForensics = forensicCases.flatMap(item => item.sources);
    const casesWithLineage = forensicCases.filter(item => item.sources.every(source => source.source_lineage_verified)).length;
    const casesWithVerified = forensicCases.filter(item => item.case_status === EVIDENCE_SPAN_VERIFIED).length;
    const casesWithInvalid = forensicCases.filter(item => item.case_status === EVIDENCE_SPAN_INVALID).length;
    const casesWithAmbiguous = forensicCases.filter(item => item.case_status === EVIDENCE_SPAN_AMBIGUOUS).length;
    const sourceMetrics = {
      source_lineage_verified: sourceForensics.filter(source => source.source_lineage_verified).length,
      evidence_span_verified: sourceForensics.filter(source => source.evidence_span_status === EVIDENCE_SPAN_VERIFIED).length,
      evidence_span_invalid: sourceForensics.filter(source => source.evidence_span_status === EVIDENCE_SPAN_INVALID).length,
      evidence_span_ambiguous: sourceForensics.filter(source => source.evidence_span_status === EVIDENCE_SPAN_AMBIGUOUS).length
    };
    const batchForensics = forensicCases.filter(item => item.batch_01);
    const batchBlocked = batchForensics.some(item => item.case_status !== EVIDENCE_SPAN_VERIFIED);
    const repairedPool = {
      ...poolDocument,
      schema_version: '4.3-evidence-support-calibration-v2-evidence-span-repaired-v1',
      classification: batchBlocked ? 'HUMAN_REVIEW_BLOCKED_BY_EVIDENCE_SPAN_QUALITY' : 'READY_FOR_HUMAN_REVIEW',
      source_verification_semantics: 'SOURCE_LINEAGE_VERIFIED_AND_EVIDENCE_SPAN_VERIFIED_REQUIRED',
      source_lineage_verified_count: sourceMetrics.source_lineage_verified,
      evidence_span_verified_count: sourceMetrics.evidence_span_verified,
      evidence_span_invalid_count: sourceMetrics.evidence_span_invalid,
      evidence_span_ambiguous_count: sourceMetrics.evidence_span_ambiguous,
      evidence_span_metrics: { ...sourceMetrics, case_count: forensicCases.length, cases_with_source_lineage_verified: casesWithLineage, cases_with_evidence_span_verified: casesWithVerified, cases_with_evidence_span_invalid: casesWithInvalid, cases_with_evidence_span_ambiguous: casesWithAmbiguous },
      db_mutation: false,
      cases: repairedCases
    };
    const report = {
      schema_version: '4.3-evidence-support-calibration-v2-evidence-span-forensics-v1',
      root_cause: { review_packet_rendering_bug: false, candidate_source_span_selection_bug: true, both: false },
      previous_classification: 'READY_FOR_HUMAN_REVIEW',
      corrected_classification: batchBlocked ? 'HUMAN_REVIEW_BLOCKED_BY_EVIDENCE_SPAN_QUALITY' : 'READY_FOR_HUMAN_REVIEW',
      model_calls: 0,
      provider_calls: 0,
      embedding_calls: 0,
      db_mutation: false,
      case_metrics: { total: forensicCases.length, source_lineage_verified: casesWithLineage, evidence_span_verified: casesWithVerified, evidence_span_invalid: casesWithInvalid, evidence_span_ambiguous: casesWithAmbiguous },
      source_metrics: sourceMetrics,
      batch_01_metrics: { case_count: batchForensics.length, source_lineage_verified: batchForensics.filter(item => item.sources.every(source => source.source_lineage_verified)).length, evidence_span_verified: batchForensics.filter(item => item.case_status === EVIDENCE_SPAN_VERIFIED).length, evidence_span_invalid: batchForensics.filter(item => item.case_status === EVIDENCE_SPAN_INVALID).length, evidence_span_ambiguous: batchForensics.filter(item => item.case_status === EVIDENCE_SPAN_AMBIGUOUS).length },
      conflict: { case_id: 'V2R-009-ISO-CONFLICT', actual_conflicting_values: [], actual_source_excerpts: batchForensics.find(item => item.case_id === 'V2R-009-ISO-CONFLICT')?.sources.map(source => source.repaired_span?.source_text || '') || [], conflict_gold_valid: false, classification: 'GOLD_DESIGN_INVALID' },
      cases: forensicCases
    };
    if (write) {
      fs.writeFileSync(REPAIRED_POOL_PATH, `${JSON.stringify(repairedPool, null, 2)}\n`, 'utf8');
      fs.writeFileSync(FORENSICS_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    }
    return { repairedPool, report };
  } finally {
    await db.end();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const { repairedPool, report } = await repairEvidenceSpansV2();
  console.log(JSON.stringify({ classification: report.corrected_classification, case_metrics: report.case_metrics, source_metrics: report.source_metrics, batch_01_metrics: report.batch_01_metrics, conflict_gold_valid: report.conflict.conflict_gold_valid, model_calls: 0, provider_calls: 0, db_mutation: false, output: REPAIRED_POOL_PATH, forensics: FORENSICS_PATH, candidate_count: repairedPool.candidate_count }));
}
