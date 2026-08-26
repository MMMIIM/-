# Stage 20 Responsibility Shrink and Field Owner Freeze

Status: additive implementation, with Stage 17 and Stage 20-S V3.1 frozen.

This note records the control-plane boundary for Evidence Support. It does not
change the accepted `EvidenceSupportAssessment` contract or any formal
Evidence, Fact, Mapping, Claim, Writer, or approval lifecycle.

## Frozen route

```text
Requirement
  → Stage 17 retrieval / rerank / Top-K candidates
  → deterministic evidence checks
  → semantic ambiguity router
  → (only unresolved semantic relationship) semantic adjudication
  → Evidence Review and human decision
  → Approved Evidence Fact → Mapping → Claim Gate
```

Rerank answers “where should we look?”; it is not evidence or support. A high
ranking score never directly creates `EVIDENCE_REVIEW_READY`. The router emits
`DETERMINISTIC_RESOLUTION` or `NEEDS_SEMANTIC_ADJUDICATION`, and records resolved
and unresolved dimensions rather than a generic confidence score.

## Stage 17 responsibility

`semantic-retrieval-reranker.js` owns retrieval ordering (`raw_candidates`,
`reranked_candidates`, `final_candidates`), role compatibility and the
production review Top-K (`PRODUCTION_REVIEW_K=8`). The current reranker does not
explicitly emit a `semantic_relevance` field; the owner is reserved for the
Stage 17 relevance layer and is not inferred from a score by the router.

Stage 17 does not approve Evidence, create Facts, create Mapping, authorize a
Claim, or authorize a Writer.

## Deterministic checks and router

`backend/src/pipeline/evidence-support-responsibility.js` reuses the existing
source-eligibility and evidence-bearing classifiers. It resolves only facts
that are objective in the current input:

- system/evaluation/control-plane or otherwise ineligible sources;
- explicit `REFERENCE_CONTEXT` / `OUT_OF_SCOPE` routes;
- metadata/header-only sources;
- explicit deterministic dimension mismatches.

Normal topic overlap, a high rerank score, and an ordinary ambiguous source
remain on the semantic-adjudication path. A mixed Top-K set is not silently
filtered: the canonical assembler applies deterministic values to their own
fields while validated semantic output fills only unresolved observations.

## Field owner matrix

| Field | Current producer | Canonical owner | Source type | Consumer | Duplicate / overwrite / legacy |
|---|---|---|---|---|---|
| `assessment_id`, version, status | contract factory | EvidenceSupportAssessment contract | system-derived | audit/review | one factory; no lifecycle write |
| `requirement`, `source`, lineage | official adapters | adapter + contract | source/lineage | assessment | adapter is the only input boundary |
| `semantic_relevance` | not explicitly emitted by current reranker; validated semantic output may supply unresolved value | Stage 17 relevance layer | retrieval-derived (target) | assessment/routing | no score-to-support fallback |
| retrieval/rerank scores | `semantic-retrieval-reranker` | Stage 17 reranker | retrieval-derived | ranking/audit | never overwritten by LLM |
| source eligibility | `retrieval-source-eligibility` | deterministic rule layer | rule-derived | evidence lane | semantic output cannot override |
| `review_dimensions` | deterministic checks; semantic output only fills unknowns | deterministic rule layer where provable | rule-derived / semantic observation | review/mapping projection | assembler protects known values |
| `support_level` | canonical assembler from deterministic or validated semantic observation | EvidenceSupportAssessment boundary | compatibility composite | aggregate/review | not a pure MATCH/MISMATCH dimension |
| `semantic_relationship` | deterministic rule when objective; semantic adjudication otherwise | responsibility router + validated adjudication | rule-derived or LLM-derived | review/aggregation | deterministic value wins |
| `reason_codes` | deterministic findings plus validated semantic codes | responsibility router / contract | rule-derived or LLM-derived | audit/review | union only; no invented code |
| `support_observations` | semantic adjudication when called | semantic adjudication | LLM-derived | Evidence Review proposal | source excerpt validator remains mandatory |
| `conflict_observations` | validated gateway output plus contract checks | assessment contract / deterministic conflict boundary | semantic observation | review/aggregation | no automatic conflict approval |
| technical failure | gateway/provider/runtime | runtime/system layer | system-derived | technical audit | never rewritten as business insufficiency |
| Approved Evidence Fact | Evidence Review human lifecycle | Evidence Review service | human-derived | Mapping/Claim Gate | LLM has no write authority |
| Requirement ↔ Fact Mapping | canonical Mapping service | Mapping service | human/service lifecycle | Claim Gate | legacy compatibility remains separate |
| Safe Claim | Claim Gate | Claim Gate | rule/human lifecycle | Writer authorization | no assessment shortcut |

There is no competing canonical producer for a formal field. The assembler is
the single boundary where rule-owned values and optional semantic observations
are combined; it rejects overwrite by later semantic output.

## Semantic adjudication prompt

`backend/src/pipeline/semantic-adjudication-prompt.js` contains an additive,
versioned narrow prompt for a future separately versioned Gateway task. It
accepts only Requirement, candidate Evidence, deterministic findings and one
unresolved semantic question, and requests semantic relationship, semantic
reason codes and support observations. The frozen
`evidence_support_assessment` instruction remains the default until a new
remote contract is explicitly approved; no external call is made by this
change.

## Lifecycle and metrics

The responsibility router reports `total_candidates`, `rule_resolved`,
`semantic_adjudication_required`, `llm_call_rate`, and `human_review_rate`.
`UNSAFE_FALSE_SUPPORTED` is a review metric; no automatic approval is added.
The router and evaluator are transient and side-effect free: they cannot write
Evidence, Evidence Fact, Mapping, Claim, Readiness, or Writer state.

The old model bake-off remains disabled. Stage20-S V3.1 Gold/oracle,
`packages/semantic-contracts` meanings, normalization and reason-code domains
are unchanged. Future classifier training is not implemented and must not use
the V3.1 Gold packet as training data.
