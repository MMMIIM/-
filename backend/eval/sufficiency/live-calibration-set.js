const DOMAINS = ['GENERAL', 'GOVERNMENT_ENTERPRISE', 'HEALTHCARE', 'ENTERPRISE_PRIVATE'];

const CASE_SPECS = [
  ['LVC-001', '法规适用范围与公开原则的关系', '法规', 'EVIDENCE_REVIEW_READY', 'DIRECT_SUPPORT', '法规条款说明适用范围，并要求采购过程保持公开透明。'],
  ['LVC-002', '电子交易记录应如何留存', '标准', 'EVIDENCE_REVIEW_READY', 'DIRECT_SUPPORT', '电子交易规范要求关键操作记录可追溯并按规定留存。'],
  ['LVC-003', '企业是否具备跨部门数据交换交付能力', '实施交付', 'EVIDENCE_REVIEW_READY', 'DIRECT_SUPPORT', '企业交付材料列明跨部门数据交换的实施范围和验收交付物。'],
  ['LVC-004', '医院信息平台接口互通的验收依据', '项目验收', 'EVIDENCE_REVIEW_READY', 'DIRECT_SUPPORT', '项目验收记录包含医院信息平台接口互通的测试结果和签署日期。'],
  ['LVC-005', '企业安全资质的有效状态', '企业资质', 'EVIDENCE_REVIEW_READY', 'DIRECT_SUPPORT', '资质材料载明证书编号、有效期和当前审核状态。'],
  ['LVC-006', '产品是否支持分级授权管理', '产品能力', 'EVIDENCE_REVIEW_READY', 'DIRECT_SUPPORT', '产品说明明确支持按角色配置分级授权和访问范围。'],
  ['LVC-007', '第三方组件授权的使用边界', '第三方授权', 'EVIDENCE_REVIEW_READY', 'DIRECT_SUPPORT', '授权文件明确许可使用组件版本及允许的部署范围。'],
  ['LVC-008', '运维响应约定是否已有正式依据', 'SLA', 'EVIDENCE_REVIEW_READY', 'DIRECT_SUPPORT', '已批准服务协议明确工作日内响应时限和升级路径。'],
  ['LVC-009', '材料是否包含当前项目的固定响应承诺', 'SLA', 'NO_RELEVANT_EVIDENCE', 'UNRELATED', '材料介绍一般服务理念，没有当前项目的固定响应承诺。'],
  ['LVC-010', '某厂商认证编号是否出现在公共资料中', '企业资质', 'NO_RELEVANT_EVIDENCE', 'UNRELATED', '公共政策摘录讨论合规原则，未包含厂商认证编号。'],
  ['LVC-011', '医院正式验收是否已经完成', '项目验收', 'NO_RELEVANT_EVIDENCE', 'CONTEXT_ONLY', '医院案例只描述试点背景，没有正式验收记录。'],
  ['LVC-012', '跨行业产品案例能否证明本项目能力', '跨行业', 'NO_RELEVANT_EVIDENCE', 'CONTEXT_ONLY', '其他行业案例提供背景信息，未说明本项目所需能力。'],
  ['LVC-013', '企业是否承诺三年固定可用性', 'SLA', 'INSUFFICIENT_EVIDENCE', 'PARTIAL_SUPPORT', '材料描述运维覆盖范围，但没有三年固定可用性承诺。'],
  ['LVC-014', '企业是否拥有指定数据库产品能力', '产品能力', 'INSUFFICIENT_EVIDENCE', 'PARTIAL_SUPPORT', '授权材料说明可以使用该数据库，但未证明企业自有产品能力。'],
  ['LVC-015', '政务平台项目是否完成最终交付', '实施交付', 'INSUFFICIENT_EVIDENCE', 'PARTIAL_SUPPORT', '项目材料列出实施活动，但未提供最终交付确认记录。'],
  ['LVC-016', '企业规模是否满足投标文件要求', '企业规模', 'INSUFFICIENT_EVIDENCE', 'PARTIAL_SUPPORT', '企业简介描述人员结构，但没有覆盖该要求的当前规模证明。'],
  ['LVC-017', '数据安全法与网络数据规则如何衔接', '法规', 'EVIDENCE_REVIEW_READY', 'DIRECT_SUPPORT', '两份现行法规分别说明数据处理原则和网络数据治理边界。'],
  ['LVC-018', '平台接口标准是否支持异构系统接入', '标准', 'EVIDENCE_REVIEW_READY', 'DIRECT_SUPPORT', '技术标准列出异构系统接入所需的接口约束和一致性要求。'],
  ['LVC-019', '企业是否具备医疗数据治理实施经验', '实施交付', 'EVIDENCE_REVIEW_READY', 'DIRECT_SUPPORT', '企业案例记录医疗数据治理项目的实施范围和上线结果。'],
  ['LVC-020', '项目验收是否包含安全审计结果', '项目验收', 'EVIDENCE_REVIEW_READY', 'DIRECT_SUPPORT', '验收附件列出安全审计结果、整改项和复核结论。'],
  ['LVC-021', '第三方授权能否覆盖全部部署区域', '第三方授权', 'INSUFFICIENT_EVIDENCE', 'PARTIAL_SUPPORT', '授权书允许指定环境使用组件，但未覆盖全部部署区域。'],
  ['LVC-022', '产品说明是否包含固定性能数值', '产品能力', 'INSUFFICIENT_EVIDENCE', 'PARTIAL_SUPPORT', '产品说明描述功能边界，但没有可验证的固定性能数值。'],
  ['LVC-023', '通用标准是否证明企业已完成项目交付', '跨行业', 'NO_RELEVANT_EVIDENCE', 'CONTEXT_ONLY', '通用标准解释合规要求，不能证明企业完成了具体项目交付。'],
  ['LVC-024', '材料是否证明某不存在的证书编号', '企业资质', 'NO_RELEVANT_EVIDENCE', 'UNRELATED', '材料列出已有资质类别，但没有该证书编号。'],
  ['LVC-025', '企业报告的员工人数是否一致', '企业规模', 'CONFLICTING_EVIDENCE', 'CONTRADICTORY', '同一期间的两份企业报告分别记载员工人数为86人和96人。'],
  ['LVC-026', '项目完成日期是否已经确定', '项目验收', 'CONFLICTING_EVIDENCE', 'CONTRADICTORY', '一份项目记录写明完成日期为2024年6月，另一份写明为2024年9月。'],
  ['LVC-027', '第三方授权有效期是否一致', '第三方授权', 'CONFLICTING_EVIDENCE', 'CONTRADICTORY', '授权清单记录有效期至2026年3月，补充协议记录有效期至2026年6月。'],
  ['LVC-028', '服务响应时限是否存在两个版本', 'SLA', 'CONFLICTING_EVIDENCE', 'CONTRADICTORY', '服务协议一处写明4小时响应，变更记录写明8小时响应。'],
  ['LVC-029', '法规是否规定了适用主体和责任边界', '法规', 'EVIDENCE_REVIEW_READY', 'DIRECT_SUPPORT', '法规原文同时定义适用主体和责任边界，引用范围完整。'],
  ['LVC-030', '产品是否支持审计日志导出', '产品能力', 'EVIDENCE_REVIEW_READY', 'DIRECT_SUPPORT', '产品手册列出审计日志导出格式和操作步骤。'],
  ['LVC-031', '企业是否有当前项目的验收签字', '项目验收', 'INSUFFICIENT_EVIDENCE', 'PARTIAL_SUPPORT', '项目总结说明已完成测试，但缺少当前项目的验收签字页。'],
  ['LVC-032', '跨行业案例是否等同于本企业资质', '跨行业', 'NO_RELEVANT_EVIDENCE', 'CONTEXT_ONLY', '跨行业案例可以作为背景参考，不能替代本企业资质证明。']
];

