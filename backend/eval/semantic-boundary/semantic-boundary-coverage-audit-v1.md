# Semantic Boundary & Evidence Need Coverage Audit v1

Status: INCOMPLETE_LIVE_INVENTORY

The frozen live baseline is 221 Requirements / 4 Materials / 81 Chunks. The current database no longer contains that project. The auditable repository snapshot contains 10 Requirements, 4 material identities, and 30 retrieved anchor chunks. Counts below are candidate/audit results for that snapshot only; they are not represented as a 221-item audit.

## Requirement distribution
- available: 10 / expected 221
- role candidates: {"context_goal":1,"composite_requirement":3,"atomic_requirement":6}
- response_required: 10
- evidence_required: 6
- composite: 3

## Evidence Need distribution
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

## Material / Content Role distribution
- material identities: 4
- anchor chunks: 30
- roles: {"general_capability":2,"company_positioning":8,"technical_reference":14,"qualification":3,"project_case":1,"award_record":2}

## Coverage matrix
- capability: requirements=1, materials=2, candidate_content=2, approved_evidence=1, approved_mapping=1, status=covered
- product_capability: requirements=1, materials=0, candidate_content=0, approved_evidence=0, approved_mapping=0, status=gap
- quantitative_performance: requirements=1, materials=0, candidate_content=0, approved_evidence=0, approved_mapping=0, status=gap
- compatibility: requirements=1, materials=0, candidate_content=0, approved_evidence=0, approved_mapping=0, status=gap
- security_capability: requirements=2, materials=3, candidate_content=17, approved_evidence=1, approved_mapping=1, status=partial
- qualification: requirements=2, materials=2, candidate_content=3, approved_evidence=1, approved_mapping=1, status=partial
- project_experience: requirements=1, materials=0, candidate_content=0, approved_evidence=0, approved_mapping=0, status=gap
- implementation: requirements=2, materials=1, candidate_content=1, approved_evidence=1, approved_mapping=1, status=partial
- service_capability: requirements=1, materials=0, candidate_content=0, approved_evidence=0, approved_mapping=0, status=gap
- unknown: requirements=3, materials=0, candidate_content=0, approved_evidence=0, approved_mapping=0, status=gap

## Corpus gaps
- product_capability
- quantitative_performance
- compatibility
- project_experience
- service_capability
- unknown

## Retrieval / role mismatch examples
- REQ-015: generic system-integration heading is SOURCE_TOO_THIN.
- REQ-016: general data-positioning text is ROLE_MISMATCH for quantitative performance.
- REQ-030: general data aggregation is ROLE_MISMATCH for heterogeneous exchange capability.
- REQ-047: authoritative government project title is ROLE_MISMATCH for cloud capability and confirms a CORPUS_GAP in the retained snapshot.
- RETRIEVAL_MISS is not reliably identifiable without a reviewed evidence-capable corpus inventory.

## Gold findings
- REQ-001: context_goal candidate; response remains required while direct evidence is not.
- REQ-015: compatibility evidence-seeking composite candidate.
- REQ-016: quantitative_performance candidate.
- REQ-027: complementary security, qualification, and implementation needs.
- REQ-030: data-exchange capability need; current company-positioning anchor is not eligible.
- REQ-047: evidence-seeking cloud/service capability; project-title authority is high for its own record, while cloud compatibility and sufficiency are none.

## Source authority versus sufficiency
Government and corporate primary sources retain their authority classification independently. A government award notice can have high authority and no cloud-capability sufficiency; a corporate page can authoritatively show a public statement and still be insufficient for quantitative performance.

## Recommended corpus additions
- Product compatibility matrices and adaptation test reports
- Performance test reports with conditions and measurements
- Cloud service capability and completed project records
- Acceptance reports and implementation records
- Personnel profiles and delivery/service records
- Contracts or redacted contractual proof where legally usable

## Production routing readiness
NOT READY. Restore/export the 221 Requirement and 81 Chunk live inventory, complete role/evidence-need human review, and distinguish CORPUS_GAP from RETRIEVAL_MISS before production routing.
