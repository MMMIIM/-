ALTER TABLE requirement_candidates
  ADD COLUMN IF NOT EXISTS source_text text,
  ADD COLUMN IF NOT EXISTS is_mandatory boolean,
  ADD COLUMN IF NOT EXISTS mandatory_marker text;

UPDATE requirement_candidates
SET source_text = source_excerpt
WHERE source_text IS NULL OR btrim(source_text) = '';

UPDATE requirement_candidates
SET is_mandatory = position('★' in source_text) > 0,
    mandatory_marker = CASE WHEN position('★' in source_text) > 0 THEN '★' ELSE NULL END;

ALTER TABLE requirement_candidates
  ALTER COLUMN source_text SET NOT NULL,
  ALTER COLUMN is_mandatory SET NOT NULL,
  ALTER COLUMN is_mandatory SET DEFAULT false;

ALTER TABLE requirement_candidates
  DROP CONSTRAINT IF EXISTS requirement_candidates_mandatory_consistent;
ALTER TABLE requirement_candidates
  ADD CONSTRAINT requirement_candidates_mandatory_consistent CHECK (
    (is_mandatory AND mandatory_marker IS NOT NULL AND position(mandatory_marker in source_text) > 0)
    OR (NOT is_mandatory AND mandatory_marker IS NULL)
  );

ALTER TABLE requirements
  ADD COLUMN IF NOT EXISTS source_text text,
  ADD COLUMN IF NOT EXISTS is_mandatory boolean,
  ADD COLUMN IF NOT EXISTS mandatory_marker text;

ALTER TABLE requirements DISABLE TRIGGER requirements_immutable;

UPDATE requirements
SET source_text = source_excerpt
WHERE source_text IS NULL OR btrim(source_text) = '';

UPDATE requirements
SET is_mandatory = position('★' in source_text) > 0,
    mandatory_marker = CASE WHEN position('★' in source_text) > 0 THEN '★' ELSE NULL END;

ALTER TABLE requirements ENABLE TRIGGER requirements_immutable;

ALTER TABLE requirements
  ALTER COLUMN source_text SET NOT NULL,
  ALTER COLUMN is_mandatory SET NOT NULL,
  ALTER COLUMN is_mandatory SET DEFAULT false;

ALTER TABLE requirements
  DROP CONSTRAINT IF EXISTS requirements_mandatory_consistent;
ALTER TABLE requirements
  ADD CONSTRAINT requirements_mandatory_consistent CHECK (
    (is_mandatory AND mandatory_marker IS NOT NULL AND position(mandatory_marker in source_text) > 0)
    OR (NOT is_mandatory AND mandatory_marker IS NULL)
  );
