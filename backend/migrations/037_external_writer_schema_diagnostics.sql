ALTER TABLE external_writer_call_audits ADD COLUMN IF NOT EXISTS top_level_keys jsonb;
ALTER TABLE external_writer_call_audits ADD COLUMN IF NOT EXISTS missing_required_fields jsonb;
ALTER TABLE external_writer_call_audits ADD COLUMN IF NOT EXISTS unexpected_fields jsonb;
ALTER TABLE external_writer_call_audits ADD COLUMN IF NOT EXISTS field_type_mismatches jsonb;
ALTER TABLE external_writer_call_audits ADD COLUMN IF NOT EXISTS blocks_count integer;
ALTER TABLE external_writer_call_audits ADD COLUMN IF NOT EXISTS block_missing_fields jsonb;
ALTER TABLE external_writer_call_audits ADD COLUMN IF NOT EXISTS schema_error_paths jsonb;
ALTER TABLE external_writer_call_audits ADD COLUMN IF NOT EXISTS schema_error_codes jsonb;
