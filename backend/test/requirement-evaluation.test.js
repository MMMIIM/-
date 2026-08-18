import test from 'node:test';
import assert from 'node:assert/strict';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DocumentCapabilityDetector } from '../src/pipeline/document-capability-detector.js';
import { classifyTenderSections } from '../src/pipeline/tender-section-classifier.js';
import { loadEvaluationCases, RequirementExtractionEvaluator } from '../src/eval/requirement-extraction-evaluator.js';
import { RequirementParseService } from '../src/requirement-parse-service.js';

const evalDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '../eval');
const extraction = (values) => ({ text: values.join('\n'), paragraphs: values.map((text, index) => ({ text, paragraph: index + 1, page: index + 1 })), pages: [], warnings: [] });

test('DocumentCapabilityDetector 分类支持、加密、扫描和低质量文档', () => {
  const detector = new DocumentCapabilityDetector();
  assert.equal(detector.detect({ fileName: 'a.docx', mimeType: '', buffer: Buffer.from('x'), extraction: extraction(['技术要求', '系统应支持审计']) }).supported, true);
  assert.equal(detector.detect({ fileName: 'a.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF /Encrypt') }).unsupported_reason, 'ENCRYPTED_DOCUMENT');
  assert.equal(detector.detect({ fileName: 'a.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF'), extractionError: { code: 'TENDER_TEXT_EMPTY' } }).unsupported_reason, 'OCR_REQUIRED');
  assert.equal(detector.detect({ fileName: 'a.exe', mimeType: 'application/octet-stream', buffer: Buffer.from('x') }).unsupported_reason, 'UNSUPPORTED_DOCUMENT');
  assert.equal(detector.detect({ fileName: 'a.txt', mimeType: 'text/plain', buffer: Buffer.from('x'), extraction: extraction(['�'.repeat(100)]) }).unsupported_reason, 'EXTRACTION_QUALITY_TOO_LOW');
});

test('不支持文档在文本提取和Gateway之前阻断且不创建基线', async () => {
  let extracted = 0; let gatewayCalls = 0;
  const repository = {
    getProject: async () => ({ id: 'p' }), getRequirementBaseline: async () => null,
    getTenderFile: async () => ({ id: 'f', project_id: 'p', original_name: 'scan.pdf', mime_type: 'application/pdf', storage_key: 'x' }),
    createParseJob: async () => ({ id: 'j' }), updateParseJob: async () => ({ id: 'j' }), claimParseJob: async () => ({ id: 'j' }),
    failParseJob: async () => null
  };
  const service = new RequirementParseService({ repository, storage: { read: async () => Buffer.from('%PDF /Encrypt') }, textExtractor: async () => { extracted += 1; }, extractionGateway: { extract: async () => { gatewayCalls += 1; } } });
  await assert.rejects(() => service.start({ projectId: 'p', tenderFileId: 'f', waitForCompletion: true }), (error) => error.code === 'ENCRYPTED_DOCUMENT');
  assert.equal(extracted, 0); assert.equal(gatewayCalls, 0);
});

test('技术需求可从多个动态章节合并，不依赖固定章节号或标题', () => {
  const analysis = classifyTenderSections(extraction([
    '第一章 采购公告', '公告内容',
    '第三章 应用功能需求', '3.1 系统应支持统一登录。',
    '第七章 运维服务要求', '7.2 应提供告警通知。',
    '第九章 评审办法', '评分内容'
  ]));
  assert.equal(analysis.usedFullTextFallback, false);
  assert.deepEqual(analysis.technicalSection.chapter_numbers, [3, 7]);
  assert.match(analysis.technicalSection.content_text, /统一登录/);
  assert.match(analysis.technicalSection.content_text, /告警通知/);
});

test('无技术需求章节返回 NO_TECHNICAL_REQUIREMENTS_FOUND 而非全文误抽取', () => {
  const analysis = classifyTenderSections(extraction(['第一章 采购公告', '开标地点另行通知', '第二章 联系方式', '联系人信息']));
  assert.equal(analysis.technicalSection, null);
  assert.equal(analysis.warnings[0].code, 'NO_TECHNICAL_REQUIREMENTS_FOUND');
});

test('六案例离线CI评测达到固定Beta门槛且不访问网络', async () => {
  const cases = await loadEvaluationCases(evalDirectory);
  assert.deepEqual(cases.map((item) => item.id), ['E2E-R01', 'E2E-R02', 'E2E-R03', 'E2E-R04', 'E2E-R05', 'E2E-R06']);
  const report = new RequirementExtractionEvaluator().evaluate(cases);
  assert.equal(report.passed, true);
  assert.ok(Object.values(report.checks).every((item) => item.pass));
});
