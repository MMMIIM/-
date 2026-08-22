# 001 — AI and Control Plane

## Context

Models are useful for semantic discovery and drafting, while formal status and
approval must remain predictable and auditable.

## Decision

The backend owns formal state, validation, authorization, audit, and finalization.
LLM/provider output is uncertain input and never direct formal business state.

## Reason

This preserves deterministic safety, reviewability, and source lineage while
allowing models to improve independently.

## Consequences

Every model boundary needs a contract and backend validation. Model failures are
auditable failures, not implicit approvals.
