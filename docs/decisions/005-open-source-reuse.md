# 005 — Open Source Reuse

## Context

Parsing, templates, authentication, retrieval helpers, and similar capabilities
are broad engineering problems with mature implementations.

## Decision

Reuse or adapt compatible MIT/Apache-2.0 and similar mature components first.
Core bid-domain differentiation is built and owned here. AGPL projects are
reference-only by default until an explicit license decision.

## Reason

Reuse reduces maintenance and blast radius while preserving product-specific
control where it matters.

## Consequences

Before adding infrastructure, record the real problem, license fit, boundary,
and why existing components are insufficient.
