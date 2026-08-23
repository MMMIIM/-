# ADR 011: Standalone Semantic Gateway Runtime

- **Status:** Accepted for local development
- **Scope:** Stage20 semantic execution boundary
- **Date:** 2026-08-24

## Decision

The target semantic execution topology is:

```text
Backend Control Plane
→ Standalone Semantic Gateway
→ Provider Adapter
→ OpenAI-compatible Model Provider
```

The first runtime is a stateless Node.js service under
`services/semantic-gateway`. It owns only service authentication, the shared
task registry/instruction resolver, input validation, provider invocation,
strict structured-output validation, the compatible `/workflows/run` response
envelope, error classification and safe observability.

It does not connect to business PostgreSQL or mutate Evidence, Fact, Mapping,
Review, Readiness, Claim Gate or Writer state. The mock provider is the only
provider used by this local foundation; real model calls are disabled.

## Contract ownership

`packages/semantic-contracts` is the single source of truth for semantic task
names, versions, input fields and output data boundaries. Backend validation
continues to own business-specific source lineage and lifecycle rules; the
shared package contains no business state.

The initial formal tasks are `requirement_extraction`, `response_planning`,
`claim_generation`, `section_drafting`, `targeted_revision` and
`evidence_support_assessment`. The legacy `draft_sections` entry remains
compatibility-only for existing callers.

## Compatibility and legacy boundary

The service temporarily accepts the existing Dify-compatible `POST
/workflows/run` transport so Backend can switch only its base URL after a
separate cutover decision. This path is a compatibility transport, not a Dify
dependency. No Dify SDK, API, Workflow or database is referenced by the
standalone runtime.

The current remote Dify 1.14.2 path is retained as
`LEGACY_DIFY_PROVIDER_SHIM`; it is not modified or deployed by this decision.

## Provider boundary

`OpenAICompatibleProvider` is an injectable adapter. It reads base URL, API
key, model and timeout from environment variables, never logs credentials and
strictly parses the provider JSON response. No JSON repair, markdown-fence
guessing or second model call is allowed.

## Deferred work

This ADR authorizes only local runtime foundation and contract tests. Backend
cutover, remote deployment, real-provider smoke, production hosting and any
provider/model choice require a separate decision.
