CREATE TABLE IF NOT EXISTS evidence_facts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fact_id text NOT NULL UNIQUE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  evidence_id uuid NOT NULL REFERENCES evidences(id) ON DELETE CASCADE,
  fact_type text NOT NULL,
  subject_json jsonb NOT NULL,
  entities_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  fact_status text NOT NULL DEFAULT 'unknown',
  fact_scopes_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  quantities_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  validity_json jsonb NOT NULL DEFAULT '{"status":"unknown","valid_from":null,"valid_until":null}'::jsonb,
  domain_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_text text NOT NULL,
  source_location jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_hash text NOT NULL,
  review_status text NOT NULL DEFAULT 'draft',
  reviewed_by text,
  reviewed_at timestamptz,
  review_notes text,
  contract_version text NOT NULL DEFAULT '4.3-evidence-fact-1',
  version integer NOT NULL DEFAULT 1,
  supersedes_fact_id uuid REFERENCES evidence_facts(id) ON DELETE RESTRICT,
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK(fact_id ~ '^EFACT-[A-F0-9-]{36}$'),
  CHECK(length(trim(fact_type)) > 0),
  CHECK(jsonb_typeof(subject_json)='object'),
  CHECK(jsonb_typeof(entities_json)='array'),
  CHECK(jsonb_typeof(fact_scopes_json)='array'),
  CHECK(jsonb_typeof(quantities_json)='array'),
  CHECK(jsonb_typeof(validity_json)='object'),
  CHECK(jsonb_typeof(domain_metadata)='object'),
  CHECK(review_status IN ('draft','approved','rejected')),
  CHECK(version > 0),
  CHECK((review_status='draft' AND reviewed_by IS NULL AND reviewed_at IS NULL) OR
        (review_status IN ('approved','rejected') AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)),
  CHECK(supersedes_fact_id IS NULL OR supersedes_fact_id<>id)
);

CREATE UNIQUE INDEX IF NOT EXISTS evidence_facts_single_successor_idx
  ON evidence_facts(supersedes_fact_id) WHERE supersedes_fact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS evidence_facts_evidence_review_idx
  ON evidence_facts(evidence_id,review_status,created_at);
CREATE INDEX IF NOT EXISTS evidence_facts_project_review_idx
  ON evidence_facts(project_id,review_status,created_at);

CREATE OR REPLACE FUNCTION validate_evidence_fact_lineage() RETURNS trigger AS $$
DECLARE
  evidence_project uuid;
  predecessor evidence_facts%ROWTYPE;
BEGIN
  SELECT project_id INTO evidence_project FROM evidences WHERE id=NEW.evidence_id;
  IF evidence_project IS NULL OR evidence_project<>NEW.project_id THEN
    RAISE EXCEPTION 'Evidence Fact project/evidence lineage mismatch' USING ERRCODE='23514';
  END IF;
  IF NEW.supersedes_fact_id IS NOT NULL THEN
    SELECT * INTO predecessor FROM evidence_facts WHERE id=NEW.supersedes_fact_id;
    IF predecessor.id IS NULL OR predecessor.project_id<>NEW.project_id OR predecessor.evidence_id<>NEW.evidence_id OR predecessor.review_status<>'approved' OR NEW.version<>predecessor.version+1 THEN
      RAISE EXCEPTION 'Evidence Fact predecessor lineage/version mismatch' USING ERRCODE='23514';
    END IF;
  ELSIF NEW.version<>1 THEN
    RAISE EXCEPTION 'Initial Evidence Fact version must be 1' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION protect_evidence_fact_update() RETURNS trigger AS $$
BEGIN
  IF OLD.review_status<>'draft' THEN
    RAISE EXCEPTION 'Reviewed Evidence Fact is immutable' USING ERRCODE='23514';
  END IF;
  IF (to_jsonb(NEW)-ARRAY['review_status','reviewed_by','reviewed_at','review_notes','updated_at']) IS DISTINCT FROM
     (to_jsonb(OLD)-ARRAY['review_status','reviewed_by','reviewed_at','review_notes','updated_at']) THEN
    RAISE EXCEPTION 'Evidence Fact content is immutable; create a superseding version' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS evidence_facts_validate_lineage ON evidence_facts;
CREATE TRIGGER evidence_facts_validate_lineage BEFORE INSERT ON evidence_facts
FOR EACH ROW EXECUTE FUNCTION validate_evidence_fact_lineage();

DROP TRIGGER IF EXISTS evidence_facts_protect_update ON evidence_facts;
CREATE TRIGGER evidence_facts_protect_update BEFORE UPDATE ON evidence_facts
FOR EACH ROW EXECUTE FUNCTION protect_evidence_fact_update();
