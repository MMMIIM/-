# 004 — Provider Decoupling

## Context

Provider capabilities and model quality can change independently of product
contracts and business rules.

## Decision

Prompts and contracts are product-owned and versioned independently. Providers
and models are replaceable execution resources. Adapters contain only capability
differences.

## Reason

This avoids coupling business behavior to a vendor and keeps contract changes
deliberate.

## Consequences

Provider changes require adapter-level tests and contract validation, not a new
business Control Plane.
