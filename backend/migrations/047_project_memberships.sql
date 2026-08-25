CREATE TABLE IF NOT EXISTS project_memberships (
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  actor_id text NOT NULL,
  role text NOT NULL CHECK (role IN ('OWNER', 'EDITOR', 'VIEWER')),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'REVOKED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, actor_id)
);

CREATE INDEX IF NOT EXISTS project_memberships_actor_idx
  ON project_memberships(actor_id, status, project_id);
