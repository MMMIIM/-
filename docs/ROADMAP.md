# Roadmap

Roadmap priority is not implementation authorization. Only
[`CURRENT_STAGE.md`](CURRENT_STAGE.md) can select the next work.

## P0 — ACTIVE: Core bid product flow

Make the core workflow real, stable, reviewable, traceable, and easy to use:

```text
Project → Tender File → Requirement → Enterprise Material → Evidence
→ Review → Readiness → Safe Generation → Final Bid Document Flow
```

Problems in this chain take priority over later capabilities.

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

## P3 — PLANNED: Bid Copilot / Agent

An assistant may call formal backend tools to reduce navigation and repetition.
It must never become a second business Control Plane.
