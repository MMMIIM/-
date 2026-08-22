# Agent Product Strategy

The future AI 投标助手 / Bid Copilot is a contextual orchestration layer over
formal backend services. It is not a generic chatbot, a knowledge-base chat
page, or a second business Control Plane.

## Product role

The Agent may read project state, prioritize blockers, explain why an action is
blocked, prepare a review, navigate with context, and execute explicitly safe
operations. Formal services remain authoritative for Evidence, Fact, Mapping,
Claim Gate, Readiness, Writer, and bid checks.

High-value starting questions are:

- “帮我把这个项目推进到可以生成。”
- “为什么现在不能生成？”
- “明天截止，我现在先处理什么？”
- “这份新材料能补哪些缺口？”

The preferred UI is contextual Action Cards in the current project/stage, not a
primary empty “AI助手” chat screen.

## Tool boundary

```text
User → Agent → Tool selection → Backend tools → Formal services → Control Plane
```

The Agent must never mutate formal database state outside existing services or
recreate domain truth inside prompts. Evidence Fact approval, Requirement
Mapping approval, Project Fact conflict resolution, and other human decisions
remain human-required.

## Policy and evaluation

Read/search/explain/prioritize and safe navigation may be automatic. Draft or
review preparation may be automatic, but text changes require preview/diff and
formal acceptance. External provider usage remains controlled by Processing
Policy and explicit authorization.

Evaluate Agent quality by task completion, blocker resolution, page hops saved,
time to ready, human decisions per project, action/chat ratio, overrides, and
formal safety violations. The safety target is zero violations; message count
or chat DAU is not a success metric.

Agent V1 is not authorized in the current stage. When authorized, it should
first answer what is missing, what to do next, how to process pending work, and
why an operation is blocked. More complex multi-step assistance follows only
after product evidence.
