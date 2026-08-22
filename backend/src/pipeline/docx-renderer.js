import {
  AlignmentType, BorderStyle, Document, Footer, Header, HeadingLevel, LevelFormat, LevelSuffix,
  PageNumber, Paragraph, Packer, SectionType, Table, TableCell, TableOfContents,
  TableRow, TextRun, WidthType
} from 'docx';
import {
  getBodyLineSpacingTwips,
  getDocumentFormatPolicy,
  getFirstLineIndentTwips,
  getPageMarginsDxa,
  getParagraphSpacingTwips,
  ptToTwips,
  getUsableBodyWidth
} from './document-format-policy.js';
import { normalizeHeadingText } from './bid-document-model.js';

function fontFor(policy, role = 'body') {
  const source = role === 'table' ? policy.table : role.startsWith('heading') ? policy.headings[Number(role.slice(-1)) || 1] : policy.body;
  const name = source.font || policy.body.font;
  return { name, eastAsia: source.eastAsiaFont || name, hAnsi: source.hAnsi || name };
}
function run(value, options = {}, policy, role = 'body') {
  return new TextRun({ text: String(value ?? ''), font: fontFor(policy, role), ...options });
}

function paragraph(textValue, policy) {
  const spacing = getParagraphSpacingTwips(policy, 'body');
  return new Paragraph({
    children: [run(textValue, {}, policy, 'body')],
    alignment: policy.body.alignment === 'both' ? AlignmentType.JUSTIFIED : AlignmentType.LEFT,
    indent: { firstLine: getFirstLineIndentTwips(policy) },
    spacing: { ...spacing, line: getBodyLineSpacingTwips(policy) },
    widowControl: true,
    style: 'Normal'
  });
}

function heading(block, policy) {
  const level = Math.max(1, Math.min(3, Number(block.level) || 1));
  const style = policy.headings[level] || policy.headings[1];
  const spacing = getParagraphSpacingTwips(policy, level);
  return new Paragraph({
    children: [run(normalizeHeadingText(block.text), { bold: style.bold !== false, size: style.size_half_points, color: style.color }, policy, `heading${level}`)],
    heading: [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3][level - 1],
    numbering: { reference: 'bid-heading-numbering', level: style.numbering_level ?? level - 1 },
    spacing,
    pageBreakBefore: style.page_break_before === true,
    keepNext: true,
    keepLines: true
  });
}

function tableColumnWidths(rows, totalWidth) {
  const count = Math.max(1, rows.reduce((max, row) => Math.max(max, row.length), 1));
  const weights = Array.from({ length: count }, (_, index) => Math.max(4, ...rows.map((row) => String(row[index] ?? '').length)));
  const minWidth = Math.min(1400, Math.floor(totalWidth / count));
  const reserved = minWidth * count;
  const remaining = Math.max(0, totalWidth - reserved);
  const weightTotal = weights.reduce((sum, value) => sum + value, 0);
  const widths = weights.map((weight) => minWidth + Math.floor((remaining * weight) / weightTotal));
  widths[widths.length - 1] += totalWidth - widths.reduce((sum, value) => sum + value, 0);
  return widths;
}

export function tableWidthForPolicy(policy = getDocumentFormatPolicy()) {
  return getUsableBodyWidth(policy);
}

export function tableCellMarginForPolicy(policy = getDocumentFormatPolicy()) {
  return { ...(policy.table.cell_padding_dxa || policy.table.cell_margin) };
}

