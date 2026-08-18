import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { SemanticGatewayError } from '../src/pipeline/semantic-gateway-client.js';
import { createBackendRuntime } from '../src/backend-runtime.js';

export const GATEWAY_HEALTHCHECK_REQUEST = Object.freeze({
  task_type: 'healthcheck',
  task_instruction: '返回严格 JSON，data 为 {"message":"gateway_contract_ok"}。',
  task_payload_json: '{}'
});

function writeLine(writer, value) {
  writer(JSON.stringify(value));
}

export async function runGatewaySmoke({
  client,
  stdout = (line) => process.stdout.write(`${line}\n`),
  stderr = (line) => process.stderr.write(`${line}\n`),
  now = Date.now
}) {
  const startedAt = now();
  try {
    const gatewayResponse = await client.run(GATEWAY_HEALTHCHECK_REQUEST);
    const { envelope } = gatewayResponse;
    if (envelope.status !== 'success' || envelope.data.message !== 'gateway_contract_ok') {
      throw new SemanticGatewayError(
        'GATEWAY_HEALTHCHECK_INVALID',
        'Semantic Gateway 健康检查响应内容无效。'
      );
    }
    writeLine(stdout, {
      task_type: envelope.task_type,
      status: envelope.status,
      'data.message': envelope.data.message,
      warnings_count: envelope.warnings.length,
      elapsed_ms: Math.max(0, now() - startedAt)
    });
    return 0;
  } catch (error) {
    writeLine(stderr, {
      task_type: GATEWAY_HEALTHCHECK_REQUEST.task_type,
      error_code: error?.code || 'GATEWAY_SMOKE_FAILED',
      elapsed_ms: Math.max(0, now() - startedAt)
    });
    return 1;
  }
}

async function main() {
  const runtime = createBackendRuntime();
  const client = runtime.createSemanticGatewayClient();
  process.exitCode = await runGatewaySmoke({ client });
}

const isMain = process.argv[1]
  && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (isMain) await main();
