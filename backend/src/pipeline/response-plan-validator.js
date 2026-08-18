import { routeRequirement } from './chapter-router.js';

const VALID_STATUSES = new Set(['full', 'partial', 'gap']);

export class ResponsePlanValidator {
  constructor({ requirements, evidenceCatalog }) {
    this.requirements = requirements;
    this.evidenceCatalog = evidenceCatalog;
  }

  validate(plans) {
    const byRequirement = new Map();
    for (const plan of plans || []) {
      if (!this.requirements.some((item) => item.req_id === plan.requirement_id)) {
        throw Object.assign(new Error('Plan 引用了非正式 Requirement。'), { code: 'PLAN_REQUIREMENT_INVALID' });
      }
      if (byRequirement.has(plan.requirement_id)) throw Object.assign(new Error('每个 Requirement 只能有一个 Plan。'), { code: 'DUPLICATE_RESPONSE_PLAN' });
      if (!VALID_STATUSES.has(plan.response_status)) throw Object.assign(new Error('Plan response_status 无效。'), { code: 'RESPONSE_PLAN_INVALID' });
      if (plan.response_status === 'partial' && !String(plan.capability_gap || '').trim()) {
        throw Object.assign(new Error('partial Plan 必须说明 capability_gap。'), { code: 'CAPABILITY_GAP_REQUIRED' });
      }
      const evidenceIds = this.evidenceCatalog.assertExisting(plan.supporting_evidence_ids);
      const requirement = this.requirements.find((item) => item.req_id === plan.requirement_id);
      byRequirement.set(plan.requirement_id, {
        ...plan,
        supporting_evidence_ids: evidenceIds,
        target_sections: routeRequirement(requirement)
      });
    }
    const missing = this.requirements.filter((item) => !byRequirement.has(item.req_id)).map((item) => item.req_id);
    if (missing.length) throw Object.assign(new Error(`Requirement 缺少 Plan：${missing.join(', ')}`), { code: 'RESPONSE_PLAN_MISSING', requirement_ids: missing });
    return this.requirements.map((item) => byRequirement.get(item.req_id));
  }
}
