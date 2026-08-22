import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { buildBidDocumentModel } from '../src/pipeline/bid-document-model.js';
import { DocumentDeliveryService } from '../src/pipeline/document-delivery-service.js';
import { renderBidDocument } from '../src/pipeline/docx-renderer.js';
import { createApp } from '../src/app.js';

const project = { id: 'project-word-1', name: '示例投标项目' };
const version = {
  id: 'version-word-1', project_id: project.id, generation_id: 'generation-word-1', version_number: 2,
  title: '技术响应 V2', status: 'confirmed', risk_status: 'pass', final_text: '# 总体方案\n\n正文。',
  sections_json: [{ chapter_id: 'chapter-01', title: '总体方案', order: 1, content_markdown: '## 实施路径\n\n第一段。\n\n| 项目 | 说明 |\n| --- | --- |\n| 范围 | 全部 |\n\n[[PAGE_BREAK]]\n\n第二段。' }]
};

test('Bid Document Model 保留稳定章节、标题、表格和分页内容块', () => {
  const model = buildBidDocumentModel({ project, version, approvedProjectFacts: [{ key: '投标人', value: '示例公司', review_status: 'approved' }] });
  assert.equal(model.model_version, 'bid-document-v1');
  assert.equal(model.sections[0].section_id, 'chapter-01');
  assert.deepEqual(model.sections[0].content_blocks.map((block) => block.kind), ['heading', 'paragraph', 'table', 'page_break', 'paragraph']);
  assert.equal(model.source.final_text_length, version.final_text.length);
  assert.deepEqual(model.approved_project_facts, [{ key: '投标人', value: '示例公司' }]);
});

test('DOCX renderer 产生真实 Heading、目录字段、页眉页脚与正文', async () => {
  const buffer = await renderBidDocument(buildBidDocumentModel({ project, version, approvedProjectFacts: [{ key: '投标人', value: '示例公司' }] }));
  assert.ok(buffer.length > 1000);
  const zip = await JSZip.loadAsync(buffer);
  const documentXml = await zip.file('word/document.xml').async('string');
  const settingsXml = await zip.file('word/settings.xml').async('string');
  const footerXml = await zip.file('word/footer1.xml').async('string');
  assert.match(documentXml, /w:val="Heading1"/);
  assert.match(documentXml, /TOC/);
  assert.match(documentXml, /示例投标项目/);
  assert.match(documentXml, /示例公司/);
  assert.match(documentXml, /w:tbl/);
  assert.match(settingsXml, /updateFields/);
  assert.match(footerXml, /instrText[^>]*>PAGE/);
});

test('Word export 复用版本风险门禁并记录审计，不接受严重风险版本', async () => {
  const saved = [];
  const repository = {
    async getProject() { return project; },
    async getPipelineDocumentVersion() { return version; },
    async createDocumentExport(value) { saved.push(value); return { id: 'export-1', ...value }; }
  };
  const storage = { async save({ originalName }) { return `project-word-1/${originalName}`; } };
  const service = new DocumentDeliveryService({ repository, storage, renderer: async () => Buffer.from('docx-fixture') });
  const result = await service.exportWord({ projectId: project.id, versionId: version.id });
  assert.equal(result.fileName, '示例投标项目-技术标-V2.docx');
  assert.equal(saved[0].versionId, version.id);
  repository.getPipelineDocumentVersion = async () => ({ ...version, risk_status: 'critical' });
  await assert.rejects(() => service.exportWord({ projectId: project.id, versionId: version.id }), (error) => error.code === 'CRITICAL_RISK');
});

test('Stage 4 export route returns downloadable DOCX with audit header', async () => {
  const app = createApp({ documentDeliveryService: { async exportWord() { return { buffer: Buffer.from('docx'), mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', fileName: '示例-技术标-V1.docx', audit: { id: 'export-route-1' } }; } } });
  const server = app.listen(0);
  try {
    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}/api/projects/p1/document-versions/v1/export-word`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    assert.equal(response.headers.get('x-document-export-id'), 'export-route-1');
    assert.equal(Buffer.from(await response.arrayBuffer()).toString(), 'docx');
  } finally { await new Promise((resolve) => server.close(resolve)); }
});
