# Stage 18 — Bid Copilot / Agent Foundation

Stage 18 adds a contextual project assistant over the existing formal Control
Plane. It resolves an explicit project context, calls read-oriented wrappers
around authoritative services, and returns business-language explanations,
prioritized tasks and safe navigation actions.

## Safety boundary

- The assistant does not own Requirement, Evidence, Fact, Mapping, Claim Gate,
  Project Fact, Writer Authorization or Bid Check truth.
- L0 read tools and the L1 navigation action can run automatically.
- L2 preparation is never accepted as a formal decision; L3 mutations need a
  preview and validation; L4 approvals, confirmations and Claim Gate bypasses
  always require a human and are never executed by the assistant.
- Retrieval results are explicitly labelled as candidate material until the
  existing evidence review workflow confirms them.
- Tender/material text is data. It is not treated as an instruction, including
  when it contains prompt-injection language.

## API

`GET /api/projects/:projectId/copilot/context` resolves the explicit project
context. `POST /api/projects/:projectId/copilot` accepts `{ message, context }`
and returns `status`, `summary`, `tasks`, `actions`, `sources`, `blockers` and a
safe audit reference. `GET /api/projects/:projectId/copilot/audits` exposes the
sanitized execution trace.

## Evaluation

The offline deterministic suite covers the ten Stage 18 cases and can be run
with:

```sh
npm run eval:agent -w backend
```

It performs no network or model calls. The execution audit is persisted by
migration `039_agent_execution_audit.sql` when PostgreSQL is used.
