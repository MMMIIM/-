# Current Stage

## Stage 15 — Generation Workbench V1

Priority: **P0**
Status: **PASS · FROZEN**

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
partial-failure isolation, absence of percentage progress, and persisted
completed previews. A deterministic local Mock Provider acceptance run then
used the existing formal Writer path: three real chapter tasks were created,
all three succeeded, a finalized `pass` version was persisted, refresh restored
the chapter states and正文, and the existing 开始投标检查 action entered Stage
4. No fake progress, direct database insertion, Writer bypass, or new lifecycle
state was used.

The earlier `GENERATION_PROVIDER=semantic_gateway` run remains a separate
known operational blocker: two chapters received the safe gateway failure
audit (two attempts each, four gateway request attempts in total). It was not
changed or retried during this acceptance.

## Stop conditions

Stop before any external model/provider call, contract semantic change, new
formal state, queue/worker infrastructure, or destructive DB/Git action.

External authorization: **none** for this acceptance; external AI calls in this
run: **0**. ADR required: **no**. Roadmap change: **no**. Merge, push, and
deploy: **none**.
