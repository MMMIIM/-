# Evidence Support Calibration V2 — Human Review Packet

> 所有判断均为 `SYSTEM_DRAFT_UNREVIEWED`。本文件不包含人工 Gold，不能替代正式审核。
> 来源来自当前正式 Corpus；`source_span_id` 为按正式 Contract 从 Chunk + offset/hash 离线派生的 transient identity，未写入生产数据库。

## V2R-001-PERF-DIRECT

### Requirement

企业应提供可核验的数据交换平台性能测试记录。

- 难度：EASY
- 边界：quantitative、direct_support
- Draft aggregated status：**EVIDENCE_REVIEW_READY**
- Draft provenance：SYSTEM_DRAFT_UNREVIEWED

### Sources

#### Source 1

- Material：performance-report.md (product_documentation)
- Scope：ENTERPRISE_PRIVATE
- Material ID：3c81671f-376e-401b-8525-be26929d5b92
- Document ID：3c81671f-376e-401b-8525-be26929d5b92
- Chunk ID：MCH-D32448917B3E8CAD1214641F8E85D86A
- Source Span ID：ESPAN-F8209B2B73FCFC87DC5118C276BBF52D
- Resolution：DERIVED_TRANSIENT_FORMAL_CONTRACT
- Verified：true

```text
REPRESENTATIVE_SYNTHETIC
NOT_REAL_CUSTOMER_DATA
material_id: SME-004
subject: 澄明数科（示范）有限公司
```

### Draft semantic judgement

```json
{
  "provenance": "SYSTEM_DRAFT_UNREVIEWED",
  "reviewed": false,
  "status": "EVIDENCE_REVIEW_READY",
  "semantic_relevance": "relevant",
  "evidence_capability": "capable",
  "support_level": "full_support",
  "semantic_relationship": "direct",
  "boundary_tags": [
    "quantitative",
    "direct_support"
  ],
  "reason_codes": [],
  "draft_gold_reason": "企业应提供可核验的数据交换平台性能测试记录。；来源  仅用于系统草稿观察。根据来源片段的支持范围、主体/范围和状态信息，确定性聚合结果为 EVIDENCE_REVIEW_READY。该判断未经人工审核，不得作为正式 Gold。",
  "reviewer": null,
  "reviewed_at": null
}
```

### Human decision

- [ ] APPROVE
- [ ] CHANGE
- [ ] REJECT

Reviewer corrected status:

Reviewer corrected semantics:

Reviewer reason:

---

## V2R-002-PERF-PARTIAL

### Requirement

企业应证明接口 P95 响应时间不超过 1 秒。

- 难度：HARD
- 边界：quantitative、exact_numeric_requirement、partial_support
- Draft aggregated status：**INSUFFICIENT_EVIDENCE**
- Draft provenance：SYSTEM_DRAFT_UNREVIEWED

### Sources

#### Source 1

- Material：performance-report.md (product_documentation)
- Scope：ENTERPRISE_PRIVATE
- Material ID：3c81671f-376e-401b-8525-be26929d5b92
- Document ID：3c81671f-376e-401b-8525-be26929d5b92
- Chunk ID：MCH-D32448917B3E8CAD1214641F8E85D86A
- Source Span ID：ESPAN-F8209B2B73FCFC87DC5118C276BBF52D
- Resolution：DERIVED_TRANSIENT_FORMAL_CONTRACT
- Verified：true

```text
REPRESENTATIVE_SYNTHETIC
NOT_REAL_CUSTOMER_DATA
material_id: SME-004
subject: 澄明数科（示范）有限公司
```

### Draft semantic judgement

```json
{
  "provenance": "SYSTEM_DRAFT_UNREVIEWED",
  "reviewed": false,
  "status": "INSUFFICIENT_EVIDENCE",
  "semantic_relevance": "relevant",
  "evidence_capability": "capable",
  "support_level": "partial_support",
  "semantic_relationship": "partial",
  "boundary_tags": [
    "quantitative",
    "exact_numeric_requirement",
    "partial_support"
  ],
  "reason_codes": [
    "SUPPORT_INSUFFICIENT"
  ],
  "draft_gold_reason": "企业应证明接口 P95 响应时间不超过 1 秒。；来源  仅用于系统草稿观察。根据来源片段的支持范围、主体/范围和状态信息，确定性聚合结果为 INSUFFICIENT_EVIDENCE。该判断未经人工审核，不得作为正式 Gold。",
  "reviewer": null,
  "reviewed_at": null
}
```

### Human decision

- [ ] APPROVE
- [ ] CHANGE
- [ ] REJECT

Reviewer corrected status:

Reviewer corrected semantics:

Reviewer reason:

---

## V2R-003-COMP-DIRECT

### Requirement

企业应说明产品在 x86_64、Ubuntu 和 PostgreSQL 环境的兼容性。

- 难度：MEDIUM
- 边界：technical、compatibility
- Draft aggregated status：**EVIDENCE_REVIEW_READY**
- Draft provenance：SYSTEM_DRAFT_UNREVIEWED

### Sources

#### Source 1

- Material：compatibility-matrix.md (product_documentation)
- Scope：ENTERPRISE_PRIVATE
- Material ID：3f9dacfb-2e48-4796-a477-98c60b506831
- Document ID：3f9dacfb-2e48-4796-a477-98c60b506831
- Chunk ID：MCH-EA8F9FC5473B4FA1539E99B748DA4071
- Source Span ID：ESPAN-25517924C7F718BE23BD47529BE055D2
- Resolution：DERIVED_TRANSIENT_FORMAL_CONTRACT
- Verified：true

```text
REPRESENTATIVE_SYNTHETIC
NOT_REAL_CUSTOMER_DATA
material_id: SME-005
subject: 澄明数科（示范）有限公司
```

### Draft semantic judgement

```json
{
  "provenance": "SYSTEM_DRAFT_UNREVIEWED",
  "reviewed": false,
  "status": "EVIDENCE_REVIEW_READY",
  "semantic_relevance": "relevant",
  "evidence_capability": "capable",
  "support_level": "full_support",
  "semantic_relationship": "direct",
  "boundary_tags": [
    "technical",
    "compatibility"
  ],
  "reason_codes": [],
  "draft_gold_reason": "企业应说明产品在 x86_64、Ubuntu 和 PostgreSQL 环境的兼容性。；来源  仅用于系统草稿观察。根据来源片段的支持范围、主体/范围和状态信息，确定性聚合结果为 EVIDENCE_REVIEW_READY。该判断未经人工审核，不得作为正式 Gold。",
  "reviewer": null,
  "reviewed_at": null
}
```

### Human decision

- [ ] APPROVE
- [ ] CHANGE
- [ ] REJECT

Reviewer corrected status:

Reviewer corrected semantics:

Reviewer reason:

---

## V2R-004-COMP-PARTIAL

### Requirement

企业应证明所有国产数据库组合均已完成压力测试。

- 难度：HARD
- 边界：technical、partial_multi_dimension、unknown
- Draft aggregated status：**INSUFFICIENT_EVIDENCE**
- Draft provenance：SYSTEM_DRAFT_UNREVIEWED

### Sources

#### Source 1

- Material：compatibility-matrix.md (product_documentation)
- Scope：ENTERPRISE_PRIVATE
- Material ID：3f9dacfb-2e48-4796-a477-98c60b506831
- Document ID：3f9dacfb-2e48-4796-a477-98c60b506831
- Chunk ID：MCH-EA8F9FC5473B4FA1539E99B748DA4071
- Source Span ID：ESPAN-25517924C7F718BE23BD47529BE055D2
- Resolution：DERIVED_TRANSIENT_FORMAL_CONTRACT
- Verified：true

```text
REPRESENTATIVE_SYNTHETIC
NOT_REAL_CUSTOMER_DATA
material_id: SME-005
subject: 澄明数科（示范）有限公司
```

### Draft semantic judgement

```json
{
  "provenance": "SYSTEM_DRAFT_UNREVIEWED",
  "reviewed": false,
  "status": "INSUFFICIENT_EVIDENCE",
  "semantic_relevance": "relevant",
  "evidence_capability": "capable",
  "support_level": "partial_support",
  "semantic_relationship": "partial",
  "boundary_tags": [
    "technical",
    "partial_multi_dimension",
    "unknown"
  ],
  "reason_codes": [
    "SUPPORT_INSUFFICIENT"
  ],
  "draft_gold_reason": "企业应证明所有国产数据库组合均已完成压力测试。；来源  仅用于系统草稿观察。根据来源片段的支持范围、主体/范围和状态信息，确定性聚合结果为 INSUFFICIENT_EVIDENCE。该判断未经人工审核，不得作为正式 Gold。",
  "reviewer": null,
  "reviewed_at": null
}
```

### Human decision

- [ ] APPROVE
- [ ] CHANGE
- [ ] REJECT

Reviewer corrected status:

Reviewer corrected semantics:

Reviewer reason:

---

## V2R-005-ISO-DIRECT

### Requirement

企业应提供当前有效的 ISO/IEC 27001 认证信息。

- 难度：EASY
- 边界：certification、validity
- Draft aggregated status：**EVIDENCE_REVIEW_READY**
- Draft provenance：SYSTEM_DRAFT_UNREVIEWED

### Sources

#### Source 1

- Material：qualification-iso27001.md (qualification)
- Scope：ENTERPRISE_PRIVATE
- Material ID：57b9e5fe-9549-42aa-88d5-fccc5c0afe2e
- Document ID：57b9e5fe-9549-42aa-88d5-fccc5c0afe2e
- Chunk ID：MCH-0820CC5A439CB986C62E46213029CC71
- Source Span ID：ESPAN-7A5D661264A0C779ED903BDF21BC9E25
- Resolution：DERIVED_TRANSIENT_FORMAL_CONTRACT
- Verified：true

```text
# ISO 27001 受控记录
```

### Draft semantic judgement

