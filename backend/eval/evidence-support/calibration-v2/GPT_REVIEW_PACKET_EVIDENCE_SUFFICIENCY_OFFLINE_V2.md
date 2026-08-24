# GPT Review Packet — Evidence Sufficiency Offline Baseline V2

- Schema: `stage20-evidence-sufficiency-offline-v2`
- Scope: EvidenceSupportAssessment only; not Retrieval Hit@K evaluation
- Frozen cases: 6
- External calls: Embedding 0 / LLM 0 / Dify 0
- Formal DB mutations: all 0; this packet is side-effect free.
- GPT_REVIEW_STATUS: **PENDING_REVIEW**
- EVAL_COMPLETE: **NO**

## Metrics

```json
{
  "core_case_count": 6,
  "negative_control_cases_excluded": true,
  "business_status_accuracy": {
    "correct": 6,
    "total": 6,
    "rate": 1
  },
  "required_dimension_accuracy": {
    "correct": 25,
    "total": 25,
    "rate": 1
  },
  "unresolved_required_dimension_accuracy": {
    "correct": 6,
    "total": 6,
    "rate": 1
  },
  "adverse_evidence_recognition": {
    "correct": 1,
    "total": 1,
    "rate": 1
  },
  "conflict_recognition": {
    "correct": 1,
    "total": 1,
    "rate": 1
  },
  "technical_failure_separation": {
    "correct": 1,
    "total": 1,
    "rate": 1
  },
  "false_supported_rate": {
    "false_supported": 0,
    "denominator": 3,
    "rate": 0
  },
  "unsafe_false_supported": 0,
  "baseline_created_on_failure": 0
}
```

## Case-level evidence

### V2R-001-PERF-DIRECT

Requirement: 企业应提供可核验的数据交换平台性能测试记录。
Runtime status: **EVIDENCE_REVIEW_READY**; expected: **EVIDENCE_REVIEW_READY**
Oracle field provenance: {"runtime_assessment":"AUTO_DRAFT","human_gold":"NONE","promotion":"NOT_PERMITTED","case_status_expectation_provenance":"GPT_REVIEWED_EXPECTATION","dimension_expectation_provenance":{"subject_match":"PENDING_GPT_REVIEW","entity_match":"PENDING_GPT_REVIEW","scope_match":"PENDING_GPT_REVIEW","status_match":"PENDING_GPT_REVIEW","validity_match":"PENDING_GPT_REVIEW","quantitative_match":"PENDING_GPT_REVIEW"},"reason_code_expectation_provenance":{},"unresolved_dimension_expectation_provenance":{},"adverse_evidence_expectation_provenance":"PENDING_GPT_REVIEW"}
Selected source: MCH-0FBD3599DAF932016F62EB9634B997AF
Frozen evidence inputs (4):
- MCH-770B6FE8E57173DCC72914CFFB7376F8 [rank 2] 产品：澄明数据交换平台 V3.2 / 能力：REST API 接入、数据目录、交换任务调度、运行日志。 / 未声明未列出的协议、吞吐量或 SLA。
- MCH-0FBD3599DAF932016F62EB9634B997AF [rank 4] 产品：澄明数据交换平台 V3.2 / 环境：8 vCPU、32 GB 内存、PostgreSQL 14、千兆局域网 / 条件：50 并发、100 万条基准数据、缓存预热后执行 30 分钟 / 指标：数据目录查询平均响应时间 / 结果：平均 1.4 秒，P95 1.9 秒。 / 日期：2025-05-16。
- MCH-3A8FB2B6257892D70EAFEF97417EEB23 [rank 11] 项目：北川新区数据协同平台项目（虚构） / 双方：澄明数科（示范）有限公司；北川新区数字服务中心（虚构） / 签订日期：2024-02-01 / 范围：数据目录、交换任务和实施服务。
- MCH-268A148B9BD7EA6BF0B470DDE0EA8425 [rank 12] 项目：北川新区数据协同平台项目（虚构） / 客户：北川新区数字服务中心（虚构） / 验收日期：2024-09-20 / 结论：虚构项目约定范围通过验收；不外推至其他环境。
Source text: 产品：澄明数据交换平台 V3.2 / 环境：8 vCPU、32 GB 内存、PostgreSQL 14、千兆局域网 / 条件：50 并发、100 万条基准数据、缓存预热后执行 30 分钟 / 指标：数据目录查询平均响应时间 / 结果：平均 1.4 秒，P95 1.9 秒。 / 日期：2025-05-16。
Exact support span: 结果：平均 1.4 秒，P95 1.9 秒。
Context window: context_only:MCH-770B6FE8E57173DCC72914CFFB7376F8, selected_source:MCH-0FBD3599DAF932016F62EB9634B997AF, context_only:MCH-3A8FB2B6257892D70EAFEF97417EEB23
Required dimensions: subject_match=REQUIRED_DIMENSION/match; entity_match=REQUIRED_DIMENSION/match; scope_match=REQUIRED_DIMENSION/match; status_match=REQUIRED_DIMENSION/match; validity_match=SUPPORTING_DIMENSION/match; quantitative_match=REQUIRED_DIMENSION/match
Runtime dimensions: {"subject_match":"match","scope_match":"match","status_match":"match","quantitative_match":"match","entity_match":"match","validity_match":"match","source_authority":"match","support_sufficiency":"match"}
Reason codes: none
Assessment rationale: direct source-bound support
Unresolved required dimensions: none
Adverse evidence: NO

