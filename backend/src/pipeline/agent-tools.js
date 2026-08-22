import { AppError } from '../errors.js';
import { evaluateAgentAction } from './agent-action-policy.js';

const ROUTES = new Set(['workspace', 'evidence-readiness', 'review-center', 'materials', 'requirements', 'generation', 'document-delivery', 'bid-check']);
const unique = (items) => [...new Set((items || []).filter(Boolean))];

function toolResult(status, data = null, reason_code = null, user_message = '', source_refs = [], recommended_actions = []) {
  return { status, data, reason_code, user_message, source_refs, recommended_actions };
}

function projectRef(projectId) { return [{ type: 'project', project_id: projectId }]; }

export class AgentToolLayer {
  constructor({ repository, evidenceReadinessService, reviewCenterService, materialProcessingCenterService, enterpriseRetrievalService, documentGenerationService, productionBetaService } = {}) {
    this.repository = repository;
    this.evidenceReadinessService = evidenceReadinessService;
    this.reviewCenterService = reviewCenterService;
    this.materialProcessingCenterService = materialProcessingCenterService;
    this.enterpriseRetrievalService = enterpriseRetrievalService;
    this.documentGenerationService = documentGenerationService;
    this.productionBetaService = productionBetaService;
    this.tools = new Map([
      ['getProjectStatus', this.getProjectStatus.bind(this)], ['getGenerationReadiness', this.getGenerationReadiness.bind(this)],
      ['getPendingActions', this.getPendingActions.bind(this)], ['getProjectRequirements', this.getProjectRequirements.bind(this)],
      ['getRequirementDetail', this.getRequirementDetail.bind(this)], ['findRelevantMaterials', this.findRelevantMaterials.bind(this)],
      ['getEvidenceCandidates', this.getEvidenceCandidates.bind(this)], ['getMaterialGaps', this.getMaterialGaps.bind(this)],
      ['getReviewItems', this.getReviewItems.bind(this)], ['getProjectFactConflicts', this.getProjectFactConflicts.bind(this)],
      ['getGenerationStatus', this.getGenerationStatus.bind(this)], ['getChapterStatus', this.getChapterStatus.bind(this)],
      ['getBidCheckResults', this.getBidCheckResults.bind(this)], ['navigateTo', this.navigateTo.bind(this)]
    ]);
  }

  async project(projectId) {
    const value = await this.repository?.getProject?.(projectId);
    return value || null;
  }

  async getProjectStatus(context) {
    const project = context.project || await this.project(context.project_id);
    if (!project) return toolResult('ERROR', null, 'PROJECT_NOT_FOUND', '项目不存在。', projectRef(context.project_id));
    const versions = await this.repository?.listVersions?.(context.project_id) || [];
    return toolResult('SUCCESS', { project: { id: project.id, name: project.name, status: project.status, deadline: project.deadline, current_version: project.current_version || null }, latest_version: versions[0] ? { id: versions[0].id, version_number: versions[0].version_number, status: versions[0].status, risk_status: versions[0].risk_status } : null }, null, '已读取项目当前状态。', projectRef(context.project_id));
  }

  async getGenerationReadiness(context) {
    if (!this.evidenceReadinessService?.get) return toolResult('NO_RESULT', null, 'READINESS_UNAVAILABLE', '当前暂时无法读取生成准备度。', projectRef(context.project_id));
    const readiness = await this.evidenceReadinessService.get(context.project_id);
    return toolResult('SUCCESS', readiness, null, '已读取当前材料准备度和生成前待处理项。', projectRef(context.project_id));
  }

  async getPendingActions(context) {
    const [readiness, review, jobs, generations] = await Promise.all([
      this.evidenceReadinessService?.get?.(context.project_id), this.reviewCenterService?.get?.(context.project_id),
      this.repository?.listJobs?.(context.project_id) || [], this.repository?.listGenerations?.(context.project_id) || []
    ]);
    const actions = [];
    for (const item of readiness?.gaps || []) actions.push({ priority: item.priority === 'high' ? 'P1' : 'P2', title: '补充或确认材料', reason: item.gap_reason || '材料尚未充分支持需求。', impact: '处理后可重新计算材料准备度。', action: '查看材料准备度', navigation: { route: 'evidence-readiness', requirement_id: item.requirement_id } });
    for (const item of review?.pending || []) actions.push({ priority: 'P1', title: '完成待确认事项', reason: item.reason || '需要人工确认。', impact: '未完成前相关内容不会进入正式生成链路。', action: '进入审核中心', navigation: { route: 'review-center', item_id: item.id } });
    for (const item of [...jobs, ...generations].filter((x) => ['failed', 'running', 'queued'].includes(x.status))) actions.push({ priority: item.status === 'failed' ? 'P1' : 'P2', title: item.status === 'failed' ? '处理失败任务' : '查看进行中的任务', reason: item.error_message || `任务当前为${item.status}。`, impact: '任务状态会影响项目下一步操作。', action: '查看任务状态', navigation: { route: 'workspace' } });
    actions.sort((a, b) => a.priority.localeCompare(b.priority) || a.title.localeCompare(b.title));
    return toolResult(actions.length ? 'SUCCESS' : 'NO_RESULT', { actions: actions.slice(0, 20) }, actions.length ? null : 'NO_PENDING_ACTIONS', actions.length ? '已整理当前需要处理的事项。' : '当前没有发现待处理事项。', projectRef(context.project_id));
  }

