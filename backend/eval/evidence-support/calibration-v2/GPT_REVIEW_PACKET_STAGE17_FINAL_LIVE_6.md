# GPT REVIEW PACKET — STAGE17 FINAL CONTROLLED LIVE RETRIEVAL 6

- Dataset: `SAFE_SYNTHETIC_EVAL`
- GPT_REVIEW_STATUS: `PENDING_REVIEW`
- EVAL_COMPLETE: `NO`
- No LLM, Dify, corpus upload, re-embedding, re-index, MMR or ranking change.

## Runtime and leakage

```json
{
  "runtime": {
    "cases_executed": 6,
    "embedding_calls": 6,
    "retries": 0,
    "llm_calls": 0,
    "dify_calls": 0,
    "provider": "SiliconFlow",
    "model": "Qwen/Qwen3-Embedding-0.6B",
    "transport": "Stage21-A managed SOCKS path",
    "embedding_request_payload_leakage": {
      "gold_material_ids_in_runtime_payload": false,
      "gold_document_ids_in_runtime_payload": false,
      "gold_chunk_ids_in_runtime_payload": false,
      "expected_labels_in_runtime_payload": false,
      "expected_answer_or_classification_in_runtime_payload": false
    }
  },
  "external_calls": {
    "embedding": 6,
    "llm": 0,
    "dify": 0,
    "automatic_retry": 0
  }
}
```

## Live metrics

```json
{
  "live_quality": {
    "metadata_at_5": 0,
    "non_substantive_at_5": 0,
    "non_evidence_source_at_5": 0,
    "derived_artifact_leakage_at_5": 0,
    "internal_process_artifact_leakage_at_5": 0,
    "low_specificity_claim_at_5": 0,
    "scope_violation": 0,
    "broken_decision_bearing_gold": 0
  },
  "retrieval": {
    "decision_hit_at_1": 0.8333333333333334,
    "decision_hit_at_3": 1,
    "decision_hit_at_5": 1,
    "decision_mrr": 0.9166666666666666,
    "exact_hit_at_1": 0.5,
    "exact_hit_at_3": 1,
    "exact_hit_at_5": 1,
    "exact_mrr": 0.75,
    "v2r001_first_decision_rank": 4,
    "v2r006_boundary_status": "PRESERVED",
    "iso9001_source_status": "SOURCE_ELIGIBLE_NOT_SUPPORTING_ISO27001"
  },
  "index_hygiene": {
    "final_candidate_counts_by_case": {
      "V2R-001-PERF-DIRECT": 4,
      "V2R-002-PERF-PARTIAL": 3,
      "V2R-003-COMP-DIRECT": 2,
      "V2R-004-COMP-PARTIAL": 4,
      "V2R-005-ISO-DIRECT": 3,
      "V2R-006-ISO-SCOPE": 3
    },
    "gold_raw_rank_by_case": {
      "V2R-001-PERF-DIRECT": 1,
      "V2R-002-PERF-PARTIAL": 1,
      "V2R-003-COMP-DIRECT": 1,
      "V2R-004-COMP-PARTIAL": 1,
      "V2R-005-ISO-DIRECT": 2,
      "V2R-006-ISO-SCOPE": 2
    },
    "ineligible_before_gold_by_case": {
      "V2R-001-PERF-DIRECT": 0,
      "V2R-002-PERF-PARTIAL": 0,
      "V2R-003-COMP-DIRECT": 0,
      "V2R-004-COMP-PARTIAL": 0,
      "V2R-005-ISO-DIRECT": 0,
      "V2R-006-ISO-SCOPE": 0
    },
    "gold_crowded_outside_raw_pool": []
  }
}
```

## V2R-001-PERF-DIRECT

- Requirement: 企业应提供可核验的数据交换平台性能测试记录。
- Status: captured
- Latency: 339 ms
- Raw candidate pool: 20
- Final candidates: 4
- Gold raw rank: 1
- First decision-bearing raw rank: 4

### Raw candidate pool and post-retrieval audit

```json
[
  {
    "raw_rank": 1,
    "raw_similarity": 0.820653070250338,
    "material_id": "3c81671f-376e-401b-8525-be26929d5b92",
    "document_id": "3c81671f-376e-401b-8525-be26929d5b92",
    "chunk_id": "MCH-B4FF02295DBB6DCDF6E2763F057076F6",
    "raw_source_text": "# 数据交换平台性能测试记录",
    "chunk_role": "HEADING",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "NON_EVIDENCE_ROLE",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_TECHNICAL_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "METADATA_OR_HEADER",
    "requirement_relative_reason_codes": [
      "METADATA_OR_HEADER"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 2,
    "raw_similarity": 0.6545740365982056,
    "material_id": "8821b9fa-2bde-4329-9cbf-908395c1270d",
    "document_id": "8821b9fa-2bde-4329-9cbf-908395c1270d",
    "chunk_id": "MCH-770B6FE8E57173DCC72914CFFB7376F8",
    "raw_source_text": "产品：澄明数据交换平台 V3.2\n能力：REST API 接入、数据目录、交换任务调度、运行日志。\n未声明未列出的协议、吞吐量或 SLA。",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "EVIDENCE_ELIGIBLE",
    "candidate_exclusion_reason": null,
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_TECHNICAL_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "TOPIC_RELEVANT_ONLY",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": 1,
    "final_eligible": true
  },
  {
    "raw_rank": 3,
    "raw_similarity": 0.6524852514266968,
    "material_id": "8821b9fa-2bde-4329-9cbf-908395c1270d",
    "document_id": "8821b9fa-2bde-4329-9cbf-908395c1270d",
    "chunk_id": "MCH-C9F466EAC2C29977E40F4A3BFE38A6E4",
    "raw_source_text": "# 数据交换平台产品说明",
    "chunk_role": "HEADING",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "NON_EVIDENCE_ROLE",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_TECHNICAL_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "METADATA_OR_HEADER",
    "requirement_relative_reason_codes": [
      "METADATA_OR_HEADER"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 4,
    "raw_similarity": 0.5710718291359059,
    "material_id": "3c81671f-376e-401b-8525-be26929d5b92",
    "document_id": "3c81671f-376e-401b-8525-be26929d5b92",
    "chunk_id": "MCH-0FBD3599DAF932016F62EB9634B997AF",
    "raw_source_text": "产品：澄明数据交换平台 V3.2\n环境：8 vCPU、32 GB 内存、PostgreSQL 14、千兆局域网\n条件：50 并发、100 万条基准数据、缓存预热后执行 30 分钟\n指标：数据目录查询平均响应时间\n结果：平均 1.4 秒，P95 1.9 秒。\n日期：2025-05-16。",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "EVIDENCE_ELIGIBLE",
    "candidate_exclusion_reason": null,
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_TECHNICAL_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "EVIDENCE_BEARING",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_SUPPORTED"
    ],
    "final_phase_rank": 2,
    "final_eligible": true
  },
  {
    "raw_rank": 5,
    "raw_similarity": 0.5241128489903907,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-5B3A5D4F1299B7E362FE0D195F33C161",
    "raw_source_text": "记录已经验证的核心原则：",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "KNOWN_LABEL_ONLY",
    "substantive_candidate": false,
    "substantive_class": "LABEL_ONLY",
    "substantive_reason": "KNOWN_LABEL_ONLY",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_BUSINESS_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "TOPIC_RELEVANT_ONLY",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 6,
    "raw_similarity": 0.5180168747901917,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-F6FE125F46AD101C81DA541D50D7AE47",
    "raw_source_text": "可控\n可追溯\n可审核\n可修改\n可交付",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "ABSTRACT_VALUE_LIST",
    "substantive_candidate": false,
    "substantive_class": "BOILERPLATE",
    "substantive_reason": "ABSTRACT_VALUE_LIST",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "NON_AUDITABLE_CLAIM",
    "source_eligibility_reason": "LOW_SPECIFICITY_CLAIM",
    "requirement_relative_classification": "IRRELEVANT",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 7,
    "raw_similarity": 0.5172624588012695,
    "material_id": "b472e07b-3065-4645-9b0b-a6abadaa70b7",
    "document_id": "b472e07b-3065-4645-9b0b-a6abadaa70b7",
    "chunk_id": "MCH-DEA320F82E7EEC727D332134D9C2E87A",
    "raw_source_text": "# 项目A验收记录",
    "chunk_role": "HEADING",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "NON_EVIDENCE_ROLE",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_PROJECT_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "METADATA_OR_HEADER",
    "requirement_relative_reason_codes": [
      "METADATA_OR_HEADER"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 8,
    "raw_similarity": 0.5129590034484863,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-555802B2C6B93AE17E478E4ECC99308A",
    "raw_source_text": "核心业务流程真实可用、\n稳定、可审核、可追溯、易操作。",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "LOW_SPECIFICITY_CLAIM",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "NON_AUDITABLE_CLAIM",
    "source_eligibility_reason": "LOW_SPECIFICITY_CLAIM",
    "requirement_relative_classification": "IRRELEVANT",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 9,
    "raw_similarity": 0.510559008469495,
    "material_id": "3f9dacfb-2e48-4796-a477-98c60b506831",
    "document_id": "3f9dacfb-2e48-4796-a477-98c60b506831",
    "chunk_id": "MCH-57FE3B83C106C09B70C731182F48FFA4",
    "raw_source_text": "# 产品兼容性矩阵",
    "chunk_role": "HEADING",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "NON_EVIDENCE_ROLE",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_TECHNICAL_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "METADATA_OR_HEADER",
    "requirement_relative_reason_codes": [
      "METADATA_OR_HEADER"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 10,
    "raw_similarity": 0.5049018859863281,
    "material_id": "57b9e5fe-9549-42aa-88d5-fccc5c0afe2e",
    "document_id": "57b9e5fe-9549-42aa-88d5-fccc5c0afe2e",
    "chunk_id": "MCH-0820CC5A439CB986C62E46213029CC71",
    "raw_source_text": "# ISO 27001 受控记录",
    "chunk_role": "HEADING",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "NON_EVIDENCE_ROLE",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_QUALIFICATION_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "METADATA_OR_HEADER",
    "requirement_relative_reason_codes": [
      "METADATA_OR_HEADER"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 11,
    "raw_similarity": 0.503727942927358,
    "material_id": "edc27231-e615-4b30-afcf-c6be41469db3",
    "document_id": "edc27231-e615-4b30-afcf-c6be41469db3",
    "chunk_id": "MCH-3A8FB2B6257892D70EAFEF97417EEB23",
    "raw_source_text": "项目：北川新区数据协同平台项目（虚构）\n双方：澄明数科（示范）有限公司；北川新区数字服务中心（虚构）\n签订日期：2024-02-01\n范围：数据目录、交换任务和实施服务。",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "EVIDENCE_ELIGIBLE",
    "candidate_exclusion_reason": null,
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_PROJECT_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "TOPIC_RELEVANT_ONLY",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": 3,
    "final_eligible": true
  },
  {
    "raw_rank": 12,
    "raw_similarity": 0.503096610123122,
    "material_id": "b472e07b-3065-4645-9b0b-a6abadaa70b7",
    "document_id": "b472e07b-3065-4645-9b0b-a6abadaa70b7",
    "chunk_id": "MCH-268A148B9BD7EA6BF0B470DDE0EA8425",
    "raw_source_text": "项目：北川新区数据协同平台项目（虚构）\n客户：北川新区数字服务中心（虚构）\n验收日期：2024-09-20\n结论：虚构项目约定范围通过验收；不外推至其他环境。",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "EVIDENCE_ELIGIBLE",
    "candidate_exclusion_reason": null,
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_PROJECT_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "TOPIC_RELEVANT_ONLY",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": 4,
    "final_eligible": true
  },
  {
    "raw_rank": 13,
    "raw_similarity": 0.49970918893814087,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-52CC0CDE792C8009A7790CA3F184A28E",
    "raw_source_text": "Customer Private Data externalization",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "LABEL_LIKE_NOUN_PHRASE",
    "substantive_candidate": false,
    "substantive_class": "LABEL_ONLY",
    "substantive_reason": "LABEL_LIKE_NOUN_PHRASE",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "NON_AUDITABLE_CLAIM",
    "source_eligibility_reason": "LOW_SPECIFICITY_CLAIM",
    "requirement_relative_classification": "IRRELEVANT",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 14,
    "raw_similarity": 0.49467182191182335,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-DDCF46F5C7751B5B84EA724E094CBCFB",
    "raw_source_text": "Decision:\nEvidence / Fact / Mapping / Claim Permission\nare separate business layers.",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "CONTROL_PLANE_DERIVED_TEXT",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "CONTROL_PLANE_ARTIFACT",
    "source_eligibility_reason": "CONTROL_PLANE_DERIVED_TEXT",
    "requirement_relative_classification": "IRRELEVANT",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 15,
    "raw_similarity": 0.49002274989810934,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-6E0F7A565A662E6590ED1177FB815E36",
    "raw_source_text": "政企标书 AI 平台。",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "LOW_SPECIFICITY_CLAIM",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "NON_AUDITABLE_CLAIM",
    "source_eligibility_reason": "LOW_SPECIFICITY_CLAIM",
    "requirement_relative_classification": "TOPIC_RELEVANT_ONLY",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 16,
    "raw_similarity": 0.4858574875678139,
    "material_id": "3a49c72a-c8c6-4124-8e78-9812800c9eb3",
    "document_id": "3a49c72a-c8c6-4124-8e78-9812800c9eb3",
    "chunk_id": "MCH-4CD255B113BCA08DB085732B30803FE0",
    "raw_source_text": "REPRESENTATIVE_SYNTHETIC\nNOT_REAL_CUSTOMER_DATA\nmaterial_id: SME-014\nsubject: 澄明数科（示范）有限公司",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "EVAL_METADATA_OR_PROVENANCE",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "EVAL_ARTIFACT",
    "source_eligibility_reason": "EVAL_METADATA_OR_PROVENANCE",
    "requirement_relative_classification": "METADATA_OR_HEADER",
    "requirement_relative_reason_codes": [
      "METADATA_OR_HEADER"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 17,
    "raw_similarity": 0.48584982668458476,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-30CF9829A40D0869FA0E0B7B5582ACDE",
    "raw_source_text": "Provider / Model / Project data scope change",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "STATUS_OR_POLICY_LABEL",
    "substantive_candidate": false,
    "substantive_class": "BOILERPLATE",
    "substantive_reason": "STATUS_OR_POLICY_LABEL",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "INTERNAL_PROCESS_ARTIFACT",
    "source_eligibility_reason": "INTERNAL_PROCESS_TEXT",
    "requirement_relative_classification": "IRRELEVANT",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 18,
    "raw_similarity": 0.48469583644556535,
    "material_id": "74ed566b-18c0-41a1-ba55-59cbe182251c",
    "document_id": "74ed566b-18c0-41a1-ba55-59cbe182251c",
    "chunk_id": "MCH-FD985F70FBE8CB464869FD32A02F08DD",
    "raw_source_text": "REPRESENTATIVE_SYNTHETIC\nNOT_REAL_CUSTOMER_DATA\nmaterial_id: SME-020\nsubject: 澄明数科（示范）有限公司",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "EVAL_METADATA_OR_PROVENANCE",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "EVAL_ARTIFACT",
    "source_eligibility_reason": "EVAL_METADATA_OR_PROVENANCE",
    "requirement_relative_classification": "METADATA_OR_HEADER",
    "requirement_relative_reason_codes": [
      "METADATA_OR_HEADER"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 19,
    "raw_similarity": 0.48440846893737,
    "material_id": "3c81671f-376e-401b-8525-be26929d5b92",
    "document_id": "3c81671f-376e-401b-8525-be26929d5b92",
    "chunk_id": "MCH-D32448917B3E8CAD1214641F8E85D86A",
    "raw_source_text": "REPRESENTATIVE_SYNTHETIC\nNOT_REAL_CUSTOMER_DATA\nmaterial_id: SME-004\nsubject: 澄明数科（示范）有限公司",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "EVAL_METADATA_OR_PROVENANCE",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "EVAL_ARTIFACT",
    "source_eligibility_reason": "EVAL_METADATA_OR_PROVENANCE",
    "requirement_relative_classification": "METADATA_OR_HEADER",
    "requirement_relative_reason_codes": [
      "METADATA_OR_HEADER"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 20,
    "raw_similarity": 0.48404449224472046,
    "material_id": "edc27231-e615-4b30-afcf-c6be41469db3",
    "document_id": "edc27231-e615-4b30-afcf-c6be41469db3",
    "chunk_id": "MCH-E9E21B41FF80EEC1B95691D18E4F84BE",
    "raw_source_text": "REPRESENTATIVE_SYNTHETIC\nNOT_REAL_CUSTOMER_DATA\nmaterial_id: SME-010\nsubject: 澄明数科（示范）有限公司",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "EVAL_METADATA_OR_PROVENANCE",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "EVAL_ARTIFACT",
    "source_eligibility_reason": "EVAL_METADATA_OR_PROVENANCE",
    "requirement_relative_classification": "METADATA_OR_HEADER",
    "requirement_relative_reason_codes": [
      "METADATA_OR_HEADER"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  }
]
```

