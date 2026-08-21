ALTER TABLE external_writer_call_audits ADD COLUMN IF NOT EXISTS authorization_id text;
CREATE UNIQUE INDEX IF NOT EXISTS external_writer_call_authorization_unique ON external_writer_call_audits(authorization_id) WHERE authorization_id IS NOT NULL;
