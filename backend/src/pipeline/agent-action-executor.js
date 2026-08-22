import { randomUUID } from 'node:crypto';
import { createHash } from 'node:crypto';
import { classifyAgentAction, authorizeAgentAction } from './agent-action-policy.js';
import { actionResult, summarizeActionResults } from './agent-action-contract.js';

const ACTION_METHODS = new Map([
  ['refreshProjectReadiness', 'refreshProjectReadiness'], ['runMaterialRetrieval', 'runMaterialRetrieval'],
  ['prepareEvidenceReview', 'prepareEvidenceReview'], ['prepareRequirementMaterialMatch', 'prepareRequirementMaterialMatch'],
  ['runBidCheck', 'runBidCheck'], ['prepareBidCheckFix', 'prepareBidCheckFix'],
  ['prepareChapterRevision', 'prepareChapterRevision'], ['regenerateChapter', 'regenerateChapter'],
  ['validateChapterRevision', 'validateChapterRevision'], ['applyApprovedChapterRevision', 'applyApprovedChapterRevision'],
  ['refreshGenerationStatus', 'refreshGenerationStatus']
]);

const hashArgs = (value) => createHash('sha256').update(JSON.stringify(value || {})).digest('hex').slice(0, 32);

function auditTarget(args = {}, projectId) {
  const output = { project_id: projectId };
  for (const [key, value] of Object.entries(args || {})) {
    if (/^(current_text|prompt|task_payload_json|content|source_text|original_text|proposed_text)$/i.test(key)) continue;
    if (value === undefined) continue;
    if (typeof value === 'string') output[key] = value.slice(0, 200);
    else if (Array.isArray(value)) output[key] = value.slice(0, 20);
    else if (value && typeof value === 'object') output[key] = auditTarget(value, projectId);
    else output[key] = value;
  }
  return output;
}

export class AgentActionExecutor {
  constructor({ actionService, repository, clock = () => Date.now(), maxActions = 8 } = {}) { this.actionService = actionService; this.repository = repository; this.clock = clock; this.maxActions = Math.max(1, Math.min(20, Number(maxActions) || 8)); }

  async execute({ context, tool, args = {}, agent_run_id = null, idempotency_key = null, human_approved = false } = {}) {
    const actionId = randomUUID();
    const name = String(tool || '').trim();
    const policy = authorizeAgentAction({ context, tool: name, risk_level: args.risk_level, target: { project_id: context?.project_id, ...args, human_approved }, phase: name.startsWith('prepare') || name.startsWith('validate') ? 'preview' : 'execute' });
    const key = idempotency_key || `${context?.project_id || 'unknown'}:${name}:${hashArgs(args)}`;
    const existing = await this.repository?.getAgentActionAuditByIdempotency?.(key);
    if (existing) return actionResult(existing.result === 'EXECUTED' ? 'NO_CHANGE' : existing.result, { action_id: existing.action_id, tool: name, risk_level: existing.risk_level, what_happened: '相同操作已经处理过，未重复执行。', what_did_not_change: ['没有创建重复版本或重复审核项。'], next_action: '查看已有操作记录' });
    const started = this.clock();
    let result;
    if (!policy.allowed) {
      result = actionResult(policy.status === 'HUMAN_REQUIRED' ? 'HUMAN_REQUIRED' : 'BLOCKED', { action_id: actionId, tool: name, risk_level: policy.policy.level, what_happened: '该操作未获得执行授权。', next_action: policy.reason_code, human_required: policy.status === 'HUMAN_REQUIRED' });
    } else {
      const method = ACTION_METHODS.get(name);
      try {
        result = method && this.actionService?.[method]
          ? await this.actionService[method](context, { ...args, human_approved })
          : actionResult('BLOCKED', { tool: name, risk_level: policy.policy.level, what_happened: '当前不支持该操作。', next_action: '使用现有工作区操作' });
      } catch (error) {
        result = actionResult('FAILED', { tool: name, risk_level: policy.policy.level, what_happened: '操作执行失败，正式数据未被助手直接修改。', next_action: error.code || '稍后重试' });
      }
    }
    await this.repository?.createAgentActionAudit?.({ action_id: actionId, agent_run_id, project_id: context?.project_id, idempotency_key: key, tool: name || 'unknown', risk_level: policy.policy.level, planned: true, executed: result.result === 'EXECUTED', target: auditTarget(args, context?.project_id), before_version: args.version_id || context?.document_version_id || null, after_version: result.after_version?.id || null, result: result.result, human_required: result.human_required || result.result === 'HUMAN_REQUIRED', validation_result: result.validation_result || null, latency_ms: Math.max(0, this.clock() - started) });
    return { ...result, action_id: actionId, tool: name, risk_level: policy.policy.level };
  }

  async executePlan({ context, agent_run_id = null, actions = [] } = {}) {
    const bounded = actions.slice(0, this.maxActions);
    const results = [];
    for (const plan of bounded) {
      const policy = classifyAgentAction(plan.action);
      if (policy.numeric_level >= 4) {
        results.push(actionResult('HUMAN_REQUIRED', { tool: plan.action, risk_level: policy.level, what_happened: '该步骤需要人工决定，未执行。', next_action: '进入对应审核页面', human_required: true }));
        continue;
      }
      results.push(await this.execute({ context, tool: plan.action, args: plan.args || {}, agent_run_id, idempotency_key: plan.idempotency_key }));
    }
    const summary = summarizeActionResults(results);
    return { results, summary, plan: bounded.map((item) => ({ action: item.action, risk_level: classifyAgentAction(item.action).level, auto_execute: classifyAgentAction(item.action).numeric_level <= 2, reason: item.reason || null })) };
  }
}
