# Semantic Boundary & Evidence Need Coverage Audit v1

Status: INCOMPLETE_REQUIREMENT_INVENTORY

Snapshot: 4.3-semantic-boundary-eval-snapshot-v1
Snapshot hash: 8d857e5454ce218811a23c8aca7bb90bc6f355e3c864fc2fdfa4de0d46c56308

The original live database is unavailable. Four retained source assets deterministically reconstruct all 81 chunks. Only 10 of the former 221 Canonical Requirements survive in the versioned Gold snapshot; the missing 211 are not manufactured.

## A. Snapshot Coverage
- Requirements: 10 / 221
- Materials: 4 / 4
- Chunks: 81 / 81
- Integrity: PASS
- Benchmark complete: false

## B. Human Gold Reviewed Coverage
- approved Retrieval Gold: 3
- approved Evidence Gold: 3
- approved Claim Gold: 6
- audit findings without reviewer identity: 6
- batch status: BATCH_1_EARLY_STOPPED
- stop reason: CORPUS_COVERAGE_INSUFFICIENT

## C. Pending Candidate Coverage
- Requirement candidates: 10
- Content Role candidates: 81
- pending Evidence Gold: 27
- pending Claim Gold: 54

## Requirement Candidate Distribution
- roles: {"context_goal":1,"composite_requirement":3,"atomic_requirement":6}
- response_required: 10
- evidence_required: 6
- composite: 3

## Evidence Need Distribution
{
  "compatibility": 1,
  "product_capability": 1,
  "quantitative_performance": 1,
  "security_capability": 2,
  "qualification": 2,
  "implementation": 2,
  "capability": 1,
  "service_capability": 1,
  "project_experience": 1,
  "unknown": 3
}

## Content Role Inventory
- roles: {"company_positioning":7,"technical_reference":23,"general_capability":19,"qualification":5,"award_record":12,"project_case":15}

## Coverage Matrix
- capability: requirements=1, materials=2, candidate_content=3, approved_evidence=1, approved_mapping=1, status=covered
- product_capability: requirements=1, materials=0, candidate_content=0, approved_evidence=0, approved_mapping=0, status=gap
- quantitative_performance: requirements=1, materials=0, candidate_content=0, approved_evidence=0, approved_mapping=0, status=gap
- compatibility: requirements=1, materials=0, candidate_content=0, approved_evidence=0, approved_mapping=0, status=gap
- security_capability: requirements=2, materials=3, candidate_content=28, approved_evidence=1, approved_mapping=1, status=partial
- qualification: requirements=2, materials=2, candidate_content=5, approved_evidence=1, approved_mapping=1, status=partial
- project_experience: requirements=1, materials=0, candidate_content=0, approved_evidence=0, approved_mapping=0, status=gap
- implementation: requirements=2, materials=1, candidate_content=15, approved_evidence=1, approved_mapping=1, status=partial
- service_capability: requirements=1, materials=0, candidate_content=0, approved_evidence=0, approved_mapping=0, status=gap
- unknown: requirements=3, materials=0, candidate_content=0, approved_evidence=0, approved_mapping=0, status=gap

## Corpus Gaps
- product_capability
- quantitative_performance
- compatibility
- project_experience
- service_capability
- unknown

## Failure Classification
- REQ-015: SOURCE_TOO_THIN — generic heading.
- REQ-016: ROLE_MISMATCH — marketing text cannot prove quantitative performance.
- REQ-030: ROLE_MISMATCH — data positioning cannot prove heterogeneous exchange.
- REQ-047: CORPUS_GAP + ROLE_MISMATCH — authoritative project title has no cloud sufficiency.
- RETRIEVAL_MISS: unknown; a reviewed evidence-capable inventory is unavailable.

## Source Authority vs Sufficiency
Authority and sufficiency are independent. Government and corporate primary sources are authoritative for what they state, but may have zero sufficiency for a different Requirement need.

## Recommended Corpus Additions
- Compatibility matrices and adaptation reports
- Performance test reports with conditions and measurements
- Cloud capability and completed cloud project records
- Acceptance and implementation records
- Personnel, delivery, and service records
- Legally usable contract evidence

## Production Routing Readiness
NOT READY. A complete 221-Requirement snapshot, broader evidence-capable content, completed Gold review, and reliable CORPUS_GAP versus RETRIEVAL_MISS labels are still required.
