# GPT REVIEW PACKET — RETRIEVAL EVAL INTEGRITY

- External calls: 0
- This is an offline integrity and classifier audit; it is not HUMAN_GOLD.
- `GPT_REVIEW_EXPECTED_CLASSIFICATION` is a separate review expectation and never feeds runtime ranking.

## Gold binding audit

```json
[
  {
    "case_id": "V2R-001-PERF-DIRECT",
    "gold_role": "SUPPORTING",
    "classification": "RETRIEVAL_GOLD_BINDING_REQUIRES_DERIVATION",
    "persisted_span_validity": "VALID_MULTI_CHUNK_EVIDENCE_SPAN",
    "checks": {
      "expected_material_exists": true,
      "expected_chunk_exists": true,
      "span_exists": true,
      "span_source_exact_in_expected_chunk": false,
      "span_chunk_identity": true,
      "span_material_identity": true,
      "span_document_identity": true,
      "span_hash_exact": true,
      "span_offsets_present": true,
      "span_source_chunks_exist": true,
      "span_source_chunks_same_material": true
    },
    "expected": {
      "material_id": "3c81671f-376e-401b-8525-be26929d5b92",
      "document_id": "3c81671f-376e-401b-8525-be26929d5b92",
      "chunk_id": "MCH-0FBD3599DAF932016F62EB9634B997AF",
      "chunk_raw_text": "产品：澄明数据交换平台 V3.2\n环境：8 vCPU、32 GB 内存、PostgreSQL 14、千兆局域网\n条件：50 并发、100 万条基准数据、缓存预热后执行 30 分钟\n指标：数据目录查询平均响应时间\n结果：平均 1.4 秒，P95 1.9 秒。\n日期：2025-05-16。",
      "span_id": "ESPAN-7C976B914F1C677C5D80017CCD2C307B",
      "span_raw_text": "# 数据交换平台性能测试记录\n\n产品：澄明数据交换平台 V3.2\n环境：8 vCPU、32 GB 内存、PostgreSQL 14、千兆局域网\n条件：50 并发、100 万条基准数据、缓存预热后执行 30 分钟\n指标：数据目录查询平均响应时间\n结果：平均 1.4 秒，P95 1.9 秒。\n日期：2025-05-16。",
      "span_hash": "b5522622368a1f3144b6ae8ea08d106cec5174b7d36221525e0b7cb0bcdc5934",
      "span_start_offset": 92,
      "span_end_offset": 251,
      "span_anchor_chunk_id": "MCH-0FBD3599DAF932016F62EB9634B997AF",
      "span_source_chunk_ids": [
        "MCH-B4FF02295DBB6DCDF6E2763F057076F6",
        "MCH-0FBD3599DAF932016F62EB9634B997AF"
      ]
    },
    "derived_gold_evidence_set": [
      {
        "chunk_id": "MCH-B4FF02295DBB6DCDF6E2763F057076F6",
        "chunk_role": "HEADING",
        "retrieval_gold_role": "CONTEXT_HEADING_CHUNK",
        "counts_as_decision_bearing_gold": false,
        "source_hash": "b39d0175f9ba8fd41b225f5b6d7b28dc51d850f4b5e80fe6159ae1af3e4ea189"
      },
      {
        "chunk_id": "MCH-0FBD3599DAF932016F62EB9634B997AF",
        "chunk_role": "BUSINESS_CONTENT",
        "retrieval_gold_role": "SUPPORTING",
        "counts_as_decision_bearing_gold": true,
        "source_hash": "5a54f61d10c64f26414f8dcfb93f3c1eb25076f1063d97f8200f42cad981843c"
      }
    ],
    "alternate_business_bearing_chunks": [],
    "repaired_binding": {
      "status": "RETRIEVAL_GOLD_DERIVED",
      "material_id": "3c81671f-376e-401b-8525-be26929d5b92",
      "document_id": "3c81671f-376e-401b-8525-be26929d5b92",
      "chunk_id": "MCH-0FBD3599DAF932016F62EB9634B997AF",
      "repaired_span_id": "REPAIRED_EVAL_SPAN_MCH-0FBD3599DAF932016F62EB9634B997AF",
      "source_text": "产品：澄明数据交换平台 V3.2\n环境：8 vCPU、32 GB 内存、PostgreSQL 14、千兆局域网\n条件：50 并发、100 万条基准数据、缓存预热后执行 30 分钟\n指标：数据目录查询平均响应时间\n结果：平均 1.4 秒，P95 1.9 秒。\n日期：2025-05-16。",
      "source_hash": "5a54f61d10c64f26414f8dcfb93f3c1eb25076f1063d97f8200f42cad981843c",
      "source_match_type": "EXACT_SUBSTRING_OF_PERSISTED_MULTI_CHUNK_SPAN",
      "source_resolution_method": "OFFLINE_GOLD_LINEAGE_REPAIR",
      "note": "Evaluation-only deterministic business-bearing chunk derived from a valid multi-chunk Evidence Span; not persisted as Evidence Source Span and not HUMAN_GOLD."
    },
    "root_cause": null,
    "repair_action": "REBIND_TO_REPAIRED_EXACT_CHUNK_SLICE_AFTER_INDEPENDENT_LINEAGE_CHECK"
  },
  {
    "case_id": "V2R-002-PERF-PARTIAL",
    "gold_role": "ADVERSE",
    "classification": "RETRIEVAL_GOLD_BINDING_REQUIRES_DERIVATION",
    "persisted_span_validity": "VALID_MULTI_CHUNK_EVIDENCE_SPAN",
    "checks": {
      "expected_material_exists": true,
      "expected_chunk_exists": true,
      "span_exists": true,
      "span_source_exact_in_expected_chunk": false,
      "span_chunk_identity": true,
      "span_material_identity": true,
      "span_document_identity": true,
      "span_hash_exact": true,
      "span_offsets_present": true,
      "span_source_chunks_exist": true,
      "span_source_chunks_same_material": true
    },
    "expected": {
      "material_id": "3c81671f-376e-401b-8525-be26929d5b92",
      "document_id": "3c81671f-376e-401b-8525-be26929d5b92",
      "chunk_id": "MCH-0FBD3599DAF932016F62EB9634B997AF",
      "chunk_raw_text": "产品：澄明数据交换平台 V3.2\n环境：8 vCPU、32 GB 内存、PostgreSQL 14、千兆局域网\n条件：50 并发、100 万条基准数据、缓存预热后执行 30 分钟\n指标：数据目录查询平均响应时间\n结果：平均 1.4 秒，P95 1.9 秒。\n日期：2025-05-16。",
      "span_id": "ESPAN-7C976B914F1C677C5D80017CCD2C307B",
      "span_raw_text": "# 数据交换平台性能测试记录\n\n产品：澄明数据交换平台 V3.2\n环境：8 vCPU、32 GB 内存、PostgreSQL 14、千兆局域网\n条件：50 并发、100 万条基准数据、缓存预热后执行 30 分钟\n指标：数据目录查询平均响应时间\n结果：平均 1.4 秒，P95 1.9 秒。\n日期：2025-05-16。",
      "span_hash": "b5522622368a1f3144b6ae8ea08d106cec5174b7d36221525e0b7cb0bcdc5934",
      "span_start_offset": 92,
      "span_end_offset": 251,
      "span_anchor_chunk_id": "MCH-0FBD3599DAF932016F62EB9634B997AF",
      "span_source_chunk_ids": [
        "MCH-B4FF02295DBB6DCDF6E2763F057076F6",
        "MCH-0FBD3599DAF932016F62EB9634B997AF"
      ]
    },
    "derived_gold_evidence_set": [
      {
        "chunk_id": "MCH-B4FF02295DBB6DCDF6E2763F057076F6",
        "chunk_role": "HEADING",
        "retrieval_gold_role": "CONTEXT_HEADING_CHUNK",
        "counts_as_decision_bearing_gold": false,
        "source_hash": "b39d0175f9ba8fd41b225f5b6d7b28dc51d850f4b5e80fe6159ae1af3e4ea189"
      },
      {
        "chunk_id": "MCH-0FBD3599DAF932016F62EB9634B997AF",
        "chunk_role": "BUSINESS_CONTENT",
        "retrieval_gold_role": "ADVERSE",
        "counts_as_decision_bearing_gold": true,
        "source_hash": "5a54f61d10c64f26414f8dcfb93f3c1eb25076f1063d97f8200f42cad981843c"
      }
    ],
    "alternate_business_bearing_chunks": [],
    "repaired_binding": {
      "status": "RETRIEVAL_GOLD_DERIVED",
      "material_id": "3c81671f-376e-401b-8525-be26929d5b92",
      "document_id": "3c81671f-376e-401b-8525-be26929d5b92",
      "chunk_id": "MCH-0FBD3599DAF932016F62EB9634B997AF",
      "repaired_span_id": "REPAIRED_EVAL_SPAN_MCH-0FBD3599DAF932016F62EB9634B997AF",
      "source_text": "产品：澄明数据交换平台 V3.2\n环境：8 vCPU、32 GB 内存、PostgreSQL 14、千兆局域网\n条件：50 并发、100 万条基准数据、缓存预热后执行 30 分钟\n指标：数据目录查询平均响应时间\n结果：平均 1.4 秒，P95 1.9 秒。\n日期：2025-05-16。",
      "source_hash": "5a54f61d10c64f26414f8dcfb93f3c1eb25076f1063d97f8200f42cad981843c",
      "source_match_type": "EXACT_SUBSTRING_OF_PERSISTED_MULTI_CHUNK_SPAN",
      "source_resolution_method": "OFFLINE_GOLD_LINEAGE_REPAIR",
      "note": "Evaluation-only deterministic business-bearing chunk derived from a valid multi-chunk Evidence Span; not persisted as Evidence Source Span and not HUMAN_GOLD."
    },
    "root_cause": null,
    "repair_action": "REBIND_TO_REPAIRED_EXACT_CHUNK_SLICE_AFTER_INDEPENDENT_LINEAGE_CHECK"
  },
  {
    "case_id": "V2R-003-COMP-DIRECT",
    "gold_role": "SUPPORTING",
    "classification": "RETRIEVAL_GOLD_BINDING_REQUIRES_DERIVATION",
    "persisted_span_validity": "VALID_MULTI_CHUNK_EVIDENCE_SPAN",
    "checks": {
      "expected_material_exists": true,
      "expected_chunk_exists": true,
      "span_exists": true,
      "span_source_exact_in_expected_chunk": false,
      "span_chunk_identity": true,
      "span_material_identity": true,
      "span_document_identity": true,
      "span_hash_exact": true,
      "span_offsets_present": true,
      "span_source_chunks_exist": true,
      "span_source_chunks_same_material": true
    },
    "expected": {
      "material_id": "3f9dacfb-2e48-4796-a477-98c60b506831",
      "document_id": "3f9dacfb-2e48-4796-a477-98c60b506831",
      "chunk_id": "MCH-7F11A857F9B5A05D9B22E30CD4F1BEE0",
      "chunk_raw_text": "x86_64 + Ubuntu 22.04 + PostgreSQL 14：tested\n鲲鹏 920 + 麒麟 V10 + 达梦 8：partially_tested（完成安装和基础交换用例，未完成压力测试）\n海光 + 统信 UOS + 人大金仓：not_verified\n国产数据库组合：unknown",
      "span_id": "ESPAN-DB796CE9A6685C040977607A8228D832",
      "span_raw_text": "# 产品兼容性矩阵\n\nx86_64 + Ubuntu 22.04 + PostgreSQL 14：tested\n鲲鹏 920 + 麒麟 V10 + 达梦 8：partially_tested（完成安装和基础交换用例，未完成压力测试）\n海光 + 统信 UOS + 人大金仓：not_verified\n国产数据库组合：unknown",
      "span_hash": "bb48093928c5a0df95f9c5d308dbff9edc625d6c357253e43cc8beda7ad77d5b",
      "span_start_offset": 92,
      "span_end_offset": 256,
      "span_anchor_chunk_id": "MCH-7F11A857F9B5A05D9B22E30CD4F1BEE0",
      "span_source_chunk_ids": [
        "MCH-57FE3B83C106C09B70C731182F48FFA4",
        "MCH-7F11A857F9B5A05D9B22E30CD4F1BEE0"
      ]
    },
    "derived_gold_evidence_set": [
      {
        "chunk_id": "MCH-57FE3B83C106C09B70C731182F48FFA4",
        "chunk_role": "HEADING",
        "retrieval_gold_role": "CONTEXT_HEADING_CHUNK",
        "counts_as_decision_bearing_gold": false,
        "source_hash": "1c32ff7e9aa4f1d01011898c0c195da9bd25953712aa1fdae988dfaed0d4ffea"
      },
      {
        "chunk_id": "MCH-7F11A857F9B5A05D9B22E30CD4F1BEE0",
        "chunk_role": "BUSINESS_CONTENT",
        "retrieval_gold_role": "SUPPORTING",
        "counts_as_decision_bearing_gold": true,
        "source_hash": "623f699df461219e4f6ce813596a352300ed47692c630db6482a97cfc41d37d5"
      }
    ],
    "alternate_business_bearing_chunks": [],
    "repaired_binding": {
      "status": "RETRIEVAL_GOLD_DERIVED",
      "material_id": "3f9dacfb-2e48-4796-a477-98c60b506831",
      "document_id": "3f9dacfb-2e48-4796-a477-98c60b506831",
      "chunk_id": "MCH-7F11A857F9B5A05D9B22E30CD4F1BEE0",
      "repaired_span_id": "REPAIRED_EVAL_SPAN_MCH-7F11A857F9B5A05D9B22E30CD4F1BEE0",
      "source_text": "x86_64 + Ubuntu 22.04 + PostgreSQL 14：tested\n鲲鹏 920 + 麒麟 V10 + 达梦 8：partially_tested（完成安装和基础交换用例，未完成压力测试）\n海光 + 统信 UOS + 人大金仓：not_verified\n国产数据库组合：unknown",
      "source_hash": "623f699df461219e4f6ce813596a352300ed47692c630db6482a97cfc41d37d5",
      "source_match_type": "EXACT_SUBSTRING_OF_PERSISTED_MULTI_CHUNK_SPAN",
      "source_resolution_method": "OFFLINE_GOLD_LINEAGE_REPAIR",
      "note": "Evaluation-only deterministic business-bearing chunk derived from a valid multi-chunk Evidence Span; not persisted as Evidence Source Span and not HUMAN_GOLD."
    },
    "root_cause": null,
    "repair_action": "REBIND_TO_REPAIRED_EXACT_CHUNK_SLICE_AFTER_INDEPENDENT_LINEAGE_CHECK"
  },
  {
    "case_id": "V2R-004-COMP-PARTIAL",
    "gold_role": "ADVERSE",
    "classification": "RETRIEVAL_GOLD_BINDING_REQUIRES_DERIVATION",
    "persisted_span_validity": "VALID_MULTI_CHUNK_EVIDENCE_SPAN",
    "checks": {
      "expected_material_exists": true,
      "expected_chunk_exists": true,
      "span_exists": true,
      "span_source_exact_in_expected_chunk": false,
      "span_chunk_identity": true,
      "span_material_identity": true,
      "span_document_identity": true,
      "span_hash_exact": true,
      "span_offsets_present": true,
      "span_source_chunks_exist": true,
      "span_source_chunks_same_material": true
    },
    "expected": {
      "material_id": "3f9dacfb-2e48-4796-a477-98c60b506831",
      "document_id": "3f9dacfb-2e48-4796-a477-98c60b506831",
      "chunk_id": "MCH-7F11A857F9B5A05D9B22E30CD4F1BEE0",
      "chunk_raw_text": "x86_64 + Ubuntu 22.04 + PostgreSQL 14：tested\n鲲鹏 920 + 麒麟 V10 + 达梦 8：partially_tested（完成安装和基础交换用例，未完成压力测试）\n海光 + 统信 UOS + 人大金仓：not_verified\n国产数据库组合：unknown",
      "span_id": "ESPAN-DB796CE9A6685C040977607A8228D832",
      "span_raw_text": "# 产品兼容性矩阵\n\nx86_64 + Ubuntu 22.04 + PostgreSQL 14：tested\n鲲鹏 920 + 麒麟 V10 + 达梦 8：partially_tested（完成安装和基础交换用例，未完成压力测试）\n海光 + 统信 UOS + 人大金仓：not_verified\n国产数据库组合：unknown",
      "span_hash": "bb48093928c5a0df95f9c5d308dbff9edc625d6c357253e43cc8beda7ad77d5b",
      "span_start_offset": 92,
      "span_end_offset": 256,
      "span_anchor_chunk_id": "MCH-7F11A857F9B5A05D9B22E30CD4F1BEE0",
      "span_source_chunk_ids": [
        "MCH-57FE3B83C106C09B70C731182F48FFA4",
        "MCH-7F11A857F9B5A05D9B22E30CD4F1BEE0"
      ]
    },
    "derived_gold_evidence_set": [
      {
        "chunk_id": "MCH-57FE3B83C106C09B70C731182F48FFA4",
        "chunk_role": "HEADING",
        "retrieval_gold_role": "CONTEXT_HEADING_CHUNK",
        "counts_as_decision_bearing_gold": false,
        "source_hash": "1c32ff7e9aa4f1d01011898c0c195da9bd25953712aa1fdae988dfaed0d4ffea"
      },
      {
        "chunk_id": "MCH-7F11A857F9B5A05D9B22E30CD4F1BEE0",
        "chunk_role": "BUSINESS_CONTENT",
        "retrieval_gold_role": "ADVERSE",
        "counts_as_decision_bearing_gold": true,
        "source_hash": "623f699df461219e4f6ce813596a352300ed47692c630db6482a97cfc41d37d5"
      }
    ],
    "alternate_business_bearing_chunks": [],
    "repaired_binding": {
      "status": "RETRIEVAL_GOLD_DERIVED",
      "material_id": "3f9dacfb-2e48-4796-a477-98c60b506831",
      "document_id": "3f9dacfb-2e48-4796-a477-98c60b506831",
      "chunk_id": "MCH-7F11A857F9B5A05D9B22E30CD4F1BEE0",
      "repaired_span_id": "REPAIRED_EVAL_SPAN_MCH-7F11A857F9B5A05D9B22E30CD4F1BEE0",
      "source_text": "x86_64 + Ubuntu 22.04 + PostgreSQL 14：tested\n鲲鹏 920 + 麒麟 V10 + 达梦 8：partially_tested（完成安装和基础交换用例，未完成压力测试）\n海光 + 统信 UOS + 人大金仓：not_verified\n国产数据库组合：unknown",
      "source_hash": "623f699df461219e4f6ce813596a352300ed47692c630db6482a97cfc41d37d5",
      "source_match_type": "EXACT_SUBSTRING_OF_PERSISTED_MULTI_CHUNK_SPAN",
      "source_resolution_method": "OFFLINE_GOLD_LINEAGE_REPAIR",
      "note": "Evaluation-only deterministic business-bearing chunk derived from a valid multi-chunk Evidence Span; not persisted as Evidence Source Span and not HUMAN_GOLD."
    },
    "root_cause": null,
    "repair_action": "REBIND_TO_REPAIRED_EXACT_CHUNK_SLICE_AFTER_INDEPENDENT_LINEAGE_CHECK"
  },
  {
    "case_id": "V2R-005-ISO-DIRECT",
    "gold_role": "SUPPORTING",
    "classification": "RETRIEVAL_GOLD_BINDING_REQUIRES_DERIVATION",
    "persisted_span_validity": "VALID_MULTI_CHUNK_EVIDENCE_SPAN",
    "checks": {
      "expected_material_exists": true,
      "expected_chunk_exists": true,
      "span_exists": true,
      "span_source_exact_in_expected_chunk": false,
      "span_chunk_identity": true,
      "span_material_identity": true,
      "span_document_identity": true,
      "span_hash_exact": true,
      "span_offsets_present": true,
      "span_source_chunks_exist": true,
      "span_source_chunks_same_material": true
    },
    "expected": {
      "material_id": "57b9e5fe-9549-42aa-88d5-fccc5c0afe2e",
      "document_id": "57b9e5fe-9549-42aa-88d5-fccc5c0afe2e",
      "chunk_id": "MCH-0820CC5A439CB986C62E46213029CC71",
      "chunk_raw_text": "# ISO 27001 受控记录",
      "span_id": "ESPAN-9ABC2E493608BCA753CEF663057CD6DE",
      "span_raw_text": "# ISO 27001 受控记录\n\n名称：ISO/IEC 27001\n编号：CM-Q-27001-2024\n状态：active\n有效至：2027-11-30",
      "span_hash": "6bbf2de2c97df192f2c009aa1a730a10c49879d1f07b7c7cb4a7f1e950152684",
      "span_start_offset": 92,
      "span_end_offset": 170,
      "span_anchor_chunk_id": "MCH-0820CC5A439CB986C62E46213029CC71",
      "span_source_chunk_ids": [
        "MCH-0820CC5A439CB986C62E46213029CC71",
        "MCH-A4C2632EF9126FADD349C3004E1C2D84"
      ]
    },
    "derived_gold_evidence_set": [
      {
        "chunk_id": "MCH-0820CC5A439CB986C62E46213029CC71",
        "chunk_role": "HEADING",
        "retrieval_gold_role": "CONTEXT_HEADING_CHUNK",
        "counts_as_decision_bearing_gold": false,
        "source_hash": "e4bbd720010befabbdd08b947acc803b7f0c52b5ccdbf8da7f5b169e76f19215"
      },
      {
        "chunk_id": "MCH-A4C2632EF9126FADD349C3004E1C2D84",
        "chunk_role": "BUSINESS_CONTENT",
        "retrieval_gold_role": "SUPPORTING",
        "counts_as_decision_bearing_gold": true,
        "source_hash": "4aad371afadcb5d360f7461d405d06e706132aa072271064a297010ab458572f"
      }
    ],
    "alternate_business_bearing_chunks": [],
    "repaired_binding": {
      "status": "RETRIEVAL_GOLD_DERIVED",
      "material_id": "57b9e5fe-9549-42aa-88d5-fccc5c0afe2e",
      "document_id": "57b9e5fe-9549-42aa-88d5-fccc5c0afe2e",
      "chunk_id": "MCH-A4C2632EF9126FADD349C3004E1C2D84",
      "repaired_span_id": "REPAIRED_EVAL_SPAN_MCH-A4C2632EF9126FADD349C3004E1C2D84",
      "source_text": "名称：ISO/IEC 27001\n编号：CM-Q-27001-2024\n状态：active\n有效至：2027-11-30",
      "source_hash": "4aad371afadcb5d360f7461d405d06e706132aa072271064a297010ab458572f",
      "source_match_type": "EXACT_SUBSTRING_OF_PERSISTED_MULTI_CHUNK_SPAN",
      "source_resolution_method": "OFFLINE_GOLD_LINEAGE_REPAIR",
      "note": "Evaluation-only deterministic business-bearing chunk derived from a valid multi-chunk Evidence Span; not persisted as Evidence Source Span and not HUMAN_GOLD."
    },
    "root_cause": "Gold span was stored over a multi-chunk source, but the expected chunk points to a title-only anchor; the business-bearing chunk is separate.",
    "repair_action": "REBIND_TO_REPAIRED_EXACT_CHUNK_SLICE_AFTER_INDEPENDENT_LINEAGE_CHECK"
  },
  {
    "case_id": "V2R-006-ISO-SCOPE",
    "gold_role": "BOUNDARY",
    "classification": "RETRIEVAL_GOLD_BINDING_REQUIRES_DERIVATION",
    "persisted_span_validity": "VALID_MULTI_CHUNK_EVIDENCE_SPAN",
    "checks": {
      "expected_material_exists": true,
      "expected_chunk_exists": true,
      "span_exists": true,
      "span_source_exact_in_expected_chunk": false,
      "span_chunk_identity": true,
      "span_material_identity": true,
      "span_document_identity": true,
      "span_hash_exact": true,
      "span_offsets_present": true,
      "span_source_chunks_exist": true,
      "span_source_chunks_same_material": true
    },
    "expected": {
      "material_id": "57b9e5fe-9549-42aa-88d5-fccc5c0afe2e",
      "document_id": "57b9e5fe-9549-42aa-88d5-fccc5c0afe2e",
      "chunk_id": "MCH-0820CC5A439CB986C62E46213029CC71",
      "chunk_raw_text": "# ISO 27001 受控记录",
      "span_id": "ESPAN-9ABC2E493608BCA753CEF663057CD6DE",
      "span_raw_text": "# ISO 27001 受控记录\n\n名称：ISO/IEC 27001\n编号：CM-Q-27001-2024\n状态：active\n有效至：2027-11-30",
      "span_hash": "6bbf2de2c97df192f2c009aa1a730a10c49879d1f07b7c7cb4a7f1e950152684",
      "span_start_offset": 92,
      "span_end_offset": 170,
      "span_anchor_chunk_id": "MCH-0820CC5A439CB986C62E46213029CC71",
      "span_source_chunk_ids": [
        "MCH-0820CC5A439CB986C62E46213029CC71",
        "MCH-A4C2632EF9126FADD349C3004E1C2D84"
      ]
    },
    "derived_gold_evidence_set": [
      {
        "chunk_id": "MCH-0820CC5A439CB986C62E46213029CC71",
        "chunk_role": "HEADING",
        "retrieval_gold_role": "CONTEXT_HEADING_CHUNK",
        "counts_as_decision_bearing_gold": false,
        "source_hash": "e4bbd720010befabbdd08b947acc803b7f0c52b5ccdbf8da7f5b169e76f19215"
      },
      {
        "chunk_id": "MCH-A4C2632EF9126FADD349C3004E1C2D84",
        "chunk_role": "BUSINESS_CONTENT",
        "retrieval_gold_role": "BOUNDARY",
        "counts_as_decision_bearing_gold": true,
        "source_hash": "4aad371afadcb5d360f7461d405d06e706132aa072271064a297010ab458572f"
      }
    ],
    "alternate_business_bearing_chunks": [],
    "repaired_binding": {
      "status": "RETRIEVAL_GOLD_DERIVED",
      "material_id": "57b9e5fe-9549-42aa-88d5-fccc5c0afe2e",
      "document_id": "57b9e5fe-9549-42aa-88d5-fccc5c0afe2e",
      "chunk_id": "MCH-A4C2632EF9126FADD349C3004E1C2D84",
      "repaired_span_id": "REPAIRED_EVAL_SPAN_MCH-A4C2632EF9126FADD349C3004E1C2D84",
      "source_text": "名称：ISO/IEC 27001\n编号：CM-Q-27001-2024\n状态：active\n有效至：2027-11-30",
      "source_hash": "4aad371afadcb5d360f7461d405d06e706132aa072271064a297010ab458572f",
      "source_match_type": "EXACT_SUBSTRING_OF_PERSISTED_MULTI_CHUNK_SPAN",
      "source_resolution_method": "OFFLINE_GOLD_LINEAGE_REPAIR",
      "note": "Evaluation-only deterministic business-bearing chunk derived from a valid multi-chunk Evidence Span; not persisted as Evidence Source Span and not HUMAN_GOLD."
    },
    "root_cause": "Gold span was stored over a multi-chunk source, but the expected chunk points to a title-only anchor; the business-bearing chunk is separate.",
    "repair_action": "REBIND_TO_REPAIRED_EXACT_CHUNK_SLICE_AFTER_INDEPENDENT_LINEAGE_CHECK"
  },
  {
    "case_id": "V2R-007-PROJECT-STATUS",
    "gold_role": "BOUNDARY",
    "classification": "RETRIEVAL_GOLD_BINDING_REQUIRES_DERIVATION",
    "persisted_span_validity": "VALID_MULTI_CHUNK_EVIDENCE_SPAN",
    "checks": {
      "expected_material_exists": true,
      "expected_chunk_exists": true,
      "span_exists": true,
      "span_source_exact_in_expected_chunk": false,
      "span_chunk_identity": true,
      "span_material_identity": true,
      "span_document_identity": true,
      "span_hash_exact": true,
      "span_offsets_present": true,
      "span_source_chunks_exist": true,
      "span_source_chunks_same_material": true
    },
    "expected": {
      "material_id": "75924286-5882-4658-bff9-ed587f70b927",
      "document_id": "75924286-5882-4658-bff9-ed587f70b927",
      "chunk_id": "MCH-C5D5EB33CB97F715074CC6F4E98EEF17",
      "chunk_raw_text": "项目：南泽业务协同升级片段（虚构）\n客户：南泽公共服务机构（虚构）\n实施片段日期：2025-10-09\n状态不完整，不得推断完工或验收。",
      "span_id": "ESPAN-06CAB70C047B196B20B49523A71D7661",
      "span_raw_text": "# 项目D实施片段\n\n项目：南泽业务协同升级片段（虚构）\n客户：南泽公共服务机构（虚构）\n实施片段日期：2025-10-09\n状态不完整，不得推断完工或验收。",
      "span_hash": "6ed02e81de495a410e8a220b74f07851df39a8b72bec308e69ab83878a31b31f",
      "span_start_offset": 92,
      "span_end_offset": 171,
      "span_anchor_chunk_id": "MCH-C5D5EB33CB97F715074CC6F4E98EEF17",
      "span_source_chunk_ids": [
        "MCH-3D0A254CE926B207AFC696BF46520897",
        "MCH-C5D5EB33CB97F715074CC6F4E98EEF17"
      ]
    },
    "derived_gold_evidence_set": [
      {
        "chunk_id": "MCH-3D0A254CE926B207AFC696BF46520897",
        "chunk_role": "HEADING",
        "retrieval_gold_role": "CONTEXT_HEADING_CHUNK",
        "counts_as_decision_bearing_gold": false,
        "source_hash": "b89f45caf54952409ae8cc93ff746c800a3668024b0eca0665323f9a3fcf3ecf"
      },
      {
        "chunk_id": "MCH-C5D5EB33CB97F715074CC6F4E98EEF17",
        "chunk_role": "BUSINESS_CONTENT",
        "retrieval_gold_role": "BOUNDARY",
        "counts_as_decision_bearing_gold": true,
        "source_hash": "62b80cab1a81fc5d2a600db98bf9070114394f1f2726eab5d665a5c2583218c9"
      }
    ],
    "alternate_business_bearing_chunks": [],
    "repaired_binding": {
      "status": "RETRIEVAL_GOLD_DERIVED",
      "material_id": "75924286-5882-4658-bff9-ed587f70b927",
      "document_id": "75924286-5882-4658-bff9-ed587f70b927",
      "chunk_id": "MCH-C5D5EB33CB97F715074CC6F4E98EEF17",
      "repaired_span_id": "REPAIRED_EVAL_SPAN_MCH-C5D5EB33CB97F715074CC6F4E98EEF17",
      "source_text": "项目：南泽业务协同升级片段（虚构）\n客户：南泽公共服务机构（虚构）\n实施片段日期：2025-10-09\n状态不完整，不得推断完工或验收。",
      "source_hash": "62b80cab1a81fc5d2a600db98bf9070114394f1f2726eab5d665a5c2583218c9",
      "source_match_type": "EXACT_SUBSTRING_OF_PERSISTED_MULTI_CHUNK_SPAN",
      "source_resolution_method": "OFFLINE_GOLD_LINEAGE_REPAIR",
      "note": "Evaluation-only deterministic business-bearing chunk derived from a valid multi-chunk Evidence Span; not persisted as Evidence Source Span and not HUMAN_GOLD."
    },
    "root_cause": null,
    "repair_action": "REBIND_TO_REPAIRED_EXACT_CHUNK_SLICE_AFTER_INDEPENDENT_LINEAGE_CHECK"
  }
]
```

