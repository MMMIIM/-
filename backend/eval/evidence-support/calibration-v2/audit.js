import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCalibrationV2Document } from './candidate-pool.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../../..');
const HOLDOUT_PATH = path.join(ROOT, 'backend/eval/corpus/l3-gold-questions-v2.json');
const NO_ANSWER_PATH = path.join(ROOT, 'backend/eval/reports/stage20-no-answer-formal-forensics-details.json');

const normalize = value => String(value || '').replace(/[\s\p{P}]/gu, '').toLowerCase();
const sha256 = value => crypto.createHash('sha256').update(String(value)).digest('hex');
const validHash = value => /^[0-9a-f]{64}$/u.test(String(value || ''));

// Keep this script offline and deterministic. It reads holdout text only to
// calculate fingerprints; no holdout Gold/status/source answer is consumed.
import crypto from 'node:crypto';

function holdoutFingerprints() {
  const positiveAndNegative = JSON.parse(fs.readFileSync(HOLDOUT_PATH, 'utf8')).questions || [];
  const noAnswer = JSON.parse(fs.readFileSync(NO_ANSWER_PATH, 'utf8')).details || [];
  const queryHashes = new Set([...positiveAndNegative.map(item => sha256(normalize(item.text))), ...noAnswer.map(item => sha256(normalize(item.query)))]);
  return { queryHashes, sourceIds: new Set(noAnswer.flatMap(item => item.top5 || []).map(item => item.chunk_id).filter(Boolean)) };
}

export function auditCalibrationV2(document = buildCalibrationV2Document()) {
  const holdout = holdoutFingerprints();
  const cases = document.cases || [];
  const allSources = cases.flatMap(item => item.sources || []);
  const queryOverlap = cases.filter(item => holdout.queryHashes.has(sha256(normalize(item.requirement.text)))).length;
  const sourceOverlap = allSources.filter(item => holdout.sourceIds.has(item.chunk_id)).length;
  const validSourceHash = allSources.filter(item => validHash(item.source_hash)).length;
  const materialIds = new Set(allSources.map(item => item.material_id).filter(Boolean));
  const statusCounts = Object.fromEntries(['EVIDENCE_REVIEW_READY', 'INSUFFICIENT_EVIDENCE', 'NO_RELEVANT_EVIDENCE', 'CONFLICTING_EVIDENCE'].map(status => [status, cases.filter(item => item.draft_gold?.status === status).length]));
  const boundaryCounts = Object.fromEntries([...new Set(cases.flatMap(item => item.draft_gold?.boundary_tags || []))].map(tag => [tag, cases.filter(item => (item.draft_gold?.boundary_tags || []).includes(tag)).length]));
  return {
    schema_version: '4.3-evidence-support-calibration-v2-audit-v1',
    candidate_count: cases.length,
    status_counts: statusCounts,
    unknown_or_challenge_count: cases.filter(item => !item.draft_gold?.status).length,
    retrieval_shape: Object.fromEntries([...new Set(cases.map(item => item.retrieval_shape))].map(shape => [shape, cases.filter(item => item.retrieval_shape === shape).length])),
    synthetic_source_cases: cases.filter(item => item.retrieval_shape === 'HANDCRAFTED_SYNTHETIC_SOURCE').length,
    material_id_coverage: allSources.length ? allSources.filter(item => item.material_id).length / allSources.length : 0,
    document_id_coverage: allSources.length ? allSources.filter(item => item.document_id).length / allSources.length : 0,
    chunk_id_coverage: allSources.length ? allSources.filter(item => item.chunk_id).length / allSources.length : 0,
    source_span_id_coverage: allSources.length ? allSources.filter(item => item.source_span_id).length / allSources.length : 0,
    source_hash_validity: allSources.length ? validSourceHash / allSources.length : 0,
    source_verification: allSources.length ? allSources.filter(item => item.source_verification === 'VERIFIED').length / allSources.length : 0,
    unique_material_count: materialIds.size,
    holdout_exact_query_overlap: queryOverlap,
    holdout_source_span_overlap: sourceOverlap,
    gold_leakage: document.cases.some(item => Object.keys(item).some(key => key.startsWith('gold_'))) ? 'REVIEW_REQUIRED' : 'NO',
    boundary_counts: boundaryCounts,
    human_reviewed_count: cases.filter(item => item.review?.decision === 'APPROVE').length,
    model_calls: 0,
    provider_calls: 0,
    decision: cases.length > 0 && validSourceHash === allSources.length && sourceOverlap === 0 && queryOverlap === 0
      && allSources.length > 0 && allSources.every(item => item.document_id && item.source_span_id)
      ? 'READY_FOR_HUMAN_REVIEW'
      : 'PARTIAL'
  };
}

if (path.resolve(process.argv[1] || '') === path.resolve(fileURLToPath(import.meta.url))) {
  console.log(JSON.stringify(auditCalibrationV2(), null, 2));
}
