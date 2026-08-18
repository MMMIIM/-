export const MANDATORY_MARKERS = Object.freeze(['★']);

function ruleError(code, message) {
  return Object.assign(new Error(message), { code });
}

export function detectMandatoryRequirement(sourceText) {
  const text = typeof sourceText === 'string' ? sourceText : '';
  const marker = MANDATORY_MARKERS.find((candidate) => text.includes(candidate)) || null;
  return Object.freeze({
    is_mandatory: Boolean(marker),
    mandatory_marker: marker
  });
}

export function enrichMandatoryRequirement(requirement, { sourceText } = {}) {
  const normalizedSourceText = String(
    sourceText ?? requirement?.source_text ?? requirement?.source_excerpt ?? ''
  ).trim();
  if (!normalizedSourceText) {
    throw ruleError('REQUIREMENT_SOURCE_TEXT_REQUIRED', 'Requirement 缺少完整原始来源条款。');
  }
  return {
    ...requirement,
    source_text: normalizedSourceText,
    ...detectMandatoryRequirement(normalizedSourceText)
  };
}

export function assertMandatoryRequirementMetadata(requirement) {
  const sourceText = typeof requirement?.source_text === 'string'
    ? requirement.source_text.trim()
    : '';
  if (!sourceText) {
    throw ruleError('REQUIREMENT_MANDATORY_METADATA_INVALID', 'Requirement 缺少 source_text。');
  }
  if (typeof requirement.is_mandatory !== 'boolean') {
    throw ruleError('REQUIREMENT_MANDATORY_METADATA_INVALID', 'Requirement 缺少 is_mandatory。');
  }
  if (requirement.mandatory_marker !== null
    && (typeof requirement.mandatory_marker !== 'string' || !requirement.mandatory_marker)) {
    throw ruleError('REQUIREMENT_MANDATORY_METADATA_INVALID', 'Requirement mandatory_marker 格式无效。');
  }
  const detected = detectMandatoryRequirement(sourceText);
  if (requirement.is_mandatory !== detected.is_mandatory
    || requirement.mandatory_marker !== detected.mandatory_marker) {
    throw ruleError(
      'REQUIREMENT_MANDATORY_METADATA_CONFLICT',
      'Requirement mandatory 信息与原始来源条款矛盾。'
    );
  }
  return requirement;
}
