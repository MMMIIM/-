# Evidence Corpus Expansion Plan v1

## Current Corpus Role Distribution

The frozen partial snapshot contains 4 real materials and 81 deterministic chunks. Candidate roles are: 7 company positioning, 19 general capability, 23 technical reference, 5 qualification, 12 award record, and 15 project case. All role labels remain pending routing signals.

## Current Gaps

The strongest gaps are quantitative performance, compatibility, cloud/service capability, acceptance verification, personnel, delivery/service records, contracts, and implementation records. Semantic Top-K results do not close these gaps.

## Target Role Distribution

The first acquisition wave targets 21 high-value real documents: 3 performance/parameter records, 3 compatibility records, 3 cloud/service records, 2 acceptance records beyond the performance acceptance target, 2 personnel records, 3 delivery/service records, 2 contracts, 2 implementation records, and 1 lifecycle-linked award record. Some documents deliberately cover more than one need without being counted as sufficient for every need.

## Acquisition Priority

- P0: compatibility evidence, measured performance, cloud capability/project proof, signed contract, implementation record, final acceptance, and lifecycle-linked award.
- P1: supporting certifications, service measurements, personnel records, delivery records, and secondary acceptance artifacts.

## Per-role Evidence Requirements

| Gap | Real document | Ideal source | Minimum original fields | Can prove | Cannot prove | Priority |
|---|---|---|---|---|---|---|
| quantitative_performance | Signed performance test report | Customer or independent lab | version, environment, scale, concurrency, metric, result, date, signer | measured result under stated conditions | universal/future SLA | P0 |
| compatibility | Compatibility matrix + adaptation report | Controlled product baseline and independent/customer test | product/version, architecture, OS/database versions, status, cases, result, date | listed/tested combinations | unlisted platforms | P0 |
| cloud/service | Capability certification + completed cloud case + service report | Authority, customer, controlled service archive | subject, platform, scope, status, period, issuer/customer confirmation | specified capability or delivered service | all clouds or unconditional SLA | P0 |
| acceptance_verification | Signed acceptance report and test results | Customer-signed archive | project, scope, criteria, method, result, date, signatures | accepted/tested named scope | omitted scope | P0 |
| personnel | Consent-controlled CV and certificate | HR archive and issuer verification | identity, employment, role, experience, certificate, validity, as-of date | named experience/qualification | project availability without assignment | P1 |
| delivery/service | Delivery and maintenance acceptance records, measured service report | Customer/controlled service archive | project/customer, deliverables/service, period, metric/result, acceptance | historical delivery/service | future unconditional commitment | P1 |
| contract | Redacted signed contract and SOW/PO | Legal/procurement archive | parties, project, scope, dates, signatures/reference, redaction provenance | contracted scope | completion/acceptance | P0 |
| implementation | Approved plan and completion record | Customer-approved project archive | scope, actions, responsibilities, environment, status, date, confirmation | approved/performed implementation | final acceptance unless stated | P0 |

## Project Lifecycle Coverage Plan

Acquire at least one real project with a stable project entity across four independent sources:

1. official `award_record`;
2. signed/redacted `contract_record`;
3. approved and completed `implementation_record`;
4. customer-signed `acceptance_record`.

Each stage proves only its own status. Award must never be promoted to contract, implementation, completion, or acceptance.

## Real vs Synthetic Policy

Real benchmark materials must retain original source, stable hash, lineage, authority, and human review. If confidential material cannot be obtained lawfully, the gap remains `CORPUS_GAP`. Synthetic fixtures, when needed for contract tests, must live under an explicitly named `synthetic-fixtures/` directory and are forbidden from Real Gold Benchmark counts.

## Corpus Admission Rules

- Verify source reference, file hash, subject, authority, and lawful usage before admission.
- Assign content roles and topics only as pending candidates.
- Keep source authority separate from Requirement-specific sufficiency.
- Do not generate Evidence Fact, Mapping, Claim permission, or Writer input from Manifest metadata.
- Reject or quarantine unverifiable, altered, duplicate, expired, or lineage-incomplete material.
- Preserve `unknown` when validity, subject, status, or scope cannot be verified.

## Routing Readiness Conditions

Production routing remains NOT READY until the full 221-Requirement snapshot is restored, P0 corpus gaps have real evidence-capable samples, role compatibility is human-reviewed across positive and negative cases, lifecycle boundaries are tested, and CORPUS_GAP can be reliably distinguished from RETRIEVAL_MISS without treating an LLM candidate as truth.
