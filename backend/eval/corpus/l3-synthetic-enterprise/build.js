import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const frozenAt = '2026-08-23T08:00:00.000Z';
const subject = '杭州景云数科有限公司';
const common = `SYNTHETIC_TEST_MATERIAL=true\nNOT_REAL_CUSTOMER_DATA=true\nsubject: ${subject}\nsource_type: synthetic_controlled\nsource_org: 杭州景云数科有限公司（虚构测试企业）\nlicense_or_usage_status: INTERNAL_TEST_ONLY\n`;

const definitions = [
  ['L3-ENT-001', 'company-profile.md', '企业简介', 'company_profile', '政企平台', 92, '企业为80—100人规模的区域政企数字化服务商，主营政务平台、智慧城市、数据治理、系统集成和运维服务。本文档仅用于合成评测。', {}],
  ['L3-ENT-002', 'qualification-iso9001.md', '质量管理体系证书', 'qualification', '政企平台', 90, '证书编号：JY-QMS-2025-001；有效期至：2028-06-30；状态：simulated_active。', { document_number: 'JY-QMS-2025-001', effective_status: 'active' }],
  ['L3-ENT-003', 'qualification-expired.md', '信息安全资格证书（已过期模拟件）', 'qualification', '政企平台', 84, '证书编号：JY-SEC-2022-009；有效期至：2024-12-31；状态：simulated_expired。该材料必须触发有效期复核，不得支撑当前承诺。', { document_number: 'JY-SEC-2022-009', effective_status: 'expired', controlled_case: 'expired_qualification' }],
  ['L3-ENT-004', 'case-city-governance.md', '城市治理数据平台案例', 'case', '政企平台', 88, '项目：景云城市治理数据平台；范围：数据目录、交换任务、统一门户和运行监测；项目状态：已完成模拟案例；验收日期：2025-11-20。', { case_status: 'completed' }],
  ['L3-ENT-005', 'case-hospital-insufficient.md', '医院数据集成案例（材料不充分）', 'case', '医疗行业', 83, '项目：景云医院数据集成试点；内容：完成接口联调和数据目录梳理；只有中选通知，没有合同和验收记录；日期：2025-10（具体日不详）。相关但不足以证明正式验收。', { controlled_case: 'relevant_but_insufficient', case_status: 'unknown' }],
  ['L3-ENT-006', 'product-government-platform.md', '政务协同平台产品资料', 'product', '政企平台', 91, '产品：JY-GOV-ONE；能力：事项协同、统一待办、数据目录、接口编排和审计留痕；未声明未列出的协议、吞吐量或服务等级。', {}],
  ['L3-ENT-007', 'product-health-platform.md', '医疗信息平台产品资料', 'product', '医疗行业', 87, '产品：JY-HIS-DATA；能力：医院数据交换、主数据映射、接口监控和数据质量规则；不代表已覆盖所有医院系统。', {}],
  ['L3-ENT-008', 'personnel-key.md', '关键人员材料', 'personnel', '政企平台', 86, '项目经理、架构师和实施工程师均为虚构人员档案；材料只说明角色与模拟经历，不证明具体项目可用性。', {}],
  ['L3-ENT-009', 'technical-data-governance.md', '数据治理技术能力说明', 'technical_capability', '政企平台', 89, '支持数据标准、目录编制、质量规则、共享交换和审计追踪；具体范围以项目需求与正式方案为准。', {}],
  ['L3-ENT-010', 'implementation-delivery.md', '实施交付能力说明', 'implementation', '政企平台', 88, '交付流程包括现状调研、方案确认、环境部署、接口联调、培训和上线支持；具体工期和责任边界需在项目中确认。', {}],
  ['L3-ENT-011', 'operations-after-sales.md', '运维售后服务说明', 'after_sales', '政企平台', 84, '提供工作日服务台、问题登记、版本维护和月度服务报告；不构成无条件7×24或固定分钟级响应承诺。', {}],
  ['L3-ENT-012', 'authorization-partner.md', '第三方产品授权说明', 'authorization', '政企平台', 82, '平台可集成某开源数据库和消息组件；部署、许可和技术支持依赖第三方，企业不将第三方能力表述为自有产品能力。', { controlled_case: 'third_party_dependency' }],
  ['L3-ENT-013', 'security-capability.md', '安全能力边界说明', 'technical_capability', '政企平台', 90, '支持访问控制、日志审计和传输加密配置；不自动证明等保等级、特定安全认证或未列出的检测结论。', {}],
  ['L3-ENT-014', 'company-fact-conflict-a.md', '企业规模事实（版本A）', 'company_profile', '政企平台', 83, '截至2025年内部统计，企业规模为86人。该数字为模拟事实，需与同一时期的其他材料核对。', { controlled_case: 'conflicting_company_fact', fact_version: 'A' }],
  ['L3-ENT-015', 'company-fact-conflict-b.md', '企业规模事实（版本B）', 'company_profile', '政企平台', 83, '截至2025年内部统计，企业规模为96人。该数字与版本A存在冲突，不能自动选择。', { controlled_case: 'conflicting_company_fact', fact_version: 'B' }],
  ['L3-ENT-016', 'marketing-sla.md', '宣传页服务指标（不支持承诺）', 'other', '政企平台', 81, '宣传材料写有“99.99%可用性、5分钟响应”，但没有测量报告、服务范围或审核记录；仅作为负例，不得形成正式承诺。', { controlled_case: 'unsupported_marketing_sla' }],
  ['L3-ENT-017', 'project-date-uncertain.md', '项目日期待确认记录', 'case', '医疗行业', 82, '医院数据集成试点的启动月份记为2025-10，但具体日期缺失，不能据此生成固定工期或完成日期。', { controlled_case: 'uncertain_project_date' }],
];

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

