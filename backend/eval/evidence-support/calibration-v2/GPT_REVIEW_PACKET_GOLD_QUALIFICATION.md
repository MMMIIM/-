# P0 TARGETED GOLD QUALIFICATION CHECKPOINT

- This packet replaces the previous blanket `GOLD_INVALID` classification with independent dimensions A–I.
- No Embedding, Retrieval, LLM, Dify, external network call or database write was performed.

## Summary

```json
{
  "total_cases": 12,
  "GOLD_READY_FOR_RETRIEVAL": 7,
  "GOLD_PARTIAL": 5,
  "GOLD_STALE": 0,
  "GOLD_LINEAGE_INVALID": 0,
  "GOLD_REQUIREMENT_INVALID": 0,
  "GOLD_CORPUS_MISMATCH": 0,
  "GOLD_LEAKAGE_RISK": 0,
  "rejected": 0,
  "group_ready": 7,
  "group_repairable": 5,
  "group_reject_rebuild": 0,
  "material_verified": 12,
  "document_verified": 12,
  "chunk_verified": 12,
  "span_verified": 7,
  "current_index_verified": 9,
  "formal_tender_requirement": 0,
  "frozen_eval_query": 12,
  "synthetic_query": 0,
  "invalid_query": 0,
  "gold_independence_pass": 12,
  "runtime_expected_ids_seen": 0
}
```

## Verified source status

- Material verified：12/12
- Document verified：12/12
- Chunk verified：12/12
- Persisted span verified：7/12
- Current index verified：9/12

## Requirement status

- Formal tender requirement：0
- Frozen independent eval query：12
- Synthetic query：0
- Invalid query：0

## Independence

- Gold leakage audit：PASS
- Runtime sees expected Material/Document/Chunk/Span IDs：NO
- Expected IDs are evaluator-only and are not supplied to query construction, filters, ranking, MMR, classifier or context expansion.

## Next executable set

- READY：V2R-001-PERF-DIRECT, V2R-002-PERF-PARTIAL, V2R-003-COMP-DIRECT, V2R-004-COMP-PARTIAL, V2R-005-ISO-DIRECT, V2R-006-ISO-SCOPE, V2R-007-PROJECT-STATUS
- EXCLUDED：V2R-010-CORPUS-01 (GOLD_PARTIAL: exact_source_chunk_resolved_deterministically; source_span_or_eval_manifest_binding_not_persisted), V2R-015-CORPUS-06 (GOLD_PARTIAL: exact_source_chunk_resolved_deterministically; source_span_or_eval_manifest_binding_not_persisted), V2R-021-CORPUS-12 (GOLD_PARTIAL: exact_source_chunk_resolved_deterministically; source_span_or_eval_manifest_binding_not_persisted; current_embedding_index_missing), V2R-024-CORPUS-15 (GOLD_PARTIAL: exact_source_chunk_resolved_deterministically; source_span_or_eval_manifest_binding_not_persisted; current_embedding_index_missing), V2R-030-CORPUS-21 (GOLD_PARTIAL: exact_source_chunk_resolved_deterministically; source_span_or_eval_manifest_binding_not_persisted; current_embedding_index_missing)
- Mapping evaluation：NOT_EXECUTED

## All 12 case-level qualification results

## V2R-001-PERF-DIRECT / EVAL-RET-001

- Requirement：企业应提供可核验的数据交换平台性能测试记录。
- Requirement provenance：FROZEN_EVAL_QUERY
- Formal Requirement ID：NONE（独立评测身份）
- Intent：quantitative_performance
- Allowed scope：ENTERPRISE_PROJECT_SCOPE / project=ac1a1037-5e62-44ee-8c28-7b09d48d93e6
- Expected Material：3c81671f-376e-401b-8525-be26929d5b92
- Expected Document：3c81671f-376e-401b-8525-be26929d5b92
- Expected Chunk：MCH-0FBD3599DAF932016F62EB9634B997AF
- Expected Span：ESPAN-7C976B914F1C677C5D80017CCD2C307B
- Expected source hash：b5522622368a1f3144b6ae8ea08d106cec5174b7d36221525e0b7cb0bcdc5934