```json
{
  "provenance": "SYSTEM_DRAFT_UNREVIEWED",
  "reviewed": false,
  "status": "EVIDENCE_REVIEW_READY",
  "semantic_relevance": "relevant",
  "evidence_capability": "capable",
  "support_level": "full_support",
  "semantic_relationship": "direct",
  "boundary_tags": [
    "certification",
    "validity"
  ],
  "reason_codes": [],
  "draft_gold_reason": "企业应提供当前有效的 ISO/IEC 27001 认证信息。；来源  仅用于系统草稿观察。根据来源片段的支持范围、主体/范围和状态信息，确定性聚合结果为 EVIDENCE_REVIEW_READY。该判断未经人工审核，不得作为正式 Gold。",
  "reviewer": null,
  "reviewed_at": null
}
```

### Human decision

- [ ] APPROVE
- [ ] CHANGE
- [ ] REJECT

Reviewer corrected status:

Reviewer corrected semantics:

Reviewer reason:

---

## V2R-006-ISO-SCOPE

### Requirement

企业应提供指定项目主体的 ISO/IEC 27001 证书。

- 难度：MEDIUM
- 边界：wrong_entity、scope_mismatch、reference_only
- Draft aggregated status：**NO_RELEVANT_EVIDENCE**
- Draft provenance：SYSTEM_DRAFT_UNREVIEWED

### Sources

#### Source 1

- Material：qualification-iso27001.md (qualification)
- Scope：ENTERPRISE_PRIVATE
- Material ID：57b9e5fe-9549-42aa-88d5-fccc5c0afe2e
- Document ID：57b9e5fe-9549-42aa-88d5-fccc5c0afe2e
- Chunk ID：MCH-0820CC5A439CB986C62E46213029CC71
- Source Span ID：ESPAN-7A5D661264A0C779ED903BDF21BC9E25
- Resolution：DERIVED_TRANSIENT_FORMAL_CONTRACT
- Verified：true

```text
# ISO 27001 受控记录
```

### Draft semantic judgement

```json
{
  "provenance": "SYSTEM_DRAFT_UNREVIEWED",
  "reviewed": false,
  "status": "NO_RELEVANT_EVIDENCE",
  "semantic_relevance": "relevant",
  "evidence_capability": "not_capable",
  "support_level": "reference_only",
  "semantic_relationship": "unrelated",
  "boundary_tags": [
    "wrong_entity",
    "scope_mismatch",
    "reference_only"
  ],
  "reason_codes": [],
  "draft_gold_reason": "企业应提供指定项目主体的 ISO/IEC 27001 证书。；来源  仅用于系统草稿观察。根据来源片段的支持范围、主体/范围和状态信息，确定性聚合结果为 NO_RELEVANT_EVIDENCE。该判断未经人工审核，不得作为正式 Gold。",
  "reviewer": null,
  "reviewed_at": null
}
```

### Human decision

- [ ] APPROVE
- [ ] CHANGE
- [ ] REJECT

Reviewer corrected status:

Reviewer corrected semantics:

Reviewer reason:

---

## V2R-007-PROJECT-STATUS

### Requirement

企业应提供已完成并可验收的同类项目记录。

- 难度：MEDIUM
- 边界：project_status、status_unknown、partial_support
- Draft aggregated status：**INSUFFICIENT_EVIDENCE**
- Draft provenance：SYSTEM_DRAFT_UNREVIEWED

### Sources

#### Source 1

- Material：project-d-fragment.md (project_case)
- Scope：ENTERPRISE_PRIVATE
- Material ID：75924286-5882-4658-bff9-ed587f70b927
- Document ID：75924286-5882-4658-bff9-ed587f70b927
- Chunk ID：MCH-3D0A254CE926B207AFC696BF46520897
- Source Span ID：ESPAN-B207B3874C1FCD381572F097CDA4BDF3
- Resolution：DERIVED_TRANSIENT_FORMAL_CONTRACT
- Verified：true

```text
# 项目D实施片段
```

### Draft semantic judgement

```json
{
  "provenance": "SYSTEM_DRAFT_UNREVIEWED",
  "reviewed": false,
  "status": "INSUFFICIENT_EVIDENCE",
  "semantic_relevance": "relevant",
  "evidence_capability": "capable",
  "support_level": "partial_support",
  "semantic_relationship": "partial",
  "boundary_tags": [
    "project_status",
    "status_unknown",
    "partial_support"
  ],
  "reason_codes": [
    "SUPPORT_INSUFFICIENT"
  ],
  "draft_gold_reason": "企业应提供已完成并可验收的同类项目记录。；来源  仅用于系统草稿观察。根据来源片段的支持范围、主体/范围和状态信息，确定性聚合结果为 INSUFFICIENT_EVIDENCE。该判断未经人工审核，不得作为正式 Gold。",
  "reviewer": null,
  "reviewed_at": null
}
```

### Human decision

- [ ] APPROVE
- [ ] CHANGE
- [ ] REJECT

Reviewer corrected status:

Reviewer corrected semantics:

Reviewer reason:

---

## V2R-008-NO-RELEVANT

### Requirement

企业应提供第三方防火墙权威检测报告扫描件。

- 难度：EASY
- 边界：no_relevant、third_party_boundary
- Draft aggregated status：**NO_RELEVANT_EVIDENCE**
- Draft provenance：SYSTEM_DRAFT_UNREVIEWED

### Sources

#### Source 1

- Material：qualification-iso27001.md (qualification)
- Scope：ENTERPRISE_PRIVATE
- Material ID：57b9e5fe-9549-42aa-88d5-fccc5c0afe2e
- Document ID：57b9e5fe-9549-42aa-88d5-fccc5c0afe2e
- Chunk ID：MCH-0820CC5A439CB986C62E46213029CC71
- Source Span ID：ESPAN-7A5D661264A0C779ED903BDF21BC9E25
- Resolution：DERIVED_TRANSIENT_FORMAL_CONTRACT
- Verified：true

```text
# ISO 27001 受控记录
```

### Draft semantic judgement

```json
{
  "provenance": "SYSTEM_DRAFT_UNREVIEWED",
  "reviewed": false,
  "status": "NO_RELEVANT_EVIDENCE",
  "semantic_relevance": "irrelevant",
  "evidence_capability": "not_capable",
  "support_level": "reference_only",
  "semantic_relationship": "unrelated",
  "boundary_tags": [
    "no_relevant",
    "third_party_boundary"
  ],
  "reason_codes": [],
  "draft_gold_reason": "企业应提供第三方防火墙权威检测报告扫描件。；来源  仅用于系统草稿观察。根据来源片段的支持范围、主体/范围和状态信息，确定性聚合结果为 NO_RELEVANT_EVIDENCE。该判断未经人工审核，不得作为正式 Gold。",
  "reviewer": null,
  "reviewed_at": null
}
```

### Human decision

- [ ] APPROVE
- [ ] CHANGE
- [ ] REJECT

Reviewer corrected status:

Reviewer corrected semantics:

Reviewer reason:

---

## V2R-009-ISO-CONFLICT

### Requirement

企业应说明当前 ISO/IEC 27001 证书的有效截止日期。

- 难度：HARD
- 边界：conflict、freshness、superseded、validity
- Draft aggregated status：**CONFLICTING_EVIDENCE**
- Draft provenance：SYSTEM_DRAFT_UNREVIEWED

### Sources

#### Source 1

- Material：qualification-iso27001.md (qualification)
- Scope：ENTERPRISE_PRIVATE
- Material ID：57b9e5fe-9549-42aa-88d5-fccc5c0afe2e
- Document ID：57b9e5fe-9549-42aa-88d5-fccc5c0afe2e
- Chunk ID：MCH-0820CC5A439CB986C62E46213029CC71
- Source Span ID：ESPAN-7A5D661264A0C779ED903BDF21BC9E25
- Resolution：DERIVED_TRANSIENT_FORMAL_CONTRACT
- Verified：true

```text
# ISO 27001 受控记录
```

#### Source 2

- Material：company-profile.md (company_profile)
- Scope：ENTERPRISE_PRIVATE
- Material ID：b96691fb-e719-4312-8ec9-a9e8acf687c0
- Document ID：b96691fb-e719-4312-8ec9-a9e8acf687c0
- Chunk ID：MCH-B2BE9E8E088E44117824E02219F50158
- Source Span ID：ESPAN-817DC81970E79F8873AC6E319F9D7E78
- Resolution：DERIVED_TRANSIENT_FORMAL_CONTRACT
- Verified：true

```text
REPRESENTATIVE_SYNTHETIC
NOT_REAL_CUSTOMER_DATA
material_id: SME-001
subject: 澄明数科（示范）有限公司
```

### Draft semantic judgement

```json
{
  "provenance": "SYSTEM_DRAFT_UNREVIEWED",
  "reviewed": false,
  "status": "CONFLICTING_EVIDENCE",
  "semantic_relevance": "relevant",
  "evidence_capability": "capable",
  "support_level": "conflict",
  "semantic_relationship": "conflict",
  "boundary_tags": [
    "conflict",
    "freshness",
    "superseded",
    "validity"
  ],
  "reason_codes": [
    "VALIDITY_MISMATCH"
  ],
  "draft_gold_reason": "企业应说明当前 ISO/IEC 27001 证书的有效截止日期。；来源 、 仅用于系统草稿观察。根据来源片段的支持范围、主体/范围和状态信息，确定性聚合结果为 CONFLICTING_EVIDENCE。该判断未经人工审核，不得作为正式 Gold。",
  "reviewer": null,
  "reviewed_at": null
}
```

### Human decision

- [ ] APPROVE
- [ ] CHANGE
- [ ] REJECT

Reviewer corrected status:

Reviewer corrected semantics:

Reviewer reason:

---

## V2R-010-CORPUS-01

### Requirement

企业应证明自身具备与该公开行业规范相符的实施能力。

- 难度：EASY
- 边界：industry_reference、enterprise_capability_boundary、scope_mismatch、third_party_boundary、freshness
- Draft aggregated status：**INSUFFICIENT_EVIDENCE**
- Draft provenance：SYSTEM_DRAFT_UNREVIEWED

### Sources

#### Source 1

