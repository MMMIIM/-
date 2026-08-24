# GPT REVIEW PACKET — RETRIEVAL HYGIENE PRE/POST

- GPT_REVIEW_STATUS: `PENDING_REVIEW`
- EVAL_COMPLETE: `NO`
- No corpus upload, re-embedding, LLM, Dify, Mapping, Evidence Fact, Claim Gate or Writer execution.

## Execution

- Cases: 6
- Embedding calls: 6

## Post-fix metrics

```json
{
  "denominator": 6,
  "hit_at_1": 0.5,
  "hit_at_3": 1,
  "hit_at_5": 1,
  "mrr": 0.75,
  "metadata_at_1": 0,
  "metadata_at_3": 0,
  "metadata_at_5": 0,
  "unique_business_materials_at_5": 3.3333333333333335,
  "unique_business_documents_at_5": 3.3333333333333335
}
```

## Case comparison

### V2R-001-PERF-DIRECT

- Requirement: 企业应提供可核验的数据交换平台性能测试记录。
- PRE first useful evidence rank: 2
- POST first useful evidence rank: 2
- PRE Gold Evidence Set Hit@5: PASS
- POST Gold Evidence Set Hit@5: PASS
- Metadata removed from final lane: 2

#### Gold Evidence Set / PRE Top5 / POST Top5

```json
{
  "gold_evidence_set": [
    {
      "chunk_id": "MCH-B4FF02295DBB6DCDF6E2763F057076F6",
      "chunk_role": "HEADING",
      "source_hash": "b39d0175f9ba8fd41b225f5b6d7b28dc51d850f4b5e80fe6159ae1af3e4ea189"
    },
    {
      "chunk_id": "MCH-0FBD3599DAF932016F62EB9634B997AF",
      "chunk_role": "BUSINESS_CONTENT",
      "source_hash": "5a54f61d10c64f26414f8dcfb93f3c1eb25076f1063d97f8200f42cad981843c"
    }
  ],
  "pre_top5": [
    {
      "rank": 1,
      "raw_vector_rank": 1,
      "material_id": "3c81671f-376e-401b-8525-be26929d5b92",
      "document_id": "3c81671f-376e-401b-8525-be26929d5b92",
      "chunk_id": "MCH-B4FF02295DBB6DCDF6E2763F057076F6",
      "score": 0.820653070250338,
      "raw_original_text": "# 数据交换平台性能测试记录",
      "runtime_heuristic_classification": "METADATA_OR_HEADER",
      "heuristic_reason_codes": [
        "METADATA_OR_HEADER"
      ],
      "context_recovery_rate": 0.8,
      "context_recovery_state": "UNRESOLVED_AFTER_RETRIEVAL",
      "source": "PRE_FIX_BASELINE"
    },
    {
      "rank": 2,
      "raw_vector_rank": 2,
      "material_id": "8821b9fa-2bde-4329-9cbf-908395c1270d",
      "document_id": "8821b9fa-2bde-4329-9cbf-908395c1270d",
      "chunk_id": "MCH-770B6FE8E57173DCC72914CFFB7376F8",
      "score": 0.6545740365982056,
      "raw_original_text": "产品：澄明数据交换平台 V3.2\n能力：REST API 接入、数据目录、交换任务调度、运行日志。\n未声明未列出的协议、吞吐量或 SLA。",
      "runtime_heuristic_classification": "EVIDENCE_BEARING",
      "heuristic_reason_codes": [
        "REQUIRED_DIMENSION_SUPPORTED"
      ],
      "context_recovery_rate": 0.4,
      "context_recovery_state": "UNRESOLVED_AFTER_CONTEXT",
      "source": "PRE_FIX_BASELINE"
    },
    {
      "rank": 3,
      "raw_vector_rank": 3,
      "material_id": "8821b9fa-2bde-4329-9cbf-908395c1270d",
      "document_id": "8821b9fa-2bde-4329-9cbf-908395c1270d",
      "chunk_id": "MCH-C9F466EAC2C29977E40F4A3BFE38A6E4",
      "score": 0.6524852514266968,
      "raw_original_text": "# 数据交换平台产品说明",
      "runtime_heuristic_classification": "METADATA_OR_HEADER",
      "heuristic_reason_codes": [
        "METADATA_OR_HEADER"
      ],
      "context_recovery_rate": 0.4,
      "context_recovery_state": "UNRESOLVED_AFTER_RETRIEVAL",
      "source": "PRE_FIX_BASELINE"
    },
    {
      "rank": 4,
      "raw_vector_rank": 4,
      "material_id": "3c81671f-376e-401b-8525-be26929d5b92",
      "document_id": "3c81671f-376e-401b-8525-be26929d5b92",
      "chunk_id": "MCH-0FBD3599DAF932016F62EB9634B997AF",
      "score": 0.5710718291359059,
      "raw_original_text": "产品：澄明数据交换平台 V3.2\n环境：8 vCPU、32 GB 内存、PostgreSQL 14、千兆局域网\n条件：50 并发、100 万条基准数据、缓存预热后执行 30 分钟\n指标：数据目录查询平均响应时间\n结果：平均 1.4 秒，P95 1.9 秒。\n日期：2025-05-16。",
      "runtime_heuristic_classification": "EVIDENCE_BEARING",
      "heuristic_reason_codes": [
        "REQUIRED_DIMENSION_SUPPORTED"
      ],
      "context_recovery_rate": 0.8,
      "context_recovery_state": "UNRESOLVED_AFTER_CONTEXT",
      "source": "PRE_FIX_BASELINE"
    },
    {
      "rank": 5,
      "raw_vector_rank": 5,
      "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
      "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
      "chunk_id": "MCH-5B3A5D4F1299B7E362FE0D195F33C161",
      "score": 0.5241128489903907,
      "raw_original_text": "记录已经验证的核心原则：",
      "runtime_heuristic_classification": "TOPIC_RELEVANT_ONLY",
      "heuristic_reason_codes": [
        "REQUIRED_DIMENSION_NOT_SUPPORTED"
      ],
      "context_recovery_rate": 0.2,
      "context_recovery_state": "UNRESOLVED_AFTER_CONTEXT",
      "source": "PRE_FIX_BASELINE"
    }
  ],
  "post_top5": [
    {
      "embedding_id": "c2e6622c-29b5-46d5-8eb0-df1f98a794bd",
      "chunk_id": "MCH-770B6FE8E57173DCC72914CFFB7376F8",
      "material_id": "8821b9fa-2bde-4329-9cbf-908395c1270d",
      "project_id": "ac1a1037-5e62-44ee-8c28-7b09d48d93e6",
      "material_type": "product_documentation",
      "corpus_scope": "ENTERPRISE_PRIVATE",
      "industry": null,
      "original_name": "product-data-exchange.md",
      "source_type": null,
      "source_org": null,
      "source_authority": "enterprise_private",
      "lifecycle_status": "ACTIVE",
      "review_status": "approved",
      "usage_status": "ACTIVE_FULLTEXT",
      "index_status": "NOT_INDEXED",
      "effective_status": "current_status_required",
      "synthetic_test_material": false,
      "source_text": "产品：澄明数据交换平台 V3.2\n能力：REST API 接入、数据目录、交换任务调度、运行日志。\n未声明未列出的协议、吞吐量或 SLA。",
      "chunk_hash": "2ded84bc0d6960c9a09c74c40d06690ff022688f668592eba9db5ac677fcf43b",
      "embedding_model": "Qwen/Qwen3-Embedding-0.6B",
      "embedding_version": "1",
      "similarity_score": 0.6545740365982056,
      "rank": 1,
      "raw_vector_rank": 2,
      "raw_similarity": 0.6545740365982056,
      "chunk_role": "BUSINESS_CONTENT",
      "chunk_role_version": "retrieval-chunk-role-v1",
      "chunk_role_reason": "SUBSTANTIVE_SOURCE_TEXT",
      "candidate_eligibility": "EVIDENCE_ELIGIBLE",
      "source_document_id": "8821b9fa-2bde-4329-9cbf-908395c1270d",
      "source_chunk_id": "MCH-770B6FE8E57173DCC72914CFFB7376F8",
      "content_role": "unknown",
      "role_compatibility": "unknown",
      "matched_evidence_needs": [],
      "rerank_reasons": [
        "RAW_VECTOR_FALLBACK"
      ],
      "rerank_version": "4.3-role-need-rerank-v1",
      "reranked_rank": 1,
      "retrieval_contract_version": "4.3-production-retrieval-v1",
      "evidence_created": false,
      "raw_original_text": "产品：澄明数据交换平台 V3.2\n能力：REST API 接入、数据目录、交换任务调度、运行日志。\n未声明未列出的协议、吞吐量或 SLA。",
      "classification": "TOPIC_RELEVANT_ONLY",
      "evidence_role": null,
      "reason_codes": [
        "REQUIRED_DIMENSION_NOT_SUPPORTED"
      ]
    },
    {
      "embedding_id": "178c2c75-75c2-4d4b-a782-e6a942dea282",
      "chunk_id": "MCH-0FBD3599DAF932016F62EB9634B997AF",
      "material_id": "3c81671f-376e-401b-8525-be26929d5b92",
      "project_id": "ac1a1037-5e62-44ee-8c28-7b09d48d93e6",
      "material_type": "product_documentation",
      "corpus_scope": "ENTERPRISE_PRIVATE",
      "industry": null,
      "original_name": "performance-report.md",
      "source_type": null,
      "source_org": null,
      "source_authority": "enterprise_private",
      "lifecycle_status": "ACTIVE",
      "review_status": "approved",
      "usage_status": "ACTIVE_FULLTEXT",
      "index_status": "NOT_INDEXED",
      "effective_status": "current_status_required",
      "synthetic_test_material": false,
      "source_text": "产品：澄明数据交换平台 V3.2\n环境：8 vCPU、32 GB 内存、PostgreSQL 14、千兆局域网\n条件：50 并发、100 万条基准数据、缓存预热后执行 30 分钟\n指标：数据目录查询平均响应时间\n结果：平均 1.4 秒，P95 1.9 秒。\n日期：2025-05-16。",
      "chunk_hash": "5a54f61d10c64f26414f8dcfb93f3c1eb25076f1063d97f8200f42cad981843c",
      "embedding_model": "Qwen/Qwen3-Embedding-0.6B",
      "embedding_version": "1",
      "similarity_score": 0.5710718291359059,
      "rank": 2,
      "raw_vector_rank": 4,
      "raw_similarity": 0.5710718291359059,
      "chunk_role": "BUSINESS_CONTENT",
      "chunk_role_version": "retrieval-chunk-role-v1",
      "chunk_role_reason": "SUBSTANTIVE_SOURCE_TEXT",
      "candidate_eligibility": "EVIDENCE_ELIGIBLE",
      "source_document_id": "3c81671f-376e-401b-8525-be26929d5b92",
      "source_chunk_id": "MCH-0FBD3599DAF932016F62EB9634B997AF",
      "content_role": "unknown",
      "role_compatibility": "unknown",
      "matched_evidence_needs": [],
      "rerank_reasons": [
        "RAW_VECTOR_FALLBACK"
      ],
      "rerank_version": "4.3-role-need-rerank-v1",
      "reranked_rank": 2,
      "retrieval_contract_version": "4.3-production-retrieval-v1",
      "evidence_created": false,
      "raw_original_text": "产品：澄明数据交换平台 V3.2\n环境：8 vCPU、32 GB 内存、PostgreSQL 14、千兆局域网\n条件：50 并发、100 万条基准数据、缓存预热后执行 30 分钟\n指标：数据目录查询平均响应时间\n结果：平均 1.4 秒，P95 1.9 秒。\n日期：2025-05-16。",
      "classification": "EVIDENCE_BEARING",
      "evidence_role": "BOUNDARY_EVIDENCE",
      "reason_codes": [
        "REQUIRED_DIMENSION_SUPPORTED"
      ]
    },
    {
      "embedding_id": "c3b9427f-033e-4457-b7a5-27d47dee3f6c",
      "chunk_id": "MCH-5B3A5D4F1299B7E362FE0D195F33C161",
      "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
      "project_id": "ac1a1037-5e62-44ee-8c28-7b09d48d93e6",
      "material_type": "company_profile",
      "corpus_scope": "ENTERPRISE_PRIVATE",
      "industry": null,
      "original_name": "pasted-text.txt",
      "source_type": null,
      "source_org": null,
      "source_authority": "enterprise_private",
      "lifecycle_status": "ACTIVE",
      "review_status": "approved",
      "usage_status": "ACTIVE_FULLTEXT",
      "index_status": "NOT_INDEXED",
      "effective_status": "current_status_required",
      "synthetic_test_material": false,
      "source_text": "记录已经验证的核心原则：",
      "chunk_hash": "127e8943c87423c2cc0c7240f255a9b39982bc1dfacaf3464caef7b0d73b1857",
      "embedding_model": "Qwen/Qwen3-Embedding-0.6B",
      "embedding_version": "1",
      "similarity_score": 0.5241128489903907,
      "rank": 3,
      "raw_vector_rank": 5,
      "raw_similarity": 0.5241128489903907,
      "chunk_role": "BUSINESS_CONTENT",
      "chunk_role_version": "retrieval-chunk-role-v1",
      "chunk_role_reason": "SUBSTANTIVE_SOURCE_TEXT",
      "candidate_eligibility": "EVIDENCE_ELIGIBLE",
      "source_document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
      "source_chunk_id": "MCH-5B3A5D4F1299B7E362FE0D195F33C161",
      "content_role": "unknown",
      "role_compatibility": "unknown",
      "matched_evidence_needs": [],
      "rerank_reasons": [
        "RAW_VECTOR_FALLBACK"
      ],
      "rerank_version": "4.3-role-need-rerank-v1",
      "reranked_rank": 3,
      "retrieval_contract_version": "4.3-production-retrieval-v1",
      "evidence_created": false,
      "raw_original_text": "记录已经验证的核心原则：",
      "classification": "TOPIC_RELEVANT_ONLY",
      "evidence_role": null,
      "reason_codes": [
        "REQUIRED_DIMENSION_NOT_SUPPORTED"
      ]
    },
    {
      "embedding_id": "65c115af-1bb0-42ef-8b28-5a12bfe70aca",
      "chunk_id": "MCH-F6FE125F46AD101C81DA541D50D7AE47",
      "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
      "project_id": "ac1a1037-5e62-44ee-8c28-7b09d48d93e6",
      "material_type": "company_profile",
      "corpus_scope": "ENTERPRISE_PRIVATE",
      "industry": null,
      "original_name": "pasted-text.txt",
      "source_type": null,
      "source_org": null,
      "source_authority": "enterprise_private",
      "lifecycle_status": "ACTIVE",
      "review_status": "approved",
      "usage_status": "ACTIVE_FULLTEXT",
      "index_status": "NOT_INDEXED",
      "effective_status": "current_status_required",
      "synthetic_test_material": false,
      "source_text": "可控\n可追溯\n可审核\n可修改\n可交付",
      "chunk_hash": "d3170af4ab5e1b36935a5aad51b577567f93b158d140dd4e4c331296af5a3128",
      "embedding_model": "Qwen/Qwen3-Embedding-0.6B",
      "embedding_version": "1",
      "similarity_score": 0.5180168747901917,
      "rank": 4,
      "raw_vector_rank": 6,
      "raw_similarity": 0.5180168747901917,
      "chunk_role": "BUSINESS_CONTENT",
      "chunk_role_version": "retrieval-chunk-role-v1",
      "chunk_role_reason": "SUBSTANTIVE_SOURCE_TEXT",
      "candidate_eligibility": "EVIDENCE_ELIGIBLE",
      "source_document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
      "source_chunk_id": "MCH-F6FE125F46AD101C81DA541D50D7AE47",
      "content_role": "unknown",
      "role_compatibility": "unknown",
      "matched_evidence_needs": [],
      "rerank_reasons": [
        "RAW_VECTOR_FALLBACK"
      ],
      "rerank_version": "4.3-role-need-rerank-v1",
      "reranked_rank": 4,
      "retrieval_contract_version": "4.3-production-retrieval-v1",
      "evidence_created": false,
      "raw_original_text": "可控\n可追溯\n可审核\n可修改\n可交付",
      "classification": "IRRELEVANT",
      "evidence_role": null,
      "reason_codes": [
        "REQUIRED_DIMENSION_NOT_SUPPORTED"
      ]
    },
    {
      "embedding_id": "f2999244-454b-4679-b6fd-ec2d1e97006f",
      "chunk_id": "MCH-555802B2C6B93AE17E478E4ECC99308A",
      "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
      "project_id": "ac1a1037-5e62-44ee-8c28-7b09d48d93e6",
      "material_type": "company_profile",
      "corpus_scope": "ENTERPRISE_PRIVATE",
      "industry": null,
      "original_name": "pasted-text.txt",
      "source_type": null,
      "source_org": null,
      "source_authority": "enterprise_private",
      "lifecycle_status": "ACTIVE",
      "review_status": "approved",
      "usage_status": "ACTIVE_FULLTEXT",
      "index_status": "NOT_INDEXED",
      "effective_status": "current_status_required",
      "synthetic_test_material": false,
      "source_text": "核心业务流程真实可用、\n稳定、可审核、可追溯、易操作。",
      "chunk_hash": "57d372478a59be99ea4f8dcf1c8ebebea4c37b8763a3e12b6c4ebee5b5e6db01",
      "embedding_model": "Qwen/Qwen3-Embedding-0.6B",
      "embedding_version": "1",
      "similarity_score": 0.5129590034484863,
      "rank": 5,
      "raw_vector_rank": 8,
      "raw_similarity": 0.5129590034484863,
      "chunk_role": "BUSINESS_CONTENT",
      "chunk_role_version": "retrieval-chunk-role-v1",
      "chunk_role_reason": "SUBSTANTIVE_SOURCE_TEXT",
      "candidate_eligibility": "EVIDENCE_ELIGIBLE",
      "source_document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
      "source_chunk_id": "MCH-555802B2C6B93AE17E478E4ECC99308A",
      "content_role": "unknown",
      "role_compatibility": "unknown",
      "matched_evidence_needs": [],
      "rerank_reasons": [
        "RAW_VECTOR_FALLBACK"
      ],
      "rerank_version": "4.3-role-need-rerank-v1",
      "reranked_rank": 5,
      "retrieval_contract_version": "4.3-production-retrieval-v1",
      "evidence_created": false,
      "raw_original_text": "核心业务流程真实可用、\n稳定、可审核、可追溯、易操作。",
      "classification": "IRRELEVANT",
      "evidence_role": null,
      "reason_codes": [
        "REQUIRED_DIMENSION_NOT_SUPPORTED"
      ]
    }
  ]
}
```

