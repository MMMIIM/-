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
