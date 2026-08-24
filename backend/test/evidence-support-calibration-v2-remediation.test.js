import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { aggregateEvidenceSufficiency } from '../src/pipeline/evidence-support-assessment-contract-v1.js';
import { auditRemediatedPool } from '../eval/evidence-support/calibration-v2/audit-remediated.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const poolPath = path.resolve(here, '../eval/evidence-support/calibration-v2/candidate-pool-v2-remediated.json');
const reportPath = path.resolve(here, '../eval/evidence-support/calibration-v2/remediation-audit-v2.json');

function loadPool() {
  return JSON.parse(fs.readFileSync(poolPath, 'utf8'));
}

test('V2 remediation uses formal corpus sources and reaches qualified candidate range', () => {
  const pool = loadPool();
  assert.ok(pool.candidate_count >= 24 && pool.candidate_count <= 40);
  assert.equal(pool.synthetic_source_cases, 0);
  assert.equal(pool.model_calls, 0);
  assert.equal(pool.provider_calls, 0);
  assert.equal(pool.db_mutation, false);
  assert.ok(pool.cases.every(item => item.retrieval_shape === 'CURATED_REAL_SOURCE'));
});

test('all four business statuses are present and are produced by deterministic aggregation', () => {
  const pool = loadPool();
  const statuses = new Set(pool.cases.map(item => item.draft_aggregated_status));
  for (const status of ['EVIDENCE_REVIEW_READY', 'INSUFFICIENT_EVIDENCE', 'NO_RELEVANT_EVIDENCE', 'CONFLICTING_EVIDENCE']) assert.ok(statuses.has(status), status);
  for (const item of pool.cases) assert.equal(aggregateEvidenceSufficiency(item.draft_semantics).status, item.draft_aggregated_status);
});

test('every expanded source is exact, hashed, document-bound and transient-span resolvable', () => {
  const pool = loadPool();
  const sources = pool.cases.flatMap(item => item.sources);
  assert.ok(sources.length >= pool.candidate_count);
  assert.ok(sources.every(source => source.material_id && source.document_id && source.chunk_id && source.source_span_id));
  assert.ok(sources.every(source => source.source_verified === true));
  assert.ok(sources.every(source => source.source_span_resolution === 'DERIVED_TRANSIENT_FORMAL_CONTRACT'));
  assert.ok(sources.every(source => /^[0-9a-f]{64}$/.test(source.source_hash)));
  assert.ok(pool.cases.every(item => new Set(item.sources.map(source => source.source_span_id)).size === item.sources.length));
});

test('conflict observations retain two verified source lineages without resolving truth', () => {
  const pool = loadPool();
  const conflict = pool.cases.find(item => item.draft_aggregated_status === 'CONFLICTING_EVIDENCE');
  assert.ok(conflict);
  assert.equal(conflict.sources.length, 2);
  const observations = conflict.draft_semantics.flatMap(item => item.conflict_observations || []);
  assert.equal(new Set(observations.map(item => item.source_span_id)).size, 2);
  assert.equal(new Set(observations.map(item => item.observed_value)).size, 2);
  assert.equal(conflict.draft_gold.reviewed, false);
});

test('no answer-shaped source and no synthetic source authored for a case', () => {
  const pool = loadPool();
  const sources = pool.cases.flatMap(item => item.sources);
  assert.equal(sources.filter(source => /answer[-_ ]shaped|标准答案|gold answer/i.test(source.source_text)).length, 0);
  assert.ok(sources.every(source => source.source_span_persisted === false));
});

test('holdout remains sealed and remediation audit is independent', () => {
  const pool = loadPool();
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  assert.equal(report.exact_holdout_query_overlap, 0);
  assert.equal(report.holdout_source_identity_overlap, 0);
  assert.equal(report.same_fact_overlap, 'NOT_EVALUATED_WITHOUT_HOLDOUT_GOLD');
  assert.equal(report.leakage, 'PASS');
  assert.equal(report.model_calls, 0);
  assert.equal(report.provider_calls, 0);
  assert.equal(pool.holdout_query_count, 139);
});

test('difficulty includes substantive medium and hard coverage', () => {
  const pool = loadPool();
  const counts = Object.fromEntries(['EASY', 'MEDIUM', 'HARD'].map(level => [level, pool.cases.filter(item => item.requirement.difficulty === level).length]));
  assert.ok(counts.EASY > 0 && counts.MEDIUM > 0 && counts.HARD > 0);
  assert.ok(counts.MEDIUM + counts.HARD >= counts.EASY);
});

test('original ten anchors remain excluded when current formal corpus cannot resolve them', () => {
  const report = JSON.parse(fs.readFileSync(path.resolve(here, '../eval/evidence-support/calibration-v2/lineage-reconciliation-v2.json'), 'utf8'));
  assert.equal(report.legacy_case_count, 10);
  assert.equal(report.legacy_lineage_verified, 0);
  assert.equal(report.legacy_lineage_partial, 0);
  assert.equal(report.legacy_lineage_invalid, 10);
  assert.equal(report.db_mutation, false);
});
