import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MAPPING_PATH = path.join(HERE, 'targeted-evidence-bearing-regression-v2.json');
const LIVE_PATH = path.join(HERE, 'targeted-evidence-bearing-live-v1.json');
const JSON_PATH = path.join(HERE, 'GPT_REVIEW_PACKET.json');
const MD_PATH = path.join(HERE, 'GPT_REVIEW_PACKET.md');

// These are the independently inspected synthetic source snapshots already
// referenced by the mapping. They are evidence fixtures, not new Gold.
const VERIFIED_SPAN_SNAPSHOTS = Object.freeze({
  'ESPAN-7C976B914F1C677C5D80017CCD2C307B': {
    source_text: '# 数据交换平台性能测试记录\n\n产品：澄明数据交换平台 V3.2\n环境：8 vCPU、32 GB 内存、PostgreSQL 14、千兆局域网\n条件：50 并发、100 万条基准数据、缓存预热后执行 30 分钟\n指标：数据目录查询平均响应时间\n结果：平均 1.4 秒，P95 1.9 秒。\n日期：2025-05-16。',
    source_text_hash: 'b5522622368a1f3144b6ae8ea08d106cec5174b7d36221525e0b7cb0bcdc5934',
    anchor_chunk_id: 'MCH-0FBD3599DAF932016F62EB9634B997AF',
    source_chunk_ids: ['MCH-B4FF02295DBB6DCDF6E2763F057076F6', 'MCH-0FBD3599DAF932016F62EB9634B997AF']
  },
  'ESPAN-DB796CE9A6685C040977607A8228D832': {
    source_text: '# 产品兼容性矩阵\n\nx86_64 + Ubuntu 22.04 + PostgreSQL 14：tested\n鲲鹏 920 + 麒麟 V10 + 达梦 8：partially_tested（完成安装和基础交换用例，未完成压力测试）\n海光 + 统信 UOS + 人大金仓：not_verified\n国产数据库组合：unknown',
    source_text_hash: 'bb48093928c5a0df95f9c5d308dbff9edc625d6c357253e43cc8beda7ad77d5b',
    anchor_chunk_id: 'MCH-7F11A857F9B5A05D9B22E30CD4F1BEE0',
    source_chunk_ids: ['MCH-57FE3B83C106C09B70C731182F48FFA4', 'MCH-7F11A857F9B5A05D9B22E30CD4F1BEE0']
  },
  'ESPAN-9ABC2E493608BCA753CEF663057CD6DE': {
    source_text: '# ISO 27001 受控记录\n\n名称：ISO/IEC 27001\n编号：CM-Q-27001-2024\n状态：active\n有效至：2027-11-30',
    source_text_hash: '6bbf2de2c97df192f2c009aa1a730a10c49879d1f07b7c7cb4a7f1e950152684',
    anchor_chunk_id: 'MCH-0820CC5A439CB986C62E46213029CC71',
    source_chunk_ids: ['MCH-0820CC5A439CB986C62E46213029CC71', 'MCH-A4C2632EF9126FADD349C3004E1C2D84']
  },
  'ESPAN-06CAB70C047B196B20B49523A71D7661': {
    source_text: '# 项目D实施片段\n\n项目：南泽业务协同升级片段（虚构）\n客户：南泽公共服务机构（虚构）\n实施片段日期：2025-10-09\n状态不完整，不得推断完工或验收。',
    source_text_hash: '6ed02e81de495a410e8a220b74f07851df39a8b72bec308e69ab83878a31b31f',
    anchor_chunk_id: 'MCH-C5D5EB33CB97F715074CC6F4E98EEF17',
    source_chunk_ids: ['MCH-3D0A254CE926B207AFC696BF46520897', 'MCH-C5D5EB33CB97F715074CC6F4E98EEF17']
  }
});