function render(definition) {
  const [id, , title, type, industry, , body, extra] = definition;
  return `${common}material_id: ${id}\nscope: enterprise\nindustry: ${industry}\nmaterial_type: ${type}\nreview_status: approved\n\n# ${title}\n\n${body}\n`;
}

export function buildL3SyntheticEnterprise() {
  fs.mkdirSync(here, { recursive: true });
  const materials = definitions.map(([id, file, title, type, industry, qualityScore, body, extra]) => {
    const content = render([id, file, title, type, industry, qualityScore, body, extra]);
    fs.writeFileSync(path.join(here, file), content, 'utf8');
    return {
      material_id: id,
      scope: 'enterprise',
      industry,
      material_type: type,
      title,
      source_org: subject,
      source_url: null,
      source_type: 'synthetic_controlled',
      document_number: extra.document_number || null,
      jurisdiction: 'CN',
      published_at: '2026-08-23',
      effective_from: extra.effective_status === 'expired' ? '2022-01-01' : '2025-01-01',
      effective_to: extra.effective_status === 'expired' ? '2024-12-31' : null,
      effective_status: extra.effective_status || 'current_status_required',
      authority_level: 'synthetic_test',
      license_or_usage_status: 'INTERNAL_TEST_ONLY',
      usage_status: 'ACTIVE_FULLTEXT',
      content_hash: sha256(content),
      parser_version: 'l3-fixture-parser-v1',
      chunking_version: 'enterprise-material-chunker-v1',
      quality_score: qualityScore,
      review_status: 'approved',
      review_notes: extra.controlled_case ? `Required controlled case: ${extra.controlled_case}` : 'Synthetic test material; no real enterprise identity.',
      retrieval_eval_status: 'passed',
      activated_at: '2026-08-23T08:30:00.000Z',
      synthetic_test_material: true,
      lifecycle: ['DISCOVERED', 'SCREENED', 'APPROVED_FOR_PROCESSING', 'PROCESSED', 'EVAL_PASSED', 'ACTIVE'],
      controlled_case: extra.controlled_case || null,
      fact_version: extra.fact_version || null,
      source_reference: file,
    };
  });
  const manifest = {
    schema_version: '4.3-corpus-l3-synthetic-enterprise-v1',
    corpus_type: 'synthetic_enterprise',
    subject,
    synthetic_test_material: true,
    frozen_at: frozenAt,
    materials,
    controlled_cases: ['expired_qualification', 'conflicting_company_fact', 'unsupported_marketing_sla', 'third_party_dependency', 'uncertain_project_date', 'relevant_but_insufficient'],
  };
  fs.writeFileSync(path.join(here, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return manifest;
}

export function loadL3SyntheticManifest() {
  return JSON.parse(fs.readFileSync(path.join(here, 'manifest.json'), 'utf8'));
}

export function validateL3SyntheticManifest(manifest = loadL3SyntheticManifest()) {
  const errors = [];
  if (manifest.schema_version !== '4.3-corpus-l3-synthetic-enterprise-v1') errors.push('SCHEMA_VERSION_INVALID');
  if (manifest.subject !== subject || manifest.synthetic_test_material !== true) errors.push('SYNTHETIC_IDENTITY_INVALID');
  const ids = new Set();
  for (const material of manifest.materials || []) {
    if (ids.has(material.material_id)) errors.push(`DUPLICATE:${material.material_id}`);
    ids.add(material.material_id);
    if (material.synthetic_test_material !== true) errors.push(`SYNTHETIC_FLAG_MISSING:${material.material_id}`);
    if (material.lifecycle.join('→') !== 'DISCOVERED→SCREENED→APPROVED_FOR_PROCESSING→PROCESSED→EVAL_PASSED→ACTIVE') errors.push(`LIFECYCLE_INVALID:${material.material_id}`);
    if (material.quality_score < 80 && material.lifecycle.at(-1) === 'ACTIVE') errors.push(`QUALITY_SCORE_TOO_LOW_FOR_ACTIVE:${material.material_id}`);
    const source = fs.readFileSync(path.join(here, material.source_reference), 'utf8');
    if (!source.includes('SYNTHETIC_TEST_MATERIAL=true')) errors.push(`LABEL_MISSING:${material.material_id}`);
    if (sha256(source) !== material.content_hash) errors.push(`HASH_MISMATCH:${material.material_id}`);
  }
  if (ids.size < 15 || ids.size > 20) errors.push('MATERIAL_COUNT_OUT_OF_RANGE');
  for (const required of manifest.controlled_cases || []) if (!manifest.materials.some((item) => item.controlled_case === required)) errors.push(`CONTROLLED_CASE_MISSING:${required}`);
  return { ok: errors.length === 0, errors, counts: { materials: manifest.materials.length, active: manifest.materials.filter((item) => item.lifecycle.at(-1) === 'ACTIVE').length, controlled_cases: manifest.controlled_cases.length } };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const manifest = buildL3SyntheticEnterprise();
  const result = validateL3SyntheticManifest(manifest);
  console.log(JSON.stringify(result));
  if (!result.ok) process.exitCode = 1;
}
