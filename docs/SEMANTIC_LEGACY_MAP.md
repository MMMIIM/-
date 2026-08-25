# Semantic Legacy Map

This map records compatibility paths without deleting or weakening them.

| Legacy symbol / route | Canonical replacement | Reachable | Write-capable | Formal mutation | Classification | Risk / action |
|---|---|---:|---:|---:|---|---|
| `createDifyClient` / legacy `generation-jobs` routes | `semantic_gateway` Provider Adapter and pipeline services | Yes, compatibility-gated | Yes | Generation audit/version path | SAFE_COMPATIBILITY with isolation | Keep isolated; do not use for Stage20 main flow. |
| `POST /api/projects/:projectId/requirements/:requirementId/evidence-candidates/from-retrieval` | Evidence Review proposal + `EvidenceReviewService.propose` | Yes | Yes | Creates draft Evidence candidate | CANONICAL_BYPASS_RISK / parallel path | Clarify ownership in a future decision; do not delete here. |
| `EvidenceService.proposeMapping` / `/api/projects/:projectId/evidence-mappings` | `RequirementEvidenceFactMappingService` | Yes | Yes | Legacy Mapping | WRITE_CAPABLE_LEGACY | Preserve; require explicit migration plan before removal. |
| `EvidenceReviewService.propose()` | Production Evidence Review proposal entry | Service/test reachable | Yes (review proposal) | Persists `evidence_candidate_reviews` | MISSING_PRODUCTION_ENTRY | Do not add HTTP route in this task. |
| `EvidenceReviewService.decide()` / `/api/evidence-reviews/:reviewId/:decision` | Same canonical Review decision service | Yes | Yes | Human Review decision | SAFE_CANONICAL_ENTRY | Trusted actor required; preserve idempotent/stale checks. |
| `/api/evidence-reviews/:reviewId/facts` | `EvidenceSourceFactService.extract` | Yes | Yes | Draft Fact extraction | SAFE_CANONICAL_ENTRY | Requires approved Review lineage. |
| `RequirementEvidenceFactMappingService` routes | Same service contract | Yes | Yes | Proposed/approved Mapping | SAFE_CANONICAL_ENTRY | Provider-neutral evaluator may return unavailable. |
| `DocumentGenerationService` routes | Writer Authorization + generation pipeline | Yes | Yes | Generation/Version | SAFE_CANONICAL_ENTRY | Real Provider gate remains pending. |
| `BACKEND_DEV_ACTOR_ID` | Production authenticated actor | Development only | N/A | Audit actor adapter | SAFE_DEVELOPMENT_ADAPTER | Must not be treated as production authentication. |

## Findings

1. The retrieval-candidate-to-Evidence path and the Review proposal path are
   parallel semantic paths. They are not silently interchangeable.
2. The v4.2 Dify route is compatibility-only and must not be used as evidence
   for Stage20 production readiness.
3. No legacy path was deleted or modified during this audit.
