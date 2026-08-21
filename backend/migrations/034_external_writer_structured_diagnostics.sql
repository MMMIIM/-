ALTER TABLE external_writer_call_audits ADD COLUMN IF NOT EXISTS finish_reason text;
ALTER TABLE external_writer_call_audits ADD COLUMN IF NOT EXISTS response_char_count integer;
ALTER TABLE external_writer_call_audits ADD COLUMN IF NOT EXISTS response_content_hash text;
ALTER TABLE external_writer_call_audits ADD COLUMN IF NOT EXISTS response_format_mode text;
ALTER TABLE external_writer_call_audits ADD COLUMN IF NOT EXISTS json_parse_success boolean;
ALTER TABLE external_writer_call_audits ADD COLUMN IF NOT EXISTS schema_validation_success boolean;
ALTER TABLE external_writer_call_audits ADD COLUMN IF NOT EXISTS parse_failure_class text;
ALTER TABLE external_writer_call_audits ADD COLUMN IF NOT EXISTS parse_error_offset integer;
