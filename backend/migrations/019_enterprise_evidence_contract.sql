CREATE TABLE IF NOT EXISTS material_chunks (
  chunk_id text PRIMARY KEY,
  material_id uuid NOT NULL REFERENCES company_materials(id) ON DELETE CASCADE,
  chunk_index integer NOT NULL CHECK(chunk_index >= 0),
  source_text text NOT NULL,
  char_start integer NOT NULL CHECK(char_start >= 0),
  char_end integer NOT NULL CHECK(char_end > char_start),
  page_start integer,
  page_end integer,
  paragraph_start integer,
  paragraph_end integer,
  section text,
  chunk_hash text NOT NULL,
  chunker_version text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(material_id, chunker_version, chunk_index),
  CHECK(page_start IS NULL OR page_start > 0),
  CHECK(page_end IS NULL OR page_end >= page_start),
  CHECK(paragraph_start IS NULL OR paragraph_start > 0),
  CHECK(paragraph_end IS NULL OR paragraph_end >= paragraph_start)
);

ALTER TABLE company_materials DROP CONSTRAINT IF EXISTS company_materials_material_type_check;
ALTER TABLE company_materials ADD CONSTRAINT company_materials_material_type_check CHECK(material_type IN (
  'company_profile','qualification','case','project_case','product','product_documentation',
  'personnel','technical_solution','technical_whitepaper','delivery_capability','historical_bid','other'
));

ALTER TABLE evidences
  ADD COLUMN IF NOT EXISTS evidence_origin text NOT NULL DEFAULT 'enterprise',
  ADD COLUMN IF NOT EXISTS source_document_id uuid REFERENCES company_materials(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS source_chunk_id text REFERENCES material_chunks(chunk_id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS source_location jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS evidence_scope jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS capability_tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS validity_status text NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS validity_reviewed_by text,
  ADD COLUMN IF NOT EXISTS validity_reviewed_at timestamptz;

ALTER TABLE evidences DROP CONSTRAINT IF EXISTS evidences_origin_check;
ALTER TABLE evidences ADD CONSTRAINT evidences_origin_check CHECK(evidence_origin IN ('enterprise'));
ALTER TABLE evidences DROP CONSTRAINT IF EXISTS evidences_validity_status_check;
ALTER TABLE evidences ADD CONSTRAINT evidences_validity_status_check CHECK(validity_status IN ('active','expired','revoked','unknown'));

UPDATE evidences e SET source_document_id=m.id
FROM company_materials m
WHERE e.source_document_id IS NULL AND e.material_id=m.id::text;

CREATE TABLE IF NOT EXISTS requirement_evidence_mappings (
  mapping_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id uuid NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  evidence_id uuid NOT NULL REFERENCES evidences(id) ON DELETE CASCADE,
  mapping_source text NOT NULL,
  mapping_status text NOT NULL DEFAULT 'proposed',
  created_by text NOT NULL,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(requirement_id,evidence_id),
  CHECK(mapping_source IN ('manual','retrieval')),
  CHECK(mapping_status IN ('proposed','approved','rejected'))
);

CREATE INDEX IF NOT EXISTS material_chunks_material_idx ON material_chunks(material_id,chunk_index);
CREATE INDEX IF NOT EXISTS evidence_source_document_idx ON evidences(source_document_id,source_chunk_id);
CREATE INDEX IF NOT EXISTS requirement_evidence_mapping_req_idx ON requirement_evidence_mappings(requirement_id,mapping_status);
