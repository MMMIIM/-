# Production Retrieval Contract v1

Status: design and Eval contract only. It is not wired into the Production Retriever.

## Frozen v1 architecture

The sole embedding query is the unmodified `Canonical Requirement.requirement_text`:

`requirement_text -> raw vector retrieval (candidate_k=20) -> deterministic role + evidence-need rerank -> review_k=8`

Evidence Need and Requirement Role are post-retrieval ranking signals. They must never replace, rewrite, expand, or split the embedding query. The raw vector layer performs no semantic pre-filter and no hard deletion.

`candidate_k=20` and `review_k=8` are frozen defaults for v1, based on Task 6G. They are versioned defaults, not permanent universal constants. Dynamic Top-K is deferred until real-corpus measurements at approximately 500, 1,000, 3,000, and 5,000+ chunks show a material decline in K=20 candidate recall.

## Input contract

- `project_id`
- `requirement_id`
- `requirement_text`: exact Canonical Requirement text and the only embedding query
- `requirement_role`: candidate semantic role plus review status
- `evidence_needs[]`: approved or pending needs; ranking hints only
- `corpus_scope`: deterministic project/corpus filters
- `embedding_identity`: `model`, `version`, `candidate_k=20`

The contract rejects `role_query`, `evidence_need_query`, `query_rewrite`, `per_need_k`, and `dynamic_top_k`.

## Candidate preservation and fallback

All 20 raw vector candidates remain in the audited reranked list. Compatibility values are `preferred`, `compatible`, `unknown`, `weak`, or `incompatible`; none authorizes exclusion. `unknown` is neutral and retained.

Missing, pending, or unknown Requirement Role metadata, or missing/unknown candidate role metadata, activates exact Raw Vector fallback. Pending Evidence Needs may remain audit-visible, but do not independently authorize filtering or claims. Missing semantic metadata must never make retrieval fail.

## Deterministic rerank guardrail

Vector similarity establishes the primary candidate pool and raw order. The Eval reference uses a bounded rank adjustment:

- `preferred`: -2
- `compatible`: -1
- `unknown`: 0
- `weak`: +1
- `incompatible`: +2
- absolute `max_rerank_shift`: 4

The currently defined adjustments stay inside that ceiling. The ceiling prevents semantic metadata from overpowering vector retrieval if later weights change. Ordering is deterministic: bounded rank, then raw vector rank, then raw similarity, then stable source document/chunk identity.

This policy reranks; it does not assert Evidence sufficiency, approval, factual truth, or Claim permission.

## Output and audit

The result includes the complete `raw_candidates`, complete `reranked_candidates`, and first eight `final_candidates`. Every final candidate must expose:

- `raw_vector_rank`
- `raw_similarity`
- `reranked_rank`
- `content_role`
- `role_compatibility`
- `matched_evidence_needs`
- `rerank_reasons`
- `rerank_version`
- `source_document_id`
- `source_chunk_id`

Run-level identity includes `retrieval_contract_version`, `embedding_model`, `embedding_version`, `candidate_k`, `review_k`, and `rerank_version`.

## Explicitly deferred

- Evidence Need Bucketing and `per_need_k`
- Dynamic Top-K
- LLM query rewrite, LLM routing, cross-encoder/model reranking
- hybrid or multi-hop retrieval
- Evidence aggregation, approval, Claim Gate, Writer, or Agent changes

Future LLMs may only propose pending Role/Need metadata. Their absence or non-approved state must preserve Raw Vector fallback.

## Implementation readiness gate

Production implementation is not ready merely because this design is frozen. A later task must integrate the contract without changing Requirement, Evidence, or Claim truth; persist complete audit identity; prove project isolation and no hard exclusion; add migration only if persistence truly requires it; run real-corpus regression; and demonstrate safe rollback to Raw Vector ordering.
