import { isLabelLikeNounPhrase } from './retrieval-substantive-candidate.js';

export const RETRIEVAL_SOURCE_ELIGIBILITY_VERSION = 'retrieval-source-eligibility-v1';

export const EVIDENCE_SOURCE_CLASSES = Object.freeze([
  'ORIGINAL_BUSINESS_FACT',
  'ORIGINAL_TECHNICAL_FACT',
  'ORIGINAL_PROJECT_FACT',
  'ORIGINAL_QUALIFICATION_FACT',
  'AUTHORITATIVE_REFERENCE_FACT',
  'INTERNAL_PROCESS_ARTIFACT',
  'SYSTEM_DERIVED_ARTIFACT',
  'EVAL_ARTIFACT',
  'CONTROL_PLANE_ARTIFACT',
  'NON_AUDITABLE_CLAIM',
  'UNKNOWN'
]);

const normalize = (value) => String(value ?? '').normalize('NFKC').replace(/\r\n?/g, '\n').trim();
const lower = (value) => normalize(value).toLowerCase();

const MATERIAL_CLASS = Object.freeze({
  company_profile: 'ORIGINAL_BUSINESS_FACT',
  product: 'ORIGINAL_BUSINESS_FACT',
  product_documentation: 'ORIGINAL_TECHNICAL_FACT',
  technical_solution: 'ORIGINAL_TECHNICAL_FACT',
  technical_whitepaper: 'ORIGINAL_TECHNICAL_FACT',
  delivery_capability: 'ORIGINAL_TECHNICAL_FACT',
  personnel: 'ORIGINAL_BUSINESS_FACT',
  project_case: 'ORIGINAL_PROJECT_FACT',
  case: 'ORIGINAL_PROJECT_FACT',
  historical_bid: 'ORIGINAL_PROJECT_FACT',
  qualification: 'ORIGINAL_QUALIFICATION_FACT'
});

const AUTHORITATIVE_AUTHORITIES = new Set([
  'official',
  'authoritative',
  'administrative_regulation',
  'national_law',
  'government',
  'public_authority'
]);

const AUTHORITATIVE_SOURCE_TYPES = new Set([
  'official',
  'authoritative_reference',
  'official_standard',
  'government_guidance',
  'industry_guidance',
  'policy',
  'regulation',
  'law'
]);

const EVAL_MARKER = /(?:representative[_ -]?synthetic|not[_ -]?real[_ -]?customer[_ -]?data|synthetic[_ -]?test[_ -]?material|(?:^|[\n\s])material[_ -]?id\s*[:=])/i;
const SYSTEM_MARKER = /(?:\b(?:prompt|e2e|eval|provider|model|control[ _-]?plane|claim[ _-]?gate|writer|mapping|source[- ]of[- ]truth|commit|tests?\s+pass|test\s+status|project data scope|keycloak|idp|docx|template|apache|agpl|open source|supported|insufficient|no[_ -]?evidence|needs?[_ -]?review|primary|supporting|audit|technical)\b|系统负责|系统状态|系统派生|控制面|控制平面|确定性传播|核心链路|检查仓库|当前直接相关代码|技术 enum|技术代码|不要自研|保持自己的|开源组件|兼容实现|架构来源|用户界面优先|客户私有数据|决策[:：])/i;
const CONTROL_PLANE_MARKER = /(?:\b(?:control[ _-]?plane|claim[ _-]?gate|mapping|writer output|source[- ]of[- ]truth)\b|控制面|控制平面|系统状态|系统负责确定性传播)/i;
const ABSTRACT_TERM = /(?:安全|稳定|可控|可追溯|可审核|可修改|可交付|易操作|够用|成熟|真实可用|可靠|高效|优先|核心能力|基础能力)/g;
const AUDITABLE_DIMENSION = /(?:\d|%|秒|分钟|小时|日期|有效至|编号|证书|认证|测试|验收|项目|客户|合同|部署|环境|平台|产品|接口|协议|数据库|兼容|支持|提供|完成|记录|状态|结果|指标|范围|责任|期限|服务台|响应|版本|人员|岗位|机构|来源)/i;
const METADATA_SOURCE = /^(?:(?:material|document|chunk|project|subject|scope|corpus_scope|material_type|review_status|owner|source_type|source_org|project_name|file_name|file_id|document_id|chunk_id)[_ ]?id?|scope|industry)\s*[:=]/i;

