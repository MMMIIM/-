import { createHash } from 'node:crypto';
import { AppError } from '../errors.js';

export const PROJECT_FACT_PROPAGATION_VERSION = 'project-fact-propagation-v1';
export const WRITER_PROJECT_FACT_CONTEXT_VERSION = 'writer-project-fact-context-v1';
export const PROJECT_FACT_PROPAGATION_PLAN_VERSION = 'project-fact-propagation-plan-v1';
export const PROPAGATION_TARGET_TYPES = ['requirement', 'claim', 'chapter', 'writer_task', 'future_document_anchor'];
export const PROPAGATION_BINDING_ROLES = ['required', 'optional', 'context_only'];
export const PROPAGATION_SOURCE_REASONS = ['requirement_link', 'claim_link', 'project_fact_scope', 'chapter_plan', 'manual_binding', 'deterministic_rule'];
export const PROPAGATION_COVERAGE_STATUSES = ['complete', 'partial', 'unresolved', 'blocked'];

const stable = (value) => Array.isArray(value) ? value.map(stable) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])])) : value;
export const propagationHash = (value) => createHash('sha256').update(JSON.stringify(stable(value))).digest('hex');
const fail = (code, message) => { throw new AppError(code, message, 422); };

export function createPropagationBinding(input) {
  if (!PROPAGATION_TARGET_TYPES.includes(input.target_type)) fail('PROPAGATION_TARGET_TYPE_INVALID', '传播目标类型无效。');
  if (!PROPAGATION_BINDING_ROLES.includes(input.binding_role)) fail('PROPAGATION_BINDING_ROLE_INVALID', '传播角色无效。');
  if (!PROPAGATION_SOURCE_REASONS.includes(input.source_reason)) fail('PROPAGATION_SOURCE_REASON_INVALID', '传播来源无效。');
  if (!String(input.target_id || '').trim()) fail('PROPAGATION_TARGET_REQUIRED', '传播目标不能为空。');
  const canonical = {
    project_id: input.project_id,
    project_fact_id: input.project_fact_id,
    project_fact_version: Number(input.project_fact_version),
    target_type: input.target_type,
    target_id: String(input.target_id),
    binding_role: input.binding_role,
    binding_status: input.binding_status || 'active',
    source_reason: input.source_reason,
    source_ref: input.source_ref || null,
    propagation_version: Number(input.propagation_version || 1),
    contract_version: PROJECT_FACT_PROPAGATION_VERSION,
  };
  return { ...canonical, propagation_id: `PFB-${propagationHash(canonical).slice(0, 32).toUpperCase()}` };
}

export function createWriterContextPack({ projectId, chapterId, facts, bindings, versions = {} }) {
  const byId = new Map(facts.map((fact) => [fact.project_fact_id, fact]));
  const refs = bindings.filter((binding) => binding.target_type === 'chapter' && binding.target_id === chapterId && binding.binding_status === 'active')
    .map((binding) => ({ binding, fact: byId.get(binding.project_fact_id) }))
    .filter(({ fact }) => fact && fact.review_status === 'approved' && fact.conflict_status !== 'conflict')
    .map(({ binding, fact }) => ({
      project_fact_id: fact.project_fact_id, version: fact.version, key: fact.key,
      value: fact.value_status === 'pending' ? null : fact.value, value_status: fact.value_status,
      role: fact.fact_role, binding_role: binding.binding_role, source_hash: fact.payload_hash,
    })).sort((a, b) => a.project_fact_id.localeCompare(b.project_fact_id));
  const body = { project_id: projectId, chapter_id: chapterId, project_fact_refs: refs,
    requirement_version: versions.requirementVersion || 'current', claim_gate_identity: versions.claimGateIdentity || 'current',
    chapter_plan_version: versions.chapterPlanVersion || '1', binding_contract_version: versions.bindingContractVersion || PROJECT_FACT_PROPAGATION_VERSION,
    propagation_contract_version: PROJECT_FACT_PROPAGATION_VERSION, contract_version: WRITER_PROJECT_FACT_CONTEXT_VERSION };
  return { ...body, context_hash: propagationHash(body) };
}

export function createPropagationPlan({ projectId, previousFactId = null, currentFactId, expectedTargets, resolvedTargets, claimRevalidation = [], versions = {} }) {
  const sorted = (items) => [...items].sort((a, b) => `${a.target_type}:${a.target_id}`.localeCompare(`${b.target_type}:${b.target_id}`));
  const expected = sorted(expectedTargets), resolved = sorted(resolvedTargets);
  const resolvedKeys = new Set(resolved.map((item) => `${item.target_type}:${item.target_id}`));
  const unresolved = expected.filter((item) => !resolvedKeys.has(`${item.target_type}:${item.target_id}`));
  const coverage = expected.length === 0 ? 'blocked' : unresolved.length === 0 ? 'complete' : resolved.length === 0 ? 'unresolved' : 'partial';
  const body = { project_id: projectId, previous_fact_id: previousFactId, current_fact_id: currentFactId,
    affected_requirements: resolved.filter((x) => x.target_type === 'requirement').map((x) => x.target_id),
    affected_claims: resolved.filter((x) => x.target_type === 'claim').map((x) => x.target_id),
    affected_chapters: resolved.filter((x) => x.target_type === 'chapter').map((x) => x.target_id),
    affected_writer_tasks: resolved.filter((x) => x.target_type === 'writer_task').map((x) => x.target_id),
    future_document_anchors: resolved.filter((x) => x.target_type === 'future_document_anchor').map((x) => x.target_id),
    revalidation_required: claimRevalidation.length > 0, regeneration_required: resolved.some((x) => ['chapter', 'writer_task', 'future_document_anchor'].includes(x.target_type)),
    claim_revalidations: [...new Set(claimRevalidation)].sort().map((claim_id) => ({ claim_id, code: 'CLAIM_REVALIDATION_REQUIRED' })),
    expected_target_count: expected.length, resolved_target_count: resolved.length, unresolved_targets: unresolved,
    coverage_status: coverage, plan_version: Number(versions.planVersion || 1), contract_version: PROJECT_FACT_PROPAGATION_PLAN_VERSION,
    requirement_version: versions.requirementVersion || 'current', claim_gate_identity: versions.claimGateIdentity || 'current', chapter_plan_version: versions.chapterPlanVersion || '1', binding_contract_version: versions.bindingContractVersion || PROJECT_FACT_PROPAGATION_VERSION };
  return { ...body, plan_id: `PFPLAN-${propagationHash(body).slice(0, 32).toUpperCase()}`, plan_hash: propagationHash(body) };
}
