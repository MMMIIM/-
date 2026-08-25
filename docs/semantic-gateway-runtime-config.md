# Semantic Gateway Runtime Configuration

This is the single runtime reference for the Stage20 direct Provider path.

| Variable | Boundary | Required |
| --- | --- | --- |
| `SEMANTIC_GATEWAY_PROVIDER` | Provider adapter (`openai_compatible` or local `mock`) | yes |
| `SEMANTIC_GATEWAY_API_KEY` | Client → Semantic Gateway service authentication | yes |
| `SEMANTIC_GATEWAY_API_BASE` | Backend client → Gateway URL, not the Provider URL | backend client |
| `SEMANTIC_GATEWAY_PROVIDER_API_BASE` | Gateway → OpenAI-compatible Provider base | direct Provider |
| `SEMANTIC_GATEWAY_PROVIDER_API_KEY` | Gateway → Provider authentication | direct Provider |
| `SEMANTIC_GATEWAY_MODEL` | Provider model identifier | direct Provider |
| `SEMANTIC_GATEWAY_TIMEOUT_MS` | Provider request timeout | optional, default 120000 |

`SEMANTIC_GATEWAY_API_KEY` and
`SEMANTIC_GATEWAY_PROVIDER_API_KEY` are different credentials and must never
be copied into one another. The canonical evidence-support task reads only the
canonical variables above. `DIFY_*`, `V43_GATEWAY_*`, and `EXTERNAL_WRITER_*`
do not enable a direct evidence-support route.

For Windows development, copy
`services/semantic-gateway/.env.example` to the ignored
`services/semantic-gateway/.env`, then run:

```powershell
npm run semantic-gateway:start
npm run check:semantic-gateway
```

The preflight performs no model call. It validates health, readiness, task
registration, Provider configuration, and correct/wrong/missing Gateway
service-key behavior.
