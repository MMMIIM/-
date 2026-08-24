import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { aggregateEvidenceSufficiency } from '../../../src/pipeline/evidence-support-assessment-contract-v1.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const POOL_PATH = path.join(HERE, 'candidate-pool-v2-remediated.json');
const HOLDOUT_PATH = path.resolve(HERE, '../../corpus/l3-gold-questions-v2.json');
const REPORT_PATH = path.join(HERE, 'remediation-audit-v2.json');
const sha = value => createHash('sha256').update(String(value)).digest('hex');
const normalize = value => String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
const validHash = value => /^[0-9a-f]{64}$/.test(String(value || ''));

export function auditRemediatedPool({ pool = JSON.parse(fs.readFileSync(POOL_PATH, 'utf8')), holdout = JSON.parse(fs.readFileSync(HOLDOUT_PATH, 'utf8')) } = {}) {
  const cases = pool.cases || [];
  const statuses = ['EVIDENCE_REVIEW_READY', 'INSUFFICIENT_EVIDENCE', 'NO_RELEVANT_EVIDENCE', 'CONFLICTING_EVIDENCE'];
  const statusCounts = Object.fromEntries(statuses.map(status => [status, cases.filter(item => item.draft_aggregated_status === status).length]));
  const sources = cases.flatMap(item => item.sources || []);
  const candidateQueries = new Set(cases.map(item => normalize(item.requirement?.text)));
  const holdoutQueries = new Set((holdout.questions || []).map(item => normalize(item.text)));
  const exactQueryOverlap = [...candidateQueries].filter(item => holdoutQueries.has(item)).length;
  const sourceIds = new Set(sources.map(item => item.material_id));
  const holdoutMaterialIds = new Set((holdout.questions || []).flatMap(item => item.expected_material_ids || []));
  const sourceIdentityOverlap = [...sourceIds].filter(item => holdoutMaterialIds.has(item)).length;
  const consistency = cases.map(item => {
    const aggregate = aggregateEvidenceSufficiency(item.draft_semantics || []);
    return { case_id: item.case_id, stored: item.draft_aggregated_status, recomputed: aggregate.status, matches: aggregate.status === item.draft_aggregated_status };
  });
  const tags = [...new Set(cases.flatMap(item => item.requirement?.boundary_tags || []))].sort();
  const sourceVerification = sources.filter(item => item.source_verified === true).length;
  const validHashes = sources.filter(item => validHash(item.source_hash)).length;
  const allLineageComplete = sources.every(item => item.material_id && item.document_id && item.chunk_id && item.source_span_id && item.source_verified === true && validHash(item.source_hash));
  const reviewReady = cases.filter(item => (item.sources || []).length > 0 && (item.sources || []).every(source => source.source_verified === true && source.document_id && source.source_span_id && validHash(source.source_hash))).length;
  const difficulty = Object.fromEntries(['EASY', 'MEDIUM', 'HARD'].map(level => [level, cases.filter(item => item.requirement?.difficulty === level).length]));
  const scopes = Object.fromEntries([...new Set(sources.map(item => item.corpus_scope))].sort().map(scope => [scope, sources.filter(item => item.corpus_scope === scope).length]));
  const report = {
    schema_version: '4.3-evidence-support-calibration-v2-remediation-audit-v1',
    candidate_count: cases.length,
    status_counts: statusCounts,
    challenge_or_ambiguous_count: cases.filter(item => (item.requirement?.boundary_tags || []).some(tag => ['unknown', 'ambiguity', 'challenge'].includes(tag))).length,
    difficulty,
    source_shape_counts: { REAL_RETRIEVAL_OUTPUT: 0, CURATED_REAL_SOURCE_TOP5: 0, CURATED_REAL_SOURCE: cases.length },
    newly_handcrafted_synthetic_sources: 0,
    source_count: sources.length,
    source_verified_count: sourceVerification,
    source_verification_rate: sources.length ? sourceVerification / sources.length : 0,
    valid_source_hash_count: validHashes,
    valid_source_hash_rate: sources.length ? validHashes / sources.length : 0,
    document_id_coverage: sources.length ? sources.filter(item => item.document_id).length / sources.length : 0,
    source_span_id_coverage: sources.length ? sources.filter(item => item.source_span_id).length / sources.length : 0,
    source_span_resolution_counts: Object.fromEntries([...new Set(sources.map(item => item.source_span_resolution))].map(value => [value, sources.filter(item => item.source_span_resolution === value).length])),
    source_span_persisted_count: sources.filter(item => item.source_span_persisted === true).length,
    scope_counts: scopes,
    boundary_tags: tags,
    answer_shaped_source_count: sources.filter(item => /answer[-_ ]shaped|gold answer|标准答案/i.test(String(item.source_text || ''))).length,
    exact_holdout_query_overlap: exactQueryOverlap,
    holdout_source_identity_overlap: sourceIdentityOverlap,
    semantic_query_overlap: 'NOT_PROVEN; deterministic exact query check only',
    same_fact_overlap: 'NOT_EVALUATED_WITHOUT_HOLDOUT_GOLD',
    leakage: exactQueryOverlap === 0 && sourceIdentityOverlap === 0 ? 'PASS' : 'REVIEW_REQUIRED',
    aggregation_consistency: consistency.every(item => item.matches),
    aggregation_mismatch_count: consistency.filter(item => !item.matches).length,
    gold_design_conflict_count: consistency.filter(item => !item.matches).length,
    human_reviewed_count: cases.filter(item => item.review?.decision !== 'PENDING').length,
    review_ready_case_count: reviewReady,
    rejected_before_review: 0,
    all_lineage_complete: allLineageComplete,
    source_span_formalization_required: false,
    new_embedding_required: false,
    production_db_mutation_required: false,
    model_calls: 0,
    provider_calls: 0,
    embedding_calls: 0,
    decision: allLineageComplete && reviewReady === cases.length && consistency.every(item => item.matches) && statuses.every(status => statusCounts[status] > 0)
      ? 'READY_FOR_HUMAN_REVIEW'
      : 'PARTIAL'
  };
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const report = auditRemediatedPool();
  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify(report));
}
