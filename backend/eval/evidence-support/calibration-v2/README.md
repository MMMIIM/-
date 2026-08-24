# Evidence Support Calibration V2

This directory is an offline candidate pool and human-review packet for the
`EvidenceSupportAssessment` contract. It is intentionally separate from the
legacy `backend/eval/sufficiency/live-calibration-set.js` fixture.

## Dataset boundaries

- V1 is `LEGACY_SYNTHETIC_CALIBRATION_V1`, retained only for deterministic
  schema, contract and aggregation regression.
- V2 uses public source anchors from `backend/eval/evidence-gold/gold-candidates.json`.
  They are marked `CURATED_REAL_SOURCE`, not `REAL_RETRIEVAL_OUTPUT`.
- Holdout data remains read-only: 125 positive and 14 negative cases. Its Gold
  status, expected source and support relation are never used to author V2.
- All V2 judgments are `SYSTEM_DRAFT / UNREVIEWED`; no record is Human Gold.
- The current anchors retain valid SHA-256, material IDs, chunk IDs, offsets and
  source text. Formal `document_id` and `source_span_id` are still pending and
  therefore the pool is not ready for model calibration.

## Files

- `candidate-pool.js`: deterministic V2 candidate builder.
- `audit.js`: offline overlap, lineage and coverage audit; no network calls.
- `review-packet.md`: generated human review packet.

Run:

```text
npm run audit:evidence-support-v2 -w backend
```

No model, Provider, Dify, embedding or Retrieval call is made by this command.

