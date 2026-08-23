# ADR 010: Evidence Support Assessment Boundary

- **Status:** Accepted for development
- **Scope:** Stage20-S shared semantic core
- **Date:** 2026-08-23

## Context

Retrieval Candidates and approved Evidence Facts both need a common, source-bound
observation of how a source relates to a Requirement. The observation must not
become an Evidence Review decision, an approved Fact, a Formal Mapping, or a
Claim permission.

## Decision

`EvidenceSupportAssessment` is a side-effect-free, transient semantic contract.
It reuses the existing Review and Mapping enums and records semantic relevance,
evidence capability, support level, relationship, reason codes, source-bound
support excerpts, and conflict observations. A support excerpt must be an
exact substring of the adapted source text and carries its own hash.

Two explicit adapters are supported:

- Raw Retrieval Candidate + Source Span + material/lineage metadata;
- approved Evidence Fact + Source Span + Fact lineage.

The provider-neutral evaluator defaults to `ASSESSMENT_UNAVAILABLE` and never
grants capable/direct support. Deterministic aggregation returns a non-decision
state for unavailable/unknown assessments, blocks on conflict, and only returns
`EVIDENCE_REVIEW_READY` for validated full/direct support without conflict.

Existing Evidence Review and Requirement-Evidence-Fact Mapping contracts consume
additive compatibility projections. They retain their human approval gates.
The legacy `requirement_evidence_mappings` path remains unchanged until a
separate migration decision.

## Invariants

- No database table, migration, approval state, readiness state, Claim Gate,
  Writer state, or formal Mapping is created or changed by the shared core.
- Raw Candidates cannot enter Formal Mapping through this contract.
- Conflicts are recorded, never resolved automatically.
- Unknown remains unknown; an unavailable evaluator cannot produce a business
  sufficiency result.
- No Gateway, Dify, provider, or model call is part of this foundation.

## Consequences

Sufficiency, Evidence Review, and future Mapping evaluation can share one
validated source-support vocabulary without creating a second Mapping lifecycle.
The next independent decision is whether a provider-backed
`evidence_support_assessment` Gateway task should be formally published.
