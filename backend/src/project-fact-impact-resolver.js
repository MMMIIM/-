import { AppError } from './errors.js';
import { createPropagationBinding, createPropagationPlan, createWriterContextPack, PROJECT_FACT_PROPAGATION_VERSION } from './pipeline/project-fact-propagation-contract-v1.js';

const key = (item) => `${item.target_type}:${item.target_id}`;
const approved = (fact) => fact?.review_status === 'approved' && fact.conflict_status !== 'conflict';

export class ProjectFactImpactResolver {
  constructor({ repository = null } = {}) { this.repository = repository; }

  resolve({ fact, requirements = [], approvedClaims = [], chapterPlan = [], existingBindings = [], manualBindings = [] }) {
    if (!approved(fact)) throw new AppError('PROJECT_FACT_NOT_PROPAGATABLE', '只有已批准且无冲突的 Project Fact 可传播。', 409);
    const requirementIds = new Set(requirements.map((item) => item.req_id || item.requirement_id));
    const claimIds = new Set(approvedClaims.filter((item) => item.decision === 'allow' || item.writer_eligible === true || item.decision === 'approved').map((item) => item.claim_id));
    const chapterIds = new Set(chapterPlan.map((item) => item.chapter_id));
    const writerTaskIds = new Set(chapterPlan.flatMap((item) => item.writer_task_ids || []));
    const anchorIds = new Set(chapterPlan.flatMap((item) => item.future_document_anchor_ids || []));
    const candidates = [];
    const add = (target_type, target_id, binding_role, source_reason, source_ref = null) => candidates.push(createPropagationBinding({ project_id: fact.project_id, project_fact_id: fact.project_fact_id, project_fact_version: fact.version, target_type, target_id, binding_role, source_reason, source_ref }));
    for (const ref of fact.provenance_refs || []) {
      if (ref.source_type === 'requirement') add('requirement', ref.source_id, 'context_only', 'requirement_link', { snapshot_hash: ref.snapshot_hash });
      if (ref.source_type === 'approved_claim') add('claim', ref.source_id, 'required', 'claim_link', { snapshot_hash: ref.snapshot_hash });
    }
    for (const raw of [...existingBindings, ...manualBindings]) {
      if (raw.project_fact_id && raw.project_fact_id !== fact.project_fact_id && raw.fact_key !== fact.key) continue;
      add(raw.target_type, raw.target_id, raw.binding_role || 'context_only', raw.source_reason || 'manual_binding', raw.source_ref || null);
    }
    const linkedRequirements = new Set(candidates.filter((x) => x.target_type === 'requirement').map((x) => x.target_id));
    const linkedClaims = new Set(candidates.filter((x) => x.target_type === 'claim').map((x) => x.target_id));
    for (const chapter of chapterPlan) {
      const scopeMatch = (fact.scope || []).includes(chapter.chapter_id) || (chapter.fact_keys || []).includes(fact.key);
      const lineageMatch = (chapter.requirement_ids || []).some((id) => linkedRequirements.has(id)) || (chapter.claim_ids || []).some((id) => linkedClaims.has(id));
      if (!scopeMatch && !lineageMatch) continue;
      add('chapter', chapter.chapter_id, chapter.binding_role || 'required', scopeMatch ? 'project_fact_scope' : 'chapter_plan', { chapter_plan_version: chapterPlan.version || '1' });
      for (const id of chapter.writer_task_ids || []) add('writer_task', id, chapter.binding_role || 'required', 'chapter_plan', { chapter_id: chapter.chapter_id });
      for (const id of chapter.future_document_anchor_ids || []) add('future_document_anchor', id, 'context_only', 'chapter_plan', { chapter_id: chapter.chapter_id, actual_offset: null });
    }
    const unique = new Map();
    for (const item of candidates) if (!unique.has(key(item))) unique.set(key(item), item);
    const targets = [...unique.values()].sort((a, b) => key(a).localeCompare(key(b)));
    const resolvers = { requirement: requirementIds, claim: claimIds, chapter: chapterIds, writer_task: writerTaskIds, future_document_anchor: anchorIds };
    const resolved = targets.filter((item) => resolvers[item.target_type].has(item.target_id));
    return { bindings: targets, expected_targets: targets.map(({ target_type, target_id }) => ({ target_type, target_id })), resolved_targets: resolved.map(({ target_type, target_id }) => ({ target_type, target_id })) };
  }

  writerContext(input) { return createWriterContextPack(input); }

  planChange({ previousFact, currentFact, resolution, versions = {} }) {
    const claims = resolution.expected_targets.filter((item) => item.target_type === 'claim').map((item) => item.target_id);
    return createPropagationPlan({ projectId: currentFact.project_id, previousFactId: previousFact?.project_fact_id || null, currentFactId: currentFact.project_fact_id, expectedTargets: resolution.expected_targets, resolvedTargets: resolution.resolved_targets, claimRevalidation: previousFact ? claims : [], versions });
  }

  async persist({ fact, resolution, contexts = [], plan = null }) {
    if (!this.repository) return { bindings: resolution.bindings, contexts, plan };
    const bindings = await this.repository.upsertProjectFactPropagationBindings(resolution.bindings);
    const packs = [];
    for (const context of contexts) packs.push(await this.repository.saveProjectFactWriterContext(context));
    const savedPlan = plan ? await this.repository.saveProjectFactPropagationPlan(plan) : null;
    return { fact, bindings, contexts: packs, plan: savedPlan };
  }

  async invalidateStale(projectId, currentVersions) {
    if (!this.repository) return { contexts: 0, plans: 0 };
    return this.repository.invalidateProjectFactPropagationArtifacts(projectId, { ...currentVersions, propagationContractVersion: PROJECT_FACT_PROPAGATION_VERSION });
  }
}
