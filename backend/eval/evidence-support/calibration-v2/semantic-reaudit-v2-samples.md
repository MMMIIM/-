# Calibration V2 Semantic Re-audit — Manual Sample Gate

本文件只记录 SYSTEM_DRAFT_REAUDITED 结果，不构成 HUMAN_GOLD。

## CASE A — Positive: V2R-003-COMP-DIRECT

Requirement 原文：企业应说明产品在 x86_64、Ubuntu 和 PostgreSQL 环境的兼容性。

Source / Top5 原文：x86_64 + Ubuntu 22.04 + PostgreSQL 14：tested
鲲鹏 920 + 麒麟 V10 + 达梦 8：partially_tested（完成安装和基础交换用例，未完成压力测试）
海光 + 统信 UOS + 人大金仓：not_verified
国产数据库组合：unknown


Selected exact span：compatibility-matrix.md；chunk=MCH-7F11A857F9B5A05D9B22E30CD4F1BEE0；offset=103-256；hash=623f699df461219e4f6ce813596a352300ed47692c630db6482a97cfc41d37d5
Context window：# 产品兼容性矩阵 → （无）

System decision：EVIDENCE_REVIEW_READY
Expected / Gold：EVIDENCE_REVIEW_READY（SYSTEM_DRAFT_UNREVIEWED）
Semantic audit：修复后的业务来源与原系统草稿语义一致。
PASS/FAIL：SYSTEM_DRAFT_REAUDITED（未人工批准）

新语义：relevance=relevant, capability=capable, support=full_support, relationship=direct, reasons=none
## CASE B — Numeric adverse fact boundary: V2R-002-PERF-PARTIAL

Requirement 原文：企业应证明接口 P95 响应时间不超过 1 秒。

Source / Top5 原文：产品：澄明数据交换平台 V3.2
环境：8 vCPU、32 GB 内存、PostgreSQL 14、千兆局域网
条件：50 并发、100 万条基准数据、缓存预热后执行 30 分钟
指标：数据目录查询平均响应时间
结果：平均 1.4 秒，P95 1.9 秒。
日期：2025-05-16。


Selected exact span：performance-report.md；chunk=MCH-0FBD3599DAF932016F62EB9634B997AF；offset=108-251；hash=5a54f61d10c64f26414f8dcfb93f3c1eb25076f1063d97f8200f42cad981843c
Context window：# 数据交换平台性能测试记录 → （无）

System decision：INSUFFICIENT_EVIDENCE
Expected / Gold：INSUFFICIENT_EVIDENCE（SYSTEM_DRAFT_UNREVIEWED）
Semantic audit：实际 P95 1.9 秒高于要求上限 1 秒；属于明确不满足事实，不是缺少数值证据。
PASS/FAIL：SYSTEM_DRAFT_REAUDITED（未人工批准）

新语义：relevance=relevant, capability=capable, support=partial_support, relationship=partial, reasons=QUANTITATIVE_MISMATCH+SUPPORT_INSUFFICIENT
## CASE C — Invalid conflict Gold: V2R-009-ISO-CONFLICT

Requirement 原文：企业应说明当前 ISO/IEC 27001 证书的有效截止日期。

Source / Top5 原文：名称：ISO/IEC 27001
编号：CM-Q-27001-2024
状态：active
有效至：2027-11-30

第二来源 / Top5 原文：企业：澄明数科（示范）有限公司
规模：100-300 人。
业务范围：政企应用软件开发、数据交换与治理、系统集成、实施与运维服务。
限制：本资料不构成项目承诺。

Selected exact span：qualification-iso27001.md；chunk=MCH-A4C2632EF9126FADD349C3004E1C2D84；offset=110-170；hash=4aad371afadcb5d360f7461d405d06e706132aa072271064a297010ab458572f
Context window：# ISO 27001 受控记录 → （无）

System decision：REJECT_FROM_CALIBRATION
Expected / Gold：CONFLICTING_EVIDENCE（SYSTEM_DRAFT_UNREVIEWED）
Semantic audit：REJECT_FROM_CALIBRATION
PASS/FAIL：FAIL — GOLD_DESIGN_INVALID

## Review boundary

Human reviewed：0。V2R-009 不进入重新聚合统计；其第二来源没有同维度 observed value。