### V2R-002-PERF-PARTIAL

Requirement: 企业应证明接口 P95 响应时间不超过 1 秒。
Runtime status: **INSUFFICIENT_EVIDENCE**; expected: **INSUFFICIENT_EVIDENCE**
Oracle field provenance: {"runtime_assessment":"AUTO_DRAFT","human_gold":"NONE","promotion":"NOT_PERMITTED","case_status_expectation_provenance":"GPT_REVIEWED_EXPECTATION","dimension_expectation_provenance":{"subject_match":"PENDING_GPT_REVIEW","entity_match":"PENDING_GPT_REVIEW","scope_match":"PENDING_GPT_REVIEW","status_match":"PENDING_GPT_REVIEW","validity_match":"PENDING_GPT_REVIEW","quantitative_match":"GPT_REVIEWED_EXPECTATION","support_sufficiency":"GPT_REVIEWED_EXPECTATION"},"reason_code_expectation_provenance":{"QUANTITATIVE_MISMATCH":"GPT_REVIEWED_EXPECTATION","SUPPORT_INSUFFICIENT":"GPT_REVIEWED_EXPECTATION"},"unresolved_dimension_expectation_provenance":{},"adverse_evidence_expectation_provenance":"GPT_REVIEWED_EXPECTATION"}
Selected source: MCH-0FBD3599DAF932016F62EB9634B997AF
Frozen evidence inputs (3):
- MCH-0FBD3599DAF932016F62EB9634B997AF [rank 1] 产品：澄明数据交换平台 V3.2 / 环境：8 vCPU、32 GB 内存、PostgreSQL 14、千兆局域网 / 条件：50 并发、100 万条基准数据、缓存预热后执行 30 分钟 / 指标：数据目录查询平均响应时间 / 结果：平均 1.4 秒，P95 1.9 秒。 / 日期：2025-05-16。
- MCH-08A2CF3D5D2423E41CECF8BB230F574A [rank 3] 企业通常提供工作日 9:00-18:00 服务台、远程诊断和必要时现场支持。 / 无经审核的 7×24、5 分钟响应或 99.99% SLA。
- MCH-770B6FE8E57173DCC72914CFFB7376F8 [rank 7] 产品：澄明数据交换平台 V3.2 / 能力：REST API 接入、数据目录、交换任务调度、运行日志。 / 未声明未列出的协议、吞吐量或 SLA。
Source text: 产品：澄明数据交换平台 V3.2 / 环境：8 vCPU、32 GB 内存、PostgreSQL 14、千兆局域网 / 条件：50 并发、100 万条基准数据、缓存预热后执行 30 分钟 / 指标：数据目录查询平均响应时间 / 结果：平均 1.4 秒，P95 1.9 秒。 / 日期：2025-05-16。
Exact support span: 结果：平均 1.4 秒，P95 1.9 秒。
Context window: selected_source:MCH-0FBD3599DAF932016F62EB9634B997AF, context_only:MCH-08A2CF3D5D2423E41CECF8BB230F574A
Required dimensions: subject_match=REQUIRED_DIMENSION/match; entity_match=REQUIRED_DIMENSION/match; scope_match=REQUIRED_DIMENSION/match; status_match=SUPPORTING_DIMENSION/match; validity_match=SUPPORTING_DIMENSION/match; quantitative_match=REQUIRED_DIMENSION/mismatch; support_sufficiency=SUPPORTING_DIMENSION/mismatch
Runtime dimensions: {"subject_match":"match","scope_match":"match","status_match":"match","quantitative_match":"mismatch","entity_match":"match","validity_match":"match","source_authority":"match","support_sufficiency":"mismatch"}
Reason codes: QUANTITATIVE_MISMATCH, SUPPORT_INSUFFICIENT
Assessment rationale: adverse quantitative evidence; must not be supported
Unresolved required dimensions: none
Adverse evidence: YES

### V2R-003-COMP-DIRECT

