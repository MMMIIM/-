import { AppError } from './errors.js';

export const PROJECT_ACTIONS = Object.freeze(['READ', 'WRITE', 'MANAGE']);
export const PROJECT_ROLES = Object.freeze(['OWNER', 'EDITOR', 'VIEWER']);
export const PROJECT_MEMBERSHIP_STATUSES = Object.freeze(['ACTIVE', 'REVOKED']);

const POLICY = Object.freeze({
  OWNER: new Set(['READ', 'WRITE', 'MANAGE']),
  EDITOR: new Set(['READ', 'WRITE']),
  VIEWER: new Set(['READ'])
});

const TRUSTED_SOURCES = new Set(['server_config', 'authenticated', 'trusted_context', 'maintenance_cli', 'test', 'integration']);

export class ProjectAuthorizationService {
  constructor({ repository }) {
    this.repository = repository;
  }

  assertTrustedActor(actor) {
    if (!actor || typeof actor !== 'object' || Array.isArray(actor)) {
      throw new AppError('TRUSTED_ACTOR_REQUIRED', '当前操作需要可信身份。', 401);
    }
    const actorId = String(actor.actor_id || '').trim();
    const source = String(actor.source || '').trim();
    if (!actorId || actorId === 'current_user' || !source || !TRUSTED_SOURCES.has(source)) {
      throw new AppError('TRUSTED_ACTOR_REQUIRED', '当前操作需要可信身份。', 401);
    }
    return { actor_id: actorId, actor_type: String(actor.actor_type || 'server'), source };
  }

  async assertProjectAccess({ actor, projectId, action = 'READ' }) {
    const trusted = this.assertTrustedActor(actor);
    const normalizedAction = String(action || '').trim().toUpperCase();
    if (!PROJECT_ACTIONS.includes(normalizedAction)) {
      throw new AppError('PROJECT_ACTION_INVALID', '项目操作权限无效。', 403);
    }
    const membership = await this.repository.getProjectMembership({ projectId, actorId: trusted.actor_id });
    if (!membership || membership.status !== 'ACTIVE' || !PROJECT_ROLES.includes(membership.role)) {
      throw new AppError('PROJECT_ACCESS_DENIED', '当前身份无权访问该项目。', 403);
    }
    if (!POLICY[membership.role].has(normalizedAction)) {
      throw new AppError('PROJECT_ACCESS_DENIED', '当前身份无权执行该项目操作。', 403);
    }
    return { actor: trusted, membership, action: normalizedAction };
  }

  async grantOwner({ projectId, actor, grantedBy }) {
    const target = this.assertTrustedActor(actor);
    const grantor = this.assertTrustedActor(grantedBy);
    const project = await this.repository.getProject(projectId);
    if (!project) throw new AppError('PROJECT_NOT_FOUND', '项目不存在。', 404);
    return this.repository.upsertProjectMembership({
      projectId,
      actorId: target.actor_id,
      role: 'OWNER',
      status: 'ACTIVE',
      createdBy: grantor.actor_id
    });
  }
}