### V2R-002-PERF-PARTIAL

- Requirement: 企业应证明接口 P95 响应时间不超过 1 秒。
- PRE first useful evidence rank: 1
- POST first useful evidence rank: 1
- PRE Gold Evidence Set Hit@5: PASS
- POST Gold Evidence Set Hit@5: PASS
- Metadata removed from final lane: 1

#### Gold Evidence Set / PRE Top5 / POST Top5

```json
{
  "gold_evidence_set": [
    {
      "chunk_id": "MCH-B4FF02295DBB6DCDF6E2763F057076F6",
      "chunk_role": "HEADING",
      "source_hash": "b39d0175f9ba8fd41b225f5b6d7b28dc51d850f4b5e80fe6159ae1af3e4ea189"
    },
    {
      "chunk_id": "MCH-0FBD3599DAF932016F62EB9634B997AF",
      "chunk_role": "BUSINESS_CONTENT",
      "source_hash": "5a54f61d10c64f26414f8dcfb93f3c1eb25076f1063d97f8200f42cad981843c"
    }
  ],
  "pre_top5": [
    {
      "rank": 1,
      "raw_vector_rank": 1,
      "material_id": "3c81671f-376e-401b-8525-be26929d5b92",
      "document_id": "3c81671f-376e-401b-8525-be26929d5b92",
      "chunk_id": "MCH-0FBD3599DAF932016F62EB9634B997AF",
      "score": 0.5493428052255147,
      "raw_original_text": "产品：澄明数据交换平台 V3.2\n环境：8 vCPU、32 GB 内存、PostgreSQL 14、千兆局域网\n条件：50 并发、100 万条基准数据、缓存预热后执行 30 分钟\n指标：数据目录查询平均响应时间\n结果：平均 1.4 秒，P95 1.9 秒。\n日期：2025-05-16。",
      "runtime_heuristic_classification": "EVIDENCE_BEARING",
      "heuristic_reason_codes": [
        "REQUIRED_DIMENSION_SUPPORTED"
      ],
      "context_recovery_rate": 0.8,
      "context_recovery_state": "UNRESOLVED_AFTER_CONTEXT",
      "source": "PRE_FIX_BASELINE"
    },
    {
      "rank": 2,
      "raw_vector_rank": 2,
      "material_id": "3c81671f-376e-401b-8525-be26929d5b92",
      "document_id": "3c81671f-376e-401b-8525-be26929d5b92",
      "chunk_id": "MCH-B4FF02295DBB6DCDF6E2763F057076F6",
      "score": 0.5284328460693397,
      "raw_original_text": "# 数据交换平台性能测试记录",
      "runtime_heuristic_classification": "METADATA_OR_HEADER",
      "heuristic_reason_codes": [
        "METADATA_OR_HEADER"
      ],
      "context_recovery_rate": 0.8,
      "context_recovery_state": "UNRESOLVED_AFTER_RETRIEVAL",
      "source": "PRE_FIX_BASELINE"
    },
    {
      "rank": 3,
      "raw_vector_rank": 3,
      "material_id": "7b29cc2e-458c-4ed9-ab5a-81f99a3ddace",
      "document_id": "7b29cc2e-458c-4ed9-ab5a-81f99a3ddace",
      "chunk_id": "MCH-08A2CF3D5D2423E41CECF8BB230F574A",
      "score": 0.5160041451454199,
      "raw_original_text": "企业通常提供工作日 9:00-18:00 服务台、远程诊断和必要时现场支持。\n无经审核的 7×24、5 分钟响应或 99.99% SLA。",
      "runtime_heuristic_classification": "TOPIC_RELEVANT_ONLY",
      "heuristic_reason_codes": [
        "REQUIRED_DIMENSION_NOT_SUPPORTED"
      ],
      "context_recovery_rate": 0.4,
      "context_recovery_state": "UNRESOLVED_AFTER_CONTEXT",
      "source": "PRE_FIX_BASELINE"
    },
    {
      "rank": 4,
      "raw_vector_rank": 4,
      "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
      "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
      "chunk_id": "MCH-A9CA772011E7045D8F035A43E6681BE8",
      "score": 0.473630936525409,
      "raw_original_text": "Prompt =\nbackend-owned business instruction,\nversioned independently of model.",
      "runtime_heuristic_classification": "IRRELEVANT",
      "heuristic_reason_codes": [
        "REQUIRED_DIMENSION_NOT_SUPPORTED"
      ],
      "context_recovery_rate": 0.2,
      "context_recovery_state": "UNRESOLVED_AFTER_CONTEXT",
      "source": "PRE_FIX_BASELINE"
    },
    {
      "rank": 5,
      "raw_vector_rank": 5,
      "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
      "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
      "chunk_id": "MCH-F6FE125F46AD101C81DA541D50D7AE47",
      "score": 0.45196414280151553,
      "raw_original_text": "可控\n可追溯\n可审核\n可修改\n可交付",
      "runtime_heuristic_classification": "IRRELEVANT",
      "heuristic_reason_codes": [
        "REQUIRED_DIMENSION_NOT_SUPPORTED"
      ],
      "context_recovery_rate": 0.2,
      "context_recovery_state": "UNRESOLVED_AFTER_CONTEXT",
      "source": "PRE_FIX_BASELINE"
    }
  ],
  "post_top5": [
    {
      "embedding_id": "178c2c75-75c2-4d4b-a782-e6a942dea282",
      "chunk_id": "MCH-0FBD3599DAF932016F62EB9634B997AF",
      "material_id": "3c81671f-376e-401b-8525-be26929d5b92",
      "project_id": "ac1a1037-5e62-44ee-8c28-7b09d48d93e6",
      "material_type": "product_documentation",
      "corpus_scope": "ENTERPRISE_PRIVATE",
      "industry": null,
      "original_name": "performance-report.md",
      "source_type": null,
      "source_org": null,
      "source_authority": "enterprise_private",
      "lifecycle_status": "ACTIVE",
      "review_status": "approved",
      "usage_status": "ACTIVE_FULLTEXT",
      "index_status": "NOT_INDEXED",
      "effective_status": "current_status_required",
      "synthetic_test_material": false,
      "source_text": "产品：澄明数据交换平台 V3.2\n环境：8 vCPU、32 GB 内存、PostgreSQL 14、千兆局域网\n条件：50 并发、100 万条基准数据、缓存预热后执行 30 分钟\n指标：数据目录查询平均响应时间\n结果：平均 1.4 秒，P95 1.9 秒。\n日期：2025-05-16。",
      "chunk_hash": "5a54f61d10c64f26414f8dcfb93f3c1eb25076f1063d97f8200f42cad981843c",
      "embedding_model": "Qwen/Qwen3-Embedding-0.6B",
      "embedding_version": "1",
      "similarity_score": 0.5491645604869995,
      "rank": 1,
      "raw_vector_rank": 1,
      "raw_similarity": 0.5491645604869995,
      "chunk_role": "BUSINESS_CONTENT",
      "chunk_role_version": "retrieval-chunk-role-v1",
      "chunk_role_reason": "SUBSTANTIVE_SOURCE_TEXT",
      "candidate_eligibility": "EVIDENCE_ELIGIBLE",
      "source_document_id": "3c81671f-376e-401b-8525-be26929d5b92",
      "source_chunk_id": "MCH-0FBD3599DAF932016F62EB9634B997AF",
      "content_role": "unknown",
      "role_compatibility": "unknown",
      "matched_evidence_needs": [],
      "rerank_reasons": [
        "RAW_VECTOR_FALLBACK"
      ],
      "rerank_version": "4.3-role-need-rerank-v1",
      "reranked_rank": 1,
      "retrieval_contract_version": "4.3-production-retrieval-v1",
      "evidence_created": false,
      "raw_original_text": "产品：澄明数据交换平台 V3.2\n环境：8 vCPU、32 GB 内存、PostgreSQL 14、千兆局域网\n条件：50 并发、100 万条基准数据、缓存预热后执行 30 分钟\n指标：数据目录查询平均响应时间\n结果：平均 1.4 秒，P95 1.9 秒。\n日期：2025-05-16。",
      "classification": "EVIDENCE_BEARING",
      "evidence_role": "BOUNDARY_EVIDENCE",
      "reason_codes": [
        "REQUIRED_DIMENSION_SUPPORTED"
      ]
    },
    {
      "embedding_id": "582f7146-bf41-45ed-b394-bbd9e87c51d2",
      "chunk_id": "MCH-08A2CF3D5D2423E41CECF8BB230F574A",
      "material_id": "7b29cc2e-458c-4ed9-ab5a-81f99a3ddace",
      "project_id": "ac1a1037-5e62-44ee-8c28-7b09d48d93e6",
      "material_type": "product_documentation",
      "corpus_scope": "ENTERPRISE_PRIVATE",
      "industry": null,
      "original_name": "service-capability.md",
      "source_type": null,
      "source_org": null,
      "source_authority": "enterprise_private",
      "lifecycle_status": "ACTIVE",
      "review_status": "approved",
      "usage_status": "ACTIVE_FULLTEXT",
      "index_status": "NOT_INDEXED",
      "effective_status": "current_status_required",
      "synthetic_test_material": false,
      "source_text": "企业通常提供工作日 9:00-18:00 服务台、远程诊断和必要时现场支持。\n无经审核的 7×24、5 分钟响应或 99.99% SLA。",
      "chunk_hash": "783e1943f923c1b24f32697f9ebc4079271581587f0d7fada70935eadf867ed2",
      "embedding_model": "Qwen/Qwen3-Embedding-0.6B",
      "embedding_version": "1",
      "similarity_score": 0.5155732938988989,
      "rank": 2,
      "raw_vector_rank": 3,
      "raw_similarity": 0.5155732938988989,
      "chunk_role": "BUSINESS_CONTENT",
      "chunk_role_version": "retrieval-chunk-role-v1",
      "chunk_role_reason": "SUBSTANTIVE_SOURCE_TEXT",
      "candidate_eligibility": "EVIDENCE_ELIGIBLE",
      "source_document_id": "7b29cc2e-458c-4ed9-ab5a-81f99a3ddace",
      "source_chunk_id": "MCH-08A2CF3D5D2423E41CECF8BB230F574A",
      "content_role": "unknown",
      "role_compatibility": "unknown",
      "matched_evidence_needs": [],
      "rerank_reasons": [
        "RAW_VECTOR_FALLBACK"
      ],
      "rerank_version": "4.3-role-need-rerank-v1",
      "reranked_rank": 2,
      "retrieval_contract_version": "4.3-production-retrieval-v1",
      "evidence_created": false,
      "raw_original_text": "企业通常提供工作日 9:00-18:00 服务台、远程诊断和必要时现场支持。\n无经审核的 7×24、5 分钟响应或 99.99% SLA。",
      "classification": "TOPIC_RELEVANT_ONLY",
      "evidence_role": null,
      "reason_codes": [
        "REQUIRED_DIMENSION_NOT_SUPPORTED"
      ]
    },
    {
      "embedding_id": "866748ab-d797-4d45-9ae4-486bed7784a7",
      "chunk_id": "MCH-A9CA772011E7045D8F035A43E6681BE8",
      "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
      "project_id": "ac1a1037-5e62-44ee-8c28-7b09d48d93e6",
      "material_type": "company_profile",
      "corpus_scope": "ENTERPRISE_PRIVATE",
      "industry": null,
      "original_name": "pasted-text.txt",
      "source_type": null,
      "source_org": null,
      "source_authority": "enterprise_private",
      "lifecycle_status": "ACTIVE",
      "review_status": "approved",
      "usage_status": "ACTIVE_FULLTEXT",
      "index_status": "NOT_INDEXED",
      "effective_status": "current_status_required",
      "synthetic_test_material": false,
      "source_text": "Prompt =\nbackend-owned business instruction,\nversioned independently of model.",
      "chunk_hash": "e6556be44e28e5c11cf8c67ebceefa64d5244e2570aa9629fda633d555c21851",
      "embedding_model": "Qwen/Qwen3-Embedding-0.6B",
      "embedding_version": "1",
      "similarity_score": 0.472814679145813,
      "rank": 3,
      "raw_vector_rank": 4,
      "raw_similarity": 0.472814679145813,
      "chunk_role": "BUSINESS_CONTENT",
      "chunk_role_version": "retrieval-chunk-role-v1",
      "chunk_role_reason": "SUBSTANTIVE_SOURCE_TEXT",
      "candidate_eligibility": "EVIDENCE_ELIGIBLE",
      "source_document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
      "source_chunk_id": "MCH-A9CA772011E7045D8F035A43E6681BE8",
      "content_role": "unknown",
      "role_compatibility": "unknown",
      "matched_evidence_needs": [],
      "rerank_reasons": [
        "RAW_VECTOR_FALLBACK"
      ],
      "rerank_version": "4.3-role-need-rerank-v1",
      "reranked_rank": 3,
      "retrieval_contract_version": "4.3-production-retrieval-v1",
      "evidence_created": false,
      "raw_original_text": "Prompt =\nbackend-owned business instruction,\nversioned independently of model.",
      "classification": "IRRELEVANT",
      "evidence_role": null,
      "reason_codes": [
        "REQUIRED_DIMENSION_NOT_SUPPORTED"
      ]
    },
    {
      "embedding_id": "65c115af-1bb0-42ef-8b28-5a12bfe70aca",
      "chunk_id": "MCH-F6FE125F46AD101C81DA541D50D7AE47",
      "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
      "project_id": "ac1a1037-5e62-44ee-8c28-7b09d48d93e6",
      "material_type": "company_profile",
      "corpus_scope": "ENTERPRISE_PRIVATE",
      "industry": null,
      "original_name": "pasted-text.txt",
      "source_type": null,
      "source_org": null,
      "source_authority": "enterprise_private",
      "lifecycle_status": "ACTIVE",
      "review_status": "approved",
      "usage_status": "ACTIVE_FULLTEXT",
      "index_status": "NOT_INDEXED",
      "effective_status": "current_status_required",
      "synthetic_test_material": false,
      "source_text": "可控\n可追溯\n可审核\n可修改\n可交付",
      "chunk_hash": "d3170af4ab5e1b36935a5aad51b577567f93b158d140dd4e4c331296af5a3128",
      "embedding_model": "Qwen/Qwen3-Embedding-0.6B",
      "embedding_version": "1",
      "similarity_score": 0.4511462152004242,
      "rank": 4,
      "raw_vector_rank": 5,
      "raw_similarity": 0.4511462152004242,
      "chunk_role": "BUSINESS_CONTENT",
      "chunk_role_version": "retrieval-chunk-role-v1",
      "chunk_role_reason": "SUBSTANTIVE_SOURCE_TEXT",
      "candidate_eligibility": "EVIDENCE_ELIGIBLE",
      "source_document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
      "source_chunk_id": "MCH-F6FE125F46AD101C81DA541D50D7AE47",
      "content_role": "unknown",
      "role_compatibility": "unknown",
      "matched_evidence_needs": [],
      "rerank_reasons": [
        "RAW_VECTOR_FALLBACK"
      ],
      "rerank_version": "4.3-role-need-rerank-v1",
      "reranked_rank": 4,
      "retrieval_contract_version": "4.3-production-retrieval-v1",
      "evidence_created": false,
      "raw_original_text": "可控\n可追溯\n可审核\n可修改\n可交付",
      "classification": "IRRELEVANT",
      "evidence_role": null,
      "reason_codes": [
        "REQUIRED_DIMENSION_NOT_SUPPORTED"
      ]
    },
    {
      "embedding_id": "4a16189e-d3f7-4bd7-a1f5-85bcfddafe60",
      "chunk_id": "MCH-2A5877154432915455907D6094C3959B",
      "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
      "project_id": "ac1a1037-5e62-44ee-8c28-7b09d48d93e6",
      "material_type": "company_profile",
      "corpus_scope": "ENTERPRISE_PRIVATE",
      "industry": null,
      "original_name": "pasted-text.txt",
      "source_type": null,
      "source_org": null,
      "source_authority": "enterprise_private",
      "lifecycle_status": "ACTIVE",
      "review_status": "approved",
      "usage_status": "ACTIVE_FULLTEXT",
      "index_status": "NOT_INDEXED",
      "effective_status": "current_status_required",
      "synthetic_test_material": false,
      "source_text": "用户界面优先回答：",
      "chunk_hash": "280edae46b20d8e3b2ff1f273f86a7e2e77051e26103b0c0be3aaca7c0831de3",
      "embedding_model": "Qwen/Qwen3-Embedding-0.6B",
      "embedding_version": "1",
      "similarity_score": 0.44523435831069946,
      "rank": 5,
      "raw_vector_rank": 6,
      "raw_similarity": 0.44523435831069946,
      "chunk_role": "BUSINESS_CONTENT",
      "chunk_role_version": "retrieval-chunk-role-v1",
      "chunk_role_reason": "SUBSTANTIVE_SOURCE_TEXT",
      "candidate_eligibility": "EVIDENCE_ELIGIBLE",
      "source_document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
      "source_chunk_id": "MCH-2A5877154432915455907D6094C3959B",
      "content_role": "unknown",
      "role_compatibility": "unknown",
      "matched_evidence_needs": [],
      "rerank_reasons": [
        "RAW_VECTOR_FALLBACK"
      ],
      "rerank_version": "4.3-role-need-rerank-v1",
      "reranked_rank": 5,
      "retrieval_contract_version": "4.3-production-retrieval-v1",
      "evidence_created": false,
      "raw_original_text": "用户界面优先回答：",
      "classification": "IRRELEVANT",
      "evidence_role": null,
      "reason_codes": [
        "REQUIRED_DIMENSION_NOT_SUPPORTED"
      ]
    }
  ]
}
```

