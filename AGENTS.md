# Repository Development Rules

## Project goal

This repository builds a government and enterprise bid-writing AI platform.
The goal is a controllable, traceable, reviewable, editable, and deliverable
bid-production workflow—not text generation alone.

## Core principles

- AI handles uncertainty; the system guarantees determinism.
- Models discover; the system finalizes.
- Relevant is not Evidence. Evidence is not Fact. Fact is not Claim.
- Mapping Approval is not Claim Permission.
- Requirement Coverage is not Claim Safety.
- An Approved Project Fact is not an Approved Claim.
- Unknown must remain unknown.
- Backend is the formal Control Plane.

## Development rules

- Solve demonstrated problems only. Without E2E, evaluation, or user evidence,
  do not add complexity.
- Prefer the minimum fix, smallest blast radius, existing architecture, and
  mature compatible open-source components.
- Common capabilities (parsing, DOCX, templates, auth, RBAC, vector/RAG
  helpers) should reuse or adapt mature MIT/Apache-compatible projects.
- Core bid-domain behavior remains owned here: Requirement, Evidence, Fact,
  Mapping, Claim Safety, Project Fact, Propagation, Readiness, and review UX.
- AGPL projects are reference-only by default until a license decision exists.

## Git and validation

- Keep each independent logical change in its own commit.
- Run related tests before committing; run the full regression at stage exit.
- Default policy is no merge, push, deploy, or force-push without explicit
  user authorization.
- Preserve existing user changes and never use destructive reset/checkout.

## Semi-autonomous execution

For ordinary implementation, test, DTO, frontend, integration, or migration
bugs: identify the root cause, make a minimum fix, run targeted tests and
regression, then continue. Stop only for a stop condition below.

## GPT Decision handoff protocol

When a user message begins with **GPT DECISION** and includes any stage
decision fields (such as Decision, Current Stage, Next Goal, Allowed Scope,
Success Criteria, Stop Conditions, External Authorization, ADR Required, or
Roadmap Change), treat it as the latest user-level stage decision. Do not ask
for the project background again.

Read in this order: `AGENTS.md`, `docs/CURRENT_STAGE.md`, then only the
architecture, ADR, UX, roadmap, code, tests, and docs directly relevant to the
decision. If the decision changes the stage, update `docs/CURRENT_STAGE.md`
with the current stage, priority, goal, allowed scope, success criteria, stop
conditions, authorization, and status; keep it short and current.

Do not change `docs/ROADMAP.md` unless the decision explicitly says
`Roadmap Change: YES`. Create or update an ADR only when `ADR Required: YES`
or a genuinely new long-term architecture decision triggers a stop condition.
Never use a GPT Decision to override frozen contracts, security boundaries, or
external-data limits; report the conflict and wait for the minimum decision.

For a clear, safe scope, continue autonomously through inspect, minimum fix,
targeted tests, regression, independent commit, and clean status. Ordinary
frontend/backend, DTO, query, navigation, fixture, integration, audit, and
minor UX issues do not require interruption when formal semantics stay intact.
External Authorization is exact and single-purpose: `NONE` means zero external
LLM, embedding, Dify, or provider calls, and unused prior authorization is not
inherited. Stop conditions always win, including false allow, Claim Gate
bypass, lineage loss, unauthorized scope, provider/data changes, destructive
Git/DB actions, merge, push, deploy, or repeated failure without new evidence.

When the selected stage's success criteria are complete, report a concise
`STATUS CHECKPOINT` (HEAD, stage, completed work, commits, regression, status,
blocker, next stage, and `User Decision Required: YES`) and wait for the next
GPT Decision rather than opening roadmap work automatically.

## Stop conditions

Stop and report before proceeding when a change would:

- alter a frozen contract semantically;
- add a new external AI scope, provider/model, or project-data scope;
- externalize customer private data;
- create a false allow, bypass Claim Gate, or upgrade Unknown automatically;
- lose source lineage;
- require a major architecture escalation;
- perform destructive database/Git work;
- merge, push, or deploy;
- repeat the same unresolved failure without new evidence.

## Reading order

Do not rescan the whole repository for every task. Read:

1. [Current stage](docs/CURRENT_STAGE.md)
2. This file
3. The relevant architecture or decision file
4. Directly related code and tests

## Source documents

- [Architecture](ARCHITECTURE.md)
- [UX principles](docs/UX_PRINCIPLES.md)
- [Roadmap](docs/ROADMAP.md)
- [Current stage](docs/CURRENT_STAGE.md)
- [Decisions](docs/decisions/)
- [V4.3 semantic architecture supplement](docs/v4.3-semantic-architecture.md)

Roadmap items are not implementation authorization. Implement only what the
current stage explicitly selects.
