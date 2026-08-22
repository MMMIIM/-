import { createHash } from 'node:crypto';
import { projectDocumentFields, projectFactsForDocument, projectNameForDocument, DOCUMENT_PROJECTION_POLICY_VERSION } from './document-projection-policy.js';

export const BID_DOCUMENT_MODEL_VERSION = 'bid-document-v1';

function text(value) {
  return String(value ?? '').replace(/\r\n?/g, '\n').trim();
}

function hash(value) {
  return createHash('sha256').update(String(value ?? ''), 'utf8').digest('hex');
}

function markdownBlocks(markdown) {
  const lines = text(markdown).split('\n');
  const blocks = [];
  let paragraphs = [];
  const flush = () => {
    const value = paragraphs.join(' ').trim();
    if (value) blocks.push({ kind: 'paragraph', text: value });
    paragraphs = [];
  };
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line) { flush(); continue; }
    if (/^\[\[PAGE_BREAK\]\]$/i.test(line)) { flush(); blocks.push({ kind: 'page_break' }); continue; }
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) { flush(); blocks.push({ kind: 'heading', level: heading[1].length, text: heading[2].trim() }); continue; }
    if (line.startsWith('|') && line.endsWith('|')) {
      flush();
      const rows = [];
      while (index < lines.length && lines[index].trim().startsWith('|') && lines[index].trim().endsWith('|')) {
        const cells = lines[index].trim().slice(1, -1).split('|').map((cell) => cell.trim());
        if (!cells.every((cell) => /^:?-{2,}:?$/.test(cell))) rows.push(cells);
        index += 1;
      }
      index -= 1;
      if (rows.length) blocks.push({ kind: 'table', rows });
      continue;
    }
    if (/^---+$/.test(line)) { flush(); blocks.push({ kind: 'page_break' }); continue; }
    paragraphs.push(line.replace(/^[-*]\s+/, ''));
  }
  flush();
  return blocks;
}

function normalizeBlock(block) {
  if (!block || typeof block !== 'object') return null;
  const kind = block.kind || block.type;
  if (kind === 'heading') return { kind, level: Math.max(1, Math.min(6, Number(block.level) || 1)), text: text(block.text || block.content) };
  if (kind === 'paragraph') return { kind, text: text(block.text || block.content) };
  if (kind === 'page_break') return { kind };
  if (kind === 'image') return { kind, alt: text(block.alt || block.caption || '图片'), data: block.data || null, width: Number(block.width) || null, height: Number(block.height) || null };
  if (kind === 'table') {
    const rows = Array.isArray(block.rows) ? block.rows.map((row) => Array.isArray(row) ? row.map(text) : []).filter((row) => row.length) : [];
    return rows.length ? { kind, rows } : null;
  }
  return text(block.text || block.content) ? { kind: 'paragraph', text: text(block.text || block.content) } : null;
}

function sectionBlocks(section) {
  if (Array.isArray(section.content_blocks) && section.content_blocks.length) return section.content_blocks.map(normalizeBlock).filter(Boolean);
  return markdownBlocks(section.content_markdown || section.final_text || section.content || '');
}

export function normalizeHeadingText(value) {
  return text(value)
    .replace(/^第\s*[0-9一二三四五六七八九十百]+\s*章\s*/u, '')
    .replace(/^\d+(?:\.\d+){0,5}[.)、]?\s+/u, '')
    .trim();
}

/**
 * A section title is rendered as Heading 1. Source content can contain a
 * deeper heading without an explicit parent (for example H1 → H3). Lowering
 * only that heading to the nearest valid level preserves the source meaning
 * without inventing a synthetic parent title.
 */
