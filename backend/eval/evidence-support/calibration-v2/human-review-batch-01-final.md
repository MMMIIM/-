# CALIBRATION V2 HUMAN GOLD REVIEW BATCH 1

> 本批仅供人工审核。所有决定字段保持 null；不得自动批准、不得冻结数据集、不得执行 Calibration。
> Active candidates：36；Rejected：1；本批：10。

## BATCH

- selected IDs：V2R-001-PERF-DIRECT、V2R-003-COMP-DIRECT、V2R-005-ISO-DIRECT、V2R-002-PERF-PARTIAL、V2R-004-COMP-PARTIAL、V2R-006-ISO-SCOPE、V2R-015-CORPUS-06、V2R-008-NO-RELEVANT、V2R-021-CORPUS-12、V2R-030-CORPUS-21
- READY：3
- INSUFFICIENT：6
- NO_RELEVANT：1
- CONFLICT：0
- V2R-009：REJECT_FROM_CALIBRATION / GOLD_DESIGN_INVALID

## REVIEW OPTIONS

每题只能选择 APPROVE、CHANGE 或 REJECT；Codex 不填写人工决定。

# CASE V2R-001-PERF-DIRECT

## WHY_THIS_CASE_IS_IN_CALIBRATION

测试明确业务性能记录是否能直接支持要求。

## 招标要求

企业应提供可核验的数据交换平台性能测试记录。

## 系统找到的资料

### 资料 1

材料名称：performance-report.md
材料类型：产品资料
范围：企业材料
来源定位：chunk MCH-0FBD3599DAF932016F62EB9634B997AF，offset 108–251

Evidence 原文：
```text
产品：澄明数据交换平台 V3.2
环境：8 vCPU、32 GB 内存、PostgreSQL 14、千兆局域网
条件：50 并发、100 万条基准数据、缓存预热后执行 30 分钟
指标：数据目录查询平均响应时间
结果：平均 1.4 秒，P95 1.9 秒。
日期：2025-05-16。
```

必要 Context（仅帮助理解，不替代 Evidence）：
```text
# 数据交换平台性能测试记录
（无）
```

## System Draft Semantic Judgment

semantic relevance：relevant
evidence capability：capable
support level：full_support
semantic relationship：direct
review dimensions：{"subject_match":"match","scope_match":"match","status_match":"match","quantitative_match":"match","entity_match":"match","validity_match":"unknown","source_authority":"match","support_sufficiency":"match"}
reason codes：无
context recovery：[{"dimension_roles":{"validity_match":"NOT_APPLICABLE"},"required_dimensions":[],"supporting_dimensions":[],"not_applicable_dimensions":["validity_match"],"recovery_state":"RESOLVED_BY_CONTEXT","recovered_dimensions":{},"unresolved_dimensions":[],"unresolved_required_dimensions":[],"unresolved_supporting_dimensions":[],"recovered_required_dimensions":[],"context_recovery_rate":null,"context_origins":["SECTION_HEADING","MATERIAL_METADATA"],"exact_span_preserved":true}]

## System Draft Business Status

可以进入证据审核（EVIDENCE_REVIEW_READY）

## 系统理由

- 修复后的业务来源与原系统草稿语义一致。

## 人工审核选项

A. APPROVE：系统判断正确。

B. CHANGE：系统判断需要修改。

C. REJECT：该题不适合成为 Calibration Case。

人工决定：__________

人工理由：__________

---

# CASE V2R-003-COMP-DIRECT

## WHY_THIS_CASE_IS_IN_CALIBRATION

测试兼容性矩阵中的明确 tested 结果能否形成直接支持。

## 招标要求

企业应说明产品在 x86_64、Ubuntu 和 PostgreSQL 环境的兼容性。

## 系统找到的资料

### 资料 1

材料名称：compatibility-matrix.md
材料类型：产品资料
范围：企业材料
来源定位：chunk MCH-7F11A857F9B5A05D9B22E30CD4F1BEE0，offset 103–256

