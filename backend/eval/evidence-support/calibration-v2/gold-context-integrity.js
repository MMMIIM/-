const CONTEXT_ROLES = new Set(['HEADING', 'METADATA', 'FRONT_MATTER']);

const isDecisionBearing = (candidate = {}) => candidate.requirement_relative_classification === 'EVIDENCE_BEARING'
  && candidate.candidate_eligibility === 'EVIDENCE_ELIGIBLE'
  && candidate.source_eligibility === 'ELIGIBLE';

/**
 * Separates frozen Gold IDs using only captured candidate-level evidence.
 * Context/heading chunks remain auditable but cannot become Exact Gold.
 */
export function splitGoldEvidenceAndContext({ goldChunkIds = [], rawCandidates = [] } = {}) {
  const byId = new Map((Array.isArray(rawCandidates) ? rawCandidates : []).map((candidate) => [candidate.chunk_id, candidate]));
  const evidence = [];
  const context = [];
  for (const chunkId of Array.isArray(goldChunkIds) ? goldChunkIds : []) {
    const candidate = byId.get(chunkId);
    if (candidate && isDecisionBearing(candidate) && !CONTEXT_ROLES.has(candidate.chunk_role)) evidence.push(chunkId);
    else context.push(chunkId);
  }
  return { goldEvidenceChunkIds: evidence, goldContextChunkIds: context };
}

export function firstDecisionBearingRawRank(rawCandidates = []) {
  const candidate = (Array.isArray(rawCandidates) ? rawCandidates : [])
    .filter(isDecisionBearing)
    .sort((left, right) => Number(left.raw_rank ?? Infinity) - Number(right.raw_rank ?? Infinity))[0];
  return candidate?.raw_rank ?? null;
}

export function firstRankForChunkIds(candidates = [], chunkIds = [], rankField = 'raw_rank') {
  const ids = new Set(Array.isArray(chunkIds) ? chunkIds : []);
  const ranks = (Array.isArray(candidates) ? candidates : [])
    .filter((candidate) => ids.has(candidate.chunk_id))
    .map((candidate) => Number(candidate[rankField]))
    .filter(Number.isFinite);
  return ranks.length ? Math.min(...ranks) : null;
}

export function finalHitAtK(candidates = [], chunkIds = [], k = 5) {
  const rank = firstRankForChunkIds(candidates, chunkIds, 'final_phase_rank');
  return rank !== null && rank <= k;
}

export { isDecisionBearing };
