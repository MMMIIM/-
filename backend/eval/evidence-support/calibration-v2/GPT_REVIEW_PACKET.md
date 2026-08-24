# GPT REVIEW PACKET — Targeted Evidence-Bearing Retrieval

- Schema: 4.3-gpt-review-packet-v1
- Case count: 12
- CASE_LEVEL_RESULTS_COMPLETE: YES
- RAW_SOURCE_INCLUDED: YES
- GPT_REVIEW_STATUS: PENDING_REVIEW
- EVAL_COMPLETE: NO
- Execution: all 12 Gold mappings were invalid; no live Retrieval request was sent.

## Aggregate output (derived from case-level records)

```json
{
  "hit_at_1": "NOT_EXECUTED",
  "hit_at_3": "NOT_EXECUTED",
  "hit_at_5": "NOT_EXECUTED",
  "material_hit_at_5": "NOT_EXECUTED",
  "document_hit_at_5": "NOT_EXECUTED",
  "expected_chunk_hit_at_5": "NOT_EXECUTED",
  "qualified_span_rate": "NOT_EXECUTED",
  "metadata_header_false_evidence_rate": "NOT_EXECUTED",
  "topic_relevant_false_evidence_rate": "NOT_EXECUTED",
  "proof_routing_precision": "NOT_EXECUTED",
  "miss_forensics": {
    "GOLD_INVALID": 12
  }
}
```

## Failure index

- V2R-001-PERF-DIRECT: BLOCKED / GOLD_INVALID
- V2R-002-PERF-PARTIAL: BLOCKED / GOLD_INVALID
- V2R-003-COMP-DIRECT: BLOCKED / GOLD_INVALID
- V2R-004-COMP-PARTIAL: BLOCKED / GOLD_INVALID
- V2R-005-ISO-DIRECT: BLOCKED / GOLD_INVALID
- V2R-006-ISO-SCOPE: BLOCKED / GOLD_INVALID
- V2R-007-PROJECT-STATUS: BLOCKED / GOLD_INVALID
- V2R-010-CORPUS-01: BLOCKED / GOLD_INVALID
- V2R-015-CORPUS-06: BLOCKED / GOLD_INVALID
- V2R-021-CORPUS-12: BLOCKED / GOLD_INVALID
- V2R-024-CORPUS-15: BLOCKED / GOLD_INVALID
- V2R-030-CORPUS-21: BLOCKED / GOLD_INVALID

## Complete case-level results

## V2R-001-PERF-DIRECT

- Requirement ID: NOT_PERSISTED
- Requirement original text: 企业应提供可核验的数据交换平台性能测试记录。
- Retrieval intent: quantitative_performance
- Allowed evidence scope: ENTERPRISE_PROJECT_SCOPE / project=ac1a1037-5e62-44ee-8c28-7b09d48d93e6
- Expected Material: 3c81671f-376e-401b-8525-be26929d5b92
- Expected Document: 3c81671f-376e-401b-8525-be26929d5b92
- Expected Chunk: MCH-0FBD3599DAF932016F62EB9634B997AF
- Gold status: GOLD_INVALID_REQUIREMENT_NOT_IN_FORMAL_DB
- Invalid reasons: target_requirement_id_not_persisted; legacy_expected_chunk_was_metadata

### Verified Evidence Span

- Span: ESPAN-7C976B914F1C677C5D80017CCD2C307B
- Hash: b5522622368a1f3144b6ae8ea08d106cec5174b7d36221525e0b7cb0bcdc5934
- Anchor chunk: MCH-0FBD3599DAF932016F62EB9634B997AF
- Source chunks: MCH-B4FF02295DBB6DCDF6E2763F057076F6, MCH-0FBD3599DAF932016F62EB9634B997AF

```text
# 数据交换平台性能测试记录

产品：澄明数据交换平台 V3.2
环境：8 vCPU、32 GB 内存、PostgreSQL 14、千兆局域网
条件：50 并发、100 万条基准数据、缓存预热后执行 30 分钟
指标：数据目录查询平均响应时间
结果：平均 1.4 秒，P95 1.9 秒。
日期：2025-05-16。
```


