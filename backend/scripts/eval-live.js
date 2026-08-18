import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createBackendRuntime } from '../src/backend-runtime.js';
import { createRequirementExtractionGateway } from '../src/pipeline/requirement-extraction.js';

if (process.env.ALLOW_LIVE_MODEL_EVAL !== 'true') {
  console.error('LIVE_EVAL_DISABLED: 必须显式设置 ALLOW_LIVE_MODEL_EVAL=true。');
  process.exit(2);
}
const backendDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let input;
try { input = JSON.parse(await readFile(resolve(backendDirectory, 'eval/live-inputs/requirements.json'), 'utf8')); }
catch (_error) { console.error('LIVE_EVAL_INPUT_REQUIRED: 请在未跟踪的 eval/live-inputs 中配置脱敏案例。'); process.exit(2); }
if (!Array.isArray(input.cases) || new Set(input.cases.map((item) => item.id)).size !== input.cases.length) {
  console.error('LIVE_EVAL_INPUT_INVALID: 每个案例必须有唯一 id。'); process.exit(2);
}
const runtime = createBackendRuntime();
const gateway = createRequirementExtractionGateway(runtime.createSemanticGatewayClient());
const results = [];
for (const item of input.cases) {
  const startedAt = Date.now();
  try {
    // One call per case, deliberately no retry loop.
    const result = await gateway.extract({ fileName: item.file_name, text: item.text, paragraphs: item.paragraphs || [], chunk: item.chunk });
    results.push({ id: item.id, status: 'succeeded', requirement_count: result.candidates.length, warning_count: result.warnings.length, runtime_ms: Date.now() - startedAt, workflow_version: runtime.env.V43_GATEWAY_WORKFLOW_VERSION || null, cost: null });
  } catch (error) {
    results.push({ id: item.id, status: 'failed', error_code: error.code || 'LIVE_EVAL_FAILED', runtime_ms: Date.now() - startedAt, workflow_version: runtime.env.V43_GATEWAY_WORKFLOW_VERSION || null, cost: null });
  }
}
const reports = resolve(backendDirectory, 'eval/reports'); await mkdir(reports, { recursive: true });
const report = { generated_at: new Date().toISOString(), retry_policy: 'none', cases: results };
await writeFile(resolve(reports, `requirements-live-${Date.now()}.json`), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report));
if (results.some((item) => item.status === 'failed')) process.exitCode = 1;