Requirement: 企业应说明产品在 x86_64、Ubuntu 和 PostgreSQL 环境的兼容性。
Runtime status: **EVIDENCE_REVIEW_READY**; expected: **EVIDENCE_REVIEW_READY**
Oracle field provenance: {"runtime_assessment":"AUTO_DRAFT","human_gold":"NONE","promotion":"NOT_PERMITTED","case_status_expectation_provenance":"GPT_REVIEWED_EXPECTATION","dimension_expectation_provenance":{"subject_match":"GPT_REVIEWED_EXPECTATION","entity_match":"GPT_REVIEWED_EXPECTATION","scope_match":"GPT_REVIEWED_EXPECTATION","status_match":"GPT_REVIEWED_EXPECTATION","quantitative_match":"PENDING_GPT_REVIEW","validity_match":"PENDING_GPT_REVIEW"},"reason_code_expectation_provenance":{},"unresolved_dimension_expectation_provenance":{},"adverse_evidence_expectation_provenance":"PENDING_GPT_REVIEW"}
Selected source: MCH-7F11A857F9B5A05D9B22E30CD4F1BEE0
Frozen evidence inputs (2):
- MCH-7F11A857F9B5A05D9B22E30CD4F1BEE0 [rank 1] x86_64 + Ubuntu 22.04 + PostgreSQL 14：tested / 鲲鹏 920 + 麒麟 V10 + 达梦 8：partially_tested（完成安装和基础交换用例，未完成压力测试） / 海光 + 统信 UOS + 人大金仓：not_verified / 国产数据库组合：unknown
- MCH-0FBD3599DAF932016F62EB9634B997AF [rank 6] 产品：澄明数据交换平台 V3.2 / 环境：8 vCPU、32 GB 内存、PostgreSQL 14、千兆局域网 / 条件：50 并发、100 万条基准数据、缓存预热后执行 30 分钟 / 指标：数据目录查询平均响应时间 / 结果：平均 1.4 秒，P95 1.9 秒。 / 日期：2025-05-16。
Source text: x86_64 + Ubuntu 22.04 + PostgreSQL 14：tested / 鲲鹏 920 + 麒麟 V10 + 达梦 8：partially_tested（完成安装和基础交换用例，未完成压力测试） / 海光 + 统信 UOS + 人大金仓：not_verified / 国产数据库组合：unknown
Exact support span: x86_64 + Ubuntu 22.04 + PostgreSQL 14：tested
Context window: selected_source:MCH-7F11A857F9B5A05D9B22E30CD4F1BEE0, context_only:MCH-0FBD3599DAF932016F62EB9634B997AF
Required dimensions: subject_match=REQUIRED_DIMENSION/match; entity_match=REQUIRED_DIMENSION/match; scope_match=REQUIRED_DIMENSION/match; status_match=REQUIRED_DIMENSION/match; quantitative_match=NOT_APPLICABLE/unknown; validity_match=SUPPORTING_DIMENSION/unknown
Runtime dimensions: {"subject_match":"match","scope_match":"match","status_match":"match","quantitative_match":"unknown","entity_match":"match","validity_match":"unknown","source_authority":"match","support_sufficiency":"match"}
Reason codes: none
Assessment rationale: direct source-bound support
Unresolved required dimensions: none
Adverse evidence: NO

### V2R-004-COMP-PARTIAL

