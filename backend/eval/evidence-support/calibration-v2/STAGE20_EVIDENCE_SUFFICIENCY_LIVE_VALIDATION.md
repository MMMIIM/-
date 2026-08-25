# Stage20 Evidence Sufficiency Live Validation

- Generated at: 2026-08-25T10:49:26.656Z
- Provider: semantic_gateway
- Gateway host: 127.0.0.1
- Gateway port: 18080
- Task: evidence_support_assessment
- Contract: 4.3-evidence-support-assessment-v1
- Automatic retry: 0
- External workflow calls: 1
- Remote contract parity: **REMOTE_CONTRACT_DRIFT**
- Not executed after contract drift: V2R-002-PERF-PARTIAL, V2R-003-COMP-DIRECT, V2R-004-COMP-PARTIAL, V2R-005-ISO-DIRECT, V2R-006-ISO-SCOPE, NEG-SUBJECT-001, NEG-CONFLICT-001

## Contract drift evidence

- Outer envelope: `schema_version`, `task_type`, `status`, `data`, `warnings`.
- `data` keys: `assessments`, `conflict_observations`.
- Returned assessment keys: `requirement_id`, `source_id`, `support_level`, `confidence`, `evidence_type`, `notes`.
- Required current assessment fields such as `semantic_relevance`, `evidence_capability`, `semantic_relationship`, complete `review_dimensions`, `reason_codes`, and `support_observations` were absent.
- Strict validator result: `SCHEMA_INVALID` at `data.assessments[0]`.
- Raw payload is retained only in the JSON audit packet with SHA-256 `7251f658192d91d5eca31194bb9605261b089694f547a13d0cb930ee8049d3b4` and 1,202 characters; it is not printed in the terminal.

## Case results

- V2R-001-PERF-DIRECT: expected=EVIDENCE_REVIEW_READY, actual=NOT_AVAILABLE, FAIL, 3339ms
- NEG-TECHNICAL-001: NOT_EXECUTED

## Safety

- No formal DB state was written.
- No Evidence Review, Evidence, Fact, Mapping, Claim, Readiness, or Writer lifecycle was invoked.
- No prompt, API key, or complete provider request was printed to the terminal.
