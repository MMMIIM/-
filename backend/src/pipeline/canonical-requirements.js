import { routeRequirement } from './chapter-router.js';
import {
  assertMandatoryRequirementMetadata,
  enrichMandatoryRequirement
} from './mandatory-requirement.js';

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
  baseline.forEach((requirement, index) => {
    assertMandatoryRequirementMetadata(requirement);
    assertMandatoryRequirementMetadata(candidate[index]);
    if (requirement.source_text !== candidate[index].source_text
      || requirement.is_mandatory !== candidate[index].is_mandatory
      || requirement.mandatory_marker !== candidate[index].mandatory_marker) {
      throw ruleError('REQUIREMENT_MANDATORY_METADATA_MUTATED', 'Requirement mandatory 元数据不得修改。');
    }
  });
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

    const sourceText = typeof raw.source_text === 'string' && raw.source_text.trim()
      ? raw.source_text.trim()
      : typeof raw.source_excerpt === 'string' && raw.source_excerpt.trim()
        ? raw.source_excerpt.trim()
        : text;
    const hasProvidedMetadata = Object.hasOwn(raw, 'is_mandatory')
      || Object.hasOwn(raw, 'mandatory_marker');
    const mandatoryRequirement = hasProvidedMetadata
      ? { source_text: sourceText, is_mandatory: raw.is_mandatory, mandatory_marker: raw.mandatory_marker }
      : enrichMandatoryRequirement({}, { sourceText });
    assertMandatoryRequirementMetadata(mandatoryRequirement);

    return {
      req_id: reqId,
      text,
      source_ref: typeof raw.source_ref === 'string' ? raw.source_ref.trim() || null : null,
      source_text: mandatoryRequirement.source_text,
      is_mandatory: mandatoryRequirement.is_mandatory,
      mandatory_marker: mandatoryRequirement.mandatory_marker,
      target_sections: [...new Set(targetSections)]
    };
  });
}