Evidence 原文：
```text
x86_64 + Ubuntu 22.04 + PostgreSQL 14：tested
鲲鹏 920 + 麒麟 V10 + 达梦 8：partially_tested（完成安装和基础交换用例，未完成压力测试）
海光 + 统信 UOS + 人大金仓：not_verified
国产数据库组合：unknown
```

必要 Context（仅帮助理解，不替代 Evidence）：
```text
# 产品兼容性矩阵
（无）
```

## System Draft Semantic Judgment

semantic relevance：relevant
evidence capability：capable
support level：full_support
semantic relationship：direct
review dimensions：{"subject_match":"match","scope_match":"match","status_match":"match","quantitative_match":"unknown","entity_match":"match","validity_match":"unknown","source_authority":"match","support_sufficiency":"match"}
reason codes：无
context recovery：[{"dimension_roles":{"quantitative_match":"REQUIRED","validity_match":"NOT_APPLICABLE"},"required_dimensions":["quantitative_match"],"supporting_dimensions":[],"not_applicable_dimensions":["validity_match"],"recovery_state":"UNRESOLVED_AFTER_CONTEXT","recovered_dimensions":{},"unresolved_dimensions":["quantitative_match"],"unresolved_required_dimensions":["quantitative_match"],"unresolved_supporting_dimensions":[],"recovered_required_dimensions":[],"context_recovery_rate":0,"context_origins":["SECTION_HEADING","MATERIAL_METADATA"],"exact_span_preserved":true}]

## System Draft Business Status

可以进入证据审核（EVIDENCE_REVIEW_READY）

## 系统理由

- 修复后的业务来源与原系统草稿语义一致。

## 人工审核选项

A. APPROVE：系统判断正确。

B. CHANGE：系统判断需要修改。

C. REJECT：该题不适合成为 Calibration Case。

人工决定：__________

人工理由：__________

---

# CASE V2R-005-ISO-DIRECT

## WHY_THIS_CASE_IS_IN_CALIBRATION

测试资质名称、编号、状态和有效期是否构成完整证明。

## 招标要求

企业应提供当前有效的 ISO/IEC 27001 认证信息。

## 系统找到的资料

### 资料 1

材料名称：qualification-iso27001.md
材料类型：资质材料
范围：企业材料
来源定位：chunk MCH-A4C2632EF9126FADD349C3004E1C2D84，offset 110–170

Evidence 原文：
```text
名称：ISO/IEC 27001
编号：CM-Q-27001-2024
状态：active
有效至：2027-11-30
```

必要 Context（仅帮助理解，不替代 Evidence）：
```text
# ISO 27001 受控记录
（无）
```

## System Draft Semantic Judgment

semantic relevance：relevant
evidence capability：capable
support level：full_support
semantic relationship：direct
review dimensions：{"subject_match":"match","scope_match":"match","status_match":"match","quantitative_match":"unknown","entity_match":"match","validity_match":"match","source_authority":"match","support_sufficiency":"match"}
reason codes：无
context recovery：[{"dimension_roles":{"quantitative_match":"REQUIRED"},"required_dimensions":["quantitative_match"],"supporting_dimensions":[],"not_applicable_dimensions":[],"recovery_state":"UNRESOLVED_AFTER_CONTEXT","recovered_dimensions":{},"unresolved_dimensions":["quantitative_match"],"unresolved_required_dimensions":["quantitative_match"],"unresolved_supporting_dimensions":[],"recovered_required_dimensions":[],"context_recovery_rate":0,"context_origins":["SECTION_HEADING","MATERIAL_METADATA"],"exact_span_preserved":true}]

## System Draft Business Status

可以进入证据审核（EVIDENCE_REVIEW_READY）

## 系统理由

- 修复后的业务来源与原系统草稿语义一致。