function candidate(id, classification, excerpt, sourceType, score, supportSpan = null, conflictGroup = null) {
  return {
    candidate_id: id,
    source_type: sourceType,
    material_metadata: { scope: 'REPRESENTATIVE_SYNTHETIC', lifecycle_status: 'ACTIVE', effective_status: 'current' },
    safe_excerpt: excerpt,
    similarity: score,
    lineage: { material_id: `MAT-${id}`, chunk_id: `CHUNK-${id}`, source_hash: `hash-${id}` },
    gold_classification: classification,
    gold_support_span: supportSpan,
    ...(conflictGroup ? { gold_conflict_group: conflictGroup } : {})
  };
}

export const LIVE_CALIBRATION_CASES = Object.freeze(CASE_SPECS.map(([id, query, topic, expectedStatus, primaryClass, primaryExcerpt], index) => {
  const domain = DOMAINS[index % DOMAINS.length];
  const primaryId = `${id}-A`;
  const sourceType = topic === '企业资质' ? 'qualification' : topic === '项目验收' ? 'project_case' : topic === '产品能力' ? 'product_documentation' : topic === '第三方授权' ? 'authorization' : topic === '法规' ? 'public_policy' : topic === '标准' ? 'standard' : topic === 'SLA' ? 'delivery_capability' : topic === '实施交付' ? 'delivery_capability' : 'company_profile';
  const conflictGroup = expectedStatus === 'CONFLICTING_EVIDENCE' ? `${id}-FACT` : null;
  const primarySupport = ['DIRECT_SUPPORT', 'PARTIAL_SUPPORT', 'CONTRADICTORY'].includes(primaryClass) ? primaryExcerpt : null;
  const candidates = [candidate(primaryId, primaryClass, primaryExcerpt, sourceType, 0.82, primarySupport, conflictGroup)];
  if (expectedStatus === 'CONFLICTING_EVIDENCE') {
    candidates.push(candidate(`${id}-B`, 'CONTRADICTORY', primaryExcerpt.replace(/86人|2024年6月|2026年3月|4小时/gu, (value) => ({ '86人': '96人', '2024年6月': '2024年9月', '2026年3月': '2026年6月', '4小时': '8小时' }[value])), sourceType, 0.80, primaryExcerpt.replace(/86人|2024年6月|2026年3月|4小时/gu, (value) => ({ '86人': '96人', '2024年6月': '2024年9月', '2026年3月': '2026年6月', '4小时': '8小时' }[value])), conflictGroup));
  }
  const distractorClass = expectedStatus === 'NO_RELEVANT_EVIDENCE' ? 'CONTEXT_ONLY' : 'UNRELATED';
  for (let distractor = candidates.length; distractor < 5; distractor += 1) {
    const distractorId = `${id}-${String.fromCharCode(65 + distractor)}`;
    candidates.push(candidate(distractorId, distractorClass, `${topic}相关背景材料仅作范围说明，不形成该问题所需的直接证明。`, 'context_note', 0.52 - distractor * 0.02));
  }
  return Object.freeze({ id, domain, topic, query, expected_status: expectedStatus, candidates: Object.freeze(candidates) });
}));

export function classifierInput(caseItem) {
  return {
    query: caseItem.query,
    candidates: caseItem.candidates.map(({ gold_classification, gold_support_span, gold_conflict_group, ...safe }) => safe)
  };
}

export function goldAssessment(caseItem) {
  const reason = {
    DIRECT_SUPPORT: 'DIRECT_SOURCE_SUPPORT',
    PARTIAL_SUPPORT: 'PARTIAL_SOURCE_SUPPORT',
    CONTEXT_ONLY: 'CONTEXT_ONLY',
    UNRELATED: 'UNRELATED_SOURCE',
    CONTRADICTORY: 'CONTRADICTORY_SOURCE'
  };
  return caseItem.candidates.map((item) => ({ candidate_id: item.candidate_id, classification: item.gold_classification, support_span: item.gold_support_span, reason_code: reason[item.gold_classification] }));
}
