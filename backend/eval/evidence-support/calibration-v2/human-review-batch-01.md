# CALIBRATION V2 HUMAN REVIEW BATCH 1

> 本批仅供人工审核；所有判断均为 `SYSTEM_DRAFT_UNREVIEWED`。不得自动批准、不得冻结数据集、不得执行 Calibration。
> 候选池：37 条；本批：10 条；来源均来自正式 synthetic/public corpus，未调用模型或 Provider。

## BATCH

- case count：10
- READY：3
- INSUFFICIENT：4
- NO_RELEVANT：2
- CONFLICT：1
- challenge / ambiguous：1

## BOUNDARY COVERAGE

- direct/full support
- partial support
- reference-only and wrong entity/scope
- related but insufficient
- unrelated evidence
- conflict and freshness/superseded validity
- third-party capability boundary
- industry reference ≠ enterprise capability
- quantitative unsupported
- multi-dimension ambiguity

# CASE V2R-001-PERF-DIRECT

## 招标要求

企业应提供可核验的数据交换平台性能测试记录。

## 系统找到的资料

### 资料 1

材料名称：performance-report.md
材料类型：产品资料
范围：企业材料

原文：
```text
REPRESENTATIVE_SYNTHETIC
NOT_REAL_CUSTOMER_DATA
material_id: SME-004
subject: 澄明数科（示范）有限公司
```

## 系统 Draft 判断

Semantic relevance：与招标要求有一定关联
Evidence capability：材料类型具备证明该类事实的可能性
Support level：系统草稿认为材料完整覆盖要求
Relationship：直接相关

## 系统 Draft 最终结论

可以进入证据审核（EVIDENCE_REVIEW_READY）

## 系统理由

- 招标要求：企业应提供可核验的数据交换平台性能测试记录。
- 系统草稿看到的资料范围：performance-report.md
- 系统草稿认为资料与要求的主体和范围相符，但请人工核对原文是否真的包含所要求的证明内容。
- 需要核对数字、单位或测试范围是否在原文中明确出现。

## 关键证据原文

资料 1：
“REPRESENTATIVE_SYNTHETIC
NOT_REAL_CUSTOMER_DATA
material_id: SME-004
subject: 澄明数科（示范）有限公司”

## 风险 / 边界

- 数值要求
- 直接支持

## 请人工判断

A. ✅ 同意系统判断

B. ✏️ 系统判断应修改

C. ❌ 这道题不适合作为 Calibration Case

如果选择 B，建议修改为：

[留空]

人工理由：

[留空]

---

# CASE V2R-003-COMP-DIRECT

## 招标要求

企业应说明产品在 x86_64、Ubuntu 和 PostgreSQL 环境的兼容性。

## 系统找到的资料

### 资料 1

材料名称：compatibility-matrix.md
材料类型：产品资料
范围：企业材料

原文：
```text
REPRESENTATIVE_SYNTHETIC
NOT_REAL_CUSTOMER_DATA
material_id: SME-005
subject: 澄明数科（示范）有限公司
```

## 系统 Draft 判断

Semantic relevance：与招标要求有一定关联
Evidence capability：材料类型具备证明该类事实的可能性
Support level：系统草稿认为材料完整覆盖要求
Relationship：直接相关

## 系统 Draft 最终结论

可以进入证据审核（EVIDENCE_REVIEW_READY）

## 系统理由

- 招标要求：企业应说明产品在 x86_64、Ubuntu 和 PostgreSQL 环境的兼容性。
- 系统草稿看到的资料范围：compatibility-matrix.md
- 系统草稿认为资料与要求的主体和范围相符，但请人工核对原文是否真的包含所要求的证明内容。

## 关键证据原文

资料 1：
“REPRESENTATIVE_SYNTHETIC
NOT_REAL_CUSTOMER_DATA
material_id: SME-005
subject: 澄明数科（示范）有限公司”

## 风险 / 边界

- 请人工确认是否存在未覆盖边界。

## 请人工判断

A. ✅ 同意系统判断

B. ✏️ 系统判断应修改

C. ❌ 这道题不适合作为 Calibration Case

如果选择 B，建议修改为：

[留空]

人工理由：

[留空]

---

# CASE V2R-005-ISO-DIRECT