## 人工审核选项

A. APPROVE：系统判断正确。

B. CHANGE：系统判断需要修改。

C. REJECT：该题不适合成为 Calibration Case。

人工决定：__________

人工理由：__________

---

# CASE V2R-002-PERF-PARTIAL

## WHY_THIS_CASE_IS_IN_CALIBRATION

测试系统能否区分“没有数值证据”和“有明确数值但不满足要求”。

## 招标要求

企业应证明接口 P95 响应时间不超过 1 秒。

## 系统找到的资料

### 资料 1

材料名称：performance-report.md
材料类型：产品资料
范围：企业材料
来源定位：chunk MCH-0FBD3599DAF932016F62EB9634B997AF，offset 108–251

Evidence 原文：
```text
产品：澄明数据交换平台 V3.2
环境：8 vCPU、32 GB 内存、PostgreSQL 14、千兆局域网
条件：50 并发、100 万条基准数据、缓存预热后执行 30 分钟
指标：数据目录查询平均响应时间
结果：平均 1.4 秒，P95 1.9 秒。
日期：2025-05-16。
```

必要 Context（仅帮助理解，不替代 Evidence）：
```text
# 数据交换平台性能测试记录
（无）
```

## System Draft Semantic Judgment

semantic relevance：relevant
evidence capability：capable
support level：partial_support
semantic relationship：partial
review dimensions：{"subject_match":"match","scope_match":"unknown","status_match":"unknown","quantitative_match":"mismatch","entity_match":"unknown","validity_match":"unknown","source_authority":"match","support_sufficiency":"mismatch"}
reason codes：QUANTITATIVE_MISMATCH、SUPPORT_INSUFFICIENT
context recovery：[{"dimension_roles":{"scope_match":"REQUIRED","status_match":"REQUIRED","entity_match":"REQUIRED","validity_match":"NOT_APPLICABLE"},"required_dimensions":["scope_match","status_match","entity_match"],"supporting_dimensions":[],"not_applicable_dimensions":["validity_match"],"recovery_state":"RESOLVED_BY_CONTEXT","recovered_dimensions":{"scope_match":{"status":"resolved","origin":"EXACT_SPAN","source_text":"产品：澄明数据交换平台 V3.2\n环境：8 vCPU、32 GB 内存、PostgreSQL 14、千兆局域网\n条件：50 并发、100 万条基准数据、缓存预热后执行 30 分钟\n指标：数据目录查询平均响应时间\n结果：平均 1.4 秒，P95 1.9 秒。\n日期：2025-05-16。","source_id":"MCH-0FBD3599DAF932016F62EB9634B997AF","chunk_id":"MCH-0FBD3599DAF932016F62EB9634B997AF"},"status_match":{"status":"resolved","origin":"EXACT_SPAN","source_text":"产品：澄明数据交换平台 V3.2\n环境：8 vCPU、32 GB 内存、PostgreSQL 14、千兆局域网\n条件：50 并发、100 万条基准数据、缓存预热后执行 30 分钟\n指标：数据目录查询平均响应时间\n结果：平均 1.4 秒，P95 1.9 秒。\n日期：2025-05-16。","source_id":"MCH-0FBD3599DAF932016F62EB9634B997AF","chunk_id":"MCH-0FBD3599DAF932016F62EB9634B997AF"},"entity_match":{"status":"resolved","origin":"EXACT_SPAN","source_text":"产品：澄明数据交换平台 V3.2\n环境：8 vCPU、32 GB 内存、PostgreSQL 14、千兆局域网\n条件：50 并发、100 万条基准数据、缓存预热后执行 30 分钟\n指标：数据目录查询平均响应时间\n结果：平均 1.4 秒，P95 1.9 秒。\n日期：2025-05-16。","source_id":"MCH-0FBD3599DAF932016F62EB9634B997AF","chunk_id":"MCH-0FBD3599DAF932016F62EB9634B997AF"}},"unresolved_dimensions":[],"unresolved_required_dimensions":[],"unresolved_supporting_dimensions":[],"recovered_required_dimensions":["scope_match","status_match","entity_match"],"context_recovery_rate":1,"context_origins":["SECTION_HEADING","MATERIAL_METADATA"],"exact_span_preserved":true}]

