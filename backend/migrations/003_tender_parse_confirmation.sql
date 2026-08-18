CREATE TABLE IF NOT EXISTS tender_parse_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tender_file_id uuid NOT NULL REFERENCES tender_files(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'succeeded', 'failed')),
  summary_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  warnings_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  gateway_audit_json jsonb,
  extracted_text_sha256 text,
  extracted_character_count integer CHECK (extracted_character_count IS NULL OR extracted_character_count >= 0),
  runtime_ms integer CHECK (runtime_ms IS NULL OR runtime_ms >= 0),
  error_code text,
  error_message text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS requirement_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parse_job_id uuid NOT NULL REFERENCES tender_parse_jobs(id) ON DELETE CASCADE,
  req_id text NOT NULL,
  content text NOT NULL,
  source_excerpt text NOT NULL,
  source_page integer CHECK (source_page IS NULL OR source_page > 0),
  source_paragraph integer CHECK (source_paragraph IS NULL OR source_paragraph > 0),
  ordinal integer NOT NULL CHECK (ordinal > 0),
  status text NOT NULL DEFAULT 'candidate' CHECK (status IN ('candidate', 'confirmed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (parse_job_id, req_id),
  UNIQUE (parse_job_id, ordinal)
);

CREATE TABLE IF NOT EXISTS requirement_baselines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  parse_job_id uuid NOT NULL UNIQUE REFERENCES tender_parse_jobs(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'building' CHECK (status IN ('building', 'confirmed')),
  confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  baseline_id uuid NOT NULL REFERENCES requirement_baselines(id) ON DELETE RESTRICT,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  req_id text NOT NULL,
  content text NOT NULL,
  source_excerpt text NOT NULL,
  source_page integer CHECK (source_page IS NULL OR source_page > 0),
  source_paragraph integer CHECK (source_paragraph IS NULL OR source_paragraph > 0),
  target_sections jsonb NOT NULL,
  ordinal integer NOT NULL CHECK (ordinal > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (baseline_id, req_id),
  UNIQUE (baseline_id, ordinal)
);

CREATE INDEX IF NOT EXISTS parse_jobs_project_idx
  ON tender_parse_jobs(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS parse_jobs_file_idx
  ON tender_parse_jobs(tender_file_id, created_at DESC);
CREATE INDEX IF NOT EXISTS candidates_job_idx
  ON requirement_candidates(parse_job_id, ordinal);
CREATE INDEX IF NOT EXISTS requirements_project_idx
  ON requirements(project_id, ordinal);

CREATE OR REPLACE FUNCTION prevent_confirmed_requirement_mutation()
RETURNS trigger AS $$
DECLARE
  baseline_status text;
BEGIN
  IF TG_OP = 'DELETE' AND pg_trigger_depth() > 1 THEN
    RETURN OLD;
  END IF;
  SELECT status INTO baseline_status
  FROM requirement_baselines
  WHERE id = COALESCE(NEW.baseline_id, OLD.baseline_id);
  IF baseline_status = 'confirmed' THEN
    RAISE EXCEPTION 'confirmed Requirement baseline is immutable'
      USING ERRCODE = '55000';
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS requirements_immutable ON requirements;
CREATE TRIGGER requirements_immutable
BEFORE INSERT OR UPDATE OR DELETE ON requirements
FOR EACH ROW EXECUTE FUNCTION prevent_confirmed_requirement_mutation();

CREATE OR REPLACE FUNCTION prevent_confirmed_baseline_mutation()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' AND pg_trigger_depth() > 1 THEN
    RETURN OLD;
  END IF;
  IF OLD.status = 'confirmed' THEN
    RAISE EXCEPTION 'confirmed Requirement baseline is immutable'
      USING ERRCODE = '55000';
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS requirement_baseline_immutable ON requirement_baselines;
CREATE TRIGGER requirement_baseline_immutable
BEFORE UPDATE OR DELETE ON requirement_baselines
FOR EACH ROW EXECUTE FUNCTION prevent_confirmed_baseline_mutation();
