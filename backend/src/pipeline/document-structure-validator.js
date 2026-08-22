/**
 * Deterministic pre-render document structure checks.
 *
 * This validator deliberately knows nothing about business semantics. It
 * validates only the formal tree handed to a renderer so malformed content
 * cannot become a misleading Word document.
 */

function normalizeTitle(value) {
  return String(value ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/^第\s*[0-9一二三四五六七八九十百]+\s*章\s*/u, '')
    .replace(/^\d+(?:\.\d+){0,5}[.)、]?\s+/u, '')
    .trim();
}

const ALLOWED_BLOCKS = new Set(['heading', 'paragraph', 'table', 'image', 'page_break']);

export function validateDocumentStructure(sections = [], { throwOnError = true } = {}) {
  const violations = [];
  const seenSectionIds = new Set();
  const projectedChapterTitles = new Set();

  if (!Array.isArray(sections) || sections.length === 0) {
    violations.push({ code: 'DOCUMENT_SECTIONS_EMPTY' });
  }

  for (const [sectionIndex, section] of (sections || []).entries()) {
    const sectionId = String(section?.section_id || section?.id || '').trim();
    const sectionTitle = normalizeTitle(section?.title);
    if (!sectionId) violations.push({ code: 'DOCUMENT_SECTION_ID_MISSING', section_index: sectionIndex });
    if (seenSectionIds.has(sectionId)) violations.push({ code: 'DOCUMENT_SECTION_ID_DUPLICATE', section_index: sectionIndex, section_id: sectionId });
    if (sectionId) seenSectionIds.add(sectionId);
    if (!sectionTitle) violations.push({ code: 'DOCUMENT_SECTION_TITLE_MISSING', section_index: sectionIndex });
    if (sectionTitle && projectedChapterTitles.has(sectionTitle)) {
      violations.push({ code: 'DOCUMENT_PROJECTED_HEADING_DUPLICATE', section_index: sectionIndex, title: sectionTitle });
    }
    if (sectionTitle) projectedChapterTitles.add(sectionTitle);

    const blocks = Array.isArray(section?.content_blocks) ? section.content_blocks : [];
    for (const [blockIndex, block] of blocks.entries()) {
      if (!block || typeof block !== 'object' || !ALLOWED_BLOCKS.has(block.kind)) {
        violations.push({ code: 'DOCUMENT_BLOCK_INVALID', section_index: sectionIndex, block_index: blockIndex });
        continue;
      }
      if ((block.kind === 'paragraph' || block.kind === 'heading') && !String(block.text ?? '').trim()) {
        violations.push({ code: 'DOCUMENT_TEXT_BLOCK_EMPTY', section_index: sectionIndex, block_index: blockIndex });
      }
      if (block.kind === 'heading') {
        const level = Number(block.level);
        if (!Number.isInteger(level) || level < 1 || level > 3) {
          violations.push({ code: 'DOCUMENT_HEADING_LEVEL_INVALID', section_index: sectionIndex, block_index: blockIndex, level });
        }
      }
      if (block.kind === 'table' && (!Array.isArray(block.rows) || block.rows.length === 0 || block.rows.some((row) => !Array.isArray(row) || row.length === 0))) {
        violations.push({ code: 'DOCUMENT_TABLE_INVALID', section_index: sectionIndex, block_index: blockIndex });
      }
    }
  }

  const result = { valid: violations.length === 0, violations };
  if (!result.valid && throwOnError) {
    throw Object.assign(new Error('文档结构未通过导出前检查。'), {
      code: 'DOCUMENT_STRUCTURE_INVALID',
      status: 422,
      violations
    });
  }
  return result;
}

