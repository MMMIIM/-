import test from 'node:test';
import assert from 'node:assert/strict';
import {
  chunkExtractedText,
  mapRequirementCandidateToCanonicalInput
} from '../src/pipeline/requirement-chunker.js';

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

test('8,000 字符以内保持单片，超过上限进入段落分片', () => {
  const paragraph = (text) => ({ paragraph: 1, page: 1, text });
  const exactlyAtLimit = 'a'.repeat(8_000);
  const atLimit = chunkExtractedText({
    text: exactlyAtLimit,
    paragraphs: [paragraph(exactlyAtLimit)],
    singleCallThreshold: 8_000,
    characterBudget: 8_000,
    tokenBudget: 8_000
  });
  assert.equal(atLimit.length, 1);
  assert.equal(atLimit[0].character_count, 8_000);

  const overLimit = 'a'.repeat(8_001);
  const chunks = chunkExtractedText({
    text: overLimit,
    paragraphs: [paragraph(overLimit)],
    singleCallThreshold: 8_000,
    characterBudget: 8_000,
    tokenBudget: 8_000
  });
  assert.ok(chunks.length > 1);
  assert.ok(chunks.every((chunk) => chunk.character_count <= 8_000));
});

test('4,930 字符 FAST-01 仍保持单片，单片同时受 token 上限约束', () => {
  const text = '中'.repeat(4_930);
  const chunks = chunkExtractedText({
    text,
    paragraphs: [{ paragraph: 1, page: 1, text }],
    singleCallThreshold: 8_000,
    characterBudget: 8_000,
    tokenBudget: 8_000
  });
  assert.equal(chunks.length, 1);
  assert.equal(chunks[0].character_count, 4_930);

  const punctuation = '.'.repeat(8_000);
  const tokenLimited = chunkExtractedText({
    text: punctuation,
    paragraphs: [{ paragraph: 1, page: 1, text: punctuation }],
    singleCallThreshold: 8_000,
    characterBudget: 8_000,
    tokenBudget: 7_999
  });
  assert.ok(tokenLimited.length > 1);
  assert.ok(tokenLimited.every((chunk) => chunk.estimated_token_count <= 7_999));
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