  async getProjectRequirements(context) {
    const requirements = await this.repository?.getFormalRequirements?.(context.project_id) || [];
    return toolResult(requirements.length ? 'SUCCESS' : 'NO_RESULT', { requirements: requirements.map((item) => ({ req_id: item.req_id, text: item.text, is_mandatory: item.is_mandatory, source_status: item.source_status, requirement_category: item.requirement_category })) }, requirements.length ? null : 'NO_REQUIREMENTS', requirements.length ? '已读取项目正式需求。' : '当前项目还没有确认的正式需求。', projectRef(context.project_id));
  }

  async getRequirementDetail(context, args = {}) {
    const reqId = args.requirement_id || context.requirement_id;
    if (!reqId) return toolResult('NO_RESULT', null, 'REQUIREMENT_CONTEXT_REQUIRED', '请先打开一个具体需求，再查看可用材料。', projectRef(context.project_id));
    const requirements = await this.repository?.getFormalRequirements?.(context.project_id) || [];
    const item = requirements.find((value) => value.req_id === reqId || value.id === reqId);
    if (!item) return toolResult('NO_RESULT', null, 'REQUIREMENT_NOT_FOUND', '找不到该项目中的正式需求。', [{ type: 'requirement', requirement_id: reqId }]);
    return toolResult('SUCCESS', { requirement: { req_id: item.req_id, text: item.text, is_mandatory: item.is_mandatory, source_status: item.source_status, source_evidence: item.source_evidence || null, requirement_category: item.requirement_category } }, null, '已读取需求详情。', [{ type: 'requirement', project_id: context.project_id, requirement_id: item.req_id }]);
  }

  async findRelevantMaterials(context, args = {}) {
    const reqId = args.requirement_id || context.requirement_id;
    const requirements = await this.repository?.getFormalRequirements?.(context.project_id) || [];
    const requirement = requirements.find((item) => item.req_id === reqId || item.id === reqId);
    if (!requirement) return toolResult('NO_RESULT', null, 'REQUIREMENT_NOT_FOUND', '找不到该项目中的正式需求。', [{ type: 'requirement', requirement_id: reqId }]);
    if (!this.enterpriseRetrievalService?.retrieve) return toolResult('NO_RESULT', null, 'RETRIEVAL_UNAVAILABLE', '当前暂时无法检索企业材料。', projectRef(context.project_id));
    try {
      const retrieval = await this.enterpriseRetrievalService.retrieve(requirement.id || reqId, { material_ids: args.material_ids || undefined, top_k: args.top_k });
      const candidates = (retrieval.results || retrieval.final_candidates || []).map((item) => ({ material_id: item.material_id, material_name: item.material_name || item.original_name, source_text: item.source_text || item.content || '', source_page: item.source_page || item.page_start || null, source_location: item.source_location || null, relevance: item.score ?? item.similarity ?? null, confirmed: false, candidate_only: true }));
      return toolResult(candidates.length ? 'SUCCESS' : 'NO_RESULT', { answer_status: retrieval.answer_status || (candidates.length ? 'CANDIDATES_FOUND' : 'NO_RELEVANT_EVIDENCE'), candidates }, candidates.length ? null : 'NO_RELEVANT_EVIDENCE', candidates.length ? '找到了可供确认的企业材料候选。它们还不是正式证明。' : '当前没有找到与该需求直接相关的企业材料。', [{ type: 'requirement', project_id: context.project_id, requirement_id: requirement.req_id }, ...candidates.slice(0, 10).map((item) => ({ type: 'material_candidate', material_id: item.material_id }))]);
    } catch (error) {
      return toolResult('ERROR', null, error.code || 'RETRIEVAL_FAILED', '企业材料检索暂时失败，请稍后重试。', projectRef(context.project_id));
    }
  }

  async getEvidenceCandidates(context, args = {}) {
    const readiness = await this.evidenceReadinessService?.get?.(context.project_id);
    const reqId = args.requirement_id || context.requirement_id;
    const requirement = readiness?.requirements?.find((item) => item.requirement_id === reqId);
    if (!requirement) return toolResult('NO_RESULT', null, 'REQUIREMENT_NOT_FOUND', '找不到该项目中的需求准备度。', [{ type: 'requirement', requirement_id: reqId }]);
    const review = await this.reviewCenterService?.get?.(context.project_id);
    const candidates = (review?.evidence || []).filter((item) => item.requirement_id === reqId).map((item) => ({ ...item, confirmed: item.status === 'approved', candidate_only: item.status !== 'approved' }));
    return toolResult(candidates.length ? 'SUCCESS' : 'NO_RESULT', { readiness: requirement.readiness, candidates }, candidates.length ? null : 'NO_EVIDENCE_CANDIDATES', candidates.length ? '已读取该需求的材料候选及确认状态。' : '该需求还没有材料候选。', [{ type: 'requirement', project_id: context.project_id, requirement_id: reqId }]);
  }

