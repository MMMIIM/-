CREATE TABLE IF NOT EXISTS project_fact_propagation_bindings (
  propagation_id text PRIMARY KEY, project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  project_fact_id text NOT NULL REFERENCES project_facts(project_fact_id) ON DELETE RESTRICT, project_fact_version integer NOT NULL,
  target_type text NOT NULL CHECK(target_type IN ('requirement','claim','chapter','writer_task','future_document_anchor')),
  target_id text NOT NULL, binding_role text NOT NULL CHECK(binding_role IN ('required','optional','context_only')),
  binding_status text NOT NULL DEFAULT 'active' CHECK(binding_status IN ('active','invalidated','unresolved')),
  source_reason text NOT NULL CHECK(source_reason IN ('requirement_link','claim_link','project_fact_scope','chapter_plan','manual_binding','deterministic_rule')),
  source_ref jsonb, propagation_version integer NOT NULL DEFAULT 1, contract_version text NOT NULL CHECK(contract_version='project-fact-propagation-v1'),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_fact_id,project_fact_version,target_type,target_id,contract_version)
);
CREATE INDEX IF NOT EXISTS project_fact_propagation_project_idx ON project_fact_propagation_bindings(project_id,project_fact_id,binding_status);

CREATE TABLE IF NOT EXISTS project_fact_writer_contexts (
  context_hash text PRIMARY KEY, project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE, chapter_id text NOT NULL,
  project_fact_refs jsonb NOT NULL, requirement_version text NOT NULL, claim_gate_identity text NOT NULL, chapter_plan_version text NOT NULL,
  binding_contract_version text NOT NULL, propagation_contract_version text NOT NULL, contract_version text NOT NULL CHECK(contract_version='writer-project-fact-context-v1'),
  status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','invalidated')), invalidation_reason text,
  created_at timestamptz NOT NULL DEFAULT now(), invalidated_at timestamptz
);
CREATE INDEX IF NOT EXISTS project_fact_writer_context_project_idx ON project_fact_writer_contexts(project_id,chapter_id,status);

CREATE TABLE IF NOT EXISTS project_fact_propagation_plans (
  plan_id text PRIMARY KEY, plan_hash text NOT NULL, project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  previous_fact_id text REFERENCES project_facts(project_fact_id) ON DELETE RESTRICT, current_fact_id text NOT NULL REFERENCES project_facts(project_fact_id) ON DELETE RESTRICT,
  affected_requirements jsonb NOT NULL, affected_claims jsonb NOT NULL, affected_chapters jsonb NOT NULL, affected_writer_tasks jsonb NOT NULL,
  future_document_anchors jsonb NOT NULL, claim_revalidations jsonb NOT NULL, revalidation_required boolean NOT NULL, regeneration_required boolean NOT NULL,
  expected_target_count integer NOT NULL, resolved_target_count integer NOT NULL, unresolved_targets jsonb NOT NULL,
  coverage_status text NOT NULL CHECK(coverage_status IN ('complete','partial','unresolved','blocked')), plan_version integer NOT NULL,
  requirement_version text NOT NULL, claim_gate_identity text NOT NULL, chapter_plan_version text NOT NULL, binding_contract_version text NOT NULL,
  contract_version text NOT NULL CHECK(contract_version='project-fact-propagation-plan-v1'), status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','invalidated')),
  invalidation_reason text, created_at timestamptz NOT NULL DEFAULT now(), invalidated_at timestamptz
);
CREATE INDEX IF NOT EXISTS project_fact_propagation_plan_project_idx ON project_fact_propagation_plans(project_id,current_fact_id,status);
