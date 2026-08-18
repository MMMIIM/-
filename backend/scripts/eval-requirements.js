import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEvaluationCases, RequirementExtractionEvaluator } from '../src/eval/requirement-extraction-evaluator.js';

const backendDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const evalDirectory = resolve(backendDirectory, 'eval');
const report = new RequirementExtractionEvaluator().evaluate(await loadEvaluationCases(evalDirectory));
await mkdir(resolve(evalDirectory, 'reports'), { recursive: true });
await writeFile(resolve(evalDirectory, 'reports', 'requirements-latest.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report));
console.error(`Requirement eval: ${report.passed ? 'PASS' : 'FAIL'} · recall ${(report.metrics.expected_requirement_recall * 100).toFixed(1)}% · precision ${(report.metrics.precision * 100).toFixed(1)}% · source ${(report.metrics.source_verified_rate * 100).toFixed(1)}%`);
if (!report.passed) process.exitCode = 1;
