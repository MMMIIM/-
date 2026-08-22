# Current Stage

## Stage 16-R1.1 — Bid Format Policy Hardening

Priority: **P1**
Status: **ACTIVE**

Stage 13 — Material Processing / Review UX, Stage 14 — Platform Shell & Core
Flow IA, and Stage 15 — Generation Workbench V1 remain frozen with acceptance
**PASS**. Stage 16-R1 engineering and browser export remain structurally
valid; real Office visual acceptance is still pending.

## Goal

Formalize one conservative, product-owned Chinese technical-bid fallback
format without changing semantic control-plane contracts:

```text
正式版本 → 文档模型 → 格式策略 → DOCX → 可下载 Word → 版本追溯
```

The profile is `SYSTEM_DEFAULT_TECHNICAL_BID_V1`. Future priority is
`Tender Explicit Format Requirements > Enterprise/Customer Template > System
Default Format`.

## Scope

- centralize page, body, heading, table, TOC, section and page-number semantics;
- use A4 with 2.5 cm top/right/bottom and 3.0 cm left margins;
- use 宋体 12 pt body, semantic two-character first-line indentation, 1.5 line
  spacing, and zero body paragraph before/after spacing;
- use 黑体 16/14/12 pt Heading 1/2/3 with deterministic numbering;
- preserve bounded table width, explicit padding, cover/TOC/body sections and
  metadata-safe Project Fact projection;
- do not implement tender-format extraction, template UI, RAG, Agent,
  permissions or external model calls.

## Acceptance status

Stage 16-R1.1 engineering implementation, representative DOCX export and
browser export are **PASS**. Real Office visual acceptance remains required
and must be performed in Microsoft Word, WPS Office or LibreOffice Writer.
Do not claim final freeze without that check.

## Stop conditions

Do not change Requirement, Evidence, Fact, Mapping, Claim Gate, Writer or
Generation semantics. Do not make external AI calls, install Office software,
merge, push or deploy. No ADR or roadmap change is required.
