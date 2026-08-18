import { routeRequirement } from './chapter-router.js';

function ruleError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

export function assertRequirementIdsUnchanged(baseline, candidate) {
  const expected = baseline.map((requirement) => requirement.req_id);
  const actual = candidate.map((requirement) => requirement.req_id);
  if (expected.length !== actual.length || expected.some((reqId, index) => reqId !== actual[index])) {
    throw ruleError('REQUIREMENT_ID_MUTATED', 'REQ-ID 不得增删、修改、合并或重排。');
  }
}

export function canonicalizeRequirements(rawRequirements, router = routeRequirement) {
  if (!Array.isArray(rawRequirements) || rawRequirements.length === 0) {
    throw ruleError('REQUIREMENTS_REQUIRED', '至少需要一条 Requirement。');
  }

  const seen = new Set();
  return rawRequirements.map((raw) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      throw ruleError('REQUIREMENT_INVALID', 'Requirement 必须是对象。');
    }
    const reqId = raw.req_id;
    if (typeof reqId !== 'string' || !reqId.trim() || reqId !== reqId.trim()) {
      throw ruleError('REQUIREMENT_ID_INVALID', 'REQ-ID 必须是非空且无首尾空格的字符串。');
    }
    if (seen.has(reqId)) throw ruleError('REQUIREMENT_ID_DUPLICATED', `REQ-ID 重复：${reqId}`);
    seen.add(reqId);

    const text = typeof raw.text === 'string' ? raw.text.trim() : '';
    if (!text) throw ruleError('REQUIREMENT_TEXT_INVALID', `${reqId} 缺少有效需求正文。`);
    const targetSections = router({ req_id: reqId, text });
    if (!Array.isArray(targetSections) || targetSections.length === 0) {
      throw ruleError('REQUIREMENT_ROUTE_FAILED', `${reqId} 未路由到后端章节。`);
    }

    return {
      req_id: reqId,
      text,
      source_ref: typeof raw.source_ref === 'string' ? raw.source_ref.trim() || null : null,
      target_sections: [...new Set(targetSections)]
    };
  });
}