### V2R-003-COMP-DIRECT

- Requirement: 企业应说明产品在 x86_64、Ubuntu 和 PostgreSQL 环境的兼容性。
- PRE first useful evidence rank: 1
- POST first useful evidence rank: 1
- PRE Gold Evidence Set Hit@5: PASS
- POST Gold Evidence Set Hit@5: PASS
- Metadata removed from final lane: 1

#### Gold Evidence Set / PRE Top5 / POST Top5

```json
{
  "gold_evidence_set": [
    {
      "chunk_id": "MCH-57FE3B83C106C09B70C731182F48FFA4",
      "chunk_role": "HEADING",
      "source_hash": "1c32ff7e9aa4f1d01011898c0c195da9bd25953712aa1fdae988dfaed0d4ffea"
    },
    {
      "chunk_id": "MCH-7F11A857F9B5A05D9B22E30CD4F1BEE0",
      "chunk_role": "BUSINESS_CONTENT",
      "source_hash": "623f699df461219e4f6ce813596a352300ed47692c630db6482a97cfc41d37d5"
    }
  ],
  "pre_top5": [
    {
      "rank": 1,
      "raw_vector_rank": 1,
      "material_id": "3f9dacfb-2e48-4796-a477-98c60b506831",
      "document_id": "3f9dacfb-2e48-4796-a477-98c60b506831",
      "chunk_id": "MCH-7F11A857F9B5A05D9B22E30CD4F1BEE0",
      "score": 0.7036605234550806,
      "raw_original_text": "x86_64 + Ubuntu 22.04 + PostgreSQL 14：tested\n鲲鹏 920 + 麒麟 V10 + 达梦 8：partially_tested（完成安装和基础交换用例，未完成压力测试）\n海光 + 统信 UOS + 人大金仓：not_verified\n国产数据库组合：unknown",
      "runtime_heuristic_classification": "EVIDENCE_BEARING",
      "heuristic_reason_codes": [
        "REQUIRED_DIMENSION_SUPPORTED"
      ],
      "context_recovery_rate": 0.2,
      "context_recovery_state": "UNRESOLVED_AFTER_CONTEXT",
      "source": "PRE_FIX_BASELINE"
    },
    {
      "rank": 2,
      "raw_vector_rank": 2,
      "material_id": "3f9dacfb-2e48-4796-a477-98c60b506831",
      "document_id": "3f9dacfb-2e48-4796-a477-98c60b506831",
      "chunk_id": "MCH-57FE3B83C106C09B70C731182F48FFA4",
      "score": 0.6561677651455405,
      "raw_original_text": "# 产品兼容性矩阵",
      "runtime_heuristic_classification": "METADATA_OR_HEADER",
      "heuristic_reason_codes": [
        "METADATA_OR_HEADER"
      ],
      "context_recovery_rate": 0.2,
      "context_recovery_state": "UNRESOLVED_AFTER_RETRIEVAL",
      "source": "PRE_FIX_BASELINE"
    },
    {
      "rank": 3,
      "raw_vector_rank": 3,
      "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
      "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
      "chunk_id": "MCH-238ABC8850F42BCC571A0913A7E2AF08",
      "score": 0.5235348315793477,
      "raw_original_text": "优先成熟 MIT / Apache-2.0 等兼容开源组件。",
      "runtime_heuristic_classification": "EVIDENCE_BEARING",
      "heuristic_reason_codes": [
        "REQUIRED_DIMENSION_SUPPORTED"
      ],
      "context_recovery_rate": 0.2,
      "context_recovery_state": "UNRESOLVED_AFTER_CONTEXT",
      "source": "PRE_FIX_BASELINE"
    },
    {
      "rank": 4,
      "raw_vector_rank": 4,
      "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
      "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
      "chunk_id": "MCH-7251629B4230317EE57F8F2659926A1F",
      "score": 0.5070773354676562,
      "raw_original_text": "企业软件基础能力，\n安全、够用。",
      "runtime_heuristic_classification": "TOPIC_RELEVANT_ONLY",
      "heuristic_reason_codes": [
        "REQUIRED_DIMENSION_NOT_SUPPORTED"
      ],
      "context_recovery_rate": 0.2,
      "context_recovery_state": "UNRESOLVED_AFTER_CONTEXT",
      "source": "PRE_FIX_BASELINE"
    },
    {
      "rank": 5,
      "raw_vector_rank": 5,
      "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
      "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
      "chunk_id": "MCH-889DDF9919EF0E6485406DAB6A159A11",
      "score": 0.5034373698569921,
      "raw_original_text": "SUPPORTED\n→ 材料已满足",
      "runtime_heuristic_classification": "IRRELEVANT",
      "heuristic_reason_codes": [
        "REQUIRED_DIMENSION_NOT_SUPPORTED"
      ],
      "context_recovery_rate": 0.2,
      "context_recovery_state": "UNRESOLVED_AFTER_CONTEXT",
      "source": "PRE_FIX_BASELINE"
    }
  ],
  "post_top5": [
    {
      "embedding_id": "d5400782-7eba-4721-b3be-804dcff7ff26",
      "chunk_id": "MCH-7F11A857F9B5A05D9B22E30CD4F1BEE0",
      "material_id": "3f9dacfb-2e48-4796-a477-98c60b506831",
      "project_id": "ac1a1037-5e62-44ee-8c28-7b09d48d93e6",
      "material_type": "product_documentation",
      "corpus_scope": "ENTERPRISE_PRIVATE",
      "industry": null,
      "original_name": "compatibility-matrix.md",
      "source_type": null,
      "source_org": null,
      "source_authority": "enterprise_private",
      "lifecycle_status": "ACTIVE",
      "review_status": "approved",
      "usage_status": "ACTIVE_FULLTEXT",
      "index_status": "NOT_INDEXED",
      "effective_status": "current_status_required",
      "synthetic_test_material": false,
      "source_text": "x86_64 + Ubuntu 22.04 + PostgreSQL 14：tested\n鲲鹏 920 + 麒麟 V10 + 达梦 8：partially_tested（完成安装和基础交换用例，未完成压力测试）\n海光 + 统信 UOS + 人大金仓：not_verified\n国产数据库组合：unknown",
      "chunk_hash": "623f699df461219e4f6ce813596a352300ed47692c630db6482a97cfc41d37d5",
      "embedding_model": "Qwen/Qwen3-Embedding-0.6B",
      "embedding_version": "1",
      "similarity_score": 0.703270351496893,
      "rank": 1,
      "raw_vector_rank": 1,
      "raw_similarity": 0.703270351496893,
      "chunk_role": "BUSINESS_CONTENT",
      "chunk_role_version": "retrieval-chunk-role-v1",
      "chunk_role_reason": "SUBSTANTIVE_SOURCE_TEXT",
      "candidate_eligibility": "EVIDENCE_ELIGIBLE",
      "source_document_id": "3f9dacfb-2e48-4796-a477-98c60b506831",
      "source_chunk_id": "MCH-7F11A857F9B5A05D9B22E30CD4F1BEE0",
      "content_role": "unknown",
      "role_compatibility": "unknown",
      "matched_evidence_needs": [],
      "rerank_reasons": [
        "RAW_VECTOR_FALLBACK"
      ],
      "rerank_version": "4.3-role-need-rerank-v1",
      "reranked_rank": 1,
      "retrieval_contract_version": "4.3-production-retrieval-v1",
      "evidence_created": false,
      "raw_original_text": "x86_64 + Ubuntu 22.04 + PostgreSQL 14：tested\n鲲鹏 920 + 麒麟 V10 + 达梦 8：partially_tested（完成安装和基础交换用例，未完成压力测试）\n海光 + 统信 UOS + 人大金仓：not_verified\n国产数据库组合：unknown",
      "classification": "EVIDENCE_BEARING",
      "evidence_role": "ADVERSE_EVIDENCE",
      "reason_codes": [
        "REQUIRED_DIMENSION_SUPPORTED"
      ]
    },
    {
      "embedding_id": "f633fb04-bcaa-450d-9b17-d181ea052479",
      "chunk_id": "MCH-238ABC8850F42BCC571A0913A7E2AF08",
      "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
      "project_id": "ac1a1037-5e62-44ee-8c28-7b09d48d93e6",
      "material_type": "company_profile",
      "corpus_scope": "ENTERPRISE_PRIVATE",
      "industry": null,
      "original_name": "pasted-text.txt",
      "source_type": null,
      "source_org": null,
      "source_authority": "enterprise_private",
      "lifecycle_status": "ACTIVE",
      "review_status": "approved",
      "usage_status": "ACTIVE_FULLTEXT",
      "index_status": "NOT_INDEXED",
      "effective_status": "current_status_required",
      "synthetic_test_material": false,
      "source_text": "优先成熟 MIT / Apache-2.0 等兼容开源组件。",
      "chunk_hash": "f4c00f8cb0dd727ef1581e6948eb8cb9a9da64f064f8272bf55dfb04650ae548",
      "embedding_model": "Qwen/Qwen3-Embedding-0.6B",
      "embedding_version": "1",
      "similarity_score": 0.5228031250473112,
      "rank": 2,
      "raw_vector_rank": 3,
      "raw_similarity": 0.5228031250473112,
      "chunk_role": "BUSINESS_CONTENT",
      "chunk_role_version": "retrieval-chunk-role-v1",
      "chunk_role_reason": "SUBSTANTIVE_SOURCE_TEXT",
      "candidate_eligibility": "EVIDENCE_ELIGIBLE",
      "source_document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
      "source_chunk_id": "MCH-238ABC8850F42BCC571A0913A7E2AF08",
      "content_role": "unknown",
      "role_compatibility": "unknown",
      "matched_evidence_needs": [],
      "rerank_reasons": [
        "RAW_VECTOR_FALLBACK"
      ],
      "rerank_version": "4.3-role-need-rerank-v1",
      "reranked_rank": 2,
      "retrieval_contract_version": "4.3-production-retrieval-v1",
      "evidence_created": false,
      "raw_original_text": "优先成熟 MIT / Apache-2.0 等兼容开源组件。",
      "classification": "TOPIC_RELEVANT_ONLY",
      "evidence_role": null,
      "reason_codes": [
        "REQUIRED_DIMENSION_NOT_SUPPORTED"
      ]
    },
    {
      "embedding_id": "74e8e8a9-9773-437c-824a-bea5e78be6e3",
      "chunk_id": "MCH-7251629B4230317EE57F8F2659926A1F",
      "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
      "project_id": "ac1a1037-5e62-44ee-8c28-7b09d48d93e6",
      "material_type": "company_profile",
      "corpus_scope": "ENTERPRISE_PRIVATE",
      "industry": null,
      "original_name": "pasted-text.txt",
      "source_type": null,
      "source_org": null,
      "source_authority": "enterprise_private",
      "lifecycle_status": "ACTIVE",
      "review_status": "approved",
      "usage_status": "ACTIVE_FULLTEXT",
      "index_status": "NOT_INDEXED",
      "effective_status": "current_status_required",
      "synthetic_test_material": false,
      "source_text": "企业软件基础能力，\n安全、够用。",
      "chunk_hash": "b179ac612aa11feab83c269ca5569cec1c26807c9aa8469881e5ba11bd4943a0",
      "embedding_model": "Qwen/Qwen3-Embedding-0.6B",
      "embedding_version": "1",
      "similarity_score": 0.5070906869064943,
      "rank": 3,
      "raw_vector_rank": 4,
      "raw_similarity": 0.5070906869064943,
      "chunk_role": "BUSINESS_CONTENT",
      "chunk_role_version": "retrieval-chunk-role-v1",
      "chunk_role_reason": "SUBSTANTIVE_SOURCE_TEXT",
      "candidate_eligibility": "EVIDENCE_ELIGIBLE",
      "source_document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
      "source_chunk_id": "MCH-7251629B4230317EE57F8F2659926A1F",
      "content_role": "unknown",
      "role_compatibility": "unknown",
      "matched_evidence_needs": [],
      "rerank_reasons": [
        "RAW_VECTOR_FALLBACK"
      ],
      "rerank_version": "4.3-role-need-rerank-v1",
      "reranked_rank": 3,
      "retrieval_contract_version": "4.3-production-retrieval-v1",
      "evidence_created": false,
      "raw_original_text": "企业软件基础能力，\n安全、够用。",
      "classification": "TOPIC_RELEVANT_ONLY",
      "evidence_role": null,
      "reason_codes": [
        "REQUIRED_DIMENSION_NOT_SUPPORTED"
      ]
    },
    {
      "embedding_id": "87c85b13-180f-4310-bf39-83887eeb4015",
      "chunk_id": "MCH-889DDF9919EF0E6485406DAB6A159A11",
      "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
      "project_id": "ac1a1037-5e62-44ee-8c28-7b09d48d93e6",
      "material_type": "company_profile",
      "corpus_scope": "ENTERPRISE_PRIVATE",
      "industry": null,
      "original_name": "pasted-text.txt",
      "source_type": null,
      "source_org": null,
      "source_authority": "enterprise_private",
      "lifecycle_status": "ACTIVE",
      "review_status": "approved",
      "usage_status": "ACTIVE_FULLTEXT",
      "index_status": "NOT_INDEXED",
      "effective_status": "current_status_required",
      "synthetic_test_material": false,
      "source_text": "SUPPORTED\n→ 材料已满足",
      "chunk_hash": "c0f667ac9cf6428b1e9f8a29f652bbff6e46d3a270bd83b1cd10f97dace2e091",
      "embedding_model": "Qwen/Qwen3-Embedding-0.6B",
      "embedding_version": "1",
      "similarity_score": 0.5029561219837602,
      "rank": 4,
      "raw_vector_rank": 5,
      "raw_similarity": 0.5029561219837602,
      "chunk_role": "BUSINESS_CONTENT",
      "chunk_role_version": "retrieval-chunk-role-v1",
      "chunk_role_reason": "SUBSTANTIVE_SOURCE_TEXT",
      "candidate_eligibility": "EVIDENCE_ELIGIBLE",
      "source_document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
      "source_chunk_id": "MCH-889DDF9919EF0E6485406DAB6A159A11",
      "content_role": "unknown",
      "role_compatibility": "unknown",
      "matched_evidence_needs": [],
      "rerank_reasons": [
        "RAW_VECTOR_FALLBACK"
      ],
      "rerank_version": "4.3-role-need-rerank-v1",
      "reranked_rank": 4,
      "retrieval_contract_version": "4.3-production-retrieval-v1",
      "evidence_created": false,
      "raw_original_text": "SUPPORTED\n→ 材料已满足",
      "classification": "IRRELEVANT",
      "evidence_role": null,
      "reason_codes": [
        "REQUIRED_DIMENSION_NOT_SUPPORTED"
      ]
    },
    {
      "embedding_id": "178c2c75-75c2-4d4b-a782-e6a942dea282",
      "chunk_id": "MCH-0FBD3599DAF932016F62EB9634B997AF",
      "material_id": "3c81671f-376e-401b-8525-be26929d5b92",
      "project_id": "ac1a1037-5e62-44ee-8c28-7b09d48d93e6",
      "material_type": "product_documentation",
      "corpus_scope": "ENTERPRISE_PRIVATE",
      "industry": null,
      "original_name": "performance-report.md",
      "source_type": null,
      "source_org": null,
      "source_authority": "enterprise_private",
      "lifecycle_status": "ACTIVE",
      "review_status": "approved",
      "usage_status": "ACTIVE_FULLTEXT",
      "index_status": "NOT_INDEXED",
      "effective_status": "current_status_required",
      "synthetic_test_material": false,
      "source_text": "产品：澄明数据交换平台 V3.2\n环境：8 vCPU、32 GB 内存、PostgreSQL 14、千兆局域网\n条件：50 并发、100 万条基准数据、缓存预热后执行 30 分钟\n指标：数据目录查询平均响应时间\n结果：平均 1.4 秒，P95 1.9 秒。\n日期：2025-05-16。",
      "chunk_hash": "5a54f61d10c64f26414f8dcfb93f3c1eb25076f1063d97f8200f42cad981843c",
      "embedding_model": "Qwen/Qwen3-Embedding-0.6B",
      "embedding_version": "1",
      "similarity_score": 0.5015071628681227,
      "rank": 5,
      "raw_vector_rank": 6,
      "raw_similarity": 0.5015071628681227,
      "chunk_role": "BUSINESS_CONTENT",
      "chunk_role_version": "retrieval-chunk-role-v1",
      "chunk_role_reason": "SUBSTANTIVE_SOURCE_TEXT",
      "candidate_eligibility": "EVIDENCE_ELIGIBLE",
      "source_document_id": "3c81671f-376e-401b-8525-be26929d5b92",
      "source_chunk_id": "MCH-0FBD3599DAF932016F62EB9634B997AF",
      "content_role": "unknown",
      "role_compatibility": "unknown",
      "matched_evidence_needs": [],
      "rerank_reasons": [
        "RAW_VECTOR_FALLBACK"
      ],
      "rerank_version": "4.3-role-need-rerank-v1",
      "reranked_rank": 5,
      "retrieval_contract_version": "4.3-production-retrieval-v1",
      "evidence_created": false,
      "raw_original_text": "产品：澄明数据交换平台 V3.2\n环境：8 vCPU、32 GB 内存、PostgreSQL 14、千兆局域网\n条件：50 并发、100 万条基准数据、缓存预热后执行 30 分钟\n指标：数据目录查询平均响应时间\n结果：平均 1.4 秒，P95 1.9 秒。\n日期：2025-05-16。",
      "classification": "TOPIC_RELEVANT_ONLY",
      "evidence_role": null,
      "reason_codes": [
        "REQUIRED_DIMENSION_NOT_SUPPORTED"
      ]
    }
  ]
}
```