### Actual TopK

- None — `NOT_EXECUTED` because Gold mapping is invalid.

- Evidence-Bearing Hit: NOT_EXECUTED
- Expected Evidence Rank: NOT_EXECUTED
- Qualified Span: NOT_EXECUTED
- Metadata false positive: NOT_EXECUTED
- Topic-only false positive: NOT_EXECUTED
- Source routing result: NOT_EXECUTED

### Mapping / downstream safety

- Requirement ID: NOT_PERSISTED
- Evidence Fact ID: NOT_CREATED
- Original Evidence Span: ESPAN-7C976B914F1C677C5D80017CCD2C307B
- Mapping relationship: NOT_EXECUTED
- Human approval: NOT_REACHED
- Claim Gate consequence: NOT_REACHED

### Final: BLOCKED / FAIL

- Failure layer: GOLD_INVALID
- Root cause: Targeted Gold is not executable: target_requirement_id_not_persisted; legacy_expected_chunk_was_metadata

---

## V2R-002-PERF-PARTIAL

- Requirement ID: NOT_PERSISTED
- Requirement original text: 企业应证明接口 P95 响应时间不超过 1 秒。
- Retrieval intent: quantitative_performance
- Allowed evidence scope: ENTERPRISE_PROJECT_SCOPE / project=ac1a1037-5e62-44ee-8c28-7b09d48d93e6
- Expected Material: 3c81671f-376e-401b-8525-be26929d5b92
- Expected Document: 3c81671f-376e-401b-8525-be26929d5b92
- Expected Chunk: MCH-0FBD3599DAF932016F62EB9634B997AF
- Gold status: GOLD_INVALID_REQUIREMENT_NOT_IN_FORMAL_DB
- Invalid reasons: target_requirement_id_not_persisted; legacy_expected_chunk_was_metadata; target_threshold_differs_from_formal_requirement

### Verified Evidence Span

- Span: ESPAN-7C976B914F1C677C5D80017CCD2C307B
- Hash: b5522622368a1f3144b6ae8ea08d106cec5174b7d36221525e0b7cb0bcdc5934
- Anchor chunk: MCH-0FBD3599DAF932016F62EB9634B997AF
- Source chunks: MCH-B4FF02295DBB6DCDF6E2763F057076F6, MCH-0FBD3599DAF932016F62EB9634B997AF

```text
# 数据交换平台性能测试记录

产品：澄明数据交换平台 V3.2
环境：8 vCPU、32 GB 内存、PostgreSQL 14、千兆局域网
条件：50 并发、100 万条基准数据、缓存预热后执行 30 分钟
指标：数据目录查询平均响应时间
结果：平均 1.4 秒，P95 1.9 秒。
日期：2025-05-16。
```


### Actual TopK

- None — `NOT_EXECUTED` because Gold mapping is invalid.

- Evidence-Bearing Hit: NOT_EXECUTED
- Expected Evidence Rank: NOT_EXECUTED
- Qualified Span: NOT_EXECUTED
- Metadata false positive: NOT_EXECUTED
- Topic-only false positive: NOT_EXECUTED
- Source routing result: NOT_EXECUTED

### Mapping / downstream safety

- Requirement ID: NOT_PERSISTED
- Evidence Fact ID: NOT_CREATED
- Original Evidence Span: ESPAN-7C976B914F1C677C5D80017CCD2C307B
- Mapping relationship: NOT_EXECUTED
- Human approval: NOT_REACHED
- Claim Gate consequence: NOT_REACHED

### Final: BLOCKED / FAIL

- Failure layer: GOLD_INVALID
- Root cause: Targeted Gold is not executable: target_requirement_id_not_persisted; legacy_expected_chunk_was_metadata; target_threshold_differs_from_formal_requirement

---

## V2R-003-COMP-DIRECT

