import {
  AlignmentType, BorderStyle, Document, Footer, Header, HeadingLevel, LevelFormat,
  PageBreak, PageNumber, Paragraph, Packer, SectionType, Table, TableCell, TableOfContents,
  TableRow, TextRun, WidthType
} from 'docx';
import { getDocumentFormatPolicy, getUsableBodyWidth } from './document-format-policy.js';
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
  return new Paragraph({
    children: [run(textValue, {}, policy, 'body')],
    alignment: policy.body.alignment === 'both' ? AlignmentType.JUSTIFIED : AlignmentType.LEFT,
    indent: { firstLine: policy.body.first_line_indent },
    spacing: { after: policy.body.spacing_after, line: policy.body.line_twips },
    style: 'Normal'
  });
}

function heading(block, policy) {
  const level = Math.max(1, Math.min(3, Number(block.level) || 1));
  const style = policy.headings[level] || policy.headings[1];
  return new Paragraph({
    children: [run(normalizeHeadingText(block.text), { bold: true, size: style.size_half_points, color: style.color }, policy, `heading${level}`)],
    heading: [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3][level - 1],
    numbering: { reference: 'bid-heading-numbering', level: level - 1 },
    spacing: { before: style.before, after: style.after },
    keepNext: true
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
  return { ...policy.table.cell_margin };
}

function table(block, policy) {
  const width = tableWidthForPolicy(policy);
  const columnWidths = tableColumnWidths(block.rows, width);
  const rows = block.rows.map((cells, rowIndex) => new TableRow({
    tableHeader: rowIndex === 0,
    children: cells.map((cell, index) => new TableCell({
      width: { size: columnWidths[index] || columnWidths[columnWidths.length - 1], type: WidthType.DXA },
      shading: rowIndex === 0 ? { fill: policy.table.header_fill } : undefined,
      margins: tableCellMarginForPolicy(policy),
      children: [new Paragraph({
        children: [run(cell, { bold: rowIndex === 0, size: policy.table.size_half_points }, policy, 'table')],
        indent: { firstLine: 0 },
        spacing: { after: 0, line: policy.body.line_twips }
      })]
    }))
  }));
  return new Table({
    rows,
    width: { size: width, type: WidthType.DXA },
    columnWidths,
    layout: 'fixed',
    indent: { size: policy.table.indent_dxa || 0, type: WidthType.DXA },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: 'B7C4D6' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'B7C4D6' },
      left: { style: BorderStyle.SINGLE, size: 4, color: 'B7C4D6' },
      right: { style: BorderStyle.SINGLE, size: 4, color: 'B7C4D6' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: 'D9E2F3' },
      insideVertical: { style: BorderStyle.SINGLE, size: 2, color: 'D9E2F3' }
    }
  });
}

function contentChildren(model, policy) {
  const children = [];
  for (const section of model.sections) {
    const sectionHeading = normalizeHeadingText(section.title);
    children.push(new Paragraph({
      children: [run(sectionHeading, { bold: true, size: policy.headings[1].size_half_points }, policy, 'heading1')],
      heading: HeadingLevel.HEADING_1,
      numbering: { reference: 'bid-heading-numbering', level: 0 },
      spacing: { before: policy.headings[1].before, after: policy.headings[1].after },
      keepNext: true
    }));
    for (const [index, block] of section.content_blocks.entries()) {
      if (index === 0 && block.kind === 'heading' && normalizeHeadingText(block.text) === sectionHeading) continue;
      if (block.kind === 'heading') children.push(heading(block, policy));
      else if (block.kind === 'table') children.push(table(block, policy));
      else if (block.kind === 'page_break') children.push(new Paragraph({ children: [new PageBreak()] }));
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
    children: [run(model.project.name, { bold: true, size: 20 }, policy, 'body')],
    alignment: AlignmentType.LEFT,
    spacing: { after: 0 }
  })] });
}

