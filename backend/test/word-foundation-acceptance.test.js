import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { buildBidDocumentModel } from '../src/pipeline/bid-document-model.js';
import { validateDocumentStructure } from '../src/pipeline/document-structure-validator.js';
import { renderBidDocument } from '../src/pipeline/docx-renderer.js';
import { getDocumentFormatPolicy, getUsableBodyWidth } from '../src/pipeline/document-format-policy.js';

const project = { id: 'word-foundation-project', name: '示例技术标项目' };
const version = {
  id: 'word-foundation-version', project_id: project.id, generation_id: 'word-foundation-generation',
  version_number: 1, title: '示例技术响应', status: 'confirmed', risk_status: 'pass',
  final_text: '# 项目理解\n\n正文。',
  sections_json: [
    {
      chapter_id: 'chapter-01', title: '项目理解', order: 1,
      content_markdown: [
        '## 建设目标',
        '',
        '本项目围绕稳定交付和可验证成果展开，正文用于结构验收。',
        '',
        '### 建设原则',
        '',
        '采用可追溯、可编辑、可复核的实施原则。',
        '',
        '| 交付项 | 验收方式 |',
        '| --- | --- |',
        '| 实施方案 | 文档审查 |',
        '| 培训材料 | 现场确认 |',
        '',
        '补充说明。'
      ].join('\n')
    },
    {
      chapter_id: 'chapter-02', title: '实施方案', order: 2,
      content_markdown: '## 实施路径\n\n项目按阶段推进，完成后形成正式交付物。'
    }
  ]
};

async function xmlForFixture(policy = getDocumentFormatPolicy()) {
  const model = buildBidDocumentModel({ project, version });
  const buffer = await renderBidDocument(model, { policy });
  const zip = await JSZip.loadAsync(buffer);
  return {
    model,
    documentXml: await zip.file('word/document.xml').async('string'),
    stylesXml: await zip.file('word/styles.xml').async('string'),
    numberingXml: await zip.file('word/numbering.xml').async('string'),
    settingsXml: await zip.file('word/settings.xml').async('string')
  };
}

test('Word Foundation consolidated OOXML acceptance covers the system baseline', async () => {
  const policy = getDocumentFormatPolicy();
  const { model, documentXml, stylesXml, numberingXml, settingsXml } = await xmlForFixture(policy);

  assert.equal(validateDocumentStructure(model.sections).valid, true);
  assert.equal(policy.profile_id, 'SYSTEM_DEFAULT_TECHNICAL_BID_V1');
  assert.equal(policy.sections.body.chapter_page_break, 'none');
  assert.equal(policy.toc.render_mode, 'field_cached_entries');

  // Structure and pagination: no skipped headings, duplicate chapters, or
  // renderer-generated page breaks in the system default profile.
  assert.doesNotMatch(documentXml, /w:br w:type="page"/);
  assert.doesNotMatch(documentXml, /w:pageBreakBefore/);
  assert.match(stylesXml, /w:styleId="Heading1"[\s\S]*?w:keepNext/);
  assert.match(stylesXml, /w:styleId="Heading1"[\s\S]*?w:keepLines/);
  assert.match(documentXml, /w:widowControl/);

  // Numbering remains real Word numbering with a normal-space suffix.
  assert.equal((numberingXml.match(/w:suff w:val="space"/g) || []).length, 3);
  assert.doesNotMatch(numberingXml, /w:suff w:val="tab"/);
  assert.match(numberingXml, /w:ind w:left="360" w:hanging="180"/);
  assert.match(numberingXml, /w:ind w:left="720" w:hanging="180"/);
  assert.match(numberingXml, /w:ind w:left="1080" w:hanging="180"/);

  // Chinese EastAsia fonts, body rhythm, and page geometry are explicit.
  assert.match(stylesXml, /w:eastAsia="SimSun"/);
  assert.match(stylesXml, /w:eastAsia="SimHei"/);
  assert.match(documentXml, /w:firstLine="480"/);
  assert.match(documentXml, /w:spacing w:after="0" w:before="0" w:line="360"/);
  assert.match(documentXml, /w:pgMar w:top="1418" w:right="1418" w:bottom="1418" w:left="1701"/);

  // Table width, padding, repeatable header, and ordinary-row protection.
  const widths = [...documentXml.matchAll(/<w:tblW[^>]*w:w="(\d+)"/g)].map((match) => Number(match[1]));
  assert.ok(widths.length >= 1);
  assert.ok(widths.every((width) => width <= getUsableBodyWidth(policy)));
  assert.match(documentXml, /w:tcMar/);
  assert.match(documentXml, /w:tblHeader/);
  assert.equal((documentXml.match(/w:tblHeader/g) || []).length, 1);
  assert.doesNotMatch(documentXml, /w:tblHeader w:val="false"/);
  assert.match(documentXml, /w:cantSplit/);

  // Body section restarts visible page numbering at 1. TOC is a real field;
  // Word/WPS owns the final page references and must update it on open.
  assert.match(documentXml, /w:pgNumType w:start="1"/);
  assert.match(documentXml, /TOC/);
  assert.match(settingsXml, /updateFields/);
  assert.match(documentXml, /1 项目理解/);
  assert.match(documentXml, /1\.1 建设目标/);
  assert.match(documentXml, /1\.1\.1 建设原则/);
  assert.match(documentXml, /2 实施方案/);
  assert.match(documentXml, /2\.1 实施路径/);
  assert.doesNotMatch(documentXml, /目录页码将在 Word\/WPS 中更新目录后显示/);

  // Projection safety: technical identifiers never enter the formal story.
  assert.doesNotMatch(documentXml, /e2e\.|synthetic\.|data_classification|word-foundation-generation/);
});

