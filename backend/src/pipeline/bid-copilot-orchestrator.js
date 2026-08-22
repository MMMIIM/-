import { randomUUID } from 'node:crypto';
import { AppError } from '../errors.js';

const sanitizeRequest = (value) => String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 1000);

export function classifyCopilotIntent(message) {
  const text = String(message || '').trim();
  if (/自动批准|批准|确认.*正式|绕过.*Claim\s*Gate|绕过.*内容风险/i.test(text)) return text.includes('绕过') ? 'formal_claim_gate_bypass' : 'formal_decision_request';
  if (/为什么.*不能生成|不能生成|无法生成|生成.*阻塞/.test(text)) return 'generation_blockers';
  if (/什么材料|哪些材料|证明|支撑/.test(text)) return 'requirement_materials';
  if (/打开|进入|跳转/.test(text)) return 'navigate';
  if (/缺什么|还缺|下一步|先做什么|待处理/.test(text)) return 'project_next_steps';
  return 'project_next_steps';
}

function baseResponse(context, audit) {
  return { status: 'SUCCESS', summary: '', tasks: [], actions: [], sources: [], blockers: [], context: { project_id: context.project_id, current_route: context.current_route, requirement_id: context.requirement_id || null }, audit };
}

export class BidCopilotOrchestrator {
  constructor({ contextResolver, tools, auditRepository, clock = () => Date.now() } = {}) {
    this.contextResolver = contextResolver;
    this.tools = tools;
    this.auditRepository = auditRepository;
    this.clock = clock;
  }

  async audit(value) {
    if (!this.auditRepository?.createAgentExecutionAudit) return null;
    try { return await this.auditRepository.createAgentExecutionAudit(value); } catch (_error) { return null; }
  }