const EXPECTED_CHUNK_SNAPSHOTS = Object.freeze({
  'MCH-B349280E685FEB7ECD6B73AFFCF32228': { source_text: '# 中华人民共和国政府信息公开条例', source_text_hash: 'e7e05bc5785225ee9dc46d8012989147918561ac3963c792815c01b333071fbb', provenance_status: 'TRANSIENT_OR_UNPERSISTED_REFERENCE' },
  'MCH-F4CD0E67DBD66EC447EF06D0EDBB083A': { source_text: '来源机构：国务院办公厅\n文号：国办函〔2016〕108号', source_text_hash: 'b27d1bdb75e04a5ce81a501d6213b0fdf98fdb27c082289a8e1c16401ca175b1', provenance_status: 'TRANSIENT_OR_UNPERSISTED_REFERENCE' },
  'MCH-A4211A94C5C7A077F478D979A3ADF86E': { source_text: '平台可集成某开源数据库和消息组件；部署、许可和技术支持依赖第三方，企业不将第三方能力表述为自有产品能力。', source_text_hash: '33d664614db3cd87de0f1c1c95b33111a5999792791f3938fb4650fbdd20df05', provenance_status: 'TRANSIENT_OR_UNPERSISTED_REFERENCE' },
  'MCH-3FD884E9C86C84ADD445F70EC81FADD9': { source_text: '项目：景云城市治理数据平台；范围：数据目录、交换任务、统一门户和运行监测；项目状态：已完成模拟案例；验收日期：2025-11-20。', source_text_hash: 'f4f7b9db71c7a29583a29ba9b9bf499740066997570b2ec02e80c41b516e9719', provenance_status: 'TRANSIENT_OR_UNPERSISTED_REFERENCE' }
});

function retrievalIntent(caseItem) {
  if (/PERF/.test(caseItem.case_id)) return 'quantitative_performance';
  if (/COMP/.test(caseItem.case_id)) return 'platform_compatibility';
  if (/ISO/.test(caseItem.case_id)) return 'qualification_validity';
  if (/PROJECT/.test(caseItem.case_id)) return 'project_implementation_status';
  return 'enterprise_capability_boundary';
}

function scopeFor(projectId) {
  return projectId === '00000000-0000-4000-8000-000000000001'
    ? 'PUBLIC_OR_INDUSTRY_REFERENCE'
    : 'ENTERPRISE_PROJECT_SCOPE';
}

function sourceSnapshot(mapping) {
  if (!mapping.verified_span_id) return null;
  const snapshot = VERIFIED_SPAN_SNAPSHOTS[mapping.verified_span_id];
  return snapshot ? { span_id: mapping.verified_span_id, ...snapshot } : { span_id: mapping.verified_span_id, source_text: null, source_text_hash: mapping.verified_span_hash || null };
}

function expectedChunkSnapshot(mapping) {
  const snapshot = EXPECTED_CHUNK_SNAPSHOTS[mapping.expected_chunk_id];
  return snapshot ? { chunk_id: mapping.expected_chunk_id, ...snapshot } : null;
}