## Root causes / redesign

- V2R-005：The persisted span contains the business-bearing ISO 27001 fields, but the expected Gold chunk is a title-only anchor. The previous qualification checked span hash/source text and source_chunk_ids but did not enforce expected_chunk_id === span anchor/source chunk identity.
- V2R-006：The same title-only anchor mismatch exists; after rebind, the ISO 27001 facts remain a boundary candidate because the required project-subject scope is absent.
- V2R-007：The only previous expected source explicitly says status is incomplete, so it cannot be the sole positive Gold. MCH-268A148B9BD7EA6BF0B470DDE0EA8425 is an equivalent supporting candidate requiring human/GPT verification, not automatic Gold promotion.

## 35-candidate reclassification

```json
[
  {
    "case_id": "V2R-001-PERF-DIRECT",
    "rank": 1,
    "requirement": "企业应提供可核验的数据交换平台性能测试记录。",
    "chunk_id": "MCH-B4FF02295DBB6DCDF6E2763F057076F6",
    "material_id": "3c81671f-376e-401b-8525-be26929d5b92",
    "document_id": "3c81671f-376e-401b-8525-be26929d5b92",
    "raw_chunk_text": "# 数据交换平台性能测试记录",
    "required_factual_dimensions": [
      "subject_match",
      "entity_match",
      "scope_match",
      "status_match",
      "quantitative_match"
    ],
    "runtime_previous_classification": "METADATA_OR_HEADER",
    "corrected_runtime_classification": "METADATA_OR_HEADER",
    "corrected_supported_dimensions": [],
    "corrected_reason_codes": [
      "METADATA_OR_HEADER"
    ],
    "GPT_REVIEW_EXPECTED_CLASSIFICATION": "METADATA_OR_HEADER",
    "GPT_REVIEW_EXPECTED_REASON": "title-only metadata",
    "review_status": "GPT_REVIEWED_REGRESSION_EXPECTATION",
    "human_gold": false,
    "equivalent_supporting_evidence_candidate": false,
    "expected_classification_matches_runtime": true
  },
  {
    "case_id": "V2R-001-PERF-DIRECT",
    "rank": 2,
    "requirement": "企业应提供可核验的数据交换平台性能测试记录。",
    "chunk_id": "MCH-770B6FE8E57173DCC72914CFFB7376F8",
    "material_id": "8821b9fa-2bde-4329-9cbf-908395c1270d",
    "document_id": "8821b9fa-2bde-4329-9cbf-908395c1270d",
    "raw_chunk_text": "产品：澄明数据交换平台 V3.2\n能力：REST API 接入、数据目录、交换任务调度、运行日志。\n未声明未列出的协议、吞吐量或 SLA。",
    "required_factual_dimensions": [
      "subject_match",
      "entity_match",
      "scope_match",
      "status_match",
      "quantitative_match"
    ],
    "runtime_previous_classification": "EVIDENCE_BEARING",
    "corrected_runtime_classification": "TOPIC_RELEVANT_ONLY",
    "corrected_supported_dimensions": [],
    "corrected_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "GPT_REVIEW_EXPECTED_CLASSIFICATION": "TOPIC_RELEVANT_ONLY",
    "GPT_REVIEW_EXPECTED_REASON": "capability description lacks a test record or metric",
    "review_status": "GPT_REVIEWED_REGRESSION_EXPECTATION",
    "human_gold": false,
    "equivalent_supporting_evidence_candidate": false,
    "expected_classification_matches_runtime": true
  },
  {
    "case_id": "V2R-001-PERF-DIRECT",
    "rank": 3,
    "requirement": "企业应提供可核验的数据交换平台性能测试记录。",
    "chunk_id": "MCH-C9F466EAC2C29977E40F4A3BFE38A6E4",
    "material_id": "8821b9fa-2bde-4329-9cbf-908395c1270d",
    "document_id": "8821b9fa-2bde-4329-9cbf-908395c1270d",
    "raw_chunk_text": "# 数据交换平台产品说明",
    "required_factual_dimensions": [
      "subject_match",
      "entity_match",
      "scope_match",
      "status_match",
      "quantitative_match"
    ],
    "runtime_previous_classification": "METADATA_OR_HEADER",
    "corrected_runtime_classification": "METADATA_OR_HEADER",
    "corrected_supported_dimensions": [],
    "corrected_reason_codes": [
      "METADATA_OR_HEADER"
    ],
    "GPT_REVIEW_EXPECTED_CLASSIFICATION": "METADATA_OR_HEADER",
    "GPT_REVIEW_EXPECTED_REASON": "title-only metadata",
    "review_status": "GPT_REVIEWED_REGRESSION_EXPECTATION",
    "human_gold": false,
    "equivalent_supporting_evidence_candidate": false,
    "expected_classification_matches_runtime": true
  },
  {
    "case_id": "V2R-001-PERF-DIRECT",
    "rank": 4,
    "requirement": "企业应提供可核验的数据交换平台性能测试记录。",
    "chunk_id": "MCH-0FBD3599DAF932016F62EB9634B997AF",
    "material_id": "3c81671f-376e-401b-8525-be26929d5b92",
    "document_id": "3c81671f-376e-401b-8525-be26929d5b92",
    "raw_chunk_text": "产品：澄明数据交换平台 V3.2\n环境：8 vCPU、32 GB 内存、PostgreSQL 14、千兆局域网\n条件：50 并发、100 万条基准数据、缓存预热后执行 30 分钟\n指标：数据目录查询平均响应时间\n结果：平均 1.4 秒，P95 1.9 秒。\n日期：2025-05-16。",
    "required_factual_dimensions": [
      "subject_match",
      "entity_match",
      "scope_match",
      "status_match",
      "quantitative_match"
    ],
    "runtime_previous_classification": "EVIDENCE_BEARING",
    "corrected_runtime_classification": "EVIDENCE_BEARING",
    "corrected_supported_dimensions": [
      "quantitative_match"
    ],
    "corrected_reason_codes": [
      "REQUIRED_DIMENSION_SUPPORTED"
    ],
    "GPT_REVIEW_EXPECTED_CLASSIFICATION": "EVIDENCE_BEARING",
    "GPT_REVIEW_EXPECTED_REASON": "performance test record carries quantitative facts",
    "review_status": "GPT_REVIEWED_REGRESSION_EXPECTATION",
    "human_gold": false,
    "equivalent_supporting_evidence_candidate": false,
    "expected_classification_matches_runtime": true
  },
  {
    "case_id": "V2R-001-PERF-DIRECT",
    "rank": 5,
    "requirement": "企业应提供可核验的数据交换平台性能测试记录。",
    "chunk_id": "MCH-5B3A5D4F1299B7E362FE0D195F33C161",
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "raw_chunk_text": "记录已经验证的核心原则：",
    "required_factual_dimensions": [
      "subject_match",
      "entity_match",
      "scope_match",
      "status_match",
      "quantitative_match"
    ],
    "runtime_previous_classification": "TOPIC_RELEVANT_ONLY",
    "corrected_runtime_classification": "TOPIC_RELEVANT_ONLY",
    "corrected_supported_dimensions": [],
    "corrected_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "GPT_REVIEW_EXPECTED_CLASSIFICATION": "TOPIC_RELEVANT_ONLY",
    "GPT_REVIEW_EXPECTED_REASON": "generic validation statement",
    "review_status": "GPT_REVIEWED_REGRESSION_EXPECTATION",
    "human_gold": false,
    "equivalent_supporting_evidence_candidate": false,
    "expected_classification_matches_runtime": true
  },
  {
    "case_id": "V2R-002-PERF-PARTIAL",
    "rank": 1,
    "requirement": "企业应证明接口 P95 响应时间不超过 1 秒。",
    "chunk_id": "MCH-0FBD3599DAF932016F62EB9634B997AF",
    "material_id": "3c81671f-376e-401b-8525-be26929d5b92",
    "document_id": "3c81671f-376e-401b-8525-be26929d5b92",
    "raw_chunk_text": "产品：澄明数据交换平台 V3.2\n环境：8 vCPU、32 GB 内存、PostgreSQL 14、千兆局域网\n条件：50 并发、100 万条基准数据、缓存预热后执行 30 分钟\n指标：数据目录查询平均响应时间\n结果：平均 1.4 秒，P95 1.9 秒。\n日期：2025-05-16。",
    "required_factual_dimensions": [
      "subject_match",
      "entity_match",
      "scope_match",
      "status_match",
      "quantitative_match"
    ],
    "runtime_previous_classification": "EVIDENCE_BEARING",
    "corrected_runtime_classification": "EVIDENCE_BEARING",
    "corrected_supported_dimensions": [
      "quantitative_match"
    ],
    "corrected_reason_codes": [
      "REQUIRED_DIMENSION_SUPPORTED"
    ],
    "GPT_REVIEW_EXPECTED_CLASSIFICATION": "EVIDENCE_BEARING",
    "GPT_REVIEW_EXPECTED_REASON": "adverse P95 measurement",
    "review_status": "GPT_REVIEWED_REGRESSION_EXPECTATION",
    "human_gold": false,
    "equivalent_supporting_evidence_candidate": false,
    "expected_classification_matches_runtime": true
  },
  {
    "case_id": "V2R-002-PERF-PARTIAL",
    "rank": 2,
    "requirement": "企业应证明接口 P95 响应时间不超过 1 秒。",
    "chunk_id": "MCH-B4FF02295DBB6DCDF6E2763F057076F6",
    "material_id": "3c81671f-376e-401b-8525-be26929d5b92",
    "document_id": "3c81671f-376e-401b-8525-be26929d5b92",
    "raw_chunk_text": "# 数据交换平台性能测试记录",
    "required_factual_dimensions": [
      "subject_match",
      "entity_match",
      "scope_match",
      "status_match",
      "quantitative_match"
    ],
    "runtime_previous_classification": "METADATA_OR_HEADER",
    "corrected_runtime_classification": "METADATA_OR_HEADER",
    "corrected_supported_dimensions": [],
    "corrected_reason_codes": [
      "METADATA_OR_HEADER"
    ],
    "GPT_REVIEW_EXPECTED_CLASSIFICATION": "METADATA_OR_HEADER",
    "GPT_REVIEW_EXPECTED_REASON": "title-only metadata",
    "review_status": "GPT_REVIEWED_REGRESSION_EXPECTATION",
    "human_gold": false,
    "equivalent_supporting_evidence_candidate": false,
    "expected_classification_matches_runtime": true
  },
  {
    "case_id": "V2R-002-PERF-PARTIAL",
    "rank": 3,
    "requirement": "企业应证明接口 P95 响应时间不超过 1 秒。",
    "chunk_id": "MCH-08A2CF3D5D2423E41CECF8BB230F574A",
    "material_id": "7b29cc2e-458c-4ed9-ab5a-81f99a3ddace",
    "document_id": "7b29cc2e-458c-4ed9-ab5a-81f99a3ddace",
    "raw_chunk_text": "企业通常提供工作日 9:00-18:00 服务台、远程诊断和必要时现场支持。\n无经审核的 7×24、5 分钟响应或 99.99% SLA。",
    "required_factual_dimensions": [
      "subject_match",
      "entity_match",
      "scope_match",
      "status_match",
      "quantitative_match"
    ],
    "runtime_previous_classification": "TOPIC_RELEVANT_ONLY",
    "corrected_runtime_classification": "TOPIC_RELEVANT_ONLY",
    "corrected_supported_dimensions": [],
    "corrected_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "GPT_REVIEW_EXPECTED_CLASSIFICATION": "TOPIC_RELEVANT_ONLY",
    "GPT_REVIEW_EXPECTED_REASON": "support-hours topic without requested threshold",
    "review_status": "GPT_REVIEWED_REGRESSION_EXPECTATION",
    "human_gold": false,
    "equivalent_supporting_evidence_candidate": false,
    "expected_classification_matches_runtime": true
  },
  {
    "case_id": "V2R-002-PERF-PARTIAL",
    "rank": 4,
    "requirement": "企业应证明接口 P95 响应时间不超过 1 秒。",
    "chunk_id": "MCH-A9CA772011E7045D8F035A43E6681BE8",
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "raw_chunk_text": "Prompt =\nbackend-owned business instruction,\nversioned independently of model.",
    "required_factual_dimensions": [
      "subject_match",
      "entity_match",
      "scope_match",
      "status_match",
      "quantitative_match"
    ],
    "runtime_previous_classification": "IRRELEVANT",
    "corrected_runtime_classification": "IRRELEVANT",
    "corrected_supported_dimensions": [],
    "corrected_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "GPT_REVIEW_EXPECTED_CLASSIFICATION": "IRRELEVANT",
    "GPT_REVIEW_EXPECTED_REASON": "unrelated technical instruction",
    "review_status": "GPT_REVIEWED_REGRESSION_EXPECTATION",
    "human_gold": false,
    "equivalent_supporting_evidence_candidate": false,
    "expected_classification_matches_runtime": true
  },
  {
    "case_id": "V2R-002-PERF-PARTIAL",
    "rank": 5,
    "requirement": "企业应证明接口 P95 响应时间不超过 1 秒。",
    "chunk_id": "MCH-F6FE125F46AD101C81DA541D50D7AE47",
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "raw_chunk_text": "可控\n可追溯\n可审核\n可修改\n可交付",
    "required_factual_dimensions": [
      "subject_match",
      "entity_match",
      "scope_match",
      "status_match",
      "quantitative_match"
    ],
    "runtime_previous_classification": "IRRELEVANT",
    "corrected_runtime_classification": "IRRELEVANT",
    "corrected_supported_dimensions": [],
    "corrected_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "GPT_REVIEW_EXPECTED_CLASSIFICATION": "IRRELEVANT",
    "GPT_REVIEW_EXPECTED_REASON": "generic product principle",
    "review_status": "GPT_REVIEWED_REGRESSION_EXPECTATION",
    "human_gold": false,
    "equivalent_supporting_evidence_candidate": false,
    "expected_classification_matches_runtime": true
  },
  {
    "case_id": "V2R-003-COMP-DIRECT",
    "rank": 1,
    "requirement": "企业应说明产品在 x86_64、Ubuntu 和 PostgreSQL 环境的兼容性。",
    "chunk_id": "MCH-7F11A857F9B5A05D9B22E30CD4F1BEE0",
    "material_id": "3f9dacfb-2e48-4796-a477-98c60b506831",
    "document_id": "3f9dacfb-2e48-4796-a477-98c60b506831",
    "raw_chunk_text": "x86_64 + Ubuntu 22.04 + PostgreSQL 14：tested\n鲲鹏 920 + 麒麟 V10 + 达梦 8：partially_tested（完成安装和基础交换用例，未完成压力测试）\n海光 + 统信 UOS + 人大金仓：not_verified\n国产数据库组合：unknown",
    "required_factual_dimensions": [
      "subject_match",
      "entity_match",
      "scope_match",
      "status_match",
      "quantitative_match"
    ],
    "runtime_previous_classification": "EVIDENCE_BEARING",
    "corrected_runtime_classification": "EVIDENCE_BEARING",
    "corrected_supported_dimensions": [
      "entity_match",
      "scope_match",
      "status_match"
    ],
    "corrected_reason_codes": [
      "REQUIRED_DIMENSION_SUPPORTED"
    ],
    "GPT_REVIEW_EXPECTED_CLASSIFICATION": "EVIDENCE_BEARING",
    "GPT_REVIEW_EXPECTED_REASON": "tested requested environments",
    "review_status": "GPT_REVIEWED_REGRESSION_EXPECTATION",
    "human_gold": false,
    "equivalent_supporting_evidence_candidate": false,
    "expected_classification_matches_runtime": true
  },
  {
    "case_id": "V2R-003-COMP-DIRECT",
    "rank": 2,
    "requirement": "企业应说明产品在 x86_64、Ubuntu 和 PostgreSQL 环境的兼容性。",
    "chunk_id": "MCH-57FE3B83C106C09B70C731182F48FFA4",
    "material_id": "3f9dacfb-2e48-4796-a477-98c60b506831",
    "document_id": "3f9dacfb-2e48-4796-a477-98c60b506831",
    "raw_chunk_text": "# 产品兼容性矩阵",
    "required_factual_dimensions": [
      "subject_match",
      "entity_match",
      "scope_match",
      "status_match",
      "quantitative_match"
    ],
    "runtime_previous_classification": "METADATA_OR_HEADER",
    "corrected_runtime_classification": "METADATA_OR_HEADER",
    "corrected_supported_dimensions": [],
    "corrected_reason_codes": [
      "METADATA_OR_HEADER"
    ],
    "GPT_REVIEW_EXPECTED_CLASSIFICATION": "METADATA_OR_HEADER",
    "GPT_REVIEW_EXPECTED_REASON": "title-only metadata",
    "review_status": "GPT_REVIEWED_REGRESSION_EXPECTATION",
    "human_gold": false,
    "equivalent_supporting_evidence_candidate": false,
    "expected_classification_matches_runtime": true
  },
  {
    "case_id": "V2R-003-COMP-DIRECT",
    "rank": 3,
    "requirement": "企业应说明产品在 x86_64、Ubuntu 和 PostgreSQL 环境的兼容性。",
    "chunk_id": "MCH-238ABC8850F42BCC571A0913A7E2AF08",
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "raw_chunk_text": "优先成熟 MIT / Apache-2.0 等兼容开源组件。",
    "required_factual_dimensions": [
      "subject_match",
      "entity_match",
      "scope_match",
      "status_match",
      "quantitative_match"
    ],
    "runtime_previous_classification": "EVIDENCE_BEARING",
    "corrected_runtime_classification": "TOPIC_RELEVANT_ONLY",
    "corrected_supported_dimensions": [],
    "corrected_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "GPT_REVIEW_EXPECTED_CLASSIFICATION": "TOPIC_RELEVANT_ONLY",
    "GPT_REVIEW_EXPECTED_REASON": "open-source policy lacks requested environments",
    "review_status": "GPT_REVIEWED_REGRESSION_EXPECTATION",
    "human_gold": false,
    "equivalent_supporting_evidence_candidate": false,
    "expected_classification_matches_runtime": true
  },
  {
    "case_id": "V2R-003-COMP-DIRECT",
    "rank": 4,
    "requirement": "企业应说明产品在 x86_64、Ubuntu 和 PostgreSQL 环境的兼容性。",
    "chunk_id": "MCH-7251629B4230317EE57F8F2659926A1F",
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "raw_chunk_text": "企业软件基础能力，\n安全、够用。",
    "required_factual_dimensions": [
      "subject_match",
      "entity_match",
      "scope_match",
      "status_match",
      "quantitative_match"
    ],
    "runtime_previous_classification": "TOPIC_RELEVANT_ONLY",
    "corrected_runtime_classification": "TOPIC_RELEVANT_ONLY",
    "corrected_supported_dimensions": [],
    "corrected_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "GPT_REVIEW_EXPECTED_CLASSIFICATION": "TOPIC_RELEVANT_ONLY",
    "GPT_REVIEW_EXPECTED_REASON": "generic company capability",
    "review_status": "GPT_REVIEWED_REGRESSION_EXPECTATION",
    "human_gold": false,
    "equivalent_supporting_evidence_candidate": false,
    "expected_classification_matches_runtime": true
  },
  {
    "case_id": "V2R-003-COMP-DIRECT",
    "rank": 5,
    "requirement": "企业应说明产品在 x86_64、Ubuntu 和 PostgreSQL 环境的兼容性。",
    "chunk_id": "MCH-889DDF9919EF0E6485406DAB6A159A11",
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "raw_chunk_text": "SUPPORTED\n→ 材料已满足",
    "required_factual_dimensions": [
      "subject_match",
      "entity_match",
      "scope_match",
      "status_match",
      "quantitative_match"
    ],
    "runtime_previous_classification": "IRRELEVANT",
    "corrected_runtime_classification": "IRRELEVANT",
    "corrected_supported_dimensions": [],
    "corrected_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "GPT_REVIEW_EXPECTED_CLASSIFICATION": "IRRELEVANT",
    "GPT_REVIEW_EXPECTED_REASON": "workflow status text",
    "review_status": "GPT_REVIEWED_REGRESSION_EXPECTATION",
    "human_gold": false,
    "equivalent_supporting_evidence_candidate": false,
    "expected_classification_matches_runtime": true
  },
  {
    "case_id": "V2R-004-COMP-PARTIAL",
    "rank": 1,
    "requirement": "企业应证明所有国产数据库组合均已完成压力测试。",
    "chunk_id": "MCH-7F11A857F9B5A05D9B22E30CD4F1BEE0",
    "material_id": "3f9dacfb-2e48-4796-a477-98c60b506831",
    "document_id": "3f9dacfb-2e48-4796-a477-98c60b506831",
    "raw_chunk_text": "x86_64 + Ubuntu 22.04 + PostgreSQL 14：tested\n鲲鹏 920 + 麒麟 V10 + 达梦 8：partially_tested（完成安装和基础交换用例，未完成压力测试）\n海光 + 统信 UOS + 人大金仓：not_verified\n国产数据库组合：unknown",
    "required_factual_dimensions": [
      "subject_match",
      "entity_match",
      "scope_match",
      "status_match"
    ],
    "runtime_previous_classification": "EVIDENCE_BEARING",
    "corrected_runtime_classification": "EVIDENCE_BEARING",
    "corrected_supported_dimensions": [
      "entity_match",
      "scope_match",
      "status_match"
    ],
    "corrected_reason_codes": [
      "REQUIRED_DIMENSION_SUPPORTED"
    ],
    "GPT_REVIEW_EXPECTED_CLASSIFICATION": "EVIDENCE_BEARING",
    "GPT_REVIEW_EXPECTED_REASON": "matrix records partial/not-verified status for requested scope",
    "review_status": "GPT_REVIEWED_REGRESSION_EXPECTATION",
    "human_gold": false,
    "equivalent_supporting_evidence_candidate": false,
    "expected_classification_matches_runtime": true
  },
  {
    "case_id": "V2R-004-COMP-PARTIAL",
    "rank": 2,
    "requirement": "企业应证明所有国产数据库组合均已完成压力测试。",
    "chunk_id": "MCH-B4FF02295DBB6DCDF6E2763F057076F6",
    "material_id": "3c81671f-376e-401b-8525-be26929d5b92",
    "document_id": "3c81671f-376e-401b-8525-be26929d5b92",
    "raw_chunk_text": "# 数据交换平台性能测试记录",
    "required_factual_dimensions": [
      "subject_match",
      "entity_match",
      "scope_match",
      "status_match"
    ],
    "runtime_previous_classification": "METADATA_OR_HEADER",
    "corrected_runtime_classification": "METADATA_OR_HEADER",
    "corrected_supported_dimensions": [],
    "corrected_reason_codes": [
      "METADATA_OR_HEADER"
    ],
    "GPT_REVIEW_EXPECTED_CLASSIFICATION": "METADATA_OR_HEADER",
    "GPT_REVIEW_EXPECTED_REASON": "title-only metadata",
    "review_status": "GPT_REVIEWED_REGRESSION_EXPECTATION",
    "human_gold": false,
    "equivalent_supporting_evidence_candidate": false,
    "expected_classification_matches_runtime": true
  },
  {
    "case_id": "V2R-004-COMP-PARTIAL",
    "rank": 3,
    "requirement": "企业应证明所有国产数据库组合均已完成压力测试。",
    "chunk_id": "MCH-6BA94F47BCD831E596F751A2BEA49AB8",
    "material_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "document_id": "9905462c-a58b-4168-a721-b5c156c74b0d",
    "raw_chunk_text": "commit 前：\n相关 tests PASS。",
    "required_factual_dimensions": [
      "subject_match",
      "entity_match",
      "scope_match",
      "status_match"
    ],
    "runtime_previous_classification": "IRRELEVANT",
    "corrected_runtime_classification": "IRRELEVANT",
    "corrected_supported_dimensions": [],
    "corrected_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "GPT_REVIEW_EXPECTED_CLASSIFICATION": "IRRELEVANT",
    "GPT_REVIEW_EXPECTED_REASON": "unrelated commit note",
    "review_status": "GPT_REVIEWED_REGRESSION_EXPECTATION",
    "human_gold": false,
    "equivalent_supporting_evidence_candidate": false,
    "expected_classification_matches_runtime": true
  },
  {
    "case_id": "V2R-004-COMP-PARTIAL",
    "rank": 4,
    "requirement": "企业应证明所有国产数据库组合均已完成压力测试。",
    "chunk_id": "MCH-57FE3B83C106C09B70C731182F48FFA4",
    "material_id": "3f9dacfb-2e48-4796-a477-98c60b506831",
    "document_id": "3f9dacfb-2e48-4796-a477-98c60b506831",
    "raw_chunk_text": "# 产品兼容性矩阵",
    "required_factual_dimensions": [
      "subject_match",
      "entity_match",
      "scope_match",
      "status_match"
    ],
    "runtime_previous_classification": "METADATA_OR_HEADER",
    "corrected_runtime_classification": "METADATA_OR_HEADER",
    "corrected_supported_dimensions": [],
    "corrected_reason_codes": [
      "METADATA_OR_HEADER"
    ],
    "GPT_REVIEW_EXPECTED_CLASSIFICATION": "METADATA_OR_HEADER",
    "GPT_REVIEW_EXPECTED_REASON": "title-only metadata",
    "review_status": "GPT_REVIEWED_REGRESSION_EXPECTATION",
    "human_gold": false,
    "equivalent_supporting_evidence_candidate": false,
    "expected_classification_matches_runtime": true
  },
  {
    "case_id": "V2R-004-COMP-PARTIAL",
    "rank": 5,
    "requirement": "企业应证明所有国产数据库组合均已完成压力测试。",
    "chunk_id": "MCH-0FBD3599DAF932016F62EB9634B997AF",
    "material_id": "3c81671f-376e-401b-8525-be26929d5b92",
    "document_id": "3c81671f-376e-401b-8525-be26929d5b92",
    "raw_chunk_text": "产品：澄明数据交换平台 V3.2\n环境：8 vCPU、32 GB 内存、PostgreSQL 14、千兆局域网\n条件：50 并发、100 万条基准数据、缓存预热后执行 30 分钟\n指标：数据目录查询平均响应时间\n结果：平均 1.4 秒，P95 1.9 秒。\n日期：2025-05-16。",
    "required_factual_dimensions": [
      "subject_match",
      "entity_match",
      "scope_match",
      "status_match"
    ],
    "runtime_previous_classification": "TOPIC_RELEVANT_ONLY",
    "corrected_runtime_classification": "TOPIC_RELEVANT_ONLY",
    "corrected_supported_dimensions": [],
    "corrected_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "GPT_REVIEW_EXPECTED_CLASSIFICATION": "TOPIC_RELEVANT_ONLY",
    "GPT_REVIEW_EXPECTED_REASON": "performance record is not database-scope evidence",
    "review_status": "GPT_REVIEWED_REGRESSION_EXPECTATION",
    "human_gold": false,
    "equivalent_supporting_evidence_candidate": false,
    "expected_classification_matches_runtime": true
  },
  {
    "case_id": "V2R-005-ISO-DIRECT",
    "rank": 1,
    "requirement": "企业应提供当前有效的 ISO/IEC 27001 认证信息。",
    "chunk_id": "MCH-70376020855F97D43106A81E5F040C7F",
    "material_id": "74ed566b-18c0-41a1-ba55-59cbe182251c",
    "document_id": "74ed566b-18c0-41a1-ba55-59cbe182251c",
    "raw_chunk_text": "企业持有在有效期内的 ISO/IEC 27001 受控记录。该事实不证明任一产品已实现特定安全等级、等保级别或具体安全功能。",
    "required_factual_dimensions": [
      "subject_match",
      "entity_match",
      "scope_match",
      "status_match",
      "validity_match",
      "quantitative_match"
    ],
    "runtime_previous_classification": "EVIDENCE_BEARING",
    "corrected_runtime_classification": "EVIDENCE_BEARING",
    "corrected_supported_dimensions": [
      "entity_match",
      "validity_match",
      "status_match"
    ],
    "corrected_reason_codes": [
      "REQUIRED_DIMENSION_SUPPORTED"
    ],
    "GPT_REVIEW_EXPECTED_CLASSIFICATION": "EVIDENCE_BEARING",
    "GPT_REVIEW_EXPECTED_REASON": "controlled record states current ISO 27001 validity",
    "review_status": "GPT_REVIEWED_REGRESSION_EXPECTATION",
    "human_gold": false,
    "equivalent_supporting_evidence_candidate": false,
    "expected_classification_matches_runtime": true
  },
  {
    "case_id": "V2R-005-ISO-DIRECT",
    "rank": 2,
    "requirement": "企业应提供当前有效的 ISO/IEC 27001 认证信息。",
    "chunk_id": "MCH-A4C2632EF9126FADD349C3004E1C2D84",
    "material_id": "57b9e5fe-9549-42aa-88d5-fccc5c0afe2e",
    "document_id": "57b9e5fe-9549-42aa-88d5-fccc5c0afe2e",
    "raw_chunk_text": "名称：ISO/IEC 27001\n编号：CM-Q-27001-2024\n状态：active\n有效至：2027-11-30",
    "required_factual_dimensions": [
      "subject_match",
      "entity_match",
      "scope_match",
      "status_match",
      "validity_match",
      "quantitative_match"
    ],
    "runtime_previous_classification": "EVIDENCE_BEARING",
    "corrected_runtime_classification": "EVIDENCE_BEARING",
    "corrected_supported_dimensions": [
      "entity_match",
      "validity_match",
      "status_match"
    ],
    "corrected_reason_codes": [
      "REQUIRED_DIMENSION_SUPPORTED"
    ],
    "GPT_REVIEW_EXPECTED_CLASSIFICATION": "EVIDENCE_BEARING",
    "GPT_REVIEW_EXPECTED_REASON": "exact ISO 27001 fields and validity",
    "review_status": "GPT_REVIEWED_REGRESSION_EXPECTATION",
    "human_gold": false,
    "equivalent_supporting_evidence_candidate": false,
    "expected_classification_matches_runtime": true
  },
  {
    "case_id": "V2R-005-ISO-DIRECT",
    "rank": 3,
    "requirement": "企业应提供当前有效的 ISO/IEC 27001 认证信息。",
    "chunk_id": "MCH-0820CC5A439CB986C62E46213029CC71",
    "material_id": "57b9e5fe-9549-42aa-88d5-fccc5c0afe2e",
    "document_id": "57b9e5fe-9549-42aa-88d5-fccc5c0afe2e",
    "raw_chunk_text": "# ISO 27001 受控记录",
    "required_factual_dimensions": [
      "subject_match",
      "entity_match",
      "scope_match",
      "status_match",
      "validity_match",
      "quantitative_match"
    ],
    "runtime_previous_classification": "METADATA_OR_HEADER",
    "corrected_runtime_classification": "METADATA_OR_HEADER",
    "corrected_supported_dimensions": [],
    "corrected_reason_codes": [
      "METADATA_OR_HEADER"
    ],
    "GPT_REVIEW_EXPECTED_CLASSIFICATION": "METADATA_OR_HEADER",
    "GPT_REVIEW_EXPECTED_REASON": "title-only metadata",
    "review_status": "GPT_REVIEWED_REGRESSION_EXPECTATION",
    "human_gold": false,
    "equivalent_supporting_evidence_candidate": false,
    "expected_classification_matches_runtime": true
  },
  {
    "case_id": "V2R-005-ISO-DIRECT",
    "rank": 4,
    "requirement": "企业应提供当前有效的 ISO/IEC 27001 认证信息。",
    "chunk_id": "MCH-D37B061257382C31A3C757430BDD2CA6",
    "material_id": "c5395bc4-0531-4e6f-9f0c-3562cee0a2f1",
    "document_id": "c5395bc4-0531-4e6f-9f0c-3562cee0a2f1",
    "raw_chunk_text": "# ISO 9001 受控记录",
    "required_factual_dimensions": [
      "subject_match",
      "entity_match",
      "scope_match",
      "status_match",
      "validity_match",
      "quantitative_match"
    ],
    "runtime_previous_classification": "METADATA_OR_HEADER",
    "corrected_runtime_classification": "METADATA_OR_HEADER",
    "corrected_supported_dimensions": [],
    "corrected_reason_codes": [
      "METADATA_OR_HEADER"
    ],
    "GPT_REVIEW_EXPECTED_CLASSIFICATION": "METADATA_OR_HEADER",
    "GPT_REVIEW_EXPECTED_REASON": "wrong certificate title-only metadata",
    "review_status": "GPT_REVIEWED_REGRESSION_EXPECTATION",
    "human_gold": false,
    "equivalent_supporting_evidence_candidate": false,
    "expected_classification_matches_runtime": true
  },
  {
    "case_id": "V2R-005-ISO-DIRECT",
    "rank": 5,
    "requirement": "企业应提供当前有效的 ISO/IEC 27001 认证信息。",
    "chunk_id": "MCH-A160D3E488BD50C27E5F6267363E57B1",
    "material_id": "c5395bc4-0531-4e6f-9f0c-3562cee0a2f1",
    "document_id": "c5395bc4-0531-4e6f-9f0c-3562cee0a2f1",
    "raw_chunk_text": "名称：ISO 9001\n编号：CM-Q-9001-2025\n状态：active\n有效至：2028-03-31",
    "required_factual_dimensions": [
      "subject_match",
      "entity_match",
      "scope_match",
      "status_match",
      "validity_match",
      "quantitative_match"
    ],
    "runtime_previous_classification": "EVIDENCE_BEARING",
    "corrected_runtime_classification": "TOPIC_RELEVANT_ONLY",
    "corrected_supported_dimensions": [],
    "corrected_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "GPT_REVIEW_EXPECTED_CLASSIFICATION": "TOPIC_RELEVANT_ONLY",
    "GPT_REVIEW_EXPECTED_REASON": "ISO 9001 is the wrong certificate type",
    "review_status": "GPT_REVIEWED_REGRESSION_EXPECTATION",
    "human_gold": false,
    "equivalent_supporting_evidence_candidate": false,
    "expected_classification_matches_runtime": true
  },
  {
    "case_id": "V2R-006-ISO-SCOPE",
    "rank": 1,
    "requirement": "企业应提供指定项目主体的 ISO/IEC 27001 证书。",
    "chunk_id": "MCH-70376020855F97D43106A81E5F040C7F",
    "material_id": "74ed566b-18c0-41a1-ba55-59cbe182251c",
    "document_id": "74ed566b-18c0-41a1-ba55-59cbe182251c",
    "raw_chunk_text": "企业持有在有效期内的 ISO/IEC 27001 受控记录。该事实不证明任一产品已实现特定安全等级、等保级别或具体安全功能。",
    "required_factual_dimensions": [
      "subject_match",
      "entity_match",
      "scope_match",
      "status_match",
      "validity_match",
      "quantitative_match"
    ],
    "runtime_previous_classification": "EVIDENCE_BEARING",
    "corrected_runtime_classification": "EVIDENCE_BEARING",
    "corrected_supported_dimensions": [
      "entity_match",
      "validity_match",
      "status_match"
    ],
    "corrected_reason_codes": [
      "REQUIRED_DIMENSION_SUPPORTED"
    ],
    "GPT_REVIEW_EXPECTED_CLASSIFICATION": "EVIDENCE_BEARING",
    "GPT_REVIEW_EXPECTED_REASON": "enterprise certificate facts are boundary evidence; project-subject scope is unresolved",
    "review_status": "GPT_REVIEWED_REGRESSION_EXPECTATION",
    "human_gold": false,
    "equivalent_supporting_evidence_candidate": false,
    "expected_classification_matches_runtime": true
  },
  {
    "case_id": "V2R-006-ISO-SCOPE",
    "rank": 2,
    "requirement": "企业应提供指定项目主体的 ISO/IEC 27001 证书。",
    "chunk_id": "MCH-0820CC5A439CB986C62E46213029CC71",
    "material_id": "57b9e5fe-9549-42aa-88d5-fccc5c0afe2e",
    "document_id": "57b9e5fe-9549-42aa-88d5-fccc5c0afe2e",
    "raw_chunk_text": "# ISO 27001 受控记录",
    "required_factual_dimensions": [
      "subject_match",
      "entity_match",
      "scope_match",
      "status_match",
      "validity_match",
      "quantitative_match"
    ],
    "runtime_previous_classification": "METADATA_OR_HEADER",
    "corrected_runtime_classification": "METADATA_OR_HEADER",
    "corrected_supported_dimensions": [],
    "corrected_reason_codes": [
      "METADATA_OR_HEADER"
    ],
    "GPT_REVIEW_EXPECTED_CLASSIFICATION": "METADATA_OR_HEADER",
    "GPT_REVIEW_EXPECTED_REASON": "title-only metadata",
    "review_status": "GPT_REVIEWED_REGRESSION_EXPECTATION",
    "human_gold": false,
    "equivalent_supporting_evidence_candidate": false,
    "expected_classification_matches_runtime": true
  },
  {
    "case_id": "V2R-006-ISO-SCOPE",
    "rank": 3,
    "requirement": "企业应提供指定项目主体的 ISO/IEC 27001 证书。",
    "chunk_id": "MCH-A4C2632EF9126FADD349C3004E1C2D84",
    "material_id": "57b9e5fe-9549-42aa-88d5-fccc5c0afe2e",
    "document_id": "57b9e5fe-9549-42aa-88d5-fccc5c0afe2e",
    "raw_chunk_text": "名称：ISO/IEC 27001\n编号：CM-Q-27001-2024\n状态：active\n有效至：2027-11-30",
    "required_factual_dimensions": [
      "subject_match",
      "entity_match",
      "scope_match",
      "status_match",
      "validity_match",
      "quantitative_match"
    ],
    "runtime_previous_classification": "EVIDENCE_BEARING",
    "corrected_runtime_classification": "EVIDENCE_BEARING",
    "corrected_supported_dimensions": [
      "entity_match",
      "validity_match",
      "status_match"
    ],
    "corrected_reason_codes": [
      "REQUIRED_DIMENSION_SUPPORTED"
    ],
    "GPT_REVIEW_EXPECTED_CLASSIFICATION": "EVIDENCE_BEARING",
    "GPT_REVIEW_EXPECTED_REASON": "ISO 27001 facts are boundary evidence; project-subject scope is unresolved",
    "review_status": "GPT_REVIEWED_REGRESSION_EXPECTATION",
    "human_gold": false,
    "equivalent_supporting_evidence_candidate": false,
    "expected_classification_matches_runtime": true
  },
  {
    "case_id": "V2R-006-ISO-SCOPE",
    "rank": 4,
    "requirement": "企业应提供指定项目主体的 ISO/IEC 27001 证书。",
    "chunk_id": "MCH-D37B061257382C31A3C757430BDD2CA6",
    "material_id": "c5395bc4-0531-4e6f-9f0c-3562cee0a2f1",
    "document_id": "c5395bc4-0531-4e6f-9f0c-3562cee0a2f1",
    "raw_chunk_text": "# ISO 9001 受控记录",
    "required_factual_dimensions": [
      "subject_match",
      "entity_match",
      "scope_match",
      "status_match",
      "validity_match",
      "quantitative_match"
    ],
    "runtime_previous_classification": "METADATA_OR_HEADER",
    "corrected_runtime_classification": "METADATA_OR_HEADER",
    "corrected_supported_dimensions": [],
    "corrected_reason_codes": [
      "METADATA_OR_HEADER"
    ],
    "GPT_REVIEW_EXPECTED_CLASSIFICATION": "METADATA_OR_HEADER",
    "GPT_REVIEW_EXPECTED_REASON": "wrong certificate title-only metadata",
    "review_status": "GPT_REVIEWED_REGRESSION_EXPECTATION",
    "human_gold": false,
    "equivalent_supporting_evidence_candidate": false,
    "expected_classification_matches_runtime": true
  },
  {
    "case_id": "V2R-006-ISO-SCOPE",
    "rank": 5,
    "requirement": "企业应提供指定项目主体的 ISO/IEC 27001 证书。",
    "chunk_id": "MCH-A160D3E488BD50C27E5F6267363E57B1",
    "material_id": "c5395bc4-0531-4e6f-9f0c-3562cee0a2f1",
    "document_id": "c5395bc4-0531-4e6f-9f0c-3562cee0a2f1",
    "raw_chunk_text": "名称：ISO 9001\n编号：CM-Q-9001-2025\n状态：active\n有效至：2028-03-31",
    "required_factual_dimensions": [
      "subject_match",
      "entity_match",
      "scope_match",
      "status_match",
      "validity_match",
      "quantitative_match"
    ],
    "runtime_previous_classification": "EVIDENCE_BEARING",
    "corrected_runtime_classification": "TOPIC_RELEVANT_ONLY",
    "corrected_supported_dimensions": [],
    "corrected_reason_codes": [
      "REQUIRED_DIMENSION_NOT_SUPPORTED"
    ],
    "GPT_REVIEW_EXPECTED_CLASSIFICATION": "TOPIC_RELEVANT_ONLY",
    "GPT_REVIEW_EXPECTED_REASON": "ISO 9001 is the wrong certificate type",
    "review_status": "GPT_REVIEWED_REGRESSION_EXPECTATION",
    "human_gold": false,
    "equivalent_supporting_evidence_candidate": false,
    "expected_classification_matches_runtime": true
  },
  {
    "case_id": "V2R-007-PROJECT-STATUS",
    "rank": 1,
    "requirement": "企业应提供已完成并可验收的同类项目记录。",
    "chunk_id": "MCH-DEA320F82E7EEC727D332134D9C2E87A",
    "material_id": "b472e07b-3065-4645-9b0b-a6abadaa70b7",
    "document_id": "b472e07b-3065-4645-9b0b-a6abadaa70b7",
    "raw_chunk_text": "# 项目A验收记录",
    "required_factual_dimensions": [
      "subject_match",
      "entity_match",
      "scope_match",
      "status_match"
    ],
    "runtime_previous_classification": "METADATA_OR_HEADER",
    "corrected_runtime_classification": "METADATA_OR_HEADER",
    "corrected_supported_dimensions": [],
    "corrected_reason_codes": [
      "METADATA_OR_HEADER"
    ],
    "GPT_REVIEW_EXPECTED_CLASSIFICATION": "METADATA_OR_HEADER",
    "GPT_REVIEW_EXPECTED_REASON": "title-only metadata",
    "review_status": "GPT_REVIEWED_REGRESSION_EXPECTATION",
    "human_gold": false,
    "equivalent_supporting_evidence_candidate": false,
    "expected_classification_matches_runtime": true
  },
  {
    "case_id": "V2R-007-PROJECT-STATUS",
    "rank": 2,
    "requirement": "企业应提供已完成并可验收的同类项目记录。",
    "chunk_id": "MCH-2053A2763523C2DAF21676650B8D3E7C",
    "material_id": "39d2e81d-82a2-4fa1-8545-83d6f428f234",
    "document_id": "39d2e81d-82a2-4fa1-8545-83d6f428f234",
    "raw_chunk_text": "# 项目B中选及合同记录",
    "required_factual_dimensions": [
      "subject_match",
      "entity_match",
      "scope_match",
      "status_match"
    ],
    "runtime_previous_classification": "METADATA_OR_HEADER",
    "corrected_runtime_classification": "METADATA_OR_HEADER",
    "corrected_supported_dimensions": [],
    "corrected_reason_codes": [
      "METADATA_OR_HEADER"
    ],
    "GPT_REVIEW_EXPECTED_CLASSIFICATION": "METADATA_OR_HEADER",
    "GPT_REVIEW_EXPECTED_REASON": "title-only metadata",
    "review_status": "GPT_REVIEWED_REGRESSION_EXPECTATION",
    "human_gold": false,
    "equivalent_supporting_evidence_candidate": false,
    "expected_classification_matches_runtime": true
  },
  {
    "case_id": "V2R-007-PROJECT-STATUS",
    "rank": 3,
    "requirement": "企业应提供已完成并可验收的同类项目记录。",
    "chunk_id": "MCH-D688689513881DDE95287CA59DE22C84",
    "material_id": "6c7a4ff1-75b8-47ef-aa71-a44d8e0d075c",
    "document_id": "6c7a4ff1-75b8-47ef-aa71-a44d8e0d075c",
    "raw_chunk_text": "# 项目A实施记录",
    "required_factual_dimensions": [
      "subject_match",
      "entity_match",
      "scope_match",
      "status_match"
    ],
    "runtime_previous_classification": "METADATA_OR_HEADER",
    "corrected_runtime_classification": "METADATA_OR_HEADER",
    "corrected_supported_dimensions": [],
    "corrected_reason_codes": [
      "METADATA_OR_HEADER"
    ],
    "GPT_REVIEW_EXPECTED_CLASSIFICATION": "METADATA_OR_HEADER",
    "GPT_REVIEW_EXPECTED_REASON": "title-only metadata",
    "review_status": "GPT_REVIEWED_REGRESSION_EXPECTATION",
    "human_gold": false,
    "equivalent_supporting_evidence_candidate": false,
    "expected_classification_matches_runtime": true
  },
  {
    "case_id": "V2R-007-PROJECT-STATUS",
    "rank": 4,
    "requirement": "企业应提供已完成并可验收的同类项目记录。",
    "chunk_id": "MCH-268A148B9BD7EA6BF0B470DDE0EA8425",
    "material_id": "b472e07b-3065-4645-9b0b-a6abadaa70b7",
    "document_id": "b472e07b-3065-4645-9b0b-a6abadaa70b7",
    "raw_chunk_text": "项目：北川新区数据协同平台项目（虚构）\n客户：北川新区数字服务中心（虚构）\n验收日期：2024-09-20\n结论：虚构项目约定范围通过验收；不外推至其他环境。",
    "required_factual_dimensions": [
      "subject_match",
      "entity_match",
      "scope_match",
      "status_match"
    ],
    "runtime_previous_classification": "EVIDENCE_BEARING",
    "corrected_runtime_classification": "EVIDENCE_BEARING",
    "corrected_supported_dimensions": [
      "entity_match",
      "scope_match",
      "status_match"
    ],
    "corrected_reason_codes": [
      "REQUIRED_DIMENSION_SUPPORTED"
    ],
    "GPT_REVIEW_EXPECTED_CLASSIFICATION": "EVIDENCE_BEARING",
    "GPT_REVIEW_EXPECTED_REASON": "equivalent completed-and-accepted project candidate",
    "review_status": "GPT_REVIEWED_REGRESSION_EXPECTATION",
    "human_gold": false,
    "equivalent_supporting_evidence_candidate": true,
    "expected_classification_matches_runtime": true
  },
  {
    "case_id": "V2R-007-PROJECT-STATUS",
    "rank": 5,
    "requirement": "企业应提供已完成并可验收的同类项目记录。",
    "chunk_id": "MCH-72D4582C2995FF3A37A4610333CFB4D4",
    "material_id": "e0fa38e8-e6b0-4a4a-9f91-d3cd9aa6f95f",
    "document_id": "e0fa38e8-e6b0-4a4a-9f91-d3cd9aa6f95f",
    "raw_chunk_text": "# 项目A中选记录",
    "required_factual_dimensions": [
      "subject_match",
      "entity_match",
      "scope_match",
      "status_match"
    ],
    "runtime_previous_classification": "METADATA_OR_HEADER",
    "corrected_runtime_classification": "METADATA_OR_HEADER",
    "corrected_supported_dimensions": [],
    "corrected_reason_codes": [
      "METADATA_OR_HEADER"
    ],
    "GPT_REVIEW_EXPECTED_CLASSIFICATION": "METADATA_OR_HEADER",
    "GPT_REVIEW_EXPECTED_REASON": "title-only metadata",
    "review_status": "GPT_REVIEWED_REGRESSION_EXPECTATION",
    "human_gold": false,
    "equivalent_supporting_evidence_candidate": false,
    "expected_classification_matches_runtime": true
  }
]
```

