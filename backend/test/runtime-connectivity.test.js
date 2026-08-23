import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createEmbeddingFetchFromEnv } from '../src/pipeline/embedding-client.js';
import { runConnectivityPreflight } from '../src/runtime/connectivity-preflight.js';
import { runEmbeddingSmoke } from '../scripts/smoke-embedding.js';
import { createApp } from '../src/app.js';

function fakeNetwork({ connect = true, secure = true } = {}) {
  const netModule = {
    createConnection() {
      const socket = new EventEmitter();
      socket.destroy = () => {};
      queueMicrotask(() => connect ? socket.emit('connect') : socket.emit('error', Object.assign(new Error('refused'), { code: 'ECONNREFUSED' })));
      return socket;
    }
  };
  const tlsModule = {
    connect({ socket }) {
      const secureSocket = new EventEmitter();
      secureSocket.destroy = () => socket.destroy();
      queueMicrotask(() => secure ? secureSocket.emit('secureConnect') : secureSocket.emit('error', Object.assign(new Error('tls'), { code: 'ERR_TLS_CERT_ALTNAME_INVALID' })));
      return secureSocket;
    }
  };
  return { netModule, tlsModule };
}

function baseEnv(extra = {}) {
  return {
    V43_GATEWAY_API_BASE: 'https://gateway.example/v1',
    V43_GATEWAY_API_KEY: 'gateway-secret',
    V43_EMBEDDING_API_BASE: 'https://embed.example/v1',
    V43_EMBEDDING_API_KEY: 'embedding-secret',
    V43_EMBEDDING_MODEL: 'Qwen/Qwen3-Embedding-0.6B',
    V43_EMBEDDING_DIMENSION: '1024',
    ...extra
  };
}

test('Embedding transport 默认 direct，代理只通过 per-request dispatcher 注入', async () => {
  const directCalls = [];
  const direct = createEmbeddingFetchFromEnv({ env: baseEnv(), baseFetch: async (_url, options) => { directCalls.push(options); return new Response('{}'); } });
  await direct.fetchImpl('https://embed.example/v1/embeddings', { method: 'POST' });
  assert.equal(direct.proxyUrl, null);
  assert.equal('dispatcher' in directCalls[0], false);

  let closed = false;
  const proxyCalls = [];
  const proxy = createEmbeddingFetchFromEnv({
    env: baseEnv({ EMBEDDING_PROXY_URL: 'socks5://127.0.0.1:18081' }),
    agentFactory: (url) => ({ url, close: async () => { closed = true; } }),
    baseFetch: async (_url, options) => { proxyCalls.push(options); return new Response('{}'); }
  });
  await proxy.fetchImpl('https://embed.example/v1/embeddings', { method: 'POST' });
  assert.equal(proxy.proxyUrl, 'socks5://127.0.0.1:18081');
  assert.ok(proxyCalls[0].dispatcher);
  await proxy.close();
  assert.equal(closed, true);
});

test('Embedding transport 拒绝非 SOCKS 代理且不输出凭据', () => {
  assert.throws(() => createEmbeddingFetchFromEnv({ env: baseEnv({ EMBEDDING_PROXY_URL: 'http://proxy.example:8080' }) }), (error) => error.code === 'EMBEDDING_PROXY_INVALID');
});

test('passive preflight 只调用 gateway /info，不调用 embedding API', async () => {
  const calls = [];
  const network = fakeNetwork();
  const result = await runConnectivityPreflight({
    env: baseEnv(),
    repository: { pool: { query: async () => ({ rows: [{ ok: 1 }] }) } },
    fetchImpl: async (url) => { calls.push(url); return new Response(JSON.stringify({ name: 'gateway', mode: 'workflow' }), { status: 200 }); },
    lookup: async () => [{ address: '192.0.2.10', family: 4 }],
    ...network
  });
  assert.equal(result.status, 'ready');
  assert.equal(result.services.database.status, 'ready');
  assert.equal(result.services.semantic_gateway.status, 'ready');
  assert.equal(result.services.embedding_provider.status, 'ready');
  assert.deepEqual(calls, ['https://gateway.example/v1/info']);
  assert.equal(JSON.stringify(result).includes('gateway-secret'), false);
  assert.equal(JSON.stringify(result).includes('embedding-secret'), false);
});

test('passive preflight 将 Embedding TCP 失败标记为 degraded，不阻断开发启动', async () => {
  const network = fakeNetwork({ connect: false });
  const result = await runConnectivityPreflight({
    env: baseEnv(),
    repository: { pool: { query: async () => ({ rows: [{ ok: 1 }] }) } },
    fetchImpl: async () => new Response(JSON.stringify({ name: 'gateway', mode: 'workflow' }), { status: 200 }),
    lookup: async () => [{ address: '192.0.2.10', family: 4 }],
    ...network
  });
  assert.equal(result.status, 'degraded');
  assert.equal(result.services.embedding_provider.status, 'degraded');
  assert.equal(result.services.embedding_provider.error_class, 'TCP_CONNECT_ERROR');
});

