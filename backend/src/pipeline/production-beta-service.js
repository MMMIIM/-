import { EvidenceCatalogService } from './evidence-catalog-service.js';
import { ResponsePlanValidator } from './response-plan-validator.js';
import { ClaimGateService } from './claim-gate-service.js';
import { CoverageValidator } from './coverage-validator.js';

export class ProductionBetaService {
  constructor({ repository }) { this.repository = repository; }

  async process(projectId, input = {}) {
    const requirements = await this.repository.getFormalRequirements(projectId);
    if (!requirements.length) throw Object.assign(new Error('项目尚无已确认 Requirement 基线。'), { code: 'REQUIREMENT_BASELINE_REQUIRED', status: 409 });
    try {
      const persistedEvidence = typeof this.repository.listApprovedEvidence === 'function'
        ? await this.repository.listApprovedEvidence(projectId)
        : input.evidence;
      const evidenceCatalog = new EvidenceCatalogService(persistedEvidence);
      const plans = new ResponsePlanValidator({ requirements, evidenceCatalog }).validate(input.response_plans);
      const claimGate = new ClaimGateService({ requirements, evidenceCatalog });
      const evaluatedClaims = claimGate.evaluate(input.claims);
      const coverage = new CoverageValidator().validate({ requirements, evaluatedClaims });
      const provisionalRequirements = requirements.filter((item) => item.source_status === 'provisional');
      const result = { evidence: evidenceCatalog.list(), plans, evaluatedClaims, coverage,
        writer_input: claimGate.writerInput(evaluatedClaims),
        provisional_requirements: provisionalRequirements.map((item) => ({ req_id: item.req_id, text: item.text, is_mandatory: item.is_mandatory })) };
      return await this.repository.saveProductionBetaResult(projectId, result);
    } catch (error) {
      try { await this.repository.saveProductionBetaFailure(projectId, error); }
      catch (auditError) { error.audit_persistence_error = auditError?.code || 'AUDIT_PERSISTENCE_FAILED'; }
      throw error;
    }
  }

  async get(projectId) { return this.repository.getProductionBetaResult(projectId); }
}
