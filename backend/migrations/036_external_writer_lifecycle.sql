ALTER TABLE external_writer_call_audits DROP CONSTRAINT IF EXISTS external_writer_call_audits_status_check;
ALTER TABLE external_writer_call_audits ADD CONSTRAINT external_writer_call_audits_status_check
  CHECK(status IN ('started','succeeded','created','dispatched','response_received','completed','failed'));
ALTER TABLE external_writer_call_audits ADD COLUMN IF NOT EXISTS dispatched_at timestamptz;
ALTER TABLE external_writer_call_audits ADD COLUMN IF NOT EXISTS response_received_at timestamptz;
