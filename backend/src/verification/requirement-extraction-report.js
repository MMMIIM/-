import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const VERIFICATION_REPORT_SCHEMA_VERSION = 'requirement-extraction-verification-report-v1';

const moduleDirectory = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_REQUIREMENT_EXTRACTION_REPORT_PATH = resolve(
  moduleDirectory,
  '../../eval/reports/requirement-extraction-verification-latest.json'
);

// These fields are never allowed to cross the verification-report boundary.
// Safe structural metadata such as `keys` and `text_type` is deliberately kept
// because it is useful for diagnosis without exposing document content.
const FORBIDDEN_KEYS = new Set([
  'api_key',
  'authorization',
  'chunk_text',
  'tender_source_body',
  'candidate_text',
  'candidate_source_text',
  'text',
  'source_text',
  'model_content',
  'parsed_json',
  'raw_model_output',
  'raw_response_payload_json',
  'prompt',
  'task_instruction',
  'task_payload_json'
]);

function isForbiddenKey(key) {
  const normalized = String(key || '').toLowerCase();
  return FORBIDDEN_KEYS.has(normalized)
    || normalized.includes('authorization')
    || normalized.endsWith('_api_key')
    || normalized.includes('secret');
}

/**
 * Sanitize an evaluation report recursively. Forbidden properties are omitted
 * rather than replaced so downstream consumers cannot mistake a redaction
 * marker for an observed business value.
 */
export function sanitizeVerificationReport(value) {
  if (Array.isArray(value)) return value.map((item) => sanitizeVerificationReport(item));
  if (!value || typeof value !== 'object') return value;
  const output = {};
  for (const [key, item] of Object.entries(value)) {
    if (isForbiddenKey(key)) continue;
    output[key] = sanitizeVerificationReport(item);
  }
  return output;
}

export async function writeVerificationReport(report, filePath = DEFAULT_REQUIREMENT_EXTRACTION_REPORT_PATH) {
  const safeReport = sanitizeVerificationReport(report);
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(safeReport, null, 2)}\n`, 'utf8');
  return filePath;
}
