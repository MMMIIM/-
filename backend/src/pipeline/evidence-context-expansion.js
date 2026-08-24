import { createHash } from 'node:crypto';

export const EVIDENCE_CONTEXT_EXPANSION_VERSION = 'evidence-context-expansion-v1';
export const EVIDENCE_CONTEXT_ORIGINS = Object.freeze([
  'EXACT_SPAN',
  'SAME_SENTENCE',
  'SAME_PARAGRAPH',
  'TABLE_HEADER',
  'SECTION_HEADING',
  'SAME_CHUNK_CONTEXT',
  'ADJACENT_CHUNK',
  'MATERIAL_METADATA'
]);
export const EVIDENCE_CONTEXT_RECOVERY_STATES = Object.freeze([
  'RESOLVED_BY_CONTEXT',
  'RESOLVED_BY_RETRIEVAL_EXPANSION',
  'UNRESOLVED_AFTER_CONTEXT',
  'UNRESOLVED_AFTER_RETRIEVAL'
]);
export const EVIDENCE_DIMENSION_ROLES = Object.freeze(['REQUIRED', 'SUPPORTING', 'NOT_APPLICABLE', 'UNRESOLVED_REQUIRED']);

const sha = value => createHash('sha256').update(String(value)).digest('hex');
const text = value => String(value ?? '').trim();
const sameDocument = (left, right) => {
  const leftDocument = left?.document_id ?? left?.source_document_id ?? left?.material_id;
  const rightDocument = right?.document_id ?? right?.source_document_id ?? right?.material_id;
  return Boolean(leftDocument && rightDocument && leftDocument === rightDocument);
};
const bounded = (value, max = 1200) => {
  const source = text(value);
  return source.length <= max ? source : `${source.slice(0, max)}…`;
};
const lineFor = (source, needle) => {
  const lines = String(source ?? '').split(/\r?\n/);
  return lines.find(line => needle && line.includes(needle)) || null;
};

const DIMENSIONS = Object.freeze([
  'subject_match',
  'entity_match',
  'scope_match',
  'status_match',
  'validity_match',
  'quantitative_match'
]);

function requirementText(requirement = {}) {
  return `${text(requirement.text ?? requirement.requirement_text)} ${text(requirement.category ?? requirement.requirement_category)}`.trim();
}

function hasEnterpriseProofIntent(requirement = {}) {
  const value = requirementText(requirement);
  return /(?:ENTERPRISE_(?:CAPABILITY_PROOF|QUALIFICATION|PROJECT_EXPERIENCE|PRODUCT_CAPABILITY)|企业.*(?:能力|资质|认证|项目经验)|同类项目|产品能力)/i.test(value);
}

/**
 * Classify only the dimensions requested by the assessment. This is a
 * deterministic requirement-shape rule, not a semantic approval decision.
 * When no Requirement is supplied, legacy callers conservatively treat every
 * requested dimension as required.
 */
export function classifyRequiredEvidenceDimensions({ requirement = null, dimensions = [] } = {}) {
  const requested = [...new Set((Array.isArray(dimensions) ? dimensions : []).map(String))]
    .filter(dimension => DIMENSIONS.includes(dimension));
  if (!requirement) return Object.fromEntries(requested.map(dimension => [dimension, 'REQUIRED']));
  const value = requirementText(requirement);
  const enterpriseProof = hasEnterpriseProofIntent(requirement);
  const numeric = /(?:\d|≥|≤|>=|<=|不少于|不超过|不大于|性能|容量|并发|响应|准确率|比例|数量|时延|秒|毫秒|GB|TB|%)/i.test(value);
  const compatibility = /兼容|适配|国产化|操作系统|数据库|架构|接口|协议|环境|平台/i.test(value);
  const status = /应|须|需|支持|具备|完成|通过|验收|可用|满足|提供|实现|保障/i.test(value);
  const identity = /企业|公司|项目|产品|数据库|操作系统|平台|环境|系统|模块|服务|证书|认证|资质/i.test(value);
  const scope = /范围|适用|环境|组合|覆盖|全市|各专业|国产|x86|指定项目主体|项目主体|同一项目/i.test(value);
  const validity = /有效|有效期|截止|当前|在有效期|证书|认证|资质|授权/i.test(value);
  const roles = {};
  for (const dimension of requested) {
    roles[dimension] = 'SUPPORTING';
    if (dimension === 'subject_match') roles[dimension] = enterpriseProof || identity ? 'REQUIRED' : 'SUPPORTING';
    if (dimension === 'entity_match') roles[dimension] = enterpriseProof || compatibility || identity ? 'REQUIRED' : 'SUPPORTING';
    if (dimension === 'scope_match') roles[dimension] = enterpriseProof || compatibility || scope ? 'REQUIRED' : 'SUPPORTING';
    if (dimension === 'status_match') roles[dimension] = enterpriseProof || compatibility || status ? 'REQUIRED' : 'SUPPORTING';
    if (dimension === 'validity_match') roles[dimension] = validity ? 'REQUIRED' : 'NOT_APPLICABLE';
    if (dimension === 'quantitative_match') roles[dimension] = numeric ? 'REQUIRED' : 'NOT_APPLICABLE';
  }
  return roles;
}

