import { createHash, randomUUID } from 'node:crypto';
import { authorizeAgentAction } from './agent-action-policy.js';
import { actionResult } from './agent-action-contract.js';

const sha = (value) => createHash('sha256').update(String(value || '')).digest('hex');

function lineDiff(before, after) {
  const left = String(before || '').split(/\r?\n/);
  const right = String(after || '').split(/\r?\n/);
  const rows = [];
  const max = Math.max(left.length, right.length);
  for (let index = 0; index < max; index += 1) {
    if (left[index] === right[index]) rows.push({ type: 'same', text: left[index] || '' });
    else {
      if (left[index] !== undefined) rows.push({ type: 'removed', text: left[index] });
      if (right[index] !== undefined) rows.push({ type: 'added', text: right[index] });
    }
  }
  return rows;
}

function targetProject(context, args = {}) { return { project_id: context.project_id, ...args }; }

function previewValue(preview, key, fallback = null) {
  if (!preview) return fallback;
  const dbKey = `${key}_json`;
  if (preview[dbKey] !== undefined && preview[dbKey] !== null) return preview[dbKey];
  if (preview[key] !== undefined && preview[key] !== null) return preview[key];
  return fallback;
}

function previewTarget(preview) {
  return previewValue(preview, 'target', {}) || {};
}

function previewProject(preview) {
  return preview?.project_id || previewTarget(preview).project_id || null;
}

export class AgentActionService {
  constructor({ repository, tools, evidenceReadinessService, reviewCenterService, productionBetaService, documentGenerationService, clock = () => Date.now() } = {}) {
    this.repository = repository;
    this.tools = tools;
    this.evidenceReadinessService = evidenceReadinessService;
    this.reviewCenterService = reviewCenterService;
    this.productionBetaService = productionBetaService;
    this.documentGenerationService = documentGenerationService;
    this.clock = clock;
    this.localPreviews = new Map();
  }

  authorize(context, tool, args = {}, phase = 'execute') {
    const policy = authorizeAgentAction({ context, tool, risk_level: args.risk_level, target: targetProject(context, args), phase });
    if (!policy.allowed) return policy;
    return policy;
  }

  async refreshProjectReadiness(context, args = {}) {
    const auth = this.authorize(context, 'refreshProjectReadiness', args);
    if (!auth.allowed) return actionResult(auth.status === 'HUMAN_REQUIRED' ? 'HUMAN_REQUIRED' : 'BLOCKED', { tool: 'refreshProjectReadiness', risk_level: auth.policy.level, what_happened: '准备度刷新未执行。', next_action: auth.reason_code });
    const readiness = await this.evidenceReadinessService?.get?.(context.project_id);
    if (!readiness) return actionResult('FAILED', { tool: 'refreshProjectReadiness', risk_level: auth.policy.level, what_happened: '暂时无法读取项目准备度。', next_action: '稍后重试' });
    return actionResult('EXECUTED', { tool: 'refreshProjectReadiness', risk_level: auth.policy.level, what_happened: '已重新读取项目准备度。', what_changed: [], what_did_not_change: ['没有修改正式需求、材料或审核结论。'], next_action: readiness.generation_readiness?.status === 'READY_TO_GENERATE' ? '可以进入生成' : '处理剩余待办', validation_result: readiness.generation_readiness || null });
  }

  async runMaterialRetrieval(context, args = {}) {
    const auth = this.authorize(context, 'runMaterialRetrieval', args);
    if (!auth.allowed) return actionResult(auth.status === 'HUMAN_REQUIRED' ? 'HUMAN_REQUIRED' : 'BLOCKED', { tool: 'runMaterialRetrieval', risk_level: auth.policy.level, what_happened: '材料检索未执行。', next_action: auth.reason_code });
    const result = await this.tools?.execute?.('findRelevantMaterials', context, args);
    if (!result || result.status === 'ERROR') return actionResult('FAILED', { tool: 'runMaterialRetrieval', risk_level: auth.policy.level, what_happened: '材料检索失败。', next_action: '稍后重试', source_refs: result?.source_refs || [] });
    return actionResult('EXECUTED', { tool: 'runMaterialRetrieval', risk_level: auth.policy.level, what_happened: result.user_message || '已完成材料检索。', what_changed: ['生成了材料候选结果。'], what_did_not_change: ['没有批准 Evidence、Fact 或 Mapping。'], next_action: result.data?.candidates?.length ? '确认材料候选' : '补充企业材料', source_refs: result.source_refs || [] });
  }

