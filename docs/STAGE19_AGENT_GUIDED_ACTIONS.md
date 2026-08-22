# Stage 19 — Bid Copilot guided actions

Stage 19 adds a bounded action layer to the existing project assistant. The
assistant can refresh formal read models, prepare retrieval and review work,
and create a chapter revision preview. It never writes business state directly.

## Safety boundary

- L0 read and L1 refresh/retrieval/check/navigation actions may run in the
  current project context.
- L2 actions prepare or validate a result; they do not change a formal version.
- L3 mutations require a persisted preview, a current-version hash match and
  an explicit human confirmation. The formal document service creates a new
  version and preserves its parent.
- L4 decisions (approval, rejection, override, bypass and confirmation) are
  returned as `HUMAN_REQUIRED` and are never executed by Copilot.

Every action has an idempotency key and an audit row. A stale preview is
rejected before the formal service is called. Action responses use business
language and separate what happened, what changed, what did not change and
the next action. Preview responses expose only the original/proposed text and
safe validation summary; internal prompts and provider responses are not sent
to the browser.

## Endpoints

- `POST /api/projects/:projectId/copilot/actions/execute`
- `POST /api/projects/:projectId/copilot/actions/execute-plan`
- `GET /api/projects/:projectId/copilot/action-previews/:previewId`
- `GET /api/projects/:projectId/copilot/action-audits`

The plan executor is bounded to eight actions per request. Retrieval remains a
candidate-only operation; it cannot approve Evidence, Facts, Mapping or
Claims. Chapter application is available only from the explicit “接受并应用
修改” action in the preview card.

## Offline evaluation

`npm run eval:agent-v2 -w backend` runs 12 deterministic cases covering safe
actions, candidate retrieval, preview/apply, formal-decision blocking, prompt
injection, idempotency, stale previews, partial failure and plan bounds. It
does not access a network or call an AI provider.