Requirement: 企业应证明所有国产数据库组合均已完成压力测试。
Runtime status: **INSUFFICIENT_EVIDENCE**; expected: **INSUFFICIENT_EVIDENCE**
Oracle field provenance: {"runtime_assessment":"AUTO_DRAFT","human_gold":"NONE","promotion":"NOT_PERMITTED","case_status_expectation_provenance":"GPT_REVIEWED_EXPECTATION","dimension_expectation_provenance":{"subject_match":"PENDING_GPT_REVIEW","entity_match":"PENDING_GPT_REVIEW","scope_match":"GPT_REVIEWED_EXPECTATION","status_match":"GPT_REVIEWED_EXPECTATION","quantitative_match":"GPT_REVIEWED_EXPECTATION","validity_match":"PENDING_GPT_REVIEW"},"reason_code_expectation_provenance":{"SUPPORT_INSUFFICIENT":"GPT_REVIEWED_EXPECTATION","STATUS_UNKNOWN":"GPT_REVIEWED_EXPECTATION"},"unresolved_dimension_expectation_provenance":{"scope_match":"GPT_REVIEWED_EXPECTATION","status_match":"GPT_REVIEWED_EXPECTATION","quantitative_match":"GPT_REVIEWED_EXPECTATION"},"adverse_evidence_expectation_provenance":"PENDING_GPT_REVIEW"}
Selected source: MCH-7F11A857F9B5A05D9B22E30CD4F1BEE0
Frozen evidence inputs (4):
- MCH-7F11A857F9B5A05D9B22E30CD4F1BEE0 [rank 1] x86_64 + Ubuntu 22.04 + PostgreSQL 14：tested / 鲲鹏 920 + 麒麟 V10 + 达梦 8：partially_tested（完成安装和基础交换用例，未完成压力测试） / 海光 + 统信 UOS + 人大金仓：not_verified / 国产数据库组合：unknown
- MCH-0FBD3599DAF932016F62EB9634B997AF [rank 5] 产品：澄明数据交换平台 V3.2 / 环境：8 vCPU、32 GB 内存、PostgreSQL 14、千兆局域网 / 条件：50 并发、100 万条基准数据、缓存预热后执行 30 分钟 / 指标：数据目录查询平均响应时间 / 结果：平均 1.4 秒，P95 1.9 秒。 / 日期：2025-05-16。
- MCH-268A148B9BD7EA6BF0B470DDE0EA8425 [rank 11] 项目：北川新区数据协同平台项目（虚构） / 客户：北川新区数字服务中心（虚构） / 验收日期：2024-09-20 / 结论：虚构项目约定范围通过验收；不外推至其他环境。
- MCH-70376020855F97D43106A81E5F040C7F [rank 12] 企业持有在有效期内的 ISO/IEC 27001 受控记录。该事实不证明任一产品已实现特定安全等级、等保级别或具体安全功能。
Source text: x86_64 + Ubuntu 22.04 + PostgreSQL 14：tested / 鲲鹏 920 + 麒麟 V10 + 达梦 8：partially_tested（完成安装和基础交换用例，未完成压力测试） / 海光 + 统信 UOS + 人大金仓：not_verified / 国产数据库组合：unknown
Exact support span: 国产数据库组合：unknown
Context window: selected_source:MCH-7F11A857F9B5A05D9B22E30CD4F1BEE0, context_only:MCH-0FBD3599DAF932016F62EB9634B997AF
Required dimensions: subject_match=REQUIRED_DIMENSION/match; entity_match=SUPPORTING_DIMENSION/unknown; scope_match=UNRESOLVED_REQUIRED_DIMENSION/unknown; status_match=UNRESOLVED_REQUIRED_DIMENSION/unknown; quantitative_match=UNRESOLVED_REQUIRED_DIMENSION/unknown; validity_match=SUPPORTING_DIMENSION/unknown
Runtime dimensions: {"subject_match":"match","scope_match":"unknown","status_match":"unknown","quantitative_match":"unknown","entity_match":"unknown","validity_match":"unknown","source_authority":"match","support_sufficiency":"mismatch"}
Reason codes: SUPPORT_INSUFFICIENT, STATUS_UNKNOWN
Assessment rationale: all domestic combinations pressure-tested is not supported
Unresolved required dimensions: scope_match, status_match, quantitative_match
Adverse evidence: NO

### V2R-005-ISO-DIRECT

Requirement: 企业应提供当前有效的 ISO/IEC 27001 认证信息。
Runtime status: **EVIDENCE_REVIEW_READY**; expected: **EVIDENCE_REVIEW_READY**
Oracle field provenance: {"runtime_assessment":"AUTO_DRAFT","human_gold":"NONE","promotion":"NOT_PERMITTED","case_status_expectation_provenance":"GPT_REVIEWED_EXPECTATION","dimension_expectation_provenance":{"subject_match":"PENDING_GPT_REVIEW","entity_match":"PENDING_GPT_REVIEW","scope_match":"PENDING_GPT_REVIEW","status_match":"GPT_REVIEWED_EXPECTATION","validity_match":"GPT_REVIEWED_EXPECTATION","quantitative_match":"PENDING_GPT_REVIEW"},"reason_code_expectation_provenance":{},"unresolved_dimension_expectation_provenance":{},"adverse_evidence_expectation_provenance":"PENDING_GPT_REVIEW"}
Selected source: MCH-A4C2632EF9126FADD349C3004E1C2D84
Frozen evidence inputs (3):
- MCH-70376020855F97D43106A81E5F040C7F [rank 1] 企业持有在有效期内的 ISO/IEC 27001 受控记录。该事实不证明任一产品已实现特定安全等级、等保级别或具体安全功能。
- MCH-A4C2632EF9126FADD349C3004E1C2D84 [rank 2] 名称：ISO/IEC 27001 / 编号：CM-Q-27001-2024 / 状态：active / 有效至：2027-11-30
- MCH-A160D3E488BD50C27E5F6267363E57B1 [rank 5] 名称：ISO 9001 / 编号：CM-Q-9001-2025 / 状态：active / 有效至：2028-03-31
Source text: 名称：ISO/IEC 27001 / 编号：CM-Q-27001-2024 / 状态：active / 有效至：2027-11-30
Exact support span: 名称：ISO/IEC 27001 / 编号：CM-Q-27001-2024 / 状态：active / 有效至：2027-11-30
Context window: context_only:MCH-70376020855F97D43106A81E5F040C7F, selected_source:MCH-A4C2632EF9126FADD349C3004E1C2D84, context_only:MCH-A160D3E488BD50C27E5F6267363E57B1
Required dimensions: subject_match=REQUIRED_DIMENSION/match; entity_match=REQUIRED_DIMENSION/match; scope_match=REQUIRED_DIMENSION/match; status_match=REQUIRED_DIMENSION/match; validity_match=REQUIRED_DIMENSION/match; quantitative_match=NOT_APPLICABLE/unknown
Runtime dimensions: {"subject_match":"match","scope_match":"match","status_match":"match","quantitative_match":"unknown","entity_match":"match","validity_match":"match","source_authority":"match","support_sufficiency":"match"}
Reason codes: none
Assessment rationale: direct source-bound support
Unresolved required dimensions: none
Adverse evidence: NO