- Requirement ID: NOT_PERSISTED
- Requirement original text: 企业应说明产品在 x86_64、Ubuntu 和 PostgreSQL 环境的兼容性。
- Retrieval intent: platform_compatibility
- Allowed evidence scope: ENTERPRISE_PROJECT_SCOPE / project=ac1a1037-5e62-44ee-8c28-7b09d48d93e6
- Expected Material: 3f9dacfb-2e48-4796-a477-98c60b506831
- Expected Document: 3f9dacfb-2e48-4796-a477-98c60b506831
- Expected Chunk: MCH-7F11A857F9B5A05D9B22E30CD4F1BEE0
- Gold status: GOLD_INVALID_REQUIREMENT_NOT_IN_FORMAL_DB
- Invalid reasons: target_requirement_id_not_persisted; legacy_expected_chunk_was_metadata

### Verified Evidence Span

- Span: ESPAN-DB796CE9A6685C040977607A8228D832
- Hash: bb48093928c5a0df95f9c5d308dbff9edc625d6c357253e43cc8beda7ad77d5b
- Anchor chunk: MCH-7F11A857F9B5A05D9B22E30CD4F1BEE0
- Source chunks: MCH-57FE3B83C106C09B70C731182F48FFA4, MCH-7F11A857F9B5A05D9B22E30CD4F1BEE0

```text
# 产品兼容性矩阵

x86_64 + Ubuntu 22.04 + PostgreSQL 14：tested
鲲鹏 920 + 麒麟 V10 + 达梦 8：partially_tested（完成安装和基础交换用例，未完成压力测试）
海光 + 统信 UOS + 人大金仓：not_verified
国产数据库组合：unknown
```


### Actual TopK

- None — `NOT_EXECUTED` because Gold mapping is invalid.

- Evidence-Bearing Hit: NOT_EXECUTED
- Expected Evidence Rank: NOT_EXECUTED
- Qualified Span: NOT_EXECUTED
- Metadata false positive: NOT_EXECUTED
- Topic-only false positive: NOT_EXECUTED
- Source routing result: NOT_EXECUTED

### Mapping / downstream safety

- Requirement ID: NOT_PERSISTED
- Evidence Fact ID: NOT_CREATED
- Original Evidence Span: ESPAN-DB796CE9A6685C040977607A8228D832
- Mapping relationship: NOT_EXECUTED
- Human approval: NOT_REACHED
- Claim Gate consequence: NOT_REACHED

### Final: BLOCKED / FAIL

- Failure layer: GOLD_INVALID
- Root cause: Targeted Gold is not executable: target_requirement_id_not_persisted; legacy_expected_chunk_was_metadata

---

## V2R-004-COMP-PARTIAL

- Requirement ID: NOT_PERSISTED
- Requirement original text: 企业应证明所有国产数据库组合均已完成压力测试。
- Retrieval intent: platform_compatibility
- Allowed evidence scope: ENTERPRISE_PROJECT_SCOPE / project=ac1a1037-5e62-44ee-8c28-7b09d48d93e6
- Expected Material: 3f9dacfb-2e48-4796-a477-98c60b506831
- Expected Document: 3f9dacfb-2e48-4796-a477-98c60b506831
- Expected Chunk: MCH-7F11A857F9B5A05D9B22E30CD4F1BEE0
- Gold status: GOLD_INVALID_REQUIREMENT_NOT_IN_FORMAL_DB
- Invalid reasons: target_requirement_id_not_persisted; legacy_expected_chunk_was_metadata; target_scope_differs_from_formal_requirement

### Verified Evidence Span

- Span: ESPAN-DB796CE9A6685C040977607A8228D832
- Hash: bb48093928c5a0df95f9c5d308dbff9edc625d6c357253e43cc8beda7ad77d5b
- Anchor chunk: MCH-7F11A857F9B5A05D9B22E30CD4F1BEE0
- Source chunks: MCH-57FE3B83C106C09B70C731182F48FFA4, MCH-7F11A857F9B5A05D9B22E30CD4F1BEE0