### Current read-only binding

- Material：VERIFIED
- Document：VERIFIED
- Chunk：VERIFIED
- Span：VERIFIED
- Index：CURRENT (Qwen/Qwen3-Embedding-0.6B, 1024d)
- Exact source/hash check：text=PASS / hash=PASS
- Gold independence：PASS；runtime sees expected IDs：NO

### Expected source text

```text
# 数据交换平台性能测试记录

产品：澄明数据交换平台 V3.2
环境：8 vCPU、32 GB 内存、PostgreSQL 14、千兆局域网
条件：50 并发、100 万条基准数据、缓存预热后执行 30 分钟
指标：数据目录查询平均响应时间
结果：平均 1.4 秒，P95 1.9 秒。
日期：2025-05-16。
```

### Gold readiness：GOLD_READY_FOR_RETRIEVAL

- Group：READY
- Reasons：persisted_span_exact_hash_and_current_index_verified
- Semantic notes：legacy_expected_chunk_was_metadata

### Execution / safety

- Retrieval：NOT_EXECUTED（本轮禁止 Embedding/模型调用）
- Evidence Fact：NOT_CREATED
- Formal Mapping：NOT_CREATED
- Claim Gate：NOT_CREATED
- DB write：NO

---

## V2R-002-PERF-PARTIAL / EVAL-RET-002

- Requirement：企业应证明接口 P95 响应时间不超过 1 秒。
- Requirement provenance：FROZEN_EVAL_QUERY
- Formal Requirement ID：NONE（独立评测身份）
- Intent：quantitative_performance
- Allowed scope：ENTERPRISE_PROJECT_SCOPE / project=ac1a1037-5e62-44ee-8c28-7b09d48d93e6
- Expected Material：3c81671f-376e-401b-8525-be26929d5b92
- Expected Document：3c81671f-376e-401b-8525-be26929d5b92
- Expected Chunk：MCH-0FBD3599DAF932016F62EB9634B997AF
- Expected Span：ESPAN-7C976B914F1C677C5D80017CCD2C307B
- Expected source hash：b5522622368a1f3144b6ae8ea08d106cec5174b7d36221525e0b7cb0bcdc5934

### Current read-only binding

- Material：VERIFIED
- Document：VERIFIED
- Chunk：VERIFIED
- Span：VERIFIED
- Index：CURRENT (Qwen/Qwen3-Embedding-0.6B, 1024d)
- Exact source/hash check：text=PASS / hash=PASS
- Gold independence：PASS；runtime sees expected IDs：NO

### Expected source text

```text
# 数据交换平台性能测试记录

产品：澄明数据交换平台 V3.2
环境：8 vCPU、32 GB 内存、PostgreSQL 14、千兆局域网
条件：50 并发、100 万条基准数据、缓存预热后执行 30 分钟
指标：数据目录查询平均响应时间
结果：平均 1.4 秒，P95 1.9 秒。
日期：2025-05-16。
```

### Gold readiness：GOLD_READY_FOR_RETRIEVAL

- Group：READY
- Reasons：persisted_span_exact_hash_and_current_index_verified
- Semantic notes：legacy_expected_chunk_was_metadata; target_threshold_differs_from_formal_requirement

### Execution / safety

- Retrieval：NOT_EXECUTED（本轮禁止 Embedding/模型调用）
- Evidence Fact：NOT_CREATED
- Formal Mapping：NOT_CREATED
- Claim Gate：NOT_CREATED
- DB write：NO

---

## V2R-003-COMP-DIRECT / EVAL-RET-003

