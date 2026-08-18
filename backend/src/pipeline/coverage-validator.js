export class CoverageValidator {
  validate({ requirements, evaluatedClaims }) {
    const approved = evaluatedClaims.filter((item) => item.decision.decision === 'approved');
    const covered = new Set(approved.flatMap((item) => item.claim.basis_requirement_ids || []));
    const coverage = requirements.map((requirement) => ({
      requirement_id: requirement.req_id,
      is_mandatory: Boolean(requirement.is_mandatory),
      covered: covered.has(requirement.req_id),
      approved_claim_ids: approved.filter((item) => item.claim.basis_requirement_ids?.includes(requirement.req_id)).map((item) => item.claim.claim_id)
    }));
    const uncoveredMandatory = coverage.filter((item) => item.is_mandatory && !item.covered).map((item) => item.requirement_id);
    return { coverage, uncovered_requirement_ids: coverage.filter((item) => !item.covered).map((item) => item.requirement_id), valid: uncoveredMandatory.length === 0, uncovered_mandatory_ids: uncoveredMandatory };
  }
}
