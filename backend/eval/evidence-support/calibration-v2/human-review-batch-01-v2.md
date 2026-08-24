# CALIBRATION V2 HUMAN REVIEW BATCH 1 V2

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
产品：澄明数据交换平台 V3.2
环境：8 vCPU、32 GB 内存、PostgreSQL 14、千兆局域网
条件：50 并发、100 万条基准数据、缓存预热后执行 30 分钟
指标：数据目录查询平均响应时间
结果：平均 1.4 秒，P95 1.9 秒。
日期：2025-05-16。
```

必要上下文（仅帮助理解，不作为主要证据）：
```text
# 数据交换平台性能测试记录
```

## 系统 Draft 判断

Semantic relevance：与招标要求有一定关联
Evidence capability：材料类型具备证明该类事实的可能性
Support level：系统草稿认为材料完整覆盖要求
Relationship：直接相关
来源依据：已找到相关业务正文

## 系统 Draft 最终结论

可以进入证据审核（EVIDENCE_REVIEW_READY）

## 系统理由

- 招标要求：企业应提供可核验的数据交换平台性能测试记录。
- 系统草稿看到的资料范围：performance-report.md
- 系统草稿认为资料与要求的主体和范围相符，但请人工核对原文是否真的包含所要求的证明内容。
- 需要核对数字、单位或测试范围是否在原文中明确出现。

## 关键证据原文

资料 1：
“产品：澄明数据交换平台 V3.2
环境：8 vCPU、32 GB 内存、PostgreSQL 14、千兆局域网
条件：50 并发、100 万条基准数据、缓存预热后执行 30 分钟
指标：数据目录查询平均响应时间
结果：平均 1.4 秒，P95 1.9 秒。
日期：2025-05-16。”

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
x86_64 + Ubuntu 22.04 + PostgreSQL 14：tested
鲲鹏 920 + 麒麟 V10 + 达梦 8：partially_tested（完成安装和基础交换用例，未完成压力测试）
海光 + 统信 UOS + 人大金仓：not_verified
国产数据库组合：unknown
```

必要上下文（仅帮助理解，不作为主要证据）：
```text
# 产品兼容性矩阵
```

## 系统 Draft 判断

Semantic relevance：与招标要求有一定关联
Evidence capability：材料类型具备证明该类事实的可能性
Support level：系统草稿认为材料完整覆盖要求
Relationship：直接相关
来源依据：已找到相关业务正文

## 系统 Draft 最终结论

可以进入证据审核（EVIDENCE_REVIEW_READY）

## 系统理由

- 招标要求：企业应说明产品在 x86_64、Ubuntu 和 PostgreSQL 环境的兼容性。
- 系统草稿看到的资料范围：compatibility-matrix.md
- 系统草稿认为资料与要求的主体和范围相符，但请人工核对原文是否真的包含所要求的证明内容。

## 关键证据原文

资料 1：
“x86_64 + Ubuntu 22.04 + PostgreSQL 14：tested
鲲鹏 920 + 麒麟 V10 + 达梦 8：partially_tested（完成安装和基础交换用例，未完成压力测试）
海光 + 统信 UOS + 人大金仓：not_verified
国产数据库组合：unknown”

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
名称：ISO/IEC 27001
编号：CM-Q-27001-2024
状态：active
有效至：2027-11-30
```

必要上下文（仅帮助理解，不作为主要证据）：
```text
# ISO 27001 受控记录
```

## 系统 Draft 判断

Semantic relevance：与招标要求有一定关联
Evidence capability：材料类型具备证明该类事实的可能性
Support level：系统草稿认为材料完整覆盖要求
Relationship：直接相关
来源依据：已找到相关业务正文

## 系统 Draft 最终结论

可以进入证据审核（EVIDENCE_REVIEW_READY）

## 系统理由

- 招标要求：企业应提供当前有效的 ISO/IEC 27001 认证信息。
- 系统草稿看到的资料范围：qualification-iso27001.md
- 系统草稿认为资料与要求的主体和范围相符，但请人工核对原文是否真的包含所要求的证明内容。
- 需要核对材料的当前有效性和是否已被更新材料替代。

## 关键证据原文

资料 1：
“名称：ISO/IEC 27001
编号：CM-Q-27001-2024
状态：active
有效至：2027-11-30”

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
产品：澄明数据交换平台 V3.2
环境：8 vCPU、32 GB 内存、PostgreSQL 14、千兆局域网
条件：50 并发、100 万条基准数据、缓存预热后执行 30 分钟
指标：数据目录查询平均响应时间
结果：平均 1.4 秒，P95 1.9 秒。
日期：2025-05-16。
```

必要上下文（仅帮助理解，不作为主要证据）：
```text
# 数据交换平台性能测试记录
```

