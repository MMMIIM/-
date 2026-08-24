import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const POOL_PATH = path.join(HERE, 'candidate-pool-v2-remediated.json');
const JSON_PATH = path.join(HERE, 'human-review-batch-01.json');
const MARKDOWN_PATH = path.join(HERE, 'human-review-batch-01.md');

// Deliberate, auditable selection. This is a review packet, not a Gold edit.
export const BATCH_01_CASE_IDS = [
  'V2R-001-PERF-DIRECT',
  'V2R-003-COMP-DIRECT',
  'V2R-005-ISO-DIRECT',
  'V2R-002-PERF-PARTIAL',
  'V2R-006-ISO-SCOPE',
  'V2R-021-CORPUS-12',
  'V2R-030-CORPUS-21',
  'V2R-015-CORPUS-06',
  'V2R-009-ISO-CONFLICT',
  'V2R-004-COMP-PARTIAL'
];

const STATUS_LABELS = {
  EVIDENCE_REVIEW_READY: '可以进入证据审核',
  INSUFFICIENT_EVIDENCE: '证据不足',
  NO_RELEVANT_EVIDENCE: '没有相关证据',
  CONFLICTING_EVIDENCE: '证据存在冲突'
};
const RELATION_LABELS = {
  direct: '直接相关',
  partial: '部分相关',
  related: '有关联，但不能直接证明',
  unrelated: '无直接关联',
  conflict: '不同材料之间存在冲突'
};
const SUPPORT_LABELS = {
  full_support: '系统草稿认为材料完整覆盖要求',
  partial_support: '系统草稿认为材料只覆盖要求的一部分',
  reference_only: '系统草稿认为材料只能作为参考，不能证明要求',
  insufficient: '系统草稿认为材料不足以形成证明',
  conflict: '系统草稿认为材料对同一事实给出了不一致信息'
};
const CAPABILITY_LABELS = {
  capable: '材料类型具备证明该类事实的可能性',
  reference_only: '材料只能提供背景或参考',
  not_capable: '材料本身不能证明该要求'
};
const RELEVANCE_LABELS = {
  relevant: '与招标要求有一定关联',
  irrelevant: '与招标要求无直接关联'
};
const SCOPE_LABELS = {
  ENTERPRISE_PRIVATE: '企业材料',
  GENERAL: '公开通用资料',
  GOVERNMENT_ENTERPRISE: '政府/行业公开资料',
  HEALTHCARE: '医疗行业公开资料'
};
const MATERIAL_TYPE_LABELS = {
  product_documentation: '产品资料',
  qualification: '资质材料',
  other: '其他资料',
  project_case: '项目案例',
  company_profile: '企业资料',
  technical_whitepaper: '行业/技术公开资料'
};

function firstSemantics(item) {
  return item.draft_semantics?.[0] || {};
}