```text
# 产品兼容性矩阵

x86_64 + Ubuntu 22.04 + PostgreSQL 14：tested
鲲鹏 920 + 麒麟 V10 + 达梦 8：partially_tested（完成安装和基础交换用例，未完成压力测试）
海光 + 统信 UOS + 人大金仓：not_verified
国产数据库组合：unknown
```


### Actual TopK

- None — `NOT_EXECUTED` because Gold mapping is invalid.

- Evidence-Bearing Hit: NOT_EXECUTED
- Expected Evidence Rank: NOT_EXECUTED
- Qualified Span: NOT_EXECUTED
- Metadata false positive: NOT_EXECUTED
- Topic-only false positive: NOT_EXECUTED
- Source routing result: NOT_EXECUTED

### Mapping / downstream safety

- Requirement ID: NOT_PERSISTED
- Evidence Fact ID: NOT_CREATED
- Original Evidence Span: ESPAN-DB796CE9A6685C040977607A8228D832
- Mapping relationship: NOT_EXECUTED
- Human approval: NOT_REACHED
- Claim Gate consequence: NOT_REACHED

### Final: BLOCKED / FAIL

- Failure layer: GOLD_INVALID
- Root cause: Targeted Gold is not executable: target_requirement_id_not_persisted; legacy_expected_chunk_was_metadata; target_scope_differs_from_formal_requirement

---

## V2R-005-ISO-DIRECT

- Requirement ID: NOT_PERSISTED
- Requirement original text: 企业应提供当前有效的 ISO/IEC 27001 认证信息。
- Retrieval intent: qualification_validity
- Allowed evidence scope: ENTERPRISE_PROJECT_SCOPE / project=ac1a1037-5e62-44ee-8c28-7b09d48d93e6
- Expected Material: 57b9e5fe-9549-42aa-88d5-fccc5c0afe2e
- Expected Document: 57b9e5fe-9549-42aa-88d5-fccc5c0afe2e
- Expected Chunk: MCH-0820CC5A439CB986C62E46213029CC71
- Gold status: GOLD_INVALID_REQUIREMENT_NOT_IN_FORMAL_DB
- Invalid reasons: target_requirement_id_not_persisted; legacy_expected_chunk_was_title_only

### Verified Evidence Span

- Span: ESPAN-9ABC2E493608BCA753CEF663057CD6DE
- Hash: 6bbf2de2c97df192f2c009aa1a730a10c49879d1f07b7c7cb4a7f1e950152684
- Anchor chunk: MCH-0820CC5A439CB986C62E46213029CC71
- Source chunks: MCH-0820CC5A439CB986C62E46213029CC71, MCH-A4C2632EF9126FADD349C3004E1C2D84

```text
# ISO 27001 受控记录

名称：ISO/IEC 27001
编号：CM-Q-27001-2024
状态：active
有效至：2027-11-30
```


### Actual TopK

- None — `NOT_EXECUTED` because Gold mapping is invalid.

- Evidence-Bearing Hit: NOT_EXECUTED
- Expected Evidence Rank: NOT_EXECUTED
- Qualified Span: NOT_EXECUTED
- Metadata false positive: NOT_EXECUTED
- Topic-only false positive: NOT_EXECUTED
- Source routing result: NOT_EXECUTED

### Mapping / downstream safety

- Requirement ID: NOT_PERSISTED
- Evidence Fact ID: NOT_CREATED
- Original Evidence Span: ESPAN-9ABC2E493608BCA753CEF663057CD6DE
- Mapping relationship: NOT_EXECUTED
- Human approval: NOT_REACHED
- Claim Gate consequence: NOT_REACHED

### Final: BLOCKED / FAIL

- Failure layer: GOLD_INVALID
- Root cause: Targeted Gold is not executable: target_requirement_id_not_persisted; legacy_expected_chunk_was_title_only

---

## V2R-006-ISO-SCOPE

