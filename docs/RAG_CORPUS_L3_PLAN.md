# Corpus Readiness L3 — Bid-Usable Knowledge Base

## Purpose and boundary

Corpus L3 is the Stage20 knowledge/material quality target. It measures
whether authoritative, current, traceable material can answer representative
bid questions. It is not a document-count target and it does not authorize a
new retrieval architecture, Provider, Dify Workflow, private-data upload or
automatic Evidence/Fact/Claim approval.

The frozen shared pipeline remains:

```text
Material → Parse → Chunk → Index → Retrieval → Evidence Candidate
```

The current `semantic_gateway` operational path is independent of the offline
corpus evaluator. External Provider calls for Corpus L3 remain zero.

## Business scopes

The product module remains `企业资料库` with one underlying capability and
three visibility scopes:

- `通用资料`: procurement, bidding, electronic bidding, cybersecurity, data
  security, personal-information protection and information-system governance;
- `行业资料 / 政企平台`: digital government, smart city, data sharing,
  governance, integration and operations;
- `行业资料 / 医疗行业`: hospital information platforms, EMR, interoperability,
  health-data security and primary-care informationization;
- `企业资料`: selected enterprise-owned profile, qualifications, cases,
  products, people, delivery, after-sales and authorization materials.

These scopes are filters over the shared capability, not separate vector
stores or retrieval services. Cross-enterprise material leakage remains a
hard failure.

## L3 thresholds

| Metric | Target |
| --- | ---: |
| Business Question Coverage | ≥ 95% |
| Recall@5 | ≥ 95% |
| MRR | ≥ 0.85 |
| Source Traceability | 100% |
| Scope Violation Rate | 0% |
| Obsolete / Superseded Source Preferred | 0% |
| No-answer Accuracy | ≥ 95% |
| ACTIVE Material Review Coverage | 100% |
| Usage Status Coverage | 100% |
| Formal Safety Boundary Violations | 0 |

The current Stage17 retrieval baseline remains frozen at Recall@5 90%, MRR
1.000, traceability 100%, scope violations 0% and no-answer accuracy 100%.
The real official-excerpt wave is now indexed through the same path:
40 ACTIVE_EXCERPT materials and approximately 120 deterministic-indexed chunks. Its isolated
offline evaluation is Recall@5 100%, MRR 1.000, traceability 100%, scope
violations 0% and no-answer accuracy 100%. The overall L3 gate remains open
because the active-count lower bounds are only the inventory floor, while the broader
business-question inventory and frozen retrieval baseline are not yet complete; this is
not evidence to redesign retrieval.

## Governance lifecycle

Every material must retain the complete lifecycle:

```text
DISCOVERED → SCREENED → APPROVED_FOR_PROCESSING → PROCESSED → EVAL_PASSED → ACTIVE
```

`ACTIVE` requires review status and usage/license status. Public availability
does not imply redistribution rights. Supported usage statuses are
`ACTIVE_FULLTEXT`, `ACTIVE_EXCERPT`, `METADATA_ONLY`, `REFERENCE_ONLY` and
`REJECTED`. Materials with unknown provenance, invalid rights, obsolete content
without historical purpose, or corrupt/incomplete source remain out of normal
retrieval.

Quality score is deterministic and reviewable:

```text
Authority 30 + Bid Relevance 25 + Currency/Effectivity 15
+ Usage/License Safety 15 + Parse/Structure Quality 15 = 100
```

Scores ≥80 are ACTIVE candidates, 70–79 require manual review, and <70 are
reference-only/rejected. Hard failures override the score.

## Current inventory

The machine-readable inventory is
`backend/eval/corpus/l3-corpus-manifest-v1.json`.

- General: 10 ACTIVE_EXCERPT official materials; the lower target bound is met.
- Government industry: 15 ACTIVE_EXCERPT official materials; the lower target
  bound is met.
- Healthcare industry: 15 ACTIVE_EXCERPT official materials; the lower target
  bound is met.
- Synthetic enterprise: 17 ACTIVE materials for the fictional
  `杭州景云数科有限公司`, retained as eval-only content in the manifest and also
  imported through `CompanyMaterialService` into the real path by
  `npm run prepare:l3-enterprise -w backend` (51 chunks, `SYNTHETIC_TEST_MATERIAL=true`).

The formal Stage20 synthetic retrieval fixture also imports the representative
SME manifest through `CompanyMaterialService`; the existing local fixture currently
contains 21 persisted materials and 329 chunks, while the 17-material L3 baseline
remains the controlled evaluation set.

The real public wave is defined in
`backend/eval/corpus/real-public-authoritative/catalog.js` and persisted by
`npm run ingest:corpus-l3 -w backend`. All 40 records are short excerpts with
official URLs, document numbers where available, effectivity metadata and
`ACTIVE_EXCERPT` usage status. No full-text redistribution right is claimed.
The previous four public-source enterprise candidates (corporate pages and one
public procurement notice) remain `METADATA_ONLY`/pending and are not counted
as government-industry authority.

The synthetic set intentionally retains six negative/uncertain cases:
expired qualification, conflicting company fact, unsupported marketing SLA,
third-party dependency, uncertain project date and relevant-but-insufficient
case. These are retrieval/review/Claim Gate/Copilot test inputs, not formal
proof.

## Golden questions and gaps

`backend/eval/corpus/l3-gold-questions-v2.json` is the domain-first taxonomy:
27 general, 40 government, 40 healthcare and 32 enterprise questions. It
contains exact lookups, paraphrases, cross-document questions, currentness and
no-answer cases. An important question without a qualified ACTIVE source is
recorded as `CORPUS_GAP-<query_id>`; project-specific or private-evidence gaps
are explicitly marked `documented_non_critical` rather than hidden.

Current V2 result: business-question coverage 96.8%, gold no-answer accuracy
100%, zero critical gaps and four documented non-critical boundary gaps. The
frozen Stage17 retrieval baseline remains separately reported at Recall@5 90%.

Run the offline report with:

```text
npm run eval:corpus-l3 -w backend
```

The command emits machine-readable JSON and a short summary. It never calls
the semantic gateway or any external model.

The real-wave-only report can be inspected with:

```text
node eval/corpus/real-l3-eval.js
```

It evaluates only the reviewed public excerpts and does not create Facts,
Mappings, Claims or Writer input. The V2 aggregate evaluator also includes
the synthetic enterprise manifest and reports both actual scope counts and the
frozen retrieval baseline.

## Expansion stop rule

Add material only when a real representative question is a qualified gap or
when an Eval result shows a source-quality deficiency. Freeze L3 when all
thresholds pass and new material has low marginal retrieval benefit. Until
then, the current status is `IN_PROGRESS`; Stage20 remains partial solely for
the separate real-provider E2E boundary.
