# Current Stage

## Stage 15 — Generation Workbench V1

Priority: **P0**
Status: **IMPLEMENTED · MANUAL ACCEPTANCE PARTIAL**

Stage 13 — Material Processing / Review UX and Stage 14 — Platform Shell &
Core Flow IA are both frozen with acceptance **PASS**.

## Goal

Turn the existing generation experience into a chapter-oriented, observable
workspace inside the accepted project flow:

```text
项目准备 → 审核与补充 → 标书生成 → 投标检查
```

Users should understand which chapters are waiting, generating, checking,
complete, or failed, and inspect completed content without learning Writer
Task, Guard, or Coverage terminology.

## Implemented scope

- Existing persisted `document_generation_tasks` are exposed through the
  separate `documentGenerations` project read model.
- The UI restores the latest generation on refresh and polls existing detail
  data; no queue, worker, WebSocket, SSE, or new lifecycle state was added.
- Chapter states are projected deterministically as 等待生成、生成中、检查中、
  已完成、生成失败. Completed output is previewed immediately when present;
  failed chapters remain selectable and do not hide other chapters.
- Existing failed-batch retry and completed-version chapter regeneration remain
  the only retry actions.
- A finalized version exposes the existing [开始投标检查] transition.
- No fake percentage, token streaming, Writer contract change, Claim Gate
  change, Evidence/Fact/Mapping change, Agent, Word, RAG, permissions, or
  deployment work was introduced.

## Acceptance status

Deterministic frontend fixtures and the local browser verified chapter
directory, persisted task restoration, generating/checking/failed projections,
partial-failure isolation, and absence of percentage progress. A synthetic
multi-chapter run was attempted once; the local runtime was configured with
`GENERATION_PROVIDER=semantic_gateway`, so two chapters received the existing
safe gateway failure audit and no completed version was produced. No retry or
additional gateway call is authorized in this stage. Stage 15 therefore remains
partial until a mock-provider or explicitly authorized runtime can demonstrate
a completed chapter preview and the final 投标检查 handoff.

## Stop conditions

Stop before any external model/provider call, contract semantic change, new
formal state, queue/worker infrastructure, or destructive DB/Git action.

External authorization: **none**. ADR required: **no**. Roadmap change: **no**.
Merge, push, and deploy: **none**.