## 系统 Draft 判断

Semantic relevance：与招标要求有一定关联
Evidence capability：材料类型具备证明该类事实的可能性
Support level：系统草稿认为材料只覆盖要求的一部分
Relationship：部分相关
来源依据：已找到相关业务正文

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
“产品：澄明数据交换平台 V3.2
环境：8 vCPU、32 GB 内存、PostgreSQL 14、千兆局域网
条件：50 并发、100 万条基准数据、缓存预热后执行 30 分钟
指标：数据目录查询平均响应时间
结果：平均 1.4 秒，P95 1.9 秒。
日期：2025-05-16。”

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
名称：ISO/IEC 27001
编号：CM-Q-27001-2024
状态：active
有效至：2027-11-30
```

必要上下文（仅帮助理解，不作为主要证据）：
```text
# ISO 27001 受控记录
```

## 系统 Draft 判断

Semantic relevance：与招标要求有一定关联
Evidence capability：材料只能提供背景或参考
Support level：系统草稿认为材料只能作为参考，不能证明要求
Relationship：有关联，但不能直接证明
来源依据：已找到相关业务正文

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
“名称：ISO/IEC 27001
编号：CM-Q-27001-2024
状态：active
有效至：2027-11-30”

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

必要上下文（仅帮助理解，不作为主要证据）：
```text
# 第三方产品授权说明
```

## 系统 Draft 判断

Semantic relevance：与招标要求有一定关联
Evidence capability：材料类型具备证明该类事实的可能性
Support level：系统草稿认为材料只覆盖要求的一部分
Relationship：部分相关
来源依据：已找到相关业务正文

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

必要上下文（仅帮助理解，不作为主要证据）：
```text
# 城市治理数据平台案例
```

## 系统 Draft 判断

Semantic relevance：与招标要求有一定关联
Evidence capability：材料类型具备证明该类事实的可能性
Support level：系统草稿认为材料只覆盖要求的一部分
Relationship：部分相关
来源依据：已找到相关业务正文

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
指南提出统一政务服务信息资源目录、交换体系和平台支撑，推动跨部门数据共享与服务协同。
```

必要上下文（仅帮助理解，不作为主要证据）：
```text
来源机构：国务院办公厅
文号：国办函〔2016〕108号
```

## 系统 Draft 判断

Semantic relevance：与招标要求无直接关联
Evidence capability：材料本身不能证明该要求
Support level：系统草稿认为材料不足以形成证明
Relationship：无直接关联
来源依据：已找到相关业务正文

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
“指南提出统一政务服务信息资源目录、交换体系和平台支撑，推动跨部门数据共享与服务协同。”

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
名称：ISO/IEC 27001
编号：CM-Q-27001-2024
状态：active
有效至：2027-11-30
```

必要上下文（仅帮助理解，不作为主要证据）：
```text
# ISO 27001 受控记录
```

### 资料 2

材料名称：company-profile.md
材料类型：企业资料
范围：企业材料

原文：
```text
企业：澄明数科（示范）有限公司
规模：100-300 人。
业务范围：政企应用软件开发、数据交换与治理、系统集成、实施与运维服务。
限制：本资料不构成项目承诺。
```

必要上下文（仅帮助理解，不作为主要证据）：
```text
# 企业能力简介
```

## 系统 Draft 判断

Semantic relevance：与招标要求有一定关联
Evidence capability：材料类型具备证明该类事实的可能性
Support level：系统草稿认为材料对同一事实给出了不一致信息
Relationship：不同材料之间存在冲突
来源依据：未找到能够支持当前草稿结论的业务正文

## 系统 Draft 最终结论

证据存在冲突（CONFLICTING_EVIDENCE）

## 系统理由

- 招标要求：企业应说明当前 ISO/IEC 27001 证书的有效截止日期。
- 系统草稿看到的资料范围：qualification-iso27001.md、company-profile.md
- 系统草稿认为不同资料对同一有效性事实给出了冲突观察，当前不能直接选定其中一份。
- 需要核对材料的当前有效性和是否已被更新材料替代。
- 系统草稿风险提示：VALIDITY_MISMATCH。
- 当前来源片段未能证明系统草稿所声称的事实，暂不能进入人工审核。

## 关键证据原文

资料 1：
“名称：ISO/IEC 27001
编号：CM-Q-27001-2024
状态：active
有效至：2027-11-30”
资料 2：
“企业：澄明数科（示范）有限公司
规模：100-300 人。
业务范围：政企应用软件开发、数据交换与治理、系统集成、实施与运维服务。
限制：本资料不构成项目承诺。”

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
x86_64 + Ubuntu 22.04 + PostgreSQL 14：tested
鲲鹏 920 + 麒麟 V10 + 达梦 8：partially_tested（完成安装和基础交换用例，未完成压力测试）
海光 + 统信 UOS + 人大金仓：not_verified
国产数据库组合：unknown
```