## 招标要求

企业应提供当前有效的 ISO/IEC 27001 认证信息。

## 系统找到的资料

### 资料 1

材料名称：qualification-iso27001.md
材料类型：资质材料
范围：企业材料

原文：
```text
# ISO 27001 受控记录
```

## 系统 Draft 判断

Semantic relevance：与招标要求有一定关联
Evidence capability：材料类型具备证明该类事实的可能性
Support level：系统草稿认为材料完整覆盖要求
Relationship：直接相关

## 系统 Draft 最终结论

可以进入证据审核（EVIDENCE_REVIEW_READY）

## 系统理由

- 招标要求：企业应提供当前有效的 ISO/IEC 27001 认证信息。
- 系统草稿看到的资料范围：qualification-iso27001.md
- 系统草稿认为资料与要求的主体和范围相符，但请人工核对原文是否真的包含所要求的证明内容。
- 需要核对材料的当前有效性和是否已被更新材料替代。

## 关键证据原文

资料 1：
“# ISO 27001 受控记录”

## 风险 / 边界

- 时效或有效性

## 请人工判断

A. ✅ 同意系统判断

B. ✏️ 系统判断应修改

C. ❌ 这道题不适合作为 Calibration Case

如果选择 B，建议修改为：

[留空]

人工理由：

[留空]

---

# CASE V2R-002-PERF-PARTIAL

## 招标要求

企业应证明接口 P95 响应时间不超过 1 秒。

## 系统找到的资料

### 资料 1

材料名称：performance-report.md
材料类型：产品资料
范围：企业材料

原文：
```text
REPRESENTATIVE_SYNTHETIC
NOT_REAL_CUSTOMER_DATA
material_id: SME-004
subject: 澄明数科（示范）有限公司
```

## 系统 Draft 判断

Semantic relevance：与招标要求有一定关联
Evidence capability：材料类型具备证明该类事实的可能性
Support level：系统草稿认为材料只覆盖要求的一部分
Relationship：部分相关

## 系统 Draft 最终结论

证据不足（INSUFFICIENT_EVIDENCE）

## 系统理由

- 招标要求：企业应证明接口 P95 响应时间不超过 1 秒。
- 系统草稿看到的资料范围：performance-report.md
- 系统草稿认为资料只能覆盖部分要求，尚不足以支持完整承诺。
- 需要核对数字、单位或测试范围是否在原文中明确出现。
- 系统草稿风险提示：SUPPORT_INSUFFICIENT。

## 关键证据原文

资料 1：
“REPRESENTATIVE_SYNTHETIC
NOT_REAL_CUSTOMER_DATA
material_id: SME-004
subject: 澄明数科（示范）有限公司”

## 风险 / 边界

- 数值要求

## 请人工判断

A. ✅ 同意系统判断

B. ✏️ 系统判断应修改

C. ❌ 这道题不适合作为 Calibration Case

如果选择 B，建议修改为：

[留空]

人工理由：

[留空]

---

# CASE V2R-006-ISO-SCOPE

## 招标要求

企业应提供指定项目主体的 ISO/IEC 27001 证书。

## 系统找到的资料

### 资料 1

材料名称：qualification-iso27001.md
材料类型：资质材料
范围：企业材料

原文：
```text
# ISO 27001 受控记录
```

## 系统 Draft 判断

Semantic relevance：与招标要求有一定关联
Evidence capability：材料只能提供背景或参考
Support level：系统草稿认为材料只能作为参考，不能证明要求
Relationship：有关联，但不能直接证明

## 系统 Draft 最终结论

没有相关证据（NO_RELEVANT_EVIDENCE）

## 系统理由

- 招标要求：企业应提供指定项目主体的 ISO/IEC 27001 证书。
- 系统草稿看到的资料范围：qualification-iso27001.md
- 系统草稿认为现有资料与要求的主体、范围或事实类型不匹配，不能把相近主题当作证明。
- 需要核对证明主体和本项目范围是否一致。
- 系统草稿风险提示：SCOPE_MISMATCH。

## 关键证据原文

资料 1：
“# ISO 27001 受控记录”

## 风险 / 边界

- 仅供参考
- 主体或范围不一致

## 请人工判断

A. ✅ 同意系统判断

