# ADR 006 — Agent as an orchestration layer

## Context

The platform already owns formal, auditable services for requirements,
materials, evidence, facts, mappings, claims, readiness, writing, and checks.
A future Bid Copilot must reduce navigation and explain decisions without
creating a parallel source of business truth.

## Decision

The Agent is a contextual orchestration layer over formal Backend Tools. It
selects and sequences existing services, carries project context, prepares
safe actions, and collects human-required decisions. It is not a second
Control Plane and not a standalone generic chatbot.

## Reason

Keeping business semantics in formal services preserves deterministic gates,
source lineage, auditability, and consistent behavior across UI, tests, and
future Agent tools.

## Consequences

- Agent tools must call existing services and cannot write formal state directly.
- Human approvals remain explicit and cannot be inferred from Agent authority.
- The UI should prefer contextual Action Cards over a separate chat product.
- Agent implementation remains roadmap work and is not authorized by this ADR.
