CREATE TABLE IF NOT EXISTS evidences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), evidence_id text NOT NULL UNIQUE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE, material_id text,
  source_type text NOT NULL, source_roles jsonb NOT NULL DEFAULT '[]', module text NOT NULL,
  content text NOT NULL, source_page integer, source_hash text NOT NULL,
  evidence_level text NOT NULL, commitment_level text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS response_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  requirement_id uuid NOT NULL REFERENCES requirements(id) ON DELETE RESTRICT,
  response_status text NOT NULL, response_summary text NOT NULL, implementation_actions jsonb NOT NULL DEFAULT '[]',
  optional_design jsonb, deliverables jsonb NOT NULL DEFAULT '[]', acceptance_methods jsonb NOT NULL DEFAULT '[]',
  conditions jsonb NOT NULL DEFAULT '[]', supporting_evidence_ids jsonb NOT NULL DEFAULT '[]', capability_gap text,
  target_sections jsonb NOT NULL DEFAULT '[]', created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(project_id, requirement_id)
);
CREATE TABLE IF NOT EXISTS claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), claim_id text NOT NULL UNIQUE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE, requirement_id uuid REFERENCES requirements(id) ON DELETE RESTRICT,
  claim_type text NOT NULL, text text NOT NULL, basis_requirement_ids jsonb NOT NULL DEFAULT '[]',
  basis_evidence_ids jsonb NOT NULL DEFAULT '[]', requested_commitment text, target_sections jsonb NOT NULL DEFAULT '[]', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS claim_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), claim_id uuid NOT NULL UNIQUE REFERENCES claims(id) ON DELETE CASCADE,
  decision text NOT NULL CHECK(decision IN ('approved','rejected')), reason_code text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS requirement_coverages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  requirement_id uuid NOT NULL REFERENCES requirements(id) ON DELETE RESTRICT, covered boolean NOT NULL,
  approved_claim_ids jsonb NOT NULL DEFAULT '[]', created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(project_id, requirement_id)
);
CREATE TABLE IF NOT EXISTS production_beta_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  status text NOT NULL CHECK(status IN ('created','planning','gating','validating','succeeded','failed')),
  error_code text, error_message text, audit_json jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
