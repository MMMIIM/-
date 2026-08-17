CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  deadline timestamptz,
  status text NOT NULL DEFAULT 'draft',
  current_version_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tender_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  original_name text NOT NULL,
  storage_key text NOT NULL UNIQUE,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL CHECK (size_bytes >= 0),
  status text NOT NULL DEFAULT 'succeeded',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS generation_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('queued', 'running', 'succeeded', 'failed')),
  request_inputs jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_code text,
  error_message text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  job_id uuid NOT NULL UNIQUE REFERENCES generation_jobs(id) ON DELETE CASCADE,
  response_payload_json jsonb NOT NULL,
  workflow_version text NOT NULL,
  runtime_ms integer NOT NULL CHECK (runtime_ms >= 0),
  status text NOT NULL DEFAULT 'succeeded',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  generation_id uuid NOT NULL UNIQUE REFERENCES generations(id) ON DELETE RESTRICT,
  version_number integer NOT NULL,
  title text NOT NULL,
  content_markdown text NOT NULL,
  sections_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  warnings_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  risk_status text NOT NULL CHECK (risk_status IN ('pass', 'warning', 'critical')),
  status text NOT NULL DEFAULT 'pending_confirmation' CHECK (status IN ('pending_confirmation', 'confirmed')),
  confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, version_number)
);

ALTER TABLE projects
  DROP CONSTRAINT IF EXISTS projects_current_version_id_fkey;
ALTER TABLE projects
  ADD CONSTRAINT projects_current_version_id_fkey
  FOREIGN KEY (current_version_id) REFERENCES document_versions(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS review_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  document_version_id uuid NOT NULL REFERENCES document_versions(id) ON DELETE CASCADE,
  decision text NOT NULL CHECK (decision IN ('confirmed', 'rejected')),
  confirmation_text text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tender_files_project_idx ON tender_files(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS jobs_project_idx ON generation_jobs(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS versions_project_idx ON document_versions(project_id, version_number DESC);
CREATE INDEX IF NOT EXISTS reviews_version_idx ON review_decisions(document_version_id, created_at DESC);
