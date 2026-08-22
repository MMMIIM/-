# 003 — Writer Control

## Context

Writer output must remain bounded by approved project context and safe claims.

## Decision

Writer consumes a backend-authorized Safe Context and authorization. Backend
validation, Mention Ledger, Critical Guard, and Coverage Verification remain
mandatory. DeepSeek Pro has demonstrated Writer fit in existing evaluation, but
the model remains replaceable.

## Reason

Authorization and post-generation controls prevent unsupported or unauthorized
assertions from becoming deliverable content.

## Consequences

Changing facts invalidates affected outputs through deterministic propagation;
Writer cannot bypass Claim Gate or authorization.
