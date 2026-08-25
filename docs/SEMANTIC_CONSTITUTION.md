# Semantic Constitution

Status: **repository governance baseline — Stage20 semantic consolidation**
Effective scope: Requirement, Retrieval, Evidence, Claim, Writer, Document, Eval,
Actor and compatibility boundaries.

This document unifies vocabulary and invariants. It does not merge stage
ownership, add a business state, alter a frozen contract, or authorize a live
Provider call. `ARCHITECTURE.md`, frozen stage decisions and the canonical
contracts remain authoritative for behavior.

## 1. Non-negotiable semantic boundaries

The following distinctions are permanent:

1. Relevant is not Evidence-Bearing.
2. Evidence-Bearing is not Sufficient.
3. Sufficient is not an Approved Evidence Fact.
4. An Approved Evidence Fact is not Mapped.
5. A Mapping is not a Safe Claim.
6. A Safe Claim is not a correct final document.
7. Material, Chunk, Evidence Span, Evidence Fact and Claim are different objects.
8. Storage eligibility, retrieval eligibility, source eligibility and requirement support are different gates.
9. Raw rank is not final candidate rank.
10. Gold Context is not Gold Evidence.
11. A context window is not an exact evidence span.
12. `UNKNOWN` is neither `MATCH` nor `MISMATCH`.
13. `ADVERSE_TO_REQUIREMENT` is not automatically `CONFLICTING_EVIDENCE`.
14. Technical failure is not business insufficiency.
15. `AUTO_DRAFT_EXPECTATION`, `GPT_REVIEWED_EXPECTATION` and `HUMAN_GOLD` are separate provenance classes.
16. Parent review does not promote child fields to reviewed provenance.
17. An Approved Evidence Fact is a formal fact input to Mapping and Claim Gate,
    but it is not Source Evidence and must not re-enter source-evidence retrieval.
18. A system-derived decision must not become source evidence in the same evidence chain.
19. A Raw Retrieval Candidate must never silently become Evidence, Evidence Fact, Mapping, Claim or Writer Authorization.
20. AI may discover or assess uncertainty; the Control Plane owns deterministic state, authorization, persistence and lifecycle transitions.
21. No stage may silently write another stage's formal truth.

## 2. Canonical truth vocabulary

`MATCH`, `MISMATCH`, `UNKNOWN` and `NOT_APPLICABLE` are the shared comparison
vocabulary where a dimension is applicable. Domain states remain explicit and
are not blindly renamed:

| Existing value or alias | Canonical interpretation | Rule |
| --- | --- | --- |
| `unknown`, `uncertain`, `not_verified` | `UNKNOWN` | Never upgrades to match or mismatch without an explicit observation. |
| `unresolved`, `missing`, `not_found` | Usually `UNKNOWN`; may be a separate operational resolution state | Must retain whether the absence is technical, source, or business. |
| `partial` | Domain-specific support/coverage state | Not a truth comparison and not an implicit match. |
| `unsupported`, `insufficient` | Domain-specific insufficiency | Must not be used as a technical failure. |
| `not_applicable` | `NOT_APPLICABLE` | Only when the requirement dimension is explicitly not applicable. |
| `conflict` | Domain conflict state | Requires two unequal observed values for the same dimension. |
| `ASSESSMENT_UNAVAILABLE` | Technical/business-boundary state | Technical reason is preserved; it is not `INSUFFICIENT_EVIDENCE`. |

`support_sufficiency` is currently a compatibility/composite domain field. Its
existing values span aggregate sufficiency semantics and blocking mismatch
semantics; it is not a pure `MATCH`/`MISMATCH` truth dimension. Business statuses
such as `EVIDENCE_REVIEW_READY`, `NO_RELEVANT_EVIDENCE`,
`INSUFFICIENT_EVIDENCE` and `CONFLICTING_EVIDENCE` are derived aggregate states,
not replacements for dimension observations.

Future conceptual direction (not implemented in V1): dimension comparisons use
`MATCH / MISMATCH / UNKNOWN / NOT_APPLICABLE`, while aggregate sufficiency uses
`SUFFICIENT / PARTIAL / INSUFFICIENT`. The current compatibility enum and
Stage20-S V3.1 behavior remain unchanged.

## 3. Subject, entity and scope

- `subject_match` compares the business subject designated by the Requirement
  with the subject explicitly declared by the source.
- `entity_match` compares the independently identified enterprise, product,
  project or material entity.
