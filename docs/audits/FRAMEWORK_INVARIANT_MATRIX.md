# FRAMEWORK INVARIANT MATRIX

Status meanings: `ENFORCED` = contract and tests cover the boundary; `PARTIAL` = meaningful enforcement exists but cross-layer/independent evidence is incomplete; `CONTRADICTED` = a reachable path violates the invariant. This is an audit artifact, not a remediation plan.

| ID | Invariant | Governing doc | Enforcement module | Test coverage | DB constraint | API enforcement | Known violation | Status |
|---|---|---|---|---|---|---|---|---|
| I01 | Relevant != Evidence-Bearing | ARCHITECTURE.md; ADR 002 | `retrieval-chunk-role.js`, `evidence-bearing-classifier.js` | retrieval role/evidence-bearing negatives | retrieval result role fields | retrieval/evidence review routes | none found | ENFORCED |
| I02 | Evidence-Bearing != Sufficient | ARCHITECTURE.md; ADR 002 | `evidence-support-assessment-contract-v1.js`, aggregator | support direct/partial/unknown/conflict tests | no direct approval constraint | shared assessment is transient; review route separate | provider-neutral unavailable is still mostly offline | PARTIAL |
| I03 | Sufficient != Approved Fact | ARCHITECTURE.md; ADR 002 | `evidence-review-service.js`, `evidence-source-fact-service.js` | approved Fact and draft/rejected gates | migration 026/027 review_status | fact endpoints require owning service | none found | ENFORCED |
| I04 | Approved Fact != Mapped | ARCHITECTURE.md; ADR 002 | `requirement-evidence-fact-mapping-service.js` | Fact-only proposed Mapping tests | migration 021 foreign keys/checks | mapping proposal/decision routes | none found | ENFORCED |
| I05 | Mapped != Safe Claim | ARCHITECTURE.md; ADR 003 | `claim-gate.js`, `claim-gate-v2.js` | quantitative/scope/status/authority gate tests | migration 022 decisions | Production Beta/claim routes | none found | ENFORCED |
| I06 | Unknown != Confirmed | ARCHITECTURE.md; EVAL_POLICY | review/fact/mapping/readiness services | unknown/pending/conflict tests | status checks/defaults | review routes and readiness | no generic Unknown→Confirmed path found; warning issue is separately I16 | ENFORCED |
| I07 | Storage != Proof Eligibility | ARCHITECTURE.md; ADR 002/008 | `retrieval-source-eligibility.js`, Evidence services | source class and proof eligibility tests | migration 044 fields/default false | retrieval/evidence routes | none found in formal lane | ENFORCED |
| I08 | Substantive != Source Eligible | ADR 008 / current source audit | `retrieval-substantive-candidate.js` + source gate | substantive/source hygiene tests | migration 043/044 | Enterprise retrieval final-candidate gate | none found | ENFORCED |
| I09 | Source Eligible != Requirement Relevant | ARCHITECTURE.md; EVAL_POLICY | retrieval relevance + review/support contracts | topic-only/reference tests | no combined DB flag | retrieval then review | none found | ENFORCED |
| I10 | Derived Decision != Source Evidence | ARCHITECTURE.md; ADR 008 | source eligibility provenance classes | derived/internal/eval leakage negatives | class persisted on result | final candidate gate | audit_rank/result audit retains derived raw candidates | PARTIAL |
| I11 | Eval Truth != Runtime Output | EVAL_POLICY | eval packets, independent Gold loaders | packet isolation and no leakage tests | eval artifacts not in prod schema | eval scripts separate from API | Dify top-level outputs fallback is provider contract issue, not Gold leakage | PARTIAL |
| I12 | Technical Failure != Business Insufficiency | ARCHITECTURE.md; EVAL_POLICY | semantic gateway error mapping, support aggregate | provider timeout/network/schema tests | failed runs/generation audits | errors preserve code and status | no confirmed collapse in shared support path | ENFORCED |
| I13 | Context Chunk != Evidence Hit | ARCHITECTURE.md | source span/context recovery services | context-only and exact-span tests | evidence spans FK to chunks | review input requires span | current DB uses material as document identity (P2-DATA-001) | PARTIAL |
| I14 | Multi-chunk Evidence Span != single-chunk Retrieval Gold | EVAL_POLICY | source span resolver + eval integrity audit | multi-chunk span and Gold integrity tests | source_chunk_ids JSONB | evidence review reads span | human Gold still pending | PARTIAL |
| I15 | Writer Output != Approved Fact | ARCHITECTURE.md; ADR 003 | writer auth, validator, mention ledger, critical guard | unauthorized refs/critical guard tests | writer contexts/mentions FKs | document generation/export routes | legacy Dify generation route is separate compatibility path | ENFORCED |
| I16 | Warning != Confirmed without Explicit Acknowledgement | ARCHITECTURE.md; P0 remediation decision | `GenerationService.confirmVersion`, `assertVersionCanBeConfirmed` | warning HTTP confirmation tests | `review_decisions.confirmation_text` + `actor_id` | all confirmation routes use owning service | historical duplicate route bypassed warning gate; fixed in Batch 1 | CONTRADICTED |