## System Draft Business Status

证据不足（INSUFFICIENT_EVIDENCE）

## 系统理由

- 实际 P95 1.9 秒高于要求上限 1 秒；属于明确不满足事实，不是缺少数值证据。

## 人工审核选项

A. APPROVE：系统判断正确。

B. CHANGE：系统判断需要修改。

C. REJECT：该题不适合成为 Calibration Case。

人工决定：__________

人工理由：__________

---

# CASE V2R-004-COMP-PARTIAL

## WHY_THIS_CASE_IS_IN_CALIBRATION

测试多环境、多状态兼容性要求是否被误判为全部满足。

## 招标要求

企业应证明所有国产数据库组合均已完成压力测试。

## 系统找到的资料

### 资料 1

材料名称：compatibility-matrix.md
材料类型：产品资料
范围：企业材料
来源定位：chunk MCH-7F11A857F9B5A05D9B22E30CD4F1BEE0，offset 103–256

Evidence 原文：
```text
x86_64 + Ubuntu 22.04 + PostgreSQL 14：tested
鲲鹏 920 + 麒麟 V10 + 达梦 8：partially_tested（完成安装和基础交换用例，未完成压力测试）
海光 + 统信 UOS + 人大金仓：not_verified
国产数据库组合：unknown
```

必要 Context（仅帮助理解，不替代 Evidence）：
```text
# 产品兼容性矩阵
（无）
```

## System Draft Semantic Judgment

semantic relevance：relevant
evidence capability：capable
support level：partial_support
semantic relationship：partial
review dimensions：{"subject_match":"match","scope_match":"unknown","status_match":"mismatch","quantitative_match":"unknown","entity_match":"unknown","validity_match":"unknown","source_authority":"match","support_sufficiency":"mismatch"}
reason codes：STATUS_MISMATCH、SUPPORT_INSUFFICIENT
context recovery：[{"dimension_roles":{"scope_match":"REQUIRED","quantitative_match":"NOT_APPLICABLE","entity_match":"REQUIRED","validity_match":"NOT_APPLICABLE"},"required_dimensions":["scope_match","entity_match"],"supporting_dimensions":[],"not_applicable_dimensions":["quantitative_match","validity_match"],"recovery_state":"UNRESOLVED_AFTER_CONTEXT","recovered_dimensions":{"scope_match":{"status":"resolved","origin":"EXACT_SPAN","source_text":"x86_64 + Ubuntu 22.04 + PostgreSQL 14：tested\n鲲鹏 920 + 麒麟 V10 + 达梦 8：partially_tested（完成安装和基础交换用例，未完成压力测试）\n海光 + 统信 UOS + 人大金仓：not_verified\n国产数据库组合：unknown","source_id":"MCH-7F11A857F9B5A05D9B22E30CD4F1BEE0","chunk_id":"MCH-7F11A857F9B5A05D9B22E30CD4F1BEE0"}},"unresolved_dimensions":["entity_match"],"unresolved_required_dimensions":["entity_match"],"unresolved_supporting_dimensions":[],"recovered_required_dimensions":["scope_match"],"context_recovery_rate":0.5,"context_origins":["SECTION_HEADING","MATERIAL_METADATA"],"exact_span_preserved":true}]

## System Draft Business Status

证据不足（INSUFFICIENT_EVIDENCE）

## 系统理由

- 来源直接表明至少部分数据库组合未完成压力测试，另有组合未验证或未知，因此不能支持“所有组合均已完成压力测试”的全称要求。

## 人工审核选项

