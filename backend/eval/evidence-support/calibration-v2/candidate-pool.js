import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SOURCE_PATH = path.resolve(HERE, '../../evidence-gold/gold-candidates.json');

export const CALIBRATION_V2_VERSION = '4.3-evidence-support-calibration-v2-candidate-pool';
export const CALIBRATION_V2_CLASSIFICATION = 'CANDIDATE_POOL_ONLY / SYSTEM_DRAFT / UNREVIEWED';

// These are deliberately draft observations, not Gold labels. They are kept in
// one deterministic table so a reviewer can change them without changing the
// source lineage or the legacy V1 fixture.
const DRAFTS = Object.freeze({
  'REQ-001': {
    status: 'INSUFFICIENT_EVIDENCE', semantic_relevance: 'relevant', evidence_capability: 'capable',
    support_level: 'partial_support', semantic_relationship: 'partial', reason_codes: ['SUPPORT_INSUFFICIENT'],
    reason: '来源涉及城市数据与治理方向，但未逐项证明招标要求中的标准体系与平台建设范围。',
    boundary_tags: ['partial_support', 'related_but_insufficient', 'product_capability']
  },
  'REQ-015': {
    status: 'INSUFFICIENT_EVIDENCE', semantic_relevance: 'relevant', evidence_capability: 'unknown',
    support_level: 'partial_support', semantic_relationship: 'partial', reason_codes: ['MISSING_REQUIRED_DETAIL'],
    reason: '来源说明集成能力，但没有直接给出 X86、国产操作系统及数据库适配事实。',
    boundary_tags: ['partial_support', 'quantitative_or_specific_detail', 'scope_mismatch']
  },
  'REQ-016': {
    status: 'INSUFFICIENT_EVIDENCE', semantic_relevance: 'relevant', evidence_capability: 'unknown',
    support_level: 'partial_support', semantic_relationship: 'partial', reason_codes: ['MISSING_REQUIRED_DETAIL'],
    reason: '来源没有提供不超过1秒的可核验接口响应指标。',
    boundary_tags: ['partial_support', 'quantitative_requirement', 'exact_numeric_commitment']
  },
  'REQ-027': {
    status: 'INSUFFICIENT_EVIDENCE', semantic_relevance: 'relevant', evidence_capability: 'capable',
    support_level: 'partial_support', semantic_relationship: 'partial', reason_codes: ['SUPPORT_INSUFFICIENT'],
    reason: '来源列出安全相关资质，但没有证明本项目要求的具体安全等级配置。',
    boundary_tags: ['partial_support', 'certification', 'scope_mismatch']
  },
  'REQ-030': {
    status: 'EVIDENCE_REVIEW_READY', semantic_relevance: 'relevant', evidence_capability: 'capable',
    support_level: 'full_support', semantic_relationship: 'direct', reason_codes: ['DIRECT_SOURCE_SUPPORT'],
    reason: '项目公告与系统集成资料共同出现数据共享交换平台及异构系统集成主题。',
    boundary_tags: ['direct_full_support', 'project_experience', 'implementation_delivery']
  },
  'REQ-047': {
    status: 'INSUFFICIENT_EVIDENCE', semantic_relevance: 'relevant', evidence_capability: 'capable',
    support_level: 'partial_support', semantic_relationship: 'partial', reason_codes: ['SCOPE_MISMATCH'],
    reason: '来源能证明政务平台项目背景，但不能直接证明本项目所需云服务能力。',
    boundary_tags: ['partial_support', 'project_experience', 'enterprise_capability_boundary']
  },
  'REQ-048': {
    status: 'INSUFFICIENT_EVIDENCE', semantic_relevance: 'relevant', evidence_capability: 'capable',
    support_level: 'partial_support', semantic_relationship: 'partial', reason_codes: ['SCOPE_MISMATCH'],
    reason: '来源描述智慧城市协同建设，但没有给出指定外部平台的接口对接事实。',
    boundary_tags: ['partial_support', 'wrong_subject_or_entity', 'scope_mismatch']
  },
  'REQ-059': {
    status: 'INSUFFICIENT_EVIDENCE', semantic_relevance: 'relevant', evidence_capability: 'capable',
    support_level: 'partial_support', semantic_relationship: 'partial', reason_codes: ['MISSING_REQUIRED_DETAIL'],
    reason: '来源涉及数字治理与数据汇聚，但没有证明指定事件网关的实时收发和治理功能。',
    boundary_tags: ['partial_support', 'product_capability', 'implementation_delivery']
  },
  'REQ-070': {
    status: 'INSUFFICIENT_EVIDENCE', semantic_relevance: 'relevant', evidence_capability: 'capable',
    support_level: 'partial_support', semantic_relationship: 'partial', reason_codes: ['MISSING_REQUIRED_DETAIL'],
    reason: '来源涉及城市治理协同，但没有逐项证明精网微格、警网融合和网格学院。',
    boundary_tags: ['partial_support', 'project_experience', 'enterprise_capability_boundary']
  },
  'REQ-187': {
    status: 'NO_RELEVANT_EVIDENCE', semantic_relevance: 'irrelevant', evidence_capability: 'unknown',
    support_level: 'reference_only', semantic_relationship: 'related', reason_codes: ['REFERENCE_ONLY'],
    reason: '现有资质摘录不能证明指定防火墙第三方检测报告扫描件。',
    boundary_tags: ['reference_only', 'certification', 'third_party_responsibility', 'exact_numeric_commitment']
  }
});