function buildCase(mapping, liveCase) {
  const verifiedSpan = sourceSnapshot(mapping);
  const failureReason = (mapping.invalid_reasons || []).join('; ');
  return {
    case_id: mapping.case_id,
    requirement: {
      requirement_id: mapping.formal_requirement_id,
      original_text: mapping.requirement_text,
      retrieval_intent: retrievalIntent(mapping),
      allowed_evidence_scope: {
        project_id: mapping.expected_project_id,
        scope: scopeFor(mapping.expected_project_id),
        material_id: mapping.expected_material_id
      }
    },
    expected: {
      material_id: mapping.expected_material_id,
      document_id: mapping.expected_document_id,
      chunk_id: mapping.expected_chunk_id,
      verified_evidence_span: verifiedSpan,
      expected_source_snapshot: expectedChunkSnapshot(mapping),
      equivalent_evidence_candidates: [],
      gold_status: mapping.mapping_status,
      invalid_reasons: mapping.invalid_reasons || []
    },
    actual: {
      execution_status: liveCase?.status === 'EXECUTED' ? 'EXECUTED' : 'NOT_EXECUTED',
      top_k: liveCase?.top5 || [],
      expected_evidence_rank: liveCase?.gold_hit_at_5 ? liveCase.top5.find(item => item.chunk_id === mapping.expected_chunk_id)?.rank || null : null,
      evidence_bearing_hit: liveCase?.gold_hit_at_5 ?? 'NOT_EXECUTED',
      qualified_span: liveCase?.qualified_span ?? 'NOT_EXECUTED',
      metadata_false_positive: liveCase?.metadata_false_positive ?? 'NOT_EXECUTED',
      topic_only_false_positive: liveCase?.topic_only_false_positive ?? 'NOT_EXECUTED',
      source_routing_result: liveCase?.source_routing_result ?? 'NOT_EXECUTED',
      not_executed_reason: liveCase?.status === 'EXECUTED' ? null : 'Gold mapping is invalid; no Retrieval request was sent.'
    },
    mapping_context: {
      requirement_id: mapping.formal_requirement_id,
      fact_id: null,
      evidence_fact: null,
      original_evidence_span: verifiedSpan,
      source_lineage: {
        material_id: mapping.expected_material_id,
        document_id: mapping.expected_document_id,
        chunk_id: mapping.expected_chunk_id,
        span_id: mapping.verified_span_id,
        span_hash: mapping.verified_span_hash || verifiedSpan?.source_text_hash || null
      },
      mapping_relationship: 'NOT_EXECUTED',
      expected_mapping: mapping.mapping_status === 'VALID' ? 'EXPECTED_SOURCE_MAPPING' : 'INVALID_GOLD',
      actual_mapping: 'NOT_EXECUTED',
      support_semantics: 'NOT_EXECUTED',
      mismatch_dimensions: mapping.invalid_reasons || [],
      human_approval_state: 'NOT_REACHED',
      claim_gate_consequence: 'NOT_REACHED'
    },
    final: {
      result: 'FAIL',
      status: 'BLOCKED',
      failure_layer: 'GOLD_INVALID',
      root_cause: `Targeted Gold is not executable: ${failureReason || 'formal Requirement/source lineage is missing.'}`
    }
  };
}

function markdownCase(item) {
  const expected = item.expected;
  const actual = item.actual;
  const span = expected.verified_evidence_span;
  const topK = actual.top_k.length
    ? actual.top_k.map(candidate => `- Rank ${candidate.rank}: ${candidate.material_id || '—'} / ${candidate.document_id || '—'} / ${candidate.chunk_id || '—'} / score=${candidate.score ?? '—'} / scope=${candidate.scope || '—'} / class=${candidate.classification || '—'}\n  Raw source: ${candidate.source_excerpt || '—'}`).join('\n')
    : '- None — `NOT_EXECUTED` because Gold mapping is invalid.';
  return [
    `## ${item.case_id}`,
    '',
    `- Requirement ID: ${item.requirement.requirement_id || 'NOT_PERSISTED'}`,
    `- Requirement original text: ${item.requirement.original_text}`,
    `- Retrieval intent: ${item.requirement.retrieval_intent}`,
    `- Allowed evidence scope: ${item.requirement.allowed_evidence_scope.scope} / project=${item.requirement.allowed_evidence_scope.project_id}`,
    `- Expected Material: ${expected.material_id}`,
    `- Expected Document: ${expected.document_id}`,
    `- Expected Chunk: ${expected.chunk_id}`,
    `- Gold status: ${expected.gold_status}`,
    `- Invalid reasons: ${(expected.invalid_reasons || []).join('; ') || 'none'}`,
    '',
    '### Verified Evidence Span',
    '',
    span ? `- Span: ${span.span_id}\n- Hash: ${span.source_text_hash}\n- Anchor chunk: ${span.anchor_chunk_id}\n- Source chunks: ${span.source_chunk_ids.join(', ')}` : '- None persisted.',
    span?.source_text ? `\n\`\`\`text\n${span.source_text}\n\`\`\`` : '',
    expected.expected_source_snapshot ? `\n### Expected chunk source snapshot (not automatically verified)\n\n- Chunk: ${expected.expected_source_snapshot.chunk_id}\n- Hash: ${expected.expected_source_snapshot.source_text_hash}\n- Provenance: ${expected.expected_source_snapshot.provenance_status}\n\n\`\`\`text\n${expected.expected_source_snapshot.source_text}\n\`\`\`` : '',
    '',
    '### Actual TopK',
    '',
    topK,
    '',
    `- Evidence-Bearing Hit: ${actual.evidence_bearing_hit}`,
    `- Expected Evidence Rank: ${actual.expected_evidence_rank ?? 'NOT_EXECUTED'}`,
    `- Qualified Span: ${actual.qualified_span}`,
    `- Metadata false positive: ${actual.metadata_false_positive}`,
    `- Topic-only false positive: ${actual.topic_only_false_positive}`,
    `- Source routing result: ${actual.source_routing_result}`,
    '',
    '### Mapping / downstream safety',
    '',
    `- Requirement ID: ${item.mapping_context.requirement_id || 'NOT_PERSISTED'}`,
    '- Evidence Fact ID: NOT_CREATED',
    `- Original Evidence Span: ${item.mapping_context.original_evidence_span?.span_id || 'NONE'}`,
    '- Mapping relationship: NOT_EXECUTED',
    '- Human approval: NOT_REACHED',
    '- Claim Gate consequence: NOT_REACHED',
    '',
    `### Final: ${item.final.status} / ${item.final.result}`,
    '',
    `- Failure layer: ${item.final.failure_layer}`,
    `- Root cause: ${item.final.root_cause}`,
    '',
    '---',
    ''
  ].join('\n');
}

