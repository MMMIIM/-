CREATE TABLE IF NOT EXISTS tender_document_paragraphs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parse_job_id uuid NOT NULL REFERENCES tender_parse_jobs(id) ON DELETE CASCADE,
  tender_file_id uuid NOT NULL REFERENCES tender_files(id) ON DELETE CASCADE,
  page_number integer,
  paragraph_number integer NOT NULL,
  text text NOT NULL,
  normalized_text text NOT NULL,
  start_offset integer NOT NULL,
  end_offset integer NOT NULL,
  text_hash text NOT NULL,
  extractor_version text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (parse_job_id, paragraph_number)
);

CREATE INDEX IF NOT EXISTS tender_document_paragraphs_job_idx
  ON tender_document_paragraphs(parse_job_id, paragraph_number);

ALTER TABLE requirement_candidates
  ADD COLUMN IF NOT EXISTS source_page_start integer,
  ADD COLUMN IF NOT EXISTS source_page_end integer,
  ADD COLUMN IF NOT EXISTS source_paragraph_start integer,
  ADD COLUMN IF NOT EXISTS source_paragraph_end integer,
  ADD COLUMN IF NOT EXISTS source_paragraphs_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS source_match_type text,
  ADD COLUMN IF NOT EXISTS source_match_score numeric,
  ADD COLUMN IF NOT EXISTS source_resolution_status text NOT NULL DEFAULT 'unresolved',
  ADD COLUMN IF NOT EXISTS source_resolution_method text,
  ADD COLUMN IF NOT EXISTS source_resolved_at timestamptz,
  ADD COLUMN IF NOT EXISTS source_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS candidate_decision text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS decision_reason text,
  ADD COLUMN IF NOT EXISTS decided_at timestamptz;

ALTER TABLE requirements
  ADD COLUMN IF NOT EXISTS source_page_start integer,
  ADD COLUMN IF NOT EXISTS source_page_end integer,
  ADD COLUMN IF NOT EXISTS source_paragraph_start integer,
  ADD COLUMN IF NOT EXISTS source_paragraph_end integer,
  ADD COLUMN IF NOT EXISTS source_paragraphs_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS source_match_type text,
  ADD COLUMN IF NOT EXISTS source_match_score numeric,
  ADD COLUMN IF NOT EXISTS source_resolution_method text,
  ADD COLUMN IF NOT EXISTS source_verified boolean NOT NULL DEFAULT false;

ALTER TABLE requirement_candidates DROP CONSTRAINT IF EXISTS requirement_candidates_source_resolution_status_check;
ALTER TABLE requirement_candidates ADD CONSTRAINT requirement_candidates_source_resolution_status_check
  CHECK (source_resolution_status IN ('verified', 'suggested', 'unresolved'));
ALTER TABLE requirement_candidates DROP CONSTRAINT IF EXISTS requirement_candidates_candidate_decision_check;
ALTER TABLE requirement_candidates ADD CONSTRAINT requirement_candidates_candidate_decision_check
  CHECK (candidate_decision IN ('pending', 'include', 'exclude'));

CREATE TABLE IF NOT EXISTS requirement_source_reconciliations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parse_job_id uuid NOT NULL REFERENCES tender_parse_jobs(id) ON DELETE CASCADE,
  tender_file_id uuid NOT NULL REFERENCES tender_files(id) ON DELETE CASCADE,
  extractor_version text NOT NULL,
  file_hash text NOT NULL,
  extracted_text_hash text NOT NULL,
  status text NOT NULL,
  statistics_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  extracted_at timestamptz NOT NULL,
  reconciled_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(parse_job_id, extractor_version, file_hash, extracted_text_hash)
);

CREATE TABLE IF NOT EXISTS requirement_source_decision_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parse_job_id uuid NOT NULL REFERENCES tender_parse_jobs(id) ON DELETE CASCADE,
  candidate_id uuid NOT NULL REFERENCES requirement_candidates(id) ON DELETE CASCADE,
  action text NOT NULL,
  previous_state_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  new_state_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS requirement_source_decisions_candidate_idx
  ON requirement_source_decision_audits(candidate_id, created_at);
