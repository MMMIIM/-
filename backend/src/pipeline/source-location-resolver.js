import { createHash } from 'node:crypto';

const PUNCTUATION = new Map([
  ['，', ','], ['。', '.'], ['：', ':'], ['；', ';'], ['！', '!'], ['？', '?'],
  ['（', '('], ['）', ')'], ['【', '['], ['】', ']'], ['“', '"'], ['”', '"'],
  ['‘', "'"], ['’', "'"], ['、', ',']
]);

export const SOURCE_MATCH_TYPES = Object.freeze({
  EXACT_SINGLE: 'exact_single_paragraph', NORMALIZED_SINGLE: 'normalized_single_paragraph',
  EXACT_MULTI: 'exact_multi_paragraph_span', NORMALIZED_MULTI: 'normalized_multi_paragraph_span',
  AMBIGUOUS: 'ambiguous', SUGGESTED: 'suggested', UNRESOLVED: 'unresolved'
});

export function normalizeSourceText(value) {
  return String(value || '').normalize('NFKC').replace(/\r\n?/g, '\n').split('')
    .map((character) => PUNCTUATION.get(character) || character).join('')
    .replace(/([\u3400-\u9fff])\n(?=[\u3400-\u9fff])/g, '$1').replace(/\s+/g, '').trim();
}

export function hashSource(value) {
  return createHash('sha256').update(String(value || ''), 'utf8').digest('hex');
}

const raw = (value) => String(value || '').replace(/\r\n?/g, '\n').trim();

function location(match, chunk, matchType, score = 1) {
  const first = match.segments[0];
  const last = match.segments.at(-1);
  const pages = match.segments.map((item) => item.page).filter(Number.isInteger);
  const original = match.segments.map((item) => item.text).join('\n');
  const clauseIds = [...new Set(match.segments.map((item) => item.source_clause_id).filter(Boolean))];
  const contextSegments = clauseIds.length === 1
    ? (chunk.segments || []).filter((item) => item.source_clause_id === clauseIds[0])
    : match.segments;
  return {
    source_context_text: contextSegments.map((item) => item.text).join('\n'),
    source_page: pages[0] ?? null, source_paragraph: first.paragraph ?? null,
    source_page_start: pages[0] ?? null, source_page_end: pages.at(-1) ?? null,
    source_paragraph_start: first.paragraph ?? null, source_paragraph_end: last.paragraph ?? null,
    source_paragraphs_json: match.segments.map((item) => ({ paragraph: item.paragraph, page: item.page ?? null, text_hash: hashSource(item.text) })),
    source_hash: hashSource(original), source_start_offset: first.source_start_offset ?? chunk.source_start_offset ?? null,
    source_end_offset: last.source_end_offset ?? chunk.source_end_offset ?? null,
    source_section: first.source_section || null, source_clause_id: first.source_clause_id || null,
    source_chunk_id: chunk.id || chunk.chunk_id || null, source_match_type: matchType,
    source_match_score: score, source_resolution_status: 'verified',
    source_resolution_method: 'automatic', source_verified: true
  };
}

function hasClause(match, clause) {
  if (!clause) return true;
  return match.segments.some((item) => item.source_clause_id === clause || raw(item.text).startsWith(clause));
}

function choose(matches, candidate) {
  let selected = matches;
  if (selected.length > 1 && candidate.source_clause) {
    const filtered = selected.filter((item) => hasClause(item, String(candidate.source_clause).trim()));
    if (filtered.length) selected = filtered;
  }
  if (selected.length > 1 && Number.isInteger(candidate.source_hint)) {
    const filtered = selected.filter((item) => candidate.source_hint >= item.segments[0].paragraph && candidate.source_hint <= item.segments.at(-1).paragraph);
    if (filtered.length) selected = filtered;
  }
  return selected;
}

function bigrams(value) {
  const text = normalizeSourceText(value); const set = new Set();
  for (let index = 0; index < text.length - 1; index += 1) set.add(text.slice(index, index + 2));
  return set;
}

function similarity(left, right) {
  const a = bigrams(left); const b = bigrams(right);
  if (!a.size || !b.size) return 0;
  let common = 0; for (const value of a) if (b.has(value)) common += 1;
  return common / (a.size + b.size - common);
}

function continuousMatches(segments, sourceText, normalizer, separator = '') {
  const parts = []; let cursor = 0;
  for (const segment of segments) {
    const value = normalizer(segment.text);
    const start = cursor; const end = start + value.length;
    parts.push({ segment, start, end }); cursor = end + separator.length;
  }
  const haystack = parts.map((item) => normalizer(item.segment.text)).join(separator);
  const needle = normalizer(sourceText);
  if (!needle) return [];
  const matches = []; let offset = 0;
  while (offset <= haystack.length - needle.length) {
    const start = haystack.indexOf(needle, offset);
    if (start < 0) break;
    const end = start + needle.length;
    const selected = parts.filter((item) => item.end > start && item.start < end).map((item) => item.segment);
    if (selected.length > 1) matches.push({ segments: selected });
    offset = start + 1;
  }
  return matches;
}

