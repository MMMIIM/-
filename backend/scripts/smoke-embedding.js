import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createBackendRuntime } from '../src/backend-runtime.js';
import { createEmbeddingClientFromEnv, createEmbeddingFetchFromEnv } from '../src/pipeline/embedding-client.js';

export async function runEmbeddingSmoke({ env, baseFetch = fetch, agentFactory, stdout = console.log, stderr = console.error, now = Date.now } = {}) {
  const runtimeEnv = env || createBackendRuntime().env;
  const transport = createEmbeddingFetchFromEnv({ env: runtimeEnv, baseFetch, agentFactory });
  const client = createEmbeddingClientFromEnv({ env: runtimeEnv, fetchImpl: transport.fetchImpl });
  const started = now();
  try {
    const vectors = await client.embed(['stage21-a-connectivity-probe']);
    const valid = Array.isArray(vectors) && vectors.length === 1 && Array.isArray(vectors[0])
      && vectors[0].length === client.dimension && vectors[0].every((value) => Number.isFinite(value));
    if (!valid) throw Object.assign(new Error('Embedding 响应契约无效。'), { code: 'EMBEDDING_RESPONSE_INVALID' });
    stdout(JSON.stringify({
      status: 'ready',
      provider: 'siliconflow',
      model: client.model,
      dimension: client.dimension,
      vector_count: vectors.length,
      transport: transport.proxyUrl ? 'socks5' : 'direct',
      latency_ms: Math.max(0, now() - started)
    }));
    return 0;
  } catch (error) {
    stderr(JSON.stringify({
      status: 'failed',
      provider: 'siliconflow',
      model: client.model,
      dimension: client.dimension,
      transport: transport.proxyUrl ? 'socks5' : 'direct',
      error_code: error?.code || 'EMBEDDING_SMOKE_FAILED',
      latency_ms: Math.max(0, now() - started)
    }));
    return 1;
  } finally {
    await transport.close();
  }
}

async function main() {
  process.exitCode = await runEmbeddingSmoke();
}

const isMain = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (isMain) await main();