### Final candidates

```json
[
  {
    "raw_rank": 2,
    "raw_similarity": 0.6545740365982056,
    "material_id": "8821b9fa-2bde-4329-9cbf-908395c1270d",
    "document_id": "8821b9fa-2bde-4329-9cbf-908395c1270d",
    "chunk_id": "MCH-770B6FE8E57173DCC72914CFFB7376F8",
    "raw_source_text": "产品：澄明数据交换平台 V3.2\n能力：REST API 接入、数据目录、交换任务调度、运行日志。\n未声明未列出的协议、吞吐量或 SLA。",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "EVIDENCE_ELIGIBLE",
    "candidate_exclusion_reason": null,
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_TECHNICAL_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "TOPIC_RELEVANT_ONLY",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": 1,
    "final_eligible": true
  },
  {
    "raw_rank": 4,
    "raw_similarity": 0.5710718291359059,
    "material_id": "3c81671f-376e-401b-8525-be26929d5b92",
    "document_id": "3c81671f-376e-401b-8525-be26929d5b92",
    "chunk_id": "MCH-0FBD3599DAF932016F62EB9634B997AF",
    "raw_source_text": "产品：澄明数据交换平台 V3.2\n环境：8 vCPU、32 GB 内存、PostgreSQL 14、千兆局域网\n条件：50 并发、100 万条基准数据、缓存预热后执行 30 分钟\n指标：数据目录查询平均响应时间\n结果：平均 1.4 秒，P95 1.9 秒。\n日期：2025-05-16。",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "EVIDENCE_ELIGIBLE",
    "candidate_exclusion_reason": null,
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_TECHNICAL_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "EVIDENCE_BEARING",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_SUPPORTED"
    ],
    "final_phase_rank": 2,
    "final_eligible": true
  },
  {
    "raw_rank": 11,
    "raw_similarity": 0.503727942927358,
    "material_id": "edc27231-e615-4b30-afcf-c6be41469db3",
    "document_id": "edc27231-e615-4b30-afcf-c6be41469db3",
    "chunk_id": "MCH-3A8FB2B6257892D70EAFEF97417EEB23",
    "raw_source_text": "项目：北川新区数据协同平台项目（虚构）\n双方：澄明数科（示范）有限公司；北川新区数字服务中心（虚构）\n签订日期：2024-02-01\n范围：数据目录、交换任务和实施服务。",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "EVIDENCE_ELIGIBLE",
    "candidate_exclusion_reason": null,
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_PROJECT_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "TOPIC_RELEVANT_ONLY",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": 3,
    "final_eligible": true
  },
  {
    "raw_rank": 12,
    "raw_similarity": 0.503096610123122,
    "material_id": "b472e07b-3065-4645-9b0b-a6abadaa70b7",
    "document_id": "b472e07b-3065-4645-9b0b-a6abadaa70b7",
    "chunk_id": "MCH-268A148B9BD7EA6BF0B470DDE0EA8425",
    "raw_source_text": "项目：北川新区数据协同平台项目（虚构）\n客户：北川新区数字服务中心（虚构）\n验收日期：2024-09-20\n结论：虚构项目约定范围通过验收；不外推至其他环境。",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "EVIDENCE_ELIGIBLE",
    "candidate_exclusion_reason": null,
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_PROJECT_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "TOPIC_RELEVANT_ONLY",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": 4,
    "final_eligible": true
  }
]
```

### Index hygiene

```json
{
  "source_ineligible_in_raw_pool": 10,
  "structural_context_exclusions_in_raw_pool": 16,
  "final_candidate_count": 4,
  "ineligible_before_gold": 0,
  "reference_metadata_occurrences": 0
}
```

---

## V2R-002-PERF-PARTIAL

- Requirement: 企业应证明接口 P95 响应时间不超过 1 秒。
- Status: captured
- Latency: 107 ms
- Raw candidate pool: 20
- Final candidates: 3
- Gold raw rank: 1
- First decision-bearing raw rank: 1

### Raw candidate pool and post-retrieval audit

