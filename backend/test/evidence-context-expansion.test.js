import test from 'node:test';
import assert from 'node:assert/strict';
import { expandEvidenceContext } from '../src/pipeline/evidence-context-expansion.js';

const material = { id: 'MAT-1', original_name: 'performance.md', material_type: 'product_documentation', corpus_scope: 'ENTERPRISE_PRIVATE', owner: 'Synthetic Vendor' };

test('exact span remains separate while same paragraph and table header context are recovered', () => {
  const chunk = {
    chunk_id: 'CH-1', material_id: 'MAT-1', chunk_index: 1, section: '性能测试',
    source_text: '指标：接口响应时间 | 单位：秒\nP95：1.9 秒\n备注：缓存预热后执行。'
  };
  const result = expandEvidenceContext({
    exactSpan: { source_span_id: 'SPAN-1', source_id: 'CH-1', anchor_chunk_id: 'CH-1', source_text: 'P95：1.9 秒' },
    material, chunks: [chunk], missingDimensions: ['quantitative_match', 'scope_match']
  });
  assert.equal(result.exact_evidence_span.source_text, 'P95：1.9 秒');
  assert.ok(result.context_window.some(item => item.origin === 'TABLE_HEADER'));
  assert.ok(result.context_window.some(item => item.origin === 'SECTION_HEADING'));
  assert.equal(result.crossed_material_boundary, false);
  assert.equal(result.recovered_dimensions.quantitative_match.origin, 'EXACT_SPAN');
  assert.equal(result.recovered_dimensions.scope_match.origin, 'MATERIAL_METADATA');
  assert.deepEqual(result.unresolved_dimensions, []);
});

test('adjacent chunks are bounded to the same document and carry explicit origin', () => {
  const chunks = [
    { chunk_id: 'CH-0', material_id: 'MAT-1', chunk_index: 0, source_text: '项目主体：Synthetic Vendor。', document_id: 'DOC-1' },
    { chunk_id: 'CH-1', material_id: 'MAT-1', chunk_index: 1, source_text: '证书编号：CM-1。', document_id: 'DOC-1' },
    { chunk_id: 'CH-2', material_id: 'MAT-2', chunk_index: 2, source_text: '其他材料，不得跨材料合并。', document_id: 'DOC-2' }
  ];
  const result = expandEvidenceContext({
    exactSpan: { source_span_id: 'SPAN-2', source_id: 'CH-1', anchor_chunk_id: 'CH-1', source_text: '证书编号：CM-1。' },
    material, chunks, missingDimensions: ['subject_match']
  });
  assert.ok(result.context_window.some(item => item.origin === 'ADJACENT_CHUNK' && item.chunk_id === 'CH-0'));
  assert.equal(result.context_window.some(item => item.chunk_id === 'CH-2'), false);
  assert.equal(result.recovery_state, 'RESOLVED_BY_RETRIEVAL_EXPANSION');
});

test('missing dimensions remain unresolved instead of being inferred from a generic heading', () => {
  const result = expandEvidenceContext({
    exactSpan: { source_span_id: 'SPAN-3', source_id: 'CH-3', anchor_chunk_id: 'CH-3', source_text: '方案说明。' },
    material: { id: 'MAT-3', original_name: 'note.md' },
    chunks: [{ chunk_id: 'CH-3', material_id: 'MAT-3', chunk_index: 0, section: '技术方案', source_text: '方案说明。' }],
    missingDimensions: ['subject_match', 'scope_match']
  });
  assert.equal(result.recovery_state, 'UNRESOLVED_AFTER_CONTEXT');
  assert.deepEqual(result.unresolved_dimensions, ['subject_match', 'scope_match']);
});
