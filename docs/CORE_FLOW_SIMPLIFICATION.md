# Core Flow Simplification — Stage 14

This is a navigation and information-hierarchy decision, not a new domain
model. Existing backend services, persisted states, contracts, and audit
objects remain authoritative.

## Platform-level primary navigation

```text
工作台 → 投标项目 → 企业资料库 → 标书检查
```

系统管理只作为低频入口置于导航底部；尚未授权或尚未具备实现的模块不
伪装成可用功能。

## Project four-stage journey

| 主流程阶段 | 现有页面投影 | 默认给用户看的重点 | 专业详情入口 |
| --- | --- | --- | --- |
| 项目准备 | 概览、招标文件、需求解析、企业材料 | 项目是什么、招标文件是否就绪、允许使用哪些企业资料 | 解析任务、来源定位、材料范围 |
| 审核与补充 | 材料准备度、材料处理、审核中心 | 缺什么、为什么重要、补什么、确认什么 | Evidence/Fact/Mapping 详情 |
| 标书生成 | 标书、响应规划 | 章节状态、可生成条件、正文预览 | Plan、Claim、Coverage 明细 |
| 投标检查 | 风险复核、版本记录 | 风险结论、完整性、版本确认、可复制/下载正文 | 终检规则、版本审计 |

The shell may keep the existing tab projections as a secondary “专业工作区”
so existing deep links and expert workflows are not removed. Technical IDs,
contract versions, hashes, provider audits, and lifecycle metadata belong in
expandable advanced details (Level 3), not primary cards.

## Interaction rules

1. Every stage opens with the business answer: what is happening, why it
   matters, what needs attention, and the next action.
2. Actions carry project, requirement, material, review, or chapter context
   forward automatically. The user should not re-select the same object.
3. Progress is discrete: waiting, processing, needs attention, ready,
   completed, or failed. No fabricated percentage or time estimate.
4. A failed or blocked state exposes a safe explanation and an action; internal
   error codes remain behind “查看详情”.
5. Existing professional pages are reused rather than reimplemented.
