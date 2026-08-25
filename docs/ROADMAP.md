# Roadmap

Roadmap priority is not implementation authorization. Only
[`CURRENT_STAGE.md`](CURRENT_STAGE.md) can select the next work.

## Product priority policy

Priority is assigned by user impact and correctness, not by implementation
layer. P0 covers the Core Experience: anything that blocks the core workflow,
correctness, trust, continuity or an obvious user-facing path. This includes
the standalone semantic gateway/real-provider foundation, requirement and
retrieval correctness, evidence safety, generation stability, revision and Word
correctness. A P1, P1.5 or P2 item is promoted to P0 when a concrete defect
blocks that core experience.

P1 covers high-value product differentiators that do not block the foundation,
including valuable RAG, Agent and Word enhancements. P1.5 covers high-value
platform capabilities outside those differentiators, such as provider/model
management, advanced enterprise-material administration, collaboration,
advanced Bid Check, version audit and operations analytics. P2 covers
enhancements or high-complexity/high-risk work such as GraphRAG, multi-agent
autonomy, automatic provider routing, cost-aware routing, advanced AI layout
and self-learning retrieval.

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

Stage 17 Retrieval Engine is **PASS / FROZEN**. Its canonical six-case metrics are
Decision-Bearing Hit@1/3/5 83.33%/100%/100%, Decision-Bearing MRR 0.9167, Exact
Gold Hit@1/3/5 50%/100%/100%, and Exact Gold MRR 0.75; the separate eight-case
Regression Retrieval Suite reports Recall@5 90% and MRR 1.000. Stage 20 is the
active Production Beta acceptance track for Corpus Readiness L3; the knowledge
base is not considered bid-usable until L3 passes. Initial industry focus remains
政企平台 and 医疗行业; do not broaden industry scope before the current corpus
gaps are resolved.

Stage 21-A Runtime Connectivity Foundation is **PASS / FROZEN** and provides the
managed development transport needed for the Stage20 re-entry; manual SSH tunneling
remains a development access method, not a product operating requirement. Full Stage
21 is not authorized by the current stage and is not being implemented now.

## P2 — PLANNED: Enterprise Identity & Authorization

Provide secure enterprise identity, project authorization and knowledge/material
permissions by reusing mature solutions when needed. Do not self-build
password, session, RBAC, or SSO protocols.

## P2 — PLANNED: Bid Copilot / Agent V1

An assistant may call formal backend tools to reduce navigation and repetition.
It must never become a second business Control Plane. Agent V2 remains later
and evidence-driven.

## Planned architecture tracks (not implementation authorization)

The following tracks are recorded for future sequencing only. They are not
implemented by the current Stage20 work and must not be inferred from the
roadmap as available runtime capabilities:

1. **Legacy authority convergence** — move legacy Evidence/Mapping write paths
   toward canonical-only writes while preserving historical read compatibility.
2. **Async job / queue / worker architecture** — provide bounded concurrency,
   retry and recovery for parsing, embedding, retrieval, assessment,
   generation and Word rendering.
3A. **Minimal Project Authorization Kernel (P0 current)** — establish the
    smallest trusted Actor → Project Membership → ProjectAuthorizationService
    boundary required by the private deployment core flow. The current P0
    Review→Fact finding demonstrates that this kernel is required before
    external production use.
3B. **Enterprise Identity & Authorization before formal enterprise usage** —
    extend the kernel to enterprise RBAC, Project, Knowledge, Material,
    Evidence and Audit permissions.
3C. **True Multi-Tenant SaaS (optional future extension)** — add Tenant and
    Organization isolation only if a future SaaS product decision requires it;
    it is not the current deployment model.
4. **Document version / Word / chapter regeneration lifecycle** — separate
   Generation, DocumentVersion and Export, with chapter regeneration, version
   comparison, rollback and formal confirmation.