```json
[
  {
    "raw_rank": 1,
    "raw_similarity": 0.5491645604869995,
    "material_id": "3c81671f-376e-401b-8525-be26929d5b92",
    "document_id": "3c81671f-376e-401b-8525-be26929d5b92",
    "chunk_id": "MCH-0FBD3599DAF932016F62EB9634B997AF",
    "raw_source_text": "产品：澄明数据交换平台 V3.2\n环境：8 vCPU、32 GB 内存、PostgreSQL 14、千兆局域网\n条件：50 并发、100 万条基准数据、缓存预热后执行 30 分钟\n指标：数据目录查询平均响应时间\n结果：平均 1.4 秒，P95 1.9 秒。\n日期：2025-05-16。",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "EVIDENCE_ELIGIBLE",
    "candidate_exclusion_reason": null,
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_TECHNICAL_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "EVIDENCE_BEARING",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_SUPPORTED"
    ],
    "final_phase_rank": 1,
    "final_eligible": true
  },
  {
    "raw_rank": 2,
    "raw_similarity": 0.5277375297389951,
    "material_id": "3c81671f-376e-401b-8525-be26929d5b92",
    "document_id": "3c81671f-376e-401b-8525-be26929d5b92",
    "chunk_id": "MCH-B4FF02295DBB6DCDF6E2763F057076F6",
    "raw_source_text": "# 数据交换平台性能测试记录",
    "chunk_role": "HEADING",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "NON_EVIDENCE_ROLE",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_TECHNICAL_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "METADATA_OR_HEADER",
    "requirement_relative_reason_codes": [
      "METADATA_OR_HEADER"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 3,
    "raw_similarity": 0.5155732938988989,
    "material_id": "7b29cc2e-458c-4ed9-ab5a-81f99a3ddace",
    "document_id": "7b29cc2e-458c-4ed9-ab5a-81f99a3ddace",
    "chunk_id": "MCH-08A2CF3D5D2423E41CECF8BB230F574A",
    "raw_source_text": "企业通常提供工作日 9:00-18:00 服务台、远程诊断和必要时现场支持。\n无经审核的 7×24、5 分钟响应或 99.99% SLA。",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "EVIDENCE_ELIGIBLE",
    "candidate_exclusion_reason": null,
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_TECHNICAL_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "TOPIC_RELEVANT_ONLY",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": 2,
    "final_eligible": true
  },
  {
    "raw_rank": 4,
    "raw_similarity": 0.472814679145813,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-A9CA772011E7045D8F035A43E6681BE8",
    "raw_source_text": "Prompt =\nbackend-owned business instruction,\nversioned independently of model.",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "INTERNAL_PROCESS_TEXT",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "INTERNAL_PROCESS_ARTIFACT",
    "source_eligibility_reason": "INTERNAL_PROCESS_TEXT",
    "requirement_relative_classification": "IRRELEVANT",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 5,
    "raw_similarity": 0.4511462152004242,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-F6FE125F46AD101C81DA541D50D7AE47",
    "raw_source_text": "可控\n可追溯\n可审核\n可修改\n可交付",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "ABSTRACT_VALUE_LIST",
    "substantive_candidate": false,
    "substantive_class": "BOILERPLATE",
    "substantive_reason": "ABSTRACT_VALUE_LIST",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "NON_AUDITABLE_CLAIM",
    "source_eligibility_reason": "LOW_SPECIFICITY_CLAIM",
    "requirement_relative_classification": "IRRELEVANT",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 6,
    "raw_similarity": 0.44523435831069946,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-2A5877154432915455907D6094C3959B",
    "raw_source_text": "用户界面优先回答：",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "KNOWN_LABEL_ONLY",
    "substantive_candidate": false,
    "substantive_class": "LABEL_ONLY",
    "substantive_reason": "KNOWN_LABEL_ONLY",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "INTERNAL_PROCESS_ARTIFACT",
    "source_eligibility_reason": "INTERNAL_PROCESS_TEXT",
    "requirement_relative_classification": "IRRELEVANT",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 7,
    "raw_similarity": 0.44436025619506836,
    "material_id": "8821b9fa-2bde-4329-9cbf-908395c1270d",
    "document_id": "8821b9fa-2bde-4329-9cbf-908395c1270d",
    "chunk_id": "MCH-770B6FE8E57173DCC72914CFFB7376F8",
    "raw_source_text": "产品：澄明数据交换平台 V3.2\n能力：REST API 接入、数据目录、交换任务调度、运行日志。\n未声明未列出的协议、吞吐量或 SLA。",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "EVIDENCE_ELIGIBLE",
    "candidate_exclusion_reason": null,
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_TECHNICAL_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "IRRELEVANT",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": 3,
    "final_eligible": true
  },
  {
    "raw_rank": 8,
    "raw_similarity": 0.444134920835495,
    "material_id": "8821b9fa-2bde-4329-9cbf-908395c1270d",
    "document_id": "8821b9fa-2bde-4329-9cbf-908395c1270d",
    "chunk_id": "MCH-C9F466EAC2C29977E40F4A3BFE38A6E4",
    "raw_source_text": "# 数据交换平台产品说明",
    "chunk_role": "HEADING",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "NON_EVIDENCE_ROLE",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_TECHNICAL_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "METADATA_OR_HEADER",
    "requirement_relative_reason_codes": [
      "METADATA_OR_HEADER"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 9,
    "raw_similarity": 0.44165509939193726,
    "material_id": "c5395bc4-0531-4e6f-9f0c-3562cee0a2f1",
    "document_id": "c5395bc4-0531-4e6f-9f0c-3562cee0a2f1",
    "chunk_id": "MCH-D37B061257382C31A3C757430BDD2CA6",
    "raw_source_text": "# ISO 9001 受控记录",
    "chunk_role": "HEADING",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "NON_EVIDENCE_ROLE",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_QUALIFICATION_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "METADATA_OR_HEADER",
    "requirement_relative_reason_codes": [
      "METADATA_OR_HEADER"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 10,
    "raw_similarity": 0.44138771644903996,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-9F70D2B858350FCFD93FFDA7C66F95DE",
    "raw_source_text": "没有 E2E / Eval / 用户问题证据，\n不要增加复杂架构。",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "INTERNAL_PROCESS_TEXT",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "INTERNAL_PROCESS_ARTIFACT",
    "source_eligibility_reason": "INTERNAL_PROCESS_TEXT",
    "requirement_relative_classification": "IRRELEVANT",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 11,
    "raw_similarity": 0.4377259351178454,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-DDCF46F5C7751B5B84EA724E094CBCFB",
    "raw_source_text": "Decision:\nEvidence / Fact / Mapping / Claim Permission\nare separate business layers.",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "CONTROL_PLANE_DERIVED_TEXT",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "CONTROL_PLANE_ARTIFACT",
    "source_eligibility_reason": "CONTROL_PLANE_DERIVED_TEXT",
    "requirement_relative_classification": "IRRELEVANT",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 12,
    "raw_similarity": 0.4374869465827942,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-555802B2C6B93AE17E478E4ECC99308A",
    "raw_source_text": "核心业务流程真实可用、\n稳定、可审核、可追溯、易操作。",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "LOW_SPECIFICITY_CLAIM",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "NON_AUDITABLE_CLAIM",
    "source_eligibility_reason": "LOW_SPECIFICITY_CLAIM",
    "requirement_relative_classification": "IRRELEVANT",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 13,
    "raw_similarity": 0.43561697389978404,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-9B3CAB55A63FBAA2806BD5521C1FF6BF",
    "raw_source_text": "系统负责确定性传播",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "CONTROL_PLANE_DERIVED_TEXT",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "CONTROL_PLANE_ARTIFACT",
    "source_eligibility_reason": "CONTROL_PLANE_DERIVED_TEXT",
    "requirement_relative_classification": "IRRELEVANT",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 14,
    "raw_similarity": 0.4320729374885559,
    "material_id": "41e26bce-9dcf-4e2d-8270-b5012361cbc9",
    "document_id": "41e26bce-9dcf-4e2d-8270-b5012361cbc9",
    "chunk_id": "MCH-9FE710C2607E0ED6EA6762BA9F0E4871",
    "raw_source_text": "# 交付能力说明",
    "chunk_role": "HEADING",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "NON_EVIDENCE_ROLE",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_TECHNICAL_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "METADATA_OR_HEADER",
    "requirement_relative_reason_codes": [
      "METADATA_OR_HEADER"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 15,
    "raw_similarity": 0.42792609333992004,
    "material_id": "57b9e5fe-9549-42aa-88d5-fccc5c0afe2e",
    "document_id": "57b9e5fe-9549-42aa-88d5-fccc5c0afe2e",
    "chunk_id": "MCH-0820CC5A439CB986C62E46213029CC71",
    "raw_source_text": "# ISO 27001 受控记录",
    "chunk_role": "HEADING",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "NON_EVIDENCE_ROLE",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_QUALIFICATION_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "METADATA_OR_HEADER",
    "requirement_relative_reason_codes": [
      "METADATA_OR_HEADER"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 16,
    "raw_similarity": 0.4267210745860124,
    "material_id": "3f9dacfb-2e48-4796-a477-98c60b506831",
    "document_id": "3f9dacfb-2e48-4796-a477-98c60b506831",
    "chunk_id": "MCH-57FE3B83C106C09B70C731182F48FFA4",
    "raw_source_text": "# 产品兼容性矩阵",
    "chunk_role": "HEADING",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "NON_EVIDENCE_ROLE",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_TECHNICAL_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "METADATA_OR_HEADER",
    "requirement_relative_reason_codes": [
      "METADATA_OR_HEADER"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 17,
    "raw_similarity": 0.4264688618918916,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-E963DFF403E8C8673352C3A42FE096F2",
    "raw_source_text": "P3 — PLANNED",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "STATUS_OR_POLICY_LABEL",
    "substantive_candidate": false,
    "substantive_class": "BOILERPLATE",
    "substantive_reason": "STATUS_OR_POLICY_LABEL",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_BUSINESS_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "EVIDENCE_BEARING",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 18,
    "raw_similarity": 0.4260544776916504,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-AA33E31CB1E95FD98A4FE61518207F35",
    "raw_source_text": "P0",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "STATUS_OR_POLICY_LABEL",
    "substantive_candidate": false,
    "substantive_class": "BOILERPLATE",
    "substantive_reason": "STATUS_OR_POLICY_LABEL",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "NON_AUDITABLE_CLAIM",
    "source_eligibility_reason": "LOW_SPECIFICITY_CLAIM",
    "requirement_relative_classification": "EVIDENCE_BEARING",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 19,
    "raw_similarity": 0.42520394921302795,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-B17B19F31A9ECF45AFF293B874DF8A14",
    "raw_source_text": "核心链路问题优先于所有后续功能。",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "INTERNAL_PROCESS_TEXT",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "INTERNAL_PROCESS_ARTIFACT",
    "source_eligibility_reason": "INTERNAL_PROCESS_TEXT",
    "requirement_relative_classification": "IRRELEVANT",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 20,
    "raw_similarity": 0.42471766471862793,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-889DDF9919EF0E6485406DAB6A159A11",
    "raw_source_text": "SUPPORTED\n→ 材料已满足",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "SYSTEM_DERIVED_TEXT",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "SYSTEM_DERIVED_ARTIFACT",
    "source_eligibility_reason": "SYSTEM_DERIVED_TEXT",
    "requirement_relative_classification": "IRRELEVANT",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  }
]
```

### Final candidates

```json
[
  {
    "raw_rank": 1,
    "raw_similarity": 0.5491645604869995,
    "material_id": "3c81671f-376e-401b-8525-be26929d5b92",
    "document_id": "3c81671f-376e-401b-8525-be26929d5b92",
    "chunk_id": "MCH-0FBD3599DAF932016F62EB9634B997AF",
    "raw_source_text": "产品：澄明数据交换平台 V3.2\n环境：8 vCPU、32 GB 内存、PostgreSQL 14、千兆局域网\n条件：50 并发、100 万条基准数据、缓存预热后执行 30 分钟\n指标：数据目录查询平均响应时间\n结果：平均 1.4 秒，P95 1.9 秒。\n日期：2025-05-16。",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "EVIDENCE_ELIGIBLE",
    "candidate_exclusion_reason": null,
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_TECHNICAL_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "EVIDENCE_BEARING",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_SUPPORTED"
    ],
    "final_phase_rank": 1,
    "final_eligible": true
  },
  {
    "raw_rank": 3,
    "raw_similarity": 0.5155732938988989,
    "material_id": "7b29cc2e-458c-4ed9-ab5a-81f99a3ddace",
    "document_id": "7b29cc2e-458c-4ed9-ab5a-81f99a3ddace",
    "chunk_id": "MCH-08A2CF3D5D2423E41CECF8BB230F574A",
    "raw_source_text": "企业通常提供工作日 9:00-18:00 服务台、远程诊断和必要时现场支持。\n无经审核的 7×24、5 分钟响应或 99.99% SLA。",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "EVIDENCE_ELIGIBLE",
    "candidate_exclusion_reason": null,
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_TECHNICAL_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "TOPIC_RELEVANT_ONLY",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": 2,
    "final_eligible": true
  },
  {
    "raw_rank": 7,
    "raw_similarity": 0.44436025619506836,
    "material_id": "8821b9fa-2bde-4329-9cbf-908395c1270d",
    "document_id": "8821b9fa-2bde-4329-9cbf-908395c1270d",
    "chunk_id": "MCH-770B6FE8E57173DCC72914CFFB7376F8",
    "raw_source_text": "产品：澄明数据交换平台 V3.2\n能力：REST API 接入、数据目录、交换任务调度、运行日志。\n未声明未列出的协议、吞吐量或 SLA。",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "EVIDENCE_ELIGIBLE",
    "candidate_exclusion_reason": null,
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_TECHNICAL_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "IRRELEVANT",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": 3,
    "final_eligible": true
  }
]
```

### Index hygiene

```json
{
  "source_ineligible_in_raw_pool": 10,
  "structural_context_exclusions_in_raw_pool": 17,
  "final_candidate_count": 3,
  "ineligible_before_gold": 0,
  "reference_metadata_occurrences": 0
}
```

---

## V2R-003-COMP-DIRECT

- Requirement: 企业应说明产品在 x86_64、Ubuntu 和 PostgreSQL 环境的兼容性。
- Status: captured
- Latency: 103 ms
- Raw candidate pool: 20
- Final candidates: 2
- Gold raw rank: 1
- First decision-bearing raw rank: 1

### Raw candidate pool and post-retrieval audit