function table(block, policy) {
  const width = tableWidthForPolicy(policy);
  const columnWidths = tableColumnWidths(block.rows, width);
  const rows = block.rows.map((cells, rowIndex) => {
    const isHeader = block.header_row_index === rowIndex;
    return new TableRow({
    ...(policy.table.header_repeat !== false && isHeader ? { tableHeader: true } : {}),
    cantSplit: policy.table.row_cant_split !== false,
    children: cells.map((cell, index) => new TableCell({
      width: { size: columnWidths[index] || columnWidths[columnWidths.length - 1], type: WidthType.DXA },
      shading: isHeader ? { fill: policy.table.header_fill } : undefined,
      margins: tableCellMarginForPolicy(policy),
      children: [new Paragraph({
        children: [run(cell, { bold: isHeader, size: policy.table.size_half_points }, policy, 'table')],
        indent: { firstLine: 0 },
        spacing: { before: ptToTwips(policy.table.paragraph_before_pt), after: ptToTwips(policy.table.paragraph_after_pt), line: getBodyLineSpacingTwips(policy) }
      })]
    }))
  });
  });
  return new Table({
    rows,
    width: { size: width, type: WidthType.DXA },
    columnWidths,
    layout: 'fixed',
    indent: { size: policy.table.indent_dxa || 0, type: WidthType.DXA },
    borders: {
      top: { style: BorderStyle.SINGLE, size: policy.table.border.outer_size, color: policy.table.border.outer_color },
      bottom: { style: BorderStyle.SINGLE, size: policy.table.border.outer_size, color: policy.table.border.outer_color },
      left: { style: BorderStyle.SINGLE, size: policy.table.border.outer_size, color: policy.table.border.outer_color },
      right: { style: BorderStyle.SINGLE, size: policy.table.border.outer_size, color: policy.table.border.outer_color },
      insideHorizontal: { style: BorderStyle.SINGLE, size: policy.table.border.inner_size, color: policy.table.border.inner_color },
      insideVertical: { style: BorderStyle.SINGLE, size: policy.table.border.inner_size, color: policy.table.border.inner_color }
    }
  });
}

function contentChildren(model, policy) {
  const children = [];
  for (const [sectionIndex, section] of model.sections.entries()) {
    const sectionHeading = normalizeHeadingText(section.title);
    children.push(new Paragraph({
      children: [run(sectionHeading, { bold: policy.headings[1].bold !== false, size: policy.headings[1].size_half_points }, policy, 'heading1')],
      heading: HeadingLevel.HEADING_1,
      numbering: { reference: 'bid-heading-numbering', level: policy.headings[1].numbering_level ?? 0 },
      spacing: getParagraphSpacingTwips(policy, 1),
      pageBreakBefore: (sectionIndex > 0 && policy.sections.body.chapter_page_break === 'before_heading') || policy.headings[1].page_break_before === true,
      keepNext: true,
      keepLines: true
    }));
    let pageBreakBeforeNextHeading = false;
    for (const [index, block] of section.content_blocks.entries()) {
      if (index === 0 && block.kind === 'heading' && normalizeHeadingText(block.text) === sectionHeading) continue;
      if (block.kind === 'heading') {
        children.push(heading({ ...block, page_break_before: block.page_break_before === true || pageBreakBeforeNextHeading }, policy));
        pageBreakBeforeNextHeading = false;
      }
      else if (block.kind === 'table') children.push(table(block, policy));
      else if (block.kind === 'page_break') {
        // A standalone break can strand a normal paragraph before the next
        // chapter. Chapter breaks are bound to the next Heading 1 instead.
        const next = section.content_blocks.slice(index + 1).find((candidate) => candidate?.kind !== 'page_break');
        pageBreakBeforeNextHeading = next?.kind === 'heading';
      }
      else if (block.kind === 'image') children.push(new Paragraph({ children: [run(`[图片占位：${block.alt}]`, { italics: true, color: '667085' }, policy, 'body')], alignment: AlignmentType.CENTER }));
      else if (block.text) children.push(paragraph(block.text, policy));
    }
  }
  return children;
}

function emptyFooter() {
  return new Footer({ children: [new Paragraph({ children: [] })] });
}

