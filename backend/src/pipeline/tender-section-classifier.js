import { createHash } from 'node:crypto';
import { documentCapabilitySignals } from './document-capability-detector.js';

const CHINESE_NUMBER = Object.freeze({ 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 });
const CATEGORY_DEFINITIONS = Object.freeze([
  { section_key: 'tender_invitation', title: '投标邀请', title_pattern: /(?:投标|采购|招标).{0,6}(?:邀请|公告)/, archive_role: 'tender_invitation' },
  { section_key: 'bidder_instructions', title: '投标人须知', title_pattern: /(?:投标人|供应商).{0,6}(?:须知|前附表)/, archive_role: 'compliance_rule_candidate' },
  { section_key: 'technical_requirements', title: '技术与项目要求', title_pattern: /(?:技术|功能|服务|项目|采购|接口|安全|运维).{0,8}(?:要求|需求|参数|规范)|需求清单/, archive_role: 'requirement_extraction' },
  { section_key: 'evaluation_method', title: '评标方法和标准', title_pattern: /(?:评标|评审|评分).{0,8}(?:方法|标准|办法|细则)/, archive_role: 'scoring_point_candidate' },
  { section_key: 'contract', title: '合同', title_pattern: /合同|协议/, archive_role: 'delivery_constraint_candidate' },
  { section_key: 'bid_document_format', title: '投标文件格式', title_pattern: /(?:投标|响应).{0,8}(?:文件|材料).{0,8}(?:格式|组成|模板)/, archive_role: 'word_template_candidate' }
]);

function locateParagraphOffsets(text, paragraphs) {
  let cursor = 0;
  return paragraphs.map((paragraph) => {
    const value = String(paragraph.text || '').trim();
    let start = text.indexOf(value, cursor);
    if (start < 0) start = cursor;
    const end = Math.min(text.length, start + value.length); cursor = end;
    return { ...paragraph, text: value, source_start_offset: start, source_end_offset: end };
  }).filter((paragraph) => paragraph.text);
}

function chapterNumber(value) {
  if (/^\d+$/.test(value)) return Number(value);
  if (value === '十一') return 11;
  if (value === '十二') return 12;
  return CHINESE_NUMBER[value] ?? null;
}

function parseChapterHeading(text) {
  const value = String(text || '').trim();
  const match = value.match(/^第\s*([一二三四五六七八九十]{1,2}|\d+)\s*章\s*(.*)$/);
  if (!match || /—{2,}|-{3,}|第\s*\d+\s*页/.test(value)) return null;
  return { chapter_number: chapterNumber(match[1]), heading_text: value, title_text: match[2].trim() };
}

function categoryFor(heading) {
  return CATEGORY_DEFINITIONS.find((definition) => definition.title_pattern.test(heading.title_text || heading.heading_text)) || null;
}

function clauseIdAtStart(text) {
  return String(text || '').trim().match(/^(\d+(?:\.\d+)+)(?!\d)/)?.[1] || null;
}

function buildSection(definition, selected, chapterNumbers = []) {
  let currentClauseId = null;
  const annotated = selected.map((paragraph) => {
    currentClauseId = clauseIdAtStart(paragraph.text) || currentClauseId;
    return { ...paragraph, source_section: paragraph.detected_section_title || definition.title, source_clause_id: currentClauseId };
  });
  const contentText = annotated.map((paragraph) => paragraph.text).join('\n');
  const detectedTitles = [...new Set(annotated.map((paragraph) => paragraph.detected_section_title).filter(Boolean))];
  return {
    ...definition, title: detectedTitles.length === 1 ? detectedTitles[0] : definition.title,
    chapter_number: chapterNumbers[0] ?? null, chapter_numbers: chapterNumbers,
    content_text: contentText, content_sha256: createHash('sha256').update(contentText).digest('hex'),
    character_count: contentText.length, source_start_page: annotated[0]?.page ?? null,
    source_end_page: annotated.at(-1)?.page ?? null, source_start_paragraph: annotated[0]?.paragraph ?? null,
    source_end_paragraph: annotated.at(-1)?.paragraph ?? null, source_start_offset: annotated[0]?.source_start_offset ?? 0,
    source_end_offset: annotated.at(-1)?.source_end_offset ?? 0, paragraphs: annotated
  };
}

export function classifyTenderSections(extraction) {
  const paragraphs = locateParagraphOffsets(extraction.text, extraction.paragraphs || []);
  const headings = paragraphs.map((paragraph, index) => ({ index, heading: parseChapterHeading(paragraph.text) }))
    .filter((item) => item.heading);
  const grouped = new Map();
  headings.forEach((item, headingIndex) => {
    const definition = categoryFor(item.heading); if (!definition) return;
    const end = headings[headingIndex + 1]?.index ?? paragraphs.length;
    const selected = paragraphs.slice(item.index, end).map((paragraph) => ({ ...paragraph, detected_section_title: item.heading.title_text || item.heading.heading_text }));
    const existing = grouped.get(definition.section_key) || { definition, paragraphs: [], chapters: [] };
    existing.paragraphs.push(...selected); existing.chapters.push(item.heading.chapter_number); grouped.set(definition.section_key, existing);
  });
  const sections = CATEGORY_DEFINITIONS.flatMap((definition) => {
    const group = grouped.get(definition.section_key);
    return group ? [buildSection(definition, group.paragraphs, group.chapters)] : [];
  });
  const technicalSection = sections.find((section) => section.section_key === 'technical_requirements');
  if (technicalSection) return { sections, technicalSection, warnings: [], usedFullTextFallback: false };

  if (!headings.length && documentCapabilitySignals.technical.test(extraction.text)) {
    const definition = { section_key: 'controlled_fulltext_fallback', title: '受控全文回退', archive_role: 'requirement_extraction_fallback' };
    const fallback = buildSection(definition, paragraphs);
    return { sections: [...sections, fallback], technicalSection: fallback, warnings: [{ code: 'TECHNICAL_SECTION_FALLBACK', message: '文档没有可识别章节标题，已基于技术需求信号使用受控全文回退。' }], usedFullTextFallback: true };
  }
  return { sections, technicalSection: null, warnings: [{ code: 'NO_TECHNICAL_REQUIREMENTS_FOUND', message: '未识别到可处理的技术或项目需求章节。' }], usedFullTextFallback: false };
}

export const tenderSectionCategories = CATEGORY_DEFINITIONS.map(({ title_pattern: _pattern, ...definition }) => ({ ...definition }));
