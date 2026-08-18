const SAFE_STRING_KEYS = new Set([
  'event', 'status', 'risk_status', 'level', 'code', 'error_code',
  'workflow_version', 'response_mode'
]);

function redactString(value) {
  return `[redacted:${value.length}]`;
}

export function sanitizeAuditJson(value, key = '') {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') {
    if (key === 'response_payload_json') {
      try {
        return JSON.stringify(sanitizeAuditJson(JSON.parse(value)));
      } catch (_error) {
        return redactString(value);
      }
    }
    return SAFE_STRING_KEYS.has(key) ? value : redactString(value);
  }
  if (Array.isArray(value)) return value.map((item) => sanitizeAuditJson(item));
  if (typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([childKey, childValue]) => (
      [childKey, sanitizeAuditJson(childValue, childKey)]
    )));
  }
  return value;
}

export function sanitizeAuditText(value) {
  if (value === undefined || value === null) return value;
  const text = String(value);
  return `[redacted raw text; length=${text.length}]`;
}