### V2R-004-COMP-PARTIAL

- Requirement: 企业应证明所有国产数据库组合均已完成压力测试。
- PRE first useful evidence rank: 1
- POST first useful evidence rank: 1
- PRE Gold Evidence Set Hit@5: PASS
- POST Gold Evidence Set Hit@5: PASS
- Metadata removed from final lane: 2

#### Gold Evidence Set / PRE Top5 / POST Top5

```json
{
  "gold_evidence_set": [
    {
      "chunk_id": "MCH-57FE3B83C106C09B70C731182F48FFA4",
      "chunk_role": "HEADING",
      "source_hash": "1c32ff7e9aa4f1d01011898c0c195da9bd25953712aa1fdae988dfaed0d4ffea"
    },
    {
      "chunk_id": "MCH-7F11A857F9B5A05D9B22E30CD4F1BEE0",
      "chunk_role": "BUSINESS_CONTENT",
      "source_hash": "623f699df461219e4f6ce813596a352300ed47692c630db6482a97cfc41d37d5"
    }
  ],
  "pre_top5": [
    {
      "rank": 1,
      "raw_vector_rank": 1,
      "material_id": "3f9dacfb-2e48-4796-a477-98c60b506831",
      "document_id": "3f9dacfb-2e48-4796-a477-98c60b506831",
      "chunk_id": "MCH-7F11A857F9B5A05D9B22E30CD4F1BEE0",
      "score": 0.7040744600251652,
      "raw_original_text": "x86_64 + Ubuntu 22.04 + PostgreSQL 14：tested\n鲲鹏 920 + 麒麟 V10 + 达梦 8：partially_tested（完成安装和基础交换用例，未完成压力测试）\n海光 + 统信 UOS + 人大金仓：not_verified\n国产数据库组合：unknown",
      "runtime_heuristic_classification": "EVIDENCE_BEARING",
      "heuristic_reason_codes": [
        "REQUIRED_DIMENSION_SUPPORTED"
      ],
      "context_recovery_rate": 0.25,
      "context_recovery_state": "UNRESOLVED_AFTER_CONTEXT",
      "source": "PRE_FIX_BASELINE"
    },
    {
      "rank": 2,
      "raw_vector_rank": 2,
      "material_id": "3c81671f-376e-401b-8525-be26929d5b92",
      "document_id": "3c81671f-376e-401b-8525-be26929d5b92",
      "chunk_id": "MCH-B4FF02295DBB6DCDF6E2763F057076F6",
      "score": 0.5661619047023011,
      "raw_original_text": "# 数据交换平台性能测试记录",
      "runtime_heuristic_classification": "METADATA_OR_HEADER",
      "heuristic_reason_codes": [
        "METADATA_OR_HEADER"
      ],
      "context_recovery_rate": 0.75,
      "context_recovery_state": "UNRESOLVED_AFTER_RETRIEVAL",
      "source": "PRE_FIX_BASELINE"
    },
    {
      "rank": 3,
      "raw_vector_rank": 3,
      "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
      "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
      "chunk_id": "MCH-6BA94F47BCD831E596F751A2BEA49AB8",
      "score": 0.49553072452545166,
      "raw_original_text": "commit 前：\n相关 tests PASS。",
      "runtime_heuristic_classification": "IRRELEVANT",
      "heuristic_reason_codes": [
        "REQUIRED_DIMENSION_NOT_SUPPORTED"
      ],
      "context_recovery_rate": 0.5,
      "context_recovery_state": "UNRESOLVED_AFTER_RETRIEVAL",
      "source": "PRE_FIX_BASELINE"
    },
    {
      "rank": 4,
      "raw_vector_rank": 4,
      "material_id": "3f9dacfb-2e48-4796-a477-98c60b506831",
      "document_id": "3f9dacfb-2e48-4796-a477-98c60b506831",
      "chunk_id": "MCH-57FE3B83C106C09B70C731182F48FFA4",
      "score": 0.49169252738588,
      "raw_original_text": "# 产品兼容性矩阵",
      "runtime_heuristic_classification": "METADATA_OR_HEADER",
      "heuristic_reason_codes": [
        "METADATA_OR_HEADER"
      ],
      "context_recovery_rate": 0.25,
      "context_recovery_state": "UNRESOLVED_AFTER_RETRIEVAL",
      "source": "PRE_FIX_BASELINE"
    },
    {
      "rank": 5,
      "raw_vector_rank": 5,
      "material_id": "3c81671f-376e-401b-8525-be26929d5b92",
      "document_id": "3c81671f-376e-401b-8525-be26929d5b92",
      "chunk_id": "MCH-0FBD3599DAF932016F62EB9634B997AF",
      "score": 0.4748999789416811,
      "raw_original_text": "产品：澄明数据交换平台 V3.2\n环境：8 vCPU、32 GB 内存、PostgreSQL 14、千兆局域网\n条件：50 并发、100 万条基准数据、缓存预热后执行 30 分钟\n指标：数据目录查询平均响应时间\n结果：平均 1.4 秒，P95 1.9 秒。\n日期：2025-05-16。",
      "runtime_heuristic_classification": "TOPIC_RELEVANT_ONLY",
      "heuristic_reason_codes": [
        "REQUIRED_DIMENSION_NOT_SUPPORTED"
      ],
      "context_recovery_rate": 0.75,
      "context_recovery_state": "UNRESOLVED_AFTER_CONTEXT",
      "source": "PRE_FIX_BASELINE"
    }
  ],
  "post_top5": [
    {
      "embedding_id": "d5400782-7eba-4721-b3be-804dcff7ff26",
      "chunk_id": "MCH-7F11A857F9B5A05D9B22E30CD4F1BEE0",
      "material_id": "3f9dacfb-2e48-4796-a477-98c60b506831",
      "project_id": "ac1a1037-5e62-44ee-8c28-7b09d48d93e6",
      "material_type": "product_documentation",
      "corpus_scope": "ENTERPRISE_PRIVATE",
      "industry": null,
      "original_name": "compatibility-matrix.md",
      "source_type": null,
      "source_org": null,
      "source_authority": "enterprise_private",
      "lifecycle_status": "ACTIVE",
      "review_status": "approved",
      "usage_status": "ACTIVE_FULLTEXT",
      "index_status": "NOT_INDEXED",
      "effective_status": "current_status_required",
      "synthetic_test_material": false,
      "source_text": "x86_64 + Ubuntu 22.04 + PostgreSQL 14：tested\n鲲鹏 920 + 麒麟 V10 + 达梦 8：partially_tested（完成安装和基础交换用例，未完成压力测试）\n海光 + 统信 UOS + 人大金仓：not_verified\n国产数据库组合：unknown",
      "chunk_hash": "623f699df461219e4f6ce813596a352300ed47692c630db6482a97cfc41d37d5",
      "embedding_model": "Qwen/Qwen3-Embedding-0.6B",
      "embedding_version": "1",
      "similarity_score": 0.7040744600251652,
      "rank": 1,
      "raw_vector_rank": 1,
      "raw_similarity": 0.7040744600251652,
      "chunk_role": "BUSINESS_CONTENT",
      "chunk_role_version": "retrieval-chunk-role-v1",
      "chunk_role_reason": "SUBSTANTIVE_SOURCE_TEXT",
      "candidate_eligibility": "EVIDENCE_ELIGIBLE",
      "source_document_id": "3f9dacfb-2e48-4796-a477-98c60b506831",
      "source_chunk_id": "MCH-7F11A857F9B5A05D9B22E30CD4F1BEE0",
      "content_role": "unknown",
      "role_compatibility": "unknown",
      "matched_evidence_needs": [],
      "rerank_reasons": [
        "RAW_VECTOR_FALLBACK"
      ],
      "rerank_version": "4.3-role-need-rerank-v1",
      "reranked_rank": 1,
      "retrieval_contract_version": "4.3-production-retrieval-v1",
      "evidence_created": false,
      "raw_original_text": "x86_64 + Ubuntu 22.04 + PostgreSQL 14：tested\n鲲鹏 920 + 麒麟 V10 + 达梦 8：partially_tested（完成安装和基础交换用例，未完成压力测试）\n海光 + 统信 UOS + 人大金仓：not_verified\n国产数据库组合：unknown",
      "classification": "EVIDENCE_BEARING",
      "evidence_role": "ADVERSE_EVIDENCE",
      "reason_codes": [
        "REQUIRED_DIMENSION_SUPPORTED"
      ]
    },
    {
      "embedding_id": "d7dd0339-5273-4a5c-aacc-a3c4a07ade0e",
      "chunk_id": "MCH-6BA94F47BCD831E596F751A2BEA49AB8",
      "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
      "project_id": "ac1a1037-5e62-44ee-8c28-7b09d48d93e6",
      "material_type": "company_profile",
      "corpus_scope": "ENTERPRISE_PRIVATE",
      "industry": null,
      "original_name": "pasted-text.txt",
      "source_type": null,
      "source_org": null,
      "source_authority": "enterprise_private",
      "lifecycle_status": "ACTIVE",
      "review_status": "approved",
      "usage_status": "ACTIVE_FULLTEXT",
      "index_status": "NOT_INDEXED",
      "effective_status": "current_status_required",
      "synthetic_test_material": false,
      "source_text": "commit 前：\n相关 tests PASS。",
      "chunk_hash": "c2ee2141540acc1f83f48c4c89eef0a5ce4f5ff6c8784936cfbbc2fc373969b1",
      "embedding_model": "Qwen/Qwen3-Embedding-0.6B",
      "embedding_version": "1",
      "similarity_score": 0.49553072452545166,
      "rank": 2,
      "raw_vector_rank": 3,
      "raw_similarity": 0.49553072452545166,
      "chunk_role": "BUSINESS_CONTENT",
      "chunk_role_version": "retrieval-chunk-role-v1",
      "chunk_role_reason": "SUBSTANTIVE_SOURCE_TEXT",
      "candidate_eligibility": "EVIDENCE_ELIGIBLE",
      "source_document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
      "source_chunk_id": "MCH-6BA94F47BCD831E596F751A2BEA49AB8",
      "content_role": "unknown",
      "role_compatibility": "unknown",
      "matched_evidence_needs": [],
      "rerank_reasons": [
        "RAW_VECTOR_FALLBACK"
      ],
      "rerank_version": "4.3-role-need-rerank-v1",
      "reranked_rank": 2,
      "retrieval_contract_version": "4.3-production-retrieval-v1",
      "evidence_created": false,
      "raw_original_text": "commit 前：\n相关 tests PASS。",
      "classification": "IRRELEVANT",
      "evidence_role": null,
      "reason_codes": [
        "REQUIRED_DIMENSION_NOT_SUPPORTED"
      ]
    },
    {
      "embedding_id": "178c2c75-75c2-4d4b-a782-e6a942dea282",
      "chunk_id": "MCH-0FBD3599DAF932016F62EB9634B997AF",
      "material_id": "3c81671f-376e-401b-8525-be26929d5b92",
      "project_id": "ac1a1037-5e62-44ee-8c28-7b09d48d93e6",
      "material_type": "product_documentation",
      "corpus_scope": "ENTERPRISE_PRIVATE",
      "industry": null,
      "original_name": "performance-report.md",
      "source_type": null,
      "source_org": null,
      "source_authority": "enterprise_private",
      "lifecycle_status": "ACTIVE",
      "review_status": "approved",
      "usage_status": "ACTIVE_FULLTEXT",
      "index_status": "NOT_INDEXED",
      "effective_status": "current_status_required",
      "synthetic_test_material": false,
      "source_text": "产品：澄明数据交换平台 V3.2\n环境：8 vCPU、32 GB 内存、PostgreSQL 14、千兆局域网\n条件：50 并发、100 万条基准数据、缓存预热后执行 30 分钟\n指标：数据目录查询平均响应时间\n结果：平均 1.4 秒，P95 1.9 秒。\n日期：2025-05-16。",
      "chunk_hash": "5a54f61d10c64f26414f8dcfb93f3c1eb25076f1063d97f8200f42cad981843c",
      "embedding_model": "Qwen/Qwen3-Embedding-0.6B",
      "embedding_version": "1",
      "similarity_score": 0.4748999789416811,
      "rank": 3,
      "raw_vector_rank": 5,
      "raw_similarity": 0.4748999789416811,
      "chunk_role": "BUSINESS_CONTENT",
      "chunk_role_version": "retrieval-chunk-role-v1",
      "chunk_role_reason": "SUBSTANTIVE_SOURCE_TEXT",
      "candidate_eligibility": "EVIDENCE_ELIGIBLE",
      "source_document_id": "3c81671f-376e-401b-8525-be26929d5b92",
      "source_chunk_id": "MCH-0FBD3599DAF932016F62EB9634B997AF",
      "content_role": "unknown",
      "role_compatibility": "unknown",
      "matched_evidence_needs": [],
      "rerank_reasons": [
        "RAW_VECTOR_FALLBACK"
      ],
      "rerank_version": "4.3-role-need-rerank-v1",
      "reranked_rank": 3,
      "retrieval_contract_version": "4.3-production-retrieval-v1",
      "evidence_created": false,
      "raw_original_text": "产品：澄明数据交换平台 V3.2\n环境：8 vCPU、32 GB 内存、PostgreSQL 14、千兆局域网\n条件：50 并发、100 万条基准数据、缓存预热后执行 30 分钟\n指标：数据目录查询平均响应时间\n结果：平均 1.4 秒，P95 1.9 秒。\n日期：2025-05-16。",
      "classification": "TOPIC_RELEVANT_ONLY",
      "evidence_role": null,
      "reason_codes": [
        "REQUIRED_DIMENSION_NOT_SUPPORTED"
      ]
    },
    {
      "embedding_id": "c0f88f64-ba02-4aba-a470-60258f2658e1",
      "chunk_id": "MCH-650DE173A9B8AA958EEB850251D70FE2",
      "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
      "project_id": "ac1a1037-5e62-44ee-8c28-7b09d48d93e6",
      "material_type": "company_profile",
      "corpus_scope": "ENTERPRISE_PRIVATE",
      "industry": null,
      "original_name": "pasted-text.txt",
      "source_type": null,
      "source_org": null,
      "source_authority": "enterprise_private",
      "lifecycle_status": "ACTIVE",
      "review_status": "approved",
      "usage_status": "ACTIVE_FULLTEXT",
      "index_status": "NOT_INDEXED",
      "effective_status": "current_status_required",
      "synthetic_test_material": false,
      "source_text": "Ensure:",
      "chunk_hash": "ce4f9b0c3247f5ed5100b4f861269ead8df993f0065fcc71788d114aecbd5cd3",
      "embedding_model": "Qwen/Qwen3-Embedding-0.6B",
      "embedding_version": "1",
      "similarity_score": 0.4634121700033972,
      "rank": 4,
      "raw_vector_rank": 6,
      "raw_similarity": 0.4634121700033972,
      "chunk_role": "BUSINESS_CONTENT",
      "chunk_role_version": "retrieval-chunk-role-v1",
      "chunk_role_reason": "SUBSTANTIVE_SOURCE_TEXT",
      "candidate_eligibility": "EVIDENCE_ELIGIBLE",
      "source_document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
      "source_chunk_id": "MCH-650DE173A9B8AA958EEB850251D70FE2",
      "content_role": "unknown",
      "role_compatibility": "unknown",
      "matched_evidence_needs": [],
      "rerank_reasons": [
        "RAW_VECTOR_FALLBACK"
      ],
      "rerank_version": "4.3-role-need-rerank-v1",
      "reranked_rank": 4,
      "retrieval_contract_version": "4.3-production-retrieval-v1",
      "evidence_created": false,
      "raw_original_text": "Ensure:",
      "classification": "IRRELEVANT",
      "evidence_role": null,
      "reason_codes": [
        "REQUIRED_DIMENSION_NOT_SUPPORTED"
      ]
    },
    {
      "embedding_id": "d7dd84a2-ea10-4bf5-83d3-6761ca4dfb64",
      "chunk_id": "MCH-2684A33DDF84C68B4CA59C348136BB30",
      "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
      "project_id": "ac1a1037-5e62-44ee-8c28-7b09d48d93e6",
      "material_type": "company_profile",
      "corpus_scope": "ENTERPRISE_PRIVATE",
      "industry": null,
      "original_name": "pasted-text.txt",
      "source_type": null,
      "source_org": null,
      "source_authority": "enterprise_private",
      "lifecycle_status": "ACTIVE",
      "review_status": "approved",
      "usage_status": "ACTIVE_FULLTEXT",
      "index_status": "NOT_INDEXED",
      "effective_status": "current_status_required",
      "synthetic_test_material": false,
      "source_text": "当前直接相关代码和测试。",
      "chunk_hash": "832b742e2c3b41906a78107e464bdf8547938628b655f95f0383e5ad3e9d30e2",
      "embedding_model": "Qwen/Qwen3-Embedding-0.6B",
      "embedding_version": "1",
      "similarity_score": 0.4578753113746643,
      "rank": 5,
      "raw_vector_rank": 7,
      "raw_similarity": 0.4578753113746643,
      "chunk_role": "BUSINESS_CONTENT",
      "chunk_role_version": "retrieval-chunk-role-v1",
      "chunk_role_reason": "SUBSTANTIVE_SOURCE_TEXT",
      "candidate_eligibility": "EVIDENCE_ELIGIBLE",
      "source_document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
      "source_chunk_id": "MCH-2684A33DDF84C68B4CA59C348136BB30",
      "content_role": "unknown",
      "role_compatibility": "unknown",
      "matched_evidence_needs": [],
      "rerank_reasons": [
        "RAW_VECTOR_FALLBACK"
      ],
      "rerank_version": "4.3-role-need-rerank-v1",
      "reranked_rank": 5,
      "retrieval_contract_version": "4.3-production-retrieval-v1",
      "evidence_created": false,
      "raw_original_text": "当前直接相关代码和测试。",
      "classification": "TOPIC_RELEVANT_ONLY",
      "evidence_role": null,
      "reason_codes": [
        "REQUIRED_DIMENSION_NOT_SUPPORTED"
      ]
    }
  ]
}
```

