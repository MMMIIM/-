CREATE TABLE IF NOT EXISTS evidence_source_spans (
  span_id text PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES company_materials(id) ON DELETE CASCADE,
  source_document_id uuid NOT NULL REFERENCES company_materials(id) ON DELETE CASCADE,
  anchor_chunk_id text NOT NULL REFERENCES material_chunks(chunk_id) ON DELETE RESTRICT,
  requested_strategy text NOT NULL,
  resolver_strategy text NOT NULL,
  fallback_reason text,
  start_offset integer NOT NULL,
  end_offset integer NOT NULL,
  source_text text NOT NULL,
  char_count integer GENERATED ALWAYS AS (length(source_text)) STORED,
  source_text_hash text NOT NULL,
  heading_path jsonb NOT NULL DEFAULT '[]'::jsonb,
  source_chunk_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  resolver_version text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT evidence_source_spans_strategy_check CHECK (requested_strategy IN ('auto','anchor_only','paragraph_reconstruction','heading_group','bounded_paragraph_window') AND resolver_strategy IN ('anchor_only','paragraph_reconstruction','heading_group','bounded_paragraph_window')),
  CONSTRAINT evidence_source_spans_boundary_check CHECK (start_offset >= 0 AND end_offset > start_offset AND length(source_text) <= 4000),
  CONSTRAINT evidence_source_spans_hash_check CHECK (source_text_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT evidence_source_spans_document_check CHECK (source_document_id = material_id),
  CONSTRAINT evidence_source_spans_version_check CHECK (resolver_version = 'evidence-source-span-v1')
);

ALTER TABLE evidence_source_spans
  ADD COLUMN IF NOT EXISTS char_count integer GENERATED ALWAYS AS (length(source_text)) STORED;

CREATE UNIQUE INDEX IF NOT EXISTS evidence_source_spans_identity_idx
  ON evidence_source_spans(project_id,material_id,anchor_chunk_id,resolver_version,resolver_strategy,start_offset,end_offset,source_text_hash);
CREATE INDEX IF NOT EXISTS evidence_source_spans_material_idx
  ON evidence_source_spans(project_id,material_id,created_at);