```json
[
  {
    "raw_rank": 1,
    "raw_similarity": 0.7036605234550806,
    "material_id": "3f9dacfb-2e48-4796-a477-98c60b506831",
    "document_id": "3f9dacfb-2e48-4796-a477-98c60b506831",
    "chunk_id": "MCH-7F11A857F9B5A05D9B22E30CD4F1BEE0",
    "raw_source_text": "x86_64 + Ubuntu 22.04 + PostgreSQL 14：tested\n鲲鹏 920 + 麒麟 V10 + 达梦 8：partially_tested（完成安装和基础交换用例，未完成压力测试）\n海光 + 统信 UOS + 人大金仓：not_verified\n国产数据库组合：unknown",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "EVIDENCE_ELIGIBLE",
    "candidate_exclusion_reason": null,
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_TECHNICAL_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "EVIDENCE_BEARING",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_SUPPORTED"
    ],
    "final_phase_rank": 1,
    "final_eligible": true
  },
  {
    "raw_rank": 2,
    "raw_similarity": 0.6561677651455405,
    "material_id": "3f9dacfb-2e48-4796-a477-98c60b506831",
    "document_id": "3f9dacfb-2e48-4796-a477-98c60b506831",
    "chunk_id": "MCH-57FE3B83C106C09B70C731182F48FFA4",
    "raw_source_text": "# 产品兼容性矩阵",
    "chunk_role": "HEADING",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "NON_EVIDENCE_ROLE",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_TECHNICAL_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "METADATA_OR_HEADER",
    "requirement_relative_reason_codes": [
      "METADATA_OR_HEADER"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 3,
    "raw_similarity": 0.5235348315793477,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-238ABC8850F42BCC571A0913A7E2AF08",
    "raw_source_text": "优先成熟 MIT / Apache-2.0 等兼容开源组件。",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "INTERNAL_PROCESS_TEXT",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "INTERNAL_PROCESS_ARTIFACT",
    "source_eligibility_reason": "INTERNAL_PROCESS_TEXT",
    "requirement_relative_classification": "TOPIC_RELEVANT_ONLY",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 4,
    "raw_similarity": 0.5070773354676562,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-7251629B4230317EE57F8F2659926A1F",
    "raw_source_text": "企业软件基础能力，\n安全、够用。",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "LOW_SPECIFICITY_CLAIM",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "NON_AUDITABLE_CLAIM",
    "source_eligibility_reason": "LOW_SPECIFICITY_CLAIM",
    "requirement_relative_classification": "TOPIC_RELEVANT_ONLY",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 5,
    "raw_similarity": 0.5034373698569921,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-889DDF9919EF0E6485406DAB6A159A11",
    "raw_source_text": "SUPPORTED\n→ 材料已满足",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "SYSTEM_DERIVED_TEXT",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "SYSTEM_DERIVED_ARTIFACT",
    "source_eligibility_reason": "SYSTEM_DERIVED_TEXT",
    "requirement_relative_classification": "IRRELEVANT",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 6,
    "raw_similarity": 0.5020534393723679,
    "material_id": "3c81671f-376e-401b-8525-be26929d5b92",
    "document_id": "3c81671f-376e-401b-8525-be26929d5b92",
    "chunk_id": "MCH-0FBD3599DAF932016F62EB9634B997AF",
    "raw_source_text": "产品：澄明数据交换平台 V3.2\n环境：8 vCPU、32 GB 内存、PostgreSQL 14、千兆局域网\n条件：50 并发、100 万条基准数据、缓存预热后执行 30 分钟\n指标：数据目录查询平均响应时间\n结果：平均 1.4 秒，P95 1.9 秒。\n日期：2025-05-16。",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "EVIDENCE_ELIGIBLE",
    "candidate_exclusion_reason": null,
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_TECHNICAL_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "TOPIC_RELEVANT_ONLY",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": 2,
    "final_eligible": true
  },
  {
    "raw_rank": 7,
    "raw_similarity": 0.49322542507800804,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-10C2129A5D37AB29824CE98DF6E32F0D",
    "raw_source_text": "Primary\nSupporting\nAudit / Technical",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "INTERNAL_PROCESS_TEXT",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "INTERNAL_PROCESS_ARTIFACT",
    "source_eligibility_reason": "INTERNAL_PROCESS_TEXT",
    "requirement_relative_classification": "IRRELEVANT",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 8,
    "raw_similarity": 0.49202448272267385,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-650DE173A9B8AA958EEB850251D70FE2",
    "raw_source_text": "Ensure:",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "KNOWN_LABEL_ONLY",
    "substantive_candidate": false,
    "substantive_class": "LABEL_ONLY",
    "substantive_reason": "KNOWN_LABEL_ONLY",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "NON_AUDITABLE_CLAIM",
    "source_eligibility_reason": "LOW_SPECIFICITY_CLAIM",
    "requirement_relative_classification": "IRRELEVANT",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 9,
    "raw_similarity": 0.49198529124260304,
    "material_id": "3c81671f-376e-401b-8525-be26929d5b92",
    "document_id": "3c81671f-376e-401b-8525-be26929d5b92",
    "chunk_id": "MCH-B4FF02295DBB6DCDF6E2763F057076F6",
    "raw_source_text": "# 数据交换平台性能测试记录",
    "chunk_role": "HEADING",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "NON_EVIDENCE_ROLE",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_TECHNICAL_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "METADATA_OR_HEADER",
    "requirement_relative_reason_codes": [
      "METADATA_OR_HEADER"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 10,
    "raw_similarity": 0.48965182962108766,
    "material_id": "8821b9fa-2bde-4329-9cbf-908395c1270d",
    "document_id": "8821b9fa-2bde-4329-9cbf-908395c1270d",
    "chunk_id": "MCH-C9F466EAC2C29977E40F4A3BFE38A6E4",
    "raw_source_text": "# 数据交换平台产品说明",
    "chunk_role": "HEADING",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "NON_EVIDENCE_ROLE",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_TECHNICAL_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "METADATA_OR_HEADER",
    "requirement_relative_reason_codes": [
      "METADATA_OR_HEADER"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 11,
    "raw_similarity": 0.48804295134288456,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-631BC2CA11EF7F634D9FADB7A3A764B3",
    "raw_source_text": "docx\ndocx-templates\n兼容许可的成熟实现。",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "INTERNAL_PROCESS_TEXT",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "INTERNAL_PROCESS_ARTIFACT",
    "source_eligibility_reason": "INTERNAL_PROCESS_TEXT",
    "requirement_relative_classification": "TOPIC_RELEVANT_ONLY",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 12,
    "raw_similarity": 0.484377951361064,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-77CE3E3DD5C828887DC6CBC2B67CD9BD",
    "raw_source_text": "D. Open Source Policy",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "KNOWN_LABEL_ONLY",
    "substantive_candidate": false,
    "substantive_class": "LABEL_ONLY",
    "substantive_reason": "KNOWN_LABEL_ONLY",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "INTERNAL_PROCESS_ARTIFACT",
    "source_eligibility_reason": "INTERNAL_PROCESS_TEXT",
    "requirement_relative_classification": "IRRELEVANT",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 13,
    "raw_similarity": 0.48225252383194983,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-8D8E6DEED2728713414578C20C3BEB12",
    "raw_source_text": "Unknown automatically upgraded",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "STATUS_OR_POLICY_LABEL",
    "substantive_candidate": false,
    "substantive_class": "BOILERPLATE",
    "substantive_reason": "STATUS_OR_POLICY_LABEL",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "NON_AUDITABLE_CLAIM",
    "source_eligibility_reason": "LOW_SPECIFICITY_CLAIM",
    "requirement_relative_classification": "IRRELEVANT",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 14,
    "raw_similarity": 0.4820098589652869,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-B73C33CB10B6F50BB313418C65735B71",
    "raw_source_text": "Keycloak / compatible IdP。",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "INTERNAL_PROCESS_TEXT",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "INTERNAL_PROCESS_ARTIFACT",
    "source_eligibility_reason": "INTERNAL_PROCESS_TEXT",
    "requirement_relative_classification": "IRRELEVANT",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 15,
    "raw_similarity": 0.47626266024931396,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-2C953B6DF28287F832936576CCA2EB2D",
    "raw_source_text": "AGPL:\nREFERENCE_ONLY by default.",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "INTERNAL_PROCESS_TEXT",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "INTERNAL_PROCESS_ARTIFACT",
    "source_eligibility_reason": "INTERNAL_PROCESS_TEXT",
    "requirement_relative_classification": "IRRELEVANT",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 16,
    "raw_similarity": 0.46301942843315325,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-100E24B05482CB58EF735205603EBBF1",
    "raw_source_text": "CORE BID PRODUCT FLOW",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "KNOWN_LABEL_ONLY",
    "substantive_candidate": false,
    "substantive_class": "LABEL_ONLY",
    "substantive_reason": "KNOWN_LABEL_ONLY",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "NON_AUDITABLE_CLAIM",
    "source_eligibility_reason": "LOW_SPECIFICITY_CLAIM",
    "requirement_relative_classification": "IRRELEVANT",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 17,
    "raw_similarity": 0.4629885278351,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-F19555DDB9A3CE4B924909683404FE8C",
    "raw_source_text": "005-open-source-reuse.md",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "STATUS_OR_POLICY_LABEL",
    "substantive_candidate": false,
    "substantive_class": "BOILERPLATE",
    "substantive_reason": "STATUS_OR_POLICY_LABEL",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "NON_AUDITABLE_CLAIM",
    "source_eligibility_reason": "LOW_SPECIFICITY_CLAIM",
    "requirement_relative_classification": "IRRELEVANT",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 18,
    "raw_similarity": 0.4628466710035001,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-D39B57E75A9DF6AB623AC2D8B109B2A7",
    "raw_source_text": "Architecture source-of-truth location",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "KNOWN_LABEL_ONLY",
    "substantive_candidate": false,
    "substantive_class": "LABEL_ONLY",
    "substantive_reason": "KNOWN_LABEL_ONLY",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "CONTROL_PLANE_ARTIFACT",
    "source_eligibility_reason": "CONTROL_PLANE_DERIVED_TEXT",
    "requirement_relative_classification": "IRRELEVANT",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 19,
    "raw_similarity": 0.46036333318193756,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-9F70D2B858350FCFD93FFDA7C66F95DE",
    "raw_source_text": "没有 E2E / Eval / 用户问题证据，\n不要增加复杂架构。",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "INTERNAL_PROCESS_TEXT",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "INTERNAL_PROCESS_ARTIFACT",
    "source_eligibility_reason": "INTERNAL_PROCESS_TEXT",
    "requirement_relative_classification": "TOPIC_RELEVANT_ONLY",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 20,
    "raw_similarity": 0.4564427001344371,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-C76DB22C55B4C2E8CEC6A464F590DD4E",
    "raw_source_text": "技术 enum/code\n只在高级/审计详情显示。",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "INTERNAL_PROCESS_TEXT",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "INTERNAL_PROCESS_ARTIFACT",
    "source_eligibility_reason": "INTERNAL_PROCESS_TEXT",
    "requirement_relative_classification": "IRRELEVANT",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  }
]
```

### Final candidates

```json
[
  {
    "raw_rank": 1,
    "raw_similarity": 0.7036605234550806,
    "material_id": "3f9dacfb-2e48-4796-a477-98c60b506831",
    "document_id": "3f9dacfb-2e48-4796-a477-98c60b506831",
    "chunk_id": "MCH-7F11A857F9B5A05D9B22E30CD4F1BEE0",
    "raw_source_text": "x86_64 + Ubuntu 22.04 + PostgreSQL 14：tested\n鲲鹏 920 + 麒麟 V10 + 达梦 8：partially_tested（完成安装和基础交换用例，未完成压力测试）\n海光 + 统信 UOS + 人大金仓：not_verified\n国产数据库组合：unknown",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "EVIDENCE_ELIGIBLE",
    "candidate_exclusion_reason": null,
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_TECHNICAL_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "EVIDENCE_BEARING",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_SUPPORTED"
    ],
    "final_phase_rank": 1,
    "final_eligible": true
  },
  {
    "raw_rank": 6,
    "raw_similarity": 0.5020534393723679,
    "material_id": "3c81671f-376e-401b-8525-be26929d5b92",
    "document_id": "3c81671f-376e-401b-8525-be26929d5b92",
    "chunk_id": "MCH-0FBD3599DAF932016F62EB9634B997AF",
    "raw_source_text": "产品：澄明数据交换平台 V3.2\n环境：8 vCPU、32 GB 内存、PostgreSQL 14、千兆局域网\n条件：50 并发、100 万条基准数据、缓存预热后执行 30 分钟\n指标：数据目录查询平均响应时间\n结果：平均 1.4 秒，P95 1.9 秒。\n日期：2025-05-16。",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "EVIDENCE_ELIGIBLE",
    "candidate_exclusion_reason": null,
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_TECHNICAL_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "TOPIC_RELEVANT_ONLY",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": 2,
    "final_eligible": true
  }
]
```

