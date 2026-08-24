import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderSamples, runSemanticReaudit } from '../eval/evidence-support/calibration-v2/semantic-reaudit-v2.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const POOL_PATH = path.resolve(HERE, '../eval/evidence-support/calibration-v2/candidate-pool-v2-evidence-span-repaired.json');
const pool = JSON.parse(fs.readFileSync(POOL_PATH, 'utf8'));

test('semantic re-audit excludes invalid conflict Gold and reports complete status counts', () => {
  const report = runSemanticReaudit({ pool });
  assert.equal(report.original_candidates, 37);
  assert.equal(report.valid_span_candidates, 36);
  assert.equal(report.rejected_count, 1);
  assert.deepEqual(report.status_after, {
    EVIDENCE_REVIEW_READY: 3,
    INSUFFICIENT_EVIDENCE: 32,
    NO_RELEVANT_EVIDENCE: 1,
    CONFLICTING_EVIDENCE: 0
  });
  assert.equal(report.status_changed_count, 2);
  assert.equal(report.semantic_only_changed_count, 20);
  assert.equal(report.unchanged_count, 14);
  assert.equal(report.contract_gap_found, false);
  assert.equal(report.human_review.reviewed_count, 0);
});

test('numeric adverse fact remains insufficient but preserves quantitative mismatch semantics', () => {
  const report = runSemanticReaudit({ pool });
  const item = report.cases.find(candidate => candidate.case_id === 'V2R-002-PERF-PARTIAL');
  assert.equal(item.new_draft_status, 'INSUFFICIENT_EVIDENCE');
  assert.equal(item.new_semantics[0].semantic_relevance, 'relevant');
  assert.equal(item.new_semantics[0].evidence_capability, 'capable');
  assert.equal(item.new_semantics[0].review_dimensions.quantitative_match, 'mismatch');
  assert.ok(item.new_semantics[0].reason_codes.includes('QUANTITATIVE_MISMATCH'));
  assert.equal(item.semantic_boundaries[0], 'ADVERSE_FACT');
});

test('scope mismatch is relevant but insufficient, not NO_RELEVANT_EVIDENCE', () => {
  const report = runSemanticReaudit({ pool });
  const item = report.cases.find(candidate => candidate.case_id === 'V2R-006-ISO-SCOPE');
  assert.equal(item.new_draft_status, 'INSUFFICIENT_EVIDENCE');
  assert.equal(item.new_semantics[0].semantic_relevance, 'relevant');
  assert.equal(item.new_semantics[0].review_dimensions.subject_match, 'mismatch');
  assert.equal(item.new_semantics[0].review_dimensions.scope_match, 'mismatch');
  assert.ok(item.new_semantics[0].reason_codes.includes('SUBJECT_MISMATCH'));
  assert.ok(item.new_semantics[0].reason_codes.includes('SCOPE_MISMATCH'));
});

test('industry reference remains relevant context but cannot prove enterprise capability', () => {
  const report = runSemanticReaudit({ pool });
  const item = report.cases.find(candidate => candidate.case_id === 'V2R-015-CORPUS-06');
  assert.equal(item.new_draft_status, 'INSUFFICIENT_EVIDENCE');
  assert.equal(item.new_semantics[0].semantic_relevance, 'relevant');
  assert.equal(item.new_semantics[0].evidence_capability, 'not_capable');
  assert.equal(item.new_semantics[0].semantic_relationship, 'related');
  assert.ok(item.new_semantics[0].reason_codes.includes('SOURCE_NOT_EVIDENCE_CAPABLE'));
});

test('invalid conflict is rejected and cannot enter aggregate accuracy statistics', () => {
  const report = runSemanticReaudit({ pool });
  const rejected = report.rejected_cases.find(candidate => candidate.case_id === 'V2R-009-ISO-CONFLICT');
  assert.ok(rejected);
  assert.equal(rejected.rejection_code, 'GOLD_DESIGN_INVALID');
  assert.equal(rejected.new_draft_status, null);
  assert.equal(report.status_after.CONFLICTING_EVIDENCE, 0);
});

test('every valid case is aggregate-consistent and manual samples expose source text', () => {
  const report = runSemanticReaudit({ pool });
  assert.ok(report.cases.every(item => item.aggregate_consistent));
  assert.equal(report.manual_sample_gate.source_text_displayed, true);
  const samples = renderSamples(report);
  for (const value of ['V2R-003-COMP-DIRECT', 'V2R-002-PERF-PARTIAL', 'V2R-009-ISO-CONFLICT']) assert.match(samples, new RegExp(value));
  assert.match(samples, /P95 1\.9 秒/);
  assert.match(samples, /有效至：2027-11-30/);
});