- Material：中华人民共和国政府信息公开条例（官方摘录）.md (other)
- Scope：GENERAL
- Material ID：e9bcafcd-c615-4f6d-b34e-9d1ffcdfef1c
- Document ID：e9bcafcd-c615-4f6d-b34e-9d1ffcdfef1c
- Chunk ID：MCH-B349280E685FEB7ECD6B73AFFCF32228
- Source Span ID：ESPAN-F9ECC31FE4FB66EAC197B56AEF1917B9
- Resolution：DERIVED_TRANSIENT_FORMAL_CONTRACT
- Verified：true

```text
# 中华人民共和国政府信息公开条例
```

### Draft semantic judgement

```json
{
  "provenance": "SYSTEM_DRAFT_UNREVIEWED",
  "reviewed": false,
  "status": "INSUFFICIENT_EVIDENCE",
  "semantic_relevance": "relevant",
  "evidence_capability": "capable",
  "support_level": "partial_support",
  "semantic_relationship": "partial",
  "boundary_tags": [
    "industry_reference",
    "enterprise_capability_boundary",
    "scope_mismatch",
    "third_party_boundary",
    "freshness"
  ],
  "reason_codes": [
    "SUPPORT_INSUFFICIENT"
  ],
  "draft_gold_reason": "企业应证明自身具备与该公开行业规范相符的实施能力。；来源  仅用于系统草稿观察。根据来源片段的支持范围、主体/范围和状态信息，确定性聚合结果为 INSUFFICIENT_EVIDENCE。该判断未经人工审核，不得作为正式 Gold。",
  "reviewer": null,
  "reviewed_at": null
}
```

### Human decision

- [ ] APPROVE
- [ ] CHANGE
- [ ] REJECT

Reviewer corrected status:

Reviewer corrected semantics:

Reviewer reason:

---

## V2R-011-CORPUS-02

### Requirement

企业应证明自身具备与该公开行业规范相符的实施能力。

- 难度：EASY
- 边界：industry_reference、enterprise_capability_boundary、scope_mismatch
- Draft aggregated status：**INSUFFICIENT_EVIDENCE**
- Draft provenance：SYSTEM_DRAFT_UNREVIEWED

### Sources

#### Source 1

- Material：“互联网+政务服务”技术体系建设指南（官方摘录）.md (technical_whitepaper)
- Scope：GOVERNMENT_ENTERPRISE
- Material ID：eef2ae66-8259-4954-9a88-2e184411fcc5
- Document ID：eef2ae66-8259-4954-9a88-2e184411fcc5
- Chunk ID：MCH-F52FD1E6B797D05F42A8B78970237CDB
- Source Span ID：ESPAN-15A78219449E0AC4705B901BCD504BFC
- Resolution：DERIVED_TRANSIENT_FORMAL_CONTRACT
- Verified：true

```text
# “互联网+政务服务”技术体系建设指南
```

### Draft semantic judgement

```json
{
  "provenance": "SYSTEM_DRAFT_UNREVIEWED",
  "reviewed": false,
  "status": "INSUFFICIENT_EVIDENCE",
  "semantic_relevance": "relevant",
  "evidence_capability": "capable",
  "support_level": "partial_support",
  "semantic_relationship": "partial",
  "boundary_tags": [
    "industry_reference",
    "enterprise_capability_boundary",
    "scope_mismatch"
  ],
  "reason_codes": [
    "SUPPORT_INSUFFICIENT"
  ],
  "draft_gold_reason": "企业应证明自身具备与该公开行业规范相符的实施能力。；来源  仅用于系统草稿观察。根据来源片段的支持范围、主体/范围和状态信息，确定性聚合结果为 INSUFFICIENT_EVIDENCE。该判断未经人工审核，不得作为正式 Gold。",
  "reviewer": null,
  "reviewed_at": null
}
```

### Human decision

- [ ] APPROVE
- [ ] CHANGE
- [ ] REJECT

Reviewer corrected status:

Reviewer corrected semantics:

Reviewer reason:

---

## V2R-012-CORPUS-03

### Requirement

企业应证明自身具备与该公开行业规范相符的实施能力。

- 难度：EASY
- 边界：industry_reference、enterprise_capability_boundary、scope_mismatch
- Draft aggregated status：**INSUFFICIENT_EVIDENCE**
- Draft provenance：SYSTEM_DRAFT_UNREVIEWED

### Sources

#### Source 1

- Material：三级医院评审标准（2025年版）（官方摘录）.md (technical_whitepaper)
- Scope：HEALTHCARE
- Material ID：ec1512cf-8424-4e7d-a116-8acb41240cac
- Document ID：ec1512cf-8424-4e7d-a116-8acb41240cac
- Chunk ID：MCH-9D4817BA134042FEF2F0CF93BAF9A4E7
- Source Span ID：ESPAN-E01D0D17004F2AF4812F87ECED92E6FA
- Resolution：DERIVED_TRANSIENT_FORMAL_CONTRACT
- Verified：true

```text
# 三级医院评审标准（2025年版）
```

### Draft semantic judgement

```json
{
  "provenance": "SYSTEM_DRAFT_UNREVIEWED",
  "reviewed": false,
  "status": "INSUFFICIENT_EVIDENCE",
  "semantic_relevance": "relevant",
  "evidence_capability": "capable",
  "support_level": "partial_support",
  "semantic_relationship": "partial",
  "boundary_tags": [
    "industry_reference",
    "enterprise_capability_boundary",
    "scope_mismatch"
  ],
  "reason_codes": [
    "SUPPORT_INSUFFICIENT"
  ],
  "draft_gold_reason": "企业应证明自身具备与该公开行业规范相符的实施能力。；来源  仅用于系统草稿观察。根据来源片段的支持范围、主体/范围和状态信息，确定性聚合结果为 INSUFFICIENT_EVIDENCE。该判断未经人工审核，不得作为正式 Gold。",
  "reviewer": null,
  "reviewed_at": null
}
```

### Human decision

- [ ] APPROVE
- [ ] CHANGE
- [ ] REJECT

Reviewer corrected status:

Reviewer corrected semantics:

Reviewer reason:

---

## V2R-013-CORPUS-04

### Requirement

企业应提供与本项目范围相关的可核验材料。

- 难度：EASY
- 边界：scope_mismatch、multiple_weak_evidence
- Draft aggregated status：**INSUFFICIENT_EVIDENCE**
- Draft provenance：SYSTEM_DRAFT_UNREVIEWED

### Sources

#### Source 1

- Material：authorization-partner.md (other)
- Scope：ENTERPRISE_PRIVATE
- Material ID：9876da6b-40c1-4f2d-b47b-290c7c150f4e
- Document ID：9876da6b-40c1-4f2d-b47b-290c7c150f4e
- Chunk ID：MCH-465F4A14FE03A088093248F73D1E8705
- Source Span ID：ESPAN-12CFF5156B4CC1C39E853B7622CC3962
- Resolution：DERIVED_TRANSIENT_FORMAL_CONTRACT
- Verified：true

```text
SYNTHETIC_TEST_MATERIAL=true
NOT_REAL_CUSTOMER_DATA=true
subject: 杭州景云数科有限公司
source_type: synthetic_controlled
source_org: 杭州景云数科有限公司（虚构测试企业）
license_or_usage_status: INTERNAL_TEST_ONLY
material_id: L3-ENT-012
scope: enterprise
industry: 政企平台
material_type: authorization
review_status: approved
```

### Draft semantic judgement

```json
{
  "provenance": "SYSTEM_DRAFT_UNREVIEWED",
  "reviewed": false,
  "status": "INSUFFICIENT_EVIDENCE",
  "semantic_relevance": "relevant",
  "evidence_capability": "capable",
  "support_level": "partial_support",
  "semantic_relationship": "partial",
  "boundary_tags": [
    "scope_mismatch",
    "multiple_weak_evidence"
  ],
  "reason_codes": [
    "SUPPORT_INSUFFICIENT"
  ],
  "draft_gold_reason": "企业应提供与本项目范围相关的可核验材料。；来源  仅用于系统草稿观察。根据来源片段的支持范围、主体/范围和状态信息，确定性聚合结果为 INSUFFICIENT_EVIDENCE。该判断未经人工审核，不得作为正式 Gold。",
  "reviewer": null,
  "reviewed_at": null
}
```

### Human decision

- [ ] APPROVE
- [ ] CHANGE
- [ ] REJECT

Reviewer corrected status:

Reviewer corrected semantics:

Reviewer reason:

---

## V2R-014-CORPUS-05

### Requirement

企业应证明自身具备与该公开行业规范相符的实施能力。

- 难度：EASY
- 边界：industry_reference、enterprise_capability_boundary、scope_mismatch
- Draft aggregated status：**INSUFFICIENT_EVIDENCE**
- Draft provenance：SYSTEM_DRAFT_UNREVIEWED

### Sources

#### Source 1

- Material：中华人民共和国政府信息公开条例（官方摘录）.md (other)
- Scope：GENERAL
- Material ID：e9bcafcd-c615-4f6d-b34e-9d1ffcdfef1c
- Document ID：e9bcafcd-c615-4f6d-b34e-9d1ffcdfef1c
- Chunk ID：MCH-C4F8AAA8F03FACF305E84D1E1A82D11A
- Source Span ID：ESPAN-4AC580167955E80A06F8C515E8D65B1E
- Resolution：DERIVED_TRANSIENT_FORMAL_CONTRACT
- Verified：true

```text
来源机构：国务院
文号：国务院令第711号
```

### Draft semantic judgement

```json
{
  "provenance": "SYSTEM_DRAFT_UNREVIEWED",
  "reviewed": false,
  "status": "INSUFFICIENT_EVIDENCE",
  "semantic_relevance": "relevant",
  "evidence_capability": "capable",
  "support_level": "partial_support",
  "semantic_relationship": "partial",
  "boundary_tags": [
    "industry_reference",
    "enterprise_capability_boundary",
    "scope_mismatch"
  ],
  "reason_codes": [
    "SUPPORT_INSUFFICIENT"
  ],
  "draft_gold_reason": "企业应证明自身具备与该公开行业规范相符的实施能力。；来源  仅用于系统草稿观察。根据来源片段的支持范围、主体/范围和状态信息，确定性聚合结果为 INSUFFICIENT_EVIDENCE。该判断未经人工审核，不得作为正式 Gold。",
  "reviewer": null,
  "reviewed_at": null
}
```