### V2R-005-ISO-DIRECT

- Requirement: 企业应提供当前有效的 ISO/IEC 27001 认证信息。
- PRE first useful evidence rank: 1
- POST first useful evidence rank: 1
- PRE Gold Evidence Set Hit@5: PASS
- POST Gold Evidence Set Hit@5: PASS
- Metadata removed from final lane: 2

#### Gold Evidence Set / PRE Top5 / POST Top5

```json
{
  "gold_evidence_set": [
    {
      "chunk_id": "MCH-0820CC5A439CB986C62E46213029CC71",
      "chunk_role": "HEADING",
      "source_hash": "e4bbd720010befabbdd08b947acc803b7f0c52b5ccdbf8da7f5b169e76f19215"
    },
    {
      "chunk_id": "MCH-A4C2632EF9126FADD349C3004E1C2D84",
      "chunk_role": "BUSINESS_CONTENT",
      "source_hash": "4aad371afadcb5d360f7461d405d06e706132aa072271064a297010ab458572f"
    }
  ],
  "pre_top5": [
    {
      "rank": 1,
      "raw_vector_rank": 1,
      "material_id": "74ed566b-18c0-41a1-ba55-59cbe182251c",
      "document_id": "74ed566b-18c0-41a1-ba55-59cbe182251c",
      "chunk_id": "MCH-70376020855F97D43106A81E5F040C7F",
      "score": 0.7175531387329153,
      "raw_original_text": "企业持有在有效期内的 ISO/IEC 27001 受控记录。该事实不证明任一产品已实现特定安全等级、等保级别或具体安全功能。",
      "runtime_heuristic_classification": "EVIDENCE_BEARING",
      "heuristic_reason_codes": [
        "REQUIRED_DIMENSION_SUPPORTED"
      ],
      "context_recovery_rate": 0.16666666666666666,
      "context_recovery_state": "UNRESOLVED_AFTER_CONTEXT",
      "source": "PRE_FIX_BASELINE"
    },
    {
      "rank": 2,
      "raw_vector_rank": 2,
      "material_id": "57b9e5fe-9549-42aa-88d5-fccc5c0afe2e",
      "document_id": "57b9e5fe-9549-42aa-88d5-fccc5c0afe2e",
      "chunk_id": "MCH-A4C2632EF9126FADD349C3004E1C2D84",
      "score": 0.6661979755045202,
      "raw_original_text": "名称：ISO/IEC 27001\n编号：CM-Q-27001-2024\n状态：active\n有效至：2027-11-30",
      "runtime_heuristic_classification": "EVIDENCE_BEARING",
      "heuristic_reason_codes": [
        "REQUIRED_DIMENSION_SUPPORTED"
      ],
      "context_recovery_rate": 0.6666666666666666,
      "context_recovery_state": "UNRESOLVED_AFTER_CONTEXT",
      "source": "PRE_FIX_BASELINE"
    },
    {
      "rank": 3,
      "raw_vector_rank": 3,
      "material_id": "57b9e5fe-9549-42aa-88d5-fccc5c0afe2e",
      "document_id": "57b9e5fe-9549-42aa-88d5-fccc5c0afe2e",
      "chunk_id": "MCH-0820CC5A439CB986C62E46213029CC71",
      "score": 0.6532460061761148,
      "raw_original_text": "# ISO 27001 受控记录",
      "runtime_heuristic_classification": "METADATA_OR_HEADER",
      "heuristic_reason_codes": [
        "METADATA_OR_HEADER"
      ],
      "context_recovery_rate": 0.6666666666666666,
      "context_recovery_state": "UNRESOLVED_AFTER_RETRIEVAL",
      "source": "PRE_FIX_BASELINE"
    },
    {
      "rank": 4,
      "raw_vector_rank": 4,
      "material_id": "c5395bc4-0531-4e6f-9f0c-3562cee0a2f1",
      "document_id": "c5395bc4-0531-4e6f-9f0c-3562cee0a2f1",
      "chunk_id": "MCH-D37B061257382C31A3C757430BDD2CA6",
      "score": 0.6045245763942863,
      "raw_original_text": "# ISO 9001 受控记录",
      "runtime_heuristic_classification": "METADATA_OR_HEADER",
      "heuristic_reason_codes": [
        "METADATA_OR_HEADER"
      ],
      "context_recovery_rate": 0.6666666666666666,
      "context_recovery_state": "UNRESOLVED_AFTER_RETRIEVAL",
      "source": "PRE_FIX_BASELINE"
    },
    {
      "rank": 5,
      "raw_vector_rank": 5,
      "material_id": "c5395bc4-0531-4e6f-9f0c-3562cee0a2f1",
      "document_id": "c5395bc4-0531-4e6f-9f0c-3562cee0a2f1",
      "chunk_id": "MCH-A160D3E488BD50C27E5F6267363E57B1",
      "score": 0.5497893363362956,
      "raw_original_text": "名称：ISO 9001\n编号：CM-Q-9001-2025\n状态：active\n有效至：2028-03-31",
      "runtime_heuristic_classification": "EVIDENCE_BEARING",
      "heuristic_reason_codes": [
        "REQUIRED_DIMENSION_SUPPORTED"
      ],
      "context_recovery_rate": 0.6666666666666666,
      "context_recovery_state": "UNRESOLVED_AFTER_CONTEXT",
      "source": "PRE_FIX_BASELINE"
    }
  ],
  "post_top5": [
    {
      "embedding_id": "d65131d1-e89e-4f1d-a050-6557b70e54ec",
      "chunk_id": "MCH-70376020855F97D43106A81E5F040C7F",
      "material_id": "74ed566b-18c0-41a1-ba55-59cbe182251c",
      "project_id": "ac1a1037-5e62-44ee-8c28-7b09d48d93e6",
      "material_type": "technical_whitepaper",
      "corpus_scope": "ENTERPRISE_PRIVATE",
      "industry": null,
      "original_name": "security-reference.md",
      "source_type": null,
      "source_org": null,
      "source_authority": "enterprise_private",
      "lifecycle_status": "ACTIVE",
      "review_status": "approved",
      "usage_status": "ACTIVE_FULLTEXT",
      "index_status": "NOT_INDEXED",
      "effective_status": "current_status_required",
      "synthetic_test_material": false,
      "source_text": "企业持有在有效期内的 ISO/IEC 27001 受控记录。该事实不证明任一产品已实现特定安全等级、等保级别或具体安全功能。",
      "chunk_hash": "c5ea4f48363c4c562e78cfe9c0197562cf18a98f645cac95e50475fa29bf0d7d",
      "embedding_model": "Qwen/Qwen3-Embedding-0.6B",
      "embedding_version": "1",
      "similarity_score": 0.716691558065256,
      "rank": 1,
      "raw_vector_rank": 1,
      "raw_similarity": 0.716691558065256,
      "chunk_role": "BUSINESS_CONTENT",
      "chunk_role_version": "retrieval-chunk-role-v1",
      "chunk_role_reason": "SUBSTANTIVE_SOURCE_TEXT",
      "candidate_eligibility": "EVIDENCE_ELIGIBLE",
      "source_route": "PROOF_ELIGIBLE",
      "proof_eligibility": "PROOF_ELIGIBLE",
      "proof_eligible": true,
      "proof_capable": true,
      "routing_reason": [
        "EVIDENCE_INTENT_AND_SOURCE_QUALIFIED"
      ],
      "source_scope": "ENTERPRISE_PRIVATE",
      "source_document_id": "74ed566b-18c0-41a1-ba55-59cbe182251c",
      "source_chunk_id": "MCH-70376020855F97D43106A81E5F040C7F",
      "content_role": "unknown",
      "role_compatibility": "unknown",
      "matched_evidence_needs": [],
      "rerank_reasons": [
        "RAW_VECTOR_FALLBACK"
      ],
      "rerank_version": "4.3-role-need-rerank-v1",
      "reranked_rank": 1,
      "retrieval_contract_version": "4.3-production-retrieval-v1",
      "evidence_created": false,
      "raw_original_text": "企业持有在有效期内的 ISO/IEC 27001 受控记录。该事实不证明任一产品已实现特定安全等级、等保级别或具体安全功能。",
      "classification": "EVIDENCE_BEARING",
      "evidence_role": "BOUNDARY_EVIDENCE",
      "reason_codes": [
        "REQUIRED_DIMENSION_SUPPORTED"
      ]
    },
    {
      "embedding_id": "7b5129d0-f8f3-41b1-8714-3a758bd926eb",
      "chunk_id": "MCH-A4C2632EF9126FADD349C3004E1C2D84",
      "material_id": "57b9e5fe-9549-42aa-88d5-fccc5c0afe2e",
      "project_id": "ac1a1037-5e62-44ee-8c28-7b09d48d93e6",
      "material_type": "qualification",
      "corpus_scope": "ENTERPRISE_PRIVATE",
      "industry": null,
      "original_name": "qualification-iso27001.md",
      "source_type": null,
      "source_org": null,
      "source_authority": "enterprise_private",
      "lifecycle_status": "ACTIVE",
      "review_status": "approved",
      "usage_status": "ACTIVE_FULLTEXT",
      "index_status": "NOT_INDEXED",
      "effective_status": "current_status_required",
      "synthetic_test_material": false,
      "source_text": "名称：ISO/IEC 27001\n编号：CM-Q-27001-2024\n状态：active\n有效至：2027-11-30",
      "chunk_hash": "4aad371afadcb5d360f7461d405d06e706132aa072271064a297010ab458572f",
      "embedding_model": "Qwen/Qwen3-Embedding-0.6B",
      "embedding_version": "1",
      "similarity_score": 0.6663835247273306,
      "rank": 2,
      "raw_vector_rank": 2,
      "raw_similarity": 0.6663835247273306,
      "chunk_role": "BUSINESS_CONTENT",
      "chunk_role_version": "retrieval-chunk-role-v1",
      "chunk_role_reason": "SUBSTANTIVE_SOURCE_TEXT",
      "candidate_eligibility": "EVIDENCE_ELIGIBLE",
      "source_route": "PROOF_ELIGIBLE",
      "proof_eligibility": "PROOF_ELIGIBLE",
      "proof_eligible": true,
      "proof_capable": true,
      "routing_reason": [
        "EVIDENCE_INTENT_AND_SOURCE_QUALIFIED"
      ],
      "source_scope": "ENTERPRISE_PRIVATE",
      "source_document_id": "57b9e5fe-9549-42aa-88d5-fccc5c0afe2e",
      "source_chunk_id": "MCH-A4C2632EF9126FADD349C3004E1C2D84",
      "content_role": "unknown",
      "role_compatibility": "unknown",
      "matched_evidence_needs": [],
      "rerank_reasons": [
        "RAW_VECTOR_FALLBACK"
      ],
      "rerank_version": "4.3-role-need-rerank-v1",
      "reranked_rank": 2,
      "retrieval_contract_version": "4.3-production-retrieval-v1",
      "evidence_created": false,
      "raw_original_text": "名称：ISO/IEC 27001\n编号：CM-Q-27001-2024\n状态：active\n有效至：2027-11-30",
      "classification": "EVIDENCE_BEARING",
      "evidence_role": "BOUNDARY_EVIDENCE",
      "reason_codes": [
        "REQUIRED_DIMENSION_SUPPORTED"
      ]
    },
    {
      "embedding_id": "2c5de845-eeef-4574-bf12-548a0d677274",
      "chunk_id": "MCH-A160D3E488BD50C27E5F6267363E57B1",
      "material_id": "c5395bc4-0531-4e6f-9f0c-3562cee0a2f1",
      "project_id": "ac1a1037-5e62-44ee-8c28-7b09d48d93e6",
      "material_type": "qualification",
      "corpus_scope": "ENTERPRISE_PRIVATE",
      "industry": null,
      "original_name": "qualification-iso9001.md",
      "source_type": null,
      "source_org": null,
      "source_authority": "enterprise_private",
      "lifecycle_status": "ACTIVE",
      "review_status": "approved",
      "usage_status": "ACTIVE_FULLTEXT",
      "index_status": "NOT_INDEXED",
      "effective_status": "current_status_required",
      "synthetic_test_material": false,
      "source_text": "名称：ISO 9001\n编号：CM-Q-9001-2025\n状态：active\n有效至：2028-03-31",
      "chunk_hash": "b1c3295063f75def254033770e23992804cba4b5c7d1a139b94705fb69135d68",
      "embedding_model": "Qwen/Qwen3-Embedding-0.6B",
      "embedding_version": "1",
      "similarity_score": 0.5497251912869573,
      "rank": 3,
      "raw_vector_rank": 5,
      "raw_similarity": 0.5497251912869573,
      "chunk_role": "BUSINESS_CONTENT",
      "chunk_role_version": "retrieval-chunk-role-v1",
      "chunk_role_reason": "SUBSTANTIVE_SOURCE_TEXT",
      "candidate_eligibility": "EVIDENCE_ELIGIBLE",
      "source_route": "PROOF_ELIGIBLE",
      "proof_eligibility": "PROOF_ELIGIBLE",
      "proof_eligible": true,
      "proof_capable": true,
      "routing_reason": [
        "EVIDENCE_INTENT_AND_SOURCE_QUALIFIED"
      ],
      "source_scope": "ENTERPRISE_PRIVATE",
      "source_document_id": "c5395bc4-0531-4e6f-9f0c-3562cee0a2f1",
      "source_chunk_id": "MCH-A160D3E488BD50C27E5F6267363E57B1",
      "content_role": "unknown",
      "role_compatibility": "unknown",
      "matched_evidence_needs": [],
      "rerank_reasons": [
        "RAW_VECTOR_FALLBACK"
      ],
      "rerank_version": "4.3-role-need-rerank-v1",
      "reranked_rank": 3,
      "retrieval_contract_version": "4.3-production-retrieval-v1",
      "evidence_created": false,
      "raw_original_text": "名称：ISO 9001\n编号：CM-Q-9001-2025\n状态：active\n有效至：2028-03-31",
      "classification": "TOPIC_RELEVANT_ONLY",
      "evidence_role": null,
      "reason_codes": [
        "REQUIRED_DIMENSION_NOT_SUPPORTED"
      ]
    },
    {
      "embedding_id": "714ebb52-4592-49b9-9cc1-aeb429155235",
      "chunk_id": "MCH-F8EB706177885912067E9E74510E09D1",
      "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
      "project_id": "ac1a1037-5e62-44ee-8c28-7b09d48d93e6",
      "material_type": "company_profile",
      "corpus_scope": "ENTERPRISE_PRIVATE",
      "industry": null,
      "original_name": "pasted-text.txt",
      "source_type": null,
      "source_org": null,
      "source_authority": "enterprise_private",
      "lifecycle_status": "ACTIVE",
      "review_status": "approved",
      "usage_status": "ACTIVE_FULLTEXT",
      "index_status": "NOT_INDEXED",
      "effective_status": "current_status_required",
      "synthetic_test_material": false,
      "source_text": "信息分：",
      "chunk_hash": "293e71e220827b2142f35519c1534698495dfd0d9e4576ede57fd827e310662d",
      "embedding_model": "Qwen/Qwen3-Embedding-0.6B",
      "embedding_version": "1",
      "similarity_score": 0.46578313716205244,
      "rank": 4,
      "raw_vector_rank": 6,
      "raw_similarity": 0.46578313716205244,
      "chunk_role": "BUSINESS_CONTENT",
      "chunk_role_version": "retrieval-chunk-role-v1",
      "chunk_role_reason": "SUBSTANTIVE_SOURCE_TEXT",
      "candidate_eligibility": "EVIDENCE_ELIGIBLE",
      "source_route": "PROOF_ELIGIBLE",
      "proof_eligibility": "PROOF_ELIGIBLE",
      "proof_eligible": true,
      "proof_capable": true,
      "routing_reason": [
        "EVIDENCE_INTENT_AND_SOURCE_QUALIFIED"
      ],
      "source_scope": "ENTERPRISE_PRIVATE",
      "source_document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
      "source_chunk_id": "MCH-F8EB706177885912067E9E74510E09D1",
      "content_role": "unknown",
      "role_compatibility": "unknown",
      "matched_evidence_needs": [],
      "rerank_reasons": [
        "RAW_VECTOR_FALLBACK"
      ],
      "rerank_version": "4.3-role-need-rerank-v1",
      "reranked_rank": 4,
      "retrieval_contract_version": "4.3-production-retrieval-v1",
      "evidence_created": false,
      "raw_original_text": "信息分：",
      "classification": "TOPIC_RELEVANT_ONLY",
      "evidence_role": null,
      "reason_codes": [
        "REQUIRED_DIMENSION_NOT_SUPPORTED"
      ]
    },
    {
      "embedding_id": "af471f8a-343e-4c28-8fc0-99a3d6416e16",
      "chunk_id": "MCH-DD698C97CF11CC2C5A98532E65244E29",
      "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
      "project_id": "ac1a1037-5e62-44ee-8c28-7b09d48d93e6",
      "material_type": "company_profile",
      "corpus_scope": "ENTERPRISE_PRIVATE",
      "industry": null,
      "original_name": "pasted-text.txt",
      "source_type": null,
      "source_org": null,
      "source_authority": "enterprise_private",
      "lifecycle_status": "ACTIVE",
      "review_status": "approved",
      "usage_status": "ACTIVE_FULLTEXT",
      "index_status": "NOT_INDEXED",
      "effective_status": "current_status_required",
      "synthetic_test_material": false,
      "source_text": "I. Required Documents",
      "chunk_hash": "5517e549b642331b75619ad725c0b5cd5699e957b98c0e5c830f9900b2c31bbf",
      "embedding_model": "Qwen/Qwen3-Embedding-0.6B",
      "embedding_version": "1",
      "similarity_score": 0.4636293191799321,
      "rank": 5,
      "raw_vector_rank": 7,
      "raw_similarity": 0.4636293191799321,
      "chunk_role": "BUSINESS_CONTENT",
      "chunk_role_version": "retrieval-chunk-role-v1",
      "chunk_role_reason": "SUBSTANTIVE_SOURCE_TEXT",
      "candidate_eligibility": "EVIDENCE_ELIGIBLE",
      "source_route": "PROOF_ELIGIBLE",
      "proof_eligibility": "PROOF_ELIGIBLE",
      "proof_eligible": true,
      "proof_capable": true,
      "routing_reason": [
        "EVIDENCE_INTENT_AND_SOURCE_QUALIFIED"
      ],
      "source_scope": "ENTERPRISE_PRIVATE",
      "source_document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
      "source_chunk_id": "MCH-DD698C97CF11CC2C5A98532E65244E29",
      "content_role": "unknown",
      "role_compatibility": "unknown",
      "matched_evidence_needs": [],
      "rerank_reasons": [
        "RAW_VECTOR_FALLBACK"
      ],
      "rerank_version": "4.3-role-need-rerank-v1",
      "reranked_rank": 5,
      "retrieval_contract_version": "4.3-production-retrieval-v1",
      "evidence_created": false,
      "raw_original_text": "I. Required Documents",
      "classification": "IRRELEVANT",
      "evidence_role": null,
      "reason_codes": [
        "REQUIRED_DIMENSION_NOT_SUPPORTED"
      ]
    }
  ]
}
```

