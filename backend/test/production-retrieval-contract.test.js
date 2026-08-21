import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CANDIDATE_K,
  REVIEW_K,
  MAX_RERANK_SHIFT,
  DYNAMIC_TOP_K_ENABLED,
  EVIDENCE_NEED_BUCKETING_ENABLED,
  createEmbeddingQuery,
  rerankCandidatesV1,
} from '../eval/production-retrieval-contract/production-retrieval-contract-v1.js';

const input = (overrides = {}) => ({
  project_id: 'project-1',
  requirement_id: 'REQ-001',
  requirement_text: '系统应支持数据交换。',
  requirement_role: { status: 'approved', value: 'interface_integration' },
  evidence_needs: [{ status: 'approved', value: 'project_case' }],
  corpus_scope: { project_id: 'project-1', evidence_origin: 'enterprise' },
  embedding_identity: { model: 'model-a', version: '1', candidate_k: 20 },
  ...overrides,
});

const candidates = (count = 20) => Array.from({ length: count }, (_, index) => ({
  source_document_id: `doc-${String(index + 1).padStart(2, '0')}`,
  source_chunk_id: `chunk-${String(index + 1).padStart(2, '0')}`,
  raw_vector_rank: index + 1,
  raw_similarity: 1 - index / 100,
  content_role: index === 3 ? 'project_case' : 'technical_reference',
  role_compatibility: index === 3 ? 'preferred' : 'weak',
  matched_evidence_needs: index === 3 ? ['project_case'] : [],
}));

test('v1 freezes candidate_k=20, review_k=8 and a bounded rerank shift', () => {
  assert.equal(CANDIDATE_K, 20);
  assert.equal(REVIEW_K, 8);
  assert.equal(MAX_RERANK_SHIFT, 4);
});

test('original Canonical Requirement text is the only embedding query', () => {
  assert.equal(createEmbeddingQuery(input()), '系统应支持数据交换。');
  assert.throws(() => createEmbeddingQuery(input({ evidence_need_query: '项目案例' })), /not part/);
  assert.throws(() => createEmbeddingQuery(input({ role_query: '接口集成' })), /not part/);
});

test('unknown compatibility remains in the complete candidate list', () => {
  const raw = candidates();
  raw[0].role_compatibility = 'unknown';
  const result = rerankCandidatesV1(input(), raw);
  assert.equal(result.reranked_candidates.length, 20);
  assert.ok(result.reranked_candidates.some((candidate) => candidate.source_chunk_id === raw[0].source_chunk_id));
});

test('missing or unknown semantic metadata falls back exactly to Raw Vector order', () => {
  const raw = candidates();
  const result = rerankCandidatesV1(input({ requirement_role: { status: 'pending', value: 'unknown' } }), raw);
  assert.equal(result.fallback_mode, 'raw_vector');
  assert.deepEqual(result.reranked_candidates.map((x) => x.source_chunk_id), raw.map((x) => x.source_chunk_id));
  assert.ok(result.reranked_candidates.every((x) => x.rerank_reasons.includes('RAW_VECTOR_FALLBACK')));
});

test('rerank never hard-excludes weak or incompatible candidates', () => {
  const raw = candidates();
  raw[1].role_compatibility = 'incompatible';
  const result = rerankCandidatesV1(input(), raw);
  assert.equal(result.raw_candidates.length, result.reranked_candidates.length);
  assert.deepEqual(new Set(result.raw_candidates.map((x) => x.source_chunk_id)), new Set(result.reranked_candidates.map((x) => x.source_chunk_id)));
});

test('ordering and stable tie-break are deterministic', () => {
  const raw = candidates();
  raw[0].raw_vector_rank = 1;
  raw[1].raw_vector_rank = 1;
  raw[0].raw_similarity = raw[1].raw_similarity;
  const first = rerankCandidatesV1(input(), raw);
  const second = rerankCandidatesV1(input(), [...raw].reverse());
  assert.deepEqual(first.reranked_candidates.map((x) => x.source_chunk_id), second.reranked_candidates.map((x) => x.source_chunk_id));
});

test('final candidates contain required explainability and version audit', () => {
  const result = rerankCandidatesV1(input(), candidates());
  assert.equal(result.final_candidates.length, 8);
  assert.equal(result.embedding_query, input().requirement_text);
  for (const candidate of result.final_candidates) {
    for (const field of ['raw_vector_rank', 'raw_similarity', 'reranked_rank', 'content_role', 'role_compatibility', 'matched_evidence_needs', 'rerank_reasons', 'rerank_version', 'source_document_id', 'source_chunk_id']) {
      assert.ok(Object.hasOwn(candidate, field), `missing ${field}`);
    }
  }
  assert.equal(result.retrieval_contract_version, '4.3-production-retrieval-v1');
  assert.equal(result.embedding_model, 'model-a');
  assert.equal(result.embedding_version, '1');
});

test('Need Bucketing and Dynamic Top-K remain disabled and outside input contract', () => {
  assert.equal(EVIDENCE_NEED_BUCKETING_ENABLED, false);
  assert.equal(DYNAMIC_TOP_K_ENABLED, false);
  assert.throws(() => rerankCandidatesV1(input({ per_need_k: 1 }), candidates()), /not part/);
  assert.throws(() => rerankCandidatesV1(input({ dynamic_top_k: true }), candidates()), /not part/);
});