A. APPROVE：系统判断正确。

B. CHANGE：系统判断需要修改。

C. REJECT：该题不适合成为 Calibration Case。

人工决定：__________

人工理由：__________

---

# CASE V2R-006-ISO-SCOPE

## WHY_THIS_CASE_IS_IN_CALIBRATION

测试相关证书存在但指定主体和项目范围没有被证明时的边界。

## 招标要求

企业应提供指定项目主体的 ISO/IEC 27001 证书。

## 系统找到的资料

### 资料 1

材料名称：qualification-iso27001.md
材料类型：资质材料
范围：企业材料
来源定位：chunk MCH-A4C2632EF9126FADD349C3004E1C2D84，offset 110–170

Evidence 原文：
```text
名称：ISO/IEC 27001
编号：CM-Q-27001-2024
状态：active
有效至：2027-11-30
```

必要 Context（仅帮助理解，不替代 Evidence）：
```text
# ISO 27001 受控记录
（无）
```

## System Draft Semantic Judgment

semantic relevance：relevant
evidence capability：capable
support level：partial_support
semantic relationship：partial
review dimensions：{"subject_match":"mismatch","scope_match":"mismatch","status_match":"unknown","quantitative_match":"unknown","entity_match":"mismatch","validity_match":"unknown","source_authority":"match","support_sufficiency":"mismatch"}
reason codes：SUBJECT_MISMATCH、SCOPE_MISMATCH、ENTITY_MISMATCH、SUPPORT_INSUFFICIENT
context recovery：[{"dimension_roles":{"status_match":"REQUIRED","quantitative_match":"REQUIRED","validity_match":"REQUIRED"},"required_dimensions":["status_match","quantitative_match","validity_match"],"supporting_dimensions":[],"not_applicable_dimensions":[],"recovery_state":"UNRESOLVED_AFTER_CONTEXT","recovered_dimensions":{"status_match":{"status":"resolved","origin":"EXACT_SPAN","source_text":"名称：ISO/IEC 27001\n编号：CM-Q-27001-2024\n状态：active\n有效至：2027-11-30","source_id":"MCH-A4C2632EF9126FADD349C3004E1C2D84","chunk_id":"MCH-A4C2632EF9126FADD349C3004E1C2D84"},"validity_match":{"status":"resolved","origin":"EXACT_SPAN","source_text":"名称：ISO/IEC 27001\n编号：CM-Q-27001-2024\n状态：active\n有效至：2027-11-30","source_id":"MCH-A4C2632EF9126FADD349C3004E1C2D84","chunk_id":"MCH-A4C2632EF9126FADD349C3004E1C2D84"}},"unresolved_dimensions":["quantitative_match"],"unresolved_required_dimensions":["quantitative_match"],"unresolved_supporting_dimensions":[],"recovered_required_dimensions":["status_match","validity_match"],"context_recovery_rate":0.6666666666666666,"context_origins":["SECTION_HEADING","MATERIAL_METADATA"],"exact_span_preserved":true}]

## System Draft Business Status

证据不足（INSUFFICIENT_EVIDENCE）

## 系统理由

- 来源确实包含 ISO 证书事实，但未证明指定项目主体，属于相关但主体/范围不足。

## 人工审核选项

A. APPROVE：系统判断正确。

B. CHANGE：系统判断需要修改。

C. REJECT：该题不适合成为 Calibration Case。

人工决定：__________

人工理由：__________

---

# CASE V2R-015-CORPUS-06

## WHY_THIS_CASE_IS_IN_CALIBRATION

测试行业公开规范与企业自身实施能力之间的边界。

## 招标要求

企业应证明自身具备与该公开行业规范相符的实施能力。

## 系统找到的资料

### 资料 1

材料名称：“互联网+政务服务”技术体系建设指南（官方摘录）.md
材料类型：行业/技术公开资料
范围：政府/行业公开资料
来源定位：chunk MCH-C327D3EAD9FC460F07059B7F11323BDB，offset 52–94

