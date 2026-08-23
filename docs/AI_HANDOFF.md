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
- HEAD: `e52fd79` (`docs: record legacy mapping debt`) before the current local
  Gateway contract work; update after local commits are created.
- Git status: local Gateway contract changes in progress; no secrets or generated
  documents are tracked.

## Frozen stages

- Stages 13–19: PASS / FROZEN, including Word foundation and deterministic Agent safety.
- Stage 17 retrieval architecture remains frozen unless new evidence requires a decision.

## Current stage

Stage 21-A — Runtime Connectivity Foundation: **PASS / FROZEN**.
One managed SSH session now provides the gateway forward and SOCKS egress; Gateway,
SOCKS HTTPS, repeated real Embedding smoke, readiness, and monitor recovery passed.
Stage20 is the active re-entry stage; Stage20-S shared Evidence Support
Assessment foundation and the local shared Gateway Contract are implemented
offline. The task is not remotely published and no live model call is
authorized. Do not start full Stage21.

## Acceptance tracks

- Stage20 Corpus L3: IN_PROGRESS.
- Stage20 public tender E2E: parse and baseline PASS; retrieval blocked by existing Embedding network.
- Deterministic/offline acceptance: PASS.
- Stage20-S Evidence Support Assessment shared core and local
  `evidence_support_assessment` Gateway Contract: implemented offline;
  no remote publish or live model call authorized.

## Critical metrics

- Active corpus: General 10, Government 15, Healthcare 15, Synthetic Enterprise 17.
- Golden questions: 139; business coverage 96.8%; MRR 1.000; traceability 100%; scope violations 0; no-answer 100%.
- Frozen Recall@5: 90% (target 95%, not changed).
- Public tender parse: 4/4 chunks, 144 candidates, 140 mandatory, 130 verified / 10 suggested / 4 unresolved.
- Confirmed baseline: 140 requirements; synthetic enterprise materials indexed: 17.

## Active blocker and next step

The prior retrieval call failed with safe code `EMBEDDING_NETWORK_ERROR`; the development
transport blocker is now resolved without changing Retrieval. Next step is the authorized
Stage20 Re-entry using the existing Project/Parse Job through `EnterpriseRetrievalService`.

## Frozen boundaries

- No Dify Workflow restoration or v4.2 contract changes.
- No new Provider/model/embedding service, RAG architecture, Agent scope or customer-private data.
- No automatic formal approvals, Claim Gate bypass, baseline mutation, or source-lineage loss.
- Word foundation, Writer authorization, Evidence/Fact/Mapping semantics and contracts remain frozen.

## Provider/runtime

- Formal path: Backend Control Plane → `semantic_gateway` adapter.
- Gateway health check: PASS; requirement extraction used 4 successful calls.
- Embedding runtime: existing `V43_EMBEDDING_*` configuration with temporary dev-only
  `EMBEDDING_PROXY_URL`; SiliconFlow Qwen/Qwen3-Embedding-0.6B, dimension 1024; real
  smoke passed through managed SOCKS. Production remains direct-network oriented.
- Writer external calls in the public E2E: 0.
- Shared assessment provider: provider-neutral unavailable/unknown by default;
  no external calls in this foundation.

## Git restrictions

Local logical commits are allowed. Do not push, merge, force-push, deploy, or reset/clean destructively. Keep uploads, `.env`, keys, database files, logs and generated documents out of Git.