### V2R-006-ISO-SCOPE

Requirement: 企业应提供指定项目主体的 ISO/IEC 27001 证书。
Runtime status: **INSUFFICIENT_EVIDENCE**; expected: **INSUFFICIENT_EVIDENCE**
Oracle field provenance: {"runtime_assessment":"AUTO_DRAFT","human_gold":"NONE","promotion":"NOT_PERMITTED","case_status_expectation_provenance":"GPT_REVIEWED_EXPECTATION","dimension_expectation_provenance":{"subject_match":"GPT_REVIEWED_EXPECTATION","entity_match":"GPT_REVIEWED_EXPECTATION","scope_match":"GPT_REVIEWED_EXPECTATION","status_match":"PENDING_GPT_REVIEW","validity_match":"PENDING_GPT_REVIEW","quantitative_match":"PENDING_GPT_REVIEW"},"reason_code_expectation_provenance":{"SUPPORT_INSUFFICIENT":"GPT_REVIEWED_EXPECTATION"},"unresolved_dimension_expectation_provenance":{"subject_match":"GPT_REVIEWED_EXPECTATION","entity_match":"GPT_REVIEWED_EXPECTATION","scope_match":"GPT_REVIEWED_EXPECTATION"},"adverse_evidence_expectation_provenance":"PENDING_GPT_REVIEW"}
Selected source: MCH-A4C2632EF9126FADD349C3004E1C2D84
Frozen evidence inputs (3):
- MCH-70376020855F97D43106A81E5F040C7F [rank 1] 企业持有在有效期内的 ISO/IEC 27001 受控记录。该事实不证明任一产品已实现特定安全等级、等保级别或具体安全功能。
- MCH-A4C2632EF9126FADD349C3004E1C2D84 [rank 3] 名称：ISO/IEC 27001 / 编号：CM-Q-27001-2024 / 状态：active / 有效至：2027-11-30
- MCH-A160D3E488BD50C27E5F6267363E57B1 [rank 5] 名称：ISO 9001 / 编号：CM-Q-9001-2025 / 状态：active / 有效至：2028-03-31
Source text: 名称：ISO/IEC 27001 / 编号：CM-Q-27001-2024 / 状态：active / 有效至：2027-11-30
Exact support span: 名称：ISO/IEC 27001 / 编号：CM-Q-27001-2024 / 状态：active / 有效至：2027-11-30
Context window: context_only:MCH-70376020855F97D43106A81E5F040C7F, selected_source:MCH-A4C2632EF9126FADD349C3004E1C2D84, context_only:MCH-A160D3E488BD50C27E5F6267363E57B1
Required dimensions: subject_match=UNRESOLVED_REQUIRED_DIMENSION/unknown; entity_match=UNRESOLVED_REQUIRED_DIMENSION/unknown; scope_match=UNRESOLVED_REQUIRED_DIMENSION/unknown; status_match=SUPPORTING_DIMENSION/unknown; validity_match=SUPPORTING_DIMENSION/unknown; quantitative_match=NOT_APPLICABLE/unknown
Runtime dimensions: {"subject_match":"unknown","scope_match":"unknown","status_match":"unknown","quantitative_match":"unknown","entity_match":"unknown","validity_match":"unknown","source_authority":"match","support_sufficiency":"mismatch"}
Reason codes: SUPPORT_INSUFFICIENT
Assessment rationale: project-subject binding is unresolved; enterprise-level certificate is not enough
Unresolved required dimensions: subject_match, entity_match, scope_match
Adverse evidence: NO

## Negative controls

