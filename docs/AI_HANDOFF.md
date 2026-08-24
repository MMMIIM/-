# AI Handoff

## Product

政企标书 AI 平台：将招标需求、企业材料、风险复核、正文生成和 Word 交付串成可追溯、可审核、可恢复的业务流程。

## Architecture principles

- Backend is the formal Control Plane; models discover, backend finalizes.
- Requirement → Evidence → Fact → Mapping → Claim → Writer is a strict lineage chain.
- Unknown stays unknown; retrieval only produces candidates and never grants formal permission.
- Semantic execution target is Backend Control Plane → standalone semantic gateway → Provider Adapter → model; the current Dify path remains a legacy compatibility shim.
- No `result`/`text`/`answer` fallback and no JSON repair by bracket guessing.

Authoritative detail: `ARCHITECTURE.md`, `docs/CURRENT_STAGE.md`, `docs/ROADMAP.md`, and relevant ADRs.

## Repository state

- Branch: `feat/v4.3-semantic-boundary-routing`
- HEAD: `1c73983` (`eval: normalize retrieval regression report`).
- Git status: clean; no secrets or generated documents are tracked.

## Frozen stages

- Stages 13–19: PASS / FROZEN, including Word foundation and deterministic Agent safety.
- Stage 17 retrieval architecture remains frozen unless new evidence requires a decision.

## Current stage

Stage 20 — P0 Real Evidence Retrieval Revalidation: **PARTIAL**.
Stage 21-A Runtime Connectivity Foundation remains **PASS / FROZEN**. One managed
SSH session provides the gateway forward and SOCKS egress; Gateway, SOCKS HTTPS,
Embedding smoke, readiness, and monitor recovery passed. Stage20-S shared Evidence Support
Assessment foundation and the local shared Gateway Contract are implemented
offline. The task is not remotely published and no live model call is
authorized. Do not start full Stage21. Stage20 is now **PARTIAL** after the
managed Embedding re-entry: the three controlled Retrieval cases reached Top5
and qualified source spans, while full evidence-bearing and downstream E2E
acceptance remain open.

The standalone semantic gateway foundation is implemented locally under
`services/semantic-gateway`, with single-source contracts in
`packages/semantic-contracts`. It uses only the mock provider in this stage;
Backend still points at the legacy Dify-compatible endpoint until a separate
cutover decision.

## Acceptance tracks

- Stage20 Corpus L3: IN_PROGRESS.
- Stage20 public tender E2E: parse and baseline PASS; three controlled real Retrieval
  cases reached successful Retrieval Runs over managed SOCKS with qualified spans;
  no LLM/Dify call or retry was made.
- Deterministic/offline acceptance: PASS.
- Stage20-S Evidence Support Assessment shared core and local
  `evidence_support_assessment` Gateway Contract: implemented offline;
  no remote publish or live model call authorized.
- Standalone Semantic Gateway runtime foundation: local tests PASS; remote deploy and Backend cutover are not authorized.

## Critical metrics

- Active corpus: General 10, Government 15, Healthcare 15, Synthetic Enterprise 17.
- Golden questions: 139; business coverage 96.8%; MRR 1.000; traceability 100%; scope violations 0; no-answer 100%.
- Frozen Recall@5: 90% (target 95%, not changed); public-corpus Recall@5 100%.
- Public tender parse: 4/4 chunks, 144 candidates, 140 mandatory, 130 verified / 10 suggested / 4 unresolved.
- Confirmed baseline: 140 requirements; synthetic enterprise materials indexed: 17.
- Calibration V2 re-audit: 36 active cases; 3 ready, 32 insufficient, 1 no-relevant, 0 conflict; Human Gold 0.
- Context recovery audit: 158 dimensions total (93 required, 65 not applicable),
  44 recovered, 49 required unresolved across 27 cases; required recovery rate 47.31%.

## Active blocker and next step

The P0 context/retrieval audit is complete without changing Retrieval ranking or
contracts. The prior Embedding network block was configuration-only: adding the
existing managed SOCKS endpoint to the ignored local `backend/.env` restored the
formal EmbeddingClient path. Next step is to execute the 12-case targeted
evidence-bearing regression against a formally mapped project/span set, then
continue only through existing human review boundaries; do not add a Provider,
model, fallback or retry architecture.

## Frozen boundaries

- No Dify Workflow restoration or v4.2 contract changes.
- No new Provider/model/embedding service, RAG architecture, Agent scope or customer-private data.
- No automatic formal approvals, Claim Gate bypass, baseline mutation, or source-lineage loss.
- Word foundation, Writer authorization, Evidence/Fact/Mapping semantics and contracts remain frozen.

## Provider/runtime

- Current runtime: Backend Control Plane → `SemanticGatewayClient` → legacy Dify-compatible endpoint.
- Target runtime: Backend Control Plane → standalone semantic gateway → OpenAI-compatible Provider Adapter.
- Gateway health check: PASS; requirement extraction used 4 successful calls.
- Embedding runtime: existing `V43_EMBEDDING_*` configuration; SiliconFlow
  Qwen/Qwen3-Embedding-0.6B, dimension 1024. Managed SOCKS `127.0.0.1:18081`
  is enabled only in the ignored local `backend/.env`; one smoke (315 ms) and
  three formal Retrieval calls passed. No credential is stored in the repository.
- Writer external calls in the public E2E: 0.
- Shared assessment provider: provider-neutral unavailable/unknown by default;
  no external calls in this foundation.

## Git restrictions

Local logical commits are allowed. Do not push, merge, force-push, deploy, or reset/clean destructively. Keep uploads, `.env`, keys, database files, logs and generated documents out of Git.