## Metadata pollution

```json
{
  "metadata_total": 14,
  "metadata_at_1": {
    "candidate_count": 2,
    "case_rate": 0.2857142857142857
  },
  "metadata_at_3": {
    "candidate_count": 10,
    "case_rate": 1
  },
  "metadata_at_5": {
    "candidate_count": 14,
    "share": 0.4,
    "case_rate": 1
  }
}
```

## Offline metrics

```json
{
  "denominator": 6,
  "decision_bearing_hit_at_1": 0.5,
  "decision_bearing_hit_at_3": 0.8333333333333334,
  "decision_bearing_hit_at_5": 1,
  "gold_expected_rank_mrr": 0.6805555555555555,
  "useful_evidence_first_rank_distribution": {
    "1": 5,
    "4": 1
  },
  "cases_hit_at_5_but_useful_evidence_rank_ge_4": [
    "V2R-001-PERF-DIRECT"
  ],
  "case_metrics": [
    {
      "case_id": "V2R-001-PERF-DIRECT",
      "expected_chunk_id": "MCH-0FBD3599DAF932016F62EB9634B997AF",
      "expected_rank": 4,
      "useful_evidence_first_rank": 4,
      "hit_at_1": false,
      "hit_at_3": false,
      "hit_at_5": true,
      "mrr": 0.25
    },
    {
      "case_id": "V2R-002-PERF-PARTIAL",
      "expected_chunk_id": "MCH-0FBD3599DAF932016F62EB9634B997AF",
      "expected_rank": 1,
      "useful_evidence_first_rank": 1,
      "hit_at_1": true,
      "hit_at_3": true,
      "hit_at_5": true,
      "mrr": 1
    },
    {
      "case_id": "V2R-003-COMP-DIRECT",
      "expected_chunk_id": "MCH-7F11A857F9B5A05D9B22E30CD4F1BEE0",
      "expected_rank": 1,
      "useful_evidence_first_rank": 1,
      "hit_at_1": true,
      "hit_at_3": true,
      "hit_at_5": true,
      "mrr": 1
    },
    {
      "case_id": "V2R-004-COMP-PARTIAL",
      "expected_chunk_id": "MCH-7F11A857F9B5A05D9B22E30CD4F1BEE0",
      "expected_rank": 1,
      "useful_evidence_first_rank": 1,
      "hit_at_1": true,
      "hit_at_3": true,
      "hit_at_5": true,
      "mrr": 1
    },
    {
      "case_id": "V2R-005-ISO-DIRECT",
      "expected_chunk_id": "MCH-A4C2632EF9126FADD349C3004E1C2D84",
      "expected_rank": 2,
      "useful_evidence_first_rank": 1,
      "hit_at_1": false,
      "hit_at_3": true,
      "hit_at_5": true,
      "mrr": 0.5
    },
    {
      "case_id": "V2R-006-ISO-SCOPE",
      "expected_chunk_id": "MCH-A4C2632EF9126FADD349C3004E1C2D84",
      "expected_rank": 3,
      "useful_evidence_first_rank": 1,
      "hit_at_1": false,
      "hit_at_3": true,
      "hit_at_5": true,
      "mrr": 0.3333333333333333
    }
  ],
  "excluded_from_decision_metrics": [
    "V2R-007-PROJECT-STATUS (GOLD_DESIGN_AMBIGUOUS; equivalent candidate needs review)"
  ]
}
```

## Safety / stage

- Evidence Fact：NOT_CREATED
- Formal Mapping：NOT_CREATED
- Claim Gate：NOT_EXECUTED
- Writer：NOT_EXECUTED
- Stage17：PENDING_EVAL_INTEGRITY_REVIEW
- GPT review status：GPT_REVIEWED_REGRESSION_EXPECTATION
- Human Gold：NO
