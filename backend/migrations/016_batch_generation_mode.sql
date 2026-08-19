ALTER TABLE document_generation_tasks
  ADD COLUMN IF NOT EXISTS generation_mode text NOT NULL DEFAULT 'semantic_gateway',
  ADD COLUMN IF NOT EXISTS generation_rule_version text NOT NULL DEFAULT '4.3-batch-routing-1';

DO $$ BEGIN
  ALTER TABLE document_generation_tasks ADD CONSTRAINT document_generation_tasks_generation_mode_check
    CHECK (generation_mode IN ('deterministic_template','semantic_gateway'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