## Cross-layer reading

- No invariant-wide `MISSING` status was assigned from static inspection; `PARTIAL` marks missing independent proof or cross-layer centralization.
- I06 remains enforced. I16 records the specific warning-confirmation violation found by the original audit; Batch 1 routes now use the owning service and its negative/positive HTTP tests.
- Database constraints are deliberately not treated as a substitute for owning-service transitions.

## Permanent entry-point coverage gate

Service tests alone do not establish formal enforcement. The following four
dimensions are mandatory for every invariant and must be refreshed when a
route, adapter, Agent action, retry path, background worker, or ingestion path
changes:

SERVICE_TESTED = owning-service positive and negative behavior.
ENTRY_POINT_TESTED = at least one real production entry point with a
negative-control test.
PERSISTENCE_TESTED = formal state assertion when the operation mutates
business state (N/A for transient or eval-only invariants).
NEGATIVE_CONTROL_PRESENT = the entry point cannot bypass the owner or weaken
the canonical contract.

| ID | SERVICE_TESTED | ENTRY_POINT_TESTED | PERSISTENCE_TESTED | NEGATIVE_CONTROL_PRESENT | Coverage gate |
|---|---|---|---|---|---|
| I01 | YES | YES | YES | YES | PASS |
| I02 | YES | NO | N/A | YES | PARTIAL — shared assessment is transient and has no formal entry point |
| I03 | YES | YES | YES | YES | PASS |
| I04 | YES | YES | YES | YES | PASS |
| I05 | YES | YES | YES | YES | PASS |
| I06 | YES | YES | YES | YES | PASS |
| I07 | YES | YES | YES | YES | PASS |
| I08 | YES | YES | YES | YES | PASS |
| I09 | YES | YES | YES | YES | PASS |
| I10 | YES | YES | YES | YES | PASS |
| I11 | YES | YES | N/A | YES | PASS — evaluation truth is file-scoped, not formal DB state |
| I12 | YES | YES | YES | YES | PASS |
| I13 | YES | YES | YES | YES | PASS |
| I14 | YES | YES | YES | YES | PASS — independent Human Gold remains a separate acceptance gate |
| I15 | YES | YES | YES | YES | PASS |
| I16 | YES | YES | YES | YES | PASS — historical contradiction retained above for audit traceability |

The coverage gate is normative: a future invariant must be marked PARTIAL
until all required dimensions are evidenced, even if its owning service has
complete unit coverage. High-risk entry-point controls are mandatory for
Requirement freeze, Evidence Review, Evidence Fact approval,
Requirement–Evidence Mapping, Claim Gate, Writer Authorization, Document
Version confirmation, provider response contracts, Evidence Source Eligibility,
external-data authorization, technical-failure semantics, and legacy
compatibility boundaries.

Forbidden architectural pattern:

~~~text
route / handler → repository → formal state mutation
~~~

when an owning service exists. The required proof remains:

~~~text
entry point → owning service → canonical contract → persistence
~~~

When a bypass is found, the owning boundary, the real bypass entry point,
the sibling-entry-point search, and the persistence assertion must all be
updated before the finding can close.
