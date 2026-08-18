import { createHash } from 'node:crypto';

function normalizeSourceText(value) {
  return String(value || '').normalize('NFKC').replace(/\s+/g, '').trim();
}

function hashSource(value) {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function clauseMatches(segment, sourceClause) {
  if (!sourceClause) return true;
  const clause = String(sourceClause).trim();
  return segment.source_clause_id === clause || String(segment.text || '').trim().startsWith(clause);
}

export class SourceLocationResolver {
  resolve(candidate, chunk) {
    const sourceText = String(candidate.source_text ?? candidate.source_excerpt ?? '').trim();
    if (!sourceText) throw Object.assign(new Error('候选需求必须提供 source_text。'), { code: 'GATEWAY_REQUIREMENTS_INVALID' });
    const needle = normalizeSourceText(sourceText);
    let matches = (chunk.segments || []).filter((segment) => {
      const haystack = normalizeSourceText(segment.text);
      return haystack === needle || haystack.includes(needle);
    });
    if (matches.length > 1 && candidate.source_clause) {
      const clauseMatchesOnly = matches.filter((segment) => clauseMatches(segment, candidate.source_clause));
      if (clauseMatchesOnly.length) matches = clauseMatchesOnly;
    }
    if (matches.length > 1 && Number.isInteger(candidate.source_hint)) {
      const hintMatches = matches.filter((segment) => segment.paragraph === candidate.source_hint);
      if (hintMatches.length === 1) matches = hintMatches;
    }
    if (matches.length !== 1) {
      return {
        location: {
          source_text: sourceText, source_page: null, source_paragraph: null,
          source_hash: null, source_start_offset: chunk.source_start_offset,
          source_end_offset: chunk.source_end_offset, source_section: null,
          source_clause_id: candidate.source_clause || null, source_chunk_id: chunk.id || chunk.chunk_id || null
        },
        warning: {
          code: matches.length ? 'SOURCE_LOCATION_AMBIGUOUS' : 'SOURCE_LOCATION_UNRESOLVED',
          message: matches.length ? '来源原文在当前分片中存在多处匹配，需人工确认。' : '来源原文未能在当前分片中确定性定位，需人工确认。'
        }
      };
    }
    const segment = matches[0];
    const normalizedSegment = normalizeSourceText(segment.text);
    const relativeNormalizedIndex = normalizedSegment.indexOf(needle);
    return {
      location: {
        source_text: sourceText,
        source_page: Number.isInteger(segment.page) ? segment.page : null,
        source_paragraph: Number.isInteger(segment.paragraph) ? segment.paragraph : null,
        source_hash: hashSource(String(segment.text || '')),
        source_start_offset: relativeNormalizedIndex >= 0 ? segment.source_start_offset : segment.source_start_offset,
        source_end_offset: segment.source_end_offset,
        source_section: segment.source_section || null,
        source_clause_id: segment.source_clause_id || candidate.source_clause || null,
        source_chunk_id: chunk.id || chunk.chunk_id || null
      },
      warning: null
    };
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
  return value === null || value === undefined
    ? { hint: null, warning: null }
    : { hint: null, warning: { code: 'SOURCE_HINT_IGNORED', message: '模型返回的来源段落提示格式无效，已忽略。' } };
}
