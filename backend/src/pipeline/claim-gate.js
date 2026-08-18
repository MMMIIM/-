const DURATION_PATTERN = /\d+(?:\.\d+)?\s*(?:分钟|小时|天|工作日|个月|月|年)/gi;
const COMMITMENT_PATTERN = /(?:SLA|响应|修复|解决|完成|交付|工期|上线|可用性)/i;
const COMMITMENT_TERMS = ['SLA', '响应', '修复', '解决', '完成', '交付', '工期', '上线', '可用性'];

function extractDurations(text) {
  return [...String(text || '').matchAll(DURATION_PATTERN)].map((match) => match[0].replace(/\s+/g, ''));
}

function extractCommitmentTerms(text) {
  const normalized = String(text || '').toLowerCase();
  return COMMITMENT_TERMS.filter((term) => normalized.includes(term.toLowerCase()));
}

export function createClaimGate(requirements) {
  const supportedCommitments = requirements.flatMap((requirement) => {
    if (!COMMITMENT_PATTERN.test(requirement.text)) return [];
    const terms = extractCommitmentTerms(requirement.text);
    return extractDurations(requirement.text).flatMap((duration) => (
      terms.map((term) => ({ duration, term, req_id: requirement.req_id }))
    ));
  });

  return {
    requirement_ids: requirements.map((requirement) => requirement.req_id),
    mandatory_requirement_ids: requirements
      .filter((requirement) => requirement.is_mandatory)
      .map((requirement) => requirement.req_id),
    supported_commitments: supportedCommitments,
    isFixedCommitmentSupported(sentence) {
      const durations = extractDurations(sentence);
      const terms = extractCommitmentTerms(sentence);
      return durations.length > 0 && terms.length > 0 && durations.every((duration) => (
        terms.every((term) => supportedCommitments.some((supported) => (
          supported.duration === duration && supported.term === term
        )))
      ));
    }
  };
}

export function hasFixedCommitment(sentence) {
  return COMMITMENT_PATTERN.test(sentence) && extractDurations(sentence).length > 0;
}