export function normalizeHeadingHierarchy(sections = []) {
  return sections.map((section) => {
    let previousLevel = 1;
    let previousSourceLevel = 1;
    const contentBlocks = (section.content_blocks || []).map((block) => {
      if (block?.kind !== 'heading') return block;
      const sourceLevel = Math.max(1, Math.min(6, Number(block.level) || 1));
      const level = sourceLevel === previousSourceLevel
        ? previousLevel
        : sourceLevel > previousSourceLevel
          ? Math.min(3, previousLevel + 1)
          : Math.min(3, sourceLevel, previousLevel);
      previousLevel = level;
      previousSourceLevel = sourceLevel;
      return { ...block, level };
    });
    return { ...section, content_blocks: contentBlocks };
  });
}

export function validateHeadingHierarchy(sections = [], { throwOnError = true } = {}) {
  const violations = [];
  for (const section of sections) {
    let previousLevel = 1;
    for (const [index, block] of (section.content_blocks || []).entries()) {
      if (block?.kind !== 'heading') continue;
      const level = Number(block.level);
      if (!Number.isInteger(level) || level < 1 || level > 3 || level > previousLevel + 1) {
        violations.push({ section_id: section.section_id || section.id || null, block_index: index, previous_level: previousLevel, level });
      }
      previousLevel = Number.isInteger(level) ? level : previousLevel;
    }
  }
  const result = { valid: violations.length === 0, violations };
  if (!result.valid && throwOnError) {
    throw Object.assign(new Error('文档标题层级缺少必要的父级标题。'), { code: 'DOCUMENT_HIERARCHY_INVALID', status: 422, violations });
  }
  return result;
}

export function buildBidDocumentModel({ project, version, approvedProjectFacts = [] }) {
  if (!project?.id || !version?.id) throw Object.assign(new Error('项目和文档版本不能为空。'), { code: 'DOCUMENT_MODEL_INPUT_INVALID', status: 422 });
  if (String(version.project_id) !== String(project.id)) throw Object.assign(new Error('文档版本不属于当前项目。'), { code: 'VERSION_PROJECT_MISMATCH', status: 409 });
  const finalText = text(version.final_text || version.content_markdown);
  if (!finalText) throw Object.assign(new Error('正式正文为空，无法导出 Word。'), { code: 'DOCUMENT_CONTENT_EMPTY', status: 422 });
  const rawSections = Array.isArray(version.sections_json) && version.sections_json.length
    ? version.sections_json
    : [{ chapter_id: 'document-body', title: version.title || '技术响应正文', order: 1, content_markdown: finalText }];
  const sections = rawSections.map((section, index) => ({
    section_id: String(section.chapter_id || section.section_id || section.id || `section-${index + 1}`),
    title: text(section.title || `第 ${index + 1} 章`),
    order: Number.isFinite(Number(section.order)) ? Number(section.order) : index + 1,
    heading_level: Math.max(1, Math.min(3, Number(section.heading_level) || 1)),
    content_blocks: sectionBlocks(section)
  })).sort((a, b) => a.order - b.order || a.section_id.localeCompare(b.section_id));
  const normalizedSections = normalizeHeadingHierarchy(sections);
  validateHeadingHierarchy(normalizedSections);
  const projectedFacts = projectFactsForDocument(approvedProjectFacts);
  const documentFields = projectDocumentFields({ project, approvedProjectFacts });
  const documentProjectName = documentFields.project_name || projectNameForDocument(project);
  return {
    model_version: BID_DOCUMENT_MODEL_VERSION,
    projection_policy_version: DOCUMENT_PROJECTION_POLICY_VERSION,
    project: { id: project.id, name: documentProjectName },
    version: { id: version.id, generation_id: version.generation_id || null, number: version.version_number, title: text(version.title || '技术响应') },
    source: { final_text_hash: hash(finalText), final_text_length: finalText.length },
    title: text(version.title || `${documentProjectName} 技术响应`),
    document_fields: documentFields,
    // Kept for audit/model consumers, but the default renderer does not dump
    // this list into a generic visible section.
    approved_project_facts: projectedFacts,
    sections: normalizedSections
  };
}

export { hash as hashDocumentText, markdownBlocks };
