# STAGE17 METRIC REBASE AND FREEZE PACKET

## Scope

`V2R-001..006` is a targeted calibration/regression set. It is not a claim
about overall production Retrieval accuracy, customer-corpus accuracy, or
universal RAG evidence recall. The source live packet is immutable at commit
`6e074cd`; this packet is an eval/report artifact based on that capture.

No Embedding, LLM, Dify, or live Retrieval call was made for this rebase.

## Canonical metric definitions

`RAW_VECTOR_RANK` is the vector similarity order before eligibility and final
lane projection. `FINAL_EVIDENCE_CANDIDATE_RANK` is the deterministic eligible
evidence-lane order. They are different rank spaces and must never be mixed.

- Decision-bearing Hit@K = cases with `first_decision_bearing_final_rank <= K` / 6.
- Exact Gold Hit@K = cases with `exact_gold_final_rank <= K` / 6.
- MRR = mean reciprocal of the first relevant final-lane rank over the six cases.

### Retrieval accuracy

| Metric | Value |
|---|---:|
| Decision-bearing Hit@1 | 83.33% |
| Decision-bearing Hit@3 | 100% |
| Decision-bearing Hit@5 | 100% |
| Decision-bearing MRR | 0.9167 |
| Exact Gold Hit@1 | 50% |
| Exact Gold Hit@3 | 100% |
| Exact Gold Hit@5 | 100% |
| Exact Gold MRR | 0.75 |

### Retrieval hygiene

Metadata@5, NonSubstantive@5, NonEvidenceSource@5, DerivedArtifactLeakage@5,
InternalProcessArtifactLeakage@5, LowSpecificityClaim@5 and ScopeViolation are
all **0**.

### Gold integrity

Broken Decision-Bearing Gold = **0**; Gold crowded outside raw pool = **0**;
Context counted as Exact Hit = **0**; Context counted as Decision Hit = **0**;
V2R001 final Decision rank = **2**; V2R006 boundary = **PRESERVED**.

## Six-case case-level results

| Case | Gold Evidence | Gold Context | Gold raw rank | Decision raw rank | Exact final rank | Decision final rank | Final count | Scope |
|---|---|---|---:|---:|---:|---:|---:|---:|
| V2R-001-PERF-DIRECT | `MCH-0FBD…97AF` | `MCH-B4FF…76F6` | 4 | 4 | 2 | 2 | 4 | 0 |
| V2R-002-PERF-PARTIAL | `MCH-0FBD…97AF` | `MCH-B4FF…76F6` | 1 | 1 | 1 | 1 | 3 | 0 |
| V2R-003-COMP-DIRECT | `MCH-7F11…BEE0` | `MCH-57FE…FFA4` | 1 | 1 | 1 | 1 | 2 | 0 |
| V2R-004-COMP-PARTIAL | `MCH-7F11…BEE0` | `MCH-57FE…FFA4` | 1 | 1 | 1 | 1 | 4 | 0 |
| V2R-005-ISO-DIRECT | `MCH-A4C2…2D84` | `MCH-0820…CC71` | 2 | 1 | 2 | 1 | 3 | 0 |
| V2R-006-ISO-SCOPE | `MCH-A4C2…2D84` | `MCH-0820…CC71` | 2 | 1 | 2 | 1 | 3 | 0 |

The full IDs and machine-readable values are in the adjacent JSON packet.

## V2R001 corrected rank proof

- Business Gold: `MCH-0FBD3599DAF932016F62EB9634B997AF`; raw rank **4**;
  final rank **2**; Gold Evidence member **YES**; Decision-Bearing **YES**.
- Performance heading: `MCH-B4FF02295DBB6DCDF6E2763F057076F6`; raw rank **1**;
  Gold Evidence member **NO**; Gold Context member **YES**.
- First Decision-Bearing raw rank **4**; final rank **2**.

The heading is context-only and cannot contribute to Exact Hit/MRR or
Decision-Bearing Hit/MRR. The precise report-level root cause is
`REPORT_SERIALIZATION_GOLD_CONTEXT_CONTAMINATION` plus
`GOLD_RAW_DIAGNOSTIC_BINDING_ERROR`. The canonical Gold Evidence Set was not
corrupted and production Retrieval was not defective.

## Integrity separation

The following invariants are frozen for this evaluation:

- `RAW_VECTOR_RANK != FINAL_EVIDENCE_CANDIDATE_RANK`.
- `GOLD_CONTEXT_SET != GOLD_EVIDENCE_SET`.
- A context chunk is not an evidence hit.
- `AUTO_DRAFT_EXPECTATION != GPT_REVIEWED_EXPECTATION != HUMAN_GOLD`.
- A system-derived decision is not source evidence.
- Gold and expected answers are evaluation-only and invisible to runtime.

Historical `96.69%` Recall@5 and prior MMR experiments remain labeled
`HISTORICAL_RETRIEVAL_RELEVANCE_METRICS`; they are not the current canonical
Stage17 evidence metrics.

## Regression evidence

- Gold/rank invariant tests: **PASS, 4/4**.
- Targeted Retrieval/eval coverage: **PASS**, included in the backend suite.
- Backend: **PASS, 659/659**.
- Frontend: **PASS, 50/50**.
- PostgreSQL integration: **PASS, 41/41**.
- Lint: **PASS**.
- `git diff --check`: **PASS**.
- Build: **PASS**. `npm run build` completed with
  `NODE_OPTIONS=--max-old-space-size=6144`; Vite transformed 1586 modules and
  emitted the production bundle.

The previous native-memory blocker was environmental and is resolved without
source or production-logic changes. The required Stage17 gate is now green.

## Remaining findings and follow-up

- `P1-INDEX-HYGIENE-001`: OPEN.
- `P1-REFERENCE-METADATA-HYGIENE`: OPEN.
- Neither P1 finding blocks the current Stage17 freeze once the build can run.
- Follow-up architecture debt: `UNIFIED_EVAL_CORE` (`EvalCase`, `EvalOracle`,
  `RuntimeObservation`, `EvaluationResult`, `StageGate`). This is not part of
  the current freeze work.

External calls: Embedding **0**, LLM **0**, Dify **0**. No Retrieval code,
Embedding client, vector query, chunking, topK, MMR, reranking, substantive
candidate logic, or source eligibility logic was changed. No push, merge, or
deploy was performed.

## Status

`PASS / FROZEN`.

Machine-readable packet: `STAGE17_METRIC_REBASE_AND_FREEZE_PACKET.json`.
