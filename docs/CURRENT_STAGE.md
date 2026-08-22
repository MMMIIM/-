# Current Stage

## Stage 14 — Platform Shell & Core Flow IA V1

Priority: **P0**

Status: **IMPLEMENTED · MANUAL ACCEPTANCE PASS**

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

Stage 14 goal: establish the two-level product information architecture while
preserving the backend Control Plane and all frozen contracts. The primary
platform modules are:

```text
工作台 → 投标项目 → 企业资料库 → 标书检查
```

Inside a project, the first-level flow is exactly:

```text
项目准备 → 审核与补充 → 标书生成 → 投标检查
```

Allowed scope is the platform shell, route mapping, four-stage project
projection, navigation/context carry-over, and reuse of existing read models.
Professional workspaces remain available as secondary detail views. No new AI
capability, formal business state, queue/worker, permissions, Agent, Word, or
contract semantics are authorized.

Success criteria:

- A normal bid writer can see the current stage, blocking issue, reason, next
  action, and resulting change without backend terminology.
- The project flow contains exactly four business stages; backend pipeline
  states remain secondary details.
- Existing professional pages remain reachable without becoming the default
  cognitive path.

Manual acceptance checkpoint:

- Platform shell exposes 工作台、投标项目、企业资料库、标书检查; 系统管理 is
  visibly low-frequency and disabled until its authorization foundation exists.
- Project navigation exposes exactly 项目准备、审核与补充、标书生成、投标检查;
  technical workspaces remain reachable as secondary views.
- Workbench actions carry project context into the existing workspace, and the
  existing discrete generation states/preview/retry behavior remain intact.
- No fabricated percentage progress, new formal business state, external AI
  call, contract change, or independent checker engine was introduced.

External authorization: none. Merge, push, and deploy: none.
