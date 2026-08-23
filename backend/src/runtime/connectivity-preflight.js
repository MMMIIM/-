import { randomUUID } from 'node:crypto';
import dns from 'node:dns/promises';
import net from 'node:net';
import tls from 'node:tls';
import { parseEmbeddingConfig } from '../pipeline/embedding-client.js';

export const CONNECTIVITY_ERROR_CLASSES = Object.freeze([
  'DNS_ERROR',
  'TCP_CONNECT_ERROR',
  'TLS_ERROR',
  'AUTH_ERROR',
  'PROVIDER_ERROR',
  'MODEL_ERROR',
  'RESPONSE_SCHEMA_ERROR',
  'TIMEOUT',
  'CONFIG_ERROR'
]);

const safeTarget = (value) => {
  try {
    const target = new URL(value);
    return { host: target.hostname, port: Number(target.port || (target.protocol === 'https:' ? 443 : 80)), protocol: target.protocol };
  } catch {
    return { host: null, port: null, protocol: null };
  }
};

const classifyError = (error, fallback = 'PROVIDER_ERROR') => {
  const code = error?.code || error?.cause?.code;
  if (code === 'ENOTFOUND' || code === 'EAI_AGAIN' || code === 'EAI_FAIL') return 'DNS_ERROR';
  if (code === 'ECONNREFUSED' || code === 'ECONNRESET' || code === 'EHOSTUNREACH' || code === 'ENETUNREACH') return 'TCP_CONNECT_ERROR';
  if (code === 'ETIMEDOUT' || error?.name === 'AbortError') return 'TIMEOUT';
  if (String(code || '').startsWith('ERR_TLS') || String(code || '').includes('CERT')) return 'TLS_ERROR';
  return fallback;
};

const nowMs = () => Date.now();

function result(status, extras = {}) {
  return { status, ...extras };
}

async function probeTcpTls({ target, timeoutMs = 4000, lookup = dns.lookup, netModule = net, tlsModule = tls }) {
  if (!target.host || !target.port) return result('fail', { error_class: 'CONFIG_ERROR' });
  let addresses;
  try {
    addresses = await lookup(target.host, { all: true });
  } catch (error) {
    return result('fail', { error_class: classifyError(error, 'DNS_ERROR') });
  }
  if (!addresses?.length) return result('fail', { error_class: 'DNS_ERROR' });
  const started = nowMs();
  const socket = await new Promise((resolve) => {
    let settled = false;
    const finish = (value) => { if (!settled) { settled = true; resolve(value); } };
    const connection = netModule.createConnection({ host: target.host, port: target.port });
    const timer = setTimeout(() => { connection.destroy(); finish({ error_class: 'TIMEOUT' }); }, timeoutMs);
    connection.once('connect', () => {
      clearTimeout(timer);
      finish({ connection });
    });
    connection.once('error', (error) => {
      clearTimeout(timer);
      finish({ error_class: classifyError(error, 'TCP_CONNECT_ERROR') });
    });
  });
  if (socket.error_class) return result('fail', { error_class: socket.error_class, latency_ms: Math.max(0, nowMs() - started) });
  if (target.protocol !== 'https:') {
    socket.connection.destroy();
    return result('ready', { latency_ms: Math.max(0, nowMs() - started) });
  }
  const tlsResult = await new Promise((resolve) => {
    let settled = false;
    const finish = (value) => { if (!settled) { settled = true; resolve(value); } };
    const secure = tlsModule.connect({ socket: socket.connection, servername: target.host, rejectUnauthorized: true });
    const timer = setTimeout(() => { secure.destroy(); finish({ error_class: 'TIMEOUT' }); }, timeoutMs);
    secure.once('secureConnect', () => { clearTimeout(timer); secure.destroy(); finish({}); });
    secure.once('error', (error) => { clearTimeout(timer); secure.destroy(); finish({ error_class: classifyError(error, 'TLS_ERROR') }); });
  });
  return tlsResult.error_class
    ? result('fail', { error_class: tlsResult.error_class, latency_ms: Math.max(0, nowMs() - started) })
    : result('ready', { latency_ms: Math.max(0, nowMs() - started) });
}

