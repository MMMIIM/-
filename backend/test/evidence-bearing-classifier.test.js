import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyEvidenceBearing, isMetadataOrHeader } from '../src/pipeline/evidence-bearing-classifier.js';

test('metadata/frontmatter cannot be Evidence-Bearing', () => {
  const source = 'SYNTHETIC_TEST_MATERIAL=true\nsubject: 澄明数科（示范）有限公司\nmaterial_id: SME-004\nscope: enterprise';
  assert.equal(isMetadataOrHeader(source), true);
  assert.equal(classifyEvidenceBearing({ requirement: { text: '企业应提供性能测试记录。' }, sourceText: source }).classification, 'METADATA_OR_HEADER');
});

test('title-only chunk is metadata/header', () => {
  assert.equal(classifyEvidenceBearing({ requirement: { text: '企业应提供ISO认证。' }, sourceText: '# ISO 27001 受控记录' }).classification, 'METADATA_OR_HEADER');
});

test('numeric requirement requires matching factual metric, not any number', () => {
  const requirement = { text: '支持在线用户量>=10000人，并发量100次/秒，识别率≥98%。' };
  const profile = '企业为80—100人规模的区域政企数字化服务商。';
  const metric = '在线用户量10000人，并发量100次/秒，普通话识别率98%。';
  assert.equal(classifyEvidenceBearing({ requirement, sourceText: profile }).classification, 'TOPIC_RELEVANT_ONLY');
  assert.equal(classifyEvidenceBearing({ requirement, sourceText: metric }).classification, 'EVIDENCE_BEARING');
});

test('compatibility requirement rejects third-party database boundary as evidence', () => {
  const requirement = { text: '兼容X86架构，配合支持国产化的操作系统和数据库改造。' };
  const source = '平台可集成某开源数据库和消息组件；部署、许可和技术支持依赖第三方。';
  assert.equal(classifyEvidenceBearing({ requirement, sourceText: source }).classification, 'TOPIC_RELEVANT_ONLY');
});

test('compatibility matrix with tested status is Evidence-Bearing', () => {
  const requirement = { text: '产品兼容x86_64、Ubuntu和PostgreSQL环境。' };
  const source = 'x86_64 + Ubuntu 22.04 + PostgreSQL 14：tested';
  const result = classifyEvidenceBearing({ requirement, sourceText: source });
  assert.equal(result.classification, 'EVIDENCE_BEARING');
  assert.ok(result.supported_dimensions.includes('status_match'));
});

test('industry reference stays reference-only', () => {
  const requirement = { text: '企业应证明自身具备与公开行业规范相符的实施能力。' };
  const result = classifyEvidenceBearing({ requirement, sourceText: '条例提出统一政务服务信息资源目录和交换体系。', candidate: { proof_eligibility: 'REFERENCE_CONTEXT' } });
  assert.equal(result.classification, 'REFERENCE_CONTEXT_ONLY');
});

test('project status and acceptance facts can support project requirement', () => {
  const requirement = { text: '企业应提供已完成并可验收的同类项目记录。' };
  const source = '项目：南泽业务协同升级；实施日期：2025-10-09；状态：已完成并通过验收。';
  assert.equal(classifyEvidenceBearing({ requirement, sourceText: source }).classification, 'EVIDENCE_BEARING');
});

test('generic company profile is not proof of a specific city-governance requirement', () => {
  const requirement = { text: '通过城市治理平台实现数据目录和交换任务能力。' };
  const source = '企业主营政务平台、智慧城市、数据治理、系统集成和运维服务。';
  assert.equal(classifyEvidenceBearing({ requirement, sourceText: source }).classification, 'TOPIC_RELEVANT_ONLY');
});

test('performance capability text is not a performance test record', () => {
  const requirement = { text: '企业应提供可核验的数据交换平台性能测试记录。' };
  const source = '产品：澄明数据交换平台 V3.2\n能力：REST API 接入、数据目录、交换任务调度、运行日志。\n未声明吞吐量或 SLA。';
  const result = classifyEvidenceBearing({ requirement, sourceText: source });
  assert.equal(result.classification, 'TOPIC_RELEVANT_ONLY');
  assert.deepEqual(result.supported_dimensions, []);
});

test('compatibility evidence requires a requested environment anchor', () => {
  const requirement = { text: '企业应说明产品在 x86_64、Ubuntu 和 PostgreSQL 环境的兼容性。' };
  const source = '优先成熟 MIT / Apache-2.0 等兼容开源组件。';
  const result = classifyEvidenceBearing({ requirement, sourceText: source });
  assert.equal(result.classification, 'TOPIC_RELEVANT_ONLY');
});

test('qualification evidence requires the requested certificate identifier', () => {
  const requirement = { text: '企业应提供当前有效的 ISO/IEC 27001 认证信息。' };
  const source = '名称：ISO 9001\n编号：CM-Q-9001-2025\n状态：active\n有效至：2028-03-31';
  const result = classifyEvidenceBearing({ requirement, sourceText: source });
  assert.equal(result.classification, 'TOPIC_RELEVANT_ONLY');
});

test('project主体 makes scope a required evidence dimension', () => {
  const requirement = { text: '企业应提供指定项目主体的 ISO/IEC 27001 证书。' };
  const source = '企业持有在有效期内的 ISO/IEC 27001 受控记录。';
  const result = classifyEvidenceBearing({ requirement, sourceText: source });
  assert.ok(result.required_dimensions.includes('scope_match'));
  assert.equal(result.classification, 'TOPIC_RELEVANT_ONLY');
});
