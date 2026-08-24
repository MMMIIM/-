import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const POOL_PATH = path.join(HERE, 'candidate-pool-v2-remediated.json');
const OUTPUT_PATH = path.join(HERE, 'review-packet-v2-remediated.md');
const pool = JSON.parse(fs.readFileSync(POOL_PATH, 'utf8'));
const lines = [
  '# Evidence Support Calibration V2 — Human Review Packet',
  '',
  '> 所有判断均为 `SYSTEM_DRAFT_UNREVIEWED`。本文件不包含人工 Gold，不能替代正式审核。',
  '> 来源来自当前正式 Corpus；`source_span_id` 为按正式 Contract 从 Chunk + offset/hash 离线派生的 transient identity，未写入生产数据库。',
  ''
];
for (const item of pool.cases || []) {
  lines.push(`## ${item.case_id}`, '', `### Requirement`, '', item.requirement.text, '');
  lines.push(`- 难度：${item.requirement.difficulty}`, `- 边界：${(item.requirement.boundary_tags || []).join('、')}`, `- Draft aggregated status：**${item.draft_aggregated_status}**`, `- Draft provenance：${item.draft_gold?.provenance || 'SYSTEM_DRAFT_UNREVIEWED'}`, '', '### Sources', '');
  for (const [index, source] of (item.sources || []).entries()) {
    lines.push(`#### Source ${index + 1}`, '', `- Material：${source.material_name} (${source.material_type})`, `- Scope：${source.corpus_scope}`, `- Material ID：${source.material_id}`, `- Document ID：${source.document_id}`, `- Chunk ID：${source.chunk_id}`, `- Source Span ID：${source.source_span_id}`, `- Resolution：${source.source_span_resolution}`, `- Verified：${source.source_verified}`, '', '```text', source.source_text, '```', '');
  }
  lines.push('### Draft semantic judgement', '', '```json', JSON.stringify(item.draft_gold, null, 2), '```', '', '### Human decision', '', '- [ ] APPROVE', '- [ ] CHANGE', '- [ ] REJECT', '', 'Reviewer corrected status:', '', 'Reviewer corrected semantics:', '', 'Reviewer reason:', '', '---', '');
}
fs.writeFileSync(OUTPUT_PATH, `${lines.join('\n')}\n`, 'utf8');
console.log(JSON.stringify({ output: OUTPUT_PATH, case_count: pool.candidate_count, source_count: (pool.cases || []).flatMap(item => item.sources || []).length, model_calls: 0, provider_calls: 0 }));
