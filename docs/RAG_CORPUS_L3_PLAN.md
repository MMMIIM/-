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

The current `semantic_gateway` operational blocker is independent of this
offline corpus work. External Provider calls for L3 are always zero.

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
That is a corpus-readiness gap, not evidence to redesign retrieval.

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

- General: 0 ACTIVE; five P0 acquisition gaps remain.
- Government industry: 0 ACTIVE and no admitted candidates yet; official
  government/policy sources still require acquisition and usage review.
- Healthcare industry: 0 ACTIVE; five P0 acquisition gaps remain.
- Synthetic enterprise: 17 ACTIVE eval-only materials for the fictional
  `杭州景云数科有限公司`, under
  `backend/eval/corpus/l3-synthetic-enterprise/`.

Four public-source enterprise candidates (corporate pages and one public
procurement notice) are screened but remain `METADATA_ONLY`/pending; they are
not counted as government-industry authority.

The synthetic set intentionally retains six negative/uncertain cases:
expired qualification, conflicting company fact, unsupported marketing SLA,
third-party dependency, uncertain project date and relevant-but-insufficient
case. These are retrieval/review/Claim Gate/Copilot test inputs, not formal
proof.

## Golden questions and gaps

`backend/eval/corpus/l3-gold-questions-v1.json` contains the first curated
question taxonomy across general, government, healthcare and enterprise
scopes. An important question without a qualified ACTIVE source is recorded
as `CORPUS_GAP-<query_id>`; it is not hidden by changing prompts or lowering
retrieval thresholds.

Run the offline report with:

```text
npm run eval:corpus-l3 -w backend
```

The command emits machine-readable JSON and a short summary. It never calls
the semantic gateway or any external model.

## Expansion stop rule

Add material only when a real representative question is a qualified gap or
when an Eval result shows a source-quality deficiency. Freeze L3 when all
thresholds pass and new material has low marginal retrieval benefit. Until
then, the current status is `IN_PROGRESS`; Stage20 remains partial solely for
the separate real-provider E2E boundary.
