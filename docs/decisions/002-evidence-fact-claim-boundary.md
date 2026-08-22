# 002 — Evidence, Fact, and Claim Boundaries

## Context

Retrieved material, reviewed facts, requirement mapping, and proposed claims
have different levels of trust and different approval needs.

## Decision

Evidence, Fact, Mapping, and Claim Permission remain separate business layers.
Approval at one layer does not silently approve another.

## Reason

Separate decisions make provenance, risk review, and unsupported commitments
visible.

## Consequences

The UI may guide users through the layers, but must not collapse their formal
states or duplicate their approval services.
