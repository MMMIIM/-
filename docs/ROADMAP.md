# Roadmap

Roadmap priority is not implementation authorization. Only
[`CURRENT_STAGE.md`](CURRENT_STAGE.md) can select the next work.

## P0 — FROZEN: Core product UX and generation flow

The core workflow is real, stable, reviewable, traceable, and easy to use:

```text
Platform Shell → Project Preparation → Review & Completion
→ Chapter Generation → Bid Check
```

Stage 13 product acceptance, Stage 14 Platform Shell & Core Flow IA, and Stage
15 Chapter Generation Workbench are frozen with acceptance PASS.

## P1 — ACTIVE: Document Delivery & Word V1

Word delivery uses one product-owned document model, one professional default
format policy, and a compatible DOCX renderer. Customer templates, browser Word
editing, and pagination guarantees are later evidence-driven work.

## P1 — ACTIVE WITHIN STAGE20: Corpus Readiness L3

The bid-usable knowledge/material target is Corpus Readiness L3. It is a
quality, provenance and coverage gate—not a document-count race and not a new
retrieval architecture. Keep Production Retrieval stable while curating
general, government-platform, healthcare and synthetic-enterprise scopes.
See [`RAG_CORPUS_L3_PLAN.md`](RAG_CORPUS_L3_PLAN.md) and the offline
`npm run eval:corpus-l3 -w backend` report.

Compatible projects such as RAGFlow, AnythingLLM, LangChain.js, MinerU, or
Docling remain reference/reuse options, not automatic additions.

Stage 17 Retrieval Engine is **PASS / FROZEN**. Stage 20 is the active Production Beta
acceptance track for Corpus Readiness L3; the knowledge base is not considered bid-usable
until L3 passes. Initial industry focus remains 政企平台 and 医疗行业; do not broaden
industry scope before the current corpus gaps are resolved.

Stage 21 must resolve development/runtime Gateway connectivity so manual SSH tunneling is
not a normal product operating requirement. Stage 21 is not authorized by the current
stage and is not being implemented now.

## P2 — PLANNED: Users, organizations, and permissions

Provide secure, sufficient enterprise identity and RBAC by reusing mature
solutions when needed. Do not self-build password, session, RBAC, or SSO
protocols.

## P2 — PLANNED: Bid Copilot / Agent V1

An assistant may call formal backend tools to reduce navigation and repetition.
It must never become a second business Control Plane. Agent V2 remains later
and evidence-driven.