- Requirement：企业应说明产品在 x86_64、Ubuntu 和 PostgreSQL 环境的兼容性。
- Requirement provenance：FROZEN_EVAL_QUERY
- Formal Requirement ID：NONE（独立评测身份）
- Intent：platform_compatibility
- Allowed scope：ENTERPRISE_PROJECT_SCOPE / project=ac1a1037-5e62-44ee-8c28-7b09d48d93e6
- Expected Material：3f9dacfb-2e48-4796-a477-98c60b506831
- Expected Document：3f9dacfb-2e48-4796-a477-98c60b506831
- Expected Chunk：MCH-7F11A857F9B5A05D9B22E30CD4F1BEE0
- Expected Span：ESPAN-DB796CE9A6685C040977607A8228D832
- Expected source hash：bb48093928c5a0df95f9c5d308dbff9edc625d6c357253e43cc8beda7ad77d5b

### Current read-only binding

- Material：VERIFIED
- Document：VERIFIED
- Chunk：VERIFIED
- Span：VERIFIED
- Index：CURRENT (Qwen/Qwen3-Embedding-0.6B, 1024d)
- Exact source/hash check：text=PASS / hash=PASS
- Gold independence：PASS；runtime sees expected IDs：NO

### Expected source text

```text
# 产品兼容性矩阵

x86_64 + Ubuntu 22.04 + PostgreSQL 14：tested
鲲鹏 920 + 麒麟 V10 + 达梦 8：partially_tested（完成安装和基础交换用例，未完成压力测试）
海光 + 统信 UOS + 人大金仓：not_verified
国产数据库组合：unknown
```

### Gold readiness：GOLD_READY_FOR_RETRIEVAL

- Group：READY
- Reasons：persisted_span_exact_hash_and_current_index_verified
- Semantic notes：legacy_expected_chunk_was_metadata

### Execution / safety

- Retrieval：NOT_EXECUTED（本轮禁止 Embedding/模型调用）
- Evidence Fact：NOT_CREATED
- Formal Mapping：NOT_CREATED
- Claim Gate：NOT_CREATED
- DB write：NO

---

## V2R-004-COMP-PARTIAL / EVAL-RET-004

- Requirement：企业应证明所有国产数据库组合均已完成压力测试。
- Requirement provenance：FROZEN_EVAL_QUERY
- Formal Requirement ID：NONE（独立评测身份）
- Intent：platform_compatibility
- Allowed scope：ENTERPRISE_PROJECT_SCOPE / project=ac1a1037-5e62-44ee-8c28-7b09d48d93e6
- Expected Material：3f9dacfb-2e48-4796-a477-98c60b506831
- Expected Document：3f9dacfb-2e48-4796-a477-98c60b506831
- Expected Chunk：MCH-7F11A857F9B5A05D9B22E30CD4F1BEE0
- Expected Span：ESPAN-DB796CE9A6685C040977607A8228D832
- Expected source hash：bb48093928c5a0df95f9c5d308dbff9edc625d6c357253e43cc8beda7ad77d5b

### Current read-only binding

- Material：VERIFIED
- Document：VERIFIED
- Chunk：VERIFIED
- Span：VERIFIED
- Index：CURRENT (Qwen/Qwen3-Embedding-0.6B, 1024d)
- Exact source/hash check：text=PASS / hash=PASS
- Gold independence：PASS；runtime sees expected IDs：NO

### Expected source text

```text
# 产品兼容性矩阵

x86_64 + Ubuntu 22.04 + PostgreSQL 14：tested
鲲鹏 920 + 麒麟 V10 + 达梦 8：partially_tested（完成安装和基础交换用例，未完成压力测试）
海光 + 统信 UOS + 人大金仓：not_verified
国产数据库组合：unknown
```

### Gold readiness：GOLD_READY_FOR_RETRIEVAL

- Group：READY
- Reasons：persisted_span_exact_hash_and_current_index_verified
- Semantic notes：legacy_expected_chunk_was_metadata; target_scope_differs_from_formal_requirement

### Execution / safety

- Retrieval：NOT_EXECUTED（本轮禁止 Embedding/模型调用）
- Evidence Fact：NOT_CREATED
- Formal Mapping：NOT_CREATED
- Claim Gate：NOT_CREATED
- DB write：NO

