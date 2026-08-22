export const AGENT_ACTION_LEVELS = Object.freeze({ L0: 0, L1: 1, L2: 2, L3: 3, L4: 4 });

const READ_ACTIONS = /^(get|find|list|explain|prioritize|check)/i;
const SAFE_ACTIONS = /^(refresh|runMaterialRetrieval|runBidCheck|navigateTo)/i;
const PREPARE_ACTIONS = /^(prepare|draft|propose|preview|validate)/i;
const MUTATION_ACTIONS = /^(edit|update|create|delete|regenerate|submit|apply)/i;
const FORMAL_ACTIONS = /(approve|confirm|decide|resolve|override|bypass|accept|reject)/i;

export function classifyAgentAction(actionName) {
  const name = String(actionName || '').trim();
  if (!name) return { level: 'L4', numeric_level: 4, execution: 'blocked', allowed: false };
  if (name === 'navigateTo') return { level: 'L1', numeric_level: 1, execution: 'automatic', allowed: true };
  if (READ_ACTIONS.test(name)) return { level: 'L0', numeric_level: 0, execution: 'automatic', allowed: true };
  if (name === 'applyApprovedChapterRevision') return { level: 'L3', numeric_level: 3, execution: 'preview_required', allowed: false };
  if (FORMAL_ACTIONS.test(name)) return { level: 'L4', numeric_level: 4, execution: 'human_required', allowed: false };
  if (SAFE_ACTIONS.test(name)) return { level: 'L1', numeric_level: 1, execution: 'automatic', allowed: true };
  if (PREPARE_ACTIONS.test(name)) return { level: 'L2', numeric_level: 2, execution: 'prepare_only', allowed: false };
  if (MUTATION_ACTIONS.test(name)) return { level: 'L3', numeric_level: 3, execution: 'preview_required', allowed: false };
  return { level: 'L4', numeric_level: 4, execution: 'blocked', allowed: false };
}

export function authorizeAgentAction({ context, tool, risk_level, target, phase = 'execute' } = {}) {
  const projectId = context?.project_id;
  if (!projectId || (target?.project_id && target.project_id !== projectId)) {
    return { allowed: false, status: 'BLOCKED', reason_code: 'AGENT_CONTEXT_MISMATCH', policy: classifyAgentAction(tool) };
  }
  const policy = classifyAgentAction(tool);
  if (risk_level && risk_level !== policy.level) {
    return { allowed: false, status: 'BLOCKED', reason_code: 'AGENT_RISK_LEVEL_MISMATCH', policy };
  }
  if (policy.numeric_level === 4) return { allowed: false, status: 'HUMAN_REQUIRED', reason_code: 'FORMAL_DECISION_HUMAN_REQUIRED', policy };
  if (policy.numeric_level === 3 && phase === 'execute' && !target?.preview_id) return { allowed: false, status: 'BLOCKED', reason_code: 'PREVIEW_REQUIRED', policy };
  if (policy.numeric_level === 3 && phase === 'execute' && target?.human_approved !== true) return { allowed: false, status: 'HUMAN_REQUIRED', reason_code: 'HUMAN_APPROVAL_REQUIRED', policy };
  return { allowed: true, status: 'AUTHORIZED', reason_code: null, policy };
}

export function evaluateAgentAction(actionName, { requiresHuman = false } = {}) {
  const policy = classifyAgentAction(actionName);
  if (requiresHuman || policy.numeric_level >= 4) return { ...policy, execution: 'human_required', allowed: false };
  return policy;
}
