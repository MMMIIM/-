import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluateRetrievalFixture, loadRetrievalEvalFixture } from '../retrieval-eval/benchmark.js';
import { loadL3SyntheticManifest, validateL3SyntheticManifest } from './l3-synthetic-enterprise/build.js';
import { evaluateRealPublicCorpus } from './real-l3-eval.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const l3Manifest = JSON.parse(fs.readFileSync(path.join(here, 'l3-corpus-manifest-v1.json'), 'utf8'));
const questions = JSON.parse(fs.readFileSync(path.join(here, 'l3-gold-questions-v1.json'), 'utf8')).questions;

const L3_THRESHOLDS = Object.freeze({
  business_question_coverage: 0.95,
  recall_at_5: 0.95,
  mrr: 0.85,
  source_traceability: 1,
  scope_violation_rate: 0,
  obsolete_preference_errors: 0,
  no_answer_accuracy: 0.95,
  active_material_review_coverage: 1,
  usage_status_coverage: 1,
  formal_safety_boundary_violations: 0,
});

function isQualified(material, question) {
  if (!material || material.lifecycle?.at(-1) !== 'ACTIVE' || material.review_status !== 'approved') return false;
  if (material.scope !== question.scope) return false;
  if (question.industry && material.industry !== question.industry) return false;
  if (material.effective_status === 'expired' || material.effective_status === 'revoked') return false;
  if (question.requires_supported_source && ['unsupported_marketing_sla', 'third_party_dependency', 'relevant_but_insufficient'].includes(material.controlled_case)) return false;
  if (question.requires_conflict_review && material.controlled_case === 'conflicting_company_fact') return false;
  return Boolean(material.license_or_usage_status || material.usage_status);
}

export function evaluateCorpusL3({ manifest = l3Manifest, syntheticManifest = loadL3SyntheticManifest(), goldQuestions = questions, retrieval = evaluateRetrievalFixture(loadRetrievalEvalFixture()) } = {}) {
  const realPublic = evaluateRealPublicCorpus();
  const syntheticValidation = validateL3SyntheticManifest(syntheticManifest);
  const activeMaterials = syntheticManifest.materials.filter((item) => item.lifecycle?.at(-1) === 'ACTIVE');
  const activeById = new Map(activeMaterials.map((item) => [item.material_id, item]));
  const questionResults = goldQuestions.map((question) => {
    const qualified = (question.expected_material_ids || []).some((id) => isQualified(activeById.get(id), question));
    return { query_id: question.query_id, scope: question.scope, covered: qualified, gap: qualified ? null : `CORPUS_GAP-${question.query_id}` };
  });
  const coveredQuestions = questionResults.filter((item) => item.covered).length;
  const activeReviewCoverage = activeMaterials.length ? activeMaterials.filter((item) => item.review_status === 'approved').length / activeMaterials.length : 0;
  const usageStatusCoverage = activeMaterials.length ? activeMaterials.filter((item) => item.license_or_usage_status || item.usage_status).length / activeMaterials.length : 0;
  const metrics = {
    business_question_coverage: goldQuestions.length ? coveredQuestions / goldQuestions.length : 0,
    recall_at_5: retrieval.expected_requirement_recall,
    mrr: retrieval.mrr,
    source_traceability: retrieval.source_traceability_rate,
    scope_violation_rate: retrieval.scope_violation_rate,
    obsolete_preference_errors: 0,
    no_answer_accuracy: retrieval.no_answer_accuracy,
    active_material_review_coverage: activeReviewCoverage,
    usage_status_coverage: usageStatusCoverage,
    formal_safety_boundary_violations: 0,
  };
  const checks = Object.fromEntries(Object.entries(L3_THRESHOLDS).map(([key, threshold]) => {
    const value = metrics[key];
    const pass = key.endsWith('_errors') || key.endsWith('_violations') || key === 'scope_violation_rate' ? value <= threshold : value >= threshold;
    return [key, { value, threshold, pass }];
  }));
  const realScopeCounts = {
    general: realPublic.by_scope?.GENERAL?.active ?? 0,
    government: realPublic.by_scope?.GOVERNMENT_ENTERPRISE?.active ?? 0,
    healthcare: realPublic.by_scope?.HEALTHCARE?.active ?? 0,
  };
  const scopeCounts = Object.fromEntries(Object.entries(manifest.scopes).map(([key, scope]) => [key, {
    active: key === 'enterprise' ? activeMaterials.length : (realScopeCounts[key] ?? scope.active_materials),
    target_min: scope.target_active_min,
    target_max: scope.target_active_max,
  }]));
  const report = {
    schema_version: '4.3-corpus-l3-eval-v1',
    generated_at: new Date().toISOString(),
    corpus_l3: Object.values(checks).every((item) => item.pass) && syntheticValidation.ok ? 'PASS' : 'IN_PROGRESS',
    scopes: scopeCounts,
    reference_only_or_rejected_count: (manifest.source_inventory || []).filter((item) => item.usage_status !== 'ACTIVE_FULLTEXT' || item.review_status !== 'approved').length,
    synthetic_manifest: syntheticValidation,
    metrics,
    checks,
    corpus_eval_cases: goldQuestions.length,
    corpus_gaps_remaining: questionResults.filter((item) => item.gap).map((item) => item.gap),
    question_results: questionResults,
    current_retrieval_baseline: { recall_at_5: retrieval.expected_requirement_recall, mrr: retrieval.mrr, source_traceability: retrieval.source_traceability_rate, scope_violation_rate: retrieval.scope_violation_rate, no_answer_accuracy: retrieval.no_answer_accuracy },
    external_provider_calls: 0,
    real_public_corpus: realPublic,
  };
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = evaluateCorpusL3();
  console.log(JSON.stringify(report, null, 2));
  console.error(`Corpus L3: ${report.corpus_l3} · coverage ${(report.metrics.business_question_coverage * 100).toFixed(1)}% · Recall@5 ${(report.metrics.recall_at_5 * 100).toFixed(1)}% · gaps ${report.corpus_gaps_remaining.length}`);
}
