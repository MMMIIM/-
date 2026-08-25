# AI Handoff

## Product

政企标书 AI 平台：将招标需求、企业材料、风险复核、正文生成和 Word 交付串成可追溯、可审核、可恢复的业务流程。

## Architecture principles

- Backend is the formal Control Plane; models discover, backend finalizes.
- Requirement → Evidence → Fact → Mapping → Claim → Writer is a strict lineage chain.
- Unknown stays unknown; retrieval only produces candidates and never grants formal permission.
- Formal invariants require service positive/negative tests, a real production-entry
  negative control, and persistence assertions when state mutates. The invariant
  matrix tracks SERVICE_TESTED, ENTRY_POINT_TESTED, PERSISTENCE_TESTED, and
  NEGATIVE_CONTROL_PRESENT; service-only coverage cannot mark an invariant ENFORCED.
- Semantic execution target is Backend Control Plane → standalone semantic gateway → Provider Adapter → model; the current Dify path remains a legacy compatibility shim.
- No `result`/`text`/`answer` fallback and no JSON repair by bracket guessing.

Authoritative detail: `ARCHITECTURE.md`, `docs/CURRENT_STAGE.md`, `docs/ROADMAP.md`, and relevant ADRs.

Semantic governance detail: `docs/SEMANTIC_CONSTITUTION.md`,
`docs/CONCEPT_REGISTRY.md`, `docs/SEMANTIC_INVARIANT_MATRIX.md`,
`docs/SEMANTIC_AUDIT_REPORT.md` and `docs/SEMANTIC_LEGACY_MAP.md`.

## Repository state

- Branch: `feat/v4.3-semantic-boundary-routing`
- HEAD: current local branch; see Git for the latest checkpoint commit.
- Git status: clean; no secrets or generated documents are tracked.

## Frozen stages

- Stages 13–16, 18–19: PASS / FROZEN, including Word foundation and deterministic Agent safety.
- Stage 17: PASS / FROZEN. P0 remediation, Gold/Context integrity, rank
  semantics, canonical metric rebase, controlled live retrieval, and full
  regression/build acceptance are complete. Retrieval architecture semantics
  remain frozen.

## Current stage

Stage 20-S — Evidence Sufficiency Offline Validation Baseline V3.1: **PASS / ACCEPTED**.
The six frozen synthetic cases are
evaluated through the side-effect-free EvidenceSupportAssessment contract; no
Embedding, LLM or Dify call is allowed. Packet:
`backend/eval/evidence-support/calibration-v2/GPT_REVIEW_PACKET_EVIDENCE_SUFFICIENCY_OFFLINE_V3.md/.json`.
V3 separates automated 25/25 and 6/6 dimension metrics from field-level
GPT-reviewed metrics, keeps V2R-003 child fields pending, and source-grounds the
subject-mismatch and conflict controls. Independent GPT review is PASS.
V3.1 closure fixes the NEG-SUBJECT support-sufficiency contradiction and keeps
its independently ungrounded entity dimension unknown. Closure packet:
`backend/eval/evidence-support/calibration-v2/GPT_REVIEW_PACKET_EVIDENCE_SUFFICIENCY_OFFLINE_V3_1.md/.json`.
`GPT_REVIEW_STATUS=PASS` and `EVAL_COMPLETE=YES` apply only to the V3.1 offline
baseline, not to Stage20 as a whole. Stage 20 remains **PARTIAL / BLOCKED**;
PostgreSQL integration is **PASS (41/41)**, while the remaining production/E2E
gates are still open.
Stage 20 — P0 Real Evidence Retrieval Revalidation remains the parent track.
Stage 21-A Runtime Connectivity Foundation remains **PASS / FROZEN**. One managed
SSH session provides the gateway forward and SOCKS egress; Gateway, SOCKS HTTPS,
Embedding smoke, readiness, and monitor recovery passed. Stage20-S shared Evidence Support
Assessment foundation and the local shared Gateway Contract are implemented
offline. The task is not remotely published. A single authorized 7-case
SAFE_SYNTHETIC_EVAL Retrieval run completed through the formal service; full
evidence-bearing and downstream E2E acceptance remain open. Do not start Stage21.

The standalone semantic gateway foundation is implemented locally under
`services/semantic-gateway`, with single-source contracts in
`packages/semantic-contracts`. It uses only the mock provider in this stage;
Backend still points at the legacy Dify-compatible endpoint until a separate
cutover decision.

## Acceptance tracks

