CREATE TABLE IF NOT EXISTS writer_safe_contexts (
  authorization_snapshot_hash text PRIMARY KEY, project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  chapter_id text NOT NULL, writer_task_id text, context_items jsonb NOT NULL, assertable_claims jsonb NOT NULL,
  blocked_items jsonb NOT NULL, pending_items jsonb NOT NULL, project_fact_context_hash text NOT NULL,
  propagation_binding_version text NOT NULL, chapter_plan_version text NOT NULL, claim_gate_identity text NOT NULL,
  authorization_contract_version text NOT NULL CHECK(authorization_contract_version='writer-input-authorization-v1'),
  contract_version text NOT NULL CHECK(contract_version='writer-safe-context-v1'), status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','invalidated')),
  invalidation_reason text, created_at timestamptz NOT NULL DEFAULT now(), invalidated_at timestamptz
);
CREATE INDEX IF NOT EXISTS writer_safe_context_project_idx ON writer_safe_contexts(project_id,chapter_id,status);

CREATE TABLE IF NOT EXISTS fact_mention_ledger (
  mention_id text PRIMARY KEY, project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE, chapter_id text NOT NULL,
  writer_task_id text, project_fact_id text REFERENCES project_facts(project_fact_id) ON DELETE RESTRICT, project_fact_version integer,
  claim_id text, gate_result_id text, mention_role text NOT NULL CHECK(mention_role IN ('context_reference','claim_expression','constraint_expression','pending_reference')),
  source_context_hash text NOT NULL REFERENCES writer_safe_contexts(authorization_snapshot_hash) ON DELETE RESTRICT,
  document_anchor jsonb, status text NOT NULL DEFAULT 'expected' CHECK(status IN ('expected','materialized','invalidated')),
  contract_version text NOT NULL CHECK(contract_version='fact-mention-ledger-v1'), created_at timestamptz NOT NULL DEFAULT now(), invalidated_at timestamptz,
  CONSTRAINT fact_mention_claim_lineage CHECK(mention_role<>'claim_expression' OR (claim_id IS NOT NULL AND gate_result_id IS NOT NULL)),
  CONSTRAINT fact_mention_no_fake_offset CHECK(document_anchor IS NULL OR NOT(document_anchor ? 'start_offset' OR document_anchor ? 'end_offset'))
);
CREATE INDEX IF NOT EXISTS fact_mention_project_idx ON fact_mention_ledger(project_id,project_fact_id,claim_id,status);