Evidence 原文：
```text
指南提出统一政务服务信息资源目录、交换体系和平台支撑，推动跨部门数据共享与服务协同。
```

必要 Context（仅帮助理解，不替代 Evidence）：
```text
来源机构：国务院办公厅
文号：国办函〔2016〕108号
（无）
```

## System Draft Semantic Judgment

semantic relevance：relevant
evidence capability：not_capable
support level：insufficient
semantic relationship：related
review dimensions：{"subject_match":"mismatch","scope_match":"mismatch","status_match":"unknown","quantitative_match":"unknown","entity_match":"mismatch","validity_match":"unknown","source_authority":"mismatch","support_sufficiency":"mismatch"}
reason codes：SOURCE_NOT_EVIDENCE_CAPABLE、SUPPORT_INSUFFICIENT
context recovery：[{"dimension_roles":{"status_match":"REQUIRED","quantitative_match":"NOT_APPLICABLE","validity_match":"NOT_APPLICABLE"},"required_dimensions":["status_match"],"supporting_dimensions":[],"not_applicable_dimensions":["quantitative_match","validity_match"],"recovery_state":"UNRESOLVED_AFTER_CONTEXT","recovered_dimensions":{},"unresolved_dimensions":["status_match"],"unresolved_required_dimensions":["status_match"],"unresolved_supporting_dimensions":[],"recovered_required_dimensions":[],"context_recovery_rate":0,"context_origins":["SECTION_HEADING","MATERIAL_METADATA"],"exact_span_preserved":true}]

## System Draft Business Status

证据不足（INSUFFICIENT_EVIDENCE）

## 系统理由

- 行业规范与需求语义相关，但不能证明企业自身已具备相应实施能力。

## 人工审核选项

A. APPROVE：系统判断正确。

B. CHANGE：系统判断需要修改。

C. REJECT：该题不适合成为 Calibration Case。

人工决定：__________

人工理由：__________

---

# CASE V2R-008-NO-RELEVANT

## WHY_THIS_CASE_IS_IN_CALIBRATION

测试相近资质资料是否会被误当成第三方防火墙检测报告。

## 招标要求

企业应提供第三方防火墙权威检测报告扫描件。

## 系统找到的资料

### 资料 1

材料名称：qualification-iso27001.md
材料类型：资质材料
范围：企业材料
来源定位：chunk MCH-A4C2632EF9126FADD349C3004E1C2D84，offset 110–170

Evidence 原文：
```text
名称：ISO/IEC 27001
编号：CM-Q-27001-2024
状态：active
有效至：2027-11-30
```

必要 Context（仅帮助理解，不替代 Evidence）：
```text
# ISO 27001 受控记录
（无）
```

## System Draft Semantic Judgment

semantic relevance：irrelevant
evidence capability：not_capable
support level：insufficient
semantic relationship：unrelated
review dimensions：{"subject_match":"mismatch","scope_match":"mismatch","status_match":"unknown","quantitative_match":"unknown","entity_match":"mismatch","validity_match":"unknown","source_authority":"mismatch","support_sufficiency":"mismatch"}
reason codes：SEMANTICALLY_IRRELEVANT、SOURCE_NOT_EVIDENCE_CAPABLE
context recovery：[{"dimension_roles":{"status_match":"REQUIRED","quantitative_match":"NOT_APPLICABLE","validity_match":"NOT_APPLICABLE"},"required_dimensions":["status_match"],"supporting_dimensions":[],"not_applicable_dimensions":["quantitative_match","validity_match"],"recovery_state":"RESOLVED_BY_CONTEXT","recovered_dimensions":{"status_match":{"status":"resolved","origin":"EXACT_SPAN","source_text":"名称：ISO/IEC 27001\n编号：CM-Q-27001-2024\n状态：active\n有效至：2027-11-30","source_id":"MCH-A4C2632EF9126FADD349C3004E1C2D84","chunk_id":"MCH-A4C2632EF9126FADD349C3004E1C2D84"}},"unresolved_dimensions":[],"unresolved_required_dimensions":[],"unresolved_supporting_dimensions":[],"recovered_required_dimensions":["status_match"],"context_recovery_rate":1,"context_origins":["SECTION_HEADING","MATERIAL_METADATA"],"exact_span_preserved":true}]

