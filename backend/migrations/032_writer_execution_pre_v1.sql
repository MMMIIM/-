CREATE TABLE IF NOT EXISTS writer_execution_tasks (
  writer_task_id text PRIMARY KEY, project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE, chapter_id text NOT NULL,
  chapter_role text NOT NULL, chapter_instruction text NOT NULL, safe_context_id text NOT NULL REFERENCES writer_safe_contexts(authorization_snapshot_hash) ON DELETE RESTRICT,
  safe_context_hash text NOT NULL, context_items jsonb NOT NULL, assertable_claims jsonb NOT NULL, required_bindings jsonb NOT NULL,
  optional_bindings jsonb NOT NULL, pending_controls jsonb NOT NULL, forbidden_assertions jsonb NOT NULL,
  writer_contract_version text NOT NULL CHECK(writer_contract_version='writer-task-v1'), task_version integer NOT NULL, task_hash text NOT NULL,
  status text NOT NULL DEFAULT 'current' CHECK(status IN ('current','regenerate_required','invalidated')),
  created_at timestamptz NOT NULL DEFAULT now(), invalidated_at timestamptz, UNIQUE(project_id,chapter_id,task_version)
);
CREATE INDEX IF NOT EXISTS writer_execution_task_project_idx ON writer_execution_tasks(project_id,chapter_id,status);

CREATE TABLE IF NOT EXISTS writer_outputs (
  writer_output_id text PRIMARY KEY, writer_task_id text NOT NULL REFERENCES writer_execution_tasks(writer_task_id) ON DELETE RESTRICT,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE, chapter_id text NOT NULL, output_version integer NOT NULL,
  safe_context_hash text NOT NULL, writer_model text NOT NULL, prompt_version text NOT NULL, raw_output jsonb NOT NULL,
  validated_output jsonb, output_hash text NOT NULL, guard_result jsonb NOT NULL, propagation_verification jsonb NOT NULL,
  status text NOT NULL CHECK(status IN ('generated','validated','rejected','invalidated','finalized')),
  contract_version text NOT NULL CHECK(contract_version='writer-output-v1'), created_at timestamptz NOT NULL DEFAULT now(), invalidated_at timestamptz,
  UNIQUE(writer_task_id,output_version)
);
CREATE INDEX IF NOT EXISTS writer_output_project_idx ON writer_outputs(project_id,chapter_id,status,output_version);

ALTER TABLE fact_mention_ledger ADD COLUMN IF NOT EXISTS output_id text REFERENCES writer_outputs(writer_output_id) ON DELETE RESTRICT;
ALTER TABLE fact_mention_ledger ADD COLUMN IF NOT EXISTS block_id text;
ALTER TABLE fact_mention_ledger ADD COLUMN IF NOT EXISTS start_offset integer;
ALTER TABLE fact_mention_ledger ADD COLUMN IF NOT EXISTS end_offset integer;
ALTER TABLE fact_mention_ledger ADD COLUMN IF NOT EXISTS mention_text text;
ALTER TABLE fact_mention_ledger ADD COLUMN IF NOT EXISTS mention_text_hash text;
ALTER TABLE fact_mention_ledger ADD COLUMN IF NOT EXISTS authorization_ref text;
ALTER TABLE fact_mention_ledger DROP CONSTRAINT IF EXISTS fact_mention_materialized_shape;
ALTER TABLE fact_mention_ledger ADD CONSTRAINT fact_mention_materialized_shape CHECK(
  status<>'materialized' OR (output_id IS NOT NULL AND block_id IS NOT NULL AND start_offset>=0 AND end_offset>start_offset AND mention_text IS NOT NULL AND mention_text_hash ~ '^[0-9a-f]{64}$' AND authorization_ref IS NOT NULL)
);
