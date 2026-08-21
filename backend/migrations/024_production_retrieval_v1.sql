ALTER TABLE enterprise_retrieval_runs ADD COLUMN IF NOT EXISTS retrieval_contract_version text;
ALTER TABLE enterprise_retrieval_runs ADD COLUMN IF NOT EXISTS candidate_k integer;
ALTER TABLE enterprise_retrieval_runs ADD COLUMN IF NOT EXISTS review_k integer;
ALTER TABLE enterprise_retrieval_runs ADD COLUMN IF NOT EXISTS rerank_version text;
ALTER TABLE enterprise_retrieval_runs ADD COLUMN IF NOT EXISTS semantic_metadata jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE enterprise_retrieval_runs ADD COLUMN IF NOT EXISTS fallback_mode text;

ALTER TABLE enterprise_retrieval_results ADD COLUMN IF NOT EXISTS raw_vector_rank integer;
ALTER TABLE enterprise_retrieval_results ADD COLUMN IF NOT EXISTS raw_similarity double precision;
ALTER TABLE enterprise_retrieval_results ADD COLUMN IF NOT EXISTS reranked_rank integer;
ALTER TABLE enterprise_retrieval_results ADD COLUMN IF NOT EXISTS is_final boolean NOT NULL DEFAULT true;
ALTER TABLE enterprise_retrieval_results ADD COLUMN IF NOT EXISTS content_role text NOT NULL DEFAULT 'unknown';
ALTER TABLE enterprise_retrieval_results ADD COLUMN IF NOT EXISTS role_compatibility text NOT NULL DEFAULT 'unknown';
ALTER TABLE enterprise_retrieval_results ADD COLUMN IF NOT EXISTS matched_evidence_needs jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE enterprise_retrieval_results ADD COLUMN IF NOT EXISTS rerank_reasons jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE enterprise_retrieval_results ADD COLUMN IF NOT EXISTS retrieval_contract_version text;
ALTER TABLE enterprise_retrieval_results ADD COLUMN IF NOT EXISTS rerank_version text;

UPDATE enterprise_retrieval_results SET raw_vector_rank=rank WHERE raw_vector_rank IS NULL;
UPDATE enterprise_retrieval_results SET raw_similarity=similarity_score WHERE raw_similarity IS NULL;
UPDATE enterprise_retrieval_results SET reranked_rank=rank WHERE reranked_rank IS NULL;

CREATE INDEX IF NOT EXISTS retrieval_results_run_raw_rank_idx ON enterprise_retrieval_results(retrieval_run_id,raw_vector_rank);
CREATE INDEX IF NOT EXISTS retrieval_results_run_final_rank_idx ON enterprise_retrieval_results(retrieval_run_id,is_final,reranked_rank);
