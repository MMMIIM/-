CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS material_chunk_embeddings (
  embedding_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chunk_id text NOT NULL REFERENCES material_chunks(chunk_id) ON DELETE CASCADE,
  chunk_hash text NOT NULL,
  embedding_model text NOT NULL,
  embedding_version text NOT NULL,
  embedding_dimension integer NOT NULL CHECK(embedding_dimension > 0),
  embedding vector NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(chunk_id,chunk_hash,embedding_model,embedding_version),
  CHECK(vector_dims(embedding)=embedding_dimension)
);

CREATE TABLE IF NOT EXISTS enterprise_retrieval_runs (
  retrieval_run_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  requirement_id uuid NOT NULL REFERENCES requirements(id) ON DELETE RESTRICT,
  requirement_ref text NOT NULL,
  query_text text NOT NULL,
  query_hash text NOT NULL,
  embedding_model text NOT NULL,
  embedding_version text NOT NULL,
  embedding_dimension integer NOT NULL,
  top_k integer NOT NULL CHECK(top_k > 0),
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  latency_ms integer CHECK(latency_ms IS NULL OR latency_ms >= 0),
  status text NOT NULL CHECK(status IN ('running','succeeded','failed')),
  error_code text,
  error_message text
);

CREATE TABLE IF NOT EXISTS enterprise_retrieval_results (
  retrieval_run_id uuid NOT NULL REFERENCES enterprise_retrieval_runs(retrieval_run_id) ON DELETE CASCADE,
  chunk_id text NOT NULL REFERENCES material_chunks(chunk_id) ON DELETE RESTRICT,
  embedding_id uuid NOT NULL REFERENCES material_chunk_embeddings(embedding_id) ON DELETE RESTRICT,
  rank integer NOT NULL CHECK(rank > 0),
  similarity_score double precision NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(retrieval_run_id,chunk_id),
  UNIQUE(retrieval_run_id,rank)
);

CREATE INDEX IF NOT EXISTS material_chunk_embedding_lookup_idx ON material_chunk_embeddings(chunk_id,embedding_model,embedding_version,chunk_hash);
CREATE INDEX IF NOT EXISTS retrieval_runs_requirement_idx ON enterprise_retrieval_runs(requirement_id,started_at DESC);
CREATE INDEX IF NOT EXISTS retrieval_results_run_rank_idx ON enterprise_retrieval_results(retrieval_run_id,rank);
CREATE INDEX IF NOT EXISTS material_chunk_embedding_1536_hnsw_idx ON material_chunk_embeddings USING hnsw ((embedding::vector(1536)) vector_cosine_ops) WHERE embedding_dimension=1536;
