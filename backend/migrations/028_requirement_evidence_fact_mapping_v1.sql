CREATE TABLE IF NOT EXISTS requirement_evidence_fact_mappings (
  mapping_id text PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  requirement_id uuid NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  evidence_fact_id text NOT NULL REFERENCES evidence_source_facts(fact_id) ON DELETE RESTRICT,
  source_type text NOT NULL,
  source jsonb NOT NULL,
  semantic_relationship text NOT NULL,
  support_level text NOT NULL,
  dimensions jsonb NOT NULL,
  reason_codes jsonb NOT NULL DEFAULT '[]'::jsonb,
  review_status text NOT NULL DEFAULT 'proposed',
  reviewer_type text NOT NULL,
  evaluator_version text NOT NULL,
  contract_version text NOT NULL,
  requirement_hash text NOT NULL,
  requirement_contract_version text NOT NULL,
  fact_payload_hash text NOT NULL,
  fact_contract_version text NOT NULL,
  reviewed_by text,
  reviewed_at timestamptz,
  human_review_version integer NOT NULL DEFAULT 0,
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT requirement_evidence_fact_mapping_source CHECK(source_type IN ('manual','retrieval','system_proposed')),
  CONSTRAINT requirement_evidence_fact_mapping_relationship CHECK(semantic_relationship IN ('direct','partial','related','conflict','unrelated','unknown')),
  CONSTRAINT requirement_evidence_fact_mapping_support CHECK(support_level IN ('full_support','partial_support','conflict','insufficient','reference_only','unknown')),
  CONSTRAINT requirement_evidence_fact_mapping_review CHECK(review_status IN ('proposed','approved','rejected','invalidated')),
  CONSTRAINT requirement_evidence_fact_mapping_reviewer CHECK(reviewer_type IN ('machine','human')),
  CONSTRAINT requirement_evidence_fact_mapping_contract CHECK(contract_version='requirement-evidence-mapping-v1'),
  CONSTRAINT requirement_evidence_fact_mapping_hashes CHECK(requirement_hash ~ '^[0-9a-f]{64}$' AND fact_payload_hash ~ '^[0-9a-f]{64}$')
);
ALTER TABLE requirement_evidence_fact_mappings ADD COLUMN IF NOT EXISTS requirement_contract_version text NOT NULL DEFAULT 'unknown';
ALTER TABLE requirement_evidence_fact_mappings ADD COLUMN IF NOT EXISTS fact_contract_version text NOT NULL DEFAULT 'evidence-fact-v1';
DROP INDEX IF EXISTS requirement_evidence_fact_mapping_identity_idx;
CREATE UNIQUE INDEX IF NOT EXISTS requirement_evidence_fact_mapping_identity_idx ON requirement_evidence_fact_mappings(project_id,requirement_id,evidence_fact_id,requirement_hash,requirement_contract_version,fact_payload_hash,fact_contract_version,contract_version,evaluator_version);
CREATE INDEX IF NOT EXISTS requirement_evidence_fact_mapping_review_idx ON requirement_evidence_fact_mappings(project_id,review_status,created_at);
