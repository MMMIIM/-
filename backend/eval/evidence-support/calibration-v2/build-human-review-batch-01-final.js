import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runSemanticReaudit } from './semantic-reaudit-v2.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPORT_PATH = path.join(HERE, 'semantic-reaudit-v2.json');
const JSON_PATH = path.join(HERE, 'human-review-batch-01-final.json');
const MARKDOWN_PATH = path.join(HERE, 'human-review-batch-01-final.md');

export const BATCH_01_FINAL_CASE_IDS = Object.freeze([
  'V2R-001-PERF-DIRECT',
  'V2R-003-COMP-DIRECT',
  'V2R-005-ISO-DIRECT',
  'V2R-002-PERF-PARTIAL',
  'V2R-004-COMP-PARTIAL',
  'V2R-006-ISO-SCOPE',
  'V2R-015-CORPUS-06',
  'V2R-008-NO-RELEVANT',
  'V2R-021-CORPUS-12',
  'V2R-030-CORPUS-21'
]);

const STATUS_LABELS = Object.freeze({
  EVIDENCE_REVIEW_READY: '可以进入证据审核',
  INSUFFICIENT_EVIDENCE: '证据不足',
  NO_RELEVANT_EVIDENCE: '没有相关证据',
  CONFLICTING_EVIDENCE: '证据存在冲突'
});

const SCOPE_LABELS = Object.freeze({
  ENTERPRISE_PRIVATE: '企业材料',
  GENERAL: '公开通用资料',
  GOVERNMENT_ENTERPRISE: '政府/行业公开资料',
  HEALTHCARE: '医疗行业公开资料'
});

const MATERIAL_TYPE_LABELS = Object.freeze({
  product_documentation: '产品资料',
  qualification: '资质材料',
  other: '其他资料',
  project_case: '项目案例',
  company_profile: '企业资料',
  technical_whitepaper: '行业/技术公开资料'
});

const WHY = Object.freeze({
  'V2R-001-PERF-DIRECT': '测试明确业务性能记录是否能直接支持要求。',
  'V2R-003-COMP-DIRECT': '测试兼容性矩阵中的明确 tested 结果能否形成直接支持。',
  'V2R-005-ISO-DIRECT': '测试资质名称、编号、状态和有效期是否构成完整证明。',
  'V2R-002-PERF-PARTIAL': '测试系统能否区分“没有数值证据”和“有明确数值但不满足要求”。',
  'V2R-004-COMP-PARTIAL': '测试多环境、多状态兼容性要求是否被误判为全部满足。',
  'V2R-006-ISO-SCOPE': '测试相关证书存在但指定主体和项目范围没有被证明时的边界。',
  'V2R-015-CORPUS-06': '测试行业公开规范与企业自身实施能力之间的边界。',
  'V2R-008-NO-RELEVANT': '测试相近资质资料是否会被误当成第三方防火墙检测报告。',
  'V2R-021-CORPUS-12': '测试第三方组件依赖能否被错误表述为企业自有能力。',
  'V2R-030-CORPUS-21': '测试项目案例存在但验收或项目状态不足时的保守判断。'
});

function displaySemantics(item) {
  const first = item.new_semantics[0] || {};
  return {
    semantic_relevance: first.semantic_relevance,
    evidence_capability: first.evidence_capability,
    support_level: first.support_level,
    semantic_relationship: first.semantic_relationship,
    review_dimensions: first.review_dimensions,
    reason_codes: first.reason_codes || [],
    support_observations: item.support_observations,
    conflict_observations: item.conflict_observations,
    semantic_boundaries: item.semantic_boundaries,
    audit_reason: item.change_reason
  };
}

function reviewCase(item, sequence) {
  return {
    case_id: item.case_id,
    sequence,
    why_this_case_is_in_calibration: WHY[item.case_id],
    requirement: item.requirement,
    sources: item.sources,
    system_draft: {
      provenance: 'SYSTEM_DRAFT_REAUDITED',
      status: item.new_draft_status,
      status_label: STATUS_LABELS[item.new_draft_status] || item.new_draft_status,
      semantics: displaySemantics(item),
      old_draft_status: item.old_draft_status,
      expected_gold: item.expected_gold,
      gold_provenance: item.gold_provenance
    },
    review_decision: {
      reviewer_decision: null,
      reviewer_status_override: null,
      reviewer_semantic_override: null,
      reviewer_reason: null,
      reviewed_at: null
    }
  };
}

function sourceMarkdown(source, index) {
  return [
    `### 资料 ${index + 1}`,
    '',
    `材料名称：${source.material_name}`,
    `材料类型：${MATERIAL_TYPE_LABELS[source.material_type] || source.material_type}`,
    `范围：${SCOPE_LABELS[source.corpus_scope] || source.corpus_scope}`,
    `来源定位：chunk ${source.chunk_id}，offset ${source.start_offset}–${source.end_offset}`,
    '',
    'Evidence 原文：',
    '```text',
    source.source_text,
    '```',
    '',
    '必要 Context（仅帮助理解，不替代 Evidence）：',
    '```text',
    source.context_before || '（无）',
    source.context_after || '（无）',
    '```',
    ''
  ];
}