## System Draft Business Status

没有相关证据（NO_RELEVANT_EVIDENCE）

## 系统理由

- 修复后的业务来源与原系统草稿语义一致。

## 人工审核选项

A. APPROVE：系统判断正确。

B. CHANGE：系统判断需要修改。

C. REJECT：该题不适合成为 Calibration Case。

人工决定：__________

人工理由：__________

---

# CASE V2R-021-CORPUS-12

## WHY_THIS_CASE_IS_IN_CALIBRATION

测试第三方组件依赖能否被错误表述为企业自有能力。

## 招标要求

企业应提供与本项目范围相关的可核验材料。

## 系统找到的资料

### 资料 1

材料名称：authorization-partner.md
材料类型：其他资料
范围：企业材料
来源定位：chunk MCH-A4211A94C5C7A077F478D979A3ADF86E，offset 310–362

Evidence 原文：
```text
平台可集成某开源数据库和消息组件；部署、许可和技术支持依赖第三方，企业不将第三方能力表述为自有产品能力。
```

必要 Context（仅帮助理解，不替代 Evidence）：
```text
# 第三方产品授权说明
（无）
```

## System Draft Semantic Judgment

semantic relevance：relevant
evidence capability：capable
support level：partial_support
semantic relationship：partial
review dimensions：{"subject_match":"match","scope_match":"unknown","status_match":"unknown","quantitative_match":"unknown","entity_match":"unknown","validity_match":"unknown","source_authority":"match","support_sufficiency":"mismatch"}
reason codes：SUPPORT_INSUFFICIENT
context recovery：[{"dimension_roles":{"scope_match":"REQUIRED","status_match":"REQUIRED","quantitative_match":"NOT_APPLICABLE","entity_match":"REQUIRED","validity_match":"NOT_APPLICABLE"},"required_dimensions":["scope_match","status_match","entity_match"],"supporting_dimensions":[],"not_applicable_dimensions":["quantitative_match","validity_match"],"recovery_state":"UNRESOLVED_AFTER_CONTEXT","recovered_dimensions":{"scope_match":{"status":"resolved","origin":"MATERIAL_METADATA","source_text":"material_name=authorization-partner.md；material_type=other；corpus_scope=ENTERPRISE_PRIVATE；project_name=STAGE20-L3-SYNTHETIC-ENTERPRISE [NOT_REAL_CUSTOMER_DATA]","source_id":null,"chunk_id":null}},"unresolved_dimensions":["status_match","entity_match"],"unresolved_required_dimensions":["status_match","entity_match"],"unresolved_supporting_dimensions":[],"recovered_required_dimensions":["scope_match"],"context_recovery_rate":0.3333333333333333,"context_origins":["SECTION_HEADING","MATERIAL_METADATA"],"exact_span_preserved":true}]

## System Draft Business Status

证据不足（INSUFFICIENT_EVIDENCE）

## 系统理由

- 修复后的业务来源与原系统草稿语义一致。

## 人工审核选项

A. APPROVE：系统判断正确。

B. CHANGE：系统判断需要修改。

C. REJECT：该题不适合成为 Calibration Case。

人工决定：__________

人工理由：__________

---

# CASE V2R-030-CORPUS-21

## WHY_THIS_CASE_IS_IN_CALIBRATION

测试项目案例存在但验收或项目状态不足时的保守判断。

## 招标要求

企业应提供同类项目的实施及验收依据。