---

## V2R-005-ISO-DIRECT / EVAL-RET-005

- Requirement：企业应提供当前有效的 ISO/IEC 27001 认证信息。
- Requirement provenance：FROZEN_EVAL_QUERY
- Formal Requirement ID：NONE（独立评测身份）
- Intent：qualification_validity
- Allowed scope：ENTERPRISE_PROJECT_SCOPE / project=ac1a1037-5e62-44ee-8c28-7b09d48d93e6
- Expected Material：57b9e5fe-9549-42aa-88d5-fccc5c0afe2e
- Expected Document：57b9e5fe-9549-42aa-88d5-fccc5c0afe2e
- Expected Chunk：MCH-0820CC5A439CB986C62E46213029CC71
- Expected Span：ESPAN-9ABC2E493608BCA753CEF663057CD6DE
- Expected source hash：6bbf2de2c97df192f2c009aa1a730a10c49879d1f07b7c7cb4a7f1e950152684

### Current read-only binding

- Material：VERIFIED
- Document：VERIFIED
- Chunk：VERIFIED
- Span：VERIFIED
- Index：CURRENT (Qwen/Qwen3-Embedding-0.6B, 1024d)
- Exact source/hash check：text=PASS / hash=PASS
- Gold independence：PASS；runtime sees expected IDs：NO

### Expected source text

```text
# ISO 27001 受控记录

名称：ISO/IEC 27001
编号：CM-Q-27001-2024
状态：active
有效至：2027-11-30
```

### Gold readiness：GOLD_READY_FOR_RETRIEVAL

- Group：READY
- Reasons：persisted_span_exact_hash_and_current_index_verified
- Semantic notes：legacy_expected_chunk_was_title_only

### Execution / safety

- Retrieval：NOT_EXECUTED（本轮禁止 Embedding/模型调用）
- Evidence Fact：NOT_CREATED
- Formal Mapping：NOT_CREATED
- Claim Gate：NOT_CREATED
- DB write：NO

---

## V2R-006-ISO-SCOPE / EVAL-RET-006

- Requirement：企业应提供指定项目主体的 ISO/IEC 27001 证书。
- Requirement provenance：FROZEN_EVAL_QUERY
- Formal Requirement ID：NONE（独立评测身份）
- Intent：qualification_validity
- Allowed scope：ENTERPRISE_PROJECT_SCOPE / project=ac1a1037-5e62-44ee-8c28-7b09d48d93e6
- Expected Material：57b9e5fe-9549-42aa-88d5-fccc5c0afe2e
- Expected Document：57b9e5fe-9549-42aa-88d5-fccc5c0afe2e
- Expected Chunk：MCH-0820CC5A439CB986C62E46213029CC71
- Expected Span：ESPAN-9ABC2E493608BCA753CEF663057CD6DE
- Expected source hash：6bbf2de2c97df192f2c009aa1a730a10c49879d1f07b7c7cb4a7f1e950152684

### Current read-only binding

- Material：VERIFIED
- Document：VERIFIED
- Chunk：VERIFIED
- Span：VERIFIED
- Index：CURRENT (Qwen/Qwen3-Embedding-0.6B, 1024d)
- Exact source/hash check：text=PASS / hash=PASS
- Gold independence：PASS；runtime sees expected IDs：NO

### Expected source text

```text
# ISO 27001 受控记录

名称：ISO/IEC 27001
编号：CM-Q-27001-2024
状态：active
有效至：2027-11-30
```

### Gold readiness：GOLD_READY_FOR_RETRIEVAL

- Group：READY
- Reasons：persisted_span_exact_hash_and_current_index_verified
- Semantic notes：legacy_expected_chunk_was_title_only; subject_scope_not_verified

### Execution / safety

- Retrieval：NOT_EXECUTED（本轮禁止 Embedding/模型调用）
- Evidence Fact：NOT_CREATED
- Formal Mapping：NOT_CREATED
- Claim Gate：NOT_CREATED
- DB write：NO