function metadata(candidate) {
  const value = candidate.metadata ?? candidate.material_metadata ?? candidate.provenance ?? {};
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function sourceOrigin(candidate) {
  const value = metadata(candidate);
  return lower(candidate.source_origin ?? candidate.origin ?? value.source_origin ?? value.origin ?? candidate.source_kind ?? value.source_kind);
}

function isLowSpecificityClaim(source) {
  if (!source) return false;
  if (isLabelLikeNounPhrase(source)) return true;
  const withoutAbstract = source.replace(ABSTRACT_TERM, '').replace(/[，,、。；;：:（）()\s]/g, '');
  const shortLabel = source.length <= 24 && !/[\n，,：:；;]/.test(source) && !/[\d%]/.test(source);
  return (withoutAbstract.length <= 12 && !AUDITABLE_DIMENSION.test(source)) || shortLabel;
}

function classifyByProvenance(candidate) {
  const origin = sourceOrigin(candidate);
  const sourceType = lower(candidate.source_type ?? candidate.material_source_type ?? metadata(candidate).source_type);
  const authority = lower(candidate.source_authority ?? candidate.authority_level ?? metadata(candidate).authority_level);
  const materialType = lower(candidate.material_type ?? metadata(candidate).material_type);

  if (['system_derived', 'system', 'derived', 'decision', 'runtime'].includes(origin)) return { evidence_source_eligible: false, evidence_source_class: 'SYSTEM_DERIVED_ARTIFACT', evidence_source_reason: 'PROVENANCE_SYSTEM_DERIVED' };
  if (['control_plane', 'control', 'orchestration'].includes(origin)) return { evidence_source_eligible: false, evidence_source_class: 'CONTROL_PLANE_ARTIFACT', evidence_source_reason: 'PROVENANCE_CONTROL_PLANE' };
  if (['eval', 'evaluation', 'fixture', 'benchmark', 'test'].includes(origin)) return { evidence_source_eligible: false, evidence_source_class: 'EVAL_ARTIFACT', evidence_source_reason: 'PROVENANCE_EVAL_ARTIFACT' };
  if (['internal_process', 'process', 'prompt', 'governance'].includes(origin)) return { evidence_source_eligible: false, evidence_source_class: 'INTERNAL_PROCESS_ARTIFACT', evidence_source_reason: 'PROVENANCE_INTERNAL_PROCESS' };
  if (AUTHORITATIVE_AUTHORITIES.has(authority) || AUTHORITATIVE_SOURCE_TYPES.has(sourceType)) return { evidence_source_eligible: true, evidence_source_class: 'AUTHORITATIVE_REFERENCE_FACT', evidence_source_reason: 'AUTHORITATIVE_SOURCE_PROVENANCE' };
  if (MATERIAL_CLASS[materialType]) return { evidence_source_eligible: true, evidence_source_class: MATERIAL_CLASS[materialType], evidence_source_reason: 'ORIGINAL_MATERIAL_PROVENANCE' };
  return null;
}

/**
 * Source eligibility is deliberately independent from Requirement-relative
 * support. It answers only whether a chunk can be considered an auditable
 * source at all; it never claims that the source satisfies a Requirement.
 */
export function classifyEvidenceSourceEligibility(candidate = {}) {
  const source = normalize(candidate.source_text ?? candidate.raw_original_text);
  if (!source) return { evidence_source_eligible: false, evidence_source_class: 'UNKNOWN', evidence_source_reason: 'SOURCE_TEXT_EMPTY', low_specificity_claim: false, evidence_source_version: RETRIEVAL_SOURCE_ELIGIBILITY_VERSION };

  const provenance = classifyByProvenance(candidate);
  const origin = sourceOrigin(candidate);
  const materialType = lower(candidate.material_type ?? metadata(candidate).material_type);

  if (EVAL_MARKER.test(source) || /(?:eval|fixture|benchmark|test)/i.test(origin)) {
    return { evidence_source_eligible: false, evidence_source_class: 'EVAL_ARTIFACT', evidence_source_reason: 'EVAL_METADATA_OR_PROVENANCE', low_specificity_claim: false, evidence_source_version: RETRIEVAL_SOURCE_ELIGIBILITY_VERSION };
  }
  if (source.split('\n').filter(Boolean).every((line) => METADATA_SOURCE.test(line.trim()))) {
    return { evidence_source_eligible: false, evidence_source_class: 'NON_AUDITABLE_CLAIM', evidence_source_reason: 'SOURCE_METADATA_ONLY', low_specificity_claim: false, evidence_source_version: RETRIEVAL_SOURCE_ELIGIBILITY_VERSION };
  }
  if (CONTROL_PLANE_MARKER.test(source) && (materialType === 'company_profile' || !provenance)) {
    return { evidence_source_eligible: false, evidence_source_class: 'CONTROL_PLANE_ARTIFACT', evidence_source_reason: 'CONTROL_PLANE_DERIVED_TEXT', low_specificity_claim: false, evidence_source_version: RETRIEVAL_SOURCE_ELIGIBILITY_VERSION };
  }
  if (SYSTEM_MARKER.test(source) && (materialType === 'company_profile' || !provenance)) {
    const systemClass = /(?:system|系统|状态|确定性传播|control[ _-]?plane|控制面|控制平面|supported|insufficient|no[_ -]?evidence|needs?[_ -]?review)/i.test(source) ? 'SYSTEM_DERIVED_ARTIFACT' : 'INTERNAL_PROCESS_ARTIFACT';
    return { evidence_source_eligible: false, evidence_source_class: systemClass, evidence_source_reason: systemClass === 'SYSTEM_DERIVED_ARTIFACT' ? 'SYSTEM_DERIVED_TEXT' : 'INTERNAL_PROCESS_TEXT', low_specificity_claim: false, evidence_source_version: RETRIEVAL_SOURCE_ELIGIBILITY_VERSION };
  }
  if (isLabelLikeNounPhrase(source)) {
    return { evidence_source_eligible: false, evidence_source_class: 'NON_AUDITABLE_CLAIM', evidence_source_reason: 'LOW_SPECIFICITY_CLAIM', low_specificity_claim: true, evidence_source_version: RETRIEVAL_SOURCE_ELIGIBILITY_VERSION };
  }
  if (provenance?.evidence_source_class === 'AUTHORITATIVE_REFERENCE_FACT') return { ...provenance, low_specificity_claim: false, evidence_source_version: RETRIEVAL_SOURCE_ELIGIBILITY_VERSION };
  if (isLowSpecificityClaim(source) && (materialType === 'company_profile' || !provenance)) {
    return { evidence_source_eligible: false, evidence_source_class: 'NON_AUDITABLE_CLAIM', evidence_source_reason: 'LOW_SPECIFICITY_CLAIM', low_specificity_claim: true, evidence_source_version: RETRIEVAL_SOURCE_ELIGIBILITY_VERSION };
  }
  if (provenance) return { ...provenance, low_specificity_claim: false, evidence_source_version: RETRIEVAL_SOURCE_ELIGIBILITY_VERSION };
  return { evidence_source_eligible: false, evidence_source_class: 'UNKNOWN', evidence_source_reason: 'SOURCE_PROVENANCE_UNAVAILABLE', low_specificity_claim: false, evidence_source_version: RETRIEVAL_SOURCE_ELIGIBILITY_VERSION };
}

export function applyEvidenceSourceEligibility(candidate = {}) {
  return { ...candidate, ...classifyEvidenceSourceEligibility(candidate) };
}

export function isDerivedArtifactClass(value) {
  return ['SYSTEM_DERIVED_ARTIFACT', 'EVAL_ARTIFACT', 'CONTROL_PLANE_ARTIFACT'].includes(value);
}