function coverChildren(model, policy) {
  const fields = model.document_fields || {};
  const children = [
    new Paragraph({ children: [], spacing: { after: 1500 } }),
    new Paragraph({ children: [run(fields.project_name || model.project.name, { bold: true, size: policy.cover.title_size_half_points, color: policy.cover.title_color }, policy, 'heading1')], alignment: AlignmentType.CENTER, spacing: { after: 900 } }),
    new Paragraph({ children: [run('投 标 文 件', { bold: true, size: 40, color: policy.cover.title_color }, policy, 'heading1')], alignment: AlignmentType.CENTER, spacing: { after: 480 } }),
    new Paragraph({ children: [run('（技术部分）', { size: policy.cover.subtitle_size_half_points, color: policy.cover.title_color }, policy, 'body')], alignment: AlignmentType.CENTER, spacing: { after: 1800 } })
  ];
  const details = [
    ['项目编号', fields.project_number],
    ['项目名称', fields.project_name],
    ['投标人', fields.bidder],
    ['日期', fields.date]
  ].filter(([, value]) => value);
  for (const [label, value] of details) {
    children.push(new Paragraph({ children: [run(`${label}：${value}`, { size: policy.cover.label_size_half_points }, policy, 'body')], alignment: AlignmentType.CENTER, spacing: { after: 180 } }));
  }
  return children;
}

export async function renderBidDocument(model, { policy = getDocumentFormatPolicy() } = {}) {
  const header = pageHeader(model, policy);
  const footer = pageFooter(policy);
  const blankFooter = emptyFooter();
  const page = { size: { width: policy.page.width_dxa, height: policy.page.height_dxa }, margin: { top: policy.page.margin_dxa.top, right: policy.page.margin_dxa.right, bottom: policy.page.margin_dxa.bottom, left: policy.page.margin_dxa.left } };
  const headingStyle = (level) => {
    const style = policy.headings[level];
    return { id: `Heading${level}`, name: `Heading ${level}`, basedOn: 'Normal', next: 'Normal', run: { font: fontFor(policy, `heading${level}`), bold: true, size: style.size_half_points, color: style.color }, paragraph: { keepNext: true, spacing: { before: style.before, after: style.after }, outlineLevel: level - 1 } };
  };
  const doc = new Document({
    creator: '政企标书平台', title: model.title, subject: '正式投标响应文档',
    features: { updateFields: true },
    numbering: { config: [{ reference: 'bid-heading-numbering', levels: [0, 1, 2].map((level) => ({ level, format: LevelFormat.DECIMAL, text: level === 0 ? '%1' : level === 1 ? '%1.%2' : '%1.%2.%3', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720 * (level + 1), hanging: 360 } } } })) }] },
    styles: {
      default: { document: { run: { font: fontFor(policy, 'body'), size: policy.body.size_half_points }, paragraph: { spacing: { after: policy.body.spacing_after, line: policy.body.line_twips }, alignment: AlignmentType.JUSTIFIED } } },
      paragraphStyles: [
        { id: 'Normal', name: 'Normal', run: { font: fontFor(policy, 'body'), size: policy.body.size_half_points }, paragraph: { spacing: { after: policy.body.spacing_after, line: policy.body.line_twips }, alignment: AlignmentType.JUSTIFIED } },
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
        properties: { page, type: SectionType.NEXT_PAGE, titlePage: true },
        footers: { default: blankFooter, first: blankFooter },
        children: [
          new Paragraph({ children: [run(policy.toc.title, { bold: true, size: policy.headings[1].size_half_points }, policy, 'heading1')], alignment: AlignmentType.CENTER, spacing: { after: 240 } }),
          new Paragraph({ children: [run(policy.toc.note, { italics: true, size: 20, color: '667085' }, policy, 'body')], alignment: AlignmentType.CENTER, spacing: { after: 360 } }),
          new TableOfContents('', { hyperlink: true, headingStyleRange: policy.toc.heading_style_range, beginDirty: true })
        ]
      },
      {
        properties: { page: { ...page, pageNumbers: { start: policy.header_footer.page_number_start } }, type: SectionType.NEXT_PAGE },
        headers: { default: header },
        footers: { default: footer },
        children: contentChildren(model, policy)
      }
    ]
  });
  return Packer.toBuffer(doc);
}
