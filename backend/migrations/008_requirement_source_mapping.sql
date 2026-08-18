ALTER TABLE requirement_candidates
  ADD COLUMN IF NOT EXISTS source_hash text,
  ADD COLUMN IF NOT EXISTS source_chunk_id uuid REFERENCES tender_parse_chunks(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS mandatory_observed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS requires_confirmation boolean NOT NULL DEFAULT false;

ALTER TABLE requirements
  ADD COLUMN IF NOT EXISTS source_hash text,
  ADD COLUMN IF NOT EXISTS source_chunk_id uuid REFERENCES tender_parse_chunks(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS requires_confirmation boolean NOT NULL DEFAULT false;