async function probeGateway({ env, fetchImpl = fetch, timeoutMs = 4000, logger }) {
  const apiBase = String(env.V43_GATEWAY_API_BASE || '').trim().replace(/\/+$/, '');
  const apiKey = String(env.V43_GATEWAY_API_KEY || '').trim();
  const target = safeTarget(apiBase);
  const started = nowMs();
  const runId = randomUUID();
  const audit = { run_id: runId, provider: 'semantic_gateway', endpoint_host: target.host, operation: 'info' };
  if (!apiBase || !apiKey || !target.host) return result('fail', { error_class: 'CONFIG_ERROR', ...audit });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(`${apiBase}/info`, { method: 'GET', headers: { Authorization: `Bearer ${apiKey}` }, signal: controller.signal });
    if (response.status === 401 || response.status === 403) return result('fail', { error_class: 'AUTH_ERROR', http_status: response.status, ...audit });
    if (!response.ok) return result('fail', { error_class: response.status >= 500 ? 'PROVIDER_ERROR' : 'RESPONSE_SCHEMA_ERROR', http_status: response.status, ...audit });
    let payload;
    try { payload = await response.json(); } catch { return result('fail', { error_class: 'RESPONSE_SCHEMA_ERROR', ...audit }); }
    if (!payload || typeof payload.name !== 'string' || payload.mode !== 'workflow') return result('fail', { error_class: 'RESPONSE_SCHEMA_ERROR', ...audit });
    return result('ready', { app_mode: payload.mode, latency_ms: Math.max(0, nowMs() - started), ...audit });
  } catch (error) {
    return result('fail', { error_class: classifyError(error), latency_ms: Math.max(0, nowMs() - started), ...audit });
  } finally {
    clearTimeout(timer);
    logger?.({ ...audit, latency_ms: Math.max(0, nowMs() - started) });
  }
}

async function probeEmbedding({ env, lookup, netModule, tlsModule, logger, timeoutMs = 4000 }) {
  const config = parseEmbeddingConfig(env);
  const target = safeTarget(config.apiBase);
  const proxyTarget = safeTarget(config.proxyUrl);
  const targetToProbe = config.proxyUrl ? proxyTarget : target;
  const operation = config.proxyUrl ? 'socks_transport' : 'tls_transport';
  const checked = await probeTcpTls({ target: targetToProbe, timeoutMs, lookup, netModule, tlsModule });
  const audit = { run_id: randomUUID(), provider: 'siliconflow', endpoint_host: target.host, operation, model: config.model, dimension: config.dimension };
  const value = checked.status === 'ready'
    ? result('ready', { ...audit, latency_ms: checked.latency_ms, transport: config.proxyUrl ? 'socks5' : 'direct' })
    : result('degraded', { ...audit, latency_ms: checked.latency_ms || null, error_class: checked.error_class, transport: config.proxyUrl ? 'socks5' : 'direct' });
  logger?.({ ...audit, latency_ms: value.latency_ms, result: value.status, error_class: value.error_class || null });
  return value;
}

export async function runConnectivityPreflight({ env = process.env, repository, fetchImpl = fetch, logger = null, lookup = dns.lookup, netModule = net, tlsModule = tls, gatewayTimeoutMs = 4000, embeddingTimeoutMs = 4000 } = {}) {
  const started = nowMs();
  let database;
  try {
    if (!repository?.pool?.query) throw Object.assign(new Error('database unavailable'), { code: 'ECONNREFUSED' });
    await repository.pool.query('SELECT 1');
    database = result('ready', { operation: 'database_query' });
  } catch (error) {
    database = result('fail', { error_class: classifyError(error, 'PROVIDER_ERROR'), operation: 'database_query' });
  }
  const semanticGateway = await probeGateway({ env, fetchImpl, logger, timeoutMs: gatewayTimeoutMs });
  const embeddingProvider = await probeEmbedding({ env, lookup, netModule, tlsModule, logger, timeoutMs: embeddingTimeoutMs });
  const services = { database, semantic_gateway: semanticGateway, embedding_provider: embeddingProvider };
  const status = database.status === 'fail' || semanticGateway.status === 'fail'
    ? 'fail'
    : Object.values(services).some((item) => item.status === 'degraded') ? 'degraded' : 'ready';
  return { status, services, checked_at: new Date().toISOString(), latency_ms: Math.max(0, nowMs() - started) };
}

export class ConnectivityPreflight {
  constructor(options = {}) { this.options = options; this.snapshot = { status: 'degraded', services: {}, checked_at: null, error_class: 'NOT_CHECKED' }; }
  async run() { this.snapshot = await runConnectivityPreflight(this.options); return this.snapshot; }
  getSnapshot() { return this.snapshot; }
}
