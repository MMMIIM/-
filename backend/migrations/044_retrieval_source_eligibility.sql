-- P0 evidence source eligibility / anti-laundering audit.
-- This is additive and does not change historical retrieval contracts.
ALTER TABLE enterprise_retrieval_results
  ADD COLUMN IF NOT EXISTS evidence_source_eligible boolean NOT NULL DEFAULT false;

ALTER TABLE enterprise_retrieval_results
  ADD COLUMN IF NOT EXISTS evidence_source_class text NOT NULL DEFAULT 'UNKNOWN';

ALTER TABLE enterprise_retrieval_results
  ADD COLUMN IF NOT EXISTS evidence_source_reason text;

ALTER TABLE enterprise_retrieval_results
  ADD COLUMN IF NOT EXISTS low_specificity_claim boolean NOT NULL DEFAULT false;

ALTER TABLE enterprise_retrieval_results
  ADD COLUMN IF NOT EXISTS evidence_source_version text NOT NULL DEFAULT 'retrieval-source-eligibility-v1';

CREATE INDEX IF NOT EXISTS retrieval_results_run_source_eligibility_idx
  ON enterprise_retrieval_results(retrieval_run_id, evidence_source_eligible, reranked_rank);