B. ✏️ 系统判断应修改

C. ❌ 这道题不适合作为 Calibration Case

如果选择 B，建议修改为：

[留空]

人工理由：

[留空]

---

# CASE V2R-021-CORPUS-12

## 招标要求

企业应提供与本项目范围相关的可核验材料。

## 系统找到的资料

### 资料 1

材料名称：authorization-partner.md
材料类型：其他资料
范围：企业材料

原文：
```text
平台可集成某开源数据库和消息组件；部署、许可和技术支持依赖第三方，企业不将第三方能力表述为自有产品能力。
```

## 系统 Draft 判断

Semantic relevance：与招标要求有一定关联
Evidence capability：材料类型具备证明该类事实的可能性
Support level：系统草稿认为材料只覆盖要求的一部分
Relationship：部分相关

## 系统 Draft 最终结论

证据不足（INSUFFICIENT_EVIDENCE）

## 系统理由

- 招标要求：企业应提供与本项目范围相关的可核验材料。
- 系统草稿看到的资料范围：authorization-partner.md
- 系统草稿认为资料只能覆盖部分要求，尚不足以支持完整承诺。
- 需要核对证明主体和本项目范围是否一致。
- 系统草稿风险提示：SUPPORT_INSUFFICIENT。

## 关键证据原文

资料 1：
“平台可集成某开源数据库和消息组件；部署、许可和技术支持依赖第三方，企业不将第三方能力表述为自有产品能力。”

## 风险 / 边界

- 主体或范围不一致

## 请人工判断

A. ✅ 同意系统判断

B. ✏️ 系统判断应修改

C. ❌ 这道题不适合作为 Calibration Case

如果选择 B，建议修改为：

[留空]

人工理由：

[留空]

---

# CASE V2R-030-CORPUS-21

## 招标要求

企业应提供同类项目的实施及验收依据。

## 系统找到的资料

### 资料 1

材料名称：case-city-governance.md
材料类型：项目案例
范围：企业材料

原文：
```text
项目：景云城市治理数据平台；范围：数据目录、交换任务、统一门户和运行监测；项目状态：已完成模拟案例；验收日期：2025-11-20。
```

## 系统 Draft 判断

Semantic relevance：与招标要求有一定关联
Evidence capability：材料类型具备证明该类事实的可能性
Support level：系统草稿认为材料只覆盖要求的一部分
Relationship：部分相关

## 系统 Draft 最终结论

证据不足（INSUFFICIENT_EVIDENCE）

## 系统理由

- 招标要求：企业应提供同类项目的实施及验收依据。
- 系统草稿看到的资料范围：case-city-governance.md
- 系统草稿认为资料只能覆盖部分要求，尚不足以支持完整承诺。
- 系统草稿风险提示：SUPPORT_INSUFFICIENT。

## 关键证据原文

资料 1：
“项目：景云城市治理数据平台；范围：数据目录、交换任务、统一门户和运行监测；项目状态：已完成模拟案例；验收日期：2025-11-20。”

## 风险 / 边界

- 项目状态未充分证明

## 请人工判断

A. ✅ 同意系统判断

B. ✏️ 系统判断应修改

C. ❌ 这道题不适合作为 Calibration Case

如果选择 B，建议修改为：

[留空]

人工理由：

[留空]

---

# CASE V2R-015-CORPUS-06

## 招标要求

企业应证明自身具备与该公开行业规范相符的实施能力。

## 系统找到的资料

### 资料 1

材料名称：“互联网+政务服务”技术体系建设指南（官方摘录）.md
材料类型：行业/技术公开资料
范围：政府/行业公开资料

原文：
```text
来源机构：国务院办公厅
文号：国办函〔2016〕108号
```

## 系统 Draft 判断

Semantic relevance：与招标要求无直接关联
Evidence capability：材料本身不能证明该要求
Support level：系统草稿认为材料不足以形成证明
Relationship：无直接关联

## 系统 Draft 最终结论

没有相关证据（NO_RELEVANT_EVIDENCE）

## 系统理由