### Human decision

- [ ] APPROVE
- [ ] CHANGE
- [ ] REJECT

Reviewer corrected status:

Reviewer corrected semantics:

Reviewer reason:

---

## V2R-015-CORPUS-06

### Requirement

企业应证明自身具备与该公开行业规范相符的实施能力。

- 难度：EASY
- 边界：industry_reference、enterprise_capability_boundary、scope_mismatch、no_relevant
- Draft aggregated status：**NO_RELEVANT_EVIDENCE**
- Draft provenance：SYSTEM_DRAFT_UNREVIEWED

### Sources

#### Source 1

- Material：“互联网+政务服务”技术体系建设指南（官方摘录）.md (technical_whitepaper)
- Scope：GOVERNMENT_ENTERPRISE
- Material ID：eef2ae66-8259-4954-9a88-2e184411fcc5
- Document ID：eef2ae66-8259-4954-9a88-2e184411fcc5
- Chunk ID：MCH-F4CD0E67DBD66EC447EF06D0EDBB083A
- Source Span ID：ESPAN-9364092E47249D44F9B86C33FB712A84
- Resolution：DERIVED_TRANSIENT_FORMAL_CONTRACT
- Verified：true

```text
来源机构：国务院办公厅
文号：国办函〔2016〕108号
```

### Draft semantic judgement

```json
{
  "provenance": "SYSTEM_DRAFT_UNREVIEWED",
  "reviewed": false,
  "status": "NO_RELEVANT_EVIDENCE",
  "semantic_relevance": "irrelevant",
  "evidence_capability": "not_capable",
  "support_level": "reference_only",
  "semantic_relationship": "unrelated",
  "boundary_tags": [
    "industry_reference",
    "enterprise_capability_boundary",
    "scope_mismatch",
    "no_relevant"
  ],
  "reason_codes": [],
  "draft_gold_reason": "企业应证明自身具备与该公开行业规范相符的实施能力。；来源  仅用于系统草稿观察。根据来源片段的支持范围、主体/范围和状态信息，确定性聚合结果为 NO_RELEVANT_EVIDENCE。该判断未经人工审核，不得作为正式 Gold。",
  "reviewer": null,
  "reviewed_at": null
}
```

### Human decision

- [ ] APPROVE
- [ ] CHANGE
- [ ] REJECT

Reviewer corrected status:

Reviewer corrected semantics:

Reviewer reason:

---

## V2R-016-CORPUS-07

### Requirement

企业应证明自身具备与该公开行业规范相符的实施能力。

- 难度：EASY
- 边界：industry_reference、enterprise_capability_boundary、scope_mismatch
- Draft aggregated status：**INSUFFICIENT_EVIDENCE**
- Draft provenance：SYSTEM_DRAFT_UNREVIEWED

### Sources

#### Source 1

- Material：三级医院评审标准（2025年版）（官方摘录）.md (technical_whitepaper)
- Scope：HEALTHCARE
- Material ID：ec1512cf-8424-4e7d-a116-8acb41240cac
- Document ID：ec1512cf-8424-4e7d-a116-8acb41240cac
- Chunk ID：MCH-0885ECB0FC777B2F33B1B40E8D0E6F5D
- Source Span ID：ESPAN-11990996B409AFBD49EDED933A22CC78
- Resolution：DERIVED_TRANSIENT_FORMAL_CONTRACT
- Verified：true

```text
来源机构：国家卫生健康委员会
文号：国卫医政发〔2025〕4号
```

### Draft semantic judgement

```json
{
  "provenance": "SYSTEM_DRAFT_UNREVIEWED",
  "reviewed": false,
  "status": "INSUFFICIENT_EVIDENCE",
  "semantic_relevance": "relevant",
  "evidence_capability": "capable",
  "support_level": "partial_support",
  "semantic_relationship": "partial",
  "boundary_tags": [
    "industry_reference",
    "enterprise_capability_boundary",
    "scope_mismatch"
  ],
  "reason_codes": [
    "SUPPORT_INSUFFICIENT"
  ],
  "draft_gold_reason": "企业应证明自身具备与该公开行业规范相符的实施能力。；来源  仅用于系统草稿观察。根据来源片段的支持范围、主体/范围和状态信息，确定性聚合结果为 INSUFFICIENT_EVIDENCE。该判断未经人工审核，不得作为正式 Gold。",
  "reviewer": null,
  "reviewed_at": null
}
```

### Human decision

- [ ] APPROVE
- [ ] CHANGE
- [ ] REJECT

Reviewer corrected status:

Reviewer corrected semantics:

Reviewer reason:

---

## V2R-017-CORPUS-08

### Requirement

企业应提供与本项目范围相关的可核验材料。

- 难度：EASY
- 边界：scope_mismatch、multiple_weak_evidence、third_party_boundary
- Draft aggregated status：**INSUFFICIENT_EVIDENCE**
- Draft provenance：SYSTEM_DRAFT_UNREVIEWED

### Sources

#### Source 1

- Material：authorization-partner.md (other)
- Scope：ENTERPRISE_PRIVATE
- Material ID：9876da6b-40c1-4f2d-b47b-290c7c150f4e
- Document ID：9876da6b-40c1-4f2d-b47b-290c7c150f4e
- Chunk ID：MCH-9FDF20160FF141120F9E5BF6E15F46E4
- Source Span ID：ESPAN-8DABDEFB5E42E9EE9FC3A1C739F59CA4
- Resolution：DERIVED_TRANSIENT_FORMAL_CONTRACT
- Verified：true

```text
# 第三方产品授权说明
```

### Draft semantic judgement

```json
{
  "provenance": "SYSTEM_DRAFT_UNREVIEWED",
  "reviewed": false,
  "status": "INSUFFICIENT_EVIDENCE",
  "semantic_relevance": "relevant",
  "evidence_capability": "capable",
  "support_level": "partial_support",
  "semantic_relationship": "partial",
  "boundary_tags": [
    "scope_mismatch",
    "multiple_weak_evidence",
    "third_party_boundary"
  ],
  "reason_codes": [
    "SUPPORT_INSUFFICIENT"
  ],
  "draft_gold_reason": "企业应提供与本项目范围相关的可核验材料。；来源  仅用于系统草稿观察。根据来源片段的支持范围、主体/范围和状态信息，确定性聚合结果为 INSUFFICIENT_EVIDENCE。该判断未经人工审核，不得作为正式 Gold。",
  "reviewer": null,
  "reviewed_at": null
}
```

### Human decision

- [ ] APPROVE
- [ ] CHANGE
- [ ] REJECT

Reviewer corrected status:

Reviewer corrected semantics:

Reviewer reason:

---

## V2R-018-CORPUS-09

### Requirement

企业应证明自身具备与该公开行业规范相符的实施能力。

- 难度：MEDIUM
- 边界：industry_reference、enterprise_capability_boundary、scope_mismatch
- Draft aggregated status：**INSUFFICIENT_EVIDENCE**
- Draft provenance：SYSTEM_DRAFT_UNREVIEWED

### Sources

#### Source 1

- Material：中华人民共和国政府信息公开条例（官方摘录）.md (other)
- Scope：GENERAL
- Material ID：e9bcafcd-c615-4f6d-b34e-9d1ffcdfef1c
- Document ID：e9bcafcd-c615-4f6d-b34e-9d1ffcdfef1c
- Chunk ID：MCH-14B0FC833B35B965E3E60779BDAFFEB2
- Source Span ID：ESPAN-5105D1E484AE08248E1CC6E44B9F2D4B
- Resolution：DERIVED_TRANSIENT_FORMAL_CONTRACT
- Verified：true

```text
条例明确政府信息的范围和公开原则，要求行政机关主动公开、依法答复并保障公众获取政府信息。
```

### Draft semantic judgement

```json
{
  "provenance": "SYSTEM_DRAFT_UNREVIEWED",
  "reviewed": false,
  "status": "INSUFFICIENT_EVIDENCE",
  "semantic_relevance": "relevant",
  "evidence_capability": "capable",
  "support_level": "partial_support",
  "semantic_relationship": "partial",
  "boundary_tags": [
    "industry_reference",
    "enterprise_capability_boundary",
    "scope_mismatch"
  ],
  "reason_codes": [
    "SUPPORT_INSUFFICIENT"
  ],
  "draft_gold_reason": "企业应证明自身具备与该公开行业规范相符的实施能力。；来源  仅用于系统草稿观察。根据来源片段的支持范围、主体/范围和状态信息，确定性聚合结果为 INSUFFICIENT_EVIDENCE。该判断未经人工审核，不得作为正式 Gold。",
  "reviewer": null,
  "reviewed_at": null
}
```

### Human decision

- [ ] APPROVE
- [ ] CHANGE
- [ ] REJECT

Reviewer corrected status:

Reviewer corrected semantics:

Reviewer reason:

---

## V2R-019-CORPUS-10

### Requirement

企业应证明自身具备与该公开行业规范相符的实施能力。

- 难度：MEDIUM
- 边界：industry_reference、enterprise_capability_boundary、scope_mismatch、freshness
- Draft aggregated status：**INSUFFICIENT_EVIDENCE**
- Draft provenance：SYSTEM_DRAFT_UNREVIEWED

### Sources

#### Source 1

- Material：“互联网+政务服务”技术体系建设指南（官方摘录）.md (technical_whitepaper)
- Scope：GOVERNMENT_ENTERPRISE
- Material ID：eef2ae66-8259-4954-9a88-2e184411fcc5
- Document ID：eef2ae66-8259-4954-9a88-2e184411fcc5
- Chunk ID：MCH-C327D3EAD9FC460F07059B7F11323BDB
- Source Span ID：ESPAN-32F52CE708CC106C1D0717D41BD765FF
- Resolution：DERIVED_TRANSIENT_FORMAL_CONTRACT
- Verified：true

```text
指南提出统一政务服务信息资源目录、交换体系和平台支撑，推动跨部门数据共享与服务协同。
```

### Draft semantic judgement

