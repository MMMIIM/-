# AI Handoff

## Product

政企标书 AI 平台：将招标需求、企业材料、风险复核、正文生成和 Word 交付串成可追溯、可审核、可恢复的业务流程。

## Architecture principles

- Backend is the formal Control Plane; models discover, backend finalizes.
- Requirement → Evidence → Fact → Mapping → Claim → Writer is a strict lineage chain.
- Unknown stays unknown; retrieval only produces candidates and never grants formal permission.
- Dify/semantic gateway is an execution adapter only; the backend owns validation, rules, audit and versions.
- No `result`/`text`/`answer` fallback and no JSON repair by bracket guessing.

Authoritative detail: `ARCHITECTURE.md`, `docs/CURRENT_STAGE.md`, `docs/ROADMAP.md`, and relevant ADRs.

## Repository state

- Branch: `feat/v4.3-semantic-boundary-routing`
- HEAD: `f2b8c16`
- Git status: clean

## Frozen stages

- Stages 13–19: PASS / FROZEN, including Word foundation and deterministic Agent safety.
- Stage 17 retrieval architecture remains frozen unless new evidence requires a decision.

## Current stage

Stage 21-A — Runtime Connectivity Foundation, currently **DIAGNOSIS / NOT IMPLEMENTED**.
This is a controlled prerequisite only; Stage20 must resume after connectivity PASS.

## Acceptance tracks

- Stage20 Corpus L3: IN_PROGRESS.
- Stage20 public tender E2E: parse and baseline PASS; retrieval blocked by existing Embedding network.
- Deterministic/offline acceptance: PASS.

## Critical metrics

- Active corpus: General 10, Government 15, Healthcare 15, Synthetic Enterprise 17.
- Golden questions: 139; business coverage 96.8%; MRR 1.000; traceability 100%; scope violations 0; no-answer 100%.
- Frozen Recall@5: 90% (target 95%, not changed).
- Public tender parse: 4/4 chunks, 144 candidates, 140 mandatory, 130 verified / 10 suggested / 4 unresolved.
- Confirmed baseline: 140 requirements; synthetic enterprise materials indexed: 17.

## Active blocker and next step

The first authorized retrieval call failed with safe code `EMBEDDING_NETWORK_ERROR` after 67 ms. Local DNS passes but direct TCP to the existing SiliconFlow endpoint fails. The authenticated semantic_gateway tunnel is healthy; the remote SSH shell context for a separate egress check is not available to the current shell. No Writer, Copilot, Bid Check or Word call was started and no retry occurred.

Next step: complete Stage21-A runtime topology diagnosis, then implement only the minimum approved connectivity/preflight change. Do not switch providers or embedding models to bypass the blocker.

## Frozen boundaries

- No Dify Workflow restoration or v4.2 contract changes.
- No new Provider/model/embedding service, RAG architecture, Agent scope or customer-private data.
- No automatic formal approvals, Claim Gate bypass, baseline mutation, or source-lineage loss.
- Word foundation, Writer authorization, Evidence/Fact/Mapping semantics and contracts remain frozen.

## Provider/runtime

- Formal path: Backend Control Plane → `semantic_gateway` adapter.
- Gateway health check: PASS; requirement extraction used 4 successful calls.
- Embedding runtime: existing `V43_EMBEDDING_*` configuration, currently network-blocked.
- Writer external calls in the public E2E: 0.

## Git restrictions

Local logical commits are allowed. Do not push, merge, force-push, deploy, or reset/clean destructively. Keep uploads, `.env`, keys, database files, logs and generated documents out of Git.
