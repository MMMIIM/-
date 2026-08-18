ALTER TABLE tender_parse_jobs
  DROP CONSTRAINT IF EXISTS tender_parse_jobs_phase_check;
ALTER TABLE tender_parse_jobs
  ADD CONSTRAINT tender_parse_jobs_phase_check CHECK (
    phase IN ('queued', 'text_extraction', 'section_classification', 'chunking',
      'extracting', 'aggregating', 'succeeded', 'failed')
  );

ALTER TABLE tender_parse_chunks
  DROP CONSTRAINT IF EXISTS tender_parse_chunks_status_check;
ALTER TABLE tender_parse_chunks
  ADD CONSTRAINT tender_parse_chunks_status_check CHECK (
    status IN ('queued', 'running', 'succeeded', 'succeeded_empty', 'failed')
  );

CREATE TABLE IF NOT EXISTS tender_document_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parse_job_id uuid NOT NULL REFERENCES tender_parse_jobs(id) ON DELETE CASCADE,
  section_key text NOT NULL,
  title text NOT NULL,
  chapter_number integer,
  archive_role text NOT NULL,
  content_text text NOT NULL,
  content_sha256 text NOT NULL,
  character_count integer NOT NULL CHECK (character_count > 0),
  source_start_page integer,
  source_end_page integer,
  source_start_paragraph integer,
  source_end_paragraph integer,
  source_start_offset integer NOT NULL,
  source_end_offset integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (parse_job_id, section_key)
);

CREATE TABLE IF NOT EXISTS tender_mandatory_scope_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parse_job_id uuid NOT NULL REFERENCES tender_parse_jobs(id) ON DELETE CASCADE,
  mandatory_scope_source_text text NOT NULL,
  mandatory_scope_section text NOT NULL,
  exception_clause_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  source_page integer,
  source_paragraph integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE requirement_candidates
  ADD COLUMN IF NOT EXISTS source_section text,
  ADD COLUMN IF NOT EXISTS source_clause_id text,
  ADD COLUMN IF NOT EXISTS mandatory_scope_source_text text,
  ADD COLUMN IF NOT EXISTS mandatory_scope_section text,
  ADD COLUMN IF NOT EXISTS exception_clause_ids jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE requirement_candidates
  DROP CONSTRAINT IF EXISTS requirement_candidates_mandatory_consistent;
ALTER TABLE requirement_candidates
  ADD CONSTRAINT requirement_candidates_mandatory_consistent CHECK (
    (is_mandatory AND (
      (mandatory_marker IS NOT NULL AND position(mandatory_marker in source_text) > 0)
      OR (mandatory_marker IS NULL AND mandatory_scope_source_text IS NOT NULL
        AND mandatory_scope_section IS NOT NULL)
    ))
    OR (NOT is_mandatory AND mandatory_marker IS NULL)
  );

ALTER TABLE requirements
  ADD COLUMN IF NOT EXISTS source_section text,
  ADD COLUMN IF NOT EXISTS source_clause_id text,
  ADD COLUMN IF NOT EXISTS mandatory_scope_source_text text,
  ADD COLUMN IF NOT EXISTS mandatory_scope_section text,
  ADD COLUMN IF NOT EXISTS exception_clause_ids jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE requirements
  DROP CONSTRAINT IF EXISTS requirements_mandatory_consistent;
ALTER TABLE requirements
  ADD CONSTRAINT requirements_mandatory_consistent CHECK (
    (is_mandatory AND (
      (mandatory_marker IS NOT NULL AND position(mandatory_marker in source_text) > 0)
      OR (mandatory_marker IS NULL AND mandatory_scope_source_text IS NOT NULL
        AND mandatory_scope_section IS NOT NULL)
    ))
    OR (NOT is_mandatory AND mandatory_marker IS NULL)
  );

CREATE INDEX IF NOT EXISTS tender_sections_job_idx
  ON tender_document_sections(parse_job_id, chapter_number);
CREATE INDEX IF NOT EXISTS mandatory_scope_rules_job_idx
  ON tender_mandatory_scope_rules(parse_job_id);
