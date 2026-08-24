import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildHumanReviewBatch01 } from './build-human-review-batch-01.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const POOL_PATH = path.join(HERE, 'candidate-pool-v2-evidence-span-repaired.json');
const JSON_PATH = path.join(HERE, 'human-review-batch-01-v2.json');
const MARKDOWN_PATH = path.join(HERE, 'human-review-batch-01-v2.md');

export function buildHumanReviewBatch01V2({ pool = JSON.parse(fs.readFileSync(POOL_PATH, 'utf8')) } = {}) {
  return buildHumanReviewBatch01({ pool });
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const { packet, markdown } = buildHumanReviewBatch01V2();
  fs.writeFileSync(JSON_PATH, `${JSON.stringify(packet, null, 2)}\n`, 'utf8');
  fs.writeFileSync(MARKDOWN_PATH, markdown.replace('# CALIBRATION V2 HUMAN REVIEW BATCH 1', '# CALIBRATION V2 HUMAN REVIEW BATCH 1 V2'), 'utf8');
  console.log(JSON.stringify({ output: MARKDOWN_PATH, json: JSON_PATH, status: packet.status, case_count: packet.case_count, evidence_span_metrics: packet.evidence_span_metrics, model_calls: 0, provider_calls: 0 }));
}
