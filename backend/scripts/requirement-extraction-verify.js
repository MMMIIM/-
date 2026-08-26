import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadBackendEnvironment } from '../src/backend-runtime.js';
import {
  runRequirementExtractionAccept,
  runRequirementExtractionDoctor,
  runRequirementExtractionLive
} from '../src/verification/requirement-extraction-verifier.js';
import { DEFAULT_REQUIREMENT_EXTRACTION_REPORT_PATH } from '../src/verification/requirement-extraction-report.js';

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

function buildLiveRequest() {
  const chunkText = argumentValue('--chunk-text');
  if (chunkText == null) return null;
  return {
    fileName: argumentValue('--file-name') || 'FAST-01',
    text: chunkText,
    paragraphs: [],
    chunk: { chunk_number: 1, segments: [] },
    projectName: argumentValue('--project-name') || 'FAST-01',
    sectionName: argumentValue('--section-name') || 'verification',
    chunkCount: 1
  };
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
    result = await runRequirementExtractionLive({
      ...common,
      confirmOneLiveCall: hasFlag('--confirm-one-live-call'),
      liveRequest: buildLiveRequest()
    });
  } else {
    throw new Error(`Unsupported Requirement Extraction verification mode: ${mode}`);
  }
  printSummary(mode, result, reportPath);
  process.exitCode = result.ok ? 0 : 1;
}

const isMain = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (isMain) await main();
