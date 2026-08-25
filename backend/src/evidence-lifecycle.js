import { AppError } from './errors.js';

// Retrieval-created evidence is a compatibility/staging representation until
// an Evidence Review proposal receives an explicit human decision. The marker
// is server-generated and stored in the existing metadata JSONB column.
export const PRE_REVIEW_STAGING_ROLE = 'PRE_REVIEW_STAGING';

export function isPreReviewStagingEvidence(evidence) {
  const metadata = evidence?.metadata && typeof evidence.metadata === 'object' ? evidence.metadata : {};
  return metadata.lifecycle_role === PRE_REVIEW_STAGING_ROLE && metadata.canonical_review_required === true;
}

export function assertFormalEvidenceEligible(evidence, message = '该来源证据尚未完成 Evidence Review，不能进入正式业务链路。') {
  if (isPreReviewStagingEvidence(evidence)) {
    throw new AppError('EVIDENCE_REVIEW_REQUIRED', message, 409);
  }
}