---

## V2R-007-PROJECT-STATUS / EVAL-RET-007

- Requirement：企业应提供已完成并可验收的同类项目记录。
- Requirement provenance：FROZEN_EVAL_QUERY
- Formal Requirement ID：NONE（独立评测身份）
- Intent：project_implementation_status
- Allowed scope：ENTERPRISE_PROJECT_SCOPE / project=ac1a1037-5e62-44ee-8c28-7b09d48d93e6
- Expected Material：75924286-5882-4658-bff9-ed587f70b927
- Expected Document：75924286-5882-4658-bff9-ed587f70b927
- Expected Chunk：MCH-C5D5EB33CB97F715074CC6F4E98EEF17
- Expected Span：ESPAN-06CAB70C047B196B20B49523A71D7661
- Expected source hash：6ed02e81de495a410e8a220b74f07851df39a8b72bec308e69ab83878a31b31f

### Current read-only binding

- Material：VERIFIED
- Document：VERIFIED
- Chunk：VERIFIED
- Span：VERIFIED
- Index：CURRENT (Qwen/Qwen3-Embedding-0.6B, 1024d)
- Exact source/hash check：text=PASS / hash=PASS
- Gold independence：PASS；runtime sees expected IDs：NO

### Expected source text

```text
# 项目D实施片段

项目：南泽业务协同升级片段（虚构）
客户：南泽公共服务机构（虚构）
实施片段日期：2025-10-09
状态不完整，不得推断完工或验收。
```

### Gold readiness：GOLD_READY_FOR_RETRIEVAL

- Group：READY
- Reasons：persisted_span_exact_hash_and_current_index_verified
- Semantic notes：legacy_expected_chunk_was_title_only; source_explicitly_says_status_incomplete

### Execution / safety

- Retrieval：NOT_EXECUTED（本轮禁止 Embedding/模型调用）
- Evidence Fact：NOT_CREATED
- Formal Mapping：NOT_CREATED
- Claim Gate：NOT_CREATED
- DB write：NO

---

## V2R-010-CORPUS-01 / EVAL-RET-008

- Requirement：企业应证明自身具备与该公开行业规范相符的实施能力。
- Requirement provenance：FROZEN_EVAL_QUERY
- Formal Requirement ID：NONE（独立评测身份）
- Intent：enterprise_capability_boundary
- Allowed scope：PUBLIC_OR_INDUSTRY_REFERENCE / project=00000000-0000-4000-8000-000000000001
- Expected Material：e9bcafcd-c615-4f6d-b34e-9d1ffcdfef1c
- Expected Document：e9bcafcd-c615-4f6d-b34e-9d1ffcdfef1c
- Expected Chunk：MCH-B349280E685FEB7ECD6B73AFFCF32228
- Expected Span：TRANSIENT / NOT_PERSISTED
- Expected source hash：e7e05bc5785225ee9dc46d8012989147918561ac3963c792815c01b333071fbb

### Current read-only binding

- Material：VERIFIED
- Document：VERIFIED
- Chunk：VERIFIED
- Span：UNVERIFIED
- Index：CURRENT (Qwen/Qwen3-Embedding-0.6B, 1024d)
- Exact source/hash check：text=PASS / hash=PASS
- Gold independence：PASS；runtime sees expected IDs：NO

### Expected source text

```text
# 中华人民共和国政府信息公开条例
```

### Gold readiness：GOLD_PARTIAL

- Group：REPAIRABLE
- Reasons：exact_source_chunk_resolved_deterministically; source_span_or_eval_manifest_binding_not_persisted
- Semantic notes：expected_chunk_is_title_only; industry_reference_does_not_prove_enterprise_capability

### Execution / safety

- Retrieval：NOT_EXECUTED（本轮禁止 Embedding/模型调用）
- Evidence Fact：NOT_CREATED
- Formal Mapping：NOT_CREATED
- Claim Gate：NOT_CREATED
- DB write：NO

