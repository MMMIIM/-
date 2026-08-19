import test from 'node:test';
import assert from 'node:assert/strict';
import { SourceLocationResolver, parseSourceHint } from '../src/pipeline/source-location-resolver.js';
import { validateRequirementExtractionEnvelope } from '../src/pipeline/requirement-extraction.js';

const chunk = {
  id: '11111111-1111-4111-8111-111111111111', chunk_number: 1,
  source_start_offset: 0, source_end_offset: 100,
  segments: [
    { paragraph: 5, page: 2, text: '5.1 系统应记录审计日志。', source_start_offset: 0, source_end_offset: 15, source_section: '第四章', source_clause_id: '5.1' },
    { paragraph: 8, page: 3, text: '重复来源条款。', source_start_offset: 16, source_end_offset: 23, source_section: '第四章', source_clause_id: '5.2' },
    { paragraph: 12, page: 4, text: '重复来源条款。', source_start_offset: 24, source_end_offset: 31, source_section: '第四章', source_clause_id: '5.3' }
  ]
};

test('source_paragraph number、数字字符串和第N段只转为 source_hint', () => {
  assert.equal(parseSourceHint(123).hint, 123);
  assert.equal(parseSourceHint('123').hint, 123);
  assert.equal(parseSourceHint('第123段').hint, 123);
  assert.equal(parseSourceHint([123, 124]).hint, 123);
});

test('无效 source_paragraph 被忽略并产生 warning', () => {
  const result = parseSourceHint('第十二段附近');
  assert.equal(result.hint, null);
  assert.equal(result.warning.code, 'SOURCE_HINT_IGNORED');
});

test('唯一 source_text 匹配由后端生成真实页码、段落和 hash，模型 hint 不可覆盖', () => {
  const result = new SourceLocationResolver().resolve({ source_text: '系统应记录审计日志。', source_clause: '5.1', source_hint: 123 }, chunk);
  assert.equal(result.warning, null);
  assert.equal(result.location.source_paragraph, 5);
  assert.equal(result.location.source_page, 2);
  assert.match(result.location.source_hash, /^[a-f0-9]{64}$/);
  assert.equal(result.location.source_chunk_id, chunk.id);
});

test('唯一来源解析保留同条款连续证据上下文供 confirmation policy 使用',()=>{const local={...chunk,segments:[{text:'系统应支持数据同步。',page:2,paragraph:5,source_clause_id:'5.1',source_start_offset:0,source_end_offset:10},{text:'备注：平台名称、接口方式和数据范围由实施阶段双方确认。',page:2,paragraph:6,source_clause_id:'5.1',source_start_offset:11,source_end_offset:40}]};const result=new SourceLocationResolver().resolve({source_text:'系统应支持数据同步。',source_clause:'5.1'},local);assert.equal(result.location.source_verified,true);assert.match(result.location.source_context_text,/实施阶段双方确认/);});

test('重复匹配无法唯一消歧时不伪造位置并产生 SOURCE_LOCATION_AMBIGUOUS', () => {
  const result = new SourceLocationResolver().resolve({ source_text: '重复来源条款。' }, chunk);
  assert.equal(result.location.source_paragraph, null);
  assert.equal(result.location.source_page, null);
  assert.equal(result.location.source_hash, null);
  assert.equal(result.warning.code, 'SOURCE_LOCATION_AMBIGUOUS');
});

test('source_clause 或合法 hint 可辅助选择重复来源', () => {
  const byClause = new SourceLocationResolver().resolve({ source_text: '重复来源条款。', source_clause: '5.3' }, chunk);
  const byHint = new SourceLocationResolver().resolve({ source_text: '重复来源条款。', source_hint: 8 }, chunk);
  assert.equal(byClause.location.source_paragraph, 12);
  assert.equal(byHint.location.source_paragraph, 8);
});

test('无法匹配时保留 source_text/chunk_id，但不创建错误来源', () => {
  const result = new SourceLocationResolver().resolve({ source_text: '不存在的来源。' }, chunk);
  assert.equal(result.location.source_text, '不存在的来源。');
  assert.equal(result.location.source_chunk_id, chunk.id);
  assert.equal(result.location.source_paragraph, null);
  assert.equal(result.warning.code, 'SOURCE_LOCATION_UNRESOLVED');
});

test('source_text 为空仍为非法候选', () => {
  assert.throws(() => new SourceLocationResolver().resolve({ source_text: '' }, chunk), (error) => error.code === 'GATEWAY_REQUIREMENTS_INVALID');
});

test('Schema Adapter 接受历史位置格式但只输出 hint，不信任模型页码', () => {
  const response = validateRequirementExtractionEnvelope({
    envelope: { schema_version: '4.3-requirement-extraction', task_type: 'requirement_extraction', status: 'success', warnings: [], data: { requirements: [
      { content: '记录日志', source_excerpt: '系统应记录审计日志。', source_page: 999, source_paragraph: '第123段' }
    ] } }, audit: {}
  });
  assert.equal(response.candidates[0].source_hint, 123);
  assert.equal(Object.hasOwn(response.candidates[0], 'source_page'), false);
  assert.equal(Object.hasOwn(response.candidates[0], 'source_paragraph'), false);
});