  async prepareEvidenceReview(context, args = {}) {
    const auth = this.authorize(context, 'prepareEvidenceReview', args);
    if (!auth.allowed) return actionResult('BLOCKED', { tool: 'prepareEvidenceReview', risk_level: auth.policy.level, what_happened: '材料确认准备未执行。', next_action: auth.reason_code });
    const result = await this.tools?.execute?.('getEvidenceCandidates', context, args);
    return actionResult(result?.status === 'ERROR' ? 'FAILED' : 'PREPARED', { tool: 'prepareEvidenceReview', risk_level: auth.policy.level, what_happened: '已整理材料候选和当前审核状态。', what_changed: [], what_did_not_change: ['没有改变正式审核结论。'], next_action: '由人工确认材料', source_refs: result?.source_refs || [] });
  }

  async prepareRequirementMaterialMatch(context, args = {}) {
    const auth = this.authorize(context, 'prepareRequirementMaterialMatch', args);
    if (!auth.allowed) return actionResult('BLOCKED', { tool: 'prepareRequirementMaterialMatch', risk_level: auth.policy.level, what_happened: '需求匹配准备未执行。', next_action: auth.reason_code });
    const result = await this.tools?.execute?.('findRelevantMaterials', context, args);
    return actionResult(result?.status === 'ERROR' ? 'FAILED' : 'PREPARED', { tool: 'prepareRequirementMaterialMatch', risk_level: auth.policy.level, what_happened: '已准备需求与材料的候选匹配。', what_changed: [], what_did_not_change: ['候选匹配不会自动成为正式 Mapping。'], next_action: '进入材料确认和需求匹配审核', source_refs: result?.source_refs || [] });
  }

  async runBidCheck(context, args = {}) {
    const auth = this.authorize(context, 'runBidCheck', args);
    if (!auth.allowed) return actionResult('BLOCKED', { tool: 'runBidCheck', risk_level: auth.policy.level, what_happened: '投标检查未执行。', next_action: auth.reason_code });
    const result = this.productionBetaService?.get ? await this.productionBetaService.get(context.project_id) : await this.tools?.execute?.('getBidCheckResults', context, args);
    if (!result) return actionResult('NO_CHANGE', { tool: 'runBidCheck', risk_level: auth.policy.level, what_happened: '当前没有可读取的投标检查结果。', next_action: '先完成正文生成或正式检查' });
    return actionResult('EXECUTED', { tool: 'runBidCheck', risk_level: auth.policy.level, what_happened: '已读取最新投标检查结果。', what_changed: [], what_did_not_change: ['没有隐藏或降低任何风险等级。'], next_action: '查看并分类处理检查问题', validation_result: result });
  }

  async prepareBidCheckFix(context, args = {}) {
    const auth = this.authorize(context, 'prepareBidCheckFix', args, 'preview');
    if (!auth.allowed) return actionResult('BLOCKED', { tool: 'prepareBidCheckFix', risk_level: auth.policy.level, what_happened: '检查问题修复未准备。', next_action: auth.reason_code });
    if (args.fix_type !== 'formatting_cleanup') return actionResult('HUMAN_REQUIRED', { tool: 'prepareBidCheckFix', risk_level: auth.policy.level, what_happened: '该问题不是当前可自动处理的确定性格式问题。', what_did_not_change: ['正文内容和业务承诺未改变。'], next_action: '人工审核或进入章节修订预览' });
    const before = String(args.current_text || '');
    const after = before.replace(/[ \t]+/g, ' ').replace(/[ \t]+\n/g, '\n');
    const preview = await this.savePreview(context, 'bid_check_fix', args.idempotency_key || `bid-check:${context.project_id}:${sha(before)}`, { project_id: context.project_id, fix_type: args.fix_type }, { before_text: before, proposed_text: after, diff: lineDiff(before, after) }, { status: 'pass' });
    return actionResult('PREVIEW_READY', { tool: 'prepareBidCheckFix', risk_level: auth.policy.level, what_happened: '已生成确定性格式修复预览。', what_changed: after === before ? [] : ['合并重复空白。'], what_did_not_change: ['没有修改正文语义或风险结论。'], next_action: '查看预览后由现有正式服务应用', preview, validation_result: { status: 'pass' } });
  }