test('passive preflight 保留 DNS、TLS 和 timeout 的分层错误', async (t) => {
  const common = {
    env: baseEnv(),
    repository: { pool: { query: async () => ({ rows: [{ ok: 1 }] }) } },
    fetchImpl: async () => new Response(JSON.stringify({ name: 'gateway', mode: 'workflow' }), { status: 200 }),
    embeddingTimeoutMs: 5
  };
  await t.test('DNS_ERROR', async () => {
    const result = await runConnectivityPreflight({ ...common, lookup: async () => { throw Object.assign(new Error('dns'), { code: 'ENOTFOUND' }); }, ...fakeNetwork() });
    assert.equal(result.services.embedding_provider.error_class, 'DNS_ERROR');
  });
  await t.test('TLS_ERROR', async () => {
    const result = await runConnectivityPreflight({ ...common, lookup: async () => [{ address: '192.0.2.10', family: 4 }], ...fakeNetwork({ secure: false }) });
    assert.equal(result.services.embedding_provider.error_class, 'TLS_ERROR');
  });
  await t.test('TIMEOUT', async () => {
    const netModule = { createConnection() { const socket = new EventEmitter(); socket.destroy = () => {}; return socket; } };
    const result = await runConnectivityPreflight({ ...common, lookup: async () => [{ address: '192.0.2.10', family: 4 }], netModule, tlsModule: fakeNetwork().tlsModule });
    assert.equal(result.services.embedding_provider.error_class, 'TIMEOUT');
  });
});

test('gateway 鉴权失败单独分类为 AUTH_ERROR', async () => {
  const result = await runConnectivityPreflight({
    env: baseEnv(),
    repository: { pool: { query: async () => ({ rows: [{ ok: 1 }] }) } },
    fetchImpl: async () => new Response('{}', { status: 401 }),
    lookup: async () => [{ address: '192.0.2.10', family: 4 }],
    ...fakeNetwork()
  });
  assert.equal(result.status, 'fail');
  assert.equal(result.services.semantic_gateway.error_class, 'AUTH_ERROR');
});

test('gateway provider 与 response schema 错误保持独立分类', async (t) => {
  const common = {
    env: baseEnv(),
    repository: { pool: { query: async () => ({ rows: [{ ok: 1 }] }) } },
    lookup: async () => [{ address: '192.0.2.10', family: 4 }],
    ...fakeNetwork()
  };
  await t.test('PROVIDER_ERROR', async () => {
    const result = await runConnectivityPreflight({ ...common, fetchImpl: async () => new Response('{}', { status: 503 }) });
    assert.equal(result.services.semantic_gateway.error_class, 'PROVIDER_ERROR');
  });
  await t.test('RESPONSE_SCHEMA_ERROR', async () => {
    const result = await runConnectivityPreflight({ ...common, fetchImpl: async () => new Response('{}', { status: 200 }) });
    assert.equal(result.services.semantic_gateway.error_class, 'RESPONSE_SCHEMA_ERROR');
  });
});

test('runtime readiness API 只返回缓存的脱敏状态', async () => {
  const app = createApp({ connectivityPreflight: { getSnapshot: () => ({ status: 'degraded', services: { embedding_provider: { status: 'degraded', error_class: 'TCP_CONNECT_ERROR' } } }) } });
  const server = await new Promise((resolve) => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)); });
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/runtime/readiness`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: 'degraded', services: { embedding_provider: { status: 'degraded', error_class: 'TCP_CONNECT_ERROR' } } });
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('active embedding smoke 只验证维度并输出脱敏摘要', async () => {
  const stdout = [];
  const stderr = [];
  const code = await runEmbeddingSmoke({
    env: baseEnv(),
    stdout: (value) => stdout.push(value),
    stderr: (value) => stderr.push(value),
    now: (() => { let value = 100; return () => value += 7; })(),
    baseFetch: async () => new Response(JSON.stringify({ data: [{ index: 0, embedding: Array.from({ length: 1024 }, () => 0.1) }] }), { status: 200 })
  });
  assert.equal(code, 0);
  assert.equal(stderr.length, 0);
  assert.equal(JSON.parse(stdout[0]).dimension, 1024);
  assert.equal(stdout.join('').includes('embedding-secret'), false);
});

test('Windows runtime transport script 提供幂等动作且 status 不要求凭据', { skip: process.platform !== 'win32' }, () => {
  const script = fileURLToPath(new URL('../scripts/runtime-connectivity.ps1', import.meta.url));
  const content = readFileSync(script, 'utf8');
  assert.match(content, /ValidateSet\('start', 'status', 'stop', 'restart', 'monitor'\)/);
  assert.match(content, /ExitOnForwardFailure=yes/);
  assert.match(content, /ServerAliveInterval=30/);
  assert.match(content, /'-D'/);
  assert.doesNotMatch(content, /Stop-Process\s+-Force/);
  const stateDir = mkdtempSync(join(tmpdir(), 'bid-runtime-'));
  try {
    const result = spawnSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', script, '-Action', 'status'], {
      encoding: 'utf8',
      env: { ...process.env, RUNTIME_CONNECTIVITY_STATE_DIR: stateDir, RUNTIME_GATEWAY_LOCAL_PORT: '38180', RUNTIME_EMBEDDING_SOCKS_PORT: '38181' }
    });
    assert.equal(result.status, 0);
    assert.ok(['stopped', 'degraded'].includes(JSON.parse(result.stdout).status));
    assert.equal(JSON.parse(result.stdout).managed, false);
  } finally {
    rmSync(stateDir, { recursive: true, force: true });
  }
});
