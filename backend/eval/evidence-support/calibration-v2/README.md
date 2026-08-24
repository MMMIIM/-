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

Run:

```text
npm run audit:evidence-support-v2 -w backend
npm run reconcile:evidence-support-v2-lineage -w backend
npm run audit:evidence-support-v2-remediation -w backend
npm run build:evidence-support-v2-remediation-review -w backend
```

The reconciliation command performs read-only SQL and deterministic local
Source Span resolution. No model, Provider, Dify, embedding or Retrieval call
is made, and no production database mutation is performed.
