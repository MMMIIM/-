# ADR 009: Stage21-A Runtime Connectivity Foundation

- **Status:** Accepted for development use
- **Scope:** Stage21-A prerequisite for returning to Stage20
- **Date:** 2026-08-23

## Decision

Development connectivity is treated as runtime transport configuration, not as
part of the Retrieval business architecture. One managed SSH session may expose
the existing semantic gateway forward (`-L 18080:127.0.0.1:8080`) and a local
SOCKS5 endpoint (`-D 18081`). The target, ports, and SSH options come from the
developer environment; no host, credential, or key is committed. The managed
script refuses to take over an occupied unmanaged port and records state outside
the repository. A small supervisor reconnects only the managed session.

The Embedding client may use `EMBEDDING_PROXY_URL` when explicitly configured.
The proxy is SOCKS-only and is injected as a per-request Undici dispatcher for
Embedding calls. It is never installed as a global proxy, never used by the
semantic gateway, and is not a production dependency. Unsetting the variable
returns the existing direct transport. Production deployments continue to use
their normal provider network path and do not depend on SSH or SOCKS.

## Invariants

- The existing OpenAI-compatible SiliconFlow Embedding provider, model,
  dimension, timeout, request schema, and `EnterpriseRetrievalService` contract
  remain unchanged.
- No fallback provider, retry policy, ranking, topK, chunking, or Stage17
  contract is introduced.
- Passive preflight checks Database, semantic gateway `/info`, and the
  Embedding transport without sending an Embedding request. It reports
  `ready`, `degraded`, or `fail` with safe error classes.
- Development startup remains available when the external Embedding transport
  is degraded. `/api/runtime/readiness` exposes only safe operational fields.
- `npm run smoke:embedding -w backend` is the explicit active check and sends
  one synthetic input only; it is never run automatically and never retries.
- Logs contain provider, endpoint host, operation, latency, result, error class,
  and run id only. API keys, authorization headers, prompts, tender text, and
  vectors are not logged.

## Rollback

Stop the managed runtime script and unset `EMBEDDING_PROXY_URL` to return to the
direct transport. No database migration or business-data change is required.

## Exit gate

Stage21-A is complete only after a user-authorized managed SSH session is
available without duplicate forwards, the gateway and SOCKS transport are
verified, the one-request Embedding smoke succeeds with the configured
dimension, passive readiness and degraded startup are tested, and the relevant
regression suite is green. Once that gate is met, work returns to the existing
Stage20 Re-entry; full Stage21 remains unauthorized.
