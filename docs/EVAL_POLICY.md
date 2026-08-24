# Evaluation Governance Policy

This document defines the durable evaluation rules for Retrieval, Evidence,
EvidenceSupportAssessment and grounding. It does not record the current case
count, branch, HEAD or an operational network blocker; those belong in
`docs/CURRENT_STAGE.md` and `docs/AI_HANDOFF.md`.

## Metric vocabulary

Historical `Recall@5` and `Expected-source Recall@5` are relevance metrics.
They must not be reported as Evidence Recall. Evidence-bearing evaluation
reports these metrics separately when the required lineage exists:

- Material Hit@5
- Document Hit@5
- Chunk Hit@5
- Expected-Source Recall@5
- Evidence-Bearing Chunk Recall@5
- Qualified Evidence Span Rate
- Context Recovery Rate
- Evidence Gap Recovery Rate
- Metadata/Header False Evidence Rate
- Enterprise Evidence Source Routing Precision

An unavailable prerequisite is reported as `NOT_EXECUTED`, `NOT_APPLICABLE`,
`NOT_EVALUATED` or `BLOCKED` as appropriate, never as a guessed zero or pass.

## Calibration and holdout validation

Calibration discovers Prompt, schema and semantic-classifier problems. It may
be used to adjust the system. Holdout Validation measures frozen behavior and
must remain independent; holdout Gold must not be used for repeated Prompt or
classifier tuning.

`SYSTEM_DRAFT` and `SYSTEM_DRAFT_REAUDITED` are not `HUMAN_GOLD`. Codex or
automation may not mark a case human-reviewed, impersonate a reviewer or
freeze Gold. Calibration Gold requires source provenance, a verified Evidence
Span, semantic-contract compatibility, human review, holdout independence and
runtime/data isolation.

Synthetic material is allowed when it is an independently governed enterprise
corpus. It is forbidden to write answer-shaped material solely to make one
test pass. The legacy 32-case set is
`LEGACY_SYNTHETIC_CALIBRATION_V1`: it remains useful for schema, aggregation
and contract regression, but cannot support a real-model accuracy claim.

## Manual sample gate

No core evaluation may declare `EVAL_COMPLETE` from aggregate counts alone.
Retrieval, Evidence, EvidenceSupportAssessment and Generation Grounding
reports must show at least two representative raw-source cases; larger runs
should show three: a clear success, a boundary/difficult case and a
failure/closest miss.

Each sample includes the Requirement text, Top-K/source excerpts, the exact
Evidence Span, Context Window, system decision, expected/Gold result when
available and PASS/FAIL. If `MANUAL_SAMPLE_REVIEW_READY = NO`, then
`EVAL_COMPLETE = NO`.

## Mandatory case-level GPT review packets

This is a permanent governance rule for Retrieval, Evidence, Evidence Support,
Requirement–Evidence Mapping, Claim Gate and Generation Grounding evaluations:
aggregate metrics, test counts, Recall, Precision, MRR, coverage or automated
PASS rates may not by themselves produce `PASS`, `EVAL_COMPLETE` or `FROZEN`.
Every significant evaluation must persist a complete `GPT_REVIEW_PACKET.md` and
preferably a matching JSON packet containing every case, the original
Requirement, retrieval intent and allowed scope, expected lineage, every actual
Top-K candidate with raw source excerpt and classification, exact span/context,
final decision and one primary failure layer. If a case was not executable, the
packet must retain it with `NOT_EXECUTED`/`BLOCKED` and the blocking reason; it
must never be omitted or silently converted into a metric zero.

Mapping-oriented packets additionally show Requirement, Evidence Fact, original
span, lineage, relationship, expected/actual mapping, support semantics,
mismatch dimensions, human approval and Claim Gate consequence. EvidenceSupport
packets show all assessed sources, observations, conflicts and aggregate business
status. Claim/Generation packets show approved Facts, allowed Claim, generated
text, source evidence, Claim Gate and grounding decisions.

The required order is:

```text
case-level truth → validation → aggregation → metric → stage decision
```

Before a high-risk P0 evaluation can be frozen:
`GPT_REVIEW_PACKET_AVAILABLE = YES`, `CASE_LEVEL_RESULTS_COMPLETE = YES` and
`RAW_SOURCE_INCLUDED = YES`; `GPT_REVIEW_STATUS` remains `PENDING_REVIEW` until
the complete packet is independently reviewed. The packet is an audit artifact,
not authorization to mutate Gold, approve Evidence, bypass Claim Gate or call a
new Provider.

## Evidence and technical-failure rules

Retrieval Candidate, Evidence-Bearing Chunk, Evidence Span, Evidence Fact and
Formal Mapping are separate evaluation objects. Context recovery must be
attempted before calling a span insufficient, and the exact span must remain
separate from its bounded context and provenance.

Industry or government reference material may be relevant context but is not
enterprise proof. Missing evidence is distinct from adverse evidence, and a
universal requirement is mismatched when observed facts include failed,
incomplete, unverified, unknown or quantitatively incompatible values.

Technical failures (`NETWORK_ERROR`, provider timeout, invalid schema,
invalid support span and similar) are not business truth. They produce
`ASSESSMENT_UNAVAILABLE` plus the technical error code and must not be
converted into `INSUFFICIENT_EVIDENCE`, `NO_RELEVANT_EVIDENCE`, `READY` or
`CONFLICTING_EVIDENCE`.

## Frozen-stage regression audit

`FROZEN` means the accepted baseline is not redesigned by default; it does not
mean it is never revalidated. New P0 correctness evidence may trigger a
`FROZEN_STAGE_REGRESSION_AUDIT`. Only confirmed production/frozen behavior
defects reopen a stage. Otherwise the stage remains frozen and receives a new
regression test.

## Result vocabulary

- `PASS`: executed and succeeded;
- `FAIL`: executed and failed at the tested layer;
- `NOT_EXECUTED`: not run in this evaluation;
- `NOT_APPLICABLE`: the check does not apply;
- `BLOCKED`: an external prerequisite prevented execution;
- `NOT_EVALUATED`: the run did not reach that evaluation layer.

Provider connectivity failure is a `NETWORK` failure and leaves model-quality
metrics `NOT_EVALUATED`; it is not evidence of model quality failure.