- 招标要求：企业应证明自身具备与该公开行业规范相符的实施能力。
- 系统草稿看到的资料范围：“互联网+政务服务”技术体系建设指南（官方摘录）.md
- 系统草稿认为现有资料与要求的主体、范围或事实类型不匹配，不能把相近主题当作证明。
- 行业规范或公开指南只能说明外部要求，不能单独证明企业已经具备对应能力。
- 需要核对证明主体和本项目范围是否一致。
- 系统草稿风险提示：SEMANTICALLY_IRRELEVANT、SOURCE_NOT_EVIDENCE_CAPABLE。

## 关键证据原文

资料 1：
“来源机构：国务院办公厅
文号：国办函〔2016〕108号”

## 风险 / 边界

- 主体或范围不一致
- 行业参考不等于企业能力

## 请人工判断

A. ✅ 同意系统判断

B. ✏️ 系统判断应修改

C. ❌ 这道题不适合作为 Calibration Case

如果选择 B，建议修改为：

[留空]

人工理由：

[留空]

---

# CASE V2R-009-ISO-CONFLICT

## 招标要求

企业应说明当前 ISO/IEC 27001 证书的有效截止日期。

## 系统找到的资料

### 资料 1

材料名称：qualification-iso27001.md
材料类型：资质材料
范围：企业材料

原文：
```text
# ISO 27001 受控记录
```

### 资料 2

材料名称：company-profile.md
材料类型：企业资料
范围：企业材料

原文：
```text
REPRESENTATIVE_SYNTHETIC
NOT_REAL_CUSTOMER_DATA
material_id: SME-001
subject: 澄明数科（示范）有限公司
```

## 系统 Draft 判断

Semantic relevance：与招标要求有一定关联
Evidence capability：材料类型具备证明该类事实的可能性
Support level：系统草稿认为材料对同一事实给出了不一致信息
Relationship：不同材料之间存在冲突

## 系统 Draft 最终结论

证据存在冲突（CONFLICTING_EVIDENCE）

## 系统理由

- 招标要求：企业应说明当前 ISO/IEC 27001 证书的有效截止日期。
- 系统草稿看到的资料范围：qualification-iso27001.md、company-profile.md
- 系统草稿认为不同资料对同一有效性事实给出了冲突观察，当前不能直接选定其中一份。
- 需要核对材料的当前有效性和是否已被更新材料替代。
- 系统草稿风险提示：VALIDITY_MISMATCH。

## 关键证据原文

资料 1：
“# ISO 27001 受控记录”
资料 2：
“REPRESENTATIVE_SYNTHETIC
NOT_REAL_CUSTOMER_DATA
material_id: SME-001
subject: 澄明数科（示范）有限公司”

## 风险 / 边界

- 时效或有效性
- 事实冲突

## 请人工判断

A. ✅ 同意系统判断

B. ✏️ 系统判断应修改

C. ❌ 这道题不适合作为 Calibration Case

如果选择 B，建议修改为：

[留空]

人工理由：

[留空]

---

# CASE V2R-004-COMP-PARTIAL

## 招标要求

企业应证明所有国产数据库组合均已完成压力测试。

## 系统找到的资料

### 资料 1

材料名称：compatibility-matrix.md
材料类型：产品资料
范围：企业材料

原文：
```text
REPRESENTATIVE_SYNTHETIC
NOT_REAL_CUSTOMER_DATA
material_id: SME-005
subject: 澄明数科（示范）有限公司
```

## 系统 Draft 判断

Semantic relevance：与招标要求有一定关联
Evidence capability：材料类型具备证明该类事实的可能性
Support level：系统草稿认为材料只覆盖要求的一部分
Relationship：部分相关

## 系统 Draft 最终结论

证据不足（INSUFFICIENT_EVIDENCE）

## 系统理由

- 招标要求：企业应证明所有国产数据库组合均已完成压力测试。
- 系统草稿看到的资料范围：compatibility-matrix.md
- 系统草稿认为资料只能覆盖部分要求，尚不足以支持完整承诺。
- 该题包含多个维度，系统无法仅凭当前片段确认全部条件。
- 系统草稿风险提示：SUPPORT_INSUFFICIENT。

## 关键证据原文

资料 1：
“REPRESENTATIVE_SYNTHETIC
NOT_REAL_CUSTOMER_DATA
material_id: SME-005
subject: 澄明数科（示范）有限公司”

## 风险 / 边界

- 多维度/待确认

