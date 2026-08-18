export const MANDATORY_MARKERS = Object.freeze(['★']);
const MANDATORY_SCOPE_PHRASES = Object.freeze([
  { prefix: '以下除', suffix: '外', assertion: '均为实质性要求' }
]);

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

function scopeRuleFromText(sourceText, sourceSection, sourcePage = null, sourceParagraph = null) {
  const text = String(sourceText || '').trim();
  const matched = MANDATORY_SCOPE_PHRASES.some((rule) => (
    text.includes(rule.prefix) && text.includes(rule.suffix) && text.includes(rule.assertion)
  ));
  if (!matched) return null;
  const exceptionClauseIds = [...text.matchAll(/\d+(?:\.\d+)+/g)].map((match) => match[0]);
  if (!exceptionClauseIds.length) return null;
  return {
    mandatory_scope_source_text: text,
    mandatory_scope_section: sourceSection,
    exception_clause_ids: [...new Set(exceptionClauseIds)],
    source_page: sourcePage,
    source_paragraph: sourceParagraph
  };
}

export function detectMandatoryScopeRules(section) {
  if (!section || !Array.isArray(section.paragraphs)) return [];
  return section.paragraphs.flatMap((paragraph) => {
    const rule = scopeRuleFromText(
      paragraph.text,
      paragraph.source_section || section.title,
      paragraph.page ?? null,
      paragraph.paragraph ?? null
    );
    return rule ? [rule] : [];
  });
}

export function enrichMandatoryRequirement(requirement, { sourceText, scopeRules = [] } = {}) {
  const normalizedSourceText = String(
    sourceText ?? requirement?.source_text ?? requirement?.source_excerpt ?? ''
  ).trim();
  if (!normalizedSourceText) {
    throw ruleError('REQUIREMENT_SOURCE_TEXT_REQUIRED', 'Requirement 缺少完整原始来源条款。');
  }
  const direct = detectMandatoryRequirement(normalizedSourceText);
  const scope = scopeRules.find((rule) => rule.mandatory_scope_section === requirement.source_section) || null;
  const excludedByScope = scope?.exception_clause_ids?.includes(requirement.source_clause_id) || false;
  const scopedMandatory = Boolean(scope) && !excludedByScope;
  return {
    ...requirement,
    source_text: normalizedSourceText,
    is_mandatory: direct.is_mandatory || scopedMandatory,
    mandatory_marker: direct.mandatory_marker,
    mandatory_scope_source_text: scope?.mandatory_scope_source_text ?? null,
    mandatory_scope_section: scope?.mandatory_scope_section ?? null,
    exception_clause_ids: scope?.exception_clause_ids ? [...scope.exception_clause_ids] : []
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
  if (!Array.isArray(requirement.exception_clause_ids)) {
    throw ruleError('REQUIREMENT_MANDATORY_METADATA_INVALID', 'Requirement exception_clause_ids 格式无效。');
  }
  const detected = detectMandatoryRequirement(sourceText);
  const scope = requirement.mandatory_scope_source_text && requirement.mandatory_scope_section
    ? scopeRuleFromText(
      requirement.mandatory_scope_source_text,
      requirement.mandatory_scope_section
    )
    : null;
  const sameExceptions = scope
    && JSON.stringify(scope.exception_clause_ids) === JSON.stringify(requirement.exception_clause_ids);
  const scopedMandatory = Boolean(scope)
    && sameExceptions
    && requirement.source_section === scope.mandatory_scope_section
    && !scope.exception_clause_ids.includes(requirement.source_clause_id);
  if (requirement.is_mandatory !== (detected.is_mandatory || scopedMandatory)
    || requirement.mandatory_marker !== detected.mandatory_marker
    || (Boolean(requirement.mandatory_scope_source_text) !== Boolean(scope))
    || (scope && !sameExceptions)) {
    throw ruleError(
      'REQUIREMENT_MANDATORY_METADATA_CONFLICT',
      'Requirement mandatory 信息与原始来源条款矛盾。'
    );
  }
  return requirement;
}
