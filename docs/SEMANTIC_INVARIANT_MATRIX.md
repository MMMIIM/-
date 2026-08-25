# Semantic Invariant Matrix

This matrix applies the permanent entry-point rule. `N/A` persistence is valid
only for intentionally transient concepts and must be proven through the
downstream formal owner.

| ID | Invariant | Owner | Production entry point | Service | Entry | Persistence | Negative control | Status |
|---|---|---|---|---|---|---|---|---|
| I01 | `UNKNOWN != MATCH` | EvidenceSupportAssessment / downstream gates | Review proposal boundary | YES | PARTIAL for transient proposal path | N/A (assessment) / Review persisted | YES | PARTIAL |
| I02 | `UNKNOWN != MISMATCH` | EvidenceSupportAssessment | Review proposal boundary | YES | PARTIAL for transient proposal path | N/A / Review persisted | YES | PARTIAL |
| I03 | Required + Unknown → unresolved required | Aggregator / Readiness | Evidence review/readiness routes | YES | YES | Readiness persisted | YES | ENFORCED |
| I04 | Required + Mismatch cannot be review-ready | Aggregator / Evidence Review | Evidence review decision | YES | YES | Review persisted | YES | ENFORCED |
| I05 | Blocking mismatch cannot be full support | Assessment / Mapping / Claim Gate | Mapping and Claim routes | YES | YES | Mapping/Claim persisted | YES | ENFORCED |
| I06 | Blocking conflict → `CONFLICTING_EVIDENCE` | Aggregator | Review proposal boundary | YES | PARTIAL transient entry | N/A / Review downstream | YES | PARTIAL |
| I07 | Technical unavailable → `ASSESSMENT_UNAVAILABLE` | Gateway evaluator | Provider adapter / review proposal | YES | PARTIAL live provider | N/A / audit metadata only | YES | PARTIAL |
| I08 | `SYSTEM_DERIVED` is not source evidence | Source eligibility / Eval | Retrieval final-candidate entry | YES | YES | Candidate audit persisted | YES | ENFORCED |
| I09 | Gold Context is not Exact Gold Hit | Eval owner | Eval runner | YES | YES | Eval artifacts only | YES | ENFORCED |
| I10 | Pending GPT review excluded from reviewed denominator | Eval owner | Eval runner | YES | YES | Eval packet | YES | ENFORCED |
| I11 | Parent review does not promote child provenance | Eval/oracle owner | Review packet loader | YES | YES | Eval packet | YES | ENFORCED |
| I12 | Raw Candidate cannot create Approved Fact directly | Evidence Review / Fact | Fact extraction route | YES | YES | Fact lifecycle | YES | ENFORCED |
| I13 | Fact requires valid Review lineage | Evidence Fact service | Fact extraction/decision routes | YES | YES | Fact tables | YES | ENFORCED |
| I14 | Formal Mapping requires Approved Fact | Mapping service | Mapping proposal route | YES | YES | Mapping table | YES | ENFORCED |
| I15 | Safe Claim requires approved Mapping and Claim Gate | Claim Gate | Claim routes | YES | YES | Claim/coverage tables | YES | ENFORCED |
| I16 | Writer Authorization cannot bypass Claim Gate | Writer service | Generation routes | YES | YES | Generation/version tables | YES | ENFORCED |
| I17 | DocumentVersion confirmation uses owning service | Generation/Version service | Version confirmation route | YES | YES | Review decision/version | YES | ENFORCED |
| I18 | Client actor cannot become formal audit actor | Actor resolver / services | All formal mutation routes | YES | YES | Actor columns | YES | ENFORCED |
| I19 | Legacy compatibility cannot weaken canonical contract | Compatibility boundary | Legacy routes | YES | PARTIAL for reachable write-capable paths | Formal state as applicable | YES for covered routes | PARTIAL |
| I20 | Eval/test fixture cannot mutate production truth | Eval boundary | Eval/test runners | YES | YES | N/A or eval artifacts | YES | ENFORCED |

## Code-level evidence

- Assessment contract, adapters and aggregation: `backend/src/pipeline/evidence-support-assessment-contract-v1.js:108-428`.
- Review contract and neutral reviewer: `backend/src/pipeline/evidence-review-contract.js:8-43`.
- Review service proposal/decision and stale invalidation: `backend/src/evidence-review-service.js:7-10`.
- Fact lifecycle: `backend/src/evidence-source-fact-service.js:5-8` and
  `backend/src/pipeline/evidence-fact-contract-v1.js`.
- Mapping lifecycle: `backend/src/requirement-evidence-fact-mapping-service.js:3-6` and
  `backend/src/pipeline/requirement-evidence-mapping-contract-v1.js`.
- Formal HTTP routes: `backend/src/app.js:255-300` and `backend/src/app.js:305-350`.
- Trusted actor boundary: `backend/src/request-actor.js` and
  `backend/test/p0-framework-remediation.test.js:74-151`.
- Eval provenance: `backend/test/evidence-sufficiency-offline.test.js:93-109`.

I01/I02/I06/I07 remain `PARTIAL` at the production-entry dimension because the
assessment is intentionally transient, the proposal HTTP entry is absent, and
the remote semantic task is not published. This is an explicit ownership and
runtime readiness gap, not a reason to create an assessment table.

I19 is also `PARTIAL`: the canonical routes have negative controls, but the
reachable parallel Retrieval→Evidence path and legacy write-capable Mapping path
have not yet been proven equivalent to the canonical lifecycle. This does not
weaken or invalidate the already-tested canonical routes.
