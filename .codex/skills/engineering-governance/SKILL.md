---
name: engineering-governance
description: Use when a change touches shared concepts, authorities, contracts, production/eval parity, runtime identity, migrations, compatibility paths, or other cross-boundary behavior that may drift.
metadata:
  short-description: Low-interference anti-drift checkpoints
---

# Engineering Governance

Use this as a checkpoint, not a continuous supervisor.

## Routing

- **GREEN** — local implementation detail with no shared meaning, boundary, or runtime impact: skip governance and proceed normally.
- **YELLOW** — API/schema/prompt/eval/gateway/module boundary, duplicated transformation, concurrency, dependency, compatibility, or runtime-facing change: run the fast check.
- **RED** — canonical authority/identity, persistence, migration, security, destructive action, production contract cut, deploy/restart: stop if ownership or required evidence is unclear.

Classify only the surfaces actually changed. Do not scan unrelated subsystems.

## Fast anti-drift check

Check only relevant invariants:

1. **Definition** — one canonical meaning; search existing contract/schema/concept before creating another business term.
2. **Authority** — one owner for canonical identity, state, persistence, approval, and critical transformations.
3. **Identity** — runtime/contract/prompt/schema/evaluator identity is explicit where comparison matters.
4. **Parity** — equivalent paths reuse the same canonical implementation or prove executable parity. Documentation/intent is not parity.
5. **Stable identity** — run-local rank/chunk/temporary refs never become cross-run identity.
6. **Representation** — exact/canonical data owns provenance and identity; derived/model-facing forms must not redefine them.
7. **Fallback** — no silent legacy fallback, compatibility alias, bypass, or state promotion may hide a contract break unless explicitly governed.

Prefer shared canonical code over maintaining two implementations plus parity tests.

## Checkpoint protocol

Before YELLOW/RED work: identify the owner, affected invariant/boundary, smallest validation set, and any explicit authorization needed.

Before handoff: confirm authority remains singular, required parity holds, no hidden fallback/bypass was introduced, and targeted evidence reaches the changed boundary. Use the first failure boundary; fix one primary root cause at the owning layer, replay affected cases, and rerun only impacted layers. Passed layers stay frozen unless new evidence invalidates them.

## Boundaries

`AGENTS.md`, architecture/ADR/contracts, and explicit user authorization remain authoritative. This skill grants no commit/push/merge/deploy, external-provider, destructive DB, or contract-change authority. Do not enlarge scope, add architecture for standards, or refactor opportunistically.

Superpowers remains the execution method when separately active; this skill only decides when anti-drift governance is required.