function readSource() {
  return JSON.parse(fs.readFileSync(SOURCE_PATH, 'utf8'));
}

function sourceRecord(anchor, material, index) {
  const [requirementId, chunkId, materialId, materialType, charStart, charEnd, sourceHash, sourceText] = anchor;
  return {
    source_id: `V2-SRC-${chunkId}`,
    source_kind: 'retrieval_candidate',
    material_id: materialId,
    document_id: null,
    document_ref: material?.name || null,
    chunk_id: chunkId,
    source_span_id: null,
    source_span_status: 'PENDING_FORMAL_SPAN_ID',
    source_text: sourceText,
    source_hash: sourceHash,
    start_offset: charStart,
    end_offset: charEnd,
    material_type: materialType,
    scope: 'ENTERPRISE_PRIVATE_PUBLIC_SOURCE_SNAPSHOT',
    usage_status: 'PENDING_HUMAN_REVIEW',
    lifecycle_status: 'PENDING_HUMAN_REVIEW',
    source_verification: 'PUBLIC_SOURCE_ANCHOR_UNREVIEWED',
    source_order: index + 1
  };
}

export function buildCalibrationV2Pool(source = readSource()) {
  const materials = source.materials || {};
  const requirements = new Map((source.requirements || []).map(item => [item.id, item]));
  const grouped = new Map();
  for (const anchor of source.anchors || []) {
    const requirementId = anchor[0];
    grouped.set(requirementId, [...(grouped.get(requirementId) || []), anchor]);
  }
  return [...grouped.entries()].map(([requirementId, anchors], index) => {
    const requirement = requirements.get(requirementId);
    const draft = DRAFTS[requirementId];
    if (!requirement || !draft) throw new Error(`Missing V2 draft definition: ${requirementId}`);
    const sources = anchors.map((anchor, anchorIndex) => sourceRecord(anchor, materials[anchor[2]], anchorIndex));
    return {
      case_id: `V2-${String(index + 1).padStart(3, '0')}`,
      requirement: {
        requirement_id: `V2-${requirementId}`,
        source_requirement_ref: requirementId,
        text: requirement.text,
        category: requirement.category
      },
      retrieval_shape: 'CURATED_REAL_SOURCE',
      source_count: sources.length,
      material_count: new Set(sources.map(item => item.material_id)).size,
      document_count: 0,
      same_document_chunk_count: 0,
      cross_document_count: 0,
      sources,
      draft_gold: {
        ...draft,
        provenance: 'SYSTEM_DRAFT / UNREVIEWED',
        reviewed: false,
        gold_status: null,
        gold_reviewer: null,
        gold_reviewed_at: null,
        gold_version: null
      },
      review: {
        decision: 'PENDING',
        reviewer: null,
        reviewed_at: null,
        notes: ''
      }
    };
  });
}

export function buildCalibrationV2Document() {
  const cases = buildCalibrationV2Pool();
  return {
    schema_version: CALIBRATION_V2_VERSION,
    classification: CALIBRATION_V2_CLASSIFICATION,
    source_policy: 'FORMAL_CORPUS_SOURCE_ANCHORS_ONLY',
    retrieval_shape_policy: 'CURATED_REAL_SOURCE_UNLESS_FORMAL_TRACE_EXISTS',
    holdout_policy: 'READ_ONLY_FOR_OVERLAP_AUDIT; GOLD_NOT_USED_FOR_AUTHORING',
    model_calls: 0,
    provider_calls: 0,
    synthetic_source_cases: 0,
    candidate_count: cases.length,
    cases
  };
}

