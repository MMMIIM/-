import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { extractTenderText } from '../src/tender-text-extractor.js';
import {
  createRequirementExtractionGateway,
  validateRequirementExtractionEnvelope
} from '../src/pipeline/requirement-extraction.js';
import { SemanticGatewayClient, SemanticGatewayError } from '../src/pipeline/semantic-gateway-client.js';
import { RequirementParseService } from '../src/requirement-parse-service.js';
import { createApp } from '../src/app.js';

async function createDocx(text) {
  const zip = new JSZip();
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8"?>
    <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
      <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
      <Default Extension="xml" ContentType="application/xml"/>
      <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
    </Types>`);
  zip.folder('_rels').file('.rels', `<?xml version="1.0" encoding="UTF-8"?>
    <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
      <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
    </Relationships>`);
  zip.folder('word').file('document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:body><w:p><w:r><w:t>${text}</w:t></w:r></w:p></w:body>
    </w:document>`);
  return zip.generateAsync({ type: 'nodebuffer' });
}

function createTextPdf(text) {
  const escaped = text.replace(/([\\()])/g, '\\$1');
  const stream = `BT /F1 12 Tf 72 720 Td (${escaped}) Tj ET`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => { pdf += `${String(offset).padStart(10, '0')} 00000 n \n`; });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf);
}