function allObservations(item, field) {
  return (item.draft_semantics || []).flatMap(semantics => semantics[field] || []);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function boundaryLabels(item) {
  const tags = new Set(item.requirement?.boundary_tags || []);
  const labels = [];
  if (tags.has('quantitative') || tags.has('exact_numeric_requirement')) labels.push('数值要求');
  if (tags.has('direct_support')) labels.push('直接支持');
  if (tags.has('reference_only')) labels.push('仅供参考');
  if (tags.has('scope_mismatch') || tags.has('wrong_entity')) labels.push('主体或范围不一致');
  if (tags.has('third_party_boundary')) labels.push('第三方能力边界');
  if (tags.has('industry_reference') || tags.has('enterprise_capability_boundary')) labels.push('行业参考不等于企业能力');
  if (tags.has('freshness') || tags.has('superseded') || tags.has('validity')) labels.push('时效或有效性');
  if (tags.has('conflict')) labels.push('事实冲突');
  if (tags.has('unknown') || tags.has('partial_multi_dimension')) labels.push('多维度/待确认');
  if (tags.has('project_status') || tags.has('status_unknown')) labels.push('项目状态未充分证明');
  return unique(labels);
}

function reasonLines(item, semantics) {
  const tags = new Set(item.requirement?.boundary_tags || []);
  const lines = [
    `招标要求：${item.requirement.text}`,
    `系统草稿看到的资料范围：${(item.sources || []).map(source => source.material_name).join('、') || '无直接资料'}`
  ];
  if (item.draft_aggregated_status === 'EVIDENCE_REVIEW_READY') {
    lines.push('系统草稿认为资料与要求的主体和范围相符，但请人工核对原文是否真的包含所要求的证明内容。');
  } else if (item.draft_aggregated_status === 'NO_RELEVANT_EVIDENCE') {
    lines.push('系统草稿认为现有资料与要求的主体、范围或事实类型不匹配，不能把相近主题当作证明。');
  } else if (item.draft_aggregated_status === 'CONFLICTING_EVIDENCE') {
    lines.push('系统草稿认为不同资料对同一有效性事实给出了冲突观察，当前不能直接选定其中一份。');
  } else {
    lines.push('系统草稿认为资料只能覆盖部分要求，尚不足以支持完整承诺。');
  }
  if (tags.has('quantitative') || tags.has('exact_numeric_requirement')) lines.push('需要核对数字、单位或测试范围是否在原文中明确出现。');
  if (tags.has('third_party_boundary')) lines.push('第三方组件或授权不能直接表述为本企业自有能力。');
  if (tags.has('industry_reference') || tags.has('enterprise_capability_boundary')) lines.push('行业规范或公开指南只能说明外部要求，不能单独证明企业已经具备对应能力。');
  if (tags.has('scope_mismatch') || tags.has('wrong_entity')) lines.push('需要核对证明主体和本项目范围是否一致。');
  if (tags.has('freshness') || tags.has('superseded') || tags.has('validity')) lines.push('需要核对材料的当前有效性和是否已被更新材料替代。');
  if (tags.has('unknown') || tags.has('partial_multi_dimension')) lines.push('该题包含多个维度，系统无法仅凭当前片段确认全部条件。');
  if (semantics.reason_codes?.length) lines.push(`系统草稿风险提示：${semantics.reason_codes.join('、')}。`);
  if (item.evidence_span_case_status === 'EVIDENCE_SPAN_INVALID') lines.push('当前来源片段未能证明系统草稿所声称的事实，暂不能进入人工审核。');
  if (item.evidence_span_case_status === 'EVIDENCE_SPAN_AMBIGUOUS') lines.push('当前存在多个同等可信的业务片段，需要先解决来源歧义。');
  return lines;
}

function buildCase(item, index) {
  const semantics = firstSemantics(item);
  const draft = item.draft_gold || {};
  return {
    case_id: item.case_id,
    sequence: index + 1,
    requirement: item.requirement,
    sources: item.sources,
    system_draft: {
      provenance: 'SYSTEM_DRAFT_UNREVIEWED',
      semantic_relevance: semantics.semantic_relevance,
      evidence_capability: semantics.evidence_capability,
      support_level: semantics.support_level,
      semantic_relationship: semantics.semantic_relationship,
      status: item.draft_aggregated_status,
      reason_codes: semantics.reason_codes || [],
      support_observations: allObservations(item, 'support_observations'),
      conflict_observations: allObservations(item, 'conflict_observations')
    },
    review_decision: {
      case_id: item.case_id,
      reviewer_decision: null,
      reviewer_status_override: null,
      reviewer_semantic_override: null,
      reviewer_reason: null,
      reviewed_at: null
    },
    _labels: {
      status: STATUS_LABELS[draft.status] || STATUS_LABELS[item.draft_aggregated_status],
      relevance: RELEVANCE_LABELS[semantics.semantic_relevance] || semantics.semantic_relevance,
      capability: CAPABILITY_LABELS[semantics.evidence_capability] || semantics.evidence_capability,
      support: SUPPORT_LABELS[semantics.support_level] || semantics.support_level,
      relationship: RELATION_LABELS[semantics.semantic_relationship] || semantics.semantic_relationship,
      boundaries: boundaryLabels(item),
      reason_lines: reasonLines(item, semantics),
      source_scopes: (item.sources || []).map(source => SCOPE_LABELS[source.corpus_scope] || source.corpus_scope),
      evidence_span_status: item.evidence_span_case_status || null
    }
  };
}

function renderSource(source, index) {
  const lines = [
    `### 资料 ${index + 1}`,
    '',
    `材料名称：${source.material_name}`,
    `材料类型：${MATERIAL_TYPE_LABELS[source.material_type] || '其他资料'}`,
    `范围：${SCOPE_LABELS[source.corpus_scope] || source.corpus_scope}`,
    '',
    '原文：',
    '```text',
    source.source_text,
    '```',
    ''
  ];
  if (source.context_before || source.context_after) {
    lines.push('必要上下文（仅帮助理解，不作为主要证据）：', '```text');
    if (source.context_before) lines.push(source.context_before);
    if (source.context_after) lines.push(source.context_after);
    lines.push('```', '');
  }
  return lines;
}

function renderCase(item) {
  const labels = item._labels;
  const lines = [
    `# CASE ${item.case_id}`,
    '',
    '## 招标要求',
    '',
    item.requirement.text,
    '',
    '## 系统找到的资料',
    ''
  ];
  if (item.sources.length) item.sources.forEach((source, index) => lines.push(...renderSource(source, index)));
  else lines.push('无直接资料。', '');
  lines.push(
    '## 系统 Draft 判断',
    '',
    `Semantic relevance：${labels.relevance}`,
    `Evidence capability：${labels.capability}`,
    `Support level：${labels.support}`,
    `Relationship：${labels.relationship}`,
    ...(labels.evidence_span_status ? [`来源依据：${labels.evidence_span_status === 'EVIDENCE_SPAN_VERIFIED' ? '已找到相关业务正文' : labels.evidence_span_status === 'EVIDENCE_SPAN_AMBIGUOUS' ? '存在多个待确认业务片段' : '未找到能够支持当前草稿结论的业务正文'}`] : []),
    '',
    '## 系统 Draft 最终结论',
    '',
    `${labels.status}（${item.system_draft.status}）`,
    '',
    '## 系统理由',
    '',
    ...labels.reason_lines.map(line => `- ${line}`),
    '',
    '## 关键证据原文',
    '',
    ...(item.sources.length ? item.sources.map((source, index) => `资料 ${index + 1}：\n“${source.source_text}”`) : ['无直接支持原文。']),
    '',
    '## 风险 / 边界',
    '',
    ...(labels.boundaries.length ? labels.boundaries.map(label => `- ${label}`) : ['- 请人工确认是否存在未覆盖边界。']),
    '',
    '## 请人工判断',
    '',
    'A. ✅ 同意系统判断',
    '',
    'B. ✏️ 系统判断应修改',
    '',
    'C. ❌ 这道题不适合作为 Calibration Case',
    '',
    '如果选择 B，建议修改为：',
    '',
    '[留空]',
    '',
    '人工理由：',
    '',
    '[留空]',
    '',
    '---',
    ''
  );
  return lines;
}

function renderTechnicalAppendix(items) {
  const lines = [
    '## TECHNICAL APPENDIX（可选）',
    '',
    '以下字段只用于审计和复核，不是人工判断的前置条件。',
    '',
    '| Case | Material ID | Document ID | Chunk ID | Source Span ID | Source verified |',
    '|---|---|---|---|---|---|'
  ];
  for (const item of items) for (const source of item.sources) {
    lines.push(`| ${item.case_id} | ${source.material_id} | ${source.document_id} | ${source.chunk_id} | ${source.source_span_id} | ${source.source_verified} |`);
  }
  lines.push('', '系统草稿来源：`SYSTEM_DRAFT_UNREVIEWED`；人工审核前不得写入 Gold。', '');
  return lines;
}

export function buildHumanReviewBatch01({ pool = JSON.parse(fs.readFileSync(POOL_PATH, 'utf8')) } = {}) {
  const byId = new Map((pool.cases || []).map(item => [item.case_id, item]));
  const missing = BATCH_01_CASE_IDS.filter(id => !byId.has(id));
  if (missing.length) throw new Error(`BATCH_CASE_NOT_FOUND:${missing.join(',')}`);
  const selected = BATCH_01_CASE_IDS.map((id, index) => buildCase(byId.get(id), index));
  const statusCounts = Object.fromEntries(['EVIDENCE_REVIEW_READY', 'INSUFFICIENT_EVIDENCE', 'NO_RELEVANT_EVIDENCE', 'CONFLICTING_EVIDENCE'].map(status => [status, selected.filter(item => item.system_draft.status === status).length]));
  const challengeCount = selected.filter(item => (item.requirement.boundary_tags || []).some(tag => ['unknown', 'ambiguity', 'challenge'].includes(tag))).length;
  const packet = {
    schema_version: '4.3-evidence-support-calibration-v2-human-review-batch-v1',
    batch_id: 'CALIBRATION-V2-HUMAN-REVIEW-BATCH-01',
    status: pool.classification || 'READY_FOR_HUMAN_REVIEW',
    source_pool: pool.schema_version?.includes('evidence-span-repaired') ? 'candidate-pool-v2-evidence-span-repaired.json' : 'candidate-pool-v2-remediated.json',
    source_candidate_count: pool.candidate_count,
    case_count: selected.length,
    status_counts: statusCounts,
    challenge_or_ambiguous_count: challengeCount,
    model_calls: 0,
    provider_calls: 0,
    embedding_calls: 0,
    automatic_gold_approval: false,
    dataset_frozen: false,
    calibration_executed: false,
    class_imbalance: (pool.cases || []).filter(item => item.draft_aggregated_status === 'INSUFFICIENT_EVIDENCE').length > (pool.cases || []).length / 2,
    real_retrieval_top5_cases: 0,
    evidence_span_metrics: pool.evidence_span_metrics || null,
    cases: selected
  };
  // _labels are presentation-only and must never become Gold fields.
  const serializableCases = selected.map(({ _labels, ...item }) => item);
  const jsonPacket = { ...packet, cases: serializableCases };
  const markdown = [
    '# CALIBRATION V2 HUMAN REVIEW BATCH 1',
    '',
    '> 本批仅供人工审核；所有判断均为 `SYSTEM_DRAFT_UNREVIEWED`。不得自动批准、不得冻结数据集、不得执行 Calibration。',
    `> 候选池：37 条；本批：${selected.length} 条；来源均来自正式 synthetic/public corpus，未调用模型或 Provider。`,
    '',
    '## BATCH',
    '',
    `- case count：${selected.length}`,
    `- READY：${statusCounts.EVIDENCE_REVIEW_READY}`,
    `- INSUFFICIENT：${statusCounts.INSUFFICIENT_EVIDENCE}`,
    `- NO_RELEVANT：${statusCounts.NO_RELEVANT_EVIDENCE}`,
    `- CONFLICT：${statusCounts.CONFLICTING_EVIDENCE}`,
    `- challenge / ambiguous：${challengeCount}`,
    '',
    '## BOUNDARY COVERAGE',
    '',
    '- direct/full support',
    '- partial support',
    '- reference-only and wrong entity/scope',
    '- related but insufficient',
    '- unrelated evidence',
    '- conflict and freshness/superseded validity',
    '- third-party capability boundary',
    '- industry reference ≠ enterprise capability',
    '- quantitative unsupported',
    '- multi-dimension ambiguity',
    ''
  ];
  for (const item of selected) markdown.push(...renderCase(item));
  markdown.push(...renderTechnicalAppendix(selected));
  return { packet: jsonPacket, markdown: `${markdown.join('\n')}\n` };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const { packet, markdown } = buildHumanReviewBatch01();
  fs.writeFileSync(JSON_PATH, `${JSON.stringify(packet, null, 2)}\n`, 'utf8');
  fs.writeFileSync(MARKDOWN_PATH, markdown, 'utf8');
  console.log(JSON.stringify({ output: MARKDOWN_PATH, json: JSON_PATH, case_count: packet.case_count, status_counts: packet.status_counts, challenge_or_ambiguous_count: packet.challenge_or_ambiguous_count, model_calls: 0, provider_calls: 0 }));
}