```json
{
  "provenance": "SYSTEM_DRAFT_UNREVIEWED",
  "reviewed": false,
  "status": "INSUFFICIENT_EVIDENCE",
  "semantic_relevance": "relevant",
  "evidence_capability": "capable",
  "support_level": "partial_support",
  "semantic_relationship": "partial",
  "boundary_tags": [
    "industry_reference",
    "enterprise_capability_boundary",
    "scope_mismatch",
    "freshness"
  ],
  "reason_codes": [
    "SUPPORT_INSUFFICIENT"
  ],
  "draft_gold_reason": "企业应证明自身具备与该公开行业规范相符的实施能力。；来源  仅用于系统草稿观察。根据来源片段的支持范围、主体/范围和状态信息，确定性聚合结果为 INSUFFICIENT_EVIDENCE。该判断未经人工审核，不得作为正式 Gold。",
  "reviewer": null,
  "reviewed_at": null
}
```

### Human decision

- [ ] APPROVE
- [ ] CHANGE
- [ ] REJECT

Reviewer corrected status:

Reviewer corrected semantics:

Reviewer reason:

---

## V2R-020-CORPUS-11

### Requirement

企业应证明自身具备与该公开行业规范相符的实施能力。

- 难度：MEDIUM
- 边界：industry_reference、enterprise_capability_boundary、scope_mismatch
- Draft aggregated status：**INSUFFICIENT_EVIDENCE**
- Draft provenance：SYSTEM_DRAFT_UNREVIEWED

### Sources

#### Source 1

- Material：三级医院评审标准（2025年版）（官方摘录）.md (technical_whitepaper)
- Scope：HEALTHCARE
- Material ID：ec1512cf-8424-4e7d-a116-8acb41240cac
- Document ID：ec1512cf-8424-4e7d-a116-8acb41240cac
- Chunk ID：MCH-691F11C92C9C6B6ADBA2A616E43132FC
- Source Span ID：ESPAN-B62FED9C567FB22CA6249D5DFEBC07EB
- Resolution：DERIVED_TRANSIENT_FORMAL_CONTRACT
- Verified：true

```text
标准完善三级医院功能定位、医疗管理和质量安全评审要求，强调依法规范执业和公益性责任。
```

### Draft semantic judgement

```json
{
  "provenance": "SYSTEM_DRAFT_UNREVIEWED",
  "reviewed": false,
  "status": "INSUFFICIENT_EVIDENCE",
  "semantic_relevance": "relevant",
  "evidence_capability": "capable",
  "support_level": "partial_support",
  "semantic_relationship": "partial",
  "boundary_tags": [
    "industry_reference",
    "enterprise_capability_boundary",
    "scope_mismatch"
  ],
  "reason_codes": [
    "SUPPORT_INSUFFICIENT"
  ],
  "draft_gold_reason": "企业应证明自身具备与该公开行业规范相符的实施能力。；来源  仅用于系统草稿观察。根据来源片段的支持范围、主体/范围和状态信息，确定性聚合结果为 INSUFFICIENT_EVIDENCE。该判断未经人工审核，不得作为正式 Gold。",
  "reviewer": null,
  "reviewed_at": null
}
```

### Human decision

- [ ] APPROVE
- [ ] CHANGE
- [ ] REJECT

Reviewer corrected status:

Reviewer corrected semantics:

Reviewer reason:

---

## V2R-021-CORPUS-12

### Requirement

企业应提供与本项目范围相关的可核验材料。

- 难度：MEDIUM
- 边界：scope_mismatch、multiple_weak_evidence
- Draft aggregated status：**INSUFFICIENT_EVIDENCE**
- Draft provenance：SYSTEM_DRAFT_UNREVIEWED

### Sources

#### Source 1

- Material：authorization-partner.md (other)
- Scope：ENTERPRISE_PRIVATE
- Material ID：9876da6b-40c1-4f2d-b47b-290c7c150f4e
- Document ID：9876da6b-40c1-4f2d-b47b-290c7c150f4e
- Chunk ID：MCH-A4211A94C5C7A077F478D979A3ADF86E
- Source Span ID：ESPAN-403BC1522544E742C897D863B1EB8955
- Resolution：DERIVED_TRANSIENT_FORMAL_CONTRACT
- Verified：true

```text
平台可集成某开源数据库和消息组件；部署、许可和技术支持依赖第三方，企业不将第三方能力表述为自有产品能力。
```

### Draft semantic judgement

```json
{
  "provenance": "SYSTEM_DRAFT_UNREVIEWED",
  "reviewed": false,
  "status": "INSUFFICIENT_EVIDENCE",
  "semantic_relevance": "relevant",
  "evidence_capability": "capable",
  "support_level": "partial_support",
  "semantic_relationship": "partial",
  "boundary_tags": [
    "scope_mismatch",
    "multiple_weak_evidence"
  ],
  "reason_codes": [
    "SUPPORT_INSUFFICIENT"
  ],
  "draft_gold_reason": "企业应提供与本项目范围相关的可核验材料。；来源  仅用于系统草稿观察。根据来源片段的支持范围、主体/范围和状态信息，确定性聚合结果为 INSUFFICIENT_EVIDENCE。该判断未经人工审核，不得作为正式 Gold。",
  "reviewer": null,
  "reviewed_at": null
}
```

### Human decision

- [ ] APPROVE
- [ ] CHANGE
- [ ] REJECT

Reviewer corrected status:

Reviewer corrected semantics:

Reviewer reason:

---

## V2R-022-CORPUS-13

### Requirement

企业应证明自身具备与该公开行业规范相符的实施能力。

- 难度：MEDIUM
- 边界：industry_reference、enterprise_capability_boundary、scope_mismatch
- Draft aggregated status：**INSUFFICIENT_EVIDENCE**
- Draft provenance：SYSTEM_DRAFT_UNREVIEWED

### Sources

#### Source 1

- Material：全国一体化政务大数据体系建设指南（官方摘录）.md (technical_whitepaper)
- Scope：GOVERNMENT_ENTERPRISE
- Material ID：059bfd18-afbe-4e1d-968c-2d68c02fa3f8
- Document ID：059bfd18-afbe-4e1d-968c-2d68c02fa3f8
- Chunk ID：MCH-DBAF15A745A323E679E8E5C19D2EFDBA
- Source Span ID：ESPAN-1C274C4A97DEED831F45613B4C86A55B
- Resolution：DERIVED_TRANSIENT_FORMAL_CONTRACT
- Verified：true

```text
# 全国一体化政务大数据体系建设指南
```

### Draft semantic judgement

```json
{
  "provenance": "SYSTEM_DRAFT_UNREVIEWED",
  "reviewed": false,
  "status": "INSUFFICIENT_EVIDENCE",
  "semantic_relevance": "relevant",
  "evidence_capability": "capable",
  "support_level": "partial_support",
  "semantic_relationship": "partial",
  "boundary_tags": [
    "industry_reference",
    "enterprise_capability_boundary",
    "scope_mismatch"
  ],
  "reason_codes": [
    "SUPPORT_INSUFFICIENT"
  ],
  "draft_gold_reason": "企业应证明自身具备与该公开行业规范相符的实施能力。；来源  仅用于系统草稿观察。根据来源片段的支持范围、主体/范围和状态信息，确定性聚合结果为 INSUFFICIENT_EVIDENCE。该判断未经人工审核，不得作为正式 Gold。",
  "reviewer": null,
  "reviewed_at": null
}
```

### Human decision

- [ ] APPROVE
- [ ] CHANGE
- [ ] REJECT

Reviewer corrected status:

Reviewer corrected semantics:

Reviewer reason:

---

## V2R-023-CORPUS-14

### Requirement

企业应证明自身具备与该公开行业规范相符的实施能力。

- 难度：MEDIUM
- 边界：industry_reference、enterprise_capability_boundary、scope_mismatch
- Draft aggregated status：**INSUFFICIENT_EVIDENCE**
- Draft provenance：SYSTEM_DRAFT_UNREVIEWED

### Sources

#### Source 1

- Material：互联网诊疗监管细则（试行）（官方摘录）.md (other)
- Scope：HEALTHCARE
- Material ID：18a60d26-78b3-44c9-ac86-8c7231597880
- Document ID：18a60d26-78b3-44c9-ac86-8c7231597880
- Chunk ID：MCH-0225B5EF47B634686F6C0A815D0A22F0
- Source Span ID：ESPAN-38EB4426D29B66DA64048549D4188CE8
- Resolution：DERIVED_TRANSIENT_FORMAL_CONTRACT
- Verified：true

```text
# 互联网诊疗监管细则（试行）
```

### Draft semantic judgement

```json
{
  "provenance": "SYSTEM_DRAFT_UNREVIEWED",
  "reviewed": false,
  "status": "INSUFFICIENT_EVIDENCE",
  "semantic_relevance": "relevant",
  "evidence_capability": "capable",
  "support_level": "partial_support",
  "semantic_relationship": "partial",
  "boundary_tags": [
    "industry_reference",
    "enterprise_capability_boundary",
    "scope_mismatch"
  ],
  "reason_codes": [
    "SUPPORT_INSUFFICIENT"
  ],
  "draft_gold_reason": "企业应证明自身具备与该公开行业规范相符的实施能力。；来源  仅用于系统草稿观察。根据来源片段的支持范围、主体/范围和状态信息，确定性聚合结果为 INSUFFICIENT_EVIDENCE。该判断未经人工审核，不得作为正式 Gold。",
  "reviewer": null,
  "reviewed_at": null
}
```

### Human decision

- [ ] APPROVE
- [ ] CHANGE
- [ ] REJECT

Reviewer corrected status:

Reviewer corrected semantics:

Reviewer reason:

---

## V2R-024-CORPUS-15

### Requirement

企业应提供同类项目的实施及验收依据。

- 难度：MEDIUM
- 边界：project_experience、status_unknown、responsibility_boundary、third_party_boundary
- Draft aggregated status：**INSUFFICIENT_EVIDENCE**
- Draft provenance：SYSTEM_DRAFT_UNREVIEWED

### Sources

#### Source 1

