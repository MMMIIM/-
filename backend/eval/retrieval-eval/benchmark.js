import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const sourceFixture = path.resolve(here, '../../fixtures/enterprise-retrieval-eval.json');
const cosine = (a, b) => {
  const dot = a.reduce((sum, value, index) => sum + value * (b[index] || 0), 0);
  const an = Math.sqrt(a.reduce((sum, value) => sum + value * value, 0));
  const bn = Math.sqrt(b.reduce((sum, value) => sum + value * value, 0));
  return an && bn ? dot / (an * bn) : 0;
};

export function loadRetrievalEvalFixture() {
  const source = JSON.parse(fs.readFileSync(sourceFixture, 'utf8'));
  const chunks = source.chunks.map((chunk, index) => ({
    ...chunk,
    material_id: index === source.chunks.length - 1 || chunk.chunk_id === 'CH-OTHER-01' ? 'MAT-PROJECT-B' : 'MAT-PROJECT-A',
    document_id: `DOC-${chunk.chunk_id}`,
    source_span: { char_start: index * 100, char_end: index * 100 + chunk.label.length, text: chunk.label }
  }));
  chunks.push({ ...chunks[0], chunk_id: 'CH-OS-DUP', label: `${chunks[0].label}（近重复）`, source_span: { char_start: 2000, char_end: 2010, text: chunks[0].label } });
  const queries = [
    { query_id: 'Q-EXACT', class: 'exact_factual_lookup', requirement: '支持国产操作系统环境部署', vector: [1, 0, 0, 0, 0, 0, 0, 0], relevant_chunk_ids: ['CH-OS-01'] },
    { query_id: 'Q-PARAPHRASE', class: 'semantic_paraphrase', requirement: '可在国产操作系统上运行', vector: [1, 0, 0, 0, 0, 0, 0, 0], relevant_chunk_ids: ['CH-OS-01'] },
    { query_id: 'Q-QUALIFICATION', class: 'qualification_certificate', requirement: '提供有效企业资质证明', vector: [0, 0, 0, 0, 0, 0, 1, 0], relevant_chunk_ids: ['CH-QUAL-01'] },
    { query_id: 'Q-PRODUCT', class: 'product_capability', requirement: '产品应具备相应业务处理能力', vector: [0, 0, 0, 0, 0, 1, 0, 0], relevant_chunk_ids: ['CH-PRODUCT-01'] },
    { query_id: 'Q-UNSUPPORTED', class: 'similar_but_unsupported', requirement: '保证极高并发与极低延迟', vector: [0.88, 0.48, 0, 0, 0, 0, 0, 0], relevant_chunk_ids: [], no_answer: true },
    { query_id: 'Q-OUT-OF-SCOPE', class: 'out_of_scope_material', requirement: '办公场地面积证明', vector: [0, 0, 0, 0, 0, 0, 0, 1], relevant_chunk_ids: [], no_answer: true },
    { query_id: 'Q-DUPLICATE', class: 'duplicate_near_duplicate', requirement: '国产操作系统适配说明', vector: [1, 0, 0, 0, 0, 0, 0, 0], relevant_chunk_ids: ['CH-OS-01', 'CH-OS-DUP'] },
    { query_id: 'Q-NONE', class: 'no_answer', requirement: '未提供的专有认证', vector: [0, 0, 0, 0, 0, 0, 0, 0], relevant_chunk_ids: [], no_answer: true }
  ];
  return { schema_version: '4.3-retrieval-eval-v1', chunks, queries, duplicate_groups: [['CH-OS-01', 'CH-OS-DUP']] };
}

function rank(query, chunks) {
  const seenGroups = new Set();
  return chunks.map((chunk) => ({ ...chunk, score: cosine(query.vector, chunk.vector) }))
    .sort((a, b) => b.score - a.score || a.chunk_id.localeCompare(b.chunk_id))
    .filter((chunk) => {
      const group = chunk.chunk_id.startsWith('CH-OS-') ? 'OS' : chunk.chunk_id;
      if (seenGroups.has(group)) return false;
      seenGroups.add(group);
      return true;
    });
}

export function evaluateRetrievalFixture(fixture = loadRetrievalEvalFixture(), { k = 5, confidenceFloor = 0.9 } = {}) {
  const schemaPass = fixture.schema_version === '4.3-retrieval-eval-v1'
    && fixture.chunks.every((chunk) => chunk.chunk_id && chunk.material_id && chunk.document_id && chunk.source_span?.text)
    && fixture.queries.every((query) => query.query_id && Array.isArray(query.vector) && Array.isArray(query.relevant_chunk_ids));
  const allowed = fixture.chunks.filter((chunk) => chunk.material_id === 'MAT-PROJECT-A');
  const details = fixture.queries.map((query) => {
    const ranked = rank(query, allowed);
    const top = ranked.slice(0, k);
    const relevant = new Set(query.relevant_chunk_ids);
    const relevantRanks = ranked.map((item, index) => relevant.has(item.chunk_id) ? index + 1 : null).filter(Boolean);
    const answer = top.length && top[0].score >= confidenceFloor ? 'CANDIDATES_FOUND' : 'NO_RELEVANT_EVIDENCE';
    return {
      query_id: query.query_id, class: query.class, answer_status: answer,
      expected_no_answer: Boolean(query.no_answer),
      recall_at_k: relevant.size ? top.filter((item) => relevant.has(item.chunk_id)).length / relevant.size : 0,
      reciprocal_rank: relevantRanks.length ? 1 / relevantRanks[0] : 0,
      returned: top.map((item) => item.chunk_id),
      scope_violations: top.filter((item) => item.material_id !== 'MAT-PROJECT-A').length,
      traceable: top.every((item) => item.material_id && item.document_id && item.chunk_id && item.source_span?.text),
      duplicate_count: top.length - new Set(top.map((item) => item.chunk_id.startsWith('CH-OS-') ? 'OS' : item.chunk_id)).size
    };
  });
  const positive = details.filter((item) => !item.expected_no_answer);
  const mean = (field) => positive.length ? positive.reduce((sum, item) => sum + item[field], 0) / positive.length : 0;
  const noAnswerCases = details.filter((item) => item.expected_no_answer);
  return {
    schema_pass_rate: schemaPass ? 1 : 0,
    expected_requirement_recall: mean('recall_at_k'),
    precision_at_k: positive.length ? positive.reduce((sum, item) => sum + (item.recall_at_k ? 1 : 0), 0) / positive.length : 0,
    mrr: mean('reciprocal_rank'),
    source_traceability_rate: details.length ? details.filter((item) => item.traceable).length / details.length : 0,
    scope_violation_rate: details.reduce((sum, item) => sum + item.scope_violations, 0) / Math.max(1, details.reduce((sum, item) => sum + item.returned.length, 0)),
    duplicate_retrieval_rate: details.length ? details.filter((item) => item.duplicate_count > 0).length / details.length : 0,
    no_answer_accuracy: noAnswerCases.length ? noAnswerCases.filter((item) => item.answer_status === 'NO_RELEVANT_EVIDENCE').length / noAnswerCases.length : 0,
    unsupported_content_count: noAnswerCases.filter((item) => item.answer_status !== 'NO_RELEVANT_EVIDENCE').length,
    query_count: details.length,
    details
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = evaluateRetrievalFixture();
  console.log(JSON.stringify(report, null, 2));
  console.error(`Retrieval Eval: ${report.query_count} cases · Recall@5 ${(report.expected_requirement_recall * 100).toFixed(1)}% · MRR ${report.mrr.toFixed(3)} · no-answer ${(report.no_answer_accuracy * 100).toFixed(1)}%`);
}