function pageFooter(policy) {
  return new Footer({ children: [new Paragraph({
    children: [run('第 ', {}, policy), new TextRun({ children: [PageNumber.CURRENT], font: fontFor(policy, 'body') }), run(' 页', {}, policy)],
    alignment: AlignmentType.CENTER
  })] });
}

function pageHeader(model, policy) {
  return new Header({ children: [new Paragraph({
    children: [run(model.project.name, { bold: true, size: policy.header_footer.header_size_half_points }, policy, 'body')],
    alignment: AlignmentType.LEFT,
    spacing: { after: Math.round(policy.header_footer.header_after_pt * 20) }
  })] });
}

function coverChildren(model, policy) {
  const fields = model.document_fields || {};
  const spacing = policy.cover.spacing_pt;
  const children = [
    new Paragraph({ children: [], spacing: { after: Math.round(spacing.top * 20) } }),
    new Paragraph({ children: [run(fields.project_name || model.project.name, { bold: true, size: policy.cover.title_size_half_points, color: policy.cover.title_color }, policy, 'heading1')], alignment: AlignmentType.CENTER, spacing: { after: Math.round(spacing.title_after * 20) } }),
    new Paragraph({ children: [run('投 标 文 件', { bold: true, size: policy.cover.document_title_size_half_points, color: policy.cover.title_color }, policy, 'heading1')], alignment: AlignmentType.CENTER, spacing: { after: Math.round(policy.cover.spacing_pt.document_title_after * 20) } }),
    new Paragraph({ children: [run('（技术部分）', { size: policy.cover.subtitle_size_half_points, color: policy.cover.title_color }, policy, 'body')], alignment: AlignmentType.CENTER, spacing: { after: Math.round(spacing.subtitle_after * 20) } })
  ];
  const details = [
    ['项目编号', fields.project_number],
    ['项目名称', fields.project_name],
    ['投标人', fields.bidder],
    ['日期', fields.date]
  ].filter(([, value]) => value);
  for (const [label, value] of details) {
    children.push(new Paragraph({ children: [run(`${label}：${value}`, { size: policy.cover.label_size_half_points }, policy, 'body')], alignment: AlignmentType.CENTER, spacing: { after: Math.round(spacing.detail_after * 20) } }));
  }
  return children;
}

function sectionType(value) {
  return value === 'next_page' ? SectionType.NEXT_PAGE : undefined;
}

function tocEntries(model) {
  const counters = [0, 0, 0];
  const entries = [];
  const addEntry = (level, title) => {
    const normalizedLevel = Math.max(1, Math.min(3, Number(level) || 1));
    counters[normalizedLevel - 1] += 1;
    for (let index = normalizedLevel; index < counters.length; index += 1) counters[index] = 0;
    const number = counters.slice(0, normalizedLevel).join('.');
    entries.push({ title: `${number} ${normalizeHeadingText(title)}`, level: normalizedLevel });
  };
  for (const section of model.sections) {
    addEntry(1, section.title);
    for (const [index, block] of section.content_blocks.entries()) {
      if (index === 0 && block.kind === 'heading' && normalizeHeadingText(block.text) === normalizeHeadingText(section.title)) continue;
      if (block.kind === 'heading') addEntry(block.level, block.text);
    }
  }
  return entries;
}

