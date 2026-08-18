ALTER TABLE tender_parse_jobs
  ADD COLUMN IF NOT EXISTS phase text NOT NULL DEFAULT 'queued',
  ADD COLUMN IF NOT EXISTS total_chunks integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completed_chunks integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS failed_chunk_number integer;

UPDATE tender_parse_jobs
SET phase = CASE
  WHEN status = 'succeeded' THEN 'succeeded'
  WHEN status = 'failed' THEN 'failed'
  WHEN status = 'running' THEN 'extracting'
  ELSE 'queued'
END
WHERE phase = 'queued';

ALTER TABLE tender_parse_jobs
  DROP CONSTRAINT IF EXISTS tender_parse_jobs_phase_check;
ALTER TABLE tender_parse_jobs
  ADD CONSTRAINT tender_parse_jobs_phase_check CHECK (
    phase IN ('queued', 'text_extraction', 'chunking', 'extracting', 'aggregating', 'succeeded', 'failed')
  );
ALTER TABLE tender_parse_jobs
  DROP CONSTRAINT IF EXISTS tender_parse_jobs_chunk_progress_check;
ALTER TABLE tender_parse_jobs
  ADD CONSTRAINT tender_parse_jobs_chunk_progress_check CHECK (
    total_chunks >= 0
    AND completed_chunks >= 0
    AND completed_chunks <= total_chunks
    AND (failed_chunk_number IS NULL OR failed_chunk_number > 0)
  );

CREATE TABLE IF NOT EXISTS tender_parse_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parse_job_id uuid NOT NULL REFERENCES tender_parse_jobs(id) ON DELETE CASCADE,
  chunk_number integer NOT NULL CHECK (chunk_number > 0),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'succeeded', 'failed')),
  character_count integer NOT NULL CHECK (character_count > 0),
  estimated_token_count integer NOT NULL CHECK (estimated_token_count > 0),
  source_start_offset integer NOT NULL CHECK (source_start_offset >= 0),
  source_end_offset integer NOT NULL CHECK (source_end_offset > source_start_offset),
  source_start_page integer CHECK (source_start_page IS NULL OR source_start_page > 0),
  source_end_page integer CHECK (source_end_page IS NULL OR source_end_page > 0),
  source_start_paragraph integer CHECK (source_start_paragraph IS NULL OR source_start_paragraph > 0),
  source_end_paragraph integer CHECK (source_end_paragraph IS NULL OR source_end_paragraph > 0),
  starts_at_title_boundary boolean NOT NULL DEFAULT false,
  content_sha256 text NOT NULL,
  candidate_count integer NOT NULL DEFAULT 0 CHECK (candidate_count >= 0),
  runtime_ms integer CHECK (runtime_ms IS NULL OR runtime_ms >= 0),
  error_code text,
  error_message text,
  gateway_audit_json jsonb,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (parse_job_id, chunk_number)
);

ALTER TABLE requirement_candidates
  ADD COLUMN IF NOT EXISTS sources_json jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS parse_chunks_job_idx
  ON tender_parse_chunks(parse_job_id, chunk_number);