- Requirement ID: NOT_PERSISTED
- Requirement original text: 企业应提供指定项目主体的 ISO/IEC 27001 证书。
- Retrieval intent: qualification_validity
- Allowed evidence scope: ENTERPRISE_PROJECT_SCOPE / project=ac1a1037-5e62-44ee-8c28-7b09d48d93e6
- Expected Material: 57b9e5fe-9549-42aa-88d5-fccc5c0afe2e
- Expected Document: 57b9e5fe-9549-42aa-88d5-fccc5c0afe2e
- Expected Chunk: MCH-0820CC5A439CB986C62E46213029CC71
- Gold status: GOLD_INVALID_REQUIREMENT_NOT_IN_FORMAL_DB
- Invalid reasons: target_requirement_id_not_persisted; legacy_expected_chunk_was_title_only; subject_scope_not_verified

### Verified Evidence Span

- Span: ESPAN-9ABC2E493608BCA753CEF663057CD6DE
- Hash: 6bbf2de2c97df192f2c009aa1a730a10c49879d1f07b7c7cb4a7f1e950152684
- Anchor chunk: MCH-0820CC5A439CB986C62E46213029CC71
- Source chunks: MCH-0820CC5A439CB986C62E46213029CC71, MCH-A4C2632EF9126FADD349C3004E1C2D84

```text
# ISO 27001 受控记录

名称：ISO/IEC 27001
编号：CM-Q-27001-2024
状态：active
有效至：2027-11-30
```


### Actual TopK

- None — `NOT_EXECUTED` because Gold mapping is invalid.

- Evidence-Bearing Hit: NOT_EXECUTED
- Expected Evidence Rank: NOT_EXECUTED
- Qualified Span: NOT_EXECUTED
- Metadata false positive: NOT_EXECUTED
- Topic-only false positive: NOT_EXECUTED
- Source routing result: NOT_EXECUTED

### Mapping / downstream safety

- Requirement ID: NOT_PERSISTED
- Evidence Fact ID: NOT_CREATED
- Original Evidence Span: ESPAN-9ABC2E493608BCA753CEF663057CD6DE
- Mapping relationship: NOT_EXECUTED
- Human approval: NOT_REACHED
- Claim Gate consequence: NOT_REACHED

### Final: BLOCKED / FAIL

- Failure layer: GOLD_INVALID
- Root cause: Targeted Gold is not executable: target_requirement_id_not_persisted; legacy_expected_chunk_was_title_only; subject_scope_not_verified

---

## V2R-007-PROJECT-STATUS

- Requirement ID: NOT_PERSISTED
- Requirement original text: 企业应提供已完成并可验收的同类项目记录。
- Retrieval intent: project_implementation_status
- Allowed evidence scope: ENTERPRISE_PROJECT_SCOPE / project=ac1a1037-5e62-44ee-8c28-7b09d48d93e6
- Expected Material: 75924286-5882-4658-bff9-ed587f70b927
- Expected Document: 75924286-5882-4658-bff9-ed587f70b927
- Expected Chunk: MCH-C5D5EB33CB97F715074CC6F4E98EEF17
- Gold status: GOLD_INVALID_REQUIREMENT_NOT_IN_FORMAL_DB
- Invalid reasons: target_requirement_id_not_persisted; legacy_expected_chunk_was_title_only; source_explicitly_says_status_incomplete

### Verified Evidence Span

- Span: ESPAN-06CAB70C047B196B20B49523A71D7661
- Hash: 6ed02e81de495a410e8a220b74f07851df39a8b72bec308e69ab83878a31b31f
- Anchor chunk: MCH-C5D5EB33CB97F715074CC6F4E98EEF17
- Source chunks: MCH-3D0A254CE926B207AFC696BF46520897, MCH-C5D5EB33CB97F715074CC6F4E98EEF17

```text
# 项目D实施片段

项目：南泽业务协同升级片段（虚构）
客户：南泽公共服务机构（虚构）
实施片段日期：2025-10-09
状态不完整，不得推断完工或验收。
```


### Actual TopK

- None — `NOT_EXECUTED` because Gold mapping is invalid.

- Evidence-Bearing Hit: NOT_EXECUTED
- Expected Evidence Rank: NOT_EXECUTED
- Qualified Span: NOT_EXECUTED
- Metadata false positive: NOT_EXECUTED
- Topic-only false positive: NOT_EXECUTED
- Source routing result: NOT_EXECUTED

