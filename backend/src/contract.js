import { AppError, ERROR_MESSAGES } from './errors.js';

const RISK_LEVELS = new Set(['pass', 'warning', 'critical']);

function invalid(reason) {
  throw new AppError('CONTRACT_INVALID', ERROR_MESSAGES.CONTRACT_INVALID, 502, reason);
}

function attachResponsePayloadAudit(error, rawValue) {
  if (!(error instanceof AppError) || error.code !== 'CONTRACT_INVALID') return;

  error.audit = { ...(error.audit || {}), responsePayloadMissing: rawValue === undefined };
  if (rawValue === undefined) return;

  if (typeof rawValue === 'string') {
    try {
      error.audit.responsePayloadJson = JSON.parse(rawValue);
    } catch (_parseError) {
      error.audit.rawResponseText = rawValue;
    }
    return;
  }

  try {
    JSON.stringify(rawValue);
    error.audit.responsePayloadJson = rawValue;
  } catch (_serializationError) {
    error.audit.rawResponseText = String(rawValue);
  }
}

export function parseResponsePayload(rawValue) {
  let value = rawValue;

  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch (_error) {
      invalid('response_payload_json is not valid JSON');
    }
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid('payload must be an object');
  if (!value.document || typeof value.document !== 'object' || Array.isArray(value.document)) {
    invalid('document must be an object');
  }

  const markdown = value.document.markdown;
  if (typeof markdown !== 'string' || !markdown.trim()) invalid('document.markdown is required');

  const title = value.document.title;
  if (title !== undefined && (typeof title !== 'string' || !title.trim())) invalid('document.title is invalid');

  const sections = value.document.sections ?? [];
  if (!Array.isArray(sections) || sections.some((section) => (
    !section || typeof section !== 'object' || typeof section.title !== 'string' || !section.title.trim()
  ))) invalid('document.sections is invalid');

  const warnings = value.warnings ?? [];
  if (!Array.isArray(warnings) || warnings.some((warning) => (
    !warning || typeof warning !== 'object'
    || !['warning', 'critical'].includes(warning.level)
    || typeof warning.message !== 'string' || !warning.message.trim()
  ))) invalid('warnings is invalid');

  if (!RISK_LEVELS.has(value.risk_status)) invalid('risk_status is invalid');

  return {
    raw: value,
    title: title?.trim() || 'AI 标书技术响应',
    markdown,
    sections: sections.map((section, index) => ({
      id: String(section.id || `section-${index + 1}`),
      title: section.title.trim()
    })),
    warnings: warnings.map((warning) => ({
      level: warning.level,
      code: typeof warning.code === 'string' ? warning.code : undefined,
      message: warning.message.trim()
    })),
    riskStatus: value.risk_status
  };
}

export function extractResponsePayload(difyPayload) {
  // The v4.2 contract is intentionally strict: only the published nested
  // envelope is trusted.  Do not add compatibility fallbacks here; doing so
  // would allow an unowned provider field to become formal document state.
  const rawValue = difyPayload?.data?.outputs?.response_payload_json;
  try {
    if (rawValue === undefined) invalid('output is missing');
    return parseResponsePayload(rawValue);
  } catch (error) {
    attachResponsePayloadAudit(error, rawValue);
    throw error;
  }
}

export function assertVersionCanBeConfirmed(version, confirmationText) {
  if (version.risk_status === 'critical') {
    throw new AppError('CRITICAL_RISK', ERROR_MESSAGES.CRITICAL_RISK, 409);
  }
  if (version.risk_status === 'warning' && !String(confirmationText || '').trim()) {
    throw new AppError('WARNING_CONFIRMATION_REQUIRED', ERROR_MESSAGES.WARNING_CONFIRMATION_REQUIRED, 400);
  }
}
