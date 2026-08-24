# Evidence Support Calibration V2

This directory is an offline candidate pool and human-review packet for the
`EvidenceSupportAssessment` contract. It is intentionally separate from the
legacy `backend/eval/sufficiency/live-calibration-set.js` fixture.

## Dataset boundaries

- V1 is `LEGACY_SYNTHETIC_CALIBRATION_V1`, retained only for deterministic
  schema, contract and aggregation regression.
- The original 10-case pool uses public source anchors from
  `backend/eval/evidence-gold/gold-candidates.json`. Those legacy anchors do
  not resolve to the current formal Corpus and remain excluded from review.
- The remediated pool uses current formal Corpus materials and chunks across
  GENERAL, GOVERNMENT_ENTERPRISE, HEALTHCARE and approved synthetic enterprise
  projects. Sources are marked `CURATED_REAL_SOURCE`, never
  `REAL_RETRIEVAL_OUTPUT`.
- Holdout data remains read-only: 125 positive and 14 negative cases. Its Gold
  status, expected source and support relation are never used to author V2.
- All V2 judgments are `SYSTEM_DRAFT / UNREVIEWED`; no record is Human Gold.
- The remediated sources are verified by exact chunk slices and SHA-256. The
  existing Source Span contract permits a deterministic transient identity from
  material + chunk + offsets + hash; these IDs are explicitly marked
  `DERIVED_TRANSIENT_FORMAL_CONTRACT` and are not written to production DB.
- V2 remains a human-review packet, not model calibration or Human Gold.

## Files

- `candidate-pool.js`: deterministic V2 candidate builder.
- `audit.js`: offline overlap, lineage and coverage audit; no network calls.
- `review-packet.md`: generated human review packet.
- `build-remediated-pool.js`: read-only formal Corpus lineage reconstruction and
  24–40 case expansion; it requires local `DATABASE_URL` and never writes DB.
- `candidate-pool-v2-remediated.json`: 37 qualified system-draft candidates.
- `audit-remediated.js` / `remediation-audit-v2.json`: deterministic remediation
  audit and aggregation consistency report.
- `review-packet-v2-remediated.md`: expanded human review packet.
- `build-human-review-batch-01.js`: deterministic selection of the first ten
  human-review cases; it does not alter the candidate pool or write Gold.
- `human-review-batch-01.md` / `human-review-batch-01.json`: business-readable
  Batch 1 packet and its empty review-decision structure.
- `human-review-decision-schema-v1.json`: schema for later human decisions;
  all decision fields are null until a reviewer responds.
- `repair-evidence-spans-v2.js`: read-only deterministic forensic and repair
  pass. It separates `SOURCE_LINEAGE_VERIFIED` from
  `EVIDENCE_SPAN_VERIFIED` and never mutates the database.
- `evidence-span-forensics-v2.json`: root-cause, 37-case and Batch 1 span
  metrics. The original conflict draft is marked `GOLD_DESIGN_INVALID` because
  the second source has no expiry fact.
- `candidate-pool-v2-evidence-span-repaired.json`: repaired transient spans;
  the original candidate pool and draft status remain preserved.
- `human-review-batch-01-v2.md` / `.json`: repaired packet. It remains blocked
  until every selected case has a verified evidence span.
- `semantic-reaudit-v2.js`: read-only semantic re-audit over the repaired spans;
  it recomputes the formal aggregation, rejects invalid conflict Gold, and
  distinguishes adverse numeric facts, subject/scope insufficiency and
  industry-reference capability boundaries without changing Gold.
- `semantic-reaudit-v2.json`: machine-readable 37-case re-audit report.
- `semantic-reaudit-v2-samples.md`: three directly readable representative
  cases required by the manual sample gate.
- `build-human-review-batch-01-final.js`: builds the approved ten-case human
  review packet from the re-audited 36 active cases; it excludes V2R-009 and
  keeps every reviewer decision field null.
- `human-review-batch-01-final.md` / `.json`: directly readable Batch 1 packet
  with `WHY_THIS_CASE_IS_IN_CALIBRATION`, full repaired Evidence text and
  explicit APPROVE/CHANGE/REJECT choices.
- `evidence-context-expansion.js`: production-bounded exact-span/context
  expansion. Exact citation and context window remain separate and every
  recovered dimension records its origin.
- `enterprise-evidence-source-router.js`: deterministic enterprise-proof
  routing. Government/industry material can remain reference context but is
  never promoted to enterprise proof candidates.
- `audit-context-recovery-v2.js` / `context-recovery-v2.json`: offline audit of
  missing-dimension recovery across all 36 active cases.
- `qualify-targeted-retrieval-gold.js`: read-only A–I qualification of the 12
  targeted Retrieval Gold cases; it uses independent `EVAL-RET-*` identities,
  never calls Retrieval/Embedding/LLM/Dify and never writes production DB state.
- `GPT_REVIEW_PACKET_GOLD_QUALIFICATION.md` / `.json`: complete 12-case
  qualification packet and executable/repairable split.

Run:

```text
npm run audit:evidence-support-v2 -w backend
npm run reconcile:evidence-support-v2-lineage -w backend
npm run audit:evidence-support-v2-remediation -w backend
npm run build:evidence-support-v2-remediation-review -w backend
npm run build:evidence-support-v2-human-batch-01 -w backend
npm run forensics:evidence-support-v2-spans -w backend
npm run build:evidence-support-v2-human-batch-01-v2 -w backend
npm run audit:evidence-support-v2-semantics -w backend
npm run audit:evidence-support-v2-context -w backend
npm run build:evidence-support-v2-human-batch-01-final -w backend
npm run qualify:evidence-bearing-gold -w backend
```

The reconciliation command performs read-only SQL and deterministic local
Source Span resolution. No model, Provider, Dify, embedding or Retrieval call
is made, and no production database mutation is performed. Batch 1 generation
is also offline-only; it preserves exact source excerpts and remains
`SYSTEM_DRAFT_UNREVIEWED`.

The semantic re-audit is offline-only. It uses the repaired formal source
spans and `aggregateEvidenceSufficiency()`; it never calls a model, Provider,
Embedding or Gateway, and it does not modify the candidate pool, Gold or
production state. `V2R-009-ISO-CONFLICT` is excluded when the second source
does not contain a same-dimension observed value.

The context audit is also offline-only. It reports which dimensions can be
recovered from the exact span, bounded same-chunk context, adjacent chunks in
the same document, or authoritative material metadata. Unresolved dimensions
remain unresolved; context never replaces the exact citation. The formal
retrieval service applies the same enterprise-proof routing policy before
reranking, so industry/reference sources cannot enter the proof lane.

The final Batch 1 packet is a Gold quality gate only. It is not a frozen
dataset and must not be treated as completed calibration until a human
reviewer explicitly records decisions.

The repaired packet is intentionally not reviewable while its forensic report
is `HUMAN_REVIEW_BLOCKED_BY_EVIDENCE_SPAN_QUALITY`.