### V2R-006-ISO-SCOPE

- Requirement: 企业应提供指定项目主体的 ISO/IEC 27001 证书。
- PRE first useful evidence rank: 1
- POST first useful evidence rank: 1
- PRE Gold Evidence Set Hit@5: PASS
- POST Gold Evidence Set Hit@5: PASS
- Metadata removed from final lane: 2

#### Gold Evidence Set / PRE Top5 / POST Top5

```json
{
  "gold_evidence_set": [
    {
      "chunk_id": "MCH-0820CC5A439CB986C62E46213029CC71",
      "chunk_role": "HEADING",
      "source_hash": "e4bbd720010befabbdd08b947acc803b7f0c52b5ccdbf8da7f5b169e76f19215"
    },
    {
      "chunk_id": "MCH-A4C2632EF9126FADD349C3004E1C2D84",
      "chunk_role": "BUSINESS_CONTENT",
      "source_hash": "4aad371afadcb5d360f7461d405d06e706132aa072271064a297010ab458572f"
    }
  ],
  "pre_top5": [
    {
      "rank": 1,
      "raw_vector_rank": 1,
      "material_id": "74ed566b-18c0-41a1-ba55-59cbe182251c",
      "document_id": "74ed566b-18c0-41a1-ba55-59cbe182251c",
      "chunk_id": "MCH-70376020855F97D43106A81E5F040C7F",
      "score": 0.7064820528030445,
      "raw_original_text": "企业持有在有效期内的 ISO/IEC 27001 受控记录。该事实不证明任一产品已实现特定安全等级、等保级别或具体安全功能。",
      "runtime_heuristic_classification": "EVIDENCE_BEARING",
      "heuristic_reason_codes": [
        "REQUIRED_DIMENSION_SUPPORTED"
      ],
      "context_recovery_rate": 0,
      "context_recovery_state": "UNRESOLVED_AFTER_CONTEXT",
      "source": "PRE_FIX_BASELINE"
    },
    {
      "rank": 2,
      "raw_vector_rank": 2,
      "material_id": "57b9e5fe-9549-42aa-88d5-fccc5c0afe2e",
      "document_id": "57b9e5fe-9549-42aa-88d5-fccc5c0afe2e",
      "chunk_id": "MCH-0820CC5A439CB986C62E46213029CC71",
      "score": 0.6684556801047528,
      "raw_original_text": "# ISO 27001 受控记录",
      "runtime_heuristic_classification": "METADATA_OR_HEADER",
      "heuristic_reason_codes": [
        "METADATA_OR_HEADER"
      ],
      "context_recovery_rate": 0.6,
      "context_recovery_state": "UNRESOLVED_AFTER_RETRIEVAL",
      "source": "PRE_FIX_BASELINE"
    },
    {
      "rank": 3,
      "raw_vector_rank": 3,
      "material_id": "57b9e5fe-9549-42aa-88d5-fccc5c0afe2e",
      "document_id": "57b9e5fe-9549-42aa-88d5-fccc5c0afe2e",
      "chunk_id": "MCH-A4C2632EF9126FADD349C3004E1C2D84",
      "score": 0.6393421507273834,
      "raw_original_text": "名称：ISO/IEC 27001\n编号：CM-Q-27001-2024\n状态：active\n有效至：2027-11-30",
      "runtime_heuristic_classification": "EVIDENCE_BEARING",
      "heuristic_reason_codes": [
        "REQUIRED_DIMENSION_SUPPORTED"
      ],
      "context_recovery_rate": 0.6,
      "context_recovery_state": "UNRESOLVED_AFTER_CONTEXT",
      "source": "PRE_FIX_BASELINE"
    },
    {
      "rank": 4,
      "raw_vector_rank": 4,
      "material_id": "c5395bc4-0531-4e6f-9f0c-3562cee0a2f1",
      "document_id": "c5395bc4-0531-4e6f-9f0c-3562cee0a2f1",
      "chunk_id": "MCH-D37B061257382C31A3C757430BDD2CA6",
      "score": 0.6162579884375352,
      "raw_original_text": "# ISO 9001 受控记录",
      "runtime_heuristic_classification": "METADATA_OR_HEADER",
      "heuristic_reason_codes": [
        "METADATA_OR_HEADER"
      ],
      "context_recovery_rate": 0.6,
      "context_recovery_state": "UNRESOLVED_AFTER_RETRIEVAL",
      "source": "PRE_FIX_BASELINE"
    },
    {
      "rank": 5,
      "raw_vector_rank": 5,
      "material_id": "c5395bc4-0531-4e6f-9f0c-3562cee0a2f1",
      "document_id": "c5395bc4-0531-4e6f-9f0c-3562cee0a2f1",
      "chunk_id": "MCH-A160D3E488BD50C27E5F6267363E57B1",
      "score": 0.5089393550789749,
      "raw_original_text": "名称：ISO 9001\n编号：CM-Q-9001-2025\n状态：active\n有效至：2028-03-31",
      "runtime_heuristic_classification": "EVIDENCE_BEARING",
      "heuristic_reason_codes": [
        "REQUIRED_DIMENSION_SUPPORTED"
      ],
      "context_recovery_rate": 0.6,
      "context_recovery_state": "UNRESOLVED_AFTER_CONTEXT",
      "source": "PRE_FIX_BASELINE"
    }
  ],
  "post_top5": [
    {
      "embedding_id": "d65131d1-e89e-4f1d-a050-6557b70e54ec",
      "chunk_id": "MCH-70376020855F97D43106A81E5F040C7F",
      "material_id": "74ed566b-18c0-41a1-ba55-59cbe182251c",
      "project_id": "ac1a1037-5e62-44ee-8c28-7b09d48d93e6",
      "material_type": "technical_whitepaper",
      "corpus_scope": "ENTERPRISE_PRIVATE",
      "industry": null,
      "original_name": "security-reference.md",
      "source_type": null,
      "source_org": null,
      "source_authority": "enterprise_private",
      "lifecycle_status": "ACTIVE",
      "review_status": "approved",
      "usage_status": "ACTIVE_FULLTEXT",
      "index_status": "NOT_INDEXED",
      "effective_status": "current_status_required",
      "synthetic_test_material": false,
      "source_text": "企业持有在有效期内的 ISO/IEC 27001 受控记录。该事实不证明任一产品已实现特定安全等级、等保级别或具体安全功能。",
      "chunk_hash": "c5ea4f48363c4c562e78cfe9c0197562cf18a98f645cac95e50475fa29bf0d7d",
      "embedding_model": "Qwen/Qwen3-Embedding-0.6B",
      "embedding_version": "1",
      "similarity_score": 0.706829411198463,
      "rank": 1,
      "raw_vector_rank": 1,
      "raw_similarity": 0.706829411198463,
      "chunk_role": "BUSINESS_CONTENT",
      "chunk_role_version": "retrieval-chunk-role-v1",
      "chunk_role_reason": "SUBSTANTIVE_SOURCE_TEXT",
      "candidate_eligibility": "EVIDENCE_ELIGIBLE",
      "source_route": "PROOF_ELIGIBLE",
      "proof_eligibility": "PROOF_ELIGIBLE",
      "proof_eligible": true,
      "proof_capable": true,
      "routing_reason": [
        "EVIDENCE_INTENT_AND_SOURCE_QUALIFIED"
      ],
      "source_scope": "ENTERPRISE_PRIVATE",
      "source_document_id": "74ed566b-18c0-41a1-ba55-59cbe182251c",
      "source_chunk_id": "MCH-70376020855F97D43106A81E5F040C7F",
      "content_role": "unknown",
      "role_compatibility": "unknown",
      "matched_evidence_needs": [],
      "rerank_reasons": [
        "RAW_VECTOR_FALLBACK"
      ],
      "rerank_version": "4.3-role-need-rerank-v1",
      "reranked_rank": 1,
      "retrieval_contract_version": "4.3-production-retrieval-v1",
      "evidence_created": false,
      "raw_original_text": "企业持有在有效期内的 ISO/IEC 27001 受控记录。该事实不证明任一产品已实现特定安全等级、等保级别或具体安全功能。",
      "classification": "EVIDENCE_BEARING",
      "evidence_role": "BOUNDARY_EVIDENCE",
      "reason_codes": [
        "REQUIRED_DIMENSION_SUPPORTED"
      ]
    },
    {
      "embedding_id": "7b5129d0-f8f3-41b1-8714-3a758bd926eb",
      "chunk_id": "MCH-A4C2632EF9126FADD349C3004E1C2D84",
      "material_id": "57b9e5fe-9549-42aa-88d5-fccc5c0afe2e",
      "project_id": "ac1a1037-5e62-44ee-8c28-7b09d48d93e6",
      "material_type": "qualification",
      "corpus_scope": "ENTERPRISE_PRIVATE",
      "industry": null,
      "original_name": "qualification-iso27001.md",
      "source_type": null,
      "source_org": null,
      "source_authority": "enterprise_private",
      "lifecycle_status": "ACTIVE",
      "review_status": "approved",
      "usage_status": "ACTIVE_FULLTEXT",
      "index_status": "NOT_INDEXED",
      "effective_status": "current_status_required",
      "synthetic_test_material": false,
      "source_text": "名称：ISO/IEC 27001\n编号：CM-Q-27001-2024\n状态：active\n有效至：2027-11-30",
      "chunk_hash": "4aad371afadcb5d360f7461d405d06e706132aa072271064a297010ab458572f",
      "embedding_model": "Qwen/Qwen3-Embedding-0.6B",
      "embedding_version": "1",
      "similarity_score": 0.639716386795044,
      "rank": 2,
      "raw_vector_rank": 3,
      "raw_similarity": 0.639716386795044,
      "chunk_role": "BUSINESS_CONTENT",
      "chunk_role_version": "retrieval-chunk-role-v1",
      "chunk_role_reason": "SUBSTANTIVE_SOURCE_TEXT",
      "candidate_eligibility": "EVIDENCE_ELIGIBLE",
      "source_route": "PROOF_ELIGIBLE",
      "proof_eligibility": "PROOF_ELIGIBLE",
      "proof_eligible": true,
      "proof_capable": true,
      "routing_reason": [
        "EVIDENCE_INTENT_AND_SOURCE_QUALIFIED"
      ],
      "source_scope": "ENTERPRISE_PRIVATE",
      "source_document_id": "57b9e5fe-9549-42aa-88d5-fccc5c0afe2e",
      "source_chunk_id": "MCH-A4C2632EF9126FADD349C3004E1C2D84",
      "content_role": "unknown",
      "role_compatibility": "unknown",
      "matched_evidence_needs": [],
      "rerank_reasons": [
        "RAW_VECTOR_FALLBACK"
      ],
      "rerank_version": "4.3-role-need-rerank-v1",
      "reranked_rank": 2,
      "retrieval_contract_version": "4.3-production-retrieval-v1",
      "evidence_created": false,
      "raw_original_text": "名称：ISO/IEC 27001\n编号：CM-Q-27001-2024\n状态：active\n有效至：2027-11-30",
      "classification": "EVIDENCE_BEARING",
      "evidence_role": "BOUNDARY_EVIDENCE",
      "reason_codes": [
        "REQUIRED_DIMENSION_SUPPORTED"
      ]
    },
    {
      "embedding_id": "2c5de845-eeef-4574-bf12-548a0d677274",
      "chunk_id": "MCH-A160D3E488BD50C27E5F6267363E57B1",
      "material_id": "c5395bc4-0531-4e6f-9f0c-3562cee0a2f1",
      "project_id": "ac1a1037-5e62-44ee-8c28-7b09d48d93e6",
      "material_type": "qualification",
      "corpus_scope": "ENTERPRISE_PRIVATE",
      "industry": null,
      "original_name": "qualification-iso9001.md",
      "source_type": null,
      "source_org": null,
      "source_authority": "enterprise_private",
      "lifecycle_status": "ACTIVE",
      "review_status": "approved",
      "usage_status": "ACTIVE_FULLTEXT",
      "index_status": "NOT_INDEXED",
      "effective_status": "current_status_required",
      "synthetic_test_material": false,
      "source_text": "名称：ISO 9001\n编号：CM-Q-9001-2025\n状态：active\n有效至：2028-03-31",
      "chunk_hash": "b1c3295063f75def254033770e23992804cba4b5c7d1a139b94705fb69135d68",
      "embedding_model": "Qwen/Qwen3-Embedding-0.6B",
      "embedding_version": "1",
      "similarity_score": 0.5091807842254639,
      "rank": 3,
      "raw_vector_rank": 5,
      "raw_similarity": 0.5091807842254639,
      "chunk_role": "BUSINESS_CONTENT",
      "chunk_role_version": "retrieval-chunk-role-v1",
      "chunk_role_reason": "SUBSTANTIVE_SOURCE_TEXT",
      "candidate_eligibility": "EVIDENCE_ELIGIBLE",
      "source_route": "PROOF_ELIGIBLE",
      "proof_eligibility": "PROOF_ELIGIBLE",
      "proof_eligible": true,
      "proof_capable": true,
      "routing_reason": [
        "EVIDENCE_INTENT_AND_SOURCE_QUALIFIED"
      ],
      "source_scope": "ENTERPRISE_PRIVATE",
      "source_document_id": "c5395bc4-0531-4e6f-9f0c-3562cee0a2f1",
      "source_chunk_id": "MCH-A160D3E488BD50C27E5F6267363E57B1",
      "content_role": "unknown",
      "role_compatibility": "unknown",
      "matched_evidence_needs": [],
      "rerank_reasons": [
        "RAW_VECTOR_FALLBACK"
      ],
      "rerank_version": "4.3-role-need-rerank-v1",
      "reranked_rank": 3,
      "retrieval_contract_version": "4.3-production-retrieval-v1",
      "evidence_created": false,
      "raw_original_text": "名称：ISO 9001\n编号：CM-Q-9001-2025\n状态：active\n有效至：2028-03-31",
      "classification": "TOPIC_RELEVANT_ONLY",
      "evidence_role": null,
      "reason_codes": [
        "REQUIRED_DIMENSION_NOT_SUPPORTED"
      ]
    },
    {
      "embedding_id": "af471f8a-343e-4c28-8fc0-99a3d6416e16",
      "chunk_id": "MCH-DD698C97CF11CC2C5A98532E65244E29",
      "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
      "project_id": "ac1a1037-5e62-44ee-8c28-7b09d48d93e6",
      "material_type": "company_profile",
      "corpus_scope": "ENTERPRISE_PRIVATE",
      "industry": null,
      "original_name": "pasted-text.txt",
      "source_type": null,
      "source_org": null,
      "source_authority": "enterprise_private",
      "lifecycle_status": "ACTIVE",
      "review_status": "approved",
      "usage_status": "ACTIVE_FULLTEXT",
      "index_status": "NOT_INDEXED",
      "effective_status": "current_status_required",
      "synthetic_test_material": false,
      "source_text": "I. Required Documents",
      "chunk_hash": "5517e549b642331b75619ad725c0b5cd5699e957b98c0e5c830f9900b2c31bbf",
      "embedding_model": "Qwen/Qwen3-Embedding-0.6B",
      "embedding_version": "1",
      "similarity_score": 0.48488515615463257,
      "rank": 4,
      "raw_vector_rank": 7,
      "raw_similarity": 0.48488515615463257,
      "chunk_role": "BUSINESS_CONTENT",
      "chunk_role_version": "retrieval-chunk-role-v1",
      "chunk_role_reason": "SUBSTANTIVE_SOURCE_TEXT",
      "candidate_eligibility": "EVIDENCE_ELIGIBLE",
      "source_route": "PROOF_ELIGIBLE",
      "proof_eligibility": "PROOF_ELIGIBLE",
      "proof_eligible": true,
      "proof_capable": true,
      "routing_reason": [
        "EVIDENCE_INTENT_AND_SOURCE_QUALIFIED"
      ],
      "source_scope": "ENTERPRISE_PRIVATE",
      "source_document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
      "source_chunk_id": "MCH-DD698C97CF11CC2C5A98532E65244E29",
      "content_role": "unknown",
      "role_compatibility": "unknown",
      "matched_evidence_needs": [],
      "rerank_reasons": [
        "RAW_VECTOR_FALLBACK"
      ],
      "rerank_version": "4.3-role-need-rerank-v1",
      "reranked_rank": 4,
      "retrieval_contract_version": "4.3-production-retrieval-v1",
      "evidence_created": false,
      "raw_original_text": "I. Required Documents",
      "classification": "IRRELEVANT",
      "evidence_role": null,
      "reason_codes": [
        "REQUIRED_DIMENSION_NOT_SUPPORTED"
      ]
    },
    {
      "embedding_id": "8f88f08f-fdea-4cbc-ba8d-24e2d38079bf",
      "chunk_id": "MCH-CFFC5F79FB5E48DAEB1A7F4CC503E88A",
      "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
      "project_id": "ac1a1037-5e62-44ee-8c28-7b09d48d93e6",
      "material_type": "company_profile",
      "corpus_scope": "ENTERPRISE_PRIVATE",
      "industry": null,
      "original_name": "pasted-text.txt",
      "source_type": null,
      "source_org": null,
      "source_authority": "enterprise_private",
      "lifecycle_status": "ACTIVE",
      "review_status": "approved",
      "usage_status": "ACTIVE_FULLTEXT",
      "index_status": "NOT_INDEXED",
      "effective_status": "current_status_required",
      "synthetic_test_material": false,
      "source_text": "必须明确：",
      "chunk_hash": "9eb7eac0482838aa34bfe12dfc911d534812a8166fc97ae9a558a458badbf2ac",
      "embedding_model": "Qwen/Qwen3-Embedding-0.6B",
      "embedding_version": "1",
      "similarity_score": 0.47145047954020103,
      "rank": 5,
      "raw_vector_rank": 8,
      "raw_similarity": 0.47145047954020103,
      "chunk_role": "BUSINESS_CONTENT",
      "chunk_role_version": "retrieval-chunk-role-v1",
      "chunk_role_reason": "SUBSTANTIVE_SOURCE_TEXT",
      "candidate_eligibility": "EVIDENCE_ELIGIBLE",
      "source_route": "PROOF_ELIGIBLE",
      "proof_eligibility": "PROOF_ELIGIBLE",
      "proof_eligible": true,
      "proof_capable": true,
      "routing_reason": [
        "EVIDENCE_INTENT_AND_SOURCE_QUALIFIED"
      ],
      "source_scope": "ENTERPRISE_PRIVATE",
      "source_document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
      "source_chunk_id": "MCH-CFFC5F79FB5E48DAEB1A7F4CC503E88A",
      "content_role": "unknown",
      "role_compatibility": "unknown",
      "matched_evidence_needs": [],
      "rerank_reasons": [
        "RAW_VECTOR_FALLBACK"
      ],
      "rerank_version": "4.3-role-need-rerank-v1",
      "reranked_rank": 5,
      "retrieval_contract_version": "4.3-production-retrieval-v1",
      "evidence_created": false,
      "raw_original_text": "必须明确：",
      "classification": "IRRELEVANT",
      "evidence_role": null,
      "reason_codes": [
        "REQUIRED_DIMENSION_NOT_SUPPORTED"
      ]
    }
  ]
}
```

## Safety

- Persistent multi-chunk Evidence Spans: preserved
- Formal Evidence records mutated: NO
- Context Recovery headings: preserved as context-only candidates
- LLM calls: 0
- Dify calls: 0
