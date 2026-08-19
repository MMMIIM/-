CREATE TABLE IF NOT EXISTS company_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  original_name text NOT NULL,
  storage_key text NOT NULL,
  material_type text NOT NULL,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL CHECK(size_bytes >= 0),
  file_hash text NOT NULL,
  extraction_status text NOT NULL DEFAULT 'pending',
  extracted_text text,
  extraction_error_code text,
  extraction_error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, file_hash)
);

ALTER TABLE company_materials DROP CONSTRAINT IF EXISTS company_materials_material_type_check;
ALTER TABLE company_materials ADD CONSTRAINT company_materials_material_type_check
  CHECK(material_type IN ('company_profile','qualification','case','product','personnel','technical_solution','delivery_capability','other'));
ALTER TABLE company_materials DROP CONSTRAINT IF EXISTS company_materials_extraction_status_check;
ALTER TABLE company_materials ADD CONSTRAINT company_materials_extraction_status_check
  CHECK(extraction_status IN ('pending','succeeded','failed','ocr_required'));

ALTER TABLE evidences
  ADD COLUMN IF NOT EXISTS evidence_type text,
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS source_text text,
  ADD COLUMN IF NOT EXISTS source_paragraph integer,
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS approved_by text,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS applicable_requirement_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS usage_scope text,
  ADD COLUMN IF NOT EXISTS risk_notes text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE evidences ALTER COLUMN source_hash DROP NOT NULL;

UPDATE evidences SET evidence_type=COALESCE(evidence_type,source_type),title=COALESCE(title,content)
WHERE evidence_type IS NULL OR title IS NULL;

ALTER TABLE evidences DROP CONSTRAINT IF EXISTS evidences_approval_status_check;
ALTER TABLE evidences ADD CONSTRAINT evidences_approval_status_check
  CHECK(approval_status IN ('draft','approved','rejected'));
ALTER TABLE evidences DROP CONSTRAINT IF EXISTS evidences_source_paragraph_check;
ALTER TABLE evidences ADD CONSTRAINT evidences_source_paragraph_check
  CHECK(source_paragraph IS NULL OR source_paragraph > 0);

CREATE INDEX IF NOT EXISTS company_materials_project_idx ON company_materials(project_id,created_at DESC);
CREATE INDEX IF NOT EXISTS evidences_project_approval_idx ON evidences(project_id,approval_status,created_at DESC);
