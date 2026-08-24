import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  POST_V4_MARKDOWN_PATH,
  POST_V4_REPORT_PATH,
  runOfflineReplay
} from './replay-retrieval-source-eligibility.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));

const report = await runOfflineReplay({
  reportPath: POST_V4_REPORT_PATH,
  markdownPath: POST_V4_MARKDOWN_PATH,
  includePostV4: true
});

console.log(JSON.stringify({
  status: 'SOURCE_ELIGIBILITY_POST_V4_OFFLINE_PENDING_REVIEW',
  evaluation_phase: report.evaluation_phase,
  acceptance: report.acceptance,
  source_eligibility: report.source_eligibility,
  quality: report.quality,
  external_calls: report.safety,
  report_path: path.relative(HERE, POST_V4_REPORT_PATH),
  markdown_path: path.relative(HERE, POST_V4_MARKDOWN_PATH)
}));
