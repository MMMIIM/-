import { enrichMandatoryRequirement } from './mandatory-requirement.js';

const DEFAULT_SINGLE_CALL_THRESHOLD = 12_000;
const DEFAULT_CHARACTER_BUDGET = 8_000;
const DEFAULT_TOKEN_BUDGET = 8_000;

function positiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function resolveRequirementChunkBudget(env = {}) {
  return Object.freeze({
    singleCallThreshold: positiveInteger(
      env.REQUIREMENT_SINGLE_CALL_CHAR_THRESHOLD,
      DEFAULT_SINGLE_CALL_THRESHOLD
    ),
    characterBudget: positiveInteger(env.REQUIREMENT_CHUNK_CHAR_BUDGET, DEFAULT_CHARACTER_BUDGET),
    tokenBudget: positiveInteger(env.REQUIREMENT_CHUNK_TOKEN_BUDGET, DEFAULT_TOKEN_BUDGET)
  });
}

export function estimateTokenCount(text) {
  const value = String(text || '');
  const cjkCount = (value.match(/[\u3400-\u9fff\uf900-\ufaff]/g) || []).length;
  const nonCjk = value.replace(/[\u3400-\u9fff\uf900-\ufaff]/g, ' ');
  const latinTokens = (nonCjk.match(/[A-Za-z0-9_]+|[^\sA-Za-z0-9_]/g) || [])
    .reduce((count, token) => count + (/^[A-Za-z0-9_]+$/.test(token) ? Math.ceil(token.length / 4) : 1), 0);
  return Math.max(1, cjkCount + latinTokens);
}