必要上下文（仅帮助理解，不作为主要证据）：
```text
# 产品兼容性矩阵
```

## 系统 Draft 判断

Semantic relevance：与招标要求有一定关联
Evidence capability：材料类型具备证明该类事实的可能性
Support level：系统草稿认为材料只覆盖要求的一部分
Relationship：部分相关
来源依据：已找到相关业务正文

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
“x86_64 + Ubuntu 22.04 + PostgreSQL 14：tested
鲲鹏 920 + 麒麟 V10 + 达梦 8：partially_tested（完成安装和基础交换用例，未完成压力测试）
海光 + 统信 UOS + 人大金仓：not_verified
国产数据库组合：unknown”

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
| V2R-001-PERF-DIRECT | 3c81671f-376e-401b-8525-be26929d5b92 | 3c81671f-376e-401b-8525-be26929d5b92 | MCH-0FBD3599DAF932016F62EB9634B997AF | ESPAN-556290DF829683393C94DC83256B7734 | true |
| V2R-003-COMP-DIRECT | 3f9dacfb-2e48-4796-a477-98c60b506831 | 3f9dacfb-2e48-4796-a477-98c60b506831 | MCH-7F11A857F9B5A05D9B22E30CD4F1BEE0 | ESPAN-37AC823A6C7DD8506CA995B24C9D9766 | true |
| V2R-005-ISO-DIRECT | 57b9e5fe-9549-42aa-88d5-fccc5c0afe2e | 57b9e5fe-9549-42aa-88d5-fccc5c0afe2e | MCH-A4C2632EF9126FADD349C3004E1C2D84 | ESPAN-526EF0A7628E652EFFEED01024894E1A | true |
| V2R-002-PERF-PARTIAL | 3c81671f-376e-401b-8525-be26929d5b92 | 3c81671f-376e-401b-8525-be26929d5b92 | MCH-0FBD3599DAF932016F62EB9634B997AF | ESPAN-556290DF829683393C94DC83256B7734 | true |
| V2R-006-ISO-SCOPE | 57b9e5fe-9549-42aa-88d5-fccc5c0afe2e | 57b9e5fe-9549-42aa-88d5-fccc5c0afe2e | MCH-A4C2632EF9126FADD349C3004E1C2D84 | ESPAN-526EF0A7628E652EFFEED01024894E1A | true |
| V2R-021-CORPUS-12 | 9876da6b-40c1-4f2d-b47b-290c7c150f4e | 9876da6b-40c1-4f2d-b47b-290c7c150f4e | MCH-A4211A94C5C7A077F478D979A3ADF86E | ESPAN-403BC1522544E742C897D863B1EB8955 | true |
| V2R-030-CORPUS-21 | 50467edc-0a5e-458f-ba69-1bbf488a115a | 50467edc-0a5e-458f-ba69-1bbf488a115a | MCH-3FD884E9C86C84ADD445F70EC81FADD9 | ESPAN-A9329BA2AE8E03755951632A45574198 | true |
| V2R-015-CORPUS-06 | eef2ae66-8259-4954-9a88-2e184411fcc5 | eef2ae66-8259-4954-9a88-2e184411fcc5 | MCH-C327D3EAD9FC460F07059B7F11323BDB | ESPAN-32F52CE708CC106C1D0717D41BD765FF | true |
| V2R-009-ISO-CONFLICT | 57b9e5fe-9549-42aa-88d5-fccc5c0afe2e | 57b9e5fe-9549-42aa-88d5-fccc5c0afe2e | MCH-A4C2632EF9126FADD349C3004E1C2D84 | ESPAN-526EF0A7628E652EFFEED01024894E1A | true |
| V2R-009-ISO-CONFLICT | b96691fb-e719-4312-8ec9-a9e8acf687c0 | b96691fb-e719-4312-8ec9-a9e8acf687c0 | MCH-04FA33611AFA0AED82194050ED8F63C8 | ESPAN-158E08FA33136AF6B08EB70ACEE77477 | true |
| V2R-004-COMP-PARTIAL | 3f9dacfb-2e48-4796-a477-98c60b506831 | 3f9dacfb-2e48-4796-a477-98c60b506831 | MCH-7F11A857F9B5A05D9B22E30CD4F1BEE0 | ESPAN-37AC823A6C7DD8506CA995B24C9D9766 | true |

系统草稿来源：`SYSTEM_DRAFT_UNREVIEWED`；人工审核前不得写入 Gold。

