import { AppError } from './errors.js';

/**
 * Development/test adapter.  The value is supplied by server configuration,
 * never by an HTTP request body.  A real authenticated adapter can replace it
 * without changing route/service contracts.
 */
export function createServerActorResolver({ actorId, actorType = 'development' } = {}) {
  const normalized = String(actorId || '').trim();
  return () => normalized
    ? { actor_id: normalized, actor_type: actorType, source: 'server_config' }
    : null;
}

export function requireTrustedActor(actorResolver, req) {
  const resolved = typeof actorResolver === 'function'
    ? actorResolver(req)
    : actorResolver?.resolve?.(req);
  if (resolved && typeof resolved.then === 'function') {
    throw new AppError('ACTOR_RESOLVER_INVALID', '审核人身份解析器必须同步返回可信身份。', 500);
  }
  const actorId = typeof resolved === 'string' ? resolved : resolved?.actor_id;
  if (!String(actorId || '').trim()) {
    throw new AppError('AUTHENTICATED_ACTOR_REQUIRED', '当前操作需要已配置的审核人身份。', 401);
  }
  return {
    actor_id: String(actorId).trim(),
    actor_type: typeof resolved === 'object' ? resolved.actor_type || 'server' : 'server',
    source: typeof resolved === 'object' ? resolved.source || 'trusted_context' : 'trusted_context'
  };
}

/** Domain services must receive an explicit actor from their owning boundary. */
export function requireFormalActorId(value) {
  const actorId = typeof value === 'object' ? value?.actor_id : value;
  const normalized = String(actorId || '').trim();
  if (!normalized || normalized === 'current_user') {
    throw new AppError('AUTHENTICATED_ACTOR_REQUIRED', '当前操作需要已配置的审核人身份。', 401);
  }
  return normalized;
}

export function withTrustedActor(body = {}, actor, field = 'reviewer') {
  const next = { ...(body || {}) };
  delete next.reviewer;
  delete next.editor;
  delete next.decided_by;
  delete next.reviewed_by;
  delete next.confirmed_by;
  delete next.created_by;
  delete next.approved_by;
  delete next.rejected_by;
  delete next.invalidated_by;
  delete next.edited_by;
  next[field] = actor.actor_id;
  return next;
}
