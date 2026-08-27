import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadBackendEnvironment } from '../src/backend-runtime.js';
import {
  runRequirementExtractionAccept,
  runRequirementExtractionDoctor,
  runRequirementExtractionLive
} from '../src/verification/requirement-extraction-verifier.js';
import { DEFAULT_REQUIREMENT_EXTRACTION_REPORT_PATH } from '../src/verification/requirement-extraction-report.js';
import { buildRequirementExtractionLiveRequest } from '../src/verification/requirement-extraction-live-input.js';

function argumentValue(name) {
  const prefix = `${name}=`;
  const argument = process.argv.find((item) => item.startsWith(prefix));
  return argument ? argument.slice(prefix.length) : null;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function printSummary(mode, result, reportPath) {
  const report = result.report;
  const lines = [
    mode === 'doctor' ? 'Requirement Extraction Doctor' : `Requirement Extraction ${mode}`,
    '',
    `RESULT: ${report.verdict}`,
    report.blockers.length ? `Blockers: ${report.blockers.join(', ')}` : 'Blockers: none',
    `Report: ${reportPath}`
  ];
  if (mode === 'doctor') {
    const backend = report.runtime.backend?.reachable ? 'PASS' : 'FAIL';
    const gateway = report.runtime.gateway?.reachable ? 'PASS' : 'FAIL';
    const revision = report.runtime.gateway_build_revision || 'UNKNOWN';
    lines.splice(2, 0, `Runtime: Backend ${backend} · Gateway ${gateway} · Revision ${revision}`);
    lines.splice(3, 0, `Routing: ${report.runtime.routing?.requirement_extraction_target || 'UNKNOWN'} · 18080 fallback ${report.runtime.routing?.legacy_18080_fallback || 'UNKNOWN'}`);
  }
  console.log(lines.join('\n'));
}

function buildLiveRequest(env) {
  const chunkTextFile = argumentValue('--chunk-text-file');
  const inlineChunkText = argumentValue('--chunk-text');
  if (chunkTextFile && inlineChunkText != null) {
    throw Object.assign(new Error('Choose either --chunk-text-file or --chunk-text.'), { code: 'LIVE_PAYLOAD_CONFLICT' });
  }
  const chunkText = chunkTextFile
    ? readFileSync(resolve(chunkTextFile), 'utf8')
    : inlineChunkText;
  if (chunkText == null) return null;
  return buildRequirementExtractionLiveRequest({
    text: chunkText,
    fileName: argumentValue('--file-name') || 'FAST-01',
    projectName: argumentValue('--project-name') || 'FAST-01',
    sectionName: argumentValue('--section-name') || 'verification',
    env
  });
}

async function main() {
  const mode = process.argv[2] || 'doctor';
  const env = loadBackendEnvironment();
  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  const reportPath = argumentValue('--report') || DEFAULT_REQUIREMENT_EXTRACTION_REPORT_PATH;
  const expectedRevision = argumentValue('--expected-revision');
  const common = { env, expectedRevision, reportPath, repoRoot };
  let result;
  if (mode === 'doctor') {
    result = await runRequirementExtractionDoctor(common);
  } else if (mode === 'accept') {
    result = await runRequirementExtractionAccept(common);
  } else if (mode === 'live') {
    let liveRequest;
    let liveRequestError = null;
    try {
      liveRequest = buildLiveRequest(env);
    } catch (error) {
      liveRequestError = error?.code || 'LIVE_PAYLOAD_REQUIRED';
    }
    result = await runRequirementExtractionLive({
      ...common,
      confirmOneLiveCall: hasFlag('--confirm-one-live-call'),
      liveRequest,
      liveRequestError
    });
  } else {
    throw new Error(`Unsupported Requirement Extraction verification mode: ${mode}`);
  }
  printSummary(mode, result, reportPath);
  process.exitCode = result.ok ? 0 : 1;
}

const isMain = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (isMain) await main();
