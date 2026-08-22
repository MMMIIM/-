# Current Stage

## Stage 14 — Core Flow Simplification & Generation Workbench V1

Priority: **P0**

Stage 13 — MATERIAL PROCESSING / REVIEW UX is frozen with acceptance **PASS**.
The deterministic acceptance fixture verified the existing formal loop:

```text
旧证明失效 → 业务化说明 → 重新读取材料 → 新 Fact Candidate
→ 人工确认材料证明 → 人工确认需求匹配 → 准备度刷新
```

The old Fact is invalidated before the replacement becomes active. No proof is
invented or auto-approved, and the user-facing flow does not require knowledge
of Fact, Mapping, hashes, or internal IDs. Browser acceptance also verified
material-gap context carry-over and safe empty extraction messaging.

Stage 14 goal: simplify the ordinary bid-writer journey while preserving the
backend Control Plane and all frozen contracts. The primary flow is:

```text
项目信息 → 招标文件 → 企业资料 → 审核与补充 → 标书生成 → 核验与导出
```

Allowed scope is the six-stage project shell, navigation/context carry-over,
business-language hierarchy, and a thin generation workbench over existing
persisted chapter/generation state. Professional workspaces remain available
as secondary detail views. No new AI capability, formal business state,
queue/worker, permissions, Agent, Word, or contract semantics are authorized.

Success criteria:

- A normal bid writer can see the current stage, blocking issue, reason, next
  action, and resulting change without backend terminology.
- Generation shows real discrete chapter/task states and existing previews;
  it does not invent percentage progress.
- Existing professional pages remain reachable without becoming the default
  cognitive path.

External authorization: none. Merge, push, and deploy: none.