  async prepareChapterRevision(context, args = {}) {
    const versionId = args.version_id || context.document_version_id;
    const chapterId = args.chapter_id || context.chapter_id;
    if (!versionId || !chapterId) return actionResult('BLOCKED', { tool: 'prepareChapterRevision', risk_level: 'L2', what_happened: '章节修订需要明确的文档版本和章节范围。', next_action: '打开目标章节后重试' });
    const auth = this.authorize(context, 'prepareChapterRevision', { ...args, project_id: context.project_id }, 'preview');
    if (!auth.allowed) return actionResult('BLOCKED', { tool: 'prepareChapterRevision', risk_level: auth.policy.level, what_happened: '章节修订预览未生成。', next_action: auth.reason_code });
    if (!this.documentGenerationService?.prepareRegeneration) return actionResult('FAILED', { tool: 'prepareChapterRevision', risk_level: auth.policy.level, what_happened: '当前版本暂不支持章节预览。', next_action: '使用现有章节生成页面' });
    const prepared = await this.documentGenerationService.prepareRegeneration(versionId, chapterId);
    const preview = await this.savePreview(context, 'chapter_revision', args.idempotency_key || `chapter:${versionId}:${chapterId}:${prepared.before_version_hash}`, { project_id: context.project_id, version_id: versionId, chapter_id: chapterId }, prepared.preview, prepared.validation);
    return actionResult('PREVIEW_READY', { tool: 'prepareChapterRevision', risk_level: auth.policy.level, what_happened: '已生成章节修订预览，尚未覆盖现有正文。', what_changed: ['形成 Original / Proposed / Diff 预览。'], what_did_not_change: ['当前正式版本未改变。'], next_action: '查看差异并确认应用', target: { project_id: context.project_id, version_id: versionId, chapter_id: chapterId }, validation_result: prepared.validation, preview });
  }

  async regenerateChapter(context, args = {}) { return this.prepareChapterRevision(context, args); }

  async validateChapterRevision(context, args = {}) {
    const preview = await this.loadPreview(args.preview_id);
    if (!preview) return actionResult('FAILED', { tool: 'validateChapterRevision', risk_level: 'L2', what_happened: '修订预览不存在。', next_action: '重新生成预览' });
    if (previewProject(preview) && previewProject(preview) !== context.project_id) return actionResult('BLOCKED', { tool: 'validateChapterRevision', risk_level: 'L2', what_happened: '该预览不属于当前项目。', next_action: '回到当前项目重新生成预览' });
    const stale = await this.isStale(preview);
    if (stale) return actionResult('STALE', { tool: 'validateChapterRevision', risk_level: 'L2', what_happened: '预览基于旧版本，不能继续应用。', what_did_not_change: ['当前正文未改变。'], next_action: '重新生成最新预览' });
    return actionResult('EXECUTED', { tool: 'validateChapterRevision', risk_level: 'L2', what_happened: '章节修订已通过当前预览校验。', what_changed: [], what_did_not_change: ['当前正式版本未改变。'], next_action: '由人工确认后应用', validation_result: preview.validation_json || preview.validation_result || {}, preview });
  }