function caseMarkdown(item) {
  const semantics = item.system_draft.semantics;
  const lines = [
    `# CASE ${item.case_id}`,
    '',
    `## WHY_THIS_CASE_IS_IN_CALIBRATION`,
    '',
    item.why_this_case_is_in_calibration,
    '',
    '## 招标要求',
    '',
    item.requirement.text,
    '',
    '## 系统找到的资料',
    ''
  ];
  item.sources.forEach((source, index) => lines.push(...sourceMarkdown(source, index)));
  lines.push(
    '## System Draft Semantic Judgment',
    '',
    `semantic relevance：${semantics.semantic_relevance}`,
    `evidence capability：${semantics.evidence_capability}`,
    `support level：${semantics.support_level}`,
    `semantic relationship：${semantics.semantic_relationship}`,
    `review dimensions：${JSON.stringify(semantics.review_dimensions)}`,
    `reason codes：${semantics.reason_codes.join('、') || '无'}`,
    '',
    '## System Draft Business Status',
    '',
    `${item.system_draft.status_label}（${item.system_draft.status}）`,
    '',
    '## 系统理由',
    '',
    ...(semantics.audit_reason || ['该案例使用修复后的 Evidence Span 重新审计。']).map(reason => `- ${reason}`),
    '',
    '## 人工审核选项',
    '',
    'A. APPROVE：系统判断正确。',
    '',
    'B. CHANGE：系统判断需要修改。',
    '',
    'C. REJECT：该题不适合成为 Calibration Case。',
    '',
    '人工决定：__________',
    '',
    '人工理由：__________',
    '',
    '---',
    ''
  );
  return lines;
}

export function buildHumanReviewBatch01Final({ report = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8')) } = {}) {
  const byId = new Map((report.cases || []).map(item => [item.case_id, item]));
  const missing = BATCH_01_FINAL_CASE_IDS.filter(id => !byId.has(id));
  if (missing.length) throw new Error(`BATCH_CASE_NOT_FOUND:${missing.join(',')}`);
  const selected = BATCH_01_FINAL_CASE_IDS.map((id, index) => reviewCase(byId.get(id), index + 1));
  const statusCounts = Object.fromEntries(Object.keys(STATUS_LABELS).map(status => [status, selected.filter(item => item.system_draft.status === status).length]));
  const rejected = report.rejected_cases || [];
  const packet = {
    schema_version: '4.3-evidence-support-calibration-v2-human-review-batch-v2',
    batch_id: 'CALIBRATION-V2-HUMAN-REVIEW-BATCH-01-FINAL',
    status: 'READY_FOR_HUMAN_REVIEW',
    source_report: 'semantic-reaudit-v2.json',
    source_candidate_count: report.original_candidates,
    active_candidate_count: report.valid_span_candidates,
    rejected_count: report.rejected_count,
    rejected_cases: rejected,
    case_count: selected.length,
    selected_case_ids: selected.map(item => item.case_id),
    status_counts: statusCounts,
    boundary_coverage: ['direct/full support', 'quantitative adverse fact', 'multi-dimension partial', 'subject/scope insufficiency', 'industry reference != enterprise capability', 'true no-relevant', 'third-party boundary', 'project status boundary'],
    model_calls: 0,
    provider_calls: 0,
    embedding_calls: 0,
    automatic_human_approval: false,
    dataset_frozen: false,
    calibration_executed: false,
    manual_sample_gate_ready: true,
    conflict_case_missing: true,
    cases: selected
  };
  const markdown = [
    '# CALIBRATION V2 HUMAN GOLD REVIEW BATCH 1',
    '',
    '> 本批仅供人工审核。所有决定字段保持 null；不得自动批准、不得冻结数据集、不得执行 Calibration。',
    `> Active candidates：${packet.active_candidate_count}；Rejected：${packet.rejected_count}；本批：${packet.case_count}。`,
    '',
    '## BATCH',
    '',
    `- selected IDs：${packet.selected_case_ids.join('、')}`,
    `- READY：${statusCounts.EVIDENCE_REVIEW_READY}`,
    `- INSUFFICIENT：${statusCounts.INSUFFICIENT_EVIDENCE}`,
    `- NO_RELEVANT：${statusCounts.NO_RELEVANT_EVIDENCE}`,
    `- CONFLICT：${statusCounts.CONFLICTING_EVIDENCE}`,
    '- V2R-009：REJECT_FROM_CALIBRATION / GOLD_DESIGN_INVALID',
    '',
    '## REVIEW OPTIONS',
    '',
    '每题只能选择 APPROVE、CHANGE 或 REJECT；Codex 不填写人工决定。',
    ''
  ];
  selected.forEach(item => markdown.push(...caseMarkdown(item)));
  markdown.push(
    '## REVIEW STATE',
    '',
    '- Human reviewed：0',
    '- Automatically approved：0',
    '- Dataset frozen：NO',
    '- Calibration executed：NO',
    '- Manual Sample Gate：YES',
    '',
    '## KNOWN GAPS',
    '',
    '- class imbalance',
    '- CONFLICT case missing from valid calibration set',
    '- REAL_RETRIEVAL_OUTPUT = 0',
    '- CURATED_REAL_SOURCE_TOP5 = 0',
    '- Provider network remains BLOCKED_BY_PROVIDER_NETWORK',
    ''
  );
  return { packet, markdown: `${markdown.join('\n')}\n` };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const { packet, markdown } = buildHumanReviewBatch01Final();
  fs.writeFileSync(JSON_PATH, `${JSON.stringify(packet, null, 2)}\n`, 'utf8');
  fs.writeFileSync(MARKDOWN_PATH, markdown, 'utf8');
  console.log(JSON.stringify({ output: MARKDOWN_PATH, json: JSON_PATH, case_count: packet.case_count, status_counts: packet.status_counts, rejected_count: packet.rejected_count, model_calls: 0, provider_calls: 0 }));
}