function gatewayResponse(raw, extraOutputs = {}) {
  return new Response(JSON.stringify({
    data: { outputs: { ...extraOutputs, response_payload_json: raw } }
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

function semanticClient(fetchImpl) {
  return new SemanticGatewayClient({
    apiBase: 'https://gateway.invalid/v1',
    apiKey: 'test-only',
    user: 'requirement-test',
    fetchImpl,
    timeoutMs: 100
  });
}

test('真实提取器支持 DOCX、文本型 PDF 和纯文本，且不修改输入 Buffer', async () => {
  const docx = await createDocx('Support security audit logs.');
  const docxCopy = Buffer.from(docx);
  const docxResult = await extractTenderText({ fileName: 'tender.docx', mimeType: '', buffer: docx });
  assert.match(docxResult.text, /security audit logs/);
  assert.deepEqual(docx, docxCopy);

  const pdf = createTextPdf('Tender requires standard API integration.');
  const pdfResult = await extractTenderText({ fileName: 'tender.pdf', mimeType: 'application/pdf', buffer: pdf });
  assert.match(pdfResult.text, /standard API integration/);
  assert.equal(pdfResult.pages[0].page, 1);

  const text = await extractTenderText({
    fileName: 'tender.txt', mimeType: 'text/plain', buffer: Buffer.from('Requirement A\nRequirement B')
  });
  assert.equal(text.paragraphs.length, 2);
});

test('无法提取、损坏文件和不支持类型返回可读错误码', async () => {
  await assert.rejects(
    () => extractTenderText({ fileName: 'empty.txt', mimeType: 'text/plain', buffer: Buffer.from('   ') }),
    (error) => error.code === 'TENDER_TEXT_EMPTY' && error.status === 422
  );
  await assert.rejects(
    () => extractTenderText({ fileName: 'broken.docx', mimeType: '', buffer: Buffer.from('broken') }),
    (error) => error.code === 'TENDER_TEXT_EXTRACTION_FAILED'
  );
  await assert.rejects(
    () => extractTenderText({ fileName: 'scan.png', mimeType: 'image/png', buffer: Buffer.from('image') }),
    (error) => error.code === 'TENDER_FILE_TYPE_UNSUPPORTED' && error.status === 415
  );
});

test('requirement_extraction 通过 think transport 并由后端稳定生成 REQ-ID', async () => {
  let inputs;
  const envelope = {
    schema_version: '4.3-gateway',
    task_type: 'requirement_extraction',
    status: 'success',
    data: {
      requirements: [
        { content: '提供审计日志。', source_excerpt: '系统应提供审计日志。', source_page: 2, source_paragraph: 8 },
        { content: '支持标准接口。', source_excerpt: '支持标准 API 接入。', source_page: 1, source_paragraph: 3 }
      ]
    },
    warnings: ['页码来自文本型 PDF。']
  };
  const raw = `<think>transport-only</think>\n${JSON.stringify(envelope)}`;
  const gateway = createRequirementExtractionGateway(semanticClient(async (_url, options) => {
    inputs = JSON.parse(options.body).inputs;
    return gatewayResponse(raw);
  }));

  const result = await gateway.extract({
    fileName: 'tender.pdf',
    text: '支持标准 API 接入。\n系统应提供审计日志。',
    paragraphs: [{ paragraph: 3, page: 1, text: '支持标准 API 接入。' }]
  });

  assert.equal(inputs.task_type, 'requirement_extraction');
  assert.equal(typeof inputs.task_payload_json, 'string');
  assert.deepEqual(result.candidates.map(({ req_id, content }) => ({ req_id, content })), [
    { req_id: 'REQ-001', content: '支持标准接口。' },
    { req_id: 'REQ-002', content: '提供审计日志。' }
  ]);
  assert.equal(result.audit.raw_response_payload_json, raw);
});

test('缺失唯一允许字段时不读取 result/text/answer', async () => {
  const forbidden = JSON.stringify({
    schema_version: '4.3-gateway', task_type: 'requirement_extraction', status: 'success',
    data: { requirements: [] }, warnings: []
  });
  const response = new Response(JSON.stringify({
    data: { outputs: { result: forbidden, text: forbidden, answer: forbidden } }
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  const gateway = createRequirementExtractionGateway(semanticClient(async () => response));
  await assert.rejects(
    () => gateway.extract({ fileName: 'a.txt', text: 'a', paragraphs: [] }),
    (error) => error.code === 'GATEWAY_RESPONSE_PAYLOAD_MISSING'
  );
});

test('非法网关候选：缺失字段、空需求、重复需求和模型生成 REQ-ID 均被拒绝', () => {
  const invalidData = [
    {},
    { requirements: [{ content: '', source_excerpt: 'source' }] },
    { requirements: [
      { content: 'same', source_excerpt: 'one' },
      { content: ' same ', source_excerpt: 'two' }
    ] },
    { requirements: [{ req_id: 'REQ-999', content: 'content', source_excerpt: 'source' }] }
  ];
  invalidData.forEach((data) => {
    assert.throws(() => validateRequirementExtractionEnvelope({
      envelope: {
        schema_version: '4.3-gateway', task_type: 'requirement_extraction',
        status: 'success', data, warnings: []
      },
      audit: { provider: 'semantic_gateway' }
    }), (error) => error.code === 'GATEWAY_REQUIREMENTS_INVALID');
  });
});

test('解析失败落审计且绝不创建或确认 Requirement 基线', async () => {
  let failedAudit;
  let completed = false;
  let confirmed = false;
  const repository = {
    getProject: async () => ({ id: 'project-1' }),
    getRequirementBaseline: async () => null,
    getTenderFile: async () => ({
      id: 'file-1', project_id: 'project-1', storage_key: 'project-1/file.txt',
      original_name: 'file.txt', mime_type: 'text/plain'
    }),
    createParseJob: async () => ({ id: 'parse-1' }),
    updateParseJob: async () => {},
    completeParseJob: async () => { completed = true; },
    failParseJob: async (audit) => { failedAudit = audit; },
    confirmRequirementBaseline: async () => { confirmed = true; }
  };
  const service = new RequirementParseService({
    repository,
    storage: { read: async () => Buffer.from('A valid tender requirement.') },
    textExtractor: extractTenderText,
    extractionGateway: {
      extract: async () => { throw new SemanticGatewayError('GATEWAY_REQUIREMENTS_INVALID', 'invalid', { raw_response_payload_json: '{bad' }, 422); }
    },
    logger: { error: () => {} }
  });

  await assert.rejects(
    () => service.start({ projectId: 'project-1', tenderFileId: 'file-1' }),
    (error) => error.code === 'GATEWAY_REQUIREMENTS_INVALID'
  );
  assert.equal(completed, false);
  assert.equal(confirmed, false);
  assert.equal(failedAudit.errorCode, 'GATEWAY_REQUIREMENTS_INVALID');
  assert.match(failedAudit.gatewayAudit.raw_response_payload_json, /^\[redacted:/);
});

test('确认服务只消费成功候选并由后端路由，已冻结基线拒绝替换', async () => {
  let persisted;
  const repository = {
    getParseJob: async () => ({
      id: 'parse-1', status: 'succeeded', candidates: [{
        req_id: 'REQ-001', content: '系统应提供安全审计日志。', source_excerpt: '提供安全审计日志。',
        source_page: 1, source_paragraph: 2, ordinal: 1
      }]
    }),
    confirmRequirementBaseline: async (value) => { persisted = value; return { baseline: { status: 'confirmed' }, requirements: value.requirements }; }
  };
  const service = new RequirementParseService({ repository });
  const result = await service.confirm('parse-1');
  assert.equal(result.baseline.status, 'confirmed');
  assert.deepEqual(persisted.requirements[0].target_sections, ['solution-design', 'security-compliance']);

  repository.confirmRequirementBaseline = async () => { throw Object.assign(new Error('frozen'), { code: 'REQUIREMENT_BASELINE_FROZEN' }); };
  await assert.rejects(
    () => service.confirm('parse-1'),
    (error) => error.code === 'REQUIREMENT_BASELINE_FROZEN' && error.status === 409
  );
});

test('解析、状态查询和基线确认 API 使用解析服务且不暴露内部审计', async () => {
  const calls = [];
  const requirementParseService = {
    start: async (value) => {
      calls.push(['start', value]);
      return { id: 'parse-1', status: 'succeeded', candidates: [] };
    },
    get: async (id) => {
      calls.push(['get', id]);
      return { id, status: 'succeeded', candidates: [], gateway_audit_json: undefined };
    },
    confirm: async (id) => {
      calls.push(['confirm', id]);
      return { baseline: { id: 'baseline-1', status: 'confirmed' }, requirements: [] };
    }
  };
  const app = createApp({
    repository: {}, storage: {}, generationService: {}, requirementParseService
  });
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;
  try {
    const started = await fetch(`${base}/api/projects/project-1/tender-parse-jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tender_file_id: 'file-1' })
    });
    assert.equal(started.status, 201);
    assert.equal((await started.json()).job.id, 'parse-1');

    const queried = await fetch(`${base}/api/tender-parse-jobs/parse-1`);
    const queryPayload = await queried.json();
    assert.equal(queried.status, 200);
    assert.equal(queryPayload.job.id, 'parse-1');
    assert.equal('gateway_audit_json' in queryPayload.job, false);

    const confirmed = await fetch(`${base}/api/tender-parse-jobs/parse-1/confirm`, { method: 'POST' });
    assert.equal(confirmed.status, 201);
    assert.equal((await confirmed.json()).baseline.status, 'confirmed');
    assert.deepEqual(calls, [
      ['start', { projectId: 'project-1', tenderFileId: 'file-1' }],
      ['get', 'parse-1'],
      ['confirm', 'parse-1']
    ]);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});
