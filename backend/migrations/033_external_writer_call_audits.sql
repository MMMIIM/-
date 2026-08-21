CREATE TABLE IF NOT EXISTS external_writer_call_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), writer_task_id text NOT NULL, project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  provider text NOT NULL, model text NOT NULL, endpoint_host text NOT NULL, sanitized_request_hash text NOT NULL,
  provider_request_id text, status text NOT NULL CHECK(status IN ('started','succeeded','failed')), http_status integer,
  input_tokens integer, output_tokens integer, latency_ms integer, error_code text, error_message text,
  external_request_count integer NOT NULL DEFAULT 1 CHECK(external_request_count=1), created_at timestamptz NOT NULL DEFAULT now(), finished_at timestamptz
);
CREATE INDEX IF NOT EXISTS external_writer_call_audit_task_idx ON external_writer_call_audits(writer_task_id,created_at);
