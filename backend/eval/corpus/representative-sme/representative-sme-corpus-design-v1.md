# Representative SME Corpus Design v1

All corpus documents are labelled `REPRESENTATIVE_SYNTHETIC` and `NOT_REAL_CUSTOMER_DATA`. 澄明数科（示范）有限公司 is fictional and represents a 100–300 person software/system-integration SME; it is not a composite real company.

## Source layering

- `enterprise_real_public`: four retained public-source materials, preserving real subjects and provenance.
- `enterprise_representative_sme`: twenty documents generated deterministically from facts frozen at 2026-08-21T08:00:00Z.
- `industry_public`: contract only; excluded from Enterprise Corpus Coverage.
- `synthetic_fixture`: physically isolated and excluded from both benchmarks and readiness.

## Fact-first design and limitations

The profile and 21 facts precede corpus freeze by one hour. Requirement Eval is not an input. Product, project, qualification, personnel, performance, compatibility, service and delivery documents derive only from frozen facts. Preserved gaps include incomplete lifecycle records, unknown CS2 validity, no full domestic database matrix, one controlled performance result, and no quantified SLA authority.

## Project lifecycle coverage

| Project | Award | Contract | Implementation | Acceptance |
|---|---:|---:|---:|---:|
| CM-P-A | yes | yes | yes | yes |
| CM-P-B | yes | yes | yes | no |
| CM-P-C | yes | no | case only | no |
| CM-P-D | no | no | fragment | no |

## Quantitative and compatibility boundaries

The sole performance fact is 50 concurrent users, 1,000,000 baseline records, average 1.4 seconds and P95 1.9 seconds in the stated environment. It may support a conditional ≤2-second proposition under matching conditions, not ≤1 second. Compatibility mixes `tested`, `partially_tested`, `not_verified`, and `unknown`.

## Qualifications, personnel, service and delivery

ISO 9001 and ISO/IEC 27001 have fictional active validity records; CS2 validity is unknown. Three key staff have unequal certificates and experience completeness. Service is normally business-hours; no 7×24, five-minute response or 99.99% SLA is asserted. Delivery artifacts remain contract-dependent.

## Admission, acquisition and readiness

Every material is `pending`. Authority is separate from sufficiency. Metadata cannot create Evidence Facts or Claim permission. Four real public materials are retained; all 21 new real-source targets remain `CORPUS_GAP` because no further source passed provenance and admission review. The representative corpus does not make Production Semantic Routing ready.