```json
[
  {
    "control_id": "ADVERSE_QUANTITATIVE_EVIDENCE",
    "case_id": "V2R-002-PERF-PARTIAL",
    "result_status": "INSUFFICIENT_EVIDENCE",
    "passed": true
  },
  {
    "control_id": "WRONG_SCOPE_BOUNDARY",
    "case_id": "V2R-006-ISO-SCOPE",
    "result_status": "INSUFFICIENT_EVIDENCE",
    "passed": true
  },
  {
    "control_id": "EXPLICIT_SUBJECT_MISMATCH",
    "control_fixture_id": "NEG-SUBJECT-001",
    "source_text": "名称：ISO/IEC 27001\n编号：CM-Q-27001-2024\n状态：active\n有效至：2027-11-30",
    "fact_key": "subject_binding",
    "observed_value": "明确不同主体",
    "runtime_assessment": {
      "assessment_id": "ESA-99E23D65EED125BA67DD3FA2A44D6039",
      "assessment_version": "evidence-support-assessment-v1",
      "evaluator_version": "offline-fixture-evaluator-v1",
      "assessment_status": "available",
      "input_kind": "retrieval_candidate",
      "requirement": {
        "requirement_id": "V2R-006-ISO-SCOPE",
        "text": "企业应提供指定项目主体的 ISO/IEC 27001 证书。",
        "text_hash": "e22571d3a46f931b91fb21046695b2204c386f971effe4df5e417c662d485ab6"
      },
      "source": {
        "source_id": "MCH-A4C2632EF9126FADD349C3004E1C2D84",
        "source_kind": "retrieval_candidate",
        "source_span_id": "OFFLINE-SPAN-MCH-A4C2632EF9126FADD349C3004E1C2D84",
        "source_text_hash": "4aad371afadcb5d360f7461d405d06e706132aa072271064a297010ab458572f",
        "lineage": {
          "material_id": "57b9e5fe-9549-42aa-88d5-fccc5c0afe2e",
          "document_id": "57b9e5fe-9549-42aa-88d5-fccc5c0afe2e",
          "chunk_id": "MCH-A4C2632EF9126FADD349C3004E1C2D84",
          "source_span_resolution": "OFFLINE_FROZEN_CAPTURE"
        },
        "material": {
          "material_id": "57b9e5fe-9549-42aa-88d5-fccc5c0afe2e",
          "document_id": "57b9e5fe-9549-42aa-88d5-fccc5c0afe2e",
          "source_eligibility": "ELIGIBLE"
        }
      },
      "semantic_relevance": "relevant",
      "evidence_capability": "capable",
      "support_level": "insufficient",
      "semantic_relationship": "partial",
      "review_dimensions": {
        "subject_match": "mismatch",
        "scope_match": "match",
        "status_match": "match",
        "quantitative_match": "match",
        "entity_match": "match",
        "validity_match": "match",
        "source_authority": "match",
        "support_sufficiency": "match"
      },
      "reason_codes": [
        "SUBJECT_MISMATCH",
        "SUPPORT_INSUFFICIENT"
      ],
      "support_observations": [
        {
          "source_id": "MCH-A4C2632EF9126FADD349C3004E1C2D84",
          "source_span_id": "OFFLINE-SPAN-MCH-A4C2632EF9126FADD349C3004E1C2D84",
          "support_excerpt": "名称：ISO/IEC 27001\n编号：CM-Q-27001-2024\n状态：active\n有效至：2027-11-30",
          "support_excerpt_hash": "4aad371afadcb5d360f7461d405d06e706132aa072271064a297010ab458572f",
          "observation_type": "partial_support",
          "reason_codes": [
            "SUBJECT_MISMATCH"
          ]
        }
      ],
      "conflict_observations": []
    },
    "aggregate_result": {
      "status": "INSUFFICIENT_EVIDENCE",
      "assessment_count": 1,
      "blocking_conflicts": [],
      "reason_codes": [
        "SUPPORT_INSUFFICIENT"
      ]
    },
    "result_status": "INSUFFICIENT_EVIDENCE",
    "passed": true
  },
  {
    "control_id": "CONFLICTING_EVIDENCE",
    "control_fixture_id": "NEG-CONFLICT-001",
    "fact_key": "average_response_time",
    "evidence_a": {
      "source_id": "CONFLICT-A",
      "source_text": "系统平均响应时间为1.4秒。",
      "value": "1.4秒"
    },
    "evidence_b": {
      "source_id": "CONFLICT-B",
      "source_text": "系统平均响应时间为2.1秒。",
      "value": "2.1秒"
    },
    "value_a": "1.4秒",
    "value_b": "2.1秒",
    "conflict_reason": "同一数量事实存在不同来源值，必须人工复核。",
    "runtime_assessments": [
      {
        "assessment_id": "ESA-CD38318219D6FC341C597C3091943730",
        "assessment_version": "evidence-support-assessment-v1",
        "evaluator_version": "offline-fixture-evaluator-v1",
        "assessment_status": "available",
        "input_kind": "retrieval_candidate",
        "requirement": {
          "requirement_id": "CONTROL-CONFLICT",
          "text": "系统平均响应时间应不超过1.4秒。",
          "text_hash": "dbb5336d2b1a5f50afc6aaa69c1294f31cbf226f473a65f90114fd91d87fbbe9"
        },
        "source": {
          "source_id": "CONFLICT-A",
          "source_kind": "retrieval_candidate",
          "source_span_id": "SPAN-CONFLICT-A",
          "source_text_hash": "c2f2b7e8d8c502274752fb46793291d3f467bf8d14c8663734bd2ccc083a8fcf",
          "lineage": {
            "chunk_id": "CONFLICT-A"
          },
          "material": {
            "material_id": "MAT-CONFLICT-A"
          }
        },
        "semantic_relevance": "relevant",
        "evidence_capability": "capable",
        "support_level": "full_support",
        "semantic_relationship": "direct",
        "review_dimensions": {
          "subject_match": "match",
          "scope_match": "match",
          "status_match": "match",
          "quantitative_match": "match",
          "entity_match": "match",
          "validity_match": "match",
          "source_authority": "match",
          "support_sufficiency": "match"
        },
        "reason_codes": [],
        "support_observations": [
          {
            "source_id": "CONFLICT-A",
            "source_span_id": "SPAN-CONFLICT-A",
            "support_excerpt": "系统平均响应时间为1.4秒。",
            "support_excerpt_hash": "c2f2b7e8d8c502274752fb46793291d3f467bf8d14c8663734bd2ccc083a8fcf",
            "observation_type": "direct_support",
            "reason_codes": []
          }
        ],
        "conflict_observations": [
          {
            "source_id": "CONFLICT-A",
            "source_span_id": "SPAN-CONFLICT-A",
            "support_excerpt": "系统平均响应时间为1.4秒。",
            "support_excerpt_hash": "c2f2b7e8d8c502274752fb46793291d3f467bf8d14c8663734bd2ccc083a8fcf",
            "conflict_group_id": "CONTROL-QUANTITY",
            "dimension": "quantitative_match",
            "observed_value": "1.4秒",
            "reason_codes": [
              "HUMAN_REVIEW_REQUIRED"
            ]
          }
        ]
      },
      {
        "assessment_id": "ESA-3E91EB2C36BEF09844B3B28E2F646F8C",
        "assessment_version": "evidence-support-assessment-v1",
        "evaluator_version": "offline-fixture-evaluator-v1",
        "assessment_status": "available",
        "input_kind": "retrieval_candidate",
        "requirement": {
          "requirement_id": "CONTROL-CONFLICT",
          "text": "系统平均响应时间应不超过1.4秒。",
          "text_hash": "dbb5336d2b1a5f50afc6aaa69c1294f31cbf226f473a65f90114fd91d87fbbe9"
        },
        "source": {
          "source_id": "CONFLICT-B",
          "source_kind": "retrieval_candidate",
          "source_span_id": "SPAN-CONFLICT-B",
          "source_text_hash": "e19a910a1c12662b07b0109d58b70b101a76090f3cd162fed16317079e03f6f5",
          "lineage": {
            "chunk_id": "CONFLICT-B"
          },
          "material": {
            "material_id": "MAT-CONFLICT-B"
          }
        },
        "semantic_relevance": "relevant",
        "evidence_capability": "capable",
        "support_level": "full_support",
        "semantic_relationship": "direct",
        "review_dimensions": {
          "subject_match": "match",
          "scope_match": "match",
          "status_match": "match",
          "quantitative_match": "match",
          "entity_match": "match",
          "validity_match": "match",
          "source_authority": "match",
          "support_sufficiency": "match"
        },
        "reason_codes": [],
        "support_observations": [
          {
            "source_id": "CONFLICT-B",
            "source_span_id": "SPAN-CONFLICT-B",
            "support_excerpt": "系统平均响应时间为2.1秒。",
            "support_excerpt_hash": "e19a910a1c12662b07b0109d58b70b101a76090f3cd162fed16317079e03f6f5",
            "observation_type": "direct_support",
            "reason_codes": []
          }
        ],
        "conflict_observations": [
          {
            "source_id": "CONFLICT-B",
            "source_span_id": "SPAN-CONFLICT-B",
            "support_excerpt": "系统平均响应时间为2.1秒。",
            "support_excerpt_hash": "e19a910a1c12662b07b0109d58b70b101a76090f3cd162fed16317079e03f6f5",
            "conflict_group_id": "CONTROL-QUANTITY",
            "dimension": "quantitative_match",
            "observed_value": "2.1秒",
            "reason_codes": [
              "HUMAN_REVIEW_REQUIRED"
            ]
          }
        ]
      }
    ],
    "aggregate_result": {
      "status": "CONFLICTING_EVIDENCE",
      "assessment_count": 2,
      "blocking_conflicts": [
        {
          "conflict_group_id": "CONTROL-QUANTITY",
          "dimension": "quantitative_match",
          "observations": [
            {
              "source_id": "CONFLICT-A",
              "source_span_id": "SPAN-CONFLICT-A",
              "support_excerpt": "系统平均响应时间为1.4秒。",
              "support_excerpt_hash": "c2f2b7e8d8c502274752fb46793291d3f467bf8d14c8663734bd2ccc083a8fcf",
              "conflict_group_id": "CONTROL-QUANTITY",
              "dimension": "quantitative_match",
              "observed_value": "1.4秒",
              "reason_codes": [
                "HUMAN_REVIEW_REQUIRED"
              ],
              "assessment_id": "ESA-CD38318219D6FC341C597C3091943730"
            },
            {
              "source_id": "CONFLICT-B",
              "source_span_id": "SPAN-CONFLICT-B",
              "support_excerpt": "系统平均响应时间为2.1秒。",
              "support_excerpt_hash": "e19a910a1c12662b07b0109d58b70b101a76090f3cd162fed16317079e03f6f5",
              "conflict_group_id": "CONTROL-QUANTITY",
              "dimension": "quantitative_match",
              "observed_value": "2.1秒",
              "reason_codes": [
                "HUMAN_REVIEW_REQUIRED"
              ],
              "assessment_id": "ESA-3E91EB2C36BEF09844B3B28E2F646F8C"
            }
          ],
          "blocking": true
        }
      ],
      "reason_codes": [
        "HUMAN_REVIEW_REQUIRED"
      ]
    },
    "result_status": "CONFLICTING_EVIDENCE",
    "passed": true,
    "assessment_count": 2
  },
  {
    "control_id": "TECHNICAL_FAILURE_SEPARATION",
    "control_fixture_id": "NEG-TECHNICAL-001",
    "technical_error_type": "PROVIDER_TIMEOUT",
    "runtime_input": {
      "requirement": {
        "requirement_id": "V2R-001-PERF-DIRECT",
        "text": "企业应提供可核验的数据交换平台性能测试记录。",
        "text_hash": "13b54062a469433e1e86438423597c56377f553087a6898724efeb86b35feefc"
      },
      "source": {
        "source_id": "MCH-0FBD3599DAF932016F62EB9634B997AF",
        "source_kind": "retrieval_candidate",
        "source_span_id": "OFFLINE-SPAN-MCH-0FBD3599DAF932016F62EB9634B997AF",
        "source_text_hash": "5a54f61d10c64f26414f8dcfb93f3c1eb25076f1063d97f8200f42cad981843c",
        "lineage": {
          "material_id": "3c81671f-376e-401b-8525-be26929d5b92",
          "document_id": "3c81671f-376e-401b-8525-be26929d5b92",
          "chunk_id": "MCH-0FBD3599DAF932016F62EB9634B997AF",
          "source_span_resolution": "OFFLINE_FROZEN_CAPTURE"
        },
        "material": {
          "material_id": "3c81671f-376e-401b-8525-be26929d5b92",
          "document_id": "3c81671f-376e-401b-8525-be26929d5b92",
          "source_eligibility": "ELIGIBLE"
        },
        "source_text": "产品：澄明数据交换平台 V3.2\n环境：8 vCPU、32 GB 内存、PostgreSQL 14、千兆局域网\n条件：50 并发、100 万条基准数据、缓存预热后执行 30 分钟\n指标：数据目录查询平均响应时间\n结果：平均 1.4 秒，P95 1.9 秒。\n日期：2025-05-16。"
      }
    },
    "technical_status": "unavailable",
    "assessment_status": "unavailable",
    "aggregate_result": {
      "status": "ASSESSMENT_UNAVAILABLE",
      "assessment_count": 1,
      "blocking_conflicts": [],
      "reason_codes": [
        "ASSESSMENT_UNAVAILABLE"
      ]
    },
    "result_status": "ASSESSMENT_UNAVAILABLE",
    "passed": true,
    "must_not_be_business_insufficient": true
  }
]
```

## Safety boundary

Raw Retrieval Candidate remains a transient source-bound input. No Evidence, Evidence Fact, Mapping, Claim, approval, Readiness or Writer state is created or changed.

## Review state

This is an offline deterministic baseline over frozen synthetic evidence. It is not a model-quality or Retrieval Hit@K result. Independent GPT review and any Human Gold decision remain pending.