### Index hygiene

```json
{
  "source_ineligible_in_raw_pool": 15,
  "structural_context_exclusions_in_raw_pool": 18,
  "final_candidate_count": 2,
  "ineligible_before_gold": 0,
  "reference_metadata_occurrences": 0
}
```

---

## V2R-004-COMP-PARTIAL

- Requirement: 企业应证明所有国产数据库组合均已完成压力测试。
- Status: captured
- Latency: 99 ms
- Raw candidate pool: 20
- Final candidates: 4
- Gold raw rank: 1
- First decision-bearing raw rank: 1

### Raw candidate pool and post-retrieval audit

```json
[
  {
    "raw_rank": 1,
    "raw_similarity": 0.7040744600251652,
    "material_id": "3f9dacfb-2e48-4796-a477-98c60b506831",
    "document_id": "3f9dacfb-2e48-4796-a477-98c60b506831",
    "chunk_id": "MCH-7F11A857F9B5A05D9B22E30CD4F1BEE0",
    "raw_source_text": "x86_64 + Ubuntu 22.04 + PostgreSQL 14：tested\n鲲鹏 920 + 麒麟 V10 + 达梦 8：partially_tested（完成安装和基础交换用例，未完成压力测试）\n海光 + 统信 UOS + 人大金仓：not_verified\n国产数据库组合：unknown",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "EVIDENCE_ELIGIBLE",
    "candidate_exclusion_reason": null,
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_TECHNICAL_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "EVIDENCE_BEARING",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_SUPPORTED"
    ],
    "final_phase_rank": 1,
    "final_eligible": true
  },
  {
    "raw_rank": 2,
    "raw_similarity": 0.5661619047023011,
    "material_id": "3c81671f-376e-401b-8525-be26929d5b92",
    "document_id": "3c81671f-376e-401b-8525-be26929d5b92",
    "chunk_id": "MCH-B4FF02295DBB6DCDF6E2763F057076F6",
    "raw_source_text": "# 数据交换平台性能测试记录",
    "chunk_role": "HEADING",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "NON_EVIDENCE_ROLE",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_TECHNICAL_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "METADATA_OR_HEADER",
    "requirement_relative_reason_codes": [
      "METADATA_OR_HEADER"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 3,
    "raw_similarity": 0.49553072452545166,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-6BA94F47BCD831E596F751A2BEA49AB8",
    "raw_source_text": "commit 前：\n相关 tests PASS。",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "INTERNAL_PROCESS_TEXT",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "INTERNAL_PROCESS_ARTIFACT",
    "source_eligibility_reason": "INTERNAL_PROCESS_TEXT",
    "requirement_relative_classification": "IRRELEVANT",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 4,
    "raw_similarity": 0.49169252738588,
    "material_id": "3f9dacfb-2e48-4796-a477-98c60b506831",
    "document_id": "3f9dacfb-2e48-4796-a477-98c60b506831",
    "chunk_id": "MCH-57FE3B83C106C09B70C731182F48FFA4",
    "raw_source_text": "# 产品兼容性矩阵",
    "chunk_role": "HEADING",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "NON_EVIDENCE_ROLE",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_TECHNICAL_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "METADATA_OR_HEADER",
    "requirement_relative_reason_codes": [
      "METADATA_OR_HEADER"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 5,
    "raw_similarity": 0.4748999789416811,
    "material_id": "3c81671f-376e-401b-8525-be26929d5b92",
    "document_id": "3c81671f-376e-401b-8525-be26929d5b92",
    "chunk_id": "MCH-0FBD3599DAF932016F62EB9634B997AF",
    "raw_source_text": "产品：澄明数据交换平台 V3.2\n环境：8 vCPU、32 GB 内存、PostgreSQL 14、千兆局域网\n条件：50 并发、100 万条基准数据、缓存预热后执行 30 分钟\n指标：数据目录查询平均响应时间\n结果：平均 1.4 秒，P95 1.9 秒。\n日期：2025-05-16。",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "EVIDENCE_ELIGIBLE",
    "candidate_exclusion_reason": null,
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_TECHNICAL_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "TOPIC_RELEVANT_ONLY",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": 2,
    "final_eligible": true
  },
  {
    "raw_rank": 6,
    "raw_similarity": 0.4634121700033972,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-650DE173A9B8AA958EEB850251D70FE2",
    "raw_source_text": "Ensure:",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "KNOWN_LABEL_ONLY",
    "substantive_candidate": false,
    "substantive_class": "LABEL_ONLY",
    "substantive_reason": "KNOWN_LABEL_ONLY",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "NON_AUDITABLE_CLAIM",
    "source_eligibility_reason": "LOW_SPECIFICITY_CLAIM",
    "requirement_relative_classification": "IRRELEVANT",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 7,
    "raw_similarity": 0.4578753113746643,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-2684A33DDF84C68B4CA59C348136BB30",
    "raw_source_text": "当前直接相关代码和测试。",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "INTERNAL_PROCESS_TEXT",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "INTERNAL_PROCESS_ARTIFACT",
    "source_eligibility_reason": "INTERNAL_PROCESS_TEXT",
    "requirement_relative_classification": "TOPIC_RELEVANT_ONLY",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 8,
    "raw_similarity": 0.456261545419693,
    "material_id": "57b9e5fe-9549-42aa-88d5-fccc5c0afe2e",
    "document_id": "57b9e5fe-9549-42aa-88d5-fccc5c0afe2e",
    "chunk_id": "MCH-0820CC5A439CB986C62E46213029CC71",
    "raw_source_text": "# ISO 27001 受控记录",
    "chunk_role": "HEADING",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "NON_EVIDENCE_ROLE",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_QUALIFICATION_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "METADATA_OR_HEADER",
    "requirement_relative_reason_codes": [
      "METADATA_OR_HEADER"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 9,
    "raw_similarity": 0.45404401695466023,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-7251629B4230317EE57F8F2659926A1F",
    "raw_source_text": "企业软件基础能力，\n安全、够用。",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "LOW_SPECIFICITY_CLAIM",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "NON_AUDITABLE_CLAIM",
    "source_eligibility_reason": "LOW_SPECIFICITY_CLAIM",
    "requirement_relative_classification": "TOPIC_RELEVANT_ONLY",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 10,
    "raw_similarity": 0.4523088335990906,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-889DDF9919EF0E6485406DAB6A159A11",
    "raw_source_text": "SUPPORTED\n→ 材料已满足",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "SYSTEM_DERIVED_TEXT",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "SYSTEM_DERIVED_ARTIFACT",
    "source_eligibility_reason": "SYSTEM_DERIVED_TEXT",
    "requirement_relative_classification": "IRRELEVANT",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 11,
    "raw_similarity": 0.44927087728554826,
    "material_id": "b472e07b-3065-4645-9b0b-a6abadaa70b7",
    "document_id": "b472e07b-3065-4645-9b0b-a6abadaa70b7",
    "chunk_id": "MCH-268A148B9BD7EA6BF0B470DDE0EA8425",
    "raw_source_text": "项目：北川新区数据协同平台项目（虚构）\n客户：北川新区数字服务中心（虚构）\n验收日期：2024-09-20\n结论：虚构项目约定范围通过验收；不外推至其他环境。",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "EVIDENCE_ELIGIBLE",
    "candidate_exclusion_reason": null,
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_PROJECT_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "TOPIC_RELEVANT_ONLY",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": 3,
    "final_eligible": true
  },
  {
    "raw_rank": 12,
    "raw_similarity": 0.43510189265620147,
    "material_id": "74ed566b-18c0-41a1-ba55-59cbe182251c",
    "document_id": "74ed566b-18c0-41a1-ba55-59cbe182251c",
    "chunk_id": "MCH-70376020855F97D43106A81E5F040C7F",
    "raw_source_text": "企业持有在有效期内的 ISO/IEC 27001 受控记录。该事实不证明任一产品已实现特定安全等级、等保级别或具体安全功能。",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "EVIDENCE_ELIGIBLE",
    "candidate_exclusion_reason": null,
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_TECHNICAL_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "TOPIC_RELEVANT_ONLY",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": 4,
    "final_eligible": true
  },
  {
    "raw_rank": 13,
    "raw_similarity": 0.43485557256407725,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-10C2129A5D37AB29824CE98DF6E32F0D",
    "raw_source_text": "Primary\nSupporting\nAudit / Technical",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "INTERNAL_PROCESS_TEXT",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "INTERNAL_PROCESS_ARTIFACT",
    "source_eligibility_reason": "INTERNAL_PROCESS_TEXT",
    "requirement_relative_classification": "IRRELEVANT",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 14,
    "raw_similarity": 0.4335419873272196,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-363BD137AFF31336472D4E7F4F537C8F",
    "raw_source_text": "NO_EVIDENCE\n→ 缺少证明材料",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "SYSTEM_DERIVED_TEXT",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "SYSTEM_DERIVED_ARTIFACT",
    "source_eligibility_reason": "SYSTEM_DERIVED_TEXT",
    "requirement_relative_classification": "TOPIC_RELEVANT_ONLY",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 15,
    "raw_similarity": 0.433229718611854,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-DDCF46F5C7751B5B84EA724E094CBCFB",
    "raw_source_text": "Decision:\nEvidence / Fact / Mapping / Claim Permission\nare separate business layers.",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "CONTROL_PLANE_DERIVED_TEXT",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "CONTROL_PLANE_ARTIFACT",
    "source_eligibility_reason": "CONTROL_PLANE_DERIVED_TEXT",
    "requirement_relative_classification": "IRRELEVANT",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 16,
    "raw_similarity": 0.4317475042644169,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-107E91200B42880F817E8A10EAAC2CE5",
    "raw_source_text": "不要自研：",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "KNOWN_LABEL_ONLY",
    "substantive_candidate": false,
    "substantive_class": "LABEL_ONLY",
    "substantive_reason": "KNOWN_LABEL_ONLY",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "INTERNAL_PROCESS_ARTIFACT",
    "source_eligibility_reason": "INTERNAL_PROCESS_TEXT",
    "requirement_relative_classification": "IRRELEVANT",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 17,
    "raw_similarity": 0.4316388111329794,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-9B3CAB55A63FBAA2806BD5521C1FF6BF",
    "raw_source_text": "系统负责确定性传播",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "CONTROL_PLANE_DERIVED_TEXT",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "CONTROL_PLANE_ARTIFACT",
    "source_eligibility_reason": "CONTROL_PLANE_DERIVED_TEXT",
    "requirement_relative_classification": "IRRELEVANT",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 18,
    "raw_similarity": 0.43059787154197693,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-6C5184095004206B21BD148F5A31242B",
    "raw_source_text": "检查仓库是否已经存在：",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "VALUE_MISSING_AFTER_LABEL",
    "substantive_candidate": false,
    "substantive_class": "INCOMPLETE_CLAUSE",
    "substantive_reason": "VALUE_MISSING_AFTER_LABEL",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "INTERNAL_PROCESS_ARTIFACT",
    "source_eligibility_reason": "INTERNAL_PROCESS_TEXT",
    "requirement_relative_classification": "IRRELEVANT",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 19,
    "raw_similarity": 0.42875236697480945,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-5B3A5D4F1299B7E362FE0D195F33C161",
    "raw_source_text": "记录已经验证的核心原则：",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "KNOWN_LABEL_ONLY",
    "substantive_candidate": false,
    "substantive_class": "LABEL_ONLY",
    "substantive_reason": "KNOWN_LABEL_ONLY",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_BUSINESS_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "IRRELEVANT",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 20,
    "raw_similarity": 0.4273471236228943,
    "material_id": "b472e07b-3065-4645-9b0b-a6abadaa70b7",
    "document_id": "b472e07b-3065-4645-9b0b-a6abadaa70b7",
    "chunk_id": "MCH-DEA320F82E7EEC727D332134D9C2E87A",
    "raw_source_text": "# 项目A验收记录",
    "chunk_role": "HEADING",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "NON_EVIDENCE_ROLE",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_PROJECT_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "METADATA_OR_HEADER",
    "requirement_relative_reason_codes": [
      "METADATA_OR_HEADER"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  }
]
```

