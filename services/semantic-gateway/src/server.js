import { createStandaloneGatewayServer, gatewayConfigFromEnv } from './gateway.js';

const port = Number(process.env.SEMANTIC_GATEWAY_PORT || 18082);
const host = process.env.SEMANTIC_GATEWAY_HOST || '127.0.0.1';
const config = gatewayConfigFromEnv(process.env);
const server = createStandaloneGatewayServer({ config, env: process.env });
server.listen(port, host, () => {
  console.log(`Standalone Semantic Gateway listening on http://${host}:${port}`);
});

function shutdown() {
  server.close(() => process.exit(0));
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
