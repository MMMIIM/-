# User Experience Principles

The primary users are ordinary business users and professional bid writers,
not AI engineers or system architects.

## Primary questions

Every page should answer, in order:

1. What is happening?
2. Why does it matter?
3. What needs my attention?
4. What should I do next?

Backend complexity must reduce to a clear decision, not become user cognitive
burden.

## Information hierarchy

- **Primary:** current status, blocker, risk, next action, and impact.
- **Supporting:** requirement, source, material, evidence, affected scope, and
  decision reason.
- **Audit / Technical:** IDs, hashes, contract versions, provider details, and
  lifecycle metadata.

Technical information is available under “查看详情”, “高级信息”, or “审计记录”
but is folded by default.

## Business vocabulary

| Internal term | User-facing term |
| --- | --- |
| Evidence Readiness | 材料准备度 |
| Evidence Review | 证据确认 |
| Evidence Fact | 材料证明内容 |
| Mapping | 需求匹配情况 |
| Claim Gate | 内容风险检查 |
| Project Fact | 项目统一信息 |
| Propagation | 修改影响范围 / 全局同步 |
| Mention Ledger | 正文引用位置 |
| NO_EVIDENCE | 缺少证明材料 |
| SUPPORTED | 材料已满足 |
| CONFLICT | 信息存在冲突 |
| READY_TO_GENERATE | 可进入生成 |

Technical enum and reason codes belong in advanced/audit details, not primary
headings or action labels.

## Interaction rules

Use progressive disclosure, preserve provenance, and minimize page switching,
repeated confirmation, duplicate data entry, and manual searching. Carry the
relevant project, requirement, material, review item, and fact context into the
next action automatically. Explain important issues as: what happened, why it
happened, what it affects, and the available next action.
