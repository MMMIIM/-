ALTER TABLE requirement_candidates
  DROP CONSTRAINT IF EXISTS requirement_candidates_source_resolution_status_check;

ALTER TABLE requirement_candidates
  ADD CONSTRAINT requirement_candidates_source_resolution_status_check
  CHECK (source_resolution_status IN ('verified', 'ambiguous', 'suggested', 'unresolved'));