### Final candidates

```json
[
  {
    "raw_rank": 1,
    "raw_similarity": 0.7040744600251652,
    "material_id": "3f9dacfb-2e48-4796-a477-98c60b506831",
    "document_id": "3f9dacfb-2e48-4796-a477-98c60b506831",
    "chunk_id": "MCH-7F11A857F9B5A05D9B22E30CD4F1BEE0",
    "raw_source_text": "x86_64 + Ubuntu 22.04 + PostgreSQL 14：tested\n鲲鹏 920 + 麒麟 V10 + 达梦 8：partially_tested（完成安装和基础交换用例，未完成压力测试）\n海光 + 统信 UOS + 人大金仓：not_verified\n国产数据库组合：unknown",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "EVIDENCE_ELIGIBLE",
    "candidate_exclusion_reason": null,
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_TECHNICAL_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "EVIDENCE_BEARING",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_SUPPORTED"
    ],
    "final_phase_rank": 1,
    "final_eligible": true
  },
  {
    "raw_rank": 5,
    "raw_similarity": 0.4748999789416811,
    "material_id": "3c81671f-376e-401b-8525-be26929d5b92",
    "document_id": "3c81671f-376e-401b-8525-be26929d5b92",
    "chunk_id": "MCH-0FBD3599DAF932016F62EB9634B997AF",
    "raw_source_text": "产品：澄明数据交换平台 V3.2\n环境：8 vCPU、32 GB 内存、PostgreSQL 14、千兆局域网\n条件：50 并发、100 万条基准数据、缓存预热后执行 30 分钟\n指标：数据目录查询平均响应时间\n结果：平均 1.4 秒，P95 1.9 秒。\n日期：2025-05-16。",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "EVIDENCE_ELIGIBLE",
    "candidate_exclusion_reason": null,
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_TECHNICAL_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "TOPIC_RELEVANT_ONLY",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": 2,
    "final_eligible": true
  },
  {
    "raw_rank": 11,
    "raw_similarity": 0.44927087728554826,
    "material_id": "b472e07b-3065-4645-9b0b-a6abadaa70b7",
    "document_id": "b472e07b-3065-4645-9b0b-a6abadaa70b7",
    "chunk_id": "MCH-268A148B9BD7EA6BF0B470DDE0EA8425",
    "raw_source_text": "项目：北川新区数据协同平台项目（虚构）\n客户：北川新区数字服务中心（虚构）\n验收日期：2024-09-20\n结论：虚构项目约定范围通过验收；不外推至其他环境。",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "EVIDENCE_ELIGIBLE",
    "candidate_exclusion_reason": null,
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_PROJECT_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "TOPIC_RELEVANT_ONLY",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": 3,
    "final_eligible": true
  },
  {
    "raw_rank": 12,
    "raw_similarity": 0.43510189265620147,
    "material_id": "74ed566b-18c0-41a1-ba55-59cbe182251c",
    "document_id": "74ed566b-18c0-41a1-ba55-59cbe182251c",
    "chunk_id": "MCH-70376020855F97D43106A81E5F040C7F",
    "raw_source_text": "企业持有在有效期内的 ISO/IEC 27001 受控记录。该事实不证明任一产品已实现特定安全等级、等保级别或具体安全功能。",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "EVIDENCE_ELIGIBLE",
    "candidate_exclusion_reason": null,
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_TECHNICAL_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "TOPIC_RELEVANT_ONLY",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": 4,
    "final_eligible": true
  }
]
```

### Index hygiene

```json
{
  "source_ineligible_in_raw_pool": 11,
  "structural_context_exclusions_in_raw_pool": 16,
  "final_candidate_count": 4,
  "ineligible_before_gold": 0,
  "reference_metadata_occurrences": 0
}
```

---

## V2R-005-ISO-DIRECT

- Requirement: 企业应提供当前有效的 ISO/IEC 27001 认证信息。
- Status: captured
- Latency: 104 ms
- Raw candidate pool: 20
- Final candidates: 3
- Gold raw rank: 2
- First decision-bearing raw rank: 1

### Raw candidate pool and post-retrieval audit

```json
[
  {
    "raw_rank": 1,
    "raw_similarity": 0.7175531387329153,
    "material_id": "74ed566b-18c0-41a1-ba55-59cbe182251c",
    "document_id": "74ed566b-18c0-41a1-ba55-59cbe182251c",
    "chunk_id": "MCH-70376020855F97D43106A81E5F040C7F",
    "raw_source_text": "企业持有在有效期内的 ISO/IEC 27001 受控记录。该事实不证明任一产品已实现特定安全等级、等保级别或具体安全功能。",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "EVIDENCE_ELIGIBLE",
    "candidate_exclusion_reason": null,
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_TECHNICAL_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "EVIDENCE_BEARING",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_SUPPORTED"
    ],
    "final_phase_rank": 1,
    "final_eligible": true
  },
  {
    "raw_rank": 2,
    "raw_similarity": 0.6661979755045202,
    "material_id": "57b9e5fe-9549-42aa-88d5-fccc5c0afe2e",
    "document_id": "57b9e5fe-9549-42aa-88d5-fccc5c0afe2e",
    "chunk_id": "MCH-A4C2632EF9126FADD349C3004E1C2D84",
    "raw_source_text": "名称：ISO/IEC 27001\n编号：CM-Q-27001-2024\n状态：active\n有效至：2027-11-30",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "EVIDENCE_ELIGIBLE",
    "candidate_exclusion_reason": null,
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_QUALIFICATION_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "EVIDENCE_BEARING",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_SUPPORTED"
    ],
    "final_phase_rank": 2,
    "final_eligible": true
  },
  {
    "raw_rank": 3,
    "raw_similarity": 0.6532460061761148,
    "material_id": "57b9e5fe-9549-42aa-88d5-fccc5c0afe2e",
    "document_id": "57b9e5fe-9549-42aa-88d5-fccc5c0afe2e",
    "chunk_id": "MCH-0820CC5A439CB986C62E46213029CC71",
    "raw_source_text": "# ISO 27001 受控记录",
    "chunk_role": "HEADING",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "NON_EVIDENCE_ROLE",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_QUALIFICATION_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "METADATA_OR_HEADER",
    "requirement_relative_reason_codes": [
      "METADATA_OR_HEADER"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 4,
    "raw_similarity": 0.6045245763942863,
    "material_id": "c5395bc4-0531-4e6f-9f0c-3562cee0a2f1",
    "document_id": "c5395bc4-0531-4e6f-9f0c-3562cee0a2f1",
    "chunk_id": "MCH-D37B061257382C31A3C757430BDD2CA6",
    "raw_source_text": "# ISO 9001 受控记录",
    "chunk_role": "HEADING",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "NON_EVIDENCE_ROLE",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_QUALIFICATION_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "METADATA_OR_HEADER",
    "requirement_relative_reason_codes": [
      "METADATA_OR_HEADER"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 5,
    "raw_similarity": 0.5497893363362956,
    "material_id": "c5395bc4-0531-4e6f-9f0c-3562cee0a2f1",
    "document_id": "c5395bc4-0531-4e6f-9f0c-3562cee0a2f1",
    "chunk_id": "MCH-A160D3E488BD50C27E5F6267363E57B1",
    "raw_source_text": "名称：ISO 9001\n编号：CM-Q-9001-2025\n状态：active\n有效至：2028-03-31",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "EVIDENCE_ELIGIBLE",
    "candidate_exclusion_reason": null,
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_QUALIFICATION_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "TOPIC_RELEVANT_ONLY",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": 3,
    "final_eligible": true
  },
  {
    "raw_rank": 6,
    "raw_similarity": 0.4659926654113542,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-F8EB706177885912067E9E74510E09D1",
    "raw_source_text": "信息分：",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "KNOWN_LABEL_ONLY",
    "substantive_candidate": false,
    "substantive_class": "LABEL_ONLY",
    "substantive_reason": "KNOWN_LABEL_ONLY",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "NON_AUDITABLE_CLAIM",
    "source_eligibility_reason": "LOW_SPECIFICITY_CLAIM",
    "requirement_relative_classification": "TOPIC_RELEVANT_ONLY",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 7,
    "raw_similarity": 0.463654490491481,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-DD698C97CF11CC2C5A98532E65244E29",
    "raw_source_text": "I. Required Documents",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "KNOWN_LABEL_ONLY",
    "substantive_candidate": false,
    "substantive_class": "LABEL_ONLY",
    "substantive_reason": "KNOWN_LABEL_ONLY",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "NON_AUDITABLE_CLAIM",
    "source_eligibility_reason": "LOW_SPECIFICITY_CLAIM",
    "requirement_relative_classification": "IRRELEVANT",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 8,
    "raw_similarity": 0.4526071576710258,
    "material_id": "ffa84366-9aae-42e1-86bb-ab4fc47428e0",
    "document_id": "ffa84366-9aae-42e1-86bb-ab4fc47428e0",
    "chunk_id": "MCH-61777E281A96F7E35D2F6849CF915DE0",
    "raw_source_text": "关键信息基础设施安全保护条例用于规范关键信息基础设施安全保护工作，建立和完善保护制度，保障关键信息基础设施安全稳定运行。",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "EVIDENCE_ELIGIBLE",
    "candidate_exclusion_reason": null,
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "AUTHORITATIVE_REFERENCE_FACT",
    "source_eligibility_reason": "AUTHORITATIVE_SOURCE_PROVENANCE",
    "requirement_relative_classification": "TOPIC_RELEVANT_ONLY",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 9,
    "raw_similarity": 0.43651029089155247,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-10C2129A5D37AB29824CE98DF6E32F0D",
    "raw_source_text": "Primary\nSupporting\nAudit / Technical",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "INTERNAL_PROCESS_TEXT",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "INTERNAL_PROCESS_ARTIFACT",
    "source_eligibility_reason": "INTERNAL_PROCESS_TEXT",
    "requirement_relative_classification": "IRRELEVANT",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 10,
    "raw_similarity": 0.43640130758285833,
    "material_id": "ffa84366-9aae-42e1-86bb-ab4fc47428e0",
    "document_id": "ffa84366-9aae-42e1-86bb-ab4fc47428e0",
    "chunk_id": "MCH-C8CADCA6BBE3DD2675BECD37620FD998",
    "raw_source_text": "# 关键信息基础设施安全保护条例",
    "chunk_role": "HEADING",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "NON_EVIDENCE_ROLE",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "AUTHORITATIVE_REFERENCE_FACT",
    "source_eligibility_reason": "AUTHORITATIVE_SOURCE_PROVENANCE",
    "requirement_relative_classification": "METADATA_OR_HEADER",
    "requirement_relative_reason_codes": [
      "METADATA_OR_HEADER"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 11,
    "raw_similarity": 0.43622073911304915,
    "material_id": "2f14965f-d44f-4fd0-9bb4-f88b9af5da28",
    "document_id": "2f14965f-d44f-4fd0-9bb4-f88b9af5da28",
    "chunk_id": "MCH-264B4BD4C24A8706D129F3A80046CC94",
    "raw_source_text": "来源机构：工业和信息化部\n文号：国务院令第613号",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "EVIDENCE_ELIGIBLE",
    "candidate_exclusion_reason": null,
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "AUTHORITATIVE_REFERENCE_FACT",
    "source_eligibility_reason": "AUTHORITATIVE_SOURCE_PROVENANCE",
    "requirement_relative_classification": "TOPIC_RELEVANT_ONLY",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 12,
    "raw_similarity": 0.43590033818479323,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-CFFC5F79FB5E48DAEB1A7F4CC503E88A",
    "raw_source_text": "必须明确：",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "KNOWN_LABEL_ONLY",
    "substantive_candidate": false,
    "substantive_class": "LABEL_ONLY",
    "substantive_reason": "KNOWN_LABEL_ONLY",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "NON_AUDITABLE_CLAIM",
    "source_eligibility_reason": "LOW_SPECIFICITY_CLAIM",
    "requirement_relative_classification": "IRRELEVANT",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 13,
    "raw_similarity": 0.43159157445481044,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-B73C33CB10B6F50BB313418C65735B71",
    "raw_source_text": "Keycloak / compatible IdP。",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "INTERNAL_PROCESS_TEXT",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "INTERNAL_PROCESS_ARTIFACT",
    "source_eligibility_reason": "INTERNAL_PROCESS_TEXT",
    "requirement_relative_classification": "IRRELEVANT",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 14,
    "raw_similarity": 0.43121254444122625,
    "material_id": "74ed566b-18c0-41a1-ba55-59cbe182251c",
    "document_id": "74ed566b-18c0-41a1-ba55-59cbe182251c",
    "chunk_id": "MCH-017601318242AF5A8A8DF378FF69EEDF",
    "raw_source_text": "# 信息安全管理边界",
    "chunk_role": "HEADING",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "NON_EVIDENCE_ROLE",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_TECHNICAL_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "METADATA_OR_HEADER",
    "requirement_relative_reason_codes": [
      "METADATA_OR_HEADER"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 15,
    "raw_similarity": 0.42910382574177897,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-F6FE125F46AD101C81DA541D50D7AE47",
    "raw_source_text": "可控\n可追溯\n可审核\n可修改\n可交付",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "ABSTRACT_VALUE_LIST",
    "substantive_candidate": false,
    "substantive_class": "BOILERPLATE",
    "substantive_reason": "ABSTRACT_VALUE_LIST",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "NON_AUDITABLE_CLAIM",
    "source_eligibility_reason": "LOW_SPECIFICITY_CLAIM",
    "requirement_relative_classification": "IRRELEVANT",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 16,
    "raw_similarity": 0.4273946626547187,
    "material_id": "5d846692-9c13-4be6-b969-3c33f0579f5e",
    "document_id": "5d846692-9c13-4be6-b969-3c33f0579f5e",
    "chunk_id": "MCH-61991967853A9EEF1CC482FB71FA352A",
    "raw_source_text": "REPRESENTATIVE_SYNTHETIC\nNOT_REAL_CUSTOMER_DATA\nmaterial_id: SME-017\nsubject: 澄明数科（示范）有限公司",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "EVAL_METADATA_OR_PROVENANCE",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "EVAL_ARTIFACT",
    "source_eligibility_reason": "EVAL_METADATA_OR_PROVENANCE",
    "requirement_relative_classification": "METADATA_OR_HEADER",
    "requirement_relative_reason_codes": [
      "METADATA_OR_HEADER"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 17,
    "raw_similarity": 0.4270181230599265,
    "material_id": "74ed566b-18c0-41a1-ba55-59cbe182251c",
    "document_id": "74ed566b-18c0-41a1-ba55-59cbe182251c",
    "chunk_id": "MCH-FD985F70FBE8CB464869FD32A02F08DD",
    "raw_source_text": "REPRESENTATIVE_SYNTHETIC\nNOT_REAL_CUSTOMER_DATA\nmaterial_id: SME-020\nsubject: 澄明数科（示范）有限公司",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "EVAL_METADATA_OR_PROVENANCE",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "EVAL_ARTIFACT",
    "source_eligibility_reason": "EVAL_METADATA_OR_PROVENANCE",
    "requirement_relative_classification": "METADATA_OR_HEADER",
    "requirement_relative_reason_codes": [
      "METADATA_OR_HEADER"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 18,
    "raw_similarity": 0.4257597669506219,
    "material_id": "57b9e5fe-9549-42aa-88d5-fccc5c0afe2e",
    "document_id": "57b9e5fe-9549-42aa-88d5-fccc5c0afe2e",
    "chunk_id": "MCH-2D294EB24D5AADE6FD7D2E4A2F6A119A",
    "raw_source_text": "REPRESENTATIVE_SYNTHETIC\nNOT_REAL_CUSTOMER_DATA\nmaterial_id: SME-007\nsubject: 澄明数科（示范）有限公司",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "EVAL_METADATA_OR_PROVENANCE",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "EVAL_ARTIFACT",
    "source_eligibility_reason": "EVAL_METADATA_OR_PROVENANCE",
    "requirement_relative_classification": "METADATA_OR_HEADER",
    "requirement_relative_reason_codes": [
      "METADATA_OR_HEADER"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 19,
    "raw_similarity": 0.4254798083925475,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-447430F161ECB423FC46585DB4BED35B",
    "raw_source_text": "必须包含：",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "KNOWN_LABEL_ONLY",
    "substantive_candidate": false,
    "substantive_class": "LABEL_ONLY",
    "substantive_reason": "KNOWN_LABEL_ONLY",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "NON_AUDITABLE_CLAIM",
    "source_eligibility_reason": "LOW_SPECIFICITY_CLAIM",
    "requirement_relative_classification": "IRRELEVANT",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 20,
    "raw_similarity": 0.4252582833016949,
    "material_id": "6c7a4ff1-75b8-47ef-aa71-a44d8e0d075c",
    "document_id": "6c7a4ff1-75b8-47ef-aa71-a44d8e0d075c",
    "chunk_id": "MCH-BC48FC5FB68490896E8081BC1078B8CA",
    "raw_source_text": "REPRESENTATIVE_SYNTHETIC\nNOT_REAL_CUSTOMER_DATA\nmaterial_id: SME-011\nsubject: 澄明数科（示范）有限公司",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "EVAL_METADATA_OR_PROVENANCE",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "EVAL_ARTIFACT",
    "source_eligibility_reason": "EVAL_METADATA_OR_PROVENANCE",
    "requirement_relative_classification": "METADATA_OR_HEADER",
    "requirement_relative_reason_codes": [
      "METADATA_OR_HEADER"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  }
]
```

