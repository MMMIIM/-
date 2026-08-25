# Concept Registry

This registry is the compact semantic index for the current repository. Stage
ownership is deliberately preserved; the registry unifies names, not services.

| Concept / canonical name | Definition / owner / stage | Data class / lifecycle | Allowed values / blocking behavior | Upstream → downstream | Must not be confused with | Code / schema / legacy |
|---|---|---|---|---|---|---|
| Requirement | Frozen tender scope item; Requirement owner | SOURCE / persisted | `REQ-*`; baseline freeze blocks edits | Tender parse → plans, retrieval | Response Plan, Claim | `requirements`, canonical requirement contract |
| CanonicalRequirement | Confirmed immutable Requirement projection | DERIVED+SOURCE / persisted | confirmed baseline only | Requirement → all coverage | Candidate requirement | `confirmRequirementBaseline` |
| RetrievalCandidate | Raw ranked material candidate | SOURCE/OBSERVATION / persisted audit | candidate only; never formal proof | Retrieval → hygiene/span | Evidence, Fact | `enterprise_retrieval_results` |
| EvidenceBearingCandidate | Candidate with usable source-bearing content | DERIVED / persisted audit | classification gate | Candidate → exact span | Approved Evidence | `evidence-bearing-classifier.js` |
| EvidenceSourceEligibility | Source class/authorization gate | DERIVED / persisted | eligible/ineligible | Candidate → final retrieval | Requirement support | `retrieval-source-eligibility.js` |
| ExactEvidenceSpan | Smallest complete cited source unit | SOURCE / persisted | exact text/hash/lineage required | Candidate → context/review | Context Window | `evidence-source-span-service.js` |
| EvidenceContextWindow | Bounded surrounding context | SOURCE / transient/read model | bounded same lineage | Span → assessment/review | Exact Span | `evidence-context-expansion.js` |
| EvidenceSupportAssessment | Source-bound semantic observation | DERIVED from observations / transient | available/unavailable; no formal state | Span → Review | Fact, Mapping | `evidence-support-assessment-contract-v1.js` |
| `subject_match` | Requirement subject vs source subject | SOURCE observation | match/mismatch/unknown | Assessment → aggregate/review | entity/scope | shared assessment dimensions |
| `entity_match` | Identity relation for enterprise/product/project | SOURCE observation | match/mismatch/unknown | Assessment → aggregate/claim | subject/scope | same |
| `scope_match` | Applicability/product/environment scope | SOURCE observation | match/mismatch/unknown | Assessment → aggregate/claim | entity/eligibility | same |
| `status_match` | Requirement status vs observed status | SOURCE observation | match/mismatch/unknown | Assessment → review/fact | technical status | same |
| `validity_match` | Validity/date condition | SOURCE observation | match/mismatch/unknown | Assessment → fact/claim | freshness metadata | same |
| `quantitative_match` | Numeric/threshold comparison | SOURCE observation | match/mismatch/unknown | Assessment → risk gate | support level | same |
| `support_sufficiency` | Deterministic sufficiency conclusion | DERIVED | sufficient/partial/insufficient/unknown/mismatch | Dimensions → aggregate | `support_level` | `aggregateEvidenceSufficiency` |
| `support_level` | Source support degree recorded by contract | SOURCE/DERIVED domain field | full/partial/conflict/reference/unknown | Review/Mapping → Claim Gate | sufficiency | Review/mapping contracts |
| `business_status` | Aggregate business outcome | DERIVED | review-ready/no-relevant/insufficient/conflicting | Aggregator → Review/readiness | technical status | assessment contract |
| EvidenceReviewProposal | System-prepared review candidate | DERIVED / persisted | proposed/needs_review | Assessment → human review | Decision | `EvidenceReviewService.propose` |
| EvidenceReviewDecision | Human approval/rejection | EXTERNAL_OBSERVATION / persisted | approved/rejected | Review → Fact | Proposal | `EvidenceReviewService.decide` |
| EvidenceFact | Bounded reviewed statement candidate | SOURCE+DERIVED / persisted | draft/approved/rejected/invalidated | Review → Mapping | Assessment | `evidence-fact-contract-v1.js` |
| ApprovedEvidenceFact | Human-approved bounded fact | SOURCE / persisted | approved and lineage-valid | Fact → Mapping/Claim | Draft Fact | Fact service |
| RequirementEvidenceFactMapping | Requirement-to-approved-Fact relationship | DERIVED / persisted | proposed/approved/rejected | Fact+Requirement → Claim Gate | Retrieval result | mapping contract/service |
| Claim | Proposed bid assertion | DERIVED / persisted | candidate/approved/rejected | Mapping/Plan → Claim Gate | Fact/Writer output | claim contracts |
| ClaimGateEvaluation | Safety authorization decision | DERIVED / persisted/audit | allow/deny/needs_review | Claims → Writer | Mapping approval | `claim-gate-v2-contract.js` |
| WriterAuthorization | Bounded permission for a Writer run | DERIVED / persisted/audit | authorized/denied | Claim Gate → Writer | Claim approval | writer authorization contracts |
| WriterSafeContext | Hash-bounded Writer input | DERIVED / persisted/audit | authorized refs only | Authorization → Provider | Evidence/Fact | writer context modules |
| Generation | Candidate document generation lifecycle | DERIVED / persisted | queued/running/finalized/failed | Writer → validation | DocumentVersion | `document-generation-service.js` |
| DocumentVersion | Formal versioned final document | DERIVED / persisted | draft/confirmed/etc. | Validation → delivery | Writer output | version service |
| `raw_rank` | Initial vector/rerank order | EXTERNAL_OBSERVATION / persisted | integer rank | Retrieval → final ranking | final rank | retrieval result columns |
| `final_rank` | Post-hygiene final candidate order | DERIVED / persisted | integer rank | Hygiene → evidence candidate | raw rank | retrieval pipeline |
| GoldEvidence | Human/approved exact evidence truth | SOURCE / eval artifact | explicit provenance | Gold → evaluator | Gold Context | eval gold loaders |
| GoldContext | Contextual evaluation aid | SOURCE / eval artifact | never exact hit by itself | Eval → diagnostics | Gold Evidence | eval fixtures |
| OracleProvenance | Field-level expectation authority | SOURCE / eval artifact | AUTO/GPT/HUMAN/PENDING | Oracle → metric | Runtime observation | eval packets |
| ActorProvenance | Trusted actor identity and source | EXTERNAL_OBSERVATION / persisted | authenticated/dev adapter | Request → formal service | client body actor | `request-actor.js` |
| TechnicalStatus | Transport/provider execution state | EXTERNAL_OBSERVATION | success/timeout/network/schema failure | Provider → audit | business status | gateway/error audit |
| AssessmentUnavailable | Technical assessment boundary | DERIVED from technical failure | unavailable + reason | Gateway → Review human gate | insufficient evidence | assessment contract |
| ConflictObservation | Two unequal observations of same fact dimension | SOURCE observation | conflict group with ≥2 values | Sources → aggregate | adverse evidence | gateway/assessment contract |
| AdverseEvidence | Source observation adverse to Requirement | SOURCE observation | requirement-relative mismatch | Evidence → review/claim gate | conflict | semantic assessment |

## Canonical aliases

`unknown`, `unresolved`, `missing`, `not_verified`, `uncertain` and `not_found`
are not interchangeable in storage. The first is a truth dimension; the latter
may be operational/source-resolution states. `partial`, `unsupported` and
`insufficient` are domain states and must not be silently rewritten as
`MISMATCH` or technical failure.

## Registry governance

New fields must declare owner, source/derived class, persistence expectation,
allowed values and downstream consumers. A generic `status`, `result`,
`evidence` or `source` field is not sufficient documentation for a formal state.
