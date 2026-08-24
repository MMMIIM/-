import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  classifyEvidenceSourceEligibility,
  isDerivedArtifactClass
} from '../src/pipeline/retrieval-source-eligibility.js';
import { classifySubstantiveCandidate } from '../src/pipeline/retrieval-substantive-candidate.js';
import {
  isFormalEvidenceChunkEligible,
  partitionRetrievalCandidates
} from '../src/pipeline/retrieval-chunk-role.js';
import { replayCase } from '../eval/evidence-support/calibration-v2/replay-retrieval-source-eligibility.js';

test('original provenance categories remain source eligible', () => {
  assert.equal(classifyEvidenceSourceEligibility({ material_type: 'product_documentation', source_text: '结果：P95 1.9 秒。' }).evidence_source_class, 'ORIGINAL_TECHNICAL_FACT');
  assert.equal(classifyEvidenceSourceEligibility({ material_type: 'project_case', source_text: '项目于 2024-09-20 完成验收。' }).evidence_source_class, 'ORIGINAL_PROJECT_FACT');
  assert.equal(classifyEvidenceSourceEligibility({ material_type: 'qualification', source_text: '名称：ISO/IEC 27001，状态：active。' }).evidence_source_class, 'ORIGINAL_QUALIFICATION_FACT');
  assert.equal(classifyEvidenceSourceEligibility({ source_authority: 'administrative_regulation', source_type: 'official', source_text: '条例规定应建立安全保护制度。' }).evidence_source_class, 'AUTHORITATIVE_REFERENCE_FACT');
});

test('system, process and evaluation artifacts never become source evidence', () => {
  const samples = [
    ['Prompt = backend-owned instruction', 'INTERNAL_PROCESS_ARTIFACT'],
    ['commit 前：相关 tests PASS。', 'INTERNAL_PROCESS_ARTIFACT'],
    ['SUPPORTED → 材料已满足', 'SYSTEM_DERIVED_ARTIFACT'],
    ['REPRESENTATIVE_SYNTHETIC\nNOT_REAL_CUSTOMER_DATA\nmaterial_id: SME-001', 'EVAL_ARTIFACT'],
    ['Control Plane status: pending', 'CONTROL_PLANE_ARTIFACT']
  ];
  for (const [source, expected] of samples) {
    const result = classifyEvidenceSourceEligibility({ material_type: 'company_profile', source_text: source });
    assert.equal(result.evidence_source_class, expected, source);
    assert.equal(result.evidence_source_eligible, false);
  }
  assert.equal(isDerivedArtifactClass('SYSTEM_DERIVED_ARTIFACT'), true);
  assert.equal(isDerivedArtifactClass('CONTROL_PLANE_ARTIFACT'), true);
});

test('low specificity claims are auditable as ineligible, not silently upgraded', () => {
  const result = classifyEvidenceSourceEligibility({ material_type: 'company_profile', source_text: '企业软件基础能力，安全、够用。' });
  assert.equal(result.evidence_source_class, 'NON_AUDITABLE_CLAIM');
  assert.equal(result.low_specificity_claim, true);
  assert.equal(result.evidence_source_eligible, false);
});

test('English and Chinese noun-phrase labels are not complete substantive propositions', () => {
  for (const source of [
    'Customer Private Data externalization',
    'Security Management',
    'Project Delivery Capability',
    '数据安全管理',
    '客户数据外发',
    '产品能力'
  ]) {
    const result = classifySubstantiveCandidate({ source_text: source });
    assert.equal(result.substantive_candidate, false, source);
    assert.equal(result.substantive_class, 'LABEL_ONLY', source);
    assert.equal(result.substantive_reason, 'LABEL_LIKE_NOUN_PHRASE', source);
  }
});

test('short structured factual rows remain substantive', () => {
  for (const source of ['P95: 1.9 秒', '状态: active', '验收日期: 2024-09-20', '并发数: 50', '名称: ISO/IEC 27001']) {
    assert.equal(classifySubstantiveCandidate({ source_text: source }).substantive_candidate, true, source);
  }
  assert.equal(classifySubstantiveCandidate({ source_text: 'ISO/IEC 27001' }).substantive_candidate, false);
});

test('Customer Private Data externalization is non-substantive and source-ineligible', () => {
  const substantive = classifySubstantiveCandidate({ source_text: 'Customer Private Data externalization' });
  const eligibility = classifyEvidenceSourceEligibility({ material_type: 'company_profile', source_text: 'Customer Private Data externalization' });
  assert.equal(substantive.substantive_candidate, false);
  assert.equal(eligibility.evidence_source_class, 'NON_AUDITABLE_CLAIM');
  assert.equal(eligibility.evidence_source_eligible, false);
});

