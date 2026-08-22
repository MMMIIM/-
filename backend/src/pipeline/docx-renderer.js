import {
  AlignmentType, BorderStyle, Document, Footer, Header, HeadingLevel, LevelFormat,
  PageBreak, PageNumber, Paragraph, Packer, Table, TableCell, TableOfContents, TableRow,
  TextRun, WidthType
} from 'docx';
import { getDocumentFormatPolicy } from './document-format-policy.js';

const font = { name: 'Calibri', eastAsia: 'Microsoft YaHei', hAnsi: 'Calibri' };

function run(value, options = {}) {
  return new TextRun({ text: String(value ?? ''), font, ...options });
}

function paragraph(textValue, policy) {
  return new Paragraph({
    children: [run(textValue)],
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: policy.body.first_line_indent },
    spacing: { after: policy.body.spacing_after, line: policy.body.line_twips },
    style: 'Normal'
  });
}

function heading(block, policy) {
  const level = Math.max(1, Math.min(3, Number(block.level) || 1));
  const style = policy.headings[level] || policy.headings[1];
  return new Paragraph({
    children: [run(block.text, { bold: true, size: style.size_half_points, color: style.color })],
    heading: [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3][level - 1],
    numbering: { reference: 'bid-heading-numbering', level: level - 1 },
    spacing: { before: style.before, after: style.after },
    keepNext: true
  });
}

function table(block, policy) {
  const rows = block.rows.map((cells, rowIndex) => new TableRow({
    tableHeader: rowIndex === 0,
    children: cells.map((cell) => new TableCell({
      shading: rowIndex === 0 ? { fill: policy.table.header_fill } : undefined,
      margins: policy.table.cell_margin,
      children: [new Paragraph({ children: [run(cell, { bold: rowIndex === 0 })], style: 'Normal' })]
    }))
  }));
  const count = Math.max(1, block.rows.reduce((max, row) => Math.max(max, row.length), 1));
  const width = Math.floor(policy.table.width_dxa / count);
  return new Table({ rows, width: { size: policy.table.width_dxa, type: WidthType.DXA }, columnWidths: Array.from({ length: count }, () => width), layout: 'fixed', indent: { size: 120, type: WidthType.DXA }, borders: { top: { style: BorderStyle.SINGLE, size: 4, color: 'D9E2F3' }, bottom: { style: BorderStyle.SINGLE, size: 4, color: 'D9E2F3' }, left: { style: BorderStyle.SINGLE, size: 4, color: 'D9E2F3' }, right: { style: BorderStyle.SINGLE, size: 4, color: 'D9E2F3' }, insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: 'E5E7EB' }, insideVertical: { style: BorderStyle.SINGLE, size: 2, color: 'E5E7EB' } } });
}

function contentChildren(model, policy) {
  const children = [];
  if (model.approved_project_facts.length) {
    children.push(new Paragraph({ children: [run('项目统一信息', { bold: true, size: policy.headings[2].size_half_points, color: policy.headings[2].color })], heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 120 }, keepNext: true }));
    children.push(table({ rows: [['信息项', '当前值'], ...model.approved_project_facts.map((fact) => [fact.key, fact.value])] }, policy));
  }
  for (const section of model.sections) {
    children.push(new Paragraph({ children: [run(section.title, { bold: true })], heading: HeadingLevel.HEADING_1, numbering: { reference: 'bid-heading-numbering', level: 0 }, spacing: { before: 360, after: 200 }, keepNext: true }));
    for (const block of section.content_blocks) {
      if (block.kind === 'heading') children.push(heading(block, policy));
      else if (block.kind === 'table') children.push(table(block, policy));
      else if (block.kind === 'page_break') children.push(new Paragraph({ children: [new PageBreak()] }));
      else if (block.kind === 'image') children.push(new Paragraph({ children: [run(`[图片占位：${block.alt}]`, { italics: true, color: '667085' })], alignment: AlignmentType.CENTER }));
      else if (block.text) children.push(paragraph(block.text, policy));
    }
  }
  return children;
}

export async function renderBidDocument(model, { policy = getDocumentFormatPolicy() } = {}) {
  const header = new Header({ children: [new Paragraph({ children: [run(model.project.name, { bold: true, color: '2E74B5' })], alignment: AlignmentType.LEFT })] });
  const footer = new Footer({ children: [new Paragraph({ children: [run('第 '), new TextRun({ children: [PageNumber.CURRENT], font }), run(' 页')], alignment: AlignmentType.CENTER })] });
  const doc = new Document({
    creator: 'Bid Platform', title: model.title, subject: '正式投标响应文档', description: `DocumentVersion ${model.version.id}`,
    features: { updateFields: true },
    numbering: { config: [{ reference: 'bid-heading-numbering', levels: [0, 1, 2].map((level) => ({ level, format: LevelFormat.DECIMAL, text: level === 0 ? '%1' : level === 1 ? '%1.%2' : '%1.%2.%3', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720 * (level + 1), hanging: 360 } } } })) }] },
    styles: { default: { document: { run: { font, size: policy.body.size_half_points }, paragraph: { spacing: { after: policy.body.spacing_after, line: policy.body.line_twips }, alignment: AlignmentType.JUSTIFIED } } }, paragraphStyles: [
      { id: 'Normal', name: 'Normal', run: { font, size: policy.body.size_half_points }, paragraph: { spacing: { after: policy.body.spacing_after, line: policy.body.line_twips }, alignment: AlignmentType.JUSTIFIED } },
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', run: { font, bold: true, size: policy.headings[1].size_half_points, color: policy.headings[1].color }, paragraph: { keepNext: true, spacing: { before: policy.headings[1].before, after: policy.headings[1].after }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', run: { font, bold: true, size: policy.headings[2].size_half_points, color: policy.headings[2].color }, paragraph: { keepNext: true, spacing: { before: policy.headings[2].before, after: policy.headings[2].after }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', run: { font, bold: true, size: policy.headings[3].size_half_points, color: policy.headings[3].color }, paragraph: { keepNext: true, spacing: { before: policy.headings[3].before, after: policy.headings[3].after }, outlineLevel: 2 } }
    ] },
    sections: [{ properties: { page: { size: { width: policy.page.width_dxa, height: policy.page.height_dxa }, margin: { top: policy.page.margin_dxa.top, right: policy.page.margin_dxa.right, bottom: policy.page.margin_dxa.bottom, left: policy.page.margin_dxa.left } } }, headers: { default: header }, footers: { default: footer }, children: [
      new Paragraph({ children: [run(model.title, { bold: true, size: 36, color: '1F4D78' })], alignment: AlignmentType.CENTER, spacing: { after: 480 } }),
      new Paragraph({ children: [run(`项目：${model.project.name} · 版本：V${model.version.number}`)], alignment: AlignmentType.CENTER, spacing: { after: 480 } }),
      new TableOfContents('目录', { hyperlink: true, headingStyleRange: '1-3', beginDirty: true }),
      new Paragraph({ children: [new PageBreak()] }),
      ...contentChildren(model, policy)
    ] }]
  });
  return Packer.toBuffer(doc);
}
