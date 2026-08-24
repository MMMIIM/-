# P0 FRAMEWORK REMEDIATION BATCH 1

状态：`IMPLEMENTED_PENDING_GPT_REVIEW`  
日期：2026-08-24  
范围：仅处理 GPT Decision 授权的 P0 trust/lifecycle/legacy/actor 边界；不调用外部模型，不修改 Retrieval、MMR、Embedding、LLM、Dify Workflow，不 push/merge/deploy。

## P0-TRUST-001 — strict semantic response envelope

- Before: `extractResponsePayload()` accepted `payload.data.outputs` **or** top-level `payload.outputs`.
- After: only `payload.data.outputs.response_payload_json` is read. Missing, wrong type, malformed JSON, and schema failure remain `CONTRACT_INVALID`; no repair or alternate field fallback.
- Route reachability: Dify compatibility transport still calls the canonical parser; no new route was added.
- Owning service: `contract.js` parser; `dify.js` preserves provider audit; `GenerationService` persists failed Generation audit.
- Negative controls: top-level `outputs`, missing `data`, missing `outputs`, missing field, null/number, and forbidden alternate output fields.
- DB effect: none for accepted output; failed Generation audit remains the only persistence effect on failure.
- API effect: malformed envelopes return the existing safe `CONTRACT_INVALID` response.
- User effect: no unowned provider field can become formal document text.

## P0-LIFE-001 — DocumentVersion confirmation ownership

- Before: `/api/document-versions/:versionId/confirm` checked only `critical` and called `repository.confirmVersion` directly.
- After: both confirmation HTTP entry points call `GenerationService.confirmVersion`, which owns `assertVersionCanBeConfirmed`; repository only persists the accepted transition.
- Route reachability: `/confirm` and `/review-decisions` are both active canonical transports; no shadow lifecycle policy remains.
- Owning service: `GenerationService.confirmVersion` / `assertVersionCanBeConfirmed`.
- Negative controls: warning missing/empty/whitespace acknowledgement and critical with acknowledgement.
- DB effect: accepted confirmation writes `review_decisions.confirmation_text`, `actor_id`, and status updates; rejected requests write nothing.
- API effect: PASS succeeds; WARNING requires non-empty text; CRITICAL returns `CRITICAL_RISK`.
- User effect: risky versions cannot be confirmed without an explicit acknowledgement.

## P0-LEGACY-BYPASS-001 — Legacy Dify generation isolation

- Before: legacy `GenerationService` and Dify routes were registered unconditionally.
- After: `V43_LEGACY_GENERATION_COMPAT` is an explicit flag, default `false`; `/api/projects/:projectId/generation-jobs`, `/api/projects/:projectId/generation-jobs` (read), and `/api/generate-bid` are not registered by default.
- Route reachability: production default is unavailable (`API_NOT_FOUND`); explicit compatibility/test mode is reachable only when the flag is enabled.
- Owning service: legacy `GenerationService` remains preserved for historical compatibility; 4.3 has no silent fallback to Dify.
- Negative controls: default-off route isolation test and explicit compatibility-mode test.
- DB effect: no new persistence path; disabled routes cannot create legacy Jobs/Generations.
- API effect: callers must use the formal 4.3 path in default production configuration.
- User effect: no accidental legacy path around Requirement/Evidence/Mapping/Claim/Writer controls.

## P0-SEC-ACTOR-001 — trusted review actor boundary

- Before: formal review routes read `req.body.reviewer/editor/decided_by/reviewed_by` or `current_user`.
- After: routes resolve a server-side actor via `request-actor.js`; client identity fields are removed before calling owning services. Missing trusted actor returns `AUTHENTICATED_ACTOR_REQUIRED` (401).
- Route reachability: requirement source confirmation, Evidence/Fact/Mapping/Claim decisions, Project Fact decisions/edits, and DocumentVersion confirmation use the helper.
- Owning service: the existing domain service; actor resolution is transport security context, not domain policy.
- Negative controls: client `reviewer=admin` with trusted `user-A` persists `user-A`; missing actor never becomes `current_user`.
- DB effect: DocumentVersion review audit persists trusted `actor_id`; existing domain review actor columns receive the trusted ID.
- API effect: no trusted actor means safe 401 rather than placeholder identity.
- User effect: audit records identify the configured server-side actor; production still needs a real authenticated adapter.

## Audit taxonomy corrections

- `I06 Unknown != Confirmed`: `ENFORCED` (the warning bug was lifecycle-specific, not an Unknown upgrade).
- `I16 Warning != Confirmed without Explicit Acknowledgement`: `CONTRADICTED` historical finding; the Batch 1 implementation now enforces the rule.
- `P1-LEGACY-001` → `P0-LEGACY-BYPASS-001`.
- `P1-SEC-001` → `P0-SEC-ACTOR-001`.
- Added `P1-INDEX-HYGIENE-001`: raw indexed ineligible chunks may crowd the candidate pool; final source eligibility remains protected and this finding is deliberately open.
- Data-origin wording now separates index presence from formal Evidence eligibility.

## Canonical concept

`DOCUMENT_VERSION_CONFIRMATION` is owned by `GenerationService.confirmVersion`; DB representation is `document_versions` plus `review_decisions`; API representation is the two confirmation transports; allowed transitions are PASS → confirmed and WARNING + non-empty acknowledgement → confirmed; CRITICAL and warning-without-acknowledgement are forbidden. Repository persistence is not policy.

## Regression evidence

- Targeted remediation tests: PASS (strict envelope, confirmation HTTP gates, trusted actor, legacy isolation).
- Full backend/frontend/PostgreSQL/build/lint/diff results are recorded in the final checkpoint after execution.
- External calls: Embedding 0, LLM 0, Dify 0, Provider 0.