  async run(input = {}) {
    const started = this.clock();
    const message = sanitizeRequest(input.message);
    if (!message) throw new AppError('AGENT_REQUEST_INVALID', '请告诉我你想了解什么。', 400);
    if (input.context?.project_id && input.project_id && input.context.project_id !== input.project_id) throw new AppError('AGENT_CONTEXT_MISMATCH', '当前请求的项目上下文不一致，请从项目工作区重新发起。', 400);
    const context = await this.contextResolver.resolve({ ...(input.context || {}), project_id: input.context?.project_id || input.project_id, user_id: input.user_id || input.context?.user_id });
    const agentRunId = randomUUID();
    const intent = classifyCopilotIntent(message);
    const audit = { agent_run_id: agentRunId, user_id: context.user_id, project_id: context.project_id, current_route: context.current_route, user_request: message, intent, selected_tools: [], tool_results: [], actions_proposed: [], actions_executed: [], human_required_actions: [], status: 'running', created_at: new Date().toISOString() };
    const response = baseResponse(context, { agent_run_id: agentRunId, intent });
    const call = async (tool, args = {}) => { audit.selected_tools.push(tool); const result = await this.tools.execute(tool, context, args); audit.tool_results.push({ tool, status: result.status, reason_code: result.reason_code }); return result; };

    if (intent === 'formal_claim_gate_bypass' || intent === 'formal_decision_request') {
      response.status = intent === 'formal_claim_gate_bypass' ? 'BLOCKED' : 'REQUIRES_HUMAN_DECISION';
      response.summary = intent === 'formal_claim_gate_bypass' ? '内容风险检查不能被绕过。' : '正式确认需要由你在对应工作区完成。';
      response.blockers.push({ title: '需要人工确认', reason: intent === 'formal_claim_gate_bypass' ? '内容风险检查是正式流程的一部分，Copilot不会代替确认。' : '正式确认会改变项目控制状态，Copilot只能引导你进入确认页面。', impact: '在人工确认前，正式状态不会改变。', action: '打开审核中心', navigation: { route: 'review-center' } });
      audit.human_required_actions.push('formal_decision');
    } else if (intent === 'generation_blockers') {
      const readiness = await call('getGenerationReadiness');
      const blockers = readiness.data?.generation_readiness?.blocker_count || 0;
      response.summary = blockers ? `当前还有 ${blockers} 项待处理，暂不适合生成。` : '当前正式状态未发现生成前阻塞项。';
      response.blockers = (readiness.data?.gaps || []).slice(0, 12).map((item) => ({ title: item.requirement_id, reason: item.gap_reason, impact: item.is_mandatory ? '这是必需项，处理前不能进入正式生成。' : '处理后可提升材料准备度。', action: '查看材料准备度', navigation: { route: 'evidence-readiness', requirement_id: item.requirement_id } }));
      response.status = readiness.status === 'ERROR' ? 'ERROR' : 'SUCCESS'; response.sources = readiness.source_refs || [];
    } else if (intent === 'requirement_materials') {
      if (!context.requirement_id) { response.status = 'NO_RESULT'; response.summary = '请先打开一个具体需求，我再帮你查找可用材料。'; response.actions.push({ label: '查看需求与材料准备度', navigation: { route: 'evidence-readiness' } }); }
      else {
        const [materials, candidates] = await Promise.all([call('findRelevantMaterials', { requirement_id: context.requirement_id }), call('getEvidenceCandidates', { requirement_id: context.requirement_id })]);
        response.status = materials.status === 'ERROR' || candidates.status === 'ERROR' ? 'ERROR' : (materials.status === 'NO_RESULT' && candidates.status === 'NO_RESULT' ? 'NO_RESULT' : 'SUCCESS');
        response.summary = materials.data?.candidates?.length ? '找到了可供确认的材料候选；它们还不是正式证明。' : '当前没有找到可直接证明该需求的材料。';
        response.sources = [...(materials.source_refs || []), ...(candidates.source_refs || [])];
        response.tasks = (materials.data?.candidates || []).map((item) => ({ title: item.material_name || '企业材料', reason: '与当前需求存在检索关联。', impact: item.confirmed ? '已完成确认。' : '仍需人工确认后才能作为正式依据。', action: item.confirmed ? '查看已确认材料' : '进入证据确认', candidate_only: !item.confirmed, source: item.source_location || item.source_page || null }));
      }
    } else if (intent === 'navigate') {
      const route = /材料|证据/.test(message) ? 'evidence-readiness' : /生成|标书/.test(message) ? 'generation' : 'workspace';
      const result = await call('navigateTo', { route }); response.actions = result.data?.action ? [{ label: '打开相关工作区', ...result.data.action }] : []; response.summary = '可以从这里继续处理项目。';
    } else {
      const [status, readiness, pending, gaps] = await Promise.all([call('getProjectStatus'), call('getGenerationReadiness'), call('getPendingActions'), call('getMaterialGaps')]);
      response.summary = pending.data?.actions?.length ? `项目当前有 ${pending.data.actions.length} 项待处理，建议先处理优先级最高的事项。` : '当前项目没有发现需要立即处理的事项。';
      response.tasks = (pending.data?.actions || []).slice(0, 8); response.sources = [...(status.source_refs || []), ...(readiness.source_refs || []), ...(gaps.source_refs || [])]; response.blockers = (readiness.data?.gaps || []).slice(0, 8).map((item) => ({ title: item.requirement_id, reason: item.gap_reason, impact: item.is_mandatory ? '必需项未处理会影响正式生成。' : '处理后可提升准备度。', action: '查看材料准备度', navigation: { route: 'evidence-readiness', requirement_id: item.requirement_id } }));
    }
    audit.status = response.status; audit.latency_ms = Math.max(0, this.clock() - started); response.audit = { agent_run_id: agentRunId, intent, latency_ms: audit.latency_ms };
    await this.audit({ ...audit, context_json: { user_id: context.user_id, project_id: context.project_id, project_stage: context.project_stage, current_route: context.current_route, material_id: context.material_id, requirement_id: context.requirement_id, chapter_id: context.chapter_id, document_version_id: context.document_version_id }, provider: null, model: null });
    return response;
  }
}