  async getMaterialGaps(context) {
    const readiness = await this.evidenceReadinessService?.get?.(context.project_id);
    const gaps = readiness?.gaps || [];
    return toolResult(gaps.length ? 'SUCCESS' : 'NO_RESULT', { gaps }, gaps.length ? null : 'NO_MATERIAL_GAPS', gaps.length ? '已整理需要补充材料的需求。' : '当前没有发现材料缺口。', projectRef(context.project_id));
  }

  async getReviewItems(context) {
    const value = await this.reviewCenterService?.get?.(context.project_id);
    if (!value) return toolResult('NO_RESULT', null, 'REVIEW_CENTER_UNAVAILABLE', '当前暂时无法读取待确认事项。', projectRef(context.project_id));
    return toolResult(value.pending?.length ? 'SUCCESS' : 'NO_RESULT', value, value.pending?.length ? null : 'NO_PENDING_REVIEWS', value.pending?.length ? '已读取待确认事项。' : '当前没有待确认事项。', projectRef(context.project_id));
  }

  async getProjectFactConflicts(context) {
    const review = await this.reviewCenterService?.get?.(context.project_id);
    const conflicts = (review?.project_facts || []).filter((item) => item.status === 'conflict' || item.conflict_status === 'conflict');
    return toolResult(conflicts.length ? 'SUCCESS' : 'NO_RESULT', { conflicts }, conflicts.length ? 'PROJECT_FACT_CONFLICT' : 'NO_PROJECT_FACT_CONFLICT', conflicts.length ? '项目统一信息存在冲突，需要人工处理。' : '当前没有发现项目统一信息冲突。', projectRef(context.project_id));
  }

  async getGenerationStatus(context) {
    const [jobs, generations, documentGenerations] = await Promise.all([this.repository?.listJobs?.(context.project_id) || [], this.repository?.listGenerations?.(context.project_id) || [], this.repository?.listDocumentGenerations?.(context.project_id) || []]);
    const items = [...jobs, ...generations, ...documentGenerations].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return toolResult(items.length ? 'SUCCESS' : 'NO_RESULT', { items: items.slice(0, 20) }, items.length ? null : 'NO_GENERATION_TASKS', items.length ? '已读取生成任务状态。' : '当前还没有生成任务。', projectRef(context.project_id));
  }

  async getChapterStatus(context) {
    const generations = await this.repository?.listDocumentGenerations?.(context.project_id) || [];
    const tasks = generations.flatMap((generation) => (generation.tasks || []).map((task) => ({ ...task, generation_id: generation.id })));
    return toolResult(tasks.length ? 'SUCCESS' : 'NO_RESULT', { tasks }, tasks.length ? null : 'NO_CHAPTER_TASKS', tasks.length ? '已读取章节处理状态。' : '当前还没有章节处理任务。', projectRef(context.project_id));
  }

  async getBidCheckResults(context) {
    if (!this.productionBetaService?.get) return toolResult('NO_RESULT', null, 'BID_CHECK_UNAVAILABLE', '当前项目还没有可读取的投标检查结果。', projectRef(context.project_id));
    const value = await this.productionBetaService.get(context.project_id);
    return toolResult(value ? 'SUCCESS' : 'NO_RESULT', value, value ? null : 'NO_BID_CHECK_RESULTS', value ? '已读取投标检查结果。' : '当前还没有投标检查结果。', projectRef(context.project_id));
  }

  async navigateTo(context, args = {}) {
    const route = String(args.route || '').trim();
    if (!ROUTES.has(route)) return toolResult('ERROR', null, 'NAVIGATION_TARGET_INVALID', '暂时无法打开这个位置。', projectRef(context.project_id));
    const action = { type: 'navigate', route: `/projects/${context.project_id}/${route}`, project_id: context.project_id, requirement_id: args.requirement_id || context.requirement_id || null };
    return toolResult('SUCCESS', { action }, null, '可以打开相关工作区。', projectRef(context.project_id));
  }

  async execute(toolName, context, args = {}) {
    const handler = this.tools.get(toolName);
    if (!handler) return toolResult('ERROR', null, 'AGENT_TOOL_NOT_FOUND', '当前无法执行这个操作。');
    const policy = evaluateAgentAction(toolName, { requiresHuman: false });
    if (!policy.allowed || policy.numeric_level > 1) return toolResult(policy.numeric_level === 4 ? 'REQUIRES_HUMAN_DECISION' : 'BLOCKED', null, policy.numeric_level === 4 ? 'FORMAL_DECISION_HUMAN_REQUIRED' : 'AGENT_ACTION_PREPARE_ONLY', '这个操作需要人工确认，Copilot不会直接修改正式结果。', projectRef(context.project_id));
    try {
      return await handler(context, args);
    } catch (error) {
      return toolResult('ERROR', null, error.code || 'AGENT_TOOL_FAILED', '项目助手暂时无法完成这项查询。', projectRef(context.project_id));
    }
  }
}

export { toolResult };