## 请人工判断

A. ✅ 同意系统判断

B. ✏️ 系统判断应修改

C. ❌ 这道题不适合作为 Calibration Case

如果选择 B，建议修改为：

[留空]

人工理由：

[留空]

---

## TECHNICAL APPENDIX（可选）

以下字段只用于审计和复核，不是人工判断的前置条件。

| Case | Material ID | Document ID | Chunk ID | Source Span ID | Source verified |
|---|---|---|---|---|---|
| V2R-001-PERF-DIRECT | 3c81671f-376e-401b-8525-be26929d5b92 | 3c81671f-376e-401b-8525-be26929d5b92 | MCH-D32448917B3E8CAD1214641F8E85D86A | ESPAN-F8209B2B73FCFC87DC5118C276BBF52D | true |
| V2R-003-COMP-DIRECT | 3f9dacfb-2e48-4796-a477-98c60b506831 | 3f9dacfb-2e48-4796-a477-98c60b506831 | MCH-EA8F9FC5473B4FA1539E99B748DA4071 | ESPAN-25517924C7F718BE23BD47529BE055D2 | true |
| V2R-005-ISO-DIRECT | 57b9e5fe-9549-42aa-88d5-fccc5c0afe2e | 57b9e5fe-9549-42aa-88d5-fccc5c0afe2e | MCH-0820CC5A439CB986C62E46213029CC71 | ESPAN-7A5D661264A0C779ED903BDF21BC9E25 | true |
| V2R-002-PERF-PARTIAL | 3c81671f-376e-401b-8525-be26929d5b92 | 3c81671f-376e-401b-8525-be26929d5b92 | MCH-D32448917B3E8CAD1214641F8E85D86A | ESPAN-F8209B2B73FCFC87DC5118C276BBF52D | true |
| V2R-006-ISO-SCOPE | 57b9e5fe-9549-42aa-88d5-fccc5c0afe2e | 57b9e5fe-9549-42aa-88d5-fccc5c0afe2e | MCH-0820CC5A439CB986C62E46213029CC71 | ESPAN-7A5D661264A0C779ED903BDF21BC9E25 | true |
| V2R-021-CORPUS-12 | 9876da6b-40c1-4f2d-b47b-290c7c150f4e | 9876da6b-40c1-4f2d-b47b-290c7c150f4e | MCH-A4211A94C5C7A077F478D979A3ADF86E | ESPAN-403BC1522544E742C897D863B1EB8955 | true |
| V2R-030-CORPUS-21 | 50467edc-0a5e-458f-ba69-1bbf488a115a | 50467edc-0a5e-458f-ba69-1bbf488a115a | MCH-3FD884E9C86C84ADD445F70EC81FADD9 | ESPAN-A9329BA2AE8E03755951632A45574198 | true |
| V2R-015-CORPUS-06 | eef2ae66-8259-4954-9a88-2e184411fcc5 | eef2ae66-8259-4954-9a88-2e184411fcc5 | MCH-F4CD0E67DBD66EC447EF06D0EDBB083A | ESPAN-9364092E47249D44F9B86C33FB712A84 | true |
| V2R-009-ISO-CONFLICT | 57b9e5fe-9549-42aa-88d5-fccc5c0afe2e | 57b9e5fe-9549-42aa-88d5-fccc5c0afe2e | MCH-0820CC5A439CB986C62E46213029CC71 | ESPAN-7A5D661264A0C779ED903BDF21BC9E25 | true |
| V2R-009-ISO-CONFLICT | b96691fb-e719-4312-8ec9-a9e8acf687c0 | b96691fb-e719-4312-8ec9-a9e8acf687c0 | MCH-B2BE9E8E088E44117824E02219F50158 | ESPAN-817DC81970E79F8873AC6E319F9D7E78 | true |
| V2R-004-COMP-PARTIAL | 3f9dacfb-2e48-4796-a477-98c60b506831 | 3f9dacfb-2e48-4796-a477-98c60b506831 | MCH-EA8F9FC5473B4FA1539E99B748DA4071 | ESPAN-25517924C7F718BE23BD47529BE055D2 | true |

系统草稿来源：`SYSTEM_DRAFT_UNREVIEWED`；人工审核前不得写入 Gold。