- Material：case-city-governance.md (project_case)
- Scope：ENTERPRISE_PRIVATE
- Material ID：50467edc-0a5e-458f-ba69-1bbf488a115a
- Document ID：50467edc-0a5e-458f-ba69-1bbf488a115a
- Chunk ID：MCH-DE72D8B87BB33D46100D0F2612B7C130
- Source Span ID：ESPAN-3309A9E010D8E2060C639B659829A331
- Resolution：DERIVED_TRANSIENT_FORMAL_CONTRACT
- Verified：true

```text
SYNTHETIC_TEST_MATERIAL=true
NOT_REAL_CUSTOMER_DATA=true
subject: 杭州景云数科有限公司
source_type: synthetic_controlled
source_org: 杭州景云数科有限公司（虚构测试企业）
license_or_usage_status: INTERNAL_TEST_ONLY
material_id: L3-ENT-004
scope: enterprise
industry: 政企平台
material_type: case
review_status: approved
```

### Draft semantic judgement

```json
{
  "provenance": "SYSTEM_DRAFT_UNREVIEWED",
  "reviewed": false,
  "status": "INSUFFICIENT_EVIDENCE",
  "semantic_relevance": "relevant",
  "evidence_capability": "capable",
  "support_level": "partial_support",
  "semantic_relationship": "partial",
  "boundary_tags": [
    "project_experience",
    "status_unknown",
    "responsibility_boundary",
    "third_party_boundary"
  ],
  "reason_codes": [
    "SUPPORT_INSUFFICIENT"
  ],
  "draft_gold_reason": "企业应提供同类项目的实施及验收依据。；来源  仅用于系统草稿观察。根据来源片段的支持范围、主体/范围和状态信息，确定性聚合结果为 INSUFFICIENT_EVIDENCE。该判断未经人工审核，不得作为正式 Gold。",
  "reviewer": null,
  "reviewed_at": null
}
```

### Human decision

- [ ] APPROVE
- [ ] CHANGE
- [ ] REJECT

Reviewer corrected status:

Reviewer corrected semantics:

Reviewer reason:

---

## V2R-025-CORPUS-16

### Requirement

企业应证明自身具备与该公开行业规范相符的实施能力。

- 难度：MEDIUM
- 边界：industry_reference、enterprise_capability_boundary、scope_mismatch
- Draft aggregated status：**INSUFFICIENT_EVIDENCE**
- Draft provenance：SYSTEM_DRAFT_UNREVIEWED

### Sources

#### Source 1

- Material：全国一体化政务大数据体系建设指南（官方摘录）.md (technical_whitepaper)
- Scope：GOVERNMENT_ENTERPRISE
- Material ID：059bfd18-afbe-4e1d-968c-2d68c02fa3f8
- Document ID：059bfd18-afbe-4e1d-968c-2d68c02fa3f8
- Chunk ID：MCH-B08D31EEA8B5FEB387C866F6B4457D4A
- Source Span ID：ESPAN-C132198534BD5E1DB0772F0FA2FBCB89
- Resolution：DERIVED_TRANSIENT_FORMAL_CONTRACT
- Verified：true

```text
来源机构：国务院办公厅
文号：国办函〔2022〕102号
```

### Draft semantic judgement

```json
{
  "provenance": "SYSTEM_DRAFT_UNREVIEWED",
  "reviewed": false,
  "status": "INSUFFICIENT_EVIDENCE",
  "semantic_relevance": "relevant",
  "evidence_capability": "capable",
  "support_level": "partial_support",
  "semantic_relationship": "partial",
  "boundary_tags": [
    "industry_reference",
    "enterprise_capability_boundary",
    "scope_mismatch"
  ],
  "reason_codes": [
    "SUPPORT_INSUFFICIENT"
  ],
  "draft_gold_reason": "企业应证明自身具备与该公开行业规范相符的实施能力。；来源  仅用于系统草稿观察。根据来源片段的支持范围、主体/范围和状态信息，确定性聚合结果为 INSUFFICIENT_EVIDENCE。该判断未经人工审核，不得作为正式 Gold。",
  "reviewer": null,
  "reviewed_at": null
}
```

### Human decision

- [ ] APPROVE
- [ ] CHANGE
- [ ] REJECT

Reviewer corrected status:

Reviewer corrected semantics:

Reviewer reason:

---

## V2R-026-CORPUS-17

### Requirement

企业应证明自身具备与该公开行业规范相符的实施能力。

- 难度：MEDIUM
- 边界：industry_reference、enterprise_capability_boundary、scope_mismatch
- Draft aggregated status：**INSUFFICIENT_EVIDENCE**
- Draft provenance：SYSTEM_DRAFT_UNREVIEWED

### Sources

#### Source 1

- Material：互联网诊疗监管细则（试行）（官方摘录）.md (other)
- Scope：HEALTHCARE
- Material ID：18a60d26-78b3-44c9-ac86-8c7231597880
- Document ID：18a60d26-78b3-44c9-ac86-8c7231597880
- Chunk ID：MCH-C7A24BE8B86CB54E8243DCFD3CDC7CAF
- Source Span ID：ESPAN-08528C838D151181E13346802E0E8CA0
- Resolution：DERIVED_TRANSIENT_FORMAL_CONTRACT
- Verified：true

```text
来源机构：国家卫生健康委员会办公厅、国家中医药局办公室
文号：无
```

### Draft semantic judgement

```json
{
  "provenance": "SYSTEM_DRAFT_UNREVIEWED",
  "reviewed": false,
  "status": "INSUFFICIENT_EVIDENCE",
  "semantic_relevance": "relevant",
  "evidence_capability": "capable",
  "support_level": "partial_support",
  "semantic_relationship": "partial",
  "boundary_tags": [
    "industry_reference",
    "enterprise_capability_boundary",
    "scope_mismatch"
  ],
  "reason_codes": [
    "SUPPORT_INSUFFICIENT"
  ],
  "draft_gold_reason": "企业应证明自身具备与该公开行业规范相符的实施能力。；来源  仅用于系统草稿观察。根据来源片段的支持范围、主体/范围和状态信息，确定性聚合结果为 INSUFFICIENT_EVIDENCE。该判断未经人工审核，不得作为正式 Gold。",
  "reviewer": null,
  "reviewed_at": null
}
```

### Human decision

- [ ] APPROVE
- [ ] CHANGE
- [ ] REJECT

Reviewer corrected status:

Reviewer corrected semantics:

Reviewer reason:

---

## V2R-027-CORPUS-18

### Requirement

企业应提供同类项目的实施及验收依据。

- 难度：MEDIUM
- 边界：project_experience、status_unknown、responsibility_boundary
- Draft aggregated status：**INSUFFICIENT_EVIDENCE**
- Draft provenance：SYSTEM_DRAFT_UNREVIEWED

### Sources

#### Source 1

- Material：case-city-governance.md (project_case)
- Scope：ENTERPRISE_PRIVATE
- Material ID：50467edc-0a5e-458f-ba69-1bbf488a115a
- Document ID：50467edc-0a5e-458f-ba69-1bbf488a115a
- Chunk ID：MCH-6B18A8383C12FE849DCEA4EC3BF21E9B
- Source Span ID：ESPAN-1411207EEEF780114EB45348674B6ECF
- Resolution：DERIVED_TRANSIENT_FORMAL_CONTRACT
- Verified：true

```text
# 城市治理数据平台案例
```

### Draft semantic judgement

```json
{
  "provenance": "SYSTEM_DRAFT_UNREVIEWED",
  "reviewed": false,
  "status": "INSUFFICIENT_EVIDENCE",
  "semantic_relevance": "relevant",
  "evidence_capability": "capable",
  "support_level": "partial_support",
  "semantic_relationship": "partial",
  "boundary_tags": [
    "project_experience",
    "status_unknown",
    "responsibility_boundary"
  ],
  "reason_codes": [
    "SUPPORT_INSUFFICIENT"
  ],
  "draft_gold_reason": "企业应提供同类项目的实施及验收依据。；来源  仅用于系统草稿观察。根据来源片段的支持范围、主体/范围和状态信息，确定性聚合结果为 INSUFFICIENT_EVIDENCE。该判断未经人工审核，不得作为正式 Gold。",
  "reviewer": null,
  "reviewed_at": null
}
```

### Human decision

- [ ] APPROVE
- [ ] CHANGE
- [ ] REJECT

Reviewer corrected status:

Reviewer corrected semantics:

Reviewer reason:

---

## V2R-028-CORPUS-19

### Requirement

企业应证明自身具备与该公开行业规范相符的实施能力。

- 难度：MEDIUM
- 边界：industry_reference、enterprise_capability_boundary、scope_mismatch、freshness
- Draft aggregated status：**INSUFFICIENT_EVIDENCE**
- Draft provenance：SYSTEM_DRAFT_UNREVIEWED

### Sources

#### Source 1

- Material：全国一体化政务大数据体系建设指南（官方摘录）.md (technical_whitepaper)
- Scope：GOVERNMENT_ENTERPRISE
- Material ID：059bfd18-afbe-4e1d-968c-2d68c02fa3f8
- Document ID：059bfd18-afbe-4e1d-968c-2d68c02fa3f8
- Chunk ID：MCH-D4B6B49E0887CDE6B9D4B01706D155CD
- Source Span ID：ESPAN-E82E4F849BBE646FEB43CBD805D0DC1D
- Resolution：DERIVED_TRANSIENT_FORMAL_CONTRACT
- Verified：true

```text
指南要求建设标准统一、管理协同、安全可靠的政务大数据体系，推进数据目录、归集、共享、开放和全生命周期安全。
```

### Draft semantic judgement

```json
{
  "provenance": "SYSTEM_DRAFT_UNREVIEWED",
  "reviewed": false,
  "status": "INSUFFICIENT_EVIDENCE",
  "semantic_relevance": "relevant",
  "evidence_capability": "capable",
  "support_level": "partial_support",
  "semantic_relationship": "partial",
  "boundary_tags": [
    "industry_reference",
    "enterprise_capability_boundary",
    "scope_mismatch",
    "freshness"
  ],
  "reason_codes": [
    "SUPPORT_INSUFFICIENT"
  ],
  "draft_gold_reason": "企业应证明自身具备与该公开行业规范相符的实施能力。；来源  仅用于系统草稿观察。根据来源片段的支持范围、主体/范围和状态信息，确定性聚合结果为 INSUFFICIENT_EVIDENCE。该判断未经人工审核，不得作为正式 Gold。",
  "reviewer": null,
  "reviewed_at": null
}
```

