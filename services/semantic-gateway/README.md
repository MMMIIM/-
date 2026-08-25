# Standalone Semantic Gateway

Local, stateless semantic execution runtime for Stage20 development. It does
not connect to business PostgreSQL, Dify or any project state.

## Canonical runtime configuration

The Gateway has two deliberately separate credential boundaries:

- `SEMANTIC_GATEWAY_API_KEY`: client → Gateway service authentication.
- `SEMANTIC_GATEWAY_PROVIDER_API_KEY`: Gateway → OpenAI-compatible Provider authentication.

The canonical Provider endpoint is configured with
`SEMANTIC_GATEWAY_PROVIDER_API_BASE`; `SEMANTIC_GATEWAY_API_BASE` is the
Backend client target for the Gateway and is **not** a Provider base URL.

`DIFY_*`, `V43_GATEWAY_*`, and `EXTERNAL_WRITER_*` are legacy/other-runtime
variables and never configure the canonical `evidence_support_assessment`
Provider path.

Copy `.env.example` to `.env` inside this directory for local development.
The file is ignored by Git and is loaded only by the Gateway start path.

## Start with the mock provider

```powershell
$env:SEMANTIC_GATEWAY_PROVIDER = "mock"
$env:SEMANTIC_GATEWAY_API_KEY = "<local-service-key>"
$env:SEMANTIC_GATEWAY_PORT = "18082"
npm run start -w semantic-gateway
```

Readiness is available at `GET /ready`; process liveness is `GET /health`.
The compatibility transport is `POST /workflows/run` with the existing
`inputs.task_type`, `inputs.task_instruction` and `inputs.task_payload_json`
fields. The response contains only
`data.outputs.response_payload_json`.

## OpenAI-compatible provider (not enabled by default)

Set `SEMANTIC_GATEWAY_PROVIDER=openai_compatible` and provide
`SEMANTIC_GATEWAY_PROVIDER_API_BASE`, `SEMANTIC_GATEWAY_PROVIDER_API_KEY`,
`SEMANTIC_GATEWAY_MODEL` and `SEMANTIC_GATEWAY_TIMEOUT_MS`. The key is read
only from the environment and is never written to logs or source control.

The canonical `evidence_support_assessment` path uses this standalone Gateway
and never routes to Dify. Configure the Backend with
`SEMANTIC_GATEWAY_API_BASE`, `SEMANTIC_GATEWAY_API_KEY` and
`SEMANTIC_GATEWAY_USER`; configure the Gateway's Provider Adapter with the
`SEMANTIC_GATEWAY_PROVIDER_*` variables above. The Gateway wraps the strict
Provider `data` into the single `response_payload_json` envelope and validates
the canonical contract before returning it. Other historical V43 tasks may
continue to use their compatibility configuration until separately cut over.

## Windows launch and preflight

With `services/semantic-gateway/.env` configured locally:

```powershell
npm run semantic-gateway:start
```

In another terminal, run the no-model-call preflight:

```powershell
npm run check:semantic-gateway
```

It verifies health, readiness, task registration, canonical service-key
authentication, wrong/missing-key denial, and Provider configuration without
calling a model.
