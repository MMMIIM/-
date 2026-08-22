CREATE TABLE IF NOT EXISTS agent_action_previews (
  preview_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_run_id uuid,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  target_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  before_version_id uuid,
  before_version_hash text,
  preview_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  validation_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'preview_ready',
  created_at timestamptz NOT NULL DEFAULT now(),
  applied_at timestamptz,
  expires_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_agent_action_previews_project_created
  ON agent_action_previews(project_id, created_at DESC);

CREATE TABLE IF NOT EXISTS agent_action_audits (
  action_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_run_id uuid,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  idempotency_key text NOT NULL UNIQUE,
  tool text NOT NULL,
  risk_level text NOT NULL,
  planned boolean NOT NULL DEFAULT true,
  executed boolean NOT NULL DEFAULT false,
  target_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  before_version text,
  after_version text,
  result text NOT NULL,
  human_required boolean NOT NULL DEFAULT false,
  validation_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  latency_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_agent_action_audits_project_created
  ON agent_action_audits(project_id, created_at DESC);