- `scope_match` compares the supported product, project, environment,
  certification or applicability scope with the Requirement scope.

Missing subject/entity/scope is `UNKNOWN`. A subject mismatch must not silently
become an entity or scope mismatch. A reason code may provide a conservative
diagnostic, but the dimension values remain independent.

## 4. Source, derived and external observation

Every important field is classified in the Concept Registry as one of:

- **SOURCE** — bounded text or structured observation grounded in an authorized
  source span/material.
- **DERIVED** — deterministic result computed from source observations and
  domain rules, such as aggregate sufficiency or unresolved dimensions.
- **EXTERNAL_OBSERVATION** — provider/runtime observation such as an HTTP error,
  token count or model response status.

Derived values should have one owner. A duplicate calculation is recorded as a
finding before any compatibility-sensitive refactor.

## 5. Canonical evidence lifecycle

```text
Tender Requirement
  → Retrieval Intent / Evidence Scope
  → Retrieval Candidate
  → Evidence-Bearing Candidate
  → Exact Evidence Span
  → Bounded Context Recovery
  → EvidenceSupportAssessment
  → Evidence Review Proposal
  → Human Evidence Review Decision
  → Approved Evidence Fact
  → Requirement ↔ Evidence Fact Mapping
  → Claim Gate
  → Writer Authorization
  → Generated Response
  → Validation
  → DocumentVersion
```

The assessment is intentionally transient. Formal state begins at Evidence
Review and is owned by the downstream services. Each transition must identify
an upstream owner, downstream owner, production entry point, formal mutation,
persistence expectation, human gate, reversibility and audit record.

## 6. Entry-point invariant

Formal mutations must follow:

```text
production entry point
  → owning service
  → canonical contract
  → persistence
```

An invariant is `ENFORCED` only when service behavior, a real production entry
point, persistence (or explicit `N/A` for transient concepts), and a negative
control are covered. A route that reaches a repository directly while an owning
service exists is an `ENTRY_POINT_BYPASS` finding.

## 7. Assessment and review boundary

`EvidenceSupportAssessment` observes source-bound semantic dimensions and
conflict observations. It does not create Evidence, Fact, Mapping, Claim,
Readiness or Writer state. The Provider-neutral evaluator returns unavailable
when no trusted semantic evaluator is available. A provider error remains
`ASSESSMENT_UNAVAILABLE` with its technical code.

`ExactEvidenceSpan` is Source Evidence: it is an exact, hashed slice of an
authorized material source. `EvidenceFact` is `DERIVED_FROM_SOURCE /
FORMAL_FACT`, and `ApprovedEvidenceFact` is a
`HUMAN_APPROVED_FORMAL_FACT`; neither is generic Source Evidence. Approved Fact
is consumed by Mapping and Claim Gate only.

`EvidenceReviewProposal` is a system-prepared candidate.
`EvidenceReviewDecision` is a human formal decision. They must not share a
status field or be treated as the same action.

## 8. Evaluation and anti-laundering rules

```text
EvalCase != EvalOracle != RuntimeObservation != EvaluationResult != StageGate
```

Oracle provenance is field-granular. `PENDING_GPT_REVIEW` is excluded from a
GPT-reviewed denominator. Context cannot be promoted to exact Gold Evidence.
Negative controls must be derivable from runtime input, source text or
structured authoritative input, not a hidden expected label.

System-derived statuses, mapping results, claim results, readiness results and
writer output cannot re-enter Retrieval or become source evidence for the same
chain.

## 9. Stage ownership

Stage17 owns retrieval candidates, raw/final rank, evidence-bearing
classification and source eligibility. Stage20 semantic assessment owns
subject/entity/scope/status/validity/quantitative observations. Evidence Review
owns human review state; Evidence Fact owns approved fact lifecycle; Mapping
owns Requirement↔Fact relationships; Claim Gate owns safe-claim authorization;
Writer owns generation authorization and safe context; Eval owns oracle
provenance and scoring.

The shared vocabulary is unified; ownership is not.

## 10. Compatibility and frozen boundaries

Legacy Dify/generation routes remain compatibility paths and must not weaken the
canonical contracts. No legacy path is deleted by this consolidation. Stage17
metrics, Stage20-S V3.1 fixtures/metrics/negative controls, Retrieval ranking,
Embedding, MMR, Corpus L3 thresholds and formal Evidence lifecycle semantics
remain unchanged.

No live Provider, Embedding, LLM or Dify call is authorized by this document.
