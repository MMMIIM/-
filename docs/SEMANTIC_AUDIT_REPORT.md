# Semantic Audit Report

Audit type: repository-wide semantic consistency and contract governance  
Baseline: `feat/v4.3-semantic-boundary-routing` at `7b4721b`  
External calls: Embedding 0, LLM 0, Dify 0, Provider 0, Live Retrieval 0  
Database mutations: 0

## Summary

- Concepts audited: **38 registry concepts**, plus cross-cutting aliases and
  lifecycle states.
- Code symbols/audit surfaces: **52** primary services, contracts, evaluators,
  routes, repositories and test/eval loaders.
- P0 findings: **0 confirmed**.
- P1 findings: **4**.
- P2 findings: **5**.
- Behavior-changing findings: **0 implemented; 4 deferred for decision**.

The audit found no new evidence of an unsafe false allow, client actor spoof,
Unknown→Match/Mismatch upgrade, or eval oracle contamination in the accepted
paths. Findings below are documented, not silently repaired.

## Findings

| ID | Severity | Concept | Code evidence | Current behavior / canonical semantics | Remediation | Blocks Stage20? | Implemented? |
|---|---|---|---|---|---|---|---|
| SEM-P1-001 | P1 | Evidence Review proposal vs decision | `backend/src/evidence-review-service.js:9-10`; `backend/src/app.js:296-297` | `propose()` persists a review proposal, while HTTP exposes decision/fact routes only. Canonical proposal and human decision must remain separate. | CONTRACT_ONLY / future production entry decision | YES, before full E2E | NO |
| SEM-P1-002 | P1 | `support_level` vs `support_sufficiency` | `backend/src/pipeline/evidence-support-assessment-contract-v1.js:381-428`; `backend/src/pipeline/enterprise-claim-gate-v2.js:47-51` | Assessment aggregate derives business status; legacy Claim Gate derives a sufficiency dimension from mapping `support_level`. These are related but not identical owners. | DOC_ONLY now; later validator/consolidation decision | Potentially, not current offline gate | NO |
| SEM-P1-003 | P1 | Subject/entity diagnostic reason alias | `backend/src/pipeline/evidence-fact-claim-evaluator.js:31-32`; `enterprise-evidence-source-router.js:97-111` | Dimensions are independently assigned, but subject mismatch can emit `ENTITY_MISMATCH` reason text. Reason code and dimension can be semantically misleading. | TEST_ONLY / CONTRACT_ONLY; do not rename public reason yet | NO evidence of unsafe state upgrade | NO |
| SEM-P1-004 | P1 | Parallel retrieval Evidence path | `backend/src/app.js:255-256`; `backend/src/evidence-service.js:66-72` | `/from-retrieval` creates draft Evidence through EvidenceService; formal Review proposal is a separate path. Both are reachable and write-capable. | CONTRACT_ONLY; future lifecycle consolidation decision | Yes, E2E path selection | NO |
| SEM-P2-001 | P2 | Generic `status`/`result` field names | Multiple DTOs and legacy routes | Domain-specific statuses coexist correctly but generic names increase ambiguity. | DOC_ONLY; rename only with API/DB migration decision | NO | NO |
| SEM-P2-002 | P2 | Legacy Dify generation compatibility | `backend/src/server.js:46`; `backend/src/dify.js:41`; legacy routes | Compatibility client remains reachable behind legacy boundary; it is not the Stage20 semantic gateway. | SAFE_COMPATIBILITY; retain and document | NO | NO |
| SEM-P2-003 | P2 | `material_id` used as document identity in some historical data | invariant matrix I13 note; retrieval/evidence persistence | Current lineage is preserved but historical data has a known identity limitation. | DOC_ONLY / later data remediation | NO current bypass evidence | NO |
| SEM-P2-004 | P2 | Eval artifacts vs runtime observations | `backend/eval/**`; `backend/test/evidence-sufficiency-offline.test.js:93-109` | Field-level oracle provenance is explicit; old packet aliases remain historical evidence. | DOC_ONLY | NO | NO |
| SEM-P2-005 | P2 | Development actor adapter | `backend/src/request-actor.js`; `backend/src/app.js:20` | `BACKEND_DEV_ACTOR_ID` is a server-side development adapter, not production auth. | DOC_ONLY; production auth remains separate | NO | NO |

## High-risk audit results

### Subject / entity / scope

`evidence-support-assessment-contract-v1.js` and the source router model the
three dimensions independently. Offline tests preserve `entity_match=unknown`
for explicit subject mismatch. No path was found that automatically converts a
missing subject into mismatch. The diagnostic reason alias in
`evidence-fact-claim-evaluator.js` is retained as a P1 naming finding, not
changed in this task.

### Source vs derived

Source-bound observations are retained with hashes and spans. Aggregate status,
unresolved dimensions and sufficiency are derived. The legacy Claim Gate's
`support_level → support_sufficiency` projection is documented as an overlapping
owner and is not silently rewritten.

### Anti-laundering

Offline controls cover `SYSTEM_DERIVED` isolation, source eligibility,
substantive classification, exact span checks and oracle provenance. No accepted
path was found where a derived assessment re-enters Retrieval as source evidence.
The parallel `/from-retrieval` path remains a lifecycle clarification finding.

### Oracle provenance

The offline packet records field-level provenance and keeps
`PENDING_GPT_REVIEW` out of reviewed denominators. `AUTO_DRAFT` is not promoted
to GPT-reviewed or Human Gold by the current tests.

## Evidence lifecycle audit

The canonical lifecycle and ownership are frozen in
[`docs/SEMANTIC_CONSTITUTION.md`](SEMANTIC_CONSTITUTION.md). The only confirmed
production-entry gap is the missing HTTP proposal entry for Evidence Review;
the decision endpoint itself is service-owned and actor-protected.

## Remediation classification

Allowed and completed in this task: documentation-only constitution, registry,
matrix and legacy map.  
Deferred: production API design, remote task publication, migrations, behavior
changes and semantic state consolidation. Those require a later GPT Decision.