export function isTitleBoundary(text) {
  const value = String(text || '').trim();
  if (!value || value.length > 80) return false;
  return /^(?:#{1,6}\s+|第[一二三四五六七八九十百\d]+[章节部分]|[一二三四五六七八九十]+[、.．]|[（(]\s*[一二三四五六七八九十\d]+\s*[)）]|\d+(?:\.\d+){0,3}[、.．\s])/.test(value);
}

function locateParagraphs(text, paragraphs) {
  let cursor = 0;
  return paragraphs.filter((paragraph) => String(paragraph?.text || '').trim()).map((paragraph) => {
    const value = String(paragraph.text).trim();
    let start = Number.isInteger(paragraph.source_start_offset)
      ? paragraph.source_start_offset
      : text.indexOf(value, cursor);
    if (start < 0) start = cursor;
    const end = Number.isInteger(paragraph.source_end_offset)
      ? paragraph.source_end_offset
      : start + value.length;
    cursor = end;
    return {
      text: value,
      page: paragraph.page ?? null,
      paragraph: paragraph.paragraph ?? null,
      source_section: paragraph.source_section ?? null,
      source_clause_id: paragraph.source_clause_id ?? null,
      source_start_offset: start,
      source_end_offset: end,
      starts_at_title_boundary: isTitleBoundary(value)
    };
  });
}

function splitOversizedUnit(unit, characterBudget, tokenBudget) {
  const segments = [];
  let localStart = 0;
  while (localStart < unit.text.length) {
    let localEnd = Math.min(unit.text.length, localStart + characterBudget);
    while (localEnd > localStart + 1
      && estimateTokenCount(unit.text.slice(localStart, localEnd)) > tokenBudget) {
      localEnd = localStart + Math.max(1, Math.floor((localEnd - localStart) * 0.9));
    }
    const text = unit.text.slice(localStart, localEnd);
    segments.push({
      ...unit,
      text,
      source_start_offset: unit.source_start_offset + localStart,
      source_end_offset: unit.source_start_offset + localEnd,
      starts_at_title_boundary: localStart === 0 && unit.starts_at_title_boundary
    });
    localStart = localEnd;
  }
  return segments;
}

function buildChunk(units, chunkNumber) {
  const text = units.map((unit) => unit.text).join('\n');
  const pages = units.map((unit) => unit.page).filter(Number.isInteger);
  const paragraphs = units.map((unit) => unit.paragraph).filter(Number.isInteger);
  return {
    chunk_number: chunkNumber,
    text,
    segments: units.map((unit) => ({ ...unit })),
    character_count: text.length,
    estimated_token_count: estimateTokenCount(text),
    source_start_offset: units[0].source_start_offset,
    source_end_offset: units.at(-1).source_end_offset,
    source_start_page: pages.length ? Math.min(...pages) : null,
    source_end_page: pages.length ? Math.max(...pages) : null,
    source_start_paragraph: paragraphs.length ? Math.min(...paragraphs) : null,
    source_end_paragraph: paragraphs.length ? Math.max(...paragraphs) : null,
    starts_at_title_boundary: units[0].starts_at_title_boundary
  };
}

export function chunkExtractedText({
  text,
  paragraphs,
  singleCallThreshold,
  characterBudget,
  tokenBudget
}) {
  const content = String(text || '');
  const singleCallLimit = positiveInteger(singleCallThreshold, DEFAULT_SINGLE_CALL_THRESHOLD);
  const charLimit = positiveInteger(characterBudget, DEFAULT_CHARACTER_BUDGET);
  const tokenLimit = positiveInteger(tokenBudget, DEFAULT_TOKEN_BUDGET);
  const located = locateParagraphs(content, Array.isArray(paragraphs) ? paragraphs : []);
  if (!located.length) throw Object.assign(new Error('提取文本没有可分片段落。'), { code: 'REQUIREMENT_CHUNKING_FAILED' });
  if (content.length <= singleCallLimit) return [buildChunk(located, 1)];
  const units = located.flatMap((unit) => splitOversizedUnit(unit, charLimit, tokenLimit));
  const chunks = [];
  let current = [];
  const flush = () => {
    if (!current.length) return;
    chunks.push(buildChunk(current, chunks.length + 1));
    current = [];
  };
  for (const unit of units) {
    const currentText = current.map((item) => item.text).join('\n');
    const titleBoundary = unit.starts_at_title_boundary
      && currentText.length >= Math.floor(charLimit * 0.75);
    const previousPage = current.at(-1)?.page;
    const pageBoundary = current.length
      && Number.isInteger(unit.page)
      && Number.isInteger(previousPage)
      && unit.page !== previousPage
      && currentText.length >= Math.floor(charLimit * 0.85);
    if (titleBoundary || pageBoundary) flush();
    const candidateText = [...current.map((item) => item.text), unit.text].join('\n');
    if (current.length && (candidateText.length > charLimit || estimateTokenCount(candidateText) > tokenLimit)) flush();
    current.push(unit);
  }
  flush();
  return chunks;
}

export function aggregateRequirementCandidates(chunkResults, { mandatoryScopeRules = [] } = {}) {
  const candidates = [];
  for (const chunkResult of chunkResults) {
    for (const candidate of chunkResult.candidates || []) {
      const content = String(candidate.content || '').trim();
      if (!content) continue;
      const source = {
        source_excerpt: String(candidate.source_excerpt || '').trim(),
        source_text: String(candidate.source_text || candidate.source_excerpt || '').trim(),
        source_page: candidate.source_page ?? null,
        source_paragraph: candidate.source_paragraph ?? null,
        source_section: candidate.source_section ?? null,
        source_clause_id: candidate.source_clause_id ?? null,
        source_hash: candidate.source_hash ?? null,
        source_chunk_id: candidate.source_chunk_id ?? null,
        category: candidate.category ?? null,
        mandatory_observed: candidate.mandatory_observed === true,
        requires_confirmation: candidate.requires_confirmation === true,
        source_start_offset: candidate.source_start_offset ?? null,
        source_end_offset: candidate.source_end_offset ?? null,
        chunk_number: chunkResult.chunk_number
      };
      if (!source.source_excerpt) continue;
      candidates.push({ content, source });
    }
  }
  if (!candidates.length) {
    throw Object.assign(new Error('所有可处理分片均未提取到候选需求。'), {
      code: 'NO_REQUIREMENTS_EXTRACTED',
      status: 422
    });
  }
  return candidates.map((entry, index) => enrichMandatoryRequirement({
    req_id: `REQ-${String(index + 1).padStart(3, '0')}`,
    content: entry.content,
    source_excerpt: entry.source.source_excerpt,
    source_text: entry.source.source_text,
    source_page: entry.source.source_page,
    source_paragraph: entry.source.source_paragraph,
    source_section: entry.source.source_section,
    source_clause_id: entry.source.source_clause_id,
    source_hash: entry.source.source_hash,
    source_chunk_id: entry.source.source_chunk_id,
    category: entry.source.category,
    mandatory_observed: entry.source.mandatory_observed,
    requires_confirmation: entry.source.requires_confirmation,
    ordinal: index + 1,
    sources: [entry.source]
  }, { scopeRules: mandatoryScopeRules }));
}
