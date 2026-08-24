-- P0 retrieval candidate hygiene metadata. Existing chunk text and Evidence
-- Span records remain immutable; this only records deterministic retrieval role.
ALTER TABLE enterprise_retrieval_results
  ADD COLUMN IF NOT EXISTS chunk_role text NOT NULL DEFAULT 'OTHER';

ALTER TABLE enterprise_retrieval_results
  ADD COLUMN IF NOT EXISTS candidate_eligibility text NOT NULL DEFAULT 'EVIDENCE_ELIGIBLE';

CREATE INDEX IF NOT EXISTS retrieval_results_run_chunk_role_idx
  ON enterprise_retrieval_results(retrieval_run_id, chunk_role, reranked_rank);