export async function renderBidDocument(model, { policy = getDocumentFormatPolicy() } = {}) {
  const header = pageHeader(model, policy);
  const footer = pageFooter(policy);
  const blankFooter = emptyFooter();
  const margins = getPageMarginsDxa(policy);
  const page = { size: { width: policy.page.width_dxa, height: policy.page.height_dxa }, margin: margins };
  const headingStyle = (level) => {
    const style = policy.headings[level];
    return { id: `Heading${level}`, name: `Heading ${level}`, basedOn: 'Normal', next: 'Normal', run: { font: fontFor(policy, `heading${level}`), bold: style.bold !== false, size: style.size_half_points, color: style.color }, paragraph: { keepNext: true, keepLines: true, spacing: getParagraphSpacingTwips(policy, level), outlineLevel: style.numbering_level ?? level - 1 } };
  };
  const bodySpacing = getParagraphSpacingTwips(policy, 'body');
  const bodyLine = getBodyLineSpacingTwips(policy);
  const numbering = policy.heading_numbering || { left_dxa_per_level: 360, hanging_dxa: 180, suffix: 'space' };
  const numberingSuffix = numbering.suffix === 'space' ? LevelSuffix.SPACE : numbering.suffix === 'nothing' ? LevelSuffix.NOTHING : LevelSuffix.TAB;
  const bodySection = policy.sections.body;
  const tocSection = policy.sections.toc;
  const tocChildren = policy.toc.enabled === false ? [] : [new TableOfContents('', {
    hyperlink: true,
    headingStyleRange: policy.toc.heading_style_range,
    beginDirty: true,
    cachedEntries: tocEntries(model)
  })];
  const tocNote = policy.toc.note ? [new Paragraph({ children: [run(policy.toc.note, { italics: true, size: policy.toc.note_size_half_points, color: '667085' }, policy, 'body')], alignment: AlignmentType.CENTER, spacing: { after: Math.round(policy.toc.note_after_pt * 20) } })] : [];
  const doc = new Document({
    creator: '政企标书平台', title: model.title, subject: '正式投标响应文档',
    features: { updateFields: true },
    numbering: { config: [{ reference: 'bid-heading-numbering', levels: [0, 1, 2].map((level) => ({ level, format: LevelFormat.DECIMAL, text: level === 0 ? '%1' : level === 1 ? '%1.%2' : '%1.%2.%3', suffix: numberingSuffix, alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: numbering.left_dxa_per_level * (level + 1), hanging: numbering.hanging_dxa } } } })) }] },
    styles: {
      default: { document: { run: { font: fontFor(policy, 'body'), size: policy.body.size_half_points }, paragraph: { spacing: { ...bodySpacing, line: bodyLine }, alignment: AlignmentType.JUSTIFIED } } },
      paragraphStyles: [
        { id: 'Normal', name: 'Normal', run: { font: fontFor(policy, 'body'), size: policy.body.size_half_points }, paragraph: { spacing: { ...bodySpacing, line: bodyLine }, alignment: AlignmentType.JUSTIFIED } },
        headingStyle(1), headingStyle(2), headingStyle(3)
      ]
    },
    sections: [
      {
        properties: { page, titlePage: true },
        footers: { default: blankFooter, first: blankFooter },
        children: coverChildren(model, policy)
      },
      {
        properties: {
          page: {
            ...page,
            ...(tocSection.page_number && Number.isFinite(Number(tocSection.page_number_start))
              ? { pageNumbers: { start: Number(tocSection.page_number_start) } }
              : {})
          },
          type: sectionType(tocSection.type),
          titlePage: tocSection.title_page
        },
        ...(tocSection.footer && policy.header_footer.show_page_number ? { footers: { default: footer } } : {}),
        children: [
          new Paragraph({ children: [run(policy.toc.title, { bold: true, size: policy.toc.title_size_half_points }, policy, 'heading1')], alignment: AlignmentType.CENTER, spacing: { after: Math.round(policy.toc.title_after_pt * 20) } }),
          ...tocNote,
          ...tocChildren
        ]
      },
      {
        properties: {
          page: {
            ...page,
            ...(bodySection.page_number && Number.isFinite(Number(bodySection.page_number_start))
              ? { pageNumbers: { start: Number(bodySection.page_number_start) } }
              : {})
          },
          type: sectionType(bodySection.type)
        },
        ...(bodySection.header ? { headers: { default: header } } : {}),
        ...(bodySection.footer && policy.header_footer.show_page_number ? { footers: { default: footer } } : {}),
        children: contentChildren(model, policy)
      }
    ]
  });
  return Packer.toBuffer(doc);
}