  async applyApprovedChapterRevision(context, args = {}) {
    const preview = await this.loadPreview(args.preview_id);
    if (!preview) return actionResult('FAILED', { tool: 'applyApprovedChapterRevision', risk_level: 'L3', what_happened: '找不到待应用的修订预览。', next_action: '重新生成预览' });
    if (previewProject(preview) && previewProject(preview) !== context.project_id) return actionResult('BLOCKED', { tool: 'applyApprovedChapterRevision', risk_level: 'L3', what_happened: '该预览不属于当前项目。', next_action: '回到当前项目重新生成预览' });
    if (args.human_approved !== true) return actionResult('HUMAN_REQUIRED', { tool: 'applyApprovedChapterRevision', risk_level: 'L3', what_happened: '应用章节修订需要你的明确确认。', next_action: '查看差异并点击接受修改', human_required: true, preview });
    const stale = await this.isStale(preview);
    if (stale) { await this.updatePreview(preview.preview_id, { status: 'stale' }); return actionResult('STALE', { tool: 'applyApprovedChapterRevision', risk_level: 'L3', what_happened: '预览基于旧版本，已阻止覆盖更新内容。', what_did_not_change: ['当前正式版本未改变。'], next_action: '重新生成最新预览', preview }); }
    if (!this.documentGenerationService?.applyRegeneration) return actionResult('FAILED', { tool: 'applyApprovedChapterRevision', risk_level: 'L3', what_happened: '当前正式服务不支持应用该预览。', next_action: '使用现有版本操作' });
    const target = previewTarget(preview);
    const prepared = previewValue(preview, 'preview', {}) || {};
    const version = await this.documentGenerationService.applyRegeneration(prepared, preview.before_version_id || target.version_id || prepared.before_version_id, target.chapter_id || prepared.chapter_id);
    await this.updatePreview(preview.preview_id, { status: 'applied', applied_at: new Date().toISOString() });
    const current = await this.repository?.getPipelineDocumentVersion?.(version.id);
    return actionResult('EXECUTED', { tool: 'applyApprovedChapterRevision', risk_level: 'L3', what_happened: '章节修订已通过正式服务应用并生成新版本。', what_changed: ['仅更新目标章节。'], what_did_not_change: ['其他章节保持原版本。'], next_action: '查看新版本并继续人工复核', target: { project_id: context.project_id, version_id: version.id, chapter_id: target.chapter_id || prepared.chapter_id }, after_version: current || version, validation_result: previewValue(preview, 'validation_result', {}) || {} });
  }

  async refreshGenerationStatus(context, args = {}) {
    const auth = this.authorize(context, 'refreshGenerationStatus', args);
    if (!auth.allowed) return actionResult('BLOCKED', { tool: 'refreshGenerationStatus', risk_level: auth.policy.level, what_happened: '生成状态未刷新。', next_action: auth.reason_code });
    const result = await this.tools?.execute?.('getGenerationStatus', context, args);
    return actionResult('EXECUTED', { tool: 'refreshGenerationStatus', risk_level: auth.policy.level, what_happened: '已刷新生成任务状态。', next_action: '查看任务结果', validation_result: result?.data || null });
  }

  async savePreview(context, actionType, idempotencyKey, target, preview, validation) {
    const value = { preview_id: randomUUID(), agent_run_id: context.agent_run_id || null, project_id: context.project_id, action_type: actionType, idempotency_key: idempotencyKey, target, before_version_id: target.version_id || null, before_version_hash: preview.before_version_hash || null, preview, validation_result: validation, status: 'preview_ready' };
    if (this.repository?.createAgentActionPreview) return this.repository.createAgentActionPreview(value);
    this.localPreviews.set(value.preview_id, value); return value;
  }

  async loadPreview(previewId) { return this.repository?.getAgentActionPreview ? this.repository.getAgentActionPreview(previewId) : this.localPreviews.get(previewId) || null; }
  async updatePreview(previewId, data) { if (this.repository?.updateAgentActionPreview) return this.repository.updateAgentActionPreview(previewId, data); const current = this.localPreviews.get(previewId); if (current) Object.assign(current, data); return current; }
  async isStale(preview) {
    const target = previewTarget(preview);
    const prepared = previewValue(preview, 'preview', {}) || {};
    const versionId = preview.before_version_id || target.version_id || prepared.before_version_id;
    if (!versionId || !this.repository?.getPipelineDocumentVersion) return false;
    const version = await this.repository.getPipelineDocumentVersion(versionId);
    if (!version) return true;
    const currentHash = sha(version.final_text || version.content_markdown || '');
    return Boolean(preview.before_version_hash && currentHash !== preview.before_version_hash);
  }
}

export { lineDiff };
