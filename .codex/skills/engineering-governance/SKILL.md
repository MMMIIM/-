---
name: engineering-governance
description: Review risky engineering changes at implementation and completion checkpoints without supervising ordinary local work.
metadata:
  short-description: Checkpoint governance for risky changes
---

# Engineering Governance

Use this skill as a checkpoint reviewer, not as a continuous supervisor.

## Routing

- GREEN: ordinary, local, low-risk edits. Skip governance and proceed normally.
- YELLOW: API, schema, prompt contract, database, gateway, module boundary,
  concurrency, dependency, or similar interface/runtime changes. Run a focused
  FAST CHECK before implementation and a COMPLETION CHECK before handoff.
- RED: architecture, migrations, hard contract cuts, security, production
  deploy/restart, or destructive data changes. Use the applicable plan,
  pre-merge, and runtime gates; stop when authority or evidence is missing.

Classify the change by its highest-risk affected surface. Do not escalate a
task merely because the repository contains a related high-risk subsystem.

## Focused checks

Inspect only the change-relevant evidence across these dimensions:

1. Authority — correct owner and decision authority.
2. Boundary — service/module/entry-point ownership and isolation.
3. Contract — input/output, persistence, and compatibility semantics.
4. Compatibility — existing callers, flags, fixtures, and migrations.
5. Runtime — configuration, rollout, restart, and failure behavior.
6. Evidence — targeted tests, persistence assertions, and reproducible proof.

Do not scan the whole repository unless the task explicitly requires it. Do
not invoke this review after every edit, enlarge scope, refactor opportunistically,
add architecture for “standards”, or speculate about future-proofing.

## Checkpoint protocol

FAST CHECK (YELLOW/RED before implementation): identify the owner, affected
boundary, contract impact, compatibility risk, required authorization, and the
smallest validation set. For RED changes, establish a plan and explicit runtime
or destructive-action gate before execution.

COMPLETION CHECK (YELLOW/RED before handoff): confirm the owner still governs
the behavior, no bypass or compatibility weakening was introduced, and the
targeted evidence proves the changed boundary. For state-mutating invariants,
require service behavior, a real entry-point negative control, and persistence
assertion. RED changes additionally require the applicable pre-merge/runtime
evidence and an explicit stop if it is absent.

## Boundaries

The project `AGENTS.md`, architecture documents, ADRs, and explicit user
authorization remain authoritative. This skill does not grant merge, push,
deploy, external-provider, destructive database, or contract-change authority.
If evidence conflicts or a required owner is unclear, stop and report the
minimum decision needed.

Superpowers (TDD, debugging, planning, and general review mechanics) remains
the execution method when separately active; this skill only routes when
governance checkpoints are required and does not duplicate those mechanics.
