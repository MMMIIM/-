export const REQUIREMENT_SOURCE_STATUSES = Object.freeze(['verified', 'provisional', 'excluded']);

export function deriveCandidateSourceStatus(candidate) {
  if (candidate?.candidate_decision === 'exclude' || candidate?.source_status === 'excluded') return 'excluded';
  return candidate?.source_verified === true || candidate?.source_status === 'verified'
    || (candidate?.source_verified === undefined && candidate?.source_status === undefined && Boolean(candidate?.source_page || candidate?.source_paragraph))
    ? 'verified'
    : 'provisional';
}

export function clearUnverifiedLocation(candidate) {
  if (deriveCandidateSourceStatus(candidate) === 'verified') return { ...candidate, source_status: 'verified' };
  return {
    ...candidate,
    source_status: deriveCandidateSourceStatus(candidate),
    source_page: null,
    source_paragraph: null,
    source_page_start: null,
    source_page_end: null,
    source_paragraph_start: null,
    source_paragraph_end: null,
    source_paragraphs_json: [],
    source_hash: null,
    source_match_type: null,
    source_match_score: null,
    source_resolution_method: null,
    source_verified: false
  };
}