- Stage20 Corpus L3: IN_PROGRESS.
- Stage20 public tender E2E: parse and baseline PASS; four canonical synthetic
  Retrieval samples reached successful Runs over managed SOCKS with qualified
  Requirement-relative spans; no LLM/Dify call or retry was made in this task.
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
- Evidence-bearing audit: 7 legacy metadata false labels and 4 legacy topic false labels corrected offline; targeted Gold qualification is 7 ready, 5 repairable, 0 rejected.
- 7-case live Retrieval: 7/7 technical success; its historical aggregate remains
  audit-only and was superseded for Stage17 canonical reporting by the corrected
  six-case metric rebase.
- Retrieval eval integrity audit: persisted multi-chunk Evidence Spans are valid
  7/7; 7/7 direct single-chunk Retrieval Gold bindings require deterministic
  business-bearing-chunk derivation. No formal spans or HUMAN_GOLD were mutated.
  All 35 recorded Top5 candidates were re-audited: previous Evidence-Bearing 13,
  corrected 9, explicit false positives 4, false negatives 0. V2R-006 is
  Evidence-Bearing with a boundary/partial scope; V2R-007 remains
  GOLD_DESIGN_AMBIGUOUS.
- Phase-1 candidate hygiene live comparison used exactly six Embedding queries:
  metadata@5 0 and no Gold loss. Stage17 canonical six-case reporting uses the
  captured raw pools only: Exact Gold Hit@1/3/5 0.50/1.00/1.00, MRR 0.75;
  Decision-Bearing Hit@1/3/5 0.8333/1.00/1.00, Decision-Bearing MRR 0.9167;
  Metadata@5, NonSubstantive@5, NonEvidenceSource@5, derived/internal-process/
  low-specificity leakage and ScopeViolation all 0.
  V2R-001 decision-bearing rank is 4→2→2; V2R-006 boundary evidence remains
  eligible; ISO9001 remains topic-only. Packet:
  `STAGE17_METRIC_REBASE_AND_FREEZE_PACKET.md/.json`; Stage17 review and
  acceptance are complete.
- Phase-2B source eligibility replay remains an immutable audit of all 120
  captured raw occurrences: 56 eligible, 64 ineligible, 21 derived artifacts,
  22 internal-process artifacts, 21 low-specificity claims, 0 unknown. POST_V3
  Top5 leakage for metadata, non-substantive, non-evidence-source, derived,
  internal-process, and low-specificity candidates is 0; decision-bearing
  Hit@5 is 100%. The audit packet remains historical evidence; Stage17's final
  freeze packet is `STAGE17_METRIC_REBASE_AND_FREEZE_PACKET.md/.json`.
- Full case-level packet: all 12 cases persisted in `backend/eval/evidence-support/calibration-v2/GPT_REVIEW_PACKET.md` and `.json`; `GPT_REVIEW_STATUS=PENDING_REVIEW`, `EVAL_COMPLETE=NO`.
- Gold qualification packet: `GPT_REVIEW_PACKET_GOLD_QUALIFICATION.md` and `.json` contain all 12 independent A–I checks; 7 `GOLD_READY_FOR_RETRIEVAL`, 5 `GOLD_PARTIAL`, current index verified 9/12.
- Context recovery audit: 158 dimensions total (93 required, 65 not applicable),
  44 recovered, 49 required unresolved across 27 cases; required recovery rate 47.31%.

## Active blocker and next step

The P0 context/retrieval audit and two-phase candidate/source-hygiene
implementation preserve Retrieval ranking semantics and formal contracts.
Stage17 is now frozen; the remaining active blocker is Stage20's separate formal
evidence-sufficiency validation and Corpus L3 completion. Do not infer Gold from
runtime heuristics or nearest Requirements, and do not change ranking, chunking,
topK, MMR, Provider, or retry architecture.

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
  four formal Retrieval calls passed. No credential is stored in the repository.
- Writer external calls in the public E2E: 0.
- Shared assessment provider: provider-neutral unavailable/unknown by default;
  no external calls in this foundation.
- Latest P0 targeted run: 7-case baseline plus one authorized six-case hygiene
  comparison (13 Embedding query calls total) through managed SOCKS; no corpus
  upload/re-embedding, LLM/Dify calls, or production lifecycle writes. Expected
  Gold IDs were evaluator-only and never passed to runtime retrieval. LLM calls
  0, Dify calls 0, automatic retries 0.

## Git restrictions

Local logical commits are allowed. Do not push, merge, force-push, deploy, or reset/clean destructively. Keep uploads, `.env`, keys, database files, logs and generated documents out of Git.
