import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyEnterpriseEvidenceIntent, routeEnterpriseProofCandidates } from '../src/pipeline/enterprise-evidence-source-router.js';

test('enterprise proof intent routes only enterprise-private sources to formal proof lane', () => {
  const requirement = { text: '企业应证明自身具备与公开规范相符的实施能力。', requirement_category: 'technical' };
  assert.equal(classifyEnterpriseEvidenceIntent(requirement), 'ENTERPRISE_PRODUCT_CAPABILITY');
  const result = routeEnterpriseProofCandidates({ requirement, candidates: [
    { chunk_id: 'private', corpus_scope: 'ENTERPRISE_PRIVATE' },
    { chunk_id: 'industry', corpus_scope: 'GOVERNMENT_ENTERPRISE' }
  ] });
  assert.deepEqual(result.proof_candidates.map(item => item.chunk_id), ['private']);
  assert.deepEqual(result.reference_candidates.map(item => item.chunk_id), ['industry']);
  assert.equal(result.reference_candidates[0].source_route, 'REFERENCE_CONTEXT');
  assert.equal(result.reference_candidates[0].proof_capable, false);
});

test('non enterprise-proof technical retrieval remains unchanged', () => {
  const candidates = [{ chunk_id: 'a', corpus_scope: 'GOVERNMENT_ENTERPRISE' }];
  const result = routeEnterpriseProofCandidates({ requirement: { text: '系统应支持数据交换。', requirement_category: 'technical' }, candidates });
  assert.equal(result.intent, null);
  assert.deepEqual(result.proof_candidates, candidates);
  assert.equal(result.reference_candidates.length, 0);
});