### Human decision

- [ ] APPROVE
- [ ] CHANGE
- [ ] REJECT

Reviewer corrected status:

Reviewer corrected semantics:

Reviewer reason:

---

## V2R-029-CORPUS-20

### Requirement

企业应证明自身具备与该公开行业规范相符的实施能力。

- 难度：MEDIUM
- 边界：industry_reference、enterprise_capability_boundary、scope_mismatch
- Draft aggregated status：**INSUFFICIENT_EVIDENCE**
- Draft provenance：SYSTEM_DRAFT_UNREVIEWED

### Sources

#### Source 1

- Material：互联网诊疗监管细则（试行）（官方摘录）.md (other)
- Scope：HEALTHCARE
- Material ID：18a60d26-78b3-44c9-ac86-8c7231597880
- Document ID：18a60d26-78b3-44c9-ac86-8c7231597880
- Chunk ID：MCH-F00AE9B8C12B0C262DC8C83F61E4F7A5
- Source Span ID：ESPAN-FF6893D9F4DADADB1024D82CB145F1A7
- Resolution：DERIVED_TRANSIENT_FORMAL_CONTRACT
- Verified：true

```text
细则要求建立互联网诊疗医疗质量、安全、药学服务和信息技术管理制度，并落实患者信息和电子病历管理。
```

### Draft semantic judgement

```json
{
  "provenance": "SYSTEM_DRAFT_UNREVIEWED",
  "reviewed": false,
  "status": "INSUFFICIENT_EVIDENCE",
  "semantic_relevance": "relevant",
  "evidence_capability": "capable",
  "support_level": "partial_support",
  "semantic_relationship": "partial",
  "boundary_tags": [
    "industry_reference",
    "enterprise_capability_boundary",
    "scope_mismatch"
  ],
  "reason_codes": [
    "SUPPORT_INSUFFICIENT"
  ],
  "draft_gold_reason": "企业应证明自身具备与该公开行业规范相符的实施能力。；来源  仅用于系统草稿观察。根据来源片段的支持范围、主体/范围和状态信息，确定性聚合结果为 INSUFFICIENT_EVIDENCE。该判断未经人工审核，不得作为正式 Gold。",
  "reviewer": null,
  "reviewed_at": null
}
```

### Human decision

- [ ] APPROVE
- [ ] CHANGE
- [ ] REJECT

Reviewer corrected status:

Reviewer corrected semantics:

Reviewer reason:

---

## V2R-030-CORPUS-21

### Requirement

企业应提供同类项目的实施及验收依据。

- 难度：HARD
- 边界：project_experience、status_unknown、responsibility_boundary
- Draft aggregated status：**INSUFFICIENT_EVIDENCE**
- Draft provenance：SYSTEM_DRAFT_UNREVIEWED

### Sources

#### Source 1

- Material：case-city-governance.md (project_case)
- Scope：ENTERPRISE_PRIVATE
- Material ID：50467edc-0a5e-458f-ba69-1bbf488a115a
- Document ID：50467edc-0a5e-458f-ba69-1bbf488a115a
- Chunk ID：MCH-3FD884E9C86C84ADD445F70EC81FADD9
- Source Span ID：ESPAN-A9329BA2AE8E03755951632A45574198
- Resolution：DERIVED_TRANSIENT_FORMAL_CONTRACT
- Verified：true

```text
项目：景云城市治理数据平台；范围：数据目录、交换任务、统一门户和运行监测；项目状态：已完成模拟案例；验收日期：2025-11-20。
```

### Draft semantic judgement

```json
{
  "provenance": "SYSTEM_DRAFT_UNREVIEWED",
  "reviewed": false,
  "status": "INSUFFICIENT_EVIDENCE",
  "semantic_relevance": "relevant",
  "evidence_capability": "capable",
  "support_level": "partial_support",
  "semantic_relationship": "partial",
  "boundary_tags": [
    "project_experience",
    "status_unknown",
    "responsibility_boundary"
  ],
  "reason_codes": [
    "SUPPORT_INSUFFICIENT"
  ],
  "draft_gold_reason": "企业应提供同类项目的实施及验收依据。；来源  仅用于系统草稿观察。根据来源片段的支持范围、主体/范围和状态信息，确定性聚合结果为 INSUFFICIENT_EVIDENCE。该判断未经人工审核，不得作为正式 Gold。",
  "reviewer": null,
  "reviewed_at": null
}
```

### Human decision

- [ ] APPROVE
- [ ] CHANGE
- [ ] REJECT

Reviewer corrected status:

Reviewer corrected semantics:

Reviewer reason:

---

## V2R-031-CORPUS-22

### Requirement

企业应证明自身具备与该公开行业规范相符的实施能力。

- 难度：HARD
- 边界：industry_reference、enterprise_capability_boundary、scope_mismatch、third_party_boundary
- Draft aggregated status：**INSUFFICIENT_EVIDENCE**
- Draft provenance：SYSTEM_DRAFT_UNREVIEWED

### Sources

#### Source 1

- Material：全国一体化政务服务平台移动端建设指南（官方摘录）.md (technical_whitepaper)
- Scope：GOVERNMENT_ENTERPRISE
- Material ID：940965e1-aa0d-45a6-8c48-6997ea2af579
- Document ID：940965e1-aa0d-45a6-8c48-6997ea2af579
- Chunk ID：MCH-38EE2539CAD89F7618F2BDA4225F6A45
- Source Span ID：ESPAN-C29686C5633C5A54CF640AE6C259A4DA
- Resolution：DERIVED_TRANSIENT_FORMAL_CONTRACT
- Verified：true

```text
# 全国一体化政务服务平台移动端建设指南
```

### Draft semantic judgement

```json
{
  "provenance": "SYSTEM_DRAFT_UNREVIEWED",
  "reviewed": false,
  "status": "INSUFFICIENT_EVIDENCE",
  "semantic_relevance": "relevant",
  "evidence_capability": "capable",
  "support_level": "partial_support",
  "semantic_relationship": "partial",
  "boundary_tags": [
    "industry_reference",
    "enterprise_capability_boundary",
    "scope_mismatch",
    "third_party_boundary"
  ],
  "reason_codes": [
    "SUPPORT_INSUFFICIENT"
  ],
  "draft_gold_reason": "企业应证明自身具备与该公开行业规范相符的实施能力。；来源  仅用于系统草稿观察。根据来源片段的支持范围、主体/范围和状态信息，确定性聚合结果为 INSUFFICIENT_EVIDENCE。该判断未经人工审核，不得作为正式 Gold。",
  "reviewer": null,
  "reviewed_at": null
}
```

### Human decision

- [ ] APPROVE
- [ ] CHANGE
- [ ] REJECT

Reviewer corrected status:

Reviewer corrected semantics:

Reviewer reason:

---

## V2R-032-CORPUS-23

### Requirement

企业应证明自身具备与该公开行业规范相符的实施能力。

- 难度：HARD
- 边界：industry_reference、enterprise_capability_boundary、scope_mismatch
- Draft aggregated status：**INSUFFICIENT_EVIDENCE**
- Draft provenance：SYSTEM_DRAFT_UNREVIEWED

### Sources

#### Source 1

- Material：互联网诊疗管理办法（试行）等三个文件（官方摘录）.md (other)
- Scope：HEALTHCARE
- Material ID：ee0bdad1-d7f1-4964-be5f-f30bdab7da93
- Document ID：ee0bdad1-d7f1-4964-be5f-f30bdab7da93
- Chunk ID：MCH-30EB8577EBEB9697F56A43EFD4309980
- Source Span ID：ESPAN-A70A042F13D61120618FBD9E4009BCB0
- Resolution：DERIVED_TRANSIENT_FORMAL_CONTRACT
- Verified：true

```text
# 互联网诊疗管理办法（试行）等三个文件
```

### Draft semantic judgement

```json
{
  "provenance": "SYSTEM_DRAFT_UNREVIEWED",
  "reviewed": false,
  "status": "INSUFFICIENT_EVIDENCE",
  "semantic_relevance": "relevant",
  "evidence_capability": "capable",
  "support_level": "partial_support",
  "semantic_relationship": "partial",
  "boundary_tags": [
    "industry_reference",
    "enterprise_capability_boundary",
    "scope_mismatch"
  ],
  "reason_codes": [
    "SUPPORT_INSUFFICIENT"
  ],
  "draft_gold_reason": "企业应证明自身具备与该公开行业规范相符的实施能力。；来源  仅用于系统草稿观察。根据来源片段的支持范围、主体/范围和状态信息，确定性聚合结果为 INSUFFICIENT_EVIDENCE。该判断未经人工审核，不得作为正式 Gold。",
  "reviewer": null,
  "reviewed_at": null
}
```

### Human decision

- [ ] APPROVE
- [ ] CHANGE
- [ ] REJECT

Reviewer corrected status:

Reviewer corrected semantics:

Reviewer reason:

---

## V2R-033-CORPUS-24

### Requirement

企业应提供同类项目的实施及验收依据。

- 难度：HARD
- 边界：project_experience、status_unknown、responsibility_boundary
- Draft aggregated status：**INSUFFICIENT_EVIDENCE**
- Draft provenance：SYSTEM_DRAFT_UNREVIEWED

### Sources

#### Source 1

- Material：case-hospital-insufficient.md (project_case)
- Scope：ENTERPRISE_PRIVATE
- Material ID：e0d9548d-02f6-4eab-bceb-6a37e6f46d3d
- Document ID：e0d9548d-02f6-4eab-bceb-6a37e6f46d3d
- Chunk ID：MCH-C64312B771B223BD65F4ED37C9F13EBC
- Source Span ID：ESPAN-50B669BEC8A162009E00B2C90CA44A93
- Resolution：DERIVED_TRANSIENT_FORMAL_CONTRACT
- Verified：true

