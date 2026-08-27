import test from 'node:test';
import assert from 'node:assert/strict';
import {
  chunkExtractedText,
  mapRequirementCandidateToCanonicalInput,
  resolveRequirementChunkBudget
} from '../src/pipeline/requirement-chunker.js';
import { SourceLocationResolver } from '../src/pipeline/source-location-resolver.js';

test('chunker assigns deterministic Cxxx-Sxxx span ids and an annotated model text', () => {
  const text = '第一段要求。\n第二段要求。';
  const chunks = chunkExtractedText({
    text,
    paragraphs: [
      { paragraph: 1, page: 1, text: '第一段要求。', source_start_offset: 0, source_end_offset: 6 },
      { paragraph: 2, page: 1, text: '第二段要求。', source_start_offset: 7, source_end_offset: 13 }
    ],
    singleCallThreshold: 1000,
    characterBudget: 100,
    tokenBudget: 100
  });
  assert.equal(chunks.length, 1);
  assert.equal(chunks[0].text, text);
  assert.deepEqual(chunks[0].segments.map((segment) => segment.source_ref), ['C001-S001', 'C001-S002']);
  assert.match(chunks[0].model_text, /\[C001-S001\] 第一段要求。/);
  assert.match(chunks[0].model_text, /\[C001-S002\] 第二段要求。/);
});

test('3,000 字符以内保持单片，超过上限进入段落分片', () => {
  const paragraph = (text, number) => ({ paragraph: number, page: 1, text });
  const exactlyAtLimit = 'a'.repeat(3_000);
  const atLimit = chunkExtractedText({
    text: exactlyAtLimit,
    paragraphs: [paragraph(exactlyAtLimit, 1)],
    singleCallThreshold: 3_000,
    characterBudget: 3_000,
    tokenBudget: 8_000
  });
  assert.equal(atLimit.length, 1);
  assert.equal(atLimit[0].character_count, 3_000);

  const overLimit = ['a'.repeat(2_000), 'b'.repeat(1_500)].join('\n');
  const chunks = chunkExtractedText({
    text: overLimit,
    paragraphs: [paragraph('a'.repeat(2_000), 1), paragraph('b'.repeat(1_500), 2)],
    singleCallThreshold: 3_000,
    characterBudget: 3_000,
    tokenBudget: 8_000
  });
  assert.ok(chunks.length > 1);
  assert.ok(chunks.every((chunk) => chunk.character_count <= 3_000));
});

test('4,930 字符 FAST-01 窗口按自然段分片，单片同时受 token 上限约束', () => {
  const paragraphTexts = [
    ...Array.from({ length: 254 }, () => '中'.repeat(18)),
    '中'.repeat(104)
  ];
  const text = paragraphTexts.join('\n');
  const chunks = chunkExtractedText({
    text,
    paragraphs: paragraphTexts.map((value, index) => ({ paragraph: index + 1, page: 1, text: value })),
    singleCallThreshold: 3_000,
    characterBudget: 3_000,
    tokenBudget: 8_000
  });
  assert.ok(chunks.length > 1);
  assert.ok(chunks.every((chunk) => chunk.character_count <= 3_000));
  assert.deepEqual(chunks.flatMap((chunk) => chunk.segments).map((segment) => segment.text), paragraphTexts);

  const punctuation = '.'.repeat(8_000);
  assert.throws(() => chunkExtractedText({
    text: punctuation,
    paragraphs: [{ paragraph: 1, page: 1, text: punctuation }],
    singleCallThreshold: 3_000,
    characterBudget: 3_000,
    tokenBudget: 7_999
  }), (error) => error.code === 'REQUIREMENT_SOURCE_SPAN_EXCEEDS_BUDGET');
});

test('model Candidate cannot inject canonical source_text/source_clause, while source_refs remain accepted', () => {
  const candidate = {
    text: '系统应记录日志。', category: 'technical', source_refs: ['C001-S001'],
    mandatory_observed: true, requires_confirmation: false
  };
  const mapped = mapRequirementCandidateToCanonicalInput(candidate, 1);
  assert.equal(mapped.content, candidate.text);
  assert.deepEqual(mapped.sources[0].source_refs, candidate.source_refs);
  assert.equal(mapped.sources[0].source_text, null);
  assert.equal(mapRequirementCandidateToCanonicalInput({ ...candidate, source_text: '伪造原文' }, 1), null);
  assert.equal(mapRequirementCandidateToCanonicalInput({ ...candidate, source_clause: '5.1' }, 1), null);
  assert.equal(mapRequirementCandidateToCanonicalInput({ ...candidate, content: 'legacy' }, 1), null);
  assert.equal(mapRequirementCandidateToCanonicalInput({ ...candidate, source_excerpt: 'legacy' }, 1), null);
});

test('production semantic budget of 3,000 chars splits a dense 4,930-char window without losing spans', () => {
  const paragraphTexts = [
    ...Array.from({ length: 254 }, () => '中'.repeat(18)),
    '中'.repeat(104)
  ];
  const text = paragraphTexts.join('\n');
  assert.equal(text.length, 4_930);
  const paragraphs = paragraphTexts.map((value, index) => ({
    paragraph: index + 1,
    page: 1,
    text: value
  }));
  const budget = resolveRequirementChunkBudget({});
  assert.equal(budget.singleCallThreshold, 3_000);
  assert.equal(budget.characterBudget, 3_000);
  const chunks = chunkExtractedText({ text, paragraphs, ...budget });
  assert.ok(chunks.length > 1);
  assert.ok(chunks.every((chunk) => chunk.character_count <= 3_000));
  const segments = chunks.flatMap((chunk) => chunk.segments);
  assert.equal(segments.length, paragraphs.length);
  assert.deepEqual(segments.map((segment) => segment.text), paragraphTexts);
  assert.equal(new Set(segments.map((segment) => segment.source_ref)).size, segments.length);
  assert.deepEqual(chunkExtractedText({ text, paragraphs, ...budget }), chunks);
  const resolver = new SourceLocationResolver();
  for (const chunk of chunks) {
    const resolved = resolver.resolve({ source_refs: chunk.segments.map((segment) => segment.source_ref) }, chunk);
    assert.equal(resolved.location.source_verified, true);
  }
});

test('single-call threshold cannot bypass the 3,000-character window budget', () => {
  const paragraphs = [
    { paragraph: 1, page: 1, text: '甲'.repeat(1_800) },
    { paragraph: 2, page: 1, text: '乙'.repeat(1_800) }
  ];
  const text = paragraphs.map((item) => item.text).join('\n');
  const chunks = chunkExtractedText({
    text,
    paragraphs,
    singleCallThreshold: 8_000,
    characterBudget: 3_000,
    tokenBudget: 8_000
  });
  assert.ok(chunks.length > 1);
  assert.ok(chunks.every((chunk) => chunk.character_count <= 3_000));
});

test('an indivisible source span larger than the semantic budget fails closed', () => {
  const oversized = '中'.repeat(3_001);
  assert.throws(() => chunkExtractedText({
    text: oversized,
    paragraphs: [{ paragraph: 1, page: 1, text: oversized }],
    singleCallThreshold: 3_000,
    characterBudget: 3_000,
    tokenBudget: 8_000
  }), (error) => error.code === 'REQUIREMENT_SOURCE_SPAN_EXCEEDS_BUDGET');
});
