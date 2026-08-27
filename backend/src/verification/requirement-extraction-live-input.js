import { chunkExtractedText } from '../pipeline/requirement-chunker.js';

const SINGLE_CALL_THRESHOLD = 8_000;
const CHARACTER_BUDGET = 8_000;
const TOKEN_BUDGET = 8_000;

/**
 * Build the in-memory input used by the single-call live harness from a raw
 * extracted chunk.  The production chunker remains the only owner of span
 * identifiers and model_text construction; this helper only supplies the
 * paragraph snapshot that the chunker requires.
 */
export function buildRequirementExtractionLiveRequest({
  text,
  fileName = 'FAST-01',
  projectName = 'FAST-01',
  sectionName = 'verification'
} = {}) {
  if (typeof text !== 'string' || !text.trim()) return null;
  const normalizedText = text.replace(/\r\n?/g, '\n');
  const paragraphs = [];
  let cursor = 0;
  let paragraphNumber = 1;
  for (const line of normalizedText.split('\n')) {
    const value = line.trim();
    if (value) {
      const relativeStart = line.indexOf(value);
      const start = cursor + (relativeStart >= 0 ? relativeStart : 0);
      paragraphs.push({
        paragraph: paragraphNumber++,
        page: 1,
        text: value,
        source_start_offset: start,
        source_end_offset: start + value.length
      });
    }
    cursor += line.length + 1;
  }
  const chunks = chunkExtractedText({
    text: normalizedText,
    paragraphs,
    singleCallThreshold: SINGLE_CALL_THRESHOLD,
    characterBudget: CHARACTER_BUDGET,
    tokenBudget: TOKEN_BUDGET
  });
  if (chunks.length !== 1) {
    throw Object.assign(new Error('Live harness input must resolve to exactly one chunk.'), {
      code: 'LIVE_CHUNKING_REQUIRED'
    });
  }
  const chunk = chunks[0];
  return {
    fileName,
    text: chunk.text,
    paragraphs,
    chunk,
    projectName,
    sectionName,
    chunkCount: 1
  };
}