### Mapping / downstream safety

- Requirement ID: NOT_PERSISTED
- Evidence Fact ID: NOT_CREATED
- Original Evidence Span: ESPAN-06CAB70C047B196B20B49523A71D7661
- Mapping relationship: NOT_EXECUTED
- Human approval: NOT_REACHED
- Claim Gate consequence: NOT_REACHED

### Final: BLOCKED / FAIL

- Failure layer: GOLD_INVALID
- Root cause: Targeted Gold is not executable: target_requirement_id_not_persisted; legacy_expected_chunk_was_title_only; source_explicitly_says_status_incomplete

---

## V2R-010-CORPUS-01

- Requirement ID: NOT_PERSISTED
- Requirement original text: 企业应证明自身具备与该公开行业规范相符的实施能力。
- Retrieval intent: enterprise_capability_boundary
- Allowed evidence scope: PUBLIC_OR_INDUSTRY_REFERENCE / project=00000000-0000-4000-8000-000000000001
- Expected Material: e9bcafcd-c615-4f6d-b34e-9d1ffcdfef1c
- Expected Document: e9bcafcd-c615-4f6d-b34e-9d1ffcdfef1c
- Expected Chunk: MCH-B349280E685FEB7ECD6B73AFFCF32228
- Gold status: GOLD_INVALID_REFERENCE_METADATA
- Invalid reasons: target_requirement_id_not_persisted; expected_chunk_is_title_only; industry_reference_does_not_prove_enterprise_capability

### Verified Evidence Span

- None persisted.


### Expected chunk source snapshot (not automatically verified)

- Chunk: MCH-B349280E685FEB7ECD6B73AFFCF32228
- Hash: e7e05bc5785225ee9dc46d8012989147918561ac3963c792815c01b333071fbb
- Provenance: TRANSIENT_OR_UNPERSISTED_REFERENCE

```text
# 中华人民共和国政府信息公开条例
```

### Actual TopK

- None — `NOT_EXECUTED` because Gold mapping is invalid.

- Evidence-Bearing Hit: NOT_EXECUTED
- Expected Evidence Rank: NOT_EXECUTED
- Qualified Span: NOT_EXECUTED
- Metadata false positive: NOT_EXECUTED
- Topic-only false positive: NOT_EXECUTED
- Source routing result: NOT_EXECUTED

### Mapping / downstream safety

- Requirement ID: NOT_PERSISTED
- Evidence Fact ID: NOT_CREATED
- Original Evidence Span: NONE
- Mapping relationship: NOT_EXECUTED
- Human approval: NOT_REACHED
- Claim Gate consequence: NOT_REACHED

### Final: BLOCKED / FAIL

- Failure layer: GOLD_INVALID
- Root cause: Targeted Gold is not executable: target_requirement_id_not_persisted; expected_chunk_is_title_only; industry_reference_does_not_prove_enterprise_capability

---

## V2R-015-CORPUS-06

- Requirement ID: NOT_PERSISTED
- Requirement original text: 企业应证明自身具备与该公开行业规范相符的实施能力。
- Retrieval intent: enterprise_capability_boundary
- Allowed evidence scope: PUBLIC_OR_INDUSTRY_REFERENCE / project=00000000-0000-4000-8000-000000000001
- Expected Material: eef2ae66-8259-4954-9a88-2e184411fcc5
- Expected Document: eef2ae66-8259-4954-9a88-2e184411fcc5
- Expected Chunk: MCH-F4CD0E67DBD66EC447EF06D0EDBB083A
- Gold status: GOLD_INVALID_REFERENCE_METADATA
- Invalid reasons: target_requirement_id_not_persisted; expected_chunk_is_metadata; negative_control_is_reference_only

### Verified Evidence Span

- None persisted.


### Expected chunk source snapshot (not automatically verified)

- Chunk: MCH-F4CD0E67DBD66EC447EF06D0EDBB083A
- Hash: b27d1bdb75e04a5ce81a501d6213b0fdf98fdb27c082289a8e1c16401ca175b1
- Provenance: TRANSIENT_OR_UNPERSISTED_REFERENCE

