ALTER TABLE requirement_candidates
  ADD COLUMN IF NOT EXISTS source_status text,
  ADD COLUMN IF NOT EXISTS confirmed_by text,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS confirmation_type text;

UPDATE requirement_candidates
SET source_status = CASE
  WHEN candidate_decision = 'exclude' THEN 'excluded'
  WHEN source_verified THEN 'verified'
  ELSE 'provisional'
END
WHERE source_status IS NULL;

ALTER TABLE requirement_candidates ALTER COLUMN source_status SET NOT NULL;
ALTER TABLE requirement_candidates ALTER COLUMN source_status SET DEFAULT 'provisional';
ALTER TABLE requirement_candidates DROP CONSTRAINT IF EXISTS requirement_candidates_source_status_check;
ALTER TABLE requirement_candidates ADD CONSTRAINT requirement_candidates_source_status_check
  CHECK (source_status IN ('verified', 'provisional', 'excluded'));
ALTER TABLE requirement_candidates DROP CONSTRAINT IF EXISTS requirement_candidates_confirmation_type_check;
ALTER TABLE requirement_candidates ADD CONSTRAINT requirement_candidates_confirmation_type_check
  CHECK (confirmation_type IS NULL OR confirmation_type IN ('verified', 'provisional_individual', 'provisional_bulk', 'excluded'));

ALTER TABLE requirement_baselines
  ADD COLUMN IF NOT EXISTS confirmed_by text,
  ADD COLUMN IF NOT EXISTS confirmation_type text;

ALTER TABLE requirement_baselines DROP CONSTRAINT IF EXISTS requirement_baselines_confirmation_type_check;
ALTER TABLE requirement_baselines ADD CONSTRAINT requirement_baselines_confirmation_type_check
  CHECK (confirmation_type IS NULL OR confirmation_type IN ('verified', 'mixed_provisional'));

ALTER TABLE requirements
  ADD COLUMN IF NOT EXISTS source_status text DEFAULT 'verified',
  ADD COLUMN IF NOT EXISTS confirmed_by text,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS confirmation_type text;

ALTER TABLE requirements ALTER COLUMN source_status TYPE text
  USING COALESCE(source_status, CASE WHEN source_verified THEN 'verified' ELSE 'provisional' END);

ALTER TABLE requirements ALTER COLUMN source_status SET NOT NULL;
ALTER TABLE requirements DROP CONSTRAINT IF EXISTS requirements_source_status_check;
ALTER TABLE requirements ADD CONSTRAINT requirements_source_status_check
  CHECK (source_status IN ('verified', 'provisional'));
ALTER TABLE requirements DROP CONSTRAINT IF EXISTS requirements_confirmation_type_check;
ALTER TABLE requirements ADD CONSTRAINT requirements_confirmation_type_check
  CHECK (confirmation_type IN ('verified', 'provisional_individual', 'provisional_bulk'));

CREATE INDEX IF NOT EXISTS candidates_job_source_status_idx
  ON requirement_candidates(parse_job_id, source_status, ordinal);
CREATE INDEX IF NOT EXISTS requirements_project_source_status_idx
  ON requirements(project_id, source_status, ordinal);

ALTER TABLE claims
  ADD COLUMN IF NOT EXISTS basis_requirement_source_statuses jsonb NOT NULL DEFAULT '{}'::jsonb;
