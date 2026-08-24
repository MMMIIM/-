ALTER TABLE review_decisions
  ADD COLUMN IF NOT EXISTS actor_id text;

CREATE INDEX IF NOT EXISTS review_decisions_actor_idx
  ON review_decisions(actor_id, created_at DESC);