export class SourceLocationResolver {
  constructor({ maxSpanParagraphs = 8, suggestionThreshold = 0.68 } = {}) {
    this.maxSpanParagraphs = maxSpanParagraphs; this.suggestionThreshold = suggestionThreshold;
  }

  resolve(candidate, chunk) {
    const sourceText = String(candidate.source_text ?? candidate.source_excerpt ?? '').trim();
    if (!sourceText) throw Object.assign(new Error('候选需求必须提供 source_text。'), { code: 'GATEWAY_REQUIREMENTS_INVALID' });
    const segments = (chunk.segments || []).filter((item) => raw(item.text));
    const spans = [];
    for (let start = 0; start < segments.length; start += 1) {
      for (let length = 2; length <= this.maxSpanParagraphs && start + length <= segments.length; length += 1) {
        const range = segments.slice(start, start + length);
        spans.push({ segments: range, raw: range.map((item) => raw(item.text)).join('\n'), normalized: normalizeSourceText(range.map((item) => item.text).join('\n')) });
      }
    }
    const rawNeedle = raw(sourceText); const normalizedNeedle = normalizeSourceText(sourceText);
    const strategies = [
      [SOURCE_MATCH_TYPES.EXACT_SINGLE, segments.map((item) => ({ segments: [item], value: raw(item.text) })).filter((item) => item.value === rawNeedle || item.value.includes(rawNeedle))],
      [SOURCE_MATCH_TYPES.NORMALIZED_SINGLE, segments.map((item) => ({ segments: [item], value: normalizeSourceText(item.text) })).filter((item) => item.value === normalizedNeedle || item.value.includes(normalizedNeedle))],
      [SOURCE_MATCH_TYPES.EXACT_MULTI, continuousMatches(segments, sourceText, raw, '\n')],
      [SOURCE_MATCH_TYPES.NORMALIZED_MULTI, continuousMatches(segments, sourceText, normalizeSourceText)]
    ];
    for (const [matchType, possible] of strategies) {
      if (!possible.length) continue;
      const matches = choose(possible, candidate);
      if (matches.length === 1) return { location: { source_text: sourceText, ...location(matches[0], chunk, matchType) }, warning: null };
      return this.unverified(sourceText, candidate, chunk, SOURCE_MATCH_TYPES.AMBIGUOUS, null, 'SOURCE_LOCATION_AMBIGUOUS', '来源原文存在多处匹配，需人工确认。');
    }
    let best = null;
    for (const match of [...segments.map((item) => ({ segments: [item] })), ...spans]) {
      const score = similarity(sourceText, match.segments.map((item) => item.text).join('\n'));
      if (!best || score > best.score) best = { ...match, score };
    }
    if (best && best.score >= this.suggestionThreshold) {
      return { location: { source_text: sourceText, ...location(best, chunk, SOURCE_MATCH_TYPES.SUGGESTED, best.score), source_resolution_status: 'suggested', source_verified: false }, warning: { code: 'SOURCE_LOCATION_SUGGESTED', message: '存在来源建议匹配，需人工确认后方可进入基线。' } };
    }
    return this.unverified(sourceText, candidate, chunk, SOURCE_MATCH_TYPES.UNRESOLVED, best?.score ?? null, 'SOURCE_LOCATION_UNRESOLVED', '来源原文未能确定性定位，需人工确认或排除。');
  }

  unverified(sourceText, candidate, chunk, matchType, score, code, message) {
    return { location: {
      source_text: sourceText, source_context_text: null, source_page: null, source_paragraph: null,
      source_page_start: null, source_page_end: null, source_paragraph_start: null,
      source_paragraph_end: null, source_paragraphs_json: [], source_hash: null,
      source_start_offset: chunk.source_start_offset ?? null, source_end_offset: chunk.source_end_offset ?? null,
      source_section: null, source_clause_id: candidate.source_clause || null,
      source_chunk_id: chunk.id || chunk.chunk_id || null, source_match_type: matchType,
      source_match_score: score, source_resolution_status: 'unresolved',
      source_resolution_method: 'automatic', source_verified: false
    }, warning: { code, message } };
  }
}

export function parseSourceHint(value) {
  const values = Array.isArray(value) ? value : [value];
  for (const item of values) {
    if (Number.isInteger(item) && item >= 0) return { hint: item, warning: null };
    if (typeof item === 'string') {
      const trimmed = item.trim();
      if (/^\d+$/.test(trimmed)) return { hint: Number(trimmed), warning: null };
      const numbered = trimmed.match(/^第\s*(\d+)\s*段$/);
      if (numbered) return { hint: Number(numbered[1]), warning: null };
    }
  }
  return value === null || value === undefined ? { hint: null, warning: null }
    : { hint: null, warning: { code: 'SOURCE_HINT_IGNORED', message: '模型返回的来源段落提示格式无效，已忽略。' } };
}