### Final candidates

```json
[
  {
    "raw_rank": 1,
    "raw_similarity": 0.7175531387329153,
    "material_id": "74ed566b-18c0-41a1-ba55-59cbe182251c",
    "document_id": "74ed566b-18c0-41a1-ba55-59cbe182251c",
    "chunk_id": "MCH-70376020855F97D43106A81E5F040C7F",
    "raw_source_text": "企业持有在有效期内的 ISO/IEC 27001 受控记录。该事实不证明任一产品已实现特定安全等级、等保级别或具体安全功能。",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "EVIDENCE_ELIGIBLE",
    "candidate_exclusion_reason": null,
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_TECHNICAL_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "EVIDENCE_BEARING",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_SUPPORTED"
    ],
    "final_phase_rank": 1,
    "final_eligible": true
  },
  {
    "raw_rank": 2,
    "raw_similarity": 0.6661979755045202,
    "material_id": "57b9e5fe-9549-42aa-88d5-fccc5c0afe2e",
    "document_id": "57b9e5fe-9549-42aa-88d5-fccc5c0afe2e",
    "chunk_id": "MCH-A4C2632EF9126FADD349C3004E1C2D84",
    "raw_source_text": "名称：ISO/IEC 27001\n编号：CM-Q-27001-2024\n状态：active\n有效至：2027-11-30",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "EVIDENCE_ELIGIBLE",
    "candidate_exclusion_reason": null,
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_QUALIFICATION_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "EVIDENCE_BEARING",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_SUPPORTED"
    ],
    "final_phase_rank": 2,
    "final_eligible": true
  },
  {
    "raw_rank": 5,
    "raw_similarity": 0.5497893363362956,
    "material_id": "c5395bc4-0531-4e6f-9f0c-3562cee0a2f1",
    "document_id": "c5395bc4-0531-4e6f-9f0c-3562cee0a2f1",
    "chunk_id": "MCH-A160D3E488BD50C27E5F6267363E57B1",
    "raw_source_text": "名称：ISO 9001\n编号：CM-Q-9001-2025\n状态：active\n有效至：2028-03-31",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "EVIDENCE_ELIGIBLE",
    "candidate_exclusion_reason": null,
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_QUALIFICATION_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "TOPIC_RELEVANT_ONLY",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": 3,
    "final_eligible": true
  }
]
```

### Index hygiene

```json
{
  "source_ineligible_in_raw_pool": 11,
  "structural_context_exclusions_in_raw_pool": 15,
  "final_candidate_count": 3,
  "ineligible_before_gold": 0,
  "reference_metadata_occurrences": 3
}
```

---

## V2R-006-ISO-SCOPE

- Requirement: 企业应提供指定项目主体的 ISO/IEC 27001 证书。
- Status: captured
- Latency: 110 ms
- Raw candidate pool: 20
- Final candidates: 3
- Gold raw rank: 2
- First decision-bearing raw rank: 1

### Raw candidate pool and post-retrieval audit