test('missing provenance remains UNKNOWN and cannot become proof-capable', () => {
  const result = classifyEvidenceSourceEligibility({ source_text: '这是一段没有来源分类的内容及其背景说明，当前仅作为未知来源的审计样本保留。' });
  assert.equal(result.evidence_source_class, 'UNKNOWN');
  assert.equal(result.evidence_source_eligible, false);
});

test('source eligibility is an additional formal evidence gate', () => {
  const requirement = { text: '企业应提供技术事实。', requirement_category: 'technical' };
  assert.equal(isFormalEvidenceChunkEligible({ requirement, candidate: { chunk_role: 'BUSINESS_CONTENT', source_text: 'Prompt = internal instruction', material_type: 'company_profile' } }), false);
  const result = partitionRetrievalCandidates({ requirement, candidates: [
    { chunk_id: 'internal', source_text: 'Prompt = internal instruction', material_type: 'company_profile' },
    { chunk_id: 'fact', source_text: '结果：P95 1.9 秒。', material_type: 'product_documentation' }
  ] });
  assert.deepEqual(result.eligible_candidates.map((item) => item.chunk_id), ['fact']);
  assert.equal(result.all_candidates.find((item) => item.chunk_id === 'internal').candidate_exclusion_reason, 'INTERNAL_PROCESS_TEXT');
});

test('ISO9001 remains source eligible but requirement-relative topic-only, while V2R-006 boundary evidence remains eligible', () => {
  const iso = classifyEvidenceSourceEligibility({ material_type: 'qualification', source_text: '名称：ISO 9001\n状态：active\n有效至：2028-03-31' });
  assert.equal(iso.evidence_source_eligible, true);
  assert.equal(iso.evidence_source_class, 'ORIGINAL_QUALIFICATION_FACT');
  const boundary = classifyEvidenceSourceEligibility({ material_type: 'technical_whitepaper', source_text: '企业持有在有效期内的 ISO/IEC 27001 受控记录。' });
  assert.equal(boundary.evidence_source_eligible, true);
});

test('offline source eligibility replay retains decision-bearing Gold without network calls', () => {
  const item = {
    case_id: 'V2R-006-ISO-SCOPE',
    requirement: '企业应提供指定项目主体的 ISO/IEC 27001 证书。',
    gold_evidence_set: [{ chunk_id: 'BOUNDARY', chunk_role: 'BUSINESS_CONTENT', source_hash: 'h1' }],
    raw_candidate_pool: [
      { chunk_id: 'NOISE', raw_vector_rank: 1, source_text: 'SUPPORTED → 材料已满足', material_type: 'company_profile' },
      { chunk_id: 'BOUNDARY', raw_vector_rank: 2, source_text: '企业持有在有效期内的 ISO/IEC 27001 受控记录。', material_type: 'technical_whitepaper' }
    ]
  };
  const result = replayCase(item, { candidate_reclassification: [{ case_id: item.case_id, chunk_id: 'BOUNDARY', GPT_REVIEW_EXPECTED_CLASSIFICATION: 'EVIDENCE_BEARING' }] });
  assert.deepEqual(result.post_v3.phase_candidates.map((candidate) => candidate.chunk_id), ['BOUNDARY']);
  assert.equal(result.post_v3.metrics.decision_bearing.hit_at_1, 1);
  assert.equal(result.raw_candidate_pool.find((candidate) => candidate.chunk_id === 'NOISE').decision_bearing_expectation_source, 'PENDING_GPT_REVIEW');
});

test('context-only chunks do not become formal evidence failures', () => {
  const result = replayCase({
    case_id: 'V2R-002-PERF-PARTIAL',
    requirement: '企业应提供性能测试记录。',
    raw_candidate_pool: [
      { chunk_id: 'HEADING', raw_vector_rank: 1, chunk_role: 'HEADING', source_text: '性能测试记录', material_type: 'company_profile' },
      { chunk_id: 'FACT', raw_vector_rank: 2, source_text: '结果：P95 1.9 秒。', material_type: 'product_documentation' }
    ]
  }, { candidate_reclassification: [] }, { includePostV4: true });
  assert.equal(result.raw_candidate_pool.find((candidate) => candidate.chunk_id === 'HEADING').chunk_role, 'HEADING');
  assert.equal(result.post_v4.phase_candidates.some((candidate) => candidate.chunk_id === 'HEADING'), false);
  assert.deepEqual(result.post_v4.phase_candidates.map((candidate) => candidate.chunk_id), ['FACT']);
});