test('Word Foundation validator rejects duplicate projected chapter headings', () => {
  assert.throws(() => buildBidDocumentModel({
    project,
    version: {
      ...version,
      sections_json: [
        { chapter_id: 'a', title: '重复章节', order: 1, content_markdown: '正文。' },
        { chapter_id: 'b', title: '重复章节', order: 2, content_markdown: '正文。' }
      ]
    }
  }), (error) => error.code === 'DOCUMENT_STRUCTURE_INVALID');
});

test('Word Foundation allows a tender override to force chapter pagination', async () => {
  const base = getDocumentFormatPolicy();
  const policy = { ...base, sections: { ...base.sections, body: { ...base.sections.body, chapter_page_break: 'before_heading' } } };
  const { documentXml } = await xmlForFixture(policy);
  assert.match(documentXml, /w:pageBreakBefore/);
});

test('Word Foundation repeats exactly one explicitly semantic table header row', async () => {
  const explicitHeaderVersion = {
    ...version,
    sections_json: [{
      chapter_id: 'table-01', title: '表格章节', order: 1,
      content_blocks: [{ kind: 'table', header_row_index: 0, rows: [['字段', '说明'], ['交付项', '文档审查'], ['培训', '现场确认']] }]
    }]
  };
  const model = buildBidDocumentModel({ project, version: explicitHeaderVersion });
  const buffer = await renderBidDocument(model);
  const zip = await JSZip.loadAsync(buffer);
  const documentXml = await zip.file('word/document.xml').async('string');
  assert.equal((documentXml.match(/w:tblHeader/g) || []).length, 1);
  assert.doesNotMatch(documentXml, /w:tblHeader w:val="false"/);
});

test('Word Foundation does not infer a repeated header for a table without semantic header metadata', async () => {
  const noHeaderVersion = {
    ...version,
    sections_json: [{
      chapter_id: 'table-02', title: '无表头章节', order: 1,
      content_blocks: [{ kind: 'table', rows: [['A', 'B'], ['1', '2']] }]
    }]
  };
  const model = buildBidDocumentModel({ project, version: noHeaderVersion });
  const buffer = await renderBidDocument(model);
  const zip = await JSZip.loadAsync(buffer);
  const documentXml = await zip.file('word/document.xml').async('string');
  assert.doesNotMatch(documentXml, /w:tblHeader/);
});

test('Markdown tables repeat a header only when a separator row declares one', () => {
  const withHeader = buildBidDocumentModel({
    project,
    version: { ...version, sections_json: [{ chapter_id: 'markdown-table-1', title: '有表头', order: 1, content_markdown: '| 字段 | 说明 |\n| --- | --- |\n| A | B |' }] }
  });
  const withoutHeader = buildBidDocumentModel({
    project,
    version: { ...version, sections_json: [{ chapter_id: 'markdown-table-2', title: '无表头', order: 1, content_markdown: '| A | B |\n| 1 | 2 |' }] }
  });
  assert.equal(withHeader.sections[0].content_blocks[0].header_row_index, 0);
  assert.equal(withoutHeader.sections[0].content_blocks[0].header_row_index, null);
});
