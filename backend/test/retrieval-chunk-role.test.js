import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyRetrievalChunkRole,
  isFormalEvidenceChunkEligible,
  partitionRetrievalCandidates
} from '../src/pipeline/retrieval-chunk-role.js';

test('deterministic chunk roles keep headings and metadata available for context', () => {
  assert.equal(classifyRetrievalChunkRole({ source_text: '# ISO 27001 受控记录' }).role, 'HEADING');
  assert.equal(classifyRetrievalChunkRole({ source_text: 'material_id: MAT-1\ndocument_id: DOC-1' }).role, 'METADATA');
  assert.equal(classifyRetrievalChunkRole({ source_text: '| 参数 | 结果 |\n|---|---|\n| P95 | 1.9 秒 |' }).role, 'TABLE_ROW');
  assert.equal(classifyRetrievalChunkRole({ source_text: '状态：active\n有效至：2027-11-30' }).role, 'BUSINESS_CONTENT');
});

test('formal evidence lane excludes non-evidence roles unless requirement asks for metadata', () => {
  const requirement = { text: '企业应提供 ISO/IEC 27001 认证信息。', requirement_category: 'qualification' };
  assert.equal(isFormalEvidenceChunkEligible({ requirement, candidate: { chunk_role: 'HEADING' } }), false);
  assert.equal(isFormalEvidenceChunkEligible({ requirement, candidate: { chunk_role: 'METADATA' } }), false);
  assert.equal(isFormalEvidenceChunkEligible({ requirement: { text: '请提供文件编号。', requirement_category: 'metadata' }, candidate: { chunk_role: 'METADATA' } }), true);
});

test('candidate partition preserves business order and marks excluded context', () => {
  const requirement = { text: '企业应提供性能测试记录。', requirement_category: 'technical' };
  const result = partitionRetrievalCandidates({ requirement, candidates: [
    { chunk_id: 'heading', source_text: '# 性能测试记录', similarity_score: 0.99 },
    { chunk_id: 'business', source_text: '结果：平均 1.4 秒，P95 1.9 秒。', similarity_score: 0.8 },
    { chunk_id: 'front', source_text: '目录\n投标邀请', similarity_score: 0.7 }
  ] });
  assert.deepEqual(result.eligible_candidates.map((item) => item.chunk_id), ['business']);
  assert.deepEqual(result.excluded_candidates.map((item) => item.chunk_id), ['heading', 'front']);
  assert.equal(result.internal_candidate_pool_size, 3);
  assert.equal(result.eligible_candidate_pool_size, 1);
  assert.equal(result.all_candidates[0].candidate_eligibility, 'CONTEXT_ONLY');
});
