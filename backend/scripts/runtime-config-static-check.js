import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  SEMANTIC_GATEWAY_RUNTIME_ENV_NAMES,
  validateSemanticGatewayLiveConfig
} from '../../packages/semantic-contracts/runtime-config.js';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDirectory, '../..');

function parseExample(filePath) {
  const values = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!match) continue;
    values[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
  return values;
}

function trackedFiles(root) {
  return execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' })
    .split('\0')
    .filter(Boolean);
}

function isIgnored(root, relativePath) {
  try {
    execFileSync('git', ['check-ignore', '-q', relativePath], { cwd: root, stdio: 'ignore' });
    return true;
  } catch (_error) {
    return false;
  }
}

function checkTrackedSecrets(root, files) {
  const issues = [];
  for (const relativePath of files) {
    if (/\.env(?:\.|$)/i.test(relativePath) && !/\.env\.example$/i.test(relativePath)) {
      issues.push(`TRACKED_ENV_FILE:${relativePath}`);
      continue;
    }
    const absolutePath = path.join(root, relativePath);
    let content;
    try { content = fs.readFileSync(absolutePath, 'utf8'); } catch (_error) { continue; }
    // Only inspect committed env-style assignments. JavaScript variables such
    // as `apiKey = ...` are not credentials and would create false positives.
    for (const match of content.matchAll(/^[ \t]*(?:export[ \t]+)?[A-Z][A-Z0-9_]*(?:API_KEY|APIKEY|SECRET|TOKEN)[ \t]*=[ \t]*['"]?([^\s'"#]+)['"]?/gim)) {
      const value = match[1];
      if (value.length >= 32 && !/^(?:placeholder|changeme|example|test|dummy)/i.test(value)) {
        issues.push(`POTENTIAL_SECRET:${relativePath}`);
        break;
      }
    }
  }
  return issues;
}

export function runRuntimeConfigStaticCheck({ root = repoRoot } = {}) {
  const checks = {};
  const issues = [];
  const example = parseExample(path.join(root, 'services', 'semantic-gateway', '.env.example'));
  const expected = {
    SEMANTIC_GATEWAY_PROVIDER: 'openai_compatible',
    SEMANTIC_GATEWAY_API_BASE: 'http://127.0.0.1:18082',
    SEMANTIC_GATEWAY_API_KEY: '',
    SEMANTIC_GATEWAY_PROVIDER_API_BASE: 'https://api.siliconflow.cn/v1',
    SEMANTIC_GATEWAY_PROVIDER_API_KEY: '',
    SEMANTIC_GATEWAY_MODEL: 'Qwen/Qwen2.5-7B-Instruct',
    SEMANTIC_GATEWAY_TIMEOUT_MS: '120000'
  };

  checks.canonical_env_names = SEMANTIC_GATEWAY_RUNTIME_ENV_NAMES.every(name => Object.hasOwn(expected, name));
  if (!checks.canonical_env_names) issues.push('CANONICAL_ENV_NAMES_INCOMPLETE');

  checks.example_placeholders = Object.entries(expected).every(([name, value]) => example[name] === value);
  if (!checks.example_placeholders) issues.push('ENV_EXAMPLE_MISMATCH');

  checks.gateway_provider_bases_distinct = example.SEMANTIC_GATEWAY_API_BASE !== example.SEMANTIC_GATEWAY_PROVIDER_API_BASE;
  if (!checks.gateway_provider_bases_distinct) issues.push('GATEWAY_PROVIDER_BASE_NOT_DISTINCT');

  checks.key_roles_distinct = 'SEMANTIC_GATEWAY_API_KEY' !== 'SEMANTIC_GATEWAY_PROVIDER_API_KEY';
  if (!checks.key_roles_distinct) issues.push('KEY_ROLES_NOT_DISTINCT');

  const mockLive = validateSemanticGatewayLiveConfig({
    SEMANTIC_GATEWAY_PROVIDER: 'mock',
    SEMANTIC_GATEWAY_API_BASE: example.SEMANTIC_GATEWAY_API_BASE,
    SEMANTIC_GATEWAY_API_KEY: 'service-key',
    SEMANTIC_GATEWAY_PROVIDER_API_BASE: example.SEMANTIC_GATEWAY_PROVIDER_API_BASE,
    SEMANTIC_GATEWAY_PROVIDER_API_KEY: 'provider-key',
    SEMANTIC_GATEWAY_MODEL: example.SEMANTIC_GATEWAY_MODEL
  });
  checks.live_mock_rejected = !mockLive.valid && mockLive.errors.includes('LIVE_PROVIDER_MOCK_FORBIDDEN');
  if (!checks.live_mock_rejected) issues.push('LIVE_MOCK_NOT_REJECTED');

  const legacyOnly = validateSemanticGatewayLiveConfig({
    V43_GATEWAY_API_BASE: 'https://legacy.invalid',
    V43_GATEWAY_API_KEY: 'legacy-key',
    DIFY_API_BASE: 'https://dify.invalid',
    DIFY_API_KEY: 'legacy-key',
    EXTERNAL_WRITER_API_BASE: 'https://writer.invalid',
    EXTERNAL_WRITER_API_KEY: 'legacy-key'
  });
  checks.legacy_isolated = !legacyOnly.valid && legacyOnly.errors.includes('MISSING_PROVIDER');
  if (!checks.legacy_isolated) issues.push('LEGACY_CANONICAL_ISOLATION_FAILED');

  checks.env_ignored = isIgnored(root, '.env') && isIgnored(root, 'services/semantic-gateway/.env');
  if (!checks.env_ignored) issues.push('ENV_NOT_IGNORED');

  const trackedSecretFindings = checkTrackedSecrets(root, trackedFiles(root));
  checks.tracked_secrets_absent = trackedSecretFindings.length === 0;
  if (!checks.tracked_secrets_absent) issues.push('TRACKED_SECRET_DETECTED');

  return {
    check: 'RUNTIME_CONFIG_STATIC_CHECK',
    status: issues.length === 0 ? 'PASS' : 'FAIL',
    checks,
    issues,
    tracked_secret_findings: trackedSecretFindings
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = runRuntimeConfigStaticCheck();
  console.log(JSON.stringify(result));
  if (result.status !== 'PASS') process.exitCode = 1;
}