```text
来源机构：国务院办公厅
文号：国办函〔2016〕108号
```

### Actual TopK

- None — `NOT_EXECUTED` because Gold mapping is invalid.

- Evidence-Bearing Hit: NOT_EXECUTED
- Expected Evidence Rank: NOT_EXECUTED
- Qualified Span: NOT_EXECUTED
- Metadata false positive: NOT_EXECUTED
- Topic-only false positive: NOT_EXECUTED
- Source routing result: NOT_EXECUTED

### Mapping / downstream safety

- Requirement ID: NOT_PERSISTED
- Evidence Fact ID: NOT_CREATED
- Original Evidence Span: NONE
- Mapping relationship: NOT_EXECUTED
- Human approval: NOT_REACHED
- Claim Gate consequence: NOT_REACHED

### Final: BLOCKED / FAIL

- Failure layer: GOLD_INVALID
- Root cause: Targeted Gold is not executable: target_requirement_id_not_persisted; expected_chunk_is_metadata; negative_control_is_reference_only

---

## V2R-021-CORPUS-12

- Requirement ID: NOT_PERSISTED
- Requirement original text: 企业应提供与本项目范围相关的可核验材料。
- Retrieval intent: enterprise_capability_boundary
- Allowed evidence scope: ENTERPRISE_PROJECT_SCOPE / project=518c6772-b200-4b7b-9d45-059297714516
- Expected Material: 9876da6b-40c1-4f2d-b47b-290c7c150f4e
- Expected Document: 9876da6b-40c1-4f2d-b47b-290c7c150f4e
- Expected Chunk: MCH-A4211A94C5C7A077F478D979A3ADF86E
- Gold status: GOLD_INVALID_REQUIREMENT_NOT_IN_FORMAL_DB
- Invalid reasons: target_requirement_id_not_persisted; source_span_not_persisted_for_project; third_party_boundary_is_not_generic_project_proof

### Verified Evidence Span

- None persisted.


### Expected chunk source snapshot (not automatically verified)

- Chunk: MCH-A4211A94C5C7A077F478D979A3ADF86E
- Hash: 33d664614db3cd87de0f1c1c95b33111a5999792791f3938fb4650fbdd20df05
- Provenance: TRANSIENT_OR_UNPERSISTED_REFERENCE

```text
平台可集成某开源数据库和消息组件；部署、许可和技术支持依赖第三方，企业不将第三方能力表述为自有产品能力。
```

### Actual TopK

- None — `NOT_EXECUTED` because Gold mapping is invalid.

- Evidence-Bearing Hit: NOT_EXECUTED
- Expected Evidence Rank: NOT_EXECUTED
- Qualified Span: NOT_EXECUTED
- Metadata false positive: NOT_EXECUTED
- Topic-only false positive: NOT_EXECUTED
- Source routing result: NOT_EXECUTED

### Mapping / downstream safety

- Requirement ID: NOT_PERSISTED
- Evidence Fact ID: NOT_CREATED
- Original Evidence Span: NONE
- Mapping relationship: NOT_EXECUTED
- Human approval: NOT_REACHED
- Claim Gate consequence: NOT_REACHED

### Final: BLOCKED / FAIL

- Failure layer: GOLD_INVALID
- Root cause: Targeted Gold is not executable: target_requirement_id_not_persisted; source_span_not_persisted_for_project; third_party_boundary_is_not_generic_project_proof

---

## V2R-024-CORPUS-15

- Requirement ID: NOT_PERSISTED
- Requirement original text: 企业应提供同类项目的实施及验收依据。
- Retrieval intent: enterprise_capability_boundary
- Allowed evidence scope: ENTERPRISE_PROJECT_SCOPE / project=518c6772-b200-4b7b-9d45-059297714516
- Expected Material: 50467edc-0a5e-458f-ba69-1bbf488a115a
- Expected Document: 50467edc-0a5e-458f-ba69-1bbf488a115a
- Expected Chunk: MCH-3FD884E9C86C84ADD445F70EC81FADD9
- Gold status: GOLD_INVALID_REQUIREMENT_NOT_IN_FORMAL_DB
- Invalid reasons: target_requirement_id_not_persisted; source_span_not_persisted_for_project

