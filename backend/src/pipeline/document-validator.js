import { assertRequirementIdsUnchanged } from './canonical-requirements.js';
import { classifySentence } from './document-sanitizer.js';
import { buildTraceabilityMatrix } from './traceability-service.js';

function sentences(text) {
  return String(text || '').split(/(?<=[。！？!?；;])|\n+/).map((item) => item.trim()).filter(Boolean);
}

export function validateDocument({ baselineRequirements, requirements, sections = [], claimGate, phase = 'final' }) {
  const errors = [];
  const warnings = [];

  try {
    assertRequirementIdsUnchanged(baselineRequirements, requirements);
  } catch (error) {
    errors.push({ code: error.code || 'REQUIREMENT_ID_MUTATED', message: error.message });
  }

  const ids = requirements.map((requirement) => requirement.req_id);
  if (new Set(ids).size !== ids.length) errors.push({ code: 'REQUIREMENT_ID_DUPLICATED', message: 'REQ-ID 必须唯一。' });
  if (requirements.some((requirement) => !Array.isArray(requirement.target_sections) || !requirement.target_sections.length)) {
    errors.push({ code: 'REQUIREMENT_ROUTE_MISSING', message: '所有 Requirement 必须由后端路由到章节。' });
  }

  if (phase === 'preflight') {
    return { valid: errors.length === 0, risk_status: errors.length ? 'critical' : 'pass', errors, warnings, coverage: null };
  }

  if (!Array.isArray(sections) || sections.length === 0) {
    errors.push({ code: 'DOCUMENT_EMPTY', message: '正文不得为空。' });
  }
  const knownIds = new Set(ids);
  for (const section of sections) {
    if (typeof section.final_text !== 'string' || !section.final_text.trim()) {
      errors.push({ code: 'SECTION_FINAL_TEXT_EMPTY', message: `${section.id || 'unknown'} 缺少 final_text。` });
      continue;
    }
    if (/\bREQ-[A-Z0-9_-]+\b/i.test(section.final_text) || section.final_text.includes('来源未定位')) {
      errors.push({ code: 'INTERNAL_REQUIREMENT_METADATA_EXPOSED', message: `${section.id || 'unknown'} 的正文包含内部需求标识或来源状态。` });
    }
    const sectionRequirementIds = Array.isArray(section.requirement_ids) ? section.requirement_ids : [];
    if (!Array.isArray(section.requirement_ids)) {
      errors.push({ code: 'SECTION_REQUIREMENT_IDS_INVALID', message: `${section.id || 'unknown'} 缺少 requirement_ids。` });
    }
    const unknownIds = sectionRequirementIds.filter((reqId) => !knownIds.has(reqId));
    if (unknownIds.length) {
      errors.push({ code: 'UNKNOWN_REQUIREMENT_REFERENCE', message: `章节引用未知 REQ-ID：${unknownIds.join('、')}` });
    }
    const misroutedIds = sectionRequirementIds.filter((reqId) => {
      const requirement = requirements.find((item) => item.req_id === reqId);
      return requirement && !requirement.target_sections.includes(section.id);
    });
    if (misroutedIds.length) {
      errors.push({ code: 'REQUIREMENT_SECTION_MISMATCH', message: `章节不在后端路由范围：${misroutedIds.join('、')}` });
    }
    for (const sentence of sentences(section.final_text)) {
      const violation = classifySentence(sentence, claimGate);
      if (violation.action === 'delete') {
        errors.push({ code: violation.code, message: `${section.id} 的 final_text 仍包含违规声明。` });
      }
    }
    for (const event of section.sanitization_events || []) {
      warnings.push({ code: event.code, message: `${section.id} 已安全删除一条违规完整句。` });
    }
    if (section.requiresManualOrLlmRevision) {
      warnings.push({ code: 'MANUAL_REVISION_REQUIRED', message: `${section.id} 存在需要人工或 LLM 复核的语义问题。` });
    }
  }

  const traceability = buildTraceabilityMatrix(requirements, sections);
  const uncovered = traceability.filter((item) => item.status === 'uncovered').map((item) => item.req_id);
  const uncoveredMandatory = traceability
    .filter((item) => item.status === 'uncovered' && item.is_mandatory)
    .map((item) => item.req_id);
  if (uncovered.length) {
    errors.push({ code: 'REQUIREMENT_COVERAGE_INSUFFICIENT', message: `以下 REQ-ID 未覆盖：${uncovered.join('、')}` });
  }
  if (uncoveredMandatory.length) {
    errors.push({
      code: 'MANDATORY_REQUIREMENT_COVERAGE_INSUFFICIENT',
      message: `以下实质性要求未覆盖：${uncoveredMandatory.join('、')}`
    });
  }
  const coverage = requirements.length
    ? (requirements.length - uncovered.length) / requirements.length
    : 0;
  const riskStatus = errors.length ? 'critical' : warnings.length ? 'warning' : 'pass';
  return { valid: errors.length === 0, risk_status: riskStatus, errors, warnings, coverage, traceability };
}
