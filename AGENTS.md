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

## Knowledge and material invariants

- 企业资料库提供 GENERAL、INDUSTRY、ENTERPRISE_PRIVATE 三个业务范围；首批行业范围为 GOVERNMENT_ENTERPRISE 和 HEALTHCARE。
- 三个范围共用一套 Material / Retrieval 基础设施，不创建彼此隔离的 RAG 系统。
- Material ≠ Chunk ≠ Evidence ≠ Evidence Fact ≠ Claim。
- 新语料必须经过治理与评测激活后，才能进入正式 Production Retrieval。
- Corpus Readiness L3 是当前可用于投标的语料目标；资料数量本身不构成 PASS。
- 通用/行业知识不得静默升级为企业能力或 Approved Claim。

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

## Branch policy and production target

- Before checkout, feature creation, synchronization, cherry-pick, merge,
  deploy, runtime restart, or live verification, read
  `config/branch-policy.json`. Never infer the authoritative or production
  branch from a branch name alone. `fix/*` and `feat/*` work is allowed only
  after lineage is proven against the configured authoritative branch; live,
  deploy, and runtime restart require that exact branch. Historical branches
  are audit/read-only and are never production eligible. Synchronization is
  ff-only where possible and any divergence stops without merge, rebase,
  cherry-pick, reset, or force-push.
- Default policy is no merge, push, deploy, or force-push without explicit
  user authorization.
- Preserve existing user changes and never use destructive reset/checkout.

## Permanent formal-invariant entry-point coverage

Owning-service unit tests alone do not establish that a formal business
invariant is enforced. For every safety-critical or truth-critical invariant,
the invariant matrix must track and the regression suite must cover:

1. owning-service positive behavior;
2. owning-service negative behavior;
3. at least one real production entry point negative-control test; and
4. a persistence-state assertion whenever formal business state is mutated.

Formal entry points include HTTP/API handlers, Agent actions, retry and
compatibility endpoints, background execution, provider adapters, and import /
ingestion paths. The required proof is:

```text
entry point → owning service → canonical contract → persistence
```

The entry point must not reproduce the service's policy or bypass it. A route
that mutates formal state through `route → repository` when an owning service
exists is an architectural smell. Client-supplied reviewer/editor identity,
compatibility weakening of a canonical contract, and test/eval paths mutating
production truth are forbidden patterns.

The matrix dimensions are `SERVICE_TESTED`, `ENTRY_POINT_TESTED`,
`PERSISTENCE_TESTED`, and `NEGATIVE_CONTROL_PRESENT`. An invariant may be
marked `ENFORCED` only when all required dimensions are covered; otherwise it
is `PARTIAL` (or retains `CONTRADICTED` when a reachable violation exists).

When a bypass is found: fix the owning boundary, add a regression at the real
bypass entry point, update the invariant matrix, search repository-wide for
sibling entry points, and do not close the finding from service tests alone.

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

Do not rescan the whole repository for every task. Codex pre-reads:

1. This file
2. [Architecture](ARCHITECTURE.md)
3. [Current stage](docs/CURRENT_STAGE.md)
4. [Roadmap](docs/ROADMAP.md)
5. Relevant ADRs
6. Directly related code, tests, and stage documents

For Corpus L3 work, also read
[`docs/decisions/008-curated-corpus-governance.md`](docs/decisions/008-curated-corpus-governance.md)
and [`docs/RAG_CORPUS_L3_PLAN.md`](docs/RAG_CORPUS_L3_PLAN.md). Do not load unrelated
Word or Agent deep documentation unless the task touches it.

## Source documents

- [Architecture](ARCHITECTURE.md)
- [UX principles](docs/UX_PRINCIPLES.md)
- [Roadmap](docs/ROADMAP.md)
- [Evaluation policy](docs/EVAL_POLICY.md)
- [Current stage](docs/CURRENT_STAGE.md)
- [Decisions](docs/decisions/)
- [V4.3 semantic architecture supplement](docs/v4.3-semantic-architecture.md)

Roadmap items are not implementation authorization. Implement only what the
current stage explicitly selects.

Permanent product principles:

- Main UI expresses user tasks, not Backend Pipeline structure.
- Business-critical actions should use reusable Backend Service boundaries
  when practical.
- Future Agent tools call formal services and never duplicate business truth in
  prompts.

Product architecture references: [Product IA](docs/PRODUCT_IA.md) and [Agent
Product Strategy](docs/AGENT_PRODUCT_STRATEGY.md).
