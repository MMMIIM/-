ALTER TABLE requirement_candidates
  ADD COLUMN IF NOT EXISTS classification_updated_by text;
