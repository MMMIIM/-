import { fileURLToPath } from 'node:url';

export const RETRIEVAL_CONTRACT_VERSION = '4.3-production-retrieval-v1';
export const RERANK_VERSION = '4.3-role-need-rerank-v1';
export const CANDIDATE_K = 20;
export const REVIEW_K = 8;
export const MAX_RERANK_SHIFT = 4;
export const DYNAMIC_TOP_K_ENABLED = false;
export const EVIDENCE_NEED_BUCKETING_ENABLED = false;

const COMPATIBILITY_SHIFT = Object.freeze({
  preferred: -2,
  compatible: -1,
  unknown: 0,
  weak: 1,
  incompatible: 2,
});

const PROHIBITED_QUERY_FIELDS = Object.freeze([
  'evidence_need_query',
  'role_query',
  'query_rewrite',
  'per_need_k',
  'dynamic_top_k',
]);

function requireText(value, field) {
  if (typeof value !== 'string' || value.trim() === '') throw new TypeError(`${field} is required`);
  return value;
}

function stableSourceId(candidate) {
  return `${candidate.source_document_id ?? ''}\u0000${candidate.source_chunk_id ?? ''}`;
}

function semanticsAreUsable(input, candidates) {
  const role = input.requirement_role;
  const needs = input.evidence_needs;
  if (!role || role.status !== 'approved' || !role.value || role.value === 'unknown') return false;
  if (!Array.isArray(needs) || needs.some((need) => !need || !['approved', 'pending'].includes(need.status))) return false;
  return candidates.every((candidate) => candidate.content_role && candidate.content_role !== 'unknown');
}

export function validateProductionRetrievalInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new TypeError('input must be an object');
  for (const field of PROHIBITED_QUERY_FIELDS) {
    if (Object.hasOwn(input, field)) throw new TypeError(`${field} is not part of Production Retrieval Contract v1`);
  }
  requireText(input.project_id, 'project_id');
  requireText(input.requirement_id, 'requirement_id');
  requireText(input.requirement_text, 'requirement_text');
  if (!input.embedding_identity || typeof input.embedding_identity !== 'object') throw new TypeError('embedding_identity is required');
  requireText(input.embedding_identity.model, 'embedding_identity.model');
  requireText(input.embedding_identity.version, 'embedding_identity.version');
  if (input.embedding_identity.candidate_k !== CANDIDATE_K) throw new TypeError(`candidate_k must equal ${CANDIDATE_K}`);
  if (!input.corpus_scope || typeof input.corpus_scope !== 'object') throw new TypeError('corpus_scope is required');
  return true;
}

export function createEmbeddingQuery(input) {
  validateProductionRetrievalInput(input);
  return input.requirement_text;
}

export function rerankCandidatesV1(input, rawCandidates) {
  validateProductionRetrievalInput(input);
  if (!Array.isArray(rawCandidates)) throw new TypeError('rawCandidates must be an array');

  const raw = rawCandidates.map((candidate, index) => {
    const rawRank = candidate.raw_vector_rank ?? index + 1;
    if (!Number.isInteger(rawRank) || rawRank < 1) throw new TypeError('raw_vector_rank must be a positive integer');
    if (!Number.isFinite(candidate.raw_similarity)) throw new TypeError('raw_similarity must be finite');
    requireText(candidate.source_document_id, 'source_document_id');
    requireText(candidate.source_chunk_id, 'source_chunk_id');
    return { ...candidate, raw_vector_rank: rawRank };
  }).sort((a, b) => a.raw_vector_rank - b.raw_vector_rank || b.raw_similarity - a.raw_similarity || stableSourceId(a).localeCompare(stableSourceId(b)));

  const fallback = !semanticsAreUsable(input, raw);
  const ranked = raw.map((candidate) => {
    const compatibility = fallback ? 'unknown' : (candidate.role_compatibility ?? 'unknown');
    const requestedShift = fallback ? 0 : (COMPATIBILITY_SHIFT[compatibility] ?? 0);
    const boundedShift = Math.max(-MAX_RERANK_SHIFT, Math.min(MAX_RERANK_SHIFT, requestedShift));
    return {
      ...candidate,
      role_compatibility: compatibility,
      matched_evidence_needs: fallback ? [] : [...(candidate.matched_evidence_needs ?? [])],
      rerank_reasons: fallback ? ['RAW_VECTOR_FALLBACK'] : [`ROLE_COMPATIBILITY_${compatibility.toUpperCase()}`, ...(candidate.matched_evidence_needs?.length ? ['EVIDENCE_NEED_MATCH'] : [])],
      rerank_version: RERANK_VERSION,
      _bounded_rank: candidate.raw_vector_rank + boundedShift,
    };
  }).sort((a, b) => a._bounded_rank - b._bounded_rank || a.raw_vector_rank - b.raw_vector_rank || b.raw_similarity - a.raw_similarity || stableSourceId(a).localeCompare(stableSourceId(b)))
    .map(({ _bounded_rank, ...candidate }, index) => ({ ...candidate, reranked_rank: index + 1 }));

  return {
    retrieval_contract_version: RETRIEVAL_CONTRACT_VERSION,
    embedding_model: input.embedding_identity.model,
    embedding_version: input.embedding_identity.version,
    candidate_k: CANDIDATE_K,
    review_k: REVIEW_K,
    rerank_version: RERANK_VERSION,
    dynamic_top_k_enabled: DYNAMIC_TOP_K_ENABLED,
    evidence_need_bucketing_enabled: EVIDENCE_NEED_BUCKETING_ENABLED,
    fallback_mode: fallback ? 'raw_vector' : null,
    embedding_query: input.requirement_text,
    raw_candidates: raw,
    reranked_candidates: ranked,
    final_candidates: ranked.slice(0, REVIEW_K),
  };
}

export function validateContract() {
  if (CANDIDATE_K !== 20 || REVIEW_K !== 8) throw new Error('frozen v1 K values changed');
  if (DYNAMIC_TOP_K_ENABLED || EVIDENCE_NEED_BUCKETING_ENABLED) throw new Error('deferred features must remain disabled');
  return { ok: true, contract_version: RETRIEVAL_CONTRACT_VERSION };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.stdout.write(`${JSON.stringify(validateContract())}\n`);
}