test('offline expectation provenance never labels auto-derived values as GPT-reviewed', async () => {
  const { replayCase } = await import('../eval/evidence-support/calibration-v2/replay-retrieval-source-eligibility.js');
  const result = replayCase({
    case_id: 'V2R-001-PERF-DIRECT',
    requirement: '企业应提供性能测试记录。',
    raw_candidate_pool: [
      { chunk_id: 'MCH-52CC0CDE792C8009A7790CA3F184A28E', raw_vector_rank: 1, material_type: 'company_profile', source_text: 'Customer Private Data externalization' },
      { chunk_id: 'AUTO-DRAFT', raw_vector_rank: 2, material_type: 'company_profile', source_text: 'Security Management' }
    ]
  }, { candidate_reclassification: [] });
  const reviewed = result.raw_candidate_pool[0];
  const draft = result.raw_candidate_pool[1];
  assert.equal(reviewed.source_eligibility_expectation_provenance, 'GPT_REVIEWED_REGRESSION_EXPECTATION');
  assert.equal(reviewed.gpt_reviewed_source_eligibility, 'NON_AUDITABLE_CLAIM');
  assert.equal(draft.source_eligibility_expectation_provenance, 'AUTO_DRAFT_EXPECTATION');
  assert.equal(draft.gpt_reviewed_source_eligibility, null);
  assert.equal(Object.hasOwn(draft, 'GPT_REVIEW_EXPECTED_SOURCE_ELIGIBILITY'), false);
});

test('system-derived expected label is explicitly GPT-reviewed, not auto-attributed', async () => {
  const { replayCase } = await import('../eval/evidence-support/calibration-v2/replay-retrieval-source-eligibility.js');
  const result = replayCase({
    case_id: 'V2R-004-COMP-PARTIAL',
    requirement: '企业应提供兼容性说明。',
    raw_candidate_pool: [{ chunk_id: 'MCH-363BD137AFF31336472D4E7F4F537C8F', raw_vector_rank: 1, material_type: 'company_profile', source_text: 'NO_EVIDENCE\n→ 缺少证明材料' }]
  }, { candidate_reclassification: [] });
  const candidate = result.raw_candidate_pool[0];
  assert.equal(candidate.evidence_source_class, 'SYSTEM_DERIVED_ARTIFACT');
  assert.equal(candidate.evidence_source_eligible, false);
  assert.equal(candidate.expected_source_eligibility, 'SYSTEM_DERIVED_ARTIFACT');
  assert.equal(candidate.source_eligibility_expectation_provenance, 'GPT_REVIEWED_REGRESSION_EXPECTATION');
});

test('POST_V4 packet preserves all captured occurrences and truthful expectation provenance', async () => {
  const packetPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../eval/evidence-support/calibration-v2/GPT_REVIEW_PACKET_EVIDENCE_SOURCE_ELIGIBILITY_POST_V4.json');
  const packet = JSON.parse(await fs.readFile(packetPath, 'utf8'));
  const candidates = packet.cases.flatMap((item) => item.raw_candidate_pool);
  assert.equal(packet.evaluation_phase, 'POST_V4');
  assert.equal(packet.source_eligibility.total_candidate_occurrences, 120);
  assert.equal(candidates.length, 120);
  assert.equal(packet.source_eligibility.auto_expectation_count, 100);
  assert.equal(packet.source_eligibility.gpt_reviewed_expectation_count, 20);
  assert.equal(packet.source_eligibility.wrongly_attributed_gpt_labels_remaining, 0);
  assert.equal(packet.acceptance.post_v4_pass, true);
  assert.equal(packet.safety.embedding_requests, 0);
  assert.equal(packet.safety.llm_requests, 0);
  assert.equal(packet.safety.dify_requests, 0);
  assert.equal(candidates.some((candidate) => Object.hasOwn(candidate, 'GPT_REVIEW_EXPECTED_SOURCE_ELIGIBILITY')), false);
  const customer = candidates.find((candidate) => candidate.chunk_id === 'MCH-52CC0CDE792C8009A7790CA3F184A28E');
  assert.equal(customer.candidate_eligibility, 'CONTEXT_ONLY');
  assert.equal(packet.cases.flatMap((item) => item.post_v4.phase_candidates).some((candidate) => candidate.chunk_id === customer.chunk_id), false);
});