function headingFrom(value) {
  const match = /^(#{1,6})\s+(.+)$/m.exec(text(value));
  return match ? match[2].trim() : null;
}

function exactParagraph(source, needle) {
  const value = String(source ?? '');
  const index = needle ? value.indexOf(needle) : -1;
  if (index < 0) return null;
  const paragraphs = [...value.matchAll(/\S[\s\S]*?(?=\r?\n\s*\r?\n|$)/g)];
  const paragraph = paragraphs.find(item => item.index <= index && item.index + item[0].length >= index + needle.length);
  if (paragraph) return paragraph[0];
  return lineFor(value, needle);
}

function tableHeader(source, needle) {
  const value = String(source ?? '');
  const lines = value.split(/\r?\n/);
  const index = lines.findIndex(line => needle && line.includes(needle));
  if (index <= 0) return null;
  const previous = lines[index - 1];
  if (previous.includes('|') || /(?:名称|项目|环境|指标|状态|范围|单位)\s*[:：]/.test(previous)) return previous;
  return null;
}

function metadataText(material = {}) {
  return [
    material.original_name && `material_name=${material.original_name}`,
    material.material_type && `material_type=${material.material_type}`,
    material.corpus_scope && `corpus_scope=${material.corpus_scope}`,
    material.source_type && `source_type=${material.source_type}`,
    material.source_org && `source_org=${material.source_org}`,
    material.owner && `owner=${material.owner}`,
    material.project_name && `project_name=${material.project_name}`
  ].filter(Boolean).join('；');
}

function dimensionEvidence(dimension, source) {
  const value = text(source);
  if (!value) return null;
  const rules = {
    subject_match: /(?:企业|公司|客户|主体|项目)\s*[:：]|owner\s*=|project_name\s*=/i,
    entity_match: /(?:名称|产品|项目|客户|主体|编号)\s*[:：]|entity\s*=/i,
    scope_match: /(?:范围|适用范围|环境|组合|scope|corpus_scope)\s*[:：=]/i,
    status_match: /(?:状态|结果|tested|verified|active|完成|验收|有效)\s*[:：=]/i,
    validity_match: /(?:有效至|valid_until|有效期)\s*[:：=]/i,
    quantitative_match: /(?:\d+(?:\.\d+)?\s*(?:秒|毫秒|GB|TB|%|人|条|次)|P95|数量|指标)/i
  };
  return rules[dimension]?.test(value) ? value : null;
}

/**
 * Expand context around an exact, auditable span without changing the citation.
 * The function never crosses material/document boundaries and never fabricates
 * a recovered dimension; each recovered dimension carries its origin.
 */
export function expandEvidenceContext({
  exactSpan,
  material = {},
  chunks = [],
  missingDimensions = [],
  requirement = null,
  maxContextChars = 2400
} = {}) {
  const exactText = text(exactSpan?.source_text ?? exactSpan?.sourceText);
  if (!exactText) throw new Error('exactSpan.source_text is required');
  const anchorId = exactSpan?.anchor_chunk_id ?? exactSpan?.source_chunk_id ?? exactSpan?.chunk_id;
  const ordered = (Array.isArray(chunks) ? chunks : [])
    .filter(item => item && (!material.id || item.material_id === material.id) && (!anchorId || !exactSpan?.document_id || sameDocument(item, exactSpan) || item.chunk_id === anchorId))
    .sort((a, b) => Number(a.chunk_index ?? 0) - Number(b.chunk_index ?? 0));
  const anchor = ordered.find(item => item.chunk_id === anchorId)
    || ordered.find(item => text(item.source_text).includes(exactText))
    || (text(exactSpan?.source_text) ? exactSpan : null);
  const sources = [{
    origin: 'EXACT_SPAN',
    text: exactText,
    source_id: exactSpan?.source_id ?? exactSpan?.candidate_id ?? anchorId ?? null,
    source_span_id: exactSpan?.source_span_id ?? exactSpan?.span_id ?? null,
    chunk_id: anchorId ?? null
  }];
  const add = (origin, value, metadata = {}) => {
    const content = bounded(value, maxContextChars);
    if (!content || sources.some(item => item.origin === origin && item.text === content)) return;
    sources.push({ origin, text: content, ...metadata });
  };

  const anchorText = text(anchor?.source_text ?? exactSpan?.source_text);
  const sentence = lineFor(anchorText, exactText);
  if (sentence && sentence !== exactText) add('SAME_SENTENCE', sentence, { chunk_id: anchor?.chunk_id ?? anchorId });
  const paragraph = exactParagraph(anchorText, exactText);
  if (paragraph && paragraph !== sentence && paragraph !== exactText) add('SAME_PARAGRAPH', paragraph, { chunk_id: anchor?.chunk_id ?? anchorId });
  const header = tableHeader(anchorText, exactText);
  if (header) add('TABLE_HEADER', header, { chunk_id: anchor?.chunk_id ?? anchorId });
  const section = text(anchor?.section ?? exactSpan?.section ?? exactSpan?.heading_path?.at?.(-1)) || headingFrom(anchorText);
  if (section) add('SECTION_HEADING', section, { chunk_id: anchor?.chunk_id ?? anchorId });
  if (anchorText && anchorText !== exactText) add('SAME_CHUNK_CONTEXT', anchorText, { chunk_id: anchor?.chunk_id ?? anchorId });

  const anchorIndex = ordered.findIndex(item => item.chunk_id === (anchor?.chunk_id ?? anchorId));
  if (anchorIndex >= 0) {
    for (const adjacent of [ordered[anchorIndex - 1], ordered[anchorIndex + 1]]) {
      if (adjacent && sameDocument(adjacent, anchor) && text(adjacent.source_text)) {
        add('ADJACENT_CHUNK', adjacent.source_text, { chunk_id: adjacent.chunk_id });
      }
    }
  }
  const metadata = metadataText(material);
  if (metadata) add('MATERIAL_METADATA', metadata, { material_id: material.id ?? material.material_id ?? null });

  const recoveredDimensions = {};
  const unresolvedDimensions = [];
  const dimensionRoles = classifyRequiredEvidenceDimensions({ requirement, dimensions: missingDimensions });
  const requiredDimensions = Object.entries(dimensionRoles).filter(([, role]) => role === 'REQUIRED').map(([dimension]) => dimension);
  const supportingDimensions = Object.entries(dimensionRoles).filter(([, role]) => role === 'SUPPORTING').map(([dimension]) => dimension);
  const notApplicableDimensions = Object.entries(dimensionRoles).filter(([, role]) => role === 'NOT_APPLICABLE').map(([dimension]) => dimension);
  const unresolvedRequiredDimensions = [];
  const unresolvedSupportingDimensions = [];
  for (const dimension of [...new Set(missingDimensions.map(String))]) {
    if (dimensionRoles[dimension] === 'NOT_APPLICABLE') continue;
    const source = sources.find(item => dimensionEvidence(dimension, item.text));
    if (source) recoveredDimensions[dimension] = {
      status: 'resolved',
      origin: source.origin,
      source_text: source.text,
      source_id: source.source_id ?? null,
      chunk_id: source.chunk_id ?? null
    };
    else {
      unresolvedDimensions.push(dimension);
      if (dimensionRoles[dimension] === 'REQUIRED') unresolvedRequiredDimensions.push(dimension);
      else unresolvedSupportingDimensions.push(dimension);
    }
  }
  const usedAdjacent = Object.values(recoveredDimensions).some(item => item.origin === 'ADJACENT_CHUNK');
  const recoveredRequiredDimensions = requiredDimensions.filter(dimension => recoveredDimensions[dimension]);
  const recoveryState = unresolvedRequiredDimensions.length === 0
    ? (usedAdjacent ? 'RESOLVED_BY_RETRIEVAL_EXPANSION' : 'RESOLVED_BY_CONTEXT')
    : (usedAdjacent ? 'UNRESOLVED_AFTER_RETRIEVAL' : 'UNRESOLVED_AFTER_CONTEXT');
  return {
    expansion_version: EVIDENCE_CONTEXT_EXPANSION_VERSION,
    exact_evidence_span: {
      source_text: exactText,
      source_text_hash: sha(exactText),
      source_span_id: exactSpan?.source_span_id ?? exactSpan?.span_id ?? null,
      source_id: exactSpan?.source_id ?? exactSpan?.candidate_id ?? anchorId ?? null,
      anchor_chunk_id: anchorId ?? null
    },
    context_window: sources.slice(1),
    dimension_roles: dimensionRoles,
    required_dimensions: requiredDimensions,
    supporting_dimensions: supportingDimensions,
    not_applicable_dimensions: notApplicableDimensions,
    recovered_dimensions: recoveredDimensions,
    unresolved_dimensions: unresolvedDimensions,
    unresolved_required_dimensions: unresolvedRequiredDimensions,
    unresolved_supporting_dimensions: unresolvedSupportingDimensions,
    recovered_required_dimensions: recoveredRequiredDimensions,
    fully_recovered: unresolvedRequiredDimensions.length === 0,
    context_recovery_rate: requiredDimensions.length
      ? recoveredRequiredDimensions.length / requiredDimensions.length
      : null,
    recovery_state: recoveryState,
    crossed_material_boundary: false,
    crossed_document_boundary: false
  };
}
