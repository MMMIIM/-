import test from 'node:test';
import assert from 'node:assert/strict';
import { replayCase } from '../eval/evidence-support/calibration-v2/replay-retrieval-substantive-hygiene.js';

test('offline replay separates Gold Evidence from Gold Context and rejects fragments', () => {
  const item = {
    case_id: 'V2R-001-PERF-DIRECT',
    requirement: '企业应提供性能测试记录。',
    gold_evidence_set: [
      { chunk_id: 'FACT', chunk_role: 'BUSINESS_CONTENT', source_hash: 'h1' },
      { chunk_id: 'HEADING', chunk_role: 'HEADING', source_hash: 'h2' }
    ],
    candidate_hygiene: {
      all_candidates: [
        { chunk_id: 'HEADING', raw_vector_rank: 1, source_text: '# 性能测试记录' },
        { chunk_id: 'FRAGMENT', raw_vector_rank: 2, source_text: '必须明确：' },
        { chunk_id: 'FACT', raw_vector_rank: 3, source_text: '结果：P95 = 1.9 秒。' }
      ]
    }
  };
  const integrity = {
    candidate_reclassification: [
      { case_id: item.case_id, chunk_id: 'FACT', GPT_REVIEW_EXPECTED_CLASSIFICATION: 'EVIDENCE_BEARING' }
    ]
  };
  const result = replayCase(item, integrity);
  assert.deepEqual(result.gold_evidence_set.map((entry) => entry.chunk_id), ['FACT']);
  assert.deepEqual(result.gold_context_set.map((entry) => entry.chunk_id), ['HEADING']);
  assert.equal(result.rejected_fragment_count, 1);
  assert.deepEqual(result.post_v1.phase_candidates.map((entry) => entry.chunk_id), ['FRAGMENT', 'FACT']);
  assert.deepEqual(result.post_v2.phase_candidates.map((entry) => entry.chunk_id), ['FACT']);
  assert.equal(result.post_v2.metrics.decision_bearing.hit_at_1, 1);
});