## 系统找到的资料

### 资料 1

材料名称：case-city-governance.md
材料类型：项目案例
范围：企业材料
来源定位：chunk MCH-3FD884E9C86C84ADD445F70EC81FADD9，offset 302–368

Evidence 原文：
```text
项目：景云城市治理数据平台；范围：数据目录、交换任务、统一门户和运行监测；项目状态：已完成模拟案例；验收日期：2025-11-20。
```

必要 Context（仅帮助理解，不替代 Evidence）：
```text
# 城市治理数据平台案例
（无）
```

## System Draft Semantic Judgment

semantic relevance：relevant
evidence capability：capable
support level：partial_support
semantic relationship：partial
review dimensions：{"subject_match":"match","scope_match":"unknown","status_match":"unknown","quantitative_match":"unknown","entity_match":"unknown","validity_match":"unknown","source_authority":"match","support_sufficiency":"mismatch"}
reason codes：SUPPORT_INSUFFICIENT
context recovery：[{"dimension_roles":{"scope_match":"REQUIRED","status_match":"REQUIRED","quantitative_match":"NOT_APPLICABLE","entity_match":"REQUIRED","validity_match":"NOT_APPLICABLE"},"required_dimensions":["scope_match","status_match","entity_match"],"supporting_dimensions":[],"not_applicable_dimensions":["quantitative_match","validity_match"],"recovery_state":"RESOLVED_BY_CONTEXT","recovered_dimensions":{"scope_match":{"status":"resolved","origin":"EXACT_SPAN","source_text":"项目：景云城市治理数据平台；范围：数据目录、交换任务、统一门户和运行监测；项目状态：已完成模拟案例；验收日期：2025-11-20。","source_id":"MCH-3FD884E9C86C84ADD445F70EC81FADD9","chunk_id":"MCH-3FD884E9C86C84ADD445F70EC81FADD9"},"status_match":{"status":"resolved","origin":"EXACT_SPAN","source_text":"项目：景云城市治理数据平台；范围：数据目录、交换任务、统一门户和运行监测；项目状态：已完成模拟案例；验收日期：2025-11-20。","source_id":"MCH-3FD884E9C86C84ADD445F70EC81FADD9","chunk_id":"MCH-3FD884E9C86C84ADD445F70EC81FADD9"},"entity_match":{"status":"resolved","origin":"EXACT_SPAN","source_text":"项目：景云城市治理数据平台；范围：数据目录、交换任务、统一门户和运行监测；项目状态：已完成模拟案例；验收日期：2025-11-20。","source_id":"MCH-3FD884E9C86C84ADD445F70EC81FADD9","chunk_id":"MCH-3FD884E9C86C84ADD445F70EC81FADD9"}},"unresolved_dimensions":[],"unresolved_required_dimensions":[],"unresolved_supporting_dimensions":[],"recovered_required_dimensions":["scope_match","status_match","entity_match"],"context_recovery_rate":1,"context_origins":["SECTION_HEADING","MATERIAL_METADATA"],"exact_span_preserved":true}]

## System Draft Business Status

证据不足（INSUFFICIENT_EVIDENCE）

## 系统理由

- 修复后的业务来源与原系统草稿语义一致。

## 人工审核选项

A. APPROVE：系统判断正确。

B. CHANGE：系统判断需要修改。

C. REJECT：该题不适合成为 Calibration Case。

人工决定：__________

人工理由：__________

---

## REVIEW STATE

- Human reviewed：0
- Automatically approved：0
- Dataset frozen：NO
- Calibration executed：NO
- Manual Sample Gate：YES

## KNOWN GAPS

- class imbalance
- CONFLICT case missing from valid calibration set
- REAL_RETRIEVAL_OUTPUT = 0
- CURATED_REAL_SOURCE_TOP5 = 0
- Provider network remains BLOCKED_BY_PROVIDER_NETWORK

