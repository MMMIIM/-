import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCalibrationV2Document } from './candidate-pool.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const output = path.join(here, 'review-packet.md');
const document = buildCalibrationV2Document();

const lines = [
  '# Evidence Support Calibration V2 — Human Review Packet',
  '',
  '> 所有判断均为 SYSTEM_DRAFT / UNREVIEWED，不是正式 Gold。请仅依据原始来源摘录审核。',
  '> 审核结果只能填写 APPROVE、CHANGE 或 REJECT；不得把相关性直接升级为 Evidence 或 Full Support。',
  ''
];

for (const item of document.cases) {
  const draft = item.draft_gold;
  lines.push(`## ${item.case_id} — ${item.requirement.requirement_id}`);
  lines.push('');
  lines.push(`- Requirement：${item.requirement.text}`);
  lines.push(`- Category：${item.requirement.category}`);
  lines.push(`- Retrieval shape：${item.retrieval_shape}`);
  lines.push(`- Draft status：${draft.status}`);
  lines.push(`- Draft semantic judgement：relevance=${draft.semantic_relevance}；capability=${draft.evidence_capability}；support=${draft.support_level}；relationship=${draft.semantic_relationship}`);
  lines.push(`- Draft reason：${draft.reason}`);
  lines.push(`- Boundary tags：${draft.boundary_tags.join('、')}`);
  lines.push('');
  lines.push('| Source | Material | Document | Chunk | 原始来源摘录 |');
  lines.push('|---|---|---|---|---|');
  for (const source of item.sources) {
    lines.push(`| ${source.source_id} | ${source.document_ref || source.material_id} | 待补正式 document_id | ${source.chunk_id} | ${source.source_text.replaceAll('|', '\\|')} |`);
  }
  lines.push('');
  lines.push('- Reviewer decision：`[ ] APPROVE`  `[ ] CHANGE`  `[ ] REJECT`');
  lines.push('- Reviewer：');
  lines.push('- Reviewed at：');
  lines.push('- Reviewer notes：');
  lines.push('');
}

fs.writeFileSync(output, `${lines.join('\n')}\n`, 'utf8');
console.log(JSON.stringify({ output, case_count: document.cases.length, source_count: document.cases.flatMap(item => item.sources).length, model_calls: 0, provider_calls: 0 }));

