# Product Information Architecture

This document defines the user-facing information architecture. It does not
change the backend Control Plane, contracts, or formal lifecycle semantics.

## Platform level

| Platform module | User question | Current implementation | Level |
| --- | --- | --- | --- |
| 工作台 | 今天什么需要我处理？ | Project read model, task summary, deadline and next actions | 1 |
| 投标项目 | 我要做哪个项目？ | Existing project list and project workspace entry | 1 |
| 企业资料库 | 公司有什么资料？ | Existing company-material service, scoped by project until a global library read model exists | 1 |
| 标书检查 | 已有标书能否交付？ | Safe entry over existing project risk/version checks; independent upload checker remains unavailable until a formal service exists | 1 |
| 系统管理 | 谁能管理系统配置？ | Low-frequency placeholder, not exposed as a primary business action | bottom |

Future 文档模板 is intentionally hidden until Word/document-formatting work is
authorized and implemented.

## Project workspace

| Existing route/page | Project stage | Level | Treatment |
| --- | --- | --- | --- |
| 概览、招标文件、需求解析、企业材料 | 项目准备 | 1/2 | Keep and expose through the preparation stage |
| 材料准备度、材料处理、审核中心 | 审核与补充 | 1/2 | Aggregate as business issues; preserve deep links |
| 企业证据复核 | 审核与补充 | 2 | Keep as professional review detail |
| 响应规划、标书 | 标书生成 | 1/2 | Keep chapter-oriented generation workspace |
| 风险复核、版本记录 | 投标检查 | 1/2 | Combine final delivery decision and history |
| Plan、Claim、Coverage tables | 标书生成 | 2 | Keep behind professional workspace |
| IDs, hashes, contracts, provider audit | any | 3 | Advanced/audit details only |

The project Stepper contains exactly four first-level stages:

```text
项目准备 → 审核与补充 → 标书生成 → 投标检查
```

## Information hierarchy

Level 1 answers status, blocker, impact, and next action. Level 2 exposes the
requirement, source, material, affected scope, and decision reason. Level 3 is
collapsed audit detail. Navigation expresses business tasks rather than
backend pipeline stages.
