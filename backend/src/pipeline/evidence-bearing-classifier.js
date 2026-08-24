import { classifyRequiredEvidenceDimensions } from './evidence-context-expansion.js';

export const EVIDENCE_BEARING_CLASSIFIER_VERSION = 'evidence-bearing-classifier-v1';
export const EVIDENCE_BEARING_CLASSES = Object.freeze([
  'EVIDENCE_BEARING',
  'TOPIC_RELEVANT_ONLY',
  'METADATA_OR_HEADER',
  'REFERENCE_CONTEXT_ONLY',
  'IRRELEVANT'
]);

const METADATA_KEYS = /^(?:representative_synthetic|synthetic_test_material|not_real_customer_data|subject|source_type|source_org|license_or_usage_status|material_id|scope|corpus_scope|industry|material_type|review_status|project_name|owner|document_id|chunk_id)\s*[:=]/i;
const HEADING_ONLY = /^#{1,6}\s+[^\n]+$/;
const NUMERIC = /(?:\d+(?:\.\d+)?\s*(?:秒|毫秒|GB|TB|人|条|次|%|fps|\/秒)|P\d{1,2}|并发|容量|准确率|响应时间|指标)/i;
const COMPATIBILITY = /(?:x86(?:_64)?|ubuntu|麒麟|统信|UOS|PostgreSQL|达梦|人大金仓|国产数据库|操作系统|数据库|兼容|适配|架构|协议)/i;
const QUALIFICATION = /(?:ISO(?:\/IEC)?\s*27001|认证|证书|资质|有效至|有效期|valid_until)/i;
const PROJECT = /(?:项目|实施|客户|验收|完工|交付|状态)/i;
const THIRD_PARTY = /(?:第三方|授权|许可|依赖|开源组件|技术支持)/i;

const asText = value => String(value ?? '').trim();
const normalize = value => asText(value).normalize('NFKC').toLowerCase();
const isMetadataLine = line => /^(?:REPRESENTATIVE_SYNTHETIC|NOT_REAL_CUSTOMER_DATA)\s*$/i.test(line) || METADATA_KEYS.test(line);

function requirementText(requirement = {}) {
  return asText(requirement.text ?? requirement.requirement_text ?? requirement.content);
}

function substantiveLines(sourceText) {
  return asText(sourceText)
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .filter(line => !HEADING_ONLY.test(line))
    .filter(line => !isMetadataLine(line));
}

export function isMetadataOrHeader(sourceText) {
  const value = asText(sourceText);
  if (!value) return false;
  if (HEADING_ONLY.test(value)) return true;
  return substantiveLines(value).length === 0;
}

function numbers(value) {
  return [...normalize(value).matchAll(/\d+(?:\.\d+)?/g)].map(item => item[0]);
}

function phraseTokens(value) {
  const normalized = normalize(value);
  const latin = normalized.match(/[a-z][a-z0-9_+.-]*/g) || [];
  const cjkRuns = normalized.match(/[\u3400-\u9fff]{2,}/g) || [];
  const cjk = cjkRuns.flatMap(run => {
    const tokens = [];
    for (let length = 2; length <= Math.min(4, run.length); length += 1) {
      for (let index = 0; index + length <= run.length; index += 1) tokens.push(run.slice(index, index + length));
    }
    return tokens;
  });
  return [...new Set([...latin, ...cjk])];
}

function overlap(requirement, source) {
  const sourceTokens = new Set(phraseTokens(source));
  return phraseTokens(requirement).filter(token => sourceTokens.has(token));
}

function requiredRoles(requirement) {
  const roles = classifyRequiredEvidenceDimensions({
    requirement,
    dimensions: ['subject_match', 'entity_match', 'scope_match', 'status_match', 'validity_match', 'quantitative_match']
  });
  return Object.entries(roles).filter(([, role]) => role === 'REQUIRED').map(([dimension]) => dimension);
}