```text
SYNTHETIC_TEST_MATERIAL=true
NOT_REAL_CUSTOMER_DATA=true
subject: 杭州景云数科有限公司
source_type: synthetic_controlled
source_org: 杭州景云数科有限公司（虚构测试企业）
license_or_usage_status: INTERNAL_TEST_ONLY
material_id: L3-ENT-005
scope: enterprise
industry: 医疗行业
material_type: case
review_status: approved
```

### Draft semantic judgement

```json
{
  "provenance": "SYSTEM_DRAFT_UNREVIEWED",
  "reviewed": false,
  "status": "INSUFFICIENT_EVIDENCE",
  "semantic_relevance": "relevant",
  "evidence_capability": "capable",
  "support_level": "partial_support",
  "semantic_relationship": "partial",
  "boundary_tags": [
    "project_experience",
    "status_unknown",
    "responsibility_boundary"
  ],
  "reason_codes": [
    "SUPPORT_INSUFFICIENT"
  ],
  "draft_gold_reason": "企业应提供同类项目的实施及验收依据。；来源  仅用于系统草稿观察。根据来源片段的支持范围、主体/范围和状态信息，确定性聚合结果为 INSUFFICIENT_EVIDENCE。该判断未经人工审核，不得作为正式 Gold。",
  "reviewer": null,
  "reviewed_at": null
}
```

### Human decision

- [ ] APPROVE
- [ ] CHANGE
- [ ] REJECT

Reviewer corrected status:

Reviewer corrected semantics:

Reviewer reason:

---

## V2R-034-CORPUS-25

### Requirement

企业应证明自身具备与该公开行业规范相符的实施能力。

- 难度：HARD
- 边界：industry_reference、enterprise_capability_boundary、scope_mismatch
- Draft aggregated status：**INSUFFICIENT_EVIDENCE**
- Draft provenance：SYSTEM_DRAFT_UNREVIEWED

### Sources

#### Source 1

- Material：全国一体化政务服务平台移动端建设指南（官方摘录）.md (technical_whitepaper)
- Scope：GOVERNMENT_ENTERPRISE
- Material ID：940965e1-aa0d-45a6-8c48-6997ea2af579
- Document ID：940965e1-aa0d-45a6-8c48-6997ea2af579
- Chunk ID：MCH-E51E3BC7E1BB9BFCBEF703EB1E399F0C
- Source Span ID：ESPAN-D52628993568447B99D24870B207CAF1
- Resolution：DERIVED_TRANSIENT_FORMAL_CONTRACT
- Verified：true

```text
来源机构：国务院办公厅
文号：国办函〔2021〕105号
```

### Draft semantic judgement

```json
{
  "provenance": "SYSTEM_DRAFT_UNREVIEWED",
  "reviewed": false,
  "status": "INSUFFICIENT_EVIDENCE",
  "semantic_relevance": "relevant",
  "evidence_capability": "capable",
  "support_level": "partial_support",
  "semantic_relationship": "partial",
  "boundary_tags": [
    "industry_reference",
    "enterprise_capability_boundary",
    "scope_mismatch"
  ],
  "reason_codes": [
    "SUPPORT_INSUFFICIENT"
  ],
  "draft_gold_reason": "企业应证明自身具备与该公开行业规范相符的实施能力。；来源  仅用于系统草稿观察。根据来源片段的支持范围、主体/范围和状态信息，确定性聚合结果为 INSUFFICIENT_EVIDENCE。该判断未经人工审核，不得作为正式 Gold。",
  "reviewer": null,
  "reviewed_at": null
}
```

### Human decision

- [ ] APPROVE
- [ ] CHANGE
- [ ] REJECT

Reviewer corrected status:

Reviewer corrected semantics:

Reviewer reason:

---

## V2R-035-CORPUS-26

### Requirement

企业应证明自身具备与该公开行业规范相符的实施能力。

- 难度：HARD
- 边界：industry_reference、enterprise_capability_boundary、scope_mismatch
- Draft aggregated status：**INSUFFICIENT_EVIDENCE**
- Draft provenance：SYSTEM_DRAFT_UNREVIEWED

### Sources

#### Source 1

- Material：互联网诊疗管理办法（试行）等三个文件（官方摘录）.md (other)
- Scope：HEALTHCARE
- Material ID：ee0bdad1-d7f1-4964-be5f-f30bdab7da93
- Document ID：ee0bdad1-d7f1-4964-be5f-f30bdab7da93
- Chunk ID：MCH-1CF9DA591A5EB66522691D232B78DEF8
- Source Span ID：ESPAN-E255CE7861AA9E7B5BEB442FD15B78ED
- Resolution：DERIVED_TRANSIENT_FORMAL_CONTRACT
- Verified：true

```text
来源机构：国家卫生健康委员会、国家中医药管理局
文号：国卫医发〔2018〕25号
```

### Draft semantic judgement

```json
{
  "provenance": "SYSTEM_DRAFT_UNREVIEWED",
  "reviewed": false,
  "status": "INSUFFICIENT_EVIDENCE",
  "semantic_relevance": "relevant",
  "evidence_capability": "capable",
  "support_level": "partial_support",
  "semantic_relationship": "partial",
  "boundary_tags": [
    "industry_reference",
    "enterprise_capability_boundary",
    "scope_mismatch"
  ],
  "reason_codes": [
    "SUPPORT_INSUFFICIENT"
  ],
  "draft_gold_reason": "企业应证明自身具备与该公开行业规范相符的实施能力。；来源  仅用于系统草稿观察。根据来源片段的支持范围、主体/范围和状态信息，确定性聚合结果为 INSUFFICIENT_EVIDENCE。该判断未经人工审核，不得作为正式 Gold。",
  "reviewer": null,
  "reviewed_at": null
}
```

### Human decision

- [ ] APPROVE
- [ ] CHANGE
- [ ] REJECT

Reviewer corrected status:

Reviewer corrected semantics:

Reviewer reason:

---

## V2R-036-CORPUS-27

### Requirement

企业应提供同类项目的实施及验收依据。

- 难度：HARD
- 边界：project_experience、status_unknown、responsibility_boundary
- Draft aggregated status：**INSUFFICIENT_EVIDENCE**
- Draft provenance：SYSTEM_DRAFT_UNREVIEWED

### Sources

#### Source 1

- Material：case-hospital-insufficient.md (project_case)
- Scope：ENTERPRISE_PRIVATE
- Material ID：e0d9548d-02f6-4eab-bceb-6a37e6f46d3d
- Document ID：e0d9548d-02f6-4eab-bceb-6a37e6f46d3d
- Chunk ID：MCH-8C9EAB0DF1050455D2CCAE2D4EE17DFE
- Source Span ID：ESPAN-D7822677600E74C62D25C4D440AE89FD
- Resolution：DERIVED_TRANSIENT_FORMAL_CONTRACT
- Verified：true

```text
# 医院数据集成案例（材料不充分）
```

### Draft semantic judgement

```json
{
  "provenance": "SYSTEM_DRAFT_UNREVIEWED",
  "reviewed": false,
  "status": "INSUFFICIENT_EVIDENCE",
  "semantic_relevance": "relevant",
  "evidence_capability": "capable",
  "support_level": "partial_support",
  "semantic_relationship": "partial",
  "boundary_tags": [
    "project_experience",
    "status_unknown",
    "responsibility_boundary"
  ],
  "reason_codes": [
    "SUPPORT_INSUFFICIENT"
  ],
  "draft_gold_reason": "企业应提供同类项目的实施及验收依据。；来源  仅用于系统草稿观察。根据来源片段的支持范围、主体/范围和状态信息，确定性聚合结果为 INSUFFICIENT_EVIDENCE。该判断未经人工审核，不得作为正式 Gold。",
  "reviewer": null,
  "reviewed_at": null
}
```

### Human decision

- [ ] APPROVE
- [ ] CHANGE
- [ ] REJECT

Reviewer corrected status:

Reviewer corrected semantics:

Reviewer reason:

---

## V2R-037-CORPUS-28

### Requirement

企业应证明自身具备与该公开行业规范相符的实施能力。

- 难度：HARD
- 边界：industry_reference、enterprise_capability_boundary、scope_mismatch、freshness
- Draft aggregated status：**INSUFFICIENT_EVIDENCE**
- Draft provenance：SYSTEM_DRAFT_UNREVIEWED

### Sources

#### Source 1

- Material：全国一体化政务服务平台移动端建设指南（官方摘录）.md (technical_whitepaper)
- Scope：GOVERNMENT_ENTERPRISE
- Material ID：940965e1-aa0d-45a6-8c48-6997ea2af579
- Document ID：940965e1-aa0d-45a6-8c48-6997ea2af579
- Chunk ID：MCH-AA06CCA0AAB70F8845956B5EC308200B
- Source Span ID：ESPAN-6C4C9B2CED5E7AC3D1FEEEC4C4F12800
- Resolution：DERIVED_TRANSIENT_FORMAL_CONTRACT
- Verified：true

```text
指南要求移动政务服务统一标准、统一管理、互联互通，并加强重要政务数据和敏感个人信息保护。
```

### Draft semantic judgement

```json
{
  "provenance": "SYSTEM_DRAFT_UNREVIEWED",
  "reviewed": false,
  "status": "INSUFFICIENT_EVIDENCE",
  "semantic_relevance": "relevant",
  "evidence_capability": "capable",
  "support_level": "partial_support",
  "semantic_relationship": "partial",
  "boundary_tags": [
    "industry_reference",
    "enterprise_capability_boundary",
    "scope_mismatch",
    "freshness"
  ],
  "reason_codes": [
    "SUPPORT_INSUFFICIENT"
  ],
  "draft_gold_reason": "企业应证明自身具备与该公开行业规范相符的实施能力。；来源  仅用于系统草稿观察。根据来源片段的支持范围、主体/范围和状态信息，确定性聚合结果为 INSUFFICIENT_EVIDENCE。该判断未经人工审核，不得作为正式 Gold。",
  "reviewer": null,
  "reviewed_at": null
}
```

### Human decision

- [ ] APPROVE
- [ ] CHANGE
- [ ] REJECT

Reviewer corrected status:

Reviewer corrected semantics:

Reviewer reason:

---

