import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyEnterpriseEvidenceIntent, routeEnterpriseProofCandidates } from '../src/pipeline/enterprise-evidence-source-router.js';

test('enterprise proof intent routes only enterprise-private sources to formal proof lane', () => {
  const requirement = { text: '企业应证明自身具备与公开规范相符的实施能力。', requirement_category: 'technical' };
  assert.equal(classifyEnterpriseEvidenceIntent(requirement), 'ENTERPRISE_PRODUCT_CAPABILITY');
  const result = routeEnterpriseProofCandidates({ requirement, candidates: [
    { chunk_id: 'private', project_id: 'project-1', corpus_scope: 'ENTERPRISE_PRIVATE', source_authority: 'enterprise_private', lifecycle_status: 'ACTIVE', review_status: 'approved', usage_status: 'ACTIVE_FULLTEXT', index_status: 'NOT_INDEXED', effective_status: 'current_status_required' },
    { chunk_id: 'industry', project_id: 'public', corpus_scope: 'GOVERNMENT_ENTERPRISE', source_type: 'official_standard', source_authority: 'official', lifecycle_status: 'ACTIVE', review_status: 'approved', usage_status: 'ACTIVE_FULLTEXT', index_status: 'INDEXED', effective_status: 'current', subject_match: false, entity_match: false, scope_match: false }
  ] });
  assert.deepEqual(result.proof_candidates.map(item => item.chunk_id), []);
  assert.deepEqual(result.reference_candidates.map(item => item.chunk_id), ['private', 'industry']);
  assert.deepEqual(result.out_of_scope_candidates.map(item => item.chunk_id), []);
  assert.equal(result.reference_candidates[1].source_route, 'REFERENCE_CONTEXT');
  assert.equal(result.reference_candidates[1].proof_capable, false);
});

test('explicit project-private proof metadata is eligible and external authoritative evidence can be eligible', () => {
  const requirement = { project_id: 'project-1', text: '企业应证明自身具备同类项目实施能力。', requirement_category: 'project' };
  const result = routeEnterpriseProofCandidates({ requirement, candidates: [
    { chunk_id: 'private', project_id: 'project-1', corpus_scope: 'ENTERPRISE_PRIVATE', source_authority: 'enterprise_private', lifecycle_status: 'ACTIVE', review_status: 'approved', usage_status: 'ACTIVE_FULLTEXT', index_status: 'NOT_INDEXED', effective_status: 'current_status_required' },
    { chunk_id: 'cert', corpus_scope: 'GOVERNMENT_ENTERPRISE', source_type: 'third_party_certification', source_authority: 'third_party_authority', lifecycle_status: 'ACTIVE', review_status: 'approved', usage_status: 'ACTIVE_EXCERPT', index_status: 'INDEXED', effective_status: 'current', subject_match: true, entity_match: true, scope_match: true },
    { chunk_id: 'expired', corpus_scope: 'GOVERNMENT_ENTERPRISE', source_type: 'third_party_certification', source_authority: 'third_party_authority', lifecycle_status: 'ACTIVE', review_status: 'approved', usage_status: 'ACTIVE_EXCERPT', index_status: 'INDEXED', effective_status: 'expired', subject_match: true, entity_match: true, scope_match: true }
  ] });
  assert.deepEqual(result.proof_candidates.map(item => item.chunk_id), ['private', 'cert']);
  assert.deepEqual(result.out_of_scope_candidates.map(item => item.chunk_id), ['expired']);
  assert.equal(result.proof_candidates.every(item => item.proof_eligibility === 'PROOF_ELIGIBLE'), true);
});

test('generic industry reference is never proof eligible without explicit subject/entity/scope proof', () => {
  const requirement = { project_id: 'project-1', text: '企业应证明自身具备产品能力。', requirement_category: 'product' };
  const result = routeEnterpriseProofCandidates({ requirement, candidates: [
    { chunk_id: 'standard', corpus_scope: 'GOVERNMENT_ENTERPRISE', source_type: 'official_standard', source_authority: 'official', lifecycle_status: 'ACTIVE', review_status: 'approved', usage_status: 'ACTIVE_FULLTEXT', index_status: 'INDEXED', effective_status: 'current' }
  ] });
  assert.equal(result.proof_candidates.length, 0);
  assert.equal(result.reference_candidates[0].proof_eligibility, 'REFERENCE_CONTEXT');
});

test('non enterprise-proof technical retrieval remains unchanged', () => {
  const candidates = [{ chunk_id: 'a', corpus_scope: 'GOVERNMENT_ENTERPRISE' }];
  const result = routeEnterpriseProofCandidates({ requirement: { text: '系统应支持数据交换。', requirement_category: 'technical' }, candidates });
  assert.equal(result.intent, null);
  assert.deepEqual(result.proof_candidates, candidates);
  assert.equal(result.reference_candidates.length, 0);
});
