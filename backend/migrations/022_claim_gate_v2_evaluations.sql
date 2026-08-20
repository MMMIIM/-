CREATE TABLE IF NOT EXISTS claim_gate_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  requirement_id uuid NOT NULL REFERENCES requirements(id) ON DELETE RESTRICT,
  decision text NOT NULL,
  reason_codes jsonb NOT NULL DEFAULT '[]'::jsonb,
  dimensions jsonb NOT NULL,
  allowed_scope jsonb NOT NULL DEFAULT '[]'::jsonb,
  required_conditions jsonb NOT NULL DEFAULT '[]'::jsonb,
  evidence_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  mapping_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  rule_version text NOT NULL,
  deterministic_checks jsonb NOT NULL DEFAULT '[]'::jsonb,
  semantic_assessment jsonb,
  semantic_assessment_used boolean NOT NULL DEFAULT false,
  human_review_required boolean NOT NULL DEFAULT false,
  writer_eligible boolean NOT NULL DEFAULT false,
  legacy_decision_projection text,
  evaluated_at timestamptz NOT NULL DEFAULT now(),
  evaluated_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE claim_gate_evaluations DROP CONSTRAINT IF EXISTS claim_gate_evaluations_decision_check;
ALTER TABLE claim_gate_evaluations ADD CONSTRAINT claim_gate_evaluations_decision_check
  CHECK(decision IN ('allow','restrict','reject','needs_review'));
ALTER TABLE claim_gate_evaluations DROP CONSTRAINT IF EXISTS claim_gate_evaluations_json_shape_check;
ALTER TABLE claim_gate_evaluations ADD CONSTRAINT claim_gate_evaluations_json_shape_check CHECK(
  jsonb_typeof(reason_codes)='array' AND jsonb_typeof(dimensions)='object' AND
  jsonb_typeof(allowed_scope)='array' AND jsonb_typeof(required_conditions)='array' AND
  jsonb_typeof(evidence_ids)='array' AND jsonb_typeof(mapping_ids)='array' AND
  jsonb_typeof(deterministic_checks)='array' AND
  (semantic_assessment IS NULL OR jsonb_typeof(semantic_assessment)='object')
);
ALTER TABLE claim_gate_evaluations DROP CONSTRAINT IF EXISTS claim_gate_evaluations_dimension_keys_check;
ALTER TABLE claim_gate_evaluations ADD CONSTRAINT claim_gate_evaluations_dimension_keys_check CHECK(
  dimensions ?& ARRAY['subject_match','scope_match','status_match','quantitative_match','entity_match','validity_match','support_sufficiency','source_authority'] AND
  (dimensions - ARRAY['subject_match','scope_match','status_match','quantitative_match','entity_match','validity_match','support_sufficiency','source_authority'])='{}'::jsonb
);
ALTER TABLE claim_gate_evaluations DROP CONSTRAINT IF EXISTS claim_gate_evaluations_dimension_values_check;
ALTER TABLE claim_gate_evaluations ADD CONSTRAINT claim_gate_evaluations_dimension_values_check CHECK(
  dimensions->>'subject_match' IN ('match','mismatch','unknown') AND
  dimensions->>'scope_match' IN ('match','partial','mismatch','unknown') AND
  dimensions->>'status_match' IN ('match','mismatch','unknown') AND
  dimensions->>'quantitative_match' IN ('match','mismatch','not_applicable','unknown') AND
  dimensions->>'entity_match' IN ('match','mismatch','unknown') AND
  dimensions->>'validity_match' IN ('match','mismatch','unknown') AND
  dimensions->>'support_sufficiency' IN ('sufficient','partial','insufficient','unknown') AND
  dimensions->>'source_authority' IN ('usable','reference_only','unusable','unknown')
);
ALTER TABLE claim_gate_evaluations DROP CONSTRAINT IF EXISTS claim_gate_evaluations_reason_codes_check;
ALTER TABLE claim_gate_evaluations ADD CONSTRAINT claim_gate_evaluations_reason_codes_check CHECK(
  NOT jsonb_path_exists(reason_codes, '$[*] ? (@ != "EVIDENCE_NOT_APPROVED" && @ != "MAPPING_NOT_APPROVED" && @ != "SOURCE_NOT_USABLE" && @ != "SOURCE_LINEAGE_REQUIRED" && @ != "REFERENCE_ONLY" && @ != "EVIDENCE_SCOPE_EXCEEDED" && @ != "QUANTITATIVE_UNSUPPORTED" && @ != "ENTITY_MISMATCH" && @ != "STATUS_OVERCLAIM" && @ != "EVIDENCE_EXPIRED" && @ != "SUPPORT_INSUFFICIENT" && @ != "HUMAN_REVIEW_REQUIRED")')
);
ALTER TABLE claim_gate_evaluations DROP CONSTRAINT IF EXISTS claim_gate_evaluations_projection_check;
ALTER TABLE claim_gate_evaluations ADD CONSTRAINT claim_gate_evaluations_projection_check CHECK(
  (decision='allow' AND writer_eligible=true AND legacy_decision_projection='approved') OR
  (decision='reject' AND writer_eligible=false AND legacy_decision_projection='rejected') OR
  (decision IN ('restrict','needs_review') AND writer_eligible=false AND legacy_decision_projection IS NULL)
);
ALTER TABLE claim_gate_evaluations DROP CONSTRAINT IF EXISTS claim_gate_evaluations_review_check;
ALTER TABLE claim_gate_evaluations ADD CONSTRAINT claim_gate_evaluations_review_check
  CHECK(decision<>'needs_review' OR human_review_required=true);
ALTER TABLE claim_gate_evaluations DROP CONSTRAINT IF EXISTS claim_gate_evaluations_semantic_check;
ALTER TABLE claim_gate_evaluations ADD CONSTRAINT claim_gate_evaluations_semantic_check
  CHECK(semantic_assessment_used=false OR semantic_assessment IS NOT NULL);
ALTER TABLE claim_gate_evaluations DROP CONSTRAINT IF EXISTS claim_gate_evaluations_audit_identity_check;
ALTER TABLE claim_gate_evaluations ADD CONSTRAINT claim_gate_evaluations_audit_identity_check
  CHECK(btrim(rule_version)<>'' AND btrim(evaluated_by)<>'');

CREATE INDEX IF NOT EXISTS claim_gate_evaluations_claim_latest_idx
  ON claim_gate_evaluations(claim_id,evaluated_at DESC,created_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS claim_gate_evaluations_project_latest_idx
  ON claim_gate_evaluations(project_id,evaluated_at DESC,created_at DESC,id DESC);