```json
[
  {
    "raw_rank": 1,
    "raw_similarity": 0.7064820528030445,
    "material_id": "74ed566b-18c0-41a1-ba55-59cbe182251c",
    "document_id": "74ed566b-18c0-41a1-ba55-59cbe182251c",
    "chunk_id": "MCH-70376020855F97D43106A81E5F040C7F",
    "raw_source_text": "企业持有在有效期内的 ISO/IEC 27001 受控记录。该事实不证明任一产品已实现特定安全等级、等保级别或具体安全功能。",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "EVIDENCE_ELIGIBLE",
    "candidate_exclusion_reason": null,
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_TECHNICAL_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "EVIDENCE_BEARING",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_SUPPORTED"
    ],
    "final_phase_rank": 1,
    "final_eligible": true
  },
  {
    "raw_rank": 2,
    "raw_similarity": 0.6684556801047528,
    "material_id": "57b9e5fe-9549-42aa-88d5-fccc5c0afe2e",
    "document_id": "57b9e5fe-9549-42aa-88d5-fccc5c0afe2e",
    "chunk_id": "MCH-0820CC5A439CB986C62E46213029CC71",
    "raw_source_text": "# ISO 27001 受控记录",
    "chunk_role": "HEADING",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "NON_EVIDENCE_ROLE",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_QUALIFICATION_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "METADATA_OR_HEADER",
    "requirement_relative_reason_codes": [
      "METADATA_OR_HEADER"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 3,
    "raw_similarity": 0.6393421507273834,
    "material_id": "57b9e5fe-9549-42aa-88d5-fccc5c0afe2e",
    "document_id": "57b9e5fe-9549-42aa-88d5-fccc5c0afe2e",
    "chunk_id": "MCH-A4C2632EF9126FADD349C3004E1C2D84",
    "raw_source_text": "名称：ISO/IEC 27001\n编号：CM-Q-27001-2024\n状态：active\n有效至：2027-11-30",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "EVIDENCE_ELIGIBLE",
    "candidate_exclusion_reason": null,
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_QUALIFICATION_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "EVIDENCE_BEARING",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_SUPPORTED"
    ],
    "final_phase_rank": 2,
    "final_eligible": true
  },
  {
    "raw_rank": 4,
    "raw_similarity": 0.6162579884375352,
    "material_id": "c5395bc4-0531-4e6f-9f0c-3562cee0a2f1",
    "document_id": "c5395bc4-0531-4e6f-9f0c-3562cee0a2f1",
    "chunk_id": "MCH-D37B061257382C31A3C757430BDD2CA6",
    "raw_source_text": "# ISO 9001 受控记录",
    "chunk_role": "HEADING",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "NON_EVIDENCE_ROLE",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_QUALIFICATION_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "METADATA_OR_HEADER",
    "requirement_relative_reason_codes": [
      "METADATA_OR_HEADER"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 5,
    "raw_similarity": 0.5089393550789749,
    "material_id": "c5395bc4-0531-4e6f-9f0c-3562cee0a2f1",
    "document_id": "c5395bc4-0531-4e6f-9f0c-3562cee0a2f1",
    "chunk_id": "MCH-A160D3E488BD50C27E5F6267363E57B1",
    "raw_source_text": "名称：ISO 9001\n编号：CM-Q-9001-2025\n状态：active\n有效至：2028-03-31",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "EVIDENCE_ELIGIBLE",
    "candidate_exclusion_reason": null,
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_QUALIFICATION_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "TOPIC_RELEVANT_ONLY",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": 3,
    "final_eligible": true
  },
  {
    "raw_rank": 6,
    "raw_similarity": 0.4896540349928129,
    "material_id": "ffa84366-9aae-42e1-86bb-ab4fc47428e0",
    "document_id": "ffa84366-9aae-42e1-86bb-ab4fc47428e0",
    "chunk_id": "MCH-61777E281A96F7E35D2F6849CF915DE0",
    "raw_source_text": "关键信息基础设施安全保护条例用于规范关键信息基础设施安全保护工作，建立和完善保护制度，保障关键信息基础设施安全稳定运行。",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "EVIDENCE_ELIGIBLE",
    "candidate_exclusion_reason": null,
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "AUTHORITATIVE_REFERENCE_FACT",
    "source_eligibility_reason": "AUTHORITATIVE_SOURCE_PROVENANCE",
    "requirement_relative_classification": "IRRELEVANT",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 7,
    "raw_similarity": 0.48475873561151506,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-DD698C97CF11CC2C5A98532E65244E29",
    "raw_source_text": "I. Required Documents",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "KNOWN_LABEL_ONLY",
    "substantive_candidate": false,
    "substantive_class": "LABEL_ONLY",
    "substantive_reason": "KNOWN_LABEL_ONLY",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "NON_AUDITABLE_CLAIM",
    "source_eligibility_reason": "LOW_SPECIFICITY_CLAIM",
    "requirement_relative_classification": "IRRELEVANT",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 8,
    "raw_similarity": 0.471615377471998,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-CFFC5F79FB5E48DAEB1A7F4CC503E88A",
    "raw_source_text": "必须明确：",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "KNOWN_LABEL_ONLY",
    "substantive_candidate": false,
    "substantive_class": "LABEL_ONLY",
    "substantive_reason": "KNOWN_LABEL_ONLY",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "NON_AUDITABLE_CLAIM",
    "source_eligibility_reason": "LOW_SPECIFICITY_CLAIM",
    "requirement_relative_classification": "IRRELEVANT",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 9,
    "raw_similarity": 0.46567958593368863,
    "material_id": "ffa84366-9aae-42e1-86bb-ab4fc47428e0",
    "document_id": "ffa84366-9aae-42e1-86bb-ab4fc47428e0",
    "chunk_id": "MCH-C8CADCA6BBE3DD2675BECD37620FD998",
    "raw_source_text": "# 关键信息基础设施安全保护条例",
    "chunk_role": "HEADING",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "NON_EVIDENCE_ROLE",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "AUTHORITATIVE_REFERENCE_FACT",
    "source_eligibility_reason": "AUTHORITATIVE_SOURCE_PROVENANCE",
    "requirement_relative_classification": "METADATA_OR_HEADER",
    "requirement_relative_reason_codes": [
      "METADATA_OR_HEADER"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 10,
    "raw_similarity": 0.4575414980923245,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-F6FE125F46AD101C81DA541D50D7AE47",
    "raw_source_text": "可控\n可追溯\n可审核\n可修改\n可交付",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "ABSTRACT_VALUE_LIST",
    "substantive_candidate": false,
    "substantive_class": "BOILERPLATE",
    "substantive_reason": "ABSTRACT_VALUE_LIST",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "NON_AUDITABLE_CLAIM",
    "source_eligibility_reason": "LOW_SPECIFICITY_CLAIM",
    "requirement_relative_classification": "IRRELEVANT",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 11,
    "raw_similarity": 0.4534430829618532,
    "material_id": "2f14965f-d44f-4fd0-9bb4-f88b9af5da28",
    "document_id": "2f14965f-d44f-4fd0-9bb4-f88b9af5da28",
    "chunk_id": "MCH-264B4BD4C24A8706D129F3A80046CC94",
    "raw_source_text": "来源机构：工业和信息化部\n文号：国务院令第613号",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "EVIDENCE_ELIGIBLE",
    "candidate_exclusion_reason": null,
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "AUTHORITATIVE_REFERENCE_FACT",
    "source_eligibility_reason": "AUTHORITATIVE_SOURCE_PROVENANCE",
    "requirement_relative_classification": "IRRELEVANT",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 12,
    "raw_similarity": 0.4531220253560513,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-9B3CAB55A63FBAA2806BD5521C1FF6BF",
    "raw_source_text": "系统负责确定性传播",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "CONTROL_PLANE_DERIVED_TEXT",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "CONTROL_PLANE_ARTIFACT",
    "source_eligibility_reason": "CONTROL_PLANE_DERIVED_TEXT",
    "requirement_relative_classification": "IRRELEVANT",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 13,
    "raw_similarity": 0.4474525514301597,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-447430F161ECB423FC46585DB4BED35B",
    "raw_source_text": "必须包含：",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "KNOWN_LABEL_ONLY",
    "substantive_candidate": false,
    "substantive_class": "LABEL_ONLY",
    "substantive_reason": "KNOWN_LABEL_ONLY",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "NON_AUDITABLE_CLAIM",
    "source_eligibility_reason": "LOW_SPECIFICITY_CLAIM",
    "requirement_relative_classification": "IRRELEVANT",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 14,
    "raw_similarity": 0.44178402770852954,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-B73C33CB10B6F50BB313418C65735B71",
    "raw_source_text": "Keycloak / compatible IdP。",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "INTERNAL_PROCESS_TEXT",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "INTERNAL_PROCESS_ARTIFACT",
    "source_eligibility_reason": "INTERNAL_PROCESS_TEXT",
    "requirement_relative_classification": "IRRELEVANT",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 15,
    "raw_similarity": 0.4350980558932994,
    "material_id": "2fc1e753-1aac-4a9f-af37-a537ec28323b",
    "document_id": "2fc1e753-1aac-4a9f-af37-a537ec28323b",
    "chunk_id": "MCH-E15B1375164A2AF1529B29FF62D347EA",
    "raw_source_text": "来源机构：中央网络安全和信息化委员会办公室\n文号：无",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "EVIDENCE_ELIGIBLE",
    "candidate_exclusion_reason": null,
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "AUTHORITATIVE_REFERENCE_FACT",
    "source_eligibility_reason": "AUTHORITATIVE_SOURCE_PROVENANCE",
    "requirement_relative_classification": "IRRELEVANT",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 16,
    "raw_similarity": 0.43288406329656715,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-10C2129A5D37AB29824CE98DF6E32F0D",
    "raw_source_text": "Primary\nSupporting\nAudit / Technical",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "INTERNAL_PROCESS_TEXT",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "INTERNAL_PROCESS_ARTIFACT",
    "source_eligibility_reason": "INTERNAL_PROCESS_TEXT",
    "requirement_relative_classification": "IRRELEVANT",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 17,
    "raw_similarity": 0.42976430477116745,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-BCFDF157C5494565A4C6BE3EF900E608",
    "raw_source_text": "核心原则：",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "KNOWN_LABEL_ONLY",
    "substantive_candidate": false,
    "substantive_class": "LABEL_ONLY",
    "substantive_reason": "KNOWN_LABEL_ONLY",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "NON_AUDITABLE_CLAIM",
    "source_eligibility_reason": "LOW_SPECIFICITY_CLAIM",
    "requirement_relative_classification": "IRRELEVANT",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 18,
    "raw_similarity": 0.42841521758851797,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-2F96B9DD896D5632BD6F39023E7ECEE6",
    "raw_source_text": "保持自己的 Control Plane。",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "CONTROL_PLANE_DERIVED_TEXT",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "CONTROL_PLANE_ARTIFACT",
    "source_eligibility_reason": "CONTROL_PLANE_DERIVED_TEXT",
    "requirement_relative_classification": "IRRELEVANT",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 19,
    "raw_similarity": 0.4260520681111779,
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "chunk_id": "MCH-555802B2C6B93AE17E478E4ECC99308A",
    "raw_source_text": "核心业务流程真实可用、\n稳定、可审核、可追溯、易操作。",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "LOW_SPECIFICITY_CLAIM",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "NON_AUDITABLE_CLAIM",
    "source_eligibility_reason": "LOW_SPECIFICITY_CLAIM",
    "requirement_relative_classification": "IRRELEVANT",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  },
  {
    "raw_rank": 20,
    "raw_similarity": 0.4230541460795971,
    "material_id": "74ed566b-18c0-41a1-ba55-59cbe182251c",
    "document_id": "74ed566b-18c0-41a1-ba55-59cbe182251c",
    "chunk_id": "MCH-FD985F70FBE8CB464869FD32A02F08DD",
    "raw_source_text": "REPRESENTATIVE_SYNTHETIC\nNOT_REAL_CUSTOMER_DATA\nmaterial_id: SME-020\nsubject: 澄明数科（示范）有限公司",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "CONTEXT_ONLY",
    "candidate_exclusion_reason": "EVAL_METADATA_OR_PROVENANCE",
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "INELIGIBLE",
    "source_eligibility_class": "EVAL_ARTIFACT",
    "source_eligibility_reason": "EVAL_METADATA_OR_PROVENANCE",
    "requirement_relative_classification": "METADATA_OR_HEADER",
    "requirement_relative_reason_codes": [
      "METADATA_OR_HEADER"
    ],
    "final_phase_rank": null,
    "final_eligible": false
  }
]
```

### Final candidates

```json
[
  {
    "raw_rank": 1,
    "raw_similarity": 0.7064820528030445,
    "material_id": "74ed566b-18c0-41a1-ba55-59cbe182251c",
    "document_id": "74ed566b-18c0-41a1-ba55-59cbe182251c",
    "chunk_id": "MCH-70376020855F97D43106A81E5F040C7F",
    "raw_source_text": "企业持有在有效期内的 ISO/IEC 27001 受控记录。该事实不证明任一产品已实现特定安全等级、等保级别或具体安全功能。",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "EVIDENCE_ELIGIBLE",
    "candidate_exclusion_reason": null,
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_TECHNICAL_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "EVIDENCE_BEARING",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_SUPPORTED"
    ],
    "final_phase_rank": 1,
    "final_eligible": true
  },
  {
    "raw_rank": 3,
    "raw_similarity": 0.6393421507273834,
    "material_id": "57b9e5fe-9549-42aa-88d5-fccc5c0afe2e",
    "document_id": "57b9e5fe-9549-42aa-88d5-fccc5c0afe2e",
    "chunk_id": "MCH-A4C2632EF9126FADD349C3004E1C2D84",
    "raw_source_text": "名称：ISO/IEC 27001\n编号：CM-Q-27001-2024\n状态：active\n有效至：2027-11-30",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "EVIDENCE_ELIGIBLE",
    "candidate_exclusion_reason": null,
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_QUALIFICATION_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "EVIDENCE_BEARING",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_SUPPORTED"
    ],
    "final_phase_rank": 2,
    "final_eligible": true
  },
  {
    "raw_rank": 5,
    "raw_similarity": 0.5089393550789749,
    "material_id": "c5395bc4-0531-4e6f-9f0c-3562cee0a2f1",
    "document_id": "c5395bc4-0531-4e6f-9f0c-3562cee0a2f1",
    "chunk_id": "MCH-A160D3E488BD50C27E5F6267363E57B1",
    "raw_source_text": "名称：ISO 9001\n编号：CM-Q-9001-2025\n状态：active\n有效至：2028-03-31",
    "chunk_role": "BUSINESS_CONTENT",
    "candidate_eligibility": "EVIDENCE_ELIGIBLE",
    "candidate_exclusion_reason": null,
    "substantive_candidate": true,
    "substantive_class": "SUBSTANTIVE_CANDIDATE",
    "substantive_reason": "COMPLETE_PROPOSITION_OR_STRUCTURED_VALUE",
    "source_eligibility": "ELIGIBLE",
    "source_eligibility_class": "ORIGINAL_QUALIFICATION_FACT",
    "source_eligibility_reason": "ORIGINAL_MATERIAL_PROVENANCE",
    "requirement_relative_classification": "TOPIC_RELEVANT_ONLY",
    "requirement_relative_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "final_phase_rank": 3,
    "final_eligible": true
  }
]
```

### Index hygiene

```json
{
  "source_ineligible_in_raw_pool": 11,
  "structural_context_exclusions_in_raw_pool": 14,
  "final_candidate_count": 3,
  "ineligible_before_gold": 0,
  "reference_metadata_occurrences": 4
}
```

---

## Safety

Formal Requirement creation: NO
Evidence Fact / Mapping / Claim Gate / Writer: NOT_EXECUTED
Embedding calls: 6
LLM calls: 0
Dify calls: 0
Automatic retry: 0