---

## V2R-015-CORPUS-06 / EVAL-RET-009

- Requirement：企业应证明自身具备与该公开行业规范相符的实施能力。
- Requirement provenance：FROZEN_EVAL_QUERY
- Formal Requirement ID：NONE（独立评测身份）
- Intent：enterprise_capability_boundary
- Allowed scope：PUBLIC_OR_INDUSTRY_REFERENCE / project=00000000-0000-4000-8000-000000000001
- Expected Material：eef2ae66-8259-4954-9a88-2e184411fcc5
- Expected Document：eef2ae66-8259-4954-9a88-2e184411fcc5
- Expected Chunk：MCH-F4CD0E67DBD66EC447EF06D0EDBB083A
- Expected Span：TRANSIENT / NOT_PERSISTED
- Expected source hash：b27d1bdb75e04a5ce81a501d6213b0fdf98fdb27c082289a8e1c16401ca175b1

### Current read-only binding

- Material：VERIFIED
- Document：VERIFIED
- Chunk：VERIFIED
- Span：UNVERIFIED
- Index：CURRENT (Qwen/Qwen3-Embedding-0.6B, 1024d)
- Exact source/hash check：text=PASS / hash=PASS
- Gold independence：PASS；runtime sees expected IDs：NO

### Expected source text

```text
来源机构：国务院办公厅
文号：国办函〔2016〕108号
```

### Gold readiness：GOLD_PARTIAL

- Group：REPAIRABLE
- Reasons：exact_source_chunk_resolved_deterministically; source_span_or_eval_manifest_binding_not_persisted
- Semantic notes：expected_chunk_is_metadata; negative_control_is_reference_only

### Execution / safety

- Retrieval：NOT_EXECUTED（本轮禁止 Embedding/模型调用）
- Evidence Fact：NOT_CREATED
- Formal Mapping：NOT_CREATED
- Claim Gate：NOT_CREATED
- DB write：NO

---

## V2R-021-CORPUS-12 / EVAL-RET-010

- Requirement：企业应提供与本项目范围相关的可核验材料。
- Requirement provenance：FROZEN_EVAL_QUERY
- Formal Requirement ID：NONE（独立评测身份）
- Intent：enterprise_capability_boundary
- Allowed scope：ENTERPRISE_PROJECT_SCOPE / project=518c6772-b200-4b7b-9d45-059297714516
- Expected Material：9876da6b-40c1-4f2d-b47b-290c7c150f4e
- Expected Document：9876da6b-40c1-4f2d-b47b-290c7c150f4e
- Expected Chunk：MCH-A4211A94C5C7A077F478D979A3ADF86E
- Expected Span：TRANSIENT / NOT_PERSISTED
- Expected source hash：33d664614db3cd87de0f1c1c95b33111a5999792791f3938fb4650fbdd20df05

### Current read-only binding

- Material：VERIFIED
- Document：VERIFIED
- Chunk：VERIFIED
- Span：UNVERIFIED
- Index：MISSING
- Exact source/hash check：text=PASS / hash=PASS
- Gold independence：PASS；runtime sees expected IDs：NO

### Expected source text

```text
平台可集成某开源数据库和消息组件；部署、许可和技术支持依赖第三方，企业不将第三方能力表述为自有产品能力。
```

### Gold readiness：GOLD_PARTIAL

- Group：REPAIRABLE
- Reasons：exact_source_chunk_resolved_deterministically; source_span_or_eval_manifest_binding_not_persisted; current_embedding_index_missing
- Semantic notes：source_span_not_persisted_for_project; third_party_boundary_is_not_generic_project_proof

### Execution / safety

- Retrieval：NOT_EXECUTED（本轮禁止 Embedding/模型调用）
- Evidence Fact：NOT_CREATED
- Formal Mapping：NOT_CREATED
- Claim Gate：NOT_CREATED
- DB write：NO

---

## V2R-024-CORPUS-15 / EVAL-RET-011

