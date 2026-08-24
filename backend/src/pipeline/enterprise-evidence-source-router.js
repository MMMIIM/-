export const ENTERPRISE_PROOF_ROUTING_VERSION = 'enterprise-proof-routing-v2';
export const ENTERPRISE_PROOF_INTENTS = Object.freeze([
  'ENTERPRISE_CAPABILITY_PROOF',
  'ENTERPRISE_QUALIFICATION',
  'ENTERPRISE_PROJECT_EXPERIENCE',
  'ENTERPRISE_PRODUCT_CAPABILITY'
]);
export const ENTERPRISE_EVIDENCE_ROUTES = Object.freeze([
  'PROOF_ELIGIBLE',
  'REFERENCE_CONTEXT',
  'OUT_OF_SCOPE'
]);

const text = value => String(value ?? '').trim();
const bool = value => value === true || value === false ? value : null;
const ACTIVE_USAGE = new Set(['ACTIVE_FULLTEXT', 'ACTIVE_EXCERPT']);
const EXTERNAL_PROOF_SOURCE_TYPES = new Set([
  'third_party_certification',
  'third_party_certificate',
  'customer_acceptance',
  'customer_acceptance_record',
  'acceptance_record',
  'authoritative_test_report',
  'test_report',
  'manufacturer_authorization',
  'original_equipment_authorization',
  'public_project_award',
  'public_award',
  'public_project_proof',
  'qualification_certificate',
  'certification'
]);
const GENERIC_REFERENCE_SOURCE_TYPES = new Set([
  'official_standard',
  'government_guidance',
  'industry_guidance',
  'industry_reference',
  'policy',
  'whitepaper'
]);

function normalizedScope(candidate) {
  return text(candidate.corpus_scope ?? candidate.source_scope ?? candidate.material_scope).toUpperCase();
}

function sourceType(candidate) {
  return text(candidate.source_type ?? candidate.material_source_type).toLowerCase();
}

function lifecycleAllowed(candidate) {
  if (candidate.lifecycle_status != null && text(candidate.lifecycle_status) !== 'ACTIVE') return false;
  if (candidate.review_status != null && text(candidate.review_status) !== 'approved') return false;
  if (candidate.usage_status != null && !ACTIVE_USAGE.has(text(candidate.usage_status))) return false;
  // Private project materials are indexed through the project retrieval path;
  // their corpus index_status may remain NOT_INDEXED even when the chunk has a
  // valid embedding. Public corpus candidates must be explicitly indexed.
  if (candidate.index_status != null && text(candidate.index_status) !== 'INDEXED'
    && normalizedScope(candidate) !== 'ENTERPRISE_PRIVATE') return false;
  if (candidate.effective_status != null
    && !['current', 'current_status_required', 'amended'].includes(text(candidate.effective_status))) return false;
  if (candidate.validity_status != null && ['expired', 'revoked'].includes(text(candidate.validity_status))) return false;
  return true;
}

function candidateMetadata(candidate) {
  const metadata = candidate.metadata ?? candidate.material_metadata ?? {};
  return metadata && typeof metadata === 'object' && !Array.isArray(metadata) ? metadata : {};
}

function explicitOrMetadataBoolean(candidate, key) {
  const direct = bool(candidate[key]);
  if (direct != null) return direct;
  return bool(candidateMetadata(candidate)[key]);
}

function classifySourceAuthority(candidate) {
  const authority = text(candidate.source_authority ?? candidate.authority_level).toLowerCase();
  const type = sourceType(candidate);
  if (['official', 'authoritative', 'third_party_authority', 'customer_authority', 'manufacturer_authority', 'enterprise_private'].includes(authority)) return true;
  if (EXTERNAL_PROOF_SOURCE_TYPES.has(type)) return true;
  return false;
}

function classifyEvidenceCapability(candidate, intent) {
  const explicit = text(candidate.evidence_capability ?? candidate.capability).toLowerCase();
  if (explicit === 'capable' || explicit === 'proof_capable') return true;
  if (explicit === 'not_capable' || explicit === 'reference_only') return false;
  const type = sourceType(candidate);
  if (GENERIC_REFERENCE_SOURCE_TYPES.has(type)) return false;
  if (EXTERNAL_PROOF_SOURCE_TYPES.has(type)) return true;
  return normalizedScope(candidate) === 'ENTERPRISE_PRIVATE'
    && text(candidate.material_type).toLowerCase() !== 'historical_bid'
    && Boolean(intent);
}

function classifySubjectMatch(candidate, requirement) {
  const explicit = explicitOrMetadataBoolean(candidate, 'subject_match');
  if (explicit != null) return explicit;
  const projectMatch = candidate.project_id && requirement?.project_id && String(candidate.project_id) === String(requirement.project_id);
  return normalizedScope(candidate) === 'ENTERPRISE_PRIVATE' && Boolean(projectMatch);
}

function classifyEntityMatch(candidate, requirement) {
  const explicit = explicitOrMetadataBoolean(candidate, 'entity_match');
  if (explicit != null) return explicit;
  const projectMatch = candidate.project_id && requirement?.project_id && String(candidate.project_id) === String(requirement.project_id);
  return normalizedScope(candidate) === 'ENTERPRISE_PRIVATE' && Boolean(projectMatch);
}

