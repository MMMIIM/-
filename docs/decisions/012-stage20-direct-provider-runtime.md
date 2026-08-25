# ADR 012: Stage20 Direct Provider Runtime

- **Status:** Accepted for Stage20 implementation
- **Scope:** `evidence_support_assessment` semantic execution
- **Date:** 2026-08-25

## Decision

Stage20 Evidence Support does not depend formally on Dify:

```text
Backend Control Plane
→ Standalone Semantic Gateway
→ Task Router
→ OpenAI-compatible Provider Adapter
→ configured model
```

The Gateway owns task registration, versioned instructions, provider dispatch,
strict structured-output validation and technical error normalization. The
Backend owns lifecycle, authorization, persistence and deterministic
`aggregateEvidenceSufficiency()` behavior. The Provider Adapter owns only
provider-specific HTTP and strict JSON parsing.

`evidence_support_assessment` is bound to `SEMANTIC_GATEWAY_*` configuration and
must not fall back to `V43_GATEWAY_*` or `DIFY_*`. Dify remains a
`LEGACY_DIFY_PROVIDER_SHIM` for historical compatibility tasks only. The old
`v4.3.1-需求提取` workflow is not an Evidence Support implementation.

## Contract and safety

The only accepted outer output is
`data.outputs.response_payload_json`. The canonical contract remains
`4.3-evidence-support-assessment-v1`; invalid JSON, schema failures, provider
errors and unsupported tasks remain technical failures. No Gateway response
creates Evidence, Fact, Mapping, Claim, Readiness or Writer state.

## Consequences

Provider/model replacement and private deployment do not require business
lifecycle changes. A single live provider schema probe is required before
Stage20 live validation; no full live case set is implied by this ADR.
