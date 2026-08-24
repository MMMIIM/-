-- P0 substantive candidate hygiene. This records deterministic content-shape
-- classification; it does not perform Requirement-relative Evidence judgment.
ALTER TABLE enterprise_retrieval_results
  ADD COLUMN IF NOT EXISTS substantive_candidate boolean NOT NULL DEFAULT true;

ALTER TABLE enterprise_retrieval_results
  ADD COLUMN IF NOT EXISTS substantive_class text NOT NULL DEFAULT 'SUBSTANTIVE_CANDIDATE';

ALTER TABLE enterprise_retrieval_results
  ADD COLUMN IF NOT EXISTS substantive_reason text;

CREATE INDEX IF NOT EXISTS retrieval_results_run_substantive_idx
  ON enterprise_retrieval_results(retrieval_run_id, substantive_candidate, reranked_rank);
