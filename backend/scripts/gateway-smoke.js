import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createBackendRuntime } from '../src/backend-runtime.js';
import { REQUIREMENT_EXTRACTION_INSTRUCTION, validateRequirementExtractionEnvelope } from '../src/pipeline/requirement-extraction.js';

export const GATEWAY_SMOKE_REQUEST = Object.freeze({
  task_type: 'requirement_extraction',
  task_instruction: REQUIREMENT_EXTRACTION_INSTRUCTION,
  task_payload_json: JSON.stringify({
    file_name: 'gateway-contract-smoke.txt',
    chunk: { chunk_number: 1, source_start_offset: 0, source_end_offset: 22, source_start_page: 1, source_end_page: 1, source_start_paragraph: 1, source_end_paragraph: 1 },
    text: '本片段为契约连通性测试，不包含招标需求。',
    segments: [{ paragraph: 1, page: 1, text: '本片段为契约连通性测试，不包含招标需求。', source_start_offset: 0, source_end_offset: 22, source_section: '契约测试', source_clause_id: null }]
  })
});

function writeLine(writer, value) { writer(JSON.stringify(value)); }

export async function runGatewaySmoke({ client, stdout = console.log, stderr = console.error, now = Date.now }) {
  const startedAt = now();
  try {
    const gatewayResponse = await client.run(GATEWAY_SMOKE_REQUEST);
    const validated = validateRequirementExtractionEnvelope(gatewayResponse);
    writeLine(stdout, { schema_version: gatewayResponse.envelope.schema_version, task_type: gatewayResponse.envelope.task_type, status: gatewayResponse.envelope.status, requirements_count: validated.candidates.length, warnings_count: validated.warnings.length, elapsed_ms: Math.max(0, now() - startedAt) });
    return 0;
  } catch (error) {
    writeLine(stderr, { task_type: GATEWAY_SMOKE_REQUEST.task_type, error_code: error?.code || 'GATEWAY_SMOKE_FAILED', elapsed_ms: Math.max(0, now() - startedAt) });
    return 1;
  }
}

async function main() {
  const runtime = createBackendRuntime();
  process.exitCode = await runGatewaySmoke({ client: runtime.createSemanticGatewayClient() });
}
const isMain = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (isMain) await main();
