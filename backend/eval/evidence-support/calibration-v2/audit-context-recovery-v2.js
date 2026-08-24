import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runSemanticReaudit } from './semantic-reaudit-v2.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPORT_PATH = path.join(HERE, 'context-recovery-v2.json');

export function runContextRecoveryAudit({ report = runSemanticReaudit() } = {}) {
  return {
    schema_version: '4.3-evidence-support-context-recovery-v2',
    model_calls: 0,
    provider_calls: 0,
    embedding_calls: 0,
    db_mutation: false,
    source_report: 'semantic-reaudit-v2.json',
    summary: report.context_recovery,
    cases: (report.cases || []).map(item => ({
      case_id: item.case_id,
      status: item.new_draft_status,
      context_recovery: item.context_recovery || [],
      exact_span_preserved: (item.context_recovery || []).every(entry => entry.exact_span_preserved === true)
    }))
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const report = runContextRecoveryAudit();
  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify(report.summary));
}
