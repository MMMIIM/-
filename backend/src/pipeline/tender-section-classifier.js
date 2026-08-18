import { createHash } from 'node:crypto';

const CHAPTER_NUMBER = Object.freeze({ 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7 });
const CATEGORY_DEFINITIONS = Object.freeze([
  { section_key: 'tender_invitation', title: '投标邀请', start_chapter: 1, end_chapter: 2, archive_role: 'tender_invitation' },
  { section_key: 'bidder_instructions', title: '投标人须知', start_chapter: 2, end_chapter: 4, archive_role: 'compliance_rule_candidate' },
  { section_key: 'technical_requirements', title: '项目要求和有关说明', start_chapter: 4, end_chapter: 5, archive_role: 'requirement_extraction' },
  { section_key: 'evaluation_method', title: '评标方法和标准', start_chapter: 5, end_chapter: 6, archive_role: 'scoring_point_candidate' },
  { section_key: 'contract', title: '合同', start_chapter: 6, end_chapter: 7, archive_role: 'delivery_constraint_candidate' },
  { section_key: 'bid_document_format', title: '投标文件格式', start_chapter: 7, end_chapter: null, archive_role: 'word_template_candidate' }
]);

function locateParagraphOffsets(text, paragraphs) {
  let cursor = 0;
  return paragraphs.map((paragraph) => {
    const value = String(paragraph.text || '').trim();
    let start = text.indexOf(value, cursor);
    if (start < 0) start = cursor;
    const end = Math.min(text.length, start + value.length);
    cursor = end;
    return { ...paragraph, text: value, source_start_offset: start, source_end_offset: end };
  }).filter((paragraph) => paragraph.text);
}

function parseChapterHeading(text) {
  const match = String(text || '').trim().match(/^第\s*([一二三四五六七])\s*章\s*(.*)$/);
  if (!match) return null;
  return {
    chapter_number: CHAPTER_NUMBER[match[1]],
    heading_text: String(text).trim(),
    toc_like: /—{2,}|-{3,}|第\s*\d+\s*页/.test(text)
  };
}

function firstActualChapterIndexes(paragraphs) {
  const indexes = new Map();
  paragraphs.forEach((paragraph, index) => {
    const heading = parseChapterHeading(paragraph.text);
    if (heading && !heading.toc_like && !indexes.has(heading.chapter_number)) {
      indexes.set(heading.chapter_number, index);
    }
  });
  return indexes;
}

function clauseIdAtStart(text) {
  return String(text || '').trim().match(/^(\d+(?:\.\d+)+)(?!\d)/)?.[1] || null;
}

function buildSection(definition, paragraphs, startIndex, endIndex) {
  const selected = paragraphs.slice(startIndex, endIndex);
  let currentClauseId = null;
  const annotated = selected.map((paragraph) => {
    currentClauseId = clauseIdAtStart(paragraph.text) || currentClauseId;
    return {
      ...paragraph,
      source_section: definition.title,
      source_clause_id: currentClauseId
    };
  });
  const contentText = annotated.map((paragraph) => paragraph.text).join('\n');
  return {
    ...definition,
    chapter_number: definition.start_chapter,
    content_text: contentText,
    content_sha256: createHash('sha256').update(contentText).digest('hex'),
    character_count: contentText.length,
    source_start_page: annotated[0]?.page ?? null,
    source_end_page: annotated.at(-1)?.page ?? null,
    source_start_paragraph: annotated[0]?.paragraph ?? null,
    source_end_paragraph: annotated.at(-1)?.paragraph ?? null,
    source_start_offset: annotated[0]?.source_start_offset ?? 0,
    source_end_offset: annotated.at(-1)?.source_end_offset ?? 0,
    paragraphs: annotated
  };
}

export function classifyTenderSections(extraction) {
  const paragraphs = locateParagraphOffsets(extraction.text, extraction.paragraphs || []);
  const chapterIndexes = firstActualChapterIndexes(paragraphs);
  const sections = CATEGORY_DEFINITIONS.flatMap((definition) => {
    const startIndex = chapterIndexes.get(definition.start_chapter);
    if (startIndex === undefined) return [];
    const endIndex = definition.end_chapter === null
      ? paragraphs.length
      : chapterIndexes.get(definition.end_chapter) ?? paragraphs.length;
    if (endIndex <= startIndex) return [];
    return [buildSection(definition, paragraphs, startIndex, endIndex)];
  });
  const technicalSection = sections.find((section) => section.section_key === 'technical_requirements');
  if (technicalSection) return { sections, technicalSection, warnings: [], usedFullTextFallback: false };

  const fallbackDefinition = {
    section_key: 'controlled_fulltext_fallback',
    title: '受控全文回退',
    start_chapter: null,
    end_chapter: null,
    archive_role: 'requirement_extraction_fallback'
  };
  const fallbackSection = buildSection(fallbackDefinition, paragraphs, 0, paragraphs.length);
  return {
    sections: [...sections, fallbackSection],
    technicalSection: fallbackSection,
    warnings: [{
      code: 'TECHNICAL_SECTION_FALLBACK',
      message: '未找到明确的“项目要求和有关说明”章节标题，已使用受控全文回退。'
    }],
    usedFullTextFallback: true
  };
}

export const tenderSectionCategories = CATEGORY_DEFINITIONS.map((definition) => ({ ...definition }));
