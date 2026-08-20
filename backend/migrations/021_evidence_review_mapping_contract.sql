ALTER TABLE requirement_evidence_mappings
  ADD COLUMN IF NOT EXISTS support_level text,
  ADD COLUMN IF NOT EXISTS review_notes text,
  ADD COLUMN IF NOT EXISTS retrieval_run_id uuid,
  ADD COLUMN IF NOT EXISTS retrieval_chunk_id text;

UPDATE requirement_evidence_mappings
SET support_level='reference_only',
    review_notes=COALESCE(NULLIF(review_notes,''),'Legacy approved mapping migrated as reference_only because support level was not previously recorded.')
WHERE mapping_status='approved' AND support_level IS NULL;

ALTER TABLE requirement_evidence_mappings DROP CONSTRAINT IF EXISTS requirement_evidence_mappings_support_level_check;
ALTER TABLE requirement_evidence_mappings ADD CONSTRAINT requirement_evidence_mappings_support_level_check
  CHECK(support_level IS NULL OR support_level IN ('full_support','partial_support','reference_only'));

ALTER TABLE requirement_evidence_mappings DROP CONSTRAINT IF EXISTS requirement_evidence_mappings_approved_support_check;
ALTER TABLE requirement_evidence_mappings ADD CONSTRAINT requirement_evidence_mappings_approved_support_check
  CHECK(mapping_status<>'approved' OR support_level IS NOT NULL);

ALTER TABLE requirement_evidence_mappings DROP CONSTRAINT IF EXISTS requirement_evidence_mappings_retrieval_pair_check;
ALTER TABLE requirement_evidence_mappings ADD CONSTRAINT requirement_evidence_mappings_retrieval_pair_check
  CHECK((retrieval_run_id IS NULL)=(retrieval_chunk_id IS NULL));

ALTER TABLE requirement_evidence_mappings DROP CONSTRAINT IF EXISTS requirement_evidence_mappings_retrieval_result_fkey;
ALTER TABLE requirement_evidence_mappings ADD CONSTRAINT requirement_evidence_mappings_retrieval_result_fkey
  FOREIGN KEY(retrieval_run_id,retrieval_chunk_id)
  REFERENCES enterprise_retrieval_results(retrieval_run_id,chunk_id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS requirement_evidence_mapping_retrieval_idx
  ON requirement_evidence_mappings(retrieval_run_id,retrieval_chunk_id);
