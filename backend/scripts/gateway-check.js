import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createBackendRuntime } from '../src/backend-runtime.js';

function fingerprint(value) {
  return `sha256:${createHash('sha256').update(String(value || '')).digest('hex').slice(0, 12)}`;
}

export async function runGatewayCheck({ env, fetchImpl = fetch, stdout = console.log, stderr = console.error, now = Date.now }) {
  const startedAt = now();
  try {
    const apiBase = String(env.V43_GATEWAY_API_BASE || '').trim().replace(/\/+$/, '');
    const apiKey = String(env.V43_GATEWAY_API_KEY || '').trim();
    if (!apiBase || !apiKey) throw Object.assign(new Error('missing'), { code: 'GATEWAY_NOT_CONFIGURED' });
    const target = new URL(apiBase);
    const response = await fetchImpl(`${apiBase}/info`, { method: 'GET', headers: { Authorization: `Bearer ${apiKey}` } });
    if (!response.ok) throw Object.assign(new Error('info failed'), { code: response.status === 401 ? 'GATEWAY_AUTH_FAILED' : 'GATEWAY_INFO_UNAVAILABLE' });
    const info = await response.json();
    if (!info || typeof info.name !== 'string' || info.mode !== 'workflow') throw Object.assign(new Error('invalid app'), { code: 'GATEWAY_APP_INVALID' });
    stdout(JSON.stringify({ api_host: target.hostname, api_port: target.port || (target.protocol === 'https:' ? '443' : '80'), key_fingerprint: fingerprint(apiKey), app_name: info.name, app_mode: info.mode, reachable: true, elapsed_ms: Math.max(0, now() - startedAt) }));
    return 0;
  } catch (error) {
    stderr(JSON.stringify({ error_code: error?.code || 'GATEWAY_CHECK_FAILED', elapsed_ms: Math.max(0, now() - startedAt) }));
    return 1;
  }
}

async function main() {
  const runtime = createBackendRuntime();
  process.exitCode = await runGatewayCheck({ env: runtime.env });
}
const isMain = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (isMain) await main();
