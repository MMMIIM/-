# Roadmap

Roadmap priority is not implementation authorization. Only
[`CURRENT_STAGE.md`](CURRENT_STAGE.md) can select the next work.

## P0 — ACTIVE: Core product UX and generation flow

Make the core workflow real, stable, reviewable, traceable, and easy to use:

```text
Platform Shell → Project Preparation → Review & Completion
→ Chapter Generation → Bid Check
```

Stage 13 product acceptance is closed. Stage 14 Platform Shell & Core Flow IA
is active. Stage 15 Chapter Generation Workbench follows after Stage 14
acceptance. Roadmap entries are not implementation authorization.

## P1 — PLANNED: Word and document formatting

Word export, chapter structure, numbering, table/image handling, pagination,
headers/footers, customer templates, and versions. Reuse compatible mature
DOCX implementations where possible; own the bid document model and UX.

## P1 — PLANNED: Enterprise knowledge base / RAG

Keep Production Retrieval stable. Expand only when real evaluation, misses,
complex documents, or user problems justify it. Compatible projects such as
RAGFlow, AnythingLLM, LangChain.js, MinerU, or Docling are reference/reuse
options, not automatic additions.

## P2 — PLANNED: Users, organizations, and permissions

Provide secure, sufficient enterprise identity and RBAC by reusing mature
solutions such as Better Auth, Node-Casbin, or a compatible IdP when needed.
Do not self-build password, session, RBAC, or SSO protocols.

## P2 — PLANNED: Bid Copilot / Agent V1

An assistant may call formal backend tools to reduce navigation and repetition.
It must never become a second business Control Plane. Agent V2 remains later
and evidence-driven.
