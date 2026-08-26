import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createBackendRuntime } from '../src/backend-runtime.js';
import {
  buildRequirementExtractionPayload,
  validateRequirementExtractionEnvelope
} from '../src/pipeline/requirement-extraction.js';
import { resolveSemanticTaskInstruction } from '../../packages/semantic-contracts/index.js';

export const GATEWAY_SMOKE_REQUEST = Object.freeze({
  task_type: 'requirement_extraction',
  task_instruction: resolveSemanticTaskInstruction('requirement_extraction'),
  task_payload_json: JSON.stringify(buildRequirementExtractionPayload({
    projectName: 'gateway-contract-smoke',
    sectionName: '契约测试',
    chunkIndex: 1,
    chunkCount: 1,
    chunkText: '本片段为契约连通性测试，不包含招标需求。'
  }))
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
  process.exitCode = await runGatewaySmoke({
    client: runtime.createSemanticGatewayClient({ taskType: 'requirement_extraction' })
  });
}
const isMain = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (isMain) await main();
