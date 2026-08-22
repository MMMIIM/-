CREATE TABLE IF NOT EXISTS agent_execution_audits (
  agent_run_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  current_route text,
  context_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  user_request text NOT NULL,
  intent text,
  selected_tools jsonb NOT NULL DEFAULT '[]'::jsonb,
  tool_results jsonb NOT NULL DEFAULT '[]'::jsonb,
  actions_proposed jsonb NOT NULL DEFAULT '[]'::jsonb,
  actions_executed jsonb NOT NULL DEFAULT '[]'::jsonb,
  human_required_actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  provider text,
  model text,
  latency_ms integer,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_agent_execution_audits_project_created
  ON agent_execution_audits(project_id, created_at DESC);