### Verified Evidence Span

- None persisted.


### Expected chunk source snapshot (not automatically verified)

- Chunk: MCH-3FD884E9C86C84ADD445F70EC81FADD9
- Hash: f4f7b9db71c7a29583a29ba9b9bf499740066997570b2ec02e80c41b516e9719
- Provenance: TRANSIENT_OR_UNPERSISTED_REFERENCE

```text
项目：景云城市治理数据平台；范围：数据目录、交换任务、统一门户和运行监测；项目状态：已完成模拟案例；验收日期：2025-11-20。
```

### Actual TopK

- None — `NOT_EXECUTED` because Gold mapping is invalid.

- Evidence-Bearing Hit: NOT_EXECUTED
- Expected Evidence Rank: NOT_EXECUTED
- Qualified Span: NOT_EXECUTED
- Metadata false positive: NOT_EXECUTED
- Topic-only false positive: NOT_EXECUTED
- Source routing result: NOT_EXECUTED

### Mapping / downstream safety

- Requirement ID: NOT_PERSISTED
- Evidence Fact ID: NOT_CREATED
- Original Evidence Span: NONE
- Mapping relationship: NOT_EXECUTED
- Human approval: NOT_REACHED
- Claim Gate consequence: NOT_REACHED

### Final: BLOCKED / FAIL

- Failure layer: GOLD_INVALID
- Root cause: Targeted Gold is not executable: target_requirement_id_not_persisted; source_span_not_persisted_for_project

---

## V2R-030-CORPUS-21

- Requirement ID: NOT_PERSISTED
- Requirement original text: 企业应提供同类项目的实施及验收依据。
- Retrieval intent: enterprise_capability_boundary
- Allowed evidence scope: ENTERPRISE_PROJECT_SCOPE / project=518c6772-b200-4b7b-9d45-059297714516
- Expected Material: 50467edc-0a5e-458f-ba69-1bbf488a115a
- Expected Document: 50467edc-0a5e-458f-ba69-1bbf488a115a
- Expected Chunk: MCH-3FD884E9C86C84ADD445F70EC81FADD9
- Gold status: GOLD_INVALID_REQUIREMENT_NOT_IN_FORMAL_DB
- Invalid reasons: target_requirement_id_not_persisted; source_span_not_persisted_for_project

### Verified Evidence Span

- None persisted.


### Expected chunk source snapshot (not automatically verified)

- Chunk: MCH-3FD884E9C86C84ADD445F70EC81FADD9
- Hash: f4f7b9db71c7a29583a29ba9b9bf499740066997570b2ec02e80c41b516e9719
- Provenance: TRANSIENT_OR_UNPERSISTED_REFERENCE

```text
项目：景云城市治理数据平台；范围：数据目录、交换任务、统一门户和运行监测；项目状态：已完成模拟案例；验收日期：2025-11-20。
```

### Actual TopK

- None — `NOT_EXECUTED` because Gold mapping is invalid.

- Evidence-Bearing Hit: NOT_EXECUTED
- Expected Evidence Rank: NOT_EXECUTED
- Qualified Span: NOT_EXECUTED
- Metadata false positive: NOT_EXECUTED
- Topic-only false positive: NOT_EXECUTED
- Source routing result: NOT_EXECUTED

### Mapping / downstream safety

- Requirement ID: NOT_PERSISTED
- Evidence Fact ID: NOT_CREATED
- Original Evidence Span: NONE
- Mapping relationship: NOT_EXECUTED
- Human approval: NOT_REACHED
- Claim Gate consequence: NOT_REACHED

### Final: BLOCKED / FAIL

- Failure layer: GOLD_INVALID
- Root cause: Targeted Gold is not executable: target_requirement_id_not_persisted; source_span_not_persisted_for_project

---
