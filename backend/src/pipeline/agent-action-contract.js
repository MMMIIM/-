export const ACTION_RESULTS = Object.freeze([
  'EXECUTED', 'PREPARED', 'PREVIEW_READY', 'HUMAN_REQUIRED', 'BLOCKED',
  'NO_CHANGE', 'FAILED', 'STALE'
]);

export function actionResult(result, {
  action_id = null, tool = null, risk_level = null, what_happened = '',
  what_changed = [], what_did_not_change = [], next_action = null,
  target = null, validation_result = null, human_required = false,
  preview = null, source_refs = [], before_version = null, after_version = null
} = {}) {
  if (!ACTION_RESULTS.includes(result)) throw new Error(`Unknown Agent action result: ${result}`);
  return { result, action_id, tool, risk_level, what_happened, what_changed, what_did_not_change, next_action, target, validation_result, human_required, preview, source_refs, before_version, after_version };
}

export function summarizeActionResults(results = []) {
  const executed = results.filter((item) => item.result === 'EXECUTED').length;
  const prepared = results.filter((item) => ['PREPARED', 'PREVIEW_READY'].includes(item.result)).length;
  const failed = results.filter((item) => ['FAILED', 'STALE', 'BLOCKED'].includes(item.result)).length;
  const human = results.filter((item) => item.result === 'HUMAN_REQUIRED').length;
  return { total: results.length, executed, prepared, failed, human_required: human, partial: failed > 0 && (executed + prepared + human > 0) };
}