function supportedDimensions(requirement, source) {
  const req = requirementText(requirement);
  const value = asText(source);
  const dimensions = [];
  const reqNumbers = numbers(req);
  const sourceNumbers = numbers(value);
  const numericAnchor = /(?:并发|响应|准确率|在线用户|P\d{1,2}|吞吐|性能|指标)/i;
  if (NUMERIC.test(req) && reqNumbers.length && reqNumbers.some(number => sourceNumbers.includes(number)) && NUMERIC.test(value) && numericAnchor.test(req) && numericAnchor.test(value)) {
    dimensions.push('quantitative_match');
  }
  if (COMPATIBILITY.test(req)) {
    const reqTerms = phraseTokens(req).filter(token => /x86|ubuntu|麒麟|统信|uos|postgres|达梦|金仓|数据库|操作系统|兼容|适配|架构|协议/i.test(token));
    const sourceValue = normalize(value);
    const direct = reqTerms.filter(term => sourceValue.includes(term));
    const concretePlatform = /(?:x86|ubuntu|麒麟|统信|uos|postgres|达梦|金仓|操作系统|兼容|适配|架构|协议)/i.test(value);
    if (direct.length >= 1 && concretePlatform && /(?:tested|verified|支持|兼容|适配|unknown|not_verified|partial)/i.test(value)) {
      dimensions.push('entity_match', 'scope_match', 'status_match');
    }
  }
  if (QUALIFICATION.test(req) && QUALIFICATION.test(value) && /(?:状态|active|有效|证书|认证)/i.test(value)) {
    dimensions.push('entity_match', 'validity_match', 'status_match');
  }
  if (PROJECT.test(req) && PROJECT.test(value) && /(?:项目|实施|验收|状态|客户)/i.test(value)) {
    dimensions.push('entity_match', 'scope_match', 'status_match');
  }
  if (THIRD_PARTY.test(req) && THIRD_PARTY.test(value)) {
    dimensions.push('scope_match', 'status_match');
  }
  if (!NUMERIC.test(req) && !COMPATIBILITY.test(req) && !QUALIFICATION.test(req) && !PROJECT.test(req) && !THIRD_PARTY.test(req)) {
    const generic = new Set(['平台', '数据', '治理', '项目', '企业', '系统', '能力', '支持', '实现', '提供']);
    const directPhrases = phraseTokens(req).filter(token => token.length >= 3 && !generic.has(token) && /[\u3400-\u9fff]/.test(token) && normalize(value).includes(token));
    if (directPhrases.length >= 1 && /(?:支持|实现|提供|项目|范围|平台)/i.test(value)) dimensions.push('entity_match', 'scope_match', 'status_match');
  }
  return [...new Set(dimensions)];
}

/**
 * Requirement-relative, deterministic classification. It never treats a
 * material scope or a generic topic match as proof of the current
 * Requirement. Source text is the only evidence input; metadata is never
 * promoted unless the Requirement explicitly asks for that metadata fact.
 */
export function classifyEvidenceBearing({ requirement, sourceText, candidate = {}, context = null } = {}) {
  const req = requirementText(requirement);
  const source = asText(sourceText ?? candidate.source_text ?? candidate.source_excerpt);
  const route = candidate.proof_eligibility ?? candidate.source_route ?? null;
  const required = requiredRoles(requirement);
  if (!source) return { classifier_version: EVIDENCE_BEARING_CLASSIFIER_VERSION, classification: 'IRRELEVANT', required_dimensions: required, supported_dimensions: [], reason_codes: ['SOURCE_EMPTY'], route };
  if (route === 'REFERENCE_CONTEXT') return { classifier_version: EVIDENCE_BEARING_CLASSIFIER_VERSION, classification: 'REFERENCE_CONTEXT_ONLY', required_dimensions: required, supported_dimensions: [], reason_codes: ['REFERENCE_SOURCE'], route };
  if (route === 'OUT_OF_SCOPE') return { classifier_version: EVIDENCE_BEARING_CLASSIFIER_VERSION, classification: 'IRRELEVANT', required_dimensions: required, supported_dimensions: [], reason_codes: ['OUT_OF_SCOPE_SOURCE'], route };
  if (isMetadataOrHeader(source)) return { classifier_version: EVIDENCE_BEARING_CLASSIFIER_VERSION, classification: 'METADATA_OR_HEADER', required_dimensions: required, supported_dimensions: [], reason_codes: ['METADATA_OR_HEADER'], route };
  const supported = supportedDimensions(requirement, source);
  const requiredSupported = supported.filter(dimension => required.includes(dimension));
  const topicMatch = overlap(req, source).length > 0
    || (COMPATIBILITY.test(req) && COMPATIBILITY.test(source))
    || (NUMERIC.test(req) && NUMERIC.test(source));
  const classification = requiredSupported.length > 0
    ? 'EVIDENCE_BEARING'
    : topicMatch ? 'TOPIC_RELEVANT_ONLY' : 'IRRELEVANT';
  return {
    classifier_version: EVIDENCE_BEARING_CLASSIFIER_VERSION,
    classification,
    requirement_relative: true,
    required_dimensions: required,
    supported_dimensions: requiredSupported,
    unsupported_required_dimensions: required.filter(dimension => !requiredSupported.includes(dimension)),
    required_dimension_roles: context?.dimension_roles || null,
    reason_codes: classification === 'EVIDENCE_BEARING' ? ['REQUIRED_DIMENSION_SUPPORTED'] : ['REQUIRED_DIMENSION_NOT_SUPPORTED'],
    route
  };
}
