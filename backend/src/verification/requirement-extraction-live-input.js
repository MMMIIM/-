import {
  chunkExtractedText,
  resolveRequirementChunkBudget
} from '../pipeline/requirement-chunker.js';

/**
 * Build the in-memory input used by the live harness from raw extracted text.
 * The production chunker remains the only owner of span identifiers and
 * model_text construction; this helper only supplies the paragraph snapshot
 * that the chunker requires.
 */
export function buildRequirementExtractionLiveRequest({
  text,
  fileName = 'FAST-01',
  projectName = 'FAST-01',
  sectionName = 'verification',
  env = process.env
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
  const budget = resolveRequirementChunkBudget(env);
  const chunks = chunkExtractedText({
    text: normalizedText,
    paragraphs,
    ...budget
  });
  return {
    fileName,
    text: normalizedText,
    paragraphs,
    chunks,
    // Preserve the single-window convenience property for callers that use
    // short verification inputs, while multi-window requests use `chunks`.
    chunk: chunks.length === 1 ? chunks[0] : null,
    projectName,
    sectionName,
    chunkCount: chunks.length
  };
}