- Requirement：企业应提供同类项目的实施及验收依据。
- Requirement provenance：FROZEN_EVAL_QUERY
- Formal Requirement ID：NONE（独立评测身份）
- Intent：enterprise_capability_boundary
- Allowed scope：ENTERPRISE_PROJECT_SCOPE / project=518c6772-b200-4b7b-9d45-059297714516
- Expected Material：50467edc-0a5e-458f-ba69-1bbf488a115a
- Expected Document：50467edc-0a5e-458f-ba69-1bbf488a115a
- Expected Chunk：MCH-3FD884E9C86C84ADD445F70EC81FADD9
- Expected Span：TRANSIENT / NOT_PERSISTED
- Expected source hash：f4f7b9db71c7a29583a29ba9b9bf499740066997570b2ec02e80c41b516e9719

### Current read-only binding

- Material：VERIFIED
- Document：VERIFIED
- Chunk：VERIFIED
- Span：UNVERIFIED
- Index：MISSING
- Exact source/hash check：text=PASS / hash=PASS
- Gold independence：PASS；runtime sees expected IDs：NO

### Expected source text

```text
项目：景云城市治理数据平台；范围：数据目录、交换任务、统一门户和运行监测；项目状态：已完成模拟案例；验收日期：2025-11-20。
```

### Gold readiness：GOLD_PARTIAL

- Group：REPAIRABLE
- Reasons：exact_source_chunk_resolved_deterministically; source_span_or_eval_manifest_binding_not_persisted; current_embedding_index_missing
- Semantic notes：source_span_not_persisted_for_project

### Execution / safety

- Retrieval：NOT_EXECUTED（本轮禁止 Embedding/模型调用）
- Evidence Fact：NOT_CREATED
- Formal Mapping：NOT_CREATED
- Claim Gate：NOT_CREATED
- DB write：NO

---

## V2R-030-CORPUS-21 / EVAL-RET-012

- Requirement：企业应提供同类项目的实施及验收依据。
- Requirement provenance：FROZEN_EVAL_QUERY
- Formal Requirement ID：NONE（独立评测身份）
- Intent：enterprise_capability_boundary
- Allowed scope：ENTERPRISE_PROJECT_SCOPE / project=518c6772-b200-4b7b-9d45-059297714516
- Expected Material：50467edc-0a5e-458f-ba69-1bbf488a115a
- Expected Document：50467edc-0a5e-458f-ba69-1bbf488a115a
- Expected Chunk：MCH-3FD884E9C86C84ADD445F70EC81FADD9
- Expected Span：TRANSIENT / NOT_PERSISTED
- Expected source hash：f4f7b9db71c7a29583a29ba9b9bf499740066997570b2ec02e80c41b516e9719

### Current read-only binding

- Material：VERIFIED
- Document：VERIFIED
- Chunk：VERIFIED
- Span：UNVERIFIED
- Index：MISSING
- Exact source/hash check：text=PASS / hash=PASS
- Gold independence：PASS；runtime sees expected IDs：NO

### Expected source text

```text
项目：景云城市治理数据平台；范围：数据目录、交换任务、统一门户和运行监测；项目状态：已完成模拟案例；验收日期：2025-11-20。
```

### Gold readiness：GOLD_PARTIAL

- Group：REPAIRABLE
- Reasons：exact_source_chunk_resolved_deterministically; source_span_or_eval_manifest_binding_not_persisted; current_embedding_index_missing
- Semantic notes：source_span_not_persisted_for_project

### Execution / safety

- Retrieval：NOT_EXECUTED（本轮禁止 Embedding/模型调用）
- Evidence Fact：NOT_CREATED
- Formal Mapping：NOT_CREATED
- Claim Gate：NOT_CREATED
- DB write：NO

---

## Safety boundary

- Evidence Fact：NOT_CREATED
- Requirement-Evidence Mapping：NOT_CREATED
- Claim Gate state：NOT_CREATED
- DB writes：0
- External calls：0