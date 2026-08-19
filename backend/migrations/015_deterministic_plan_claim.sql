ALTER TABLE requirements ADD COLUMN IF NOT EXISTS conditions jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE response_plans ADD COLUMN IF NOT EXISTS requirement_anchor text,
  ADD COLUMN IF NOT EXISTS edited_by text, ADD COLUMN IF NOT EXISTS edited_at timestamptz,
  ADD COLUMN IF NOT EXISTS edit_reason text;
UPDATE response_plans rp SET requirement_anchor=r.content FROM requirements r WHERE r.id=rp.requirement_id AND rp.requirement_anchor IS NULL;
ALTER TABLE response_plans ALTER COLUMN requirement_anchor SET NOT NULL;
ALTER TABLE response_plans ALTER COLUMN requirement_anchor SET DEFAULT '';
CREATE TABLE IF NOT EXISTS response_plan_edit_audits(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
 response_plan_id uuid NOT NULL REFERENCES response_plans(id) ON DELETE CASCADE, edited_by text NOT NULL,
 edited_at timestamptz NOT NULL DEFAULT now(), edit_reason text NOT NULL,
 previous_snapshot jsonb NOT NULL, current_snapshot jsonb NOT NULL);
CREATE INDEX IF NOT EXISTS response_plan_edit_audits_plan_idx ON response_plan_edit_audits(response_plan_id,edited_at DESC);
CREATE OR REPLACE VIEW evidence_catalog AS SELECT * FROM evidences;
