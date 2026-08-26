import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeSnapshot } from '../eval/jiangyin-ambiguity-prevalence-v1/runner.js';

function baseCandidate(requirementId, chunkId, overrides = {}) {
  return {
    project_id: 'project',
    retrieval_run_id: `run-${requirementId}`,
    requirement_id: requirementId,
    requirement_ref: requirementId,
    top_k: 5,
    started_at: '2026-08-26T00:00:00Z',
    rank: 1,
    reranked_rank: 1,
    similarity_score: 0.61,
    chunk_id: chunkId,
    content_role: 'business_content',
    chunk_role: 'BUSINESS_CONTENT',
    candidate_eligibility: 'EVIDENCE_ELIGIBLE',
    substantive_candidate: true,
    evidence_source_eligible: true,
    evidence_source_class: 'ORIGINAL_TECHNICAL_FACT',
    evidence_source_reason: 'ORIGINAL_MATERIAL_PROVENANCE',
    source_text: '平台支持审计日志导出。',
    material_id: `material-${requirementId}`,
    material_project_id: 'project',
    material_type: 'technical_solution',
    source_type: 'internal',
    authority_level: null,
    corpus_scope: 'ENTERPRISE_PRIVATE',
    ...overrides
  };
}

test('Jiangyin prevalence analyzer keeps no-candidate and ambiguity separate', () => {
  const result = analyzeSnapshot({
    project: { id: 'project', name: 'synthetic snapshot', status: 'requirements_confirmed', material_count: 1 },
    tenderFile: { id: 'file', original_name: 'target.pdf', size_bytes: 10 },
    fileHash: 'hash',
    requirements: [
      { id: 'r1', req_id: 'REQ-001', content: '系统应支持审计日志导出为CSV。', requirement_category: 'technical', ordinal: 1 },
      { id: 'r2', req_id: 'REQ-002', content: '系统应支持统一身份认证。', requirement_category: 'technical', ordinal: 2 },
      { id: 'r3', req_id: 'REQ-003', content: '系统应支持安全审计。', requirement_category: 'delivery', ordinal: 3 }
    ],
    runs: [
      { requirement_id: 'r1', retrieval_run_id: 'run-r1', top_k: 5, status: 'succeeded', started_at: '2026-08-26T00:00:00Z' },
      { requirement_id: 'r2', retrieval_run_id: 'run-r2', top_k: 5, status: 'succeeded', started_at: '2026-08-26T00:01:00Z' },
      { requirement_id: 'r3', retrieval_run_id: 'run-r3', top_k: 5, status: 'succeeded', started_at: '2026-08-26T00:02:00Z' }
    ],
    candidateRows: [
      baseCandidate('r1', 'c1'),
      baseCandidate('r2', 'c2', { candidate_eligibility: 'CONTEXT_ONLY', substantive_candidate: false }),
      baseCandidate('r3', 'c3')
    ]
  });
  assert.equal(result.external_calls.llm_calls, 0);
  assert.equal(result.pollution.production_db_writes, 0);
  assert.equal(result.retrieval.requirements_without_candidates, 0);
  assert.equal(result.pair_level.total_candidate_pairs, 3);
  assert.equal(result.pair_level.dropped_or_ineligible_pairs, 1);
  assert.equal(result.retrieval.requirements_with_candidates, 3);
  assert.equal(result.requirement_level.requirements_with_any_ambiguous_pair >= 1, true);
  assert.equal(result.retrieval_insufficiency.no_candidate_is_not_semantic_ambiguity, true);
});

test('Jiangyin prevalence analyzer reports an empty usable denominator instead of inventing a low rate', () => {
  const result = analyzeSnapshot({
    project: { id: 'project', name: 'synthetic snapshot', status: 'requirements_confirmed', material_count: 1 },
    tenderFile: { id: 'file', original_name: 'target.pdf', size_bytes: 10 },
    fileHash: 'hash',
    requirements: [{ id: 'r1', req_id: 'REQ-001', content: '系统应支持审计。', requirement_category: 'technical', ordinal: 1 }],
    runs: [{ requirement_id: 'r1', retrieval_run_id: 'run-r1', top_k: 5, status: 'succeeded', started_at: '2026-08-26T00:00:00Z' }],
    candidateRows: [baseCandidate('r1', 'c1', { evidence_source_eligible: false, evidence_source_class: 'UNKNOWN', material_type: 'company_profile', source_type: null })]
  });
  assert.equal(result.pair_level.dropped_or_ineligible_pairs, 0);
  assert.equal(result.pair_level.eligible_candidate_pairs, 1);
  assert.equal(result.necessity.theoretical_llm_calls, 0);
  assert.equal(result.final.ambiguity_prevalence, 'LOW');
});
