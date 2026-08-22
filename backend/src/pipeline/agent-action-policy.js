export const AGENT_ACTION_LEVELS = Object.freeze({ L0: 0, L1: 1, L2: 2, L3: 3, L4: 4 });

const READ_ACTIONS = /^(get|find|list|explain|prioritize|check)/i;
const PREPARE_ACTIONS = /^(prepare|draft|propose|preview)/i;
const MUTATION_ACTIONS = /^(edit|update|create|delete|regenerate|submit|apply)/i;
const FORMAL_ACTIONS = /(approve|confirm|decide|resolve|override|bypass|accept|reject)/i;

export function classifyAgentAction(actionName) {
  const name = String(actionName || '').trim();
  if (!name) return { level: 'L4', numeric_level: 4, execution: 'blocked', allowed: false };
  if (name === 'navigateTo') return { level: 'L1', numeric_level: 1, execution: 'automatic', allowed: true };
  if (READ_ACTIONS.test(name)) return { level: 'L0', numeric_level: 0, execution: 'automatic', allowed: true };
  if (FORMAL_ACTIONS.test(name)) return { level: 'L4', numeric_level: 4, execution: 'human_required', allowed: false };
  if (PREPARE_ACTIONS.test(name)) return { level: 'L2', numeric_level: 2, execution: 'prepare_only', allowed: false };
  if (MUTATION_ACTIONS.test(name)) return { level: 'L3', numeric_level: 3, execution: 'preview_required', allowed: false };
  return { level: 'L4', numeric_level: 4, execution: 'blocked', allowed: false };
}

export function evaluateAgentAction(actionName, { requiresHuman = false } = {}) {
  const policy = classifyAgentAction(actionName);
  if (requiresHuman || policy.numeric_level >= 4) return { ...policy, execution: 'human_required', allowed: false };
  return policy;
}
