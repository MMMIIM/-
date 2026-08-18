const HIGH_RISK_TYPES = new Set(['quantitative', 'deliverable', 'scope_exclusion', 'responsibility_transfer']);

export class ClaimGateService {
  constructor({ requirements, evidenceCatalog }) {
    this.requirementIds = new Set(requirements.map((item) => item.req_id));
    this.evidenceCatalog = evidenceCatalog;
  }

  evaluate(claims = []) {
    return claims.map((claim) => {
      const requirementIds = [...new Set(claim.basis_requirement_ids || [])];
      const invalidRequirements = requirementIds.filter((id) => !this.requirementIds.has(id));
      let evidenceIds = [];
      let reason = null;
      try { evidenceIds = this.evidenceCatalog.assertExisting(claim.basis_evidence_ids); }
      catch (error) { reason = error.code; }
      if (invalidRequirements.length) reason = 'CLAIM_REQUIREMENT_BASIS_INVALID';
      if (!requirementIds.length && !evidenceIds.length) reason = 'CLAIM_BASIS_REQUIRED';
      if (HIGH_RISK_TYPES.has(claim.claim_type) && !evidenceIds.length) reason = `HIGH_RISK_${claim.claim_type.toUpperCase()}_UNSUPPORTED`;
      const decision = reason ? 'rejected' : 'approved';
      return {
        claim: { ...claim, basis_requirement_ids: requirementIds, basis_evidence_ids: evidenceIds },
        decision: { claim_id: claim.claim_id, decision, reason_code: reason }
      };
    });
  }

  writerInput(evaluated) { return evaluated.filter((item) => item.decision.decision === 'approved').map((item) => item.claim); }
}
