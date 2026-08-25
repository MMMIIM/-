# Stage20 Evidence Lifecycle Entry Matrix

This audit closes the real production-entry coverage requested for the
Evidence lifecycle. It adds PostgreSQL-backed HTTP integration tests only;
no lifecycle contract or production service behavior was changed.

## Matrix

| Invariant | SERVICE_TESTED | ENTRY_POINT_TESTED | PERSISTENCE_TESTED | NEGATIVE_CONTROL_PRESENT | Status |
| --- | --- | --- | --- | --- | --- |
| Retrieval → Review Proposal | YES | YES | YES | YES | **ENFORCED** |
| Review → Fact | YES | YES | YES | NO | **PARTIAL** |
| Fact → Mapping | YES | YES | YES | YES | **ENFORCED** |

### Retrieval → Review Proposal

`SEM-P1-004 Proposal HTTP entry matrix P1-P6 with PostgreSQL persistence`
exercises `POST /api/projects/:projectId/requirements/:requirementId/evidence-reviews`
through the actual `EvidenceReviewService.propose` boundary. It covers:

- P1 wrong-project candidate: denied;
- P2 wrong requirement: denied;
- P3 candidate/source-span mismatch: denied;
- P4 missing/invalid exact span: denied;
- P5 duplicate proposal: idempotent and one persisted review;
- P6 stale lineage: canonical invalidation behavior.

The test asserts that rejected proposals do not persist a review and that the
valid/duplicate/stale paths have the expected PostgreSQL state.

### Review → Fact

`SEM-P1-004 Review-to-Fact HTTP routes enforce approval and persist only
approved lineage` exercises the production fact routes. It proves approved
reviews can create a draft Fact, while unapproved, rejected, stale/
invalidated, and cross-project proposal paths do not create a Fact.

The canonical facts route is keyed by `reviewId` and does not also carry a
project path parameter. Therefore this batch does not claim a dedicated
cross-project lookup negative-control for an already-known Review ID;
`NEGATIVE_CONTROL_PRESENT` remains **NO** and the invariant remains **PARTIAL**
until that entry-point boundary is independently evidenced.

### Fact → Mapping

`SEM-P1-004 Fact-to-Mapping HTTP routes reject non-approved or cross-project
Facts` exercises the real mapping proposal and approval routes. An approved
canonical Fact can produce and approve a Mapping. Draft, rejected,
invalidated, cross-project, and wrong-Requirement Facts are denied, with
PostgreSQL assertions that no invalid formal Mapping is persisted.

## Changed files

- `backend/integration/sem-p1-004-entry-matrix.integration.js`
- `backend/package.json` (`test:postgres` includes the entry-matrix suite)

No `backend/src` production code, migration, or lifecycle contract changed.

## Remaining boundaries

- `MAPPING_TO_CLAIM`: **PARTIAL**; ProductionBetaService still consumes the
  legacy `requirement_evidence_mappings` authority.
- `I19`: **PARTIAL**; legacy write-capable paths remain unresolved.
- `SEM-P1-004`: **PASS / CLOSED** for the accepted Option B transition.
- Stage20: **PARTIAL / BLOCKED** pending the remaining lifecycle and legacy
  authority decisions.
