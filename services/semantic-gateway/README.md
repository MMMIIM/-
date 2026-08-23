# Standalone Semantic Gateway

Local, stateless semantic execution runtime for Stage20 development. It does
not connect to business PostgreSQL, Dify or any project state.

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

The current foundation deliberately uses the mock provider only. Backend
cutover and any real-provider call require a separate decision.
