ALTER TABLE generations
  ALTER COLUMN response_payload_json DROP NOT NULL;

ALTER TABLE generations
  ADD COLUMN IF NOT EXISTS raw_dify_response_json jsonb,
  ADD COLUMN IF NOT EXISTS raw_response_text text,
  ADD COLUMN IF NOT EXISTS error_code text,
  ADD COLUMN IF NOT EXISTS error_message text;

UPDATE generations
SET error_code = 'GENERATION_FAILED',
    error_message = COALESCE(error_message, '历史失败记录')
WHERE status = 'failed'
  AND error_code IS NULL;

ALTER TABLE generations
  DROP CONSTRAINT IF EXISTS generations_failure_audit_check;

ALTER TABLE generations
  ADD CONSTRAINT generations_failure_audit_check CHECK (
    status <> 'failed'
    OR error_code IS NOT NULL
  );
