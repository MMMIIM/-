import { AppError } from '../errors.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function safeText(value, fallback = null, max = 240) {
  if (value === undefined || value === null) return fallback;
  const text = String(value).replace(/[\u0000-\u001f\u007f]/g, ' ').trim();
  return text ? text.slice(0, max) : fallback;
}

function optionalId(value, field) {
  if (value === undefined || value === null || value === '') return null;
  const normalized = safeText(value, null, 120);
  if (!normalized) throw new AppError('INVALID_AGENT_CONTEXT', `${field} 无效。`, 400);
  return normalized;
}

export class AgentContextResolver {
  constructor({ repository, stageResolver } = {}) {
    this.repository = repository;
    this.stageResolver = stageResolver;
  }

  async resolve(input = {}) {
    const projectId = safeText(input.project_id || input.projectId, null, 80);
    if (!UUID.test(projectId || '')) throw new AppError('INVALID_AGENT_CONTEXT', '请从一个有效的项目工作区发起 Copilot 请求。', 400);
    const project = await this.repository?.getProject?.(projectId);
    if (!project) throw new AppError('PROJECT_NOT_FOUND', '项目不存在或已被移除。', 404);
    const projectStage = this.stageResolver
      ? await this.stageResolver(project, input)
      : safeText(input.project_stage, null, 80) || safeText(project.status, null, 80) || 'project_workspace';
    const context = {
      user_id: safeText(input.user_id || input.userId, 'current_user', 120),
      project_id: projectId,
      project_stage: projectStage,
      current_route: safeText(input.current_route || input.currentRoute, `/projects/${projectId}`, 240),
      material_id: optionalId(input.material_id || input.materialId, 'material_id'),
      requirement_id: optionalId(input.requirement_id || input.requirementId, 'requirement_id'),
      chapter_id: optionalId(input.chapter_id || input.chapterId, 'chapter_id'),
      document_version_id: optionalId(input.document_version_id || input.documentVersionId, 'document_version_id'),
      conversation_id: optionalId(input.conversation_id || input.conversationId, 'conversation_id'),
      task_context: safeText(input.task_context || input.taskContext, null, 500)
    };
    return { ...context, project: { id: project.id, name: project.name, status: project.status, current_version: project.current_version || null } };
  }
}

export function isValidAgentProjectId(value) {
  return UUID.test(String(value || ''));
}