function classifyScopeMatch(candidate, requirement) {
  const explicit = explicitOrMetadataBoolean(candidate, 'scope_match');
  if (explicit != null) return explicit;
  const projectMatch = candidate.project_id && requirement?.project_id && String(candidate.project_id) === String(requirement.project_id);
  return normalizedScope(candidate) === 'ENTERPRISE_PRIVATE' && Boolean(projectMatch);
}

function classifyIntent(requirement = {}) {
  const explicit = text(requirement.evidence_intent ?? requirement.requirement_role);
  if (ENTERPRISE_PROOF_INTENTS.includes(explicit)) return explicit;
  const category = text(requirement.requirement_category ?? requirement.category).toLowerCase();
  const value = text(requirement.text);
  if (/qualification|资质|认证|证书/.test(category) || /认证|证书|资质/.test(value)) return 'ENTERPRISE_QUALIFICATION';
  if (/project|case|项目经验|案例/.test(category) || /同类项目|项目经验|实施及验收/.test(value)) return 'ENTERPRISE_PROJECT_EXPERIENCE';
  if (/product|capability|产品能力|企业能力/.test(category) || /企业自身.*能力|产品.*能力|具备.*能力/.test(value)) return 'ENTERPRISE_PRODUCT_CAPABILITY';
  return null;
}

export function classifyEnterpriseEvidenceIntent(requirement = {}) {
  return classifyIntent(requirement);
}

function routeCandidate({ requirement, intent, candidate }) {
  const reasons = [];
  if (!lifecycleAllowed(candidate)) return { route: 'OUT_OF_SCOPE', proof_eligible: false, proof_capable: false, reasons: ['LIFECYCLE_OR_VALIDITY_INVALID'] };
  const scope = normalizedScope(candidate);
  const type = sourceType(candidate);
  const authority = classifySourceAuthority(candidate);
  const capability = classifyEvidenceCapability(candidate, intent);
  const subject = classifySubjectMatch(candidate, requirement);
  const entity = classifyEntityMatch(candidate, requirement);
  const scopeMatch = classifyScopeMatch(candidate, requirement);
  if (!authority) reasons.push('SOURCE_AUTHORITY_INSUFFICIENT');
  if (!capability) reasons.push('EVIDENCE_CAPABILITY_INSUFFICIENT');
  if (!subject) reasons.push('SUBJECT_MISMATCH');
  if (!entity) reasons.push('ENTITY_MISMATCH');
  if (!scopeMatch) reasons.push('SCOPE_MISMATCH');
  if (type === 'historical_bid' || candidate.material_type === 'historical_bid') reasons.push('HISTORICAL_REFERENCE_ONLY');
  const eligible = authority && capability && subject && entity && scopeMatch
    && type !== 'historical_bid' && candidate.material_type !== 'historical_bid';
  if (eligible) return {
    route: 'PROOF_ELIGIBLE', proof_eligible: true, proof_capable: true,
    reasons: ['EVIDENCE_INTENT_AND_SOURCE_QUALIFIED'], source_scope: scope
  };
  return {
    route: reasons.includes('LIFECYCLE_OR_VALIDITY_INVALID') ? 'OUT_OF_SCOPE' : 'REFERENCE_CONTEXT',
    proof_eligible: false,
    proof_capable: false,
    reasons,
    source_scope: scope
  };
}

export function routeEnterpriseProofCandidates({ requirement = {}, candidates = [] } = {}) {
  const intent = classifyIntent(requirement);
  const input = Array.isArray(candidates) ? candidates : [];
  if (!intent) {
    return {
      routing_version: ENTERPRISE_PROOF_ROUTING_VERSION,
      intent: null,
      proof_candidates: input,
      proof_eligible_candidates: input,
      reference_candidates: [],
      out_of_scope_candidates: [],
      all_candidates: input,
      routing_false_positive_count: 0,
      enterprise_source_precision: null
    };
  }
  const proof = [];
  const reference = [];
  const outOfScope = [];
  for (const candidate of input) {
    const route = routeCandidate({ requirement, intent, candidate });
    const routed = {
      ...candidate,
      source_route: route.route,
      proof_eligibility: route.route,
      proof_eligible: route.proof_eligible,
      proof_capable: route.proof_capable,
      routing_reason: route.reasons,
      source_scope: route.source_scope ?? normalizedScope(candidate)
    };
    if (route.route === 'PROOF_ELIGIBLE') proof.push(routed);
    else if (route.route === 'OUT_OF_SCOPE') outOfScope.push(routed);
    else reference.push(routed);
  }
  return {
    routing_version: ENTERPRISE_PROOF_ROUTING_VERSION,
    intent,
    proof_candidates: proof,
    proof_eligible_candidates: proof,
    reference_candidates: reference,
    out_of_scope_candidates: outOfScope,
    all_candidates: input,
    routing_false_positive_count: proof.filter(item => item.proof_eligibility !== 'PROOF_ELIGIBLE').length,
    enterprise_source_precision: input.length ? proof.length / input.length : null
  };
}
