export const ENTERPRISE_PROOF_ROUTING_VERSION = 'enterprise-proof-routing-v1';
export const ENTERPRISE_PROOF_INTENTS = Object.freeze([
  'ENTERPRISE_CAPABILITY_PROOF',
  'ENTERPRISE_QUALIFICATION',
  'ENTERPRISE_PROJECT_EXPERIENCE',
  'ENTERPRISE_PRODUCT_CAPABILITY'
]);

const text = value => String(value ?? '').trim();

export function classifyEnterpriseEvidenceIntent(requirement = {}) {
  const explicit = text(requirement.evidence_intent ?? requirement.requirement_role);
  if (ENTERPRISE_PROOF_INTENTS.includes(explicit)) return explicit;
  const category = text(requirement.requirement_category ?? requirement.category).toLowerCase();
  const value = text(requirement.text);
  if (/qualification|资质|认证|证书/.test(category) || /认证|证书|资质/.test(value)) return 'ENTERPRISE_QUALIFICATION';
  if (/project|case|项目经验|案例/.test(category) || /同类项目|项目经验|实施及验收/.test(value)) return 'ENTERPRISE_PROJECT_EXPERIENCE';
  if (/product|capability|产品能力|企业能力/.test(category) || /企业自身.*能力|产品.*能力|具备.*能力/.test(value)) return 'ENTERPRISE_PRODUCT_CAPABILITY';
  return null;
}

export function routeEnterpriseProofCandidates({ requirement, candidates = [] } = {}) {
  const intent = classifyEnterpriseEvidenceIntent(requirement);
  const input = Array.isArray(candidates) ? candidates : [];
  if (!intent) {
    return {
      routing_version: ENTERPRISE_PROOF_ROUTING_VERSION,
      intent: null,
      proof_candidates: input,
      reference_candidates: [],
      all_candidates: input,
      routing_false_positive_count: 0,
      enterprise_source_precision: null
    };
  }
  const proof = [];
  const reference = [];
  for (const candidate of input) {
    const scope = text(candidate.corpus_scope ?? candidate.source_scope ?? candidate.material_scope);
    if (scope === 'ENTERPRISE_PRIVATE') proof.push({ ...candidate, source_route: 'ENTERPRISE_PROOF', proof_capable: true });
    else reference.push({
      ...candidate,
      source_route: 'REFERENCE_CONTEXT',
      proof_capable: false,
      routing_reason: 'ENTERPRISE_PRIVATE_REQUIRED'
    });
  }
  return {
    routing_version: ENTERPRISE_PROOF_ROUTING_VERSION,
    intent,
    proof_candidates: proof,
    reference_candidates: reference,
    all_candidates: input,
    routing_false_positive_count: 0,
    enterprise_source_precision: input.length ? proof.length / input.length : null
  };
}