export async function buildTargetedGptReviewPacket({ mappingPath = MAPPING_PATH, livePath = LIVE_PATH, jsonPath = JSON_PATH, markdownPath = MD_PATH } = {}) {
  const mapping = JSON.parse(await fs.readFile(mappingPath, 'utf8'));
  const live = JSON.parse(await fs.readFile(livePath, 'utf8'));
  const liveByCase = new Map((live.cases || []).map(item => [item.case_id, item]));
  const cases = (mapping.cases || []).map(item => buildCase(item, liveByCase.get(item.case_id)));
  const packet = {
    schema_version: '4.3-gpt-review-packet-v1',
    evaluation: 'targeted-evidence-bearing-live-retrieval',
    generated_at: '2026-08-24',
    case_count: cases.length,
    case_level_results_complete: cases.length === 12,
    raw_source_included: cases.every(item => Boolean(item.expected.verified_evidence_span?.source_text || item.expected.expected_source_snapshot?.source_text)),
    gpt_review_packet_available: true,
    gpt_review_status: 'PENDING_REVIEW',
    eval_complete: false,
    external_calls: { embedding: live.embedding_calls || 0, llm: live.llm_calls || 0, dify: live.dify_calls || 0, automatic_retry: Boolean(live.automatic_retry) },
    aggregate_metrics: live.metrics || {},
    failure_index: cases.map(item => ({ case_id: item.case_id, layer: item.final.failure_layer, status: item.final.status })),
    cases
  };
  await fs.writeFile(jsonPath, `${JSON.stringify(packet, null, 2)}\n`, 'utf8');
  const markdown = [
    '# GPT REVIEW PACKET — Targeted Evidence-Bearing Retrieval',
    '',
    `- Schema: ${packet.schema_version}`,
    `- Case count: ${packet.case_count}`,
    `- CASE_LEVEL_RESULTS_COMPLETE: ${packet.case_level_results_complete ? 'YES' : 'NO'}`,
    `- RAW_SOURCE_INCLUDED: ${packet.raw_source_included ? 'YES' : 'NO'}`,
    `- GPT_REVIEW_STATUS: ${packet.gpt_review_status}`,
    `- EVAL_COMPLETE: ${packet.eval_complete ? 'YES' : 'NO'}`,
    '- Execution: all 12 Gold mappings were invalid; no live Retrieval request was sent.',
    '',
    '## Aggregate output (derived from case-level records)',
    '',
    '```json',
    JSON.stringify(packet.aggregate_metrics, null, 2),
    '```',
    '',
    '## Failure index',
    '',
    ...packet.failure_index.map(item => `- ${item.case_id}: ${item.status} / ${item.layer}`),
    '',
    '## Complete case-level results',
    '',
    ...cases.map(markdownCase)
  ].join('\n');
  await fs.writeFile(markdownPath, markdown, 'utf8');
  return packet;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const packet = await buildTargetedGptReviewPacket();
  console.log(JSON.stringify({
    status: packet.gpt_review_status,
    case_count: packet.case_count,
    case_level_results_complete: packet.case_level_results_complete,
    raw_source_included: packet.raw_source_included,
    eval_complete: packet.eval_complete,
    json_path: JSON_PATH,
    markdown_path: MD_PATH
  }));
}
