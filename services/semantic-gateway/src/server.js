import { createStandaloneGatewayServer, gatewayConfigFromEnv } from './gateway.js';
import { loadSemanticGatewayEnvironment } from '../../../packages/semantic-contracts/runtime-config.js';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const serviceDirectory = dirname(fileURLToPath(import.meta.url));
const env = loadSemanticGatewayEnvironment({
  env: process.env,
  envFile: resolve(serviceDirectory, '../.env')
});
const port = Number(env.SEMANTIC_GATEWAY_PORT || 18082);
const host = env.SEMANTIC_GATEWAY_HOST || '127.0.0.1';
const config = gatewayConfigFromEnv(env);
if (!config.runtimeValidation.valid) {
  console.error(JSON.stringify({
    error_code: 'SEMANTIC_GATEWAY_CONFIG_INVALID',
    config_errors: config.runtimeValidation.errors,
    ...config.runtimeSummary
  }));
  process.exitCode = 1;
  throw new Error('Semantic Gateway runtime configuration invalid.');
}
const server = createStandaloneGatewayServer({ config, env });
server.listen(port, host, () => {
  console.log(`Standalone Semantic Gateway listening on http://${host}:${port}`);
});

function shutdown() {
  server.close(() => process.exit(0));
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
