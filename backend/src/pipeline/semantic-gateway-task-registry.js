const gatewayInputSchema = Object.freeze({
  type: 'object',
  required: ['task_type', 'task_instruction', 'task_payload_json'],
  properties: Object.freeze({
    task_type: Object.freeze({ type: 'string' }),
    task_instruction: Object.freeze({ type: 'string' }),
    task_payload_json: Object.freeze({ type: 'string' })
  })
});

const envelopeOutputSchema = (data) => Object.freeze({
  type: 'object',
  required: ['schema_version', 'task_type', 'status', 'data', 'warnings'],
  properties: Object.freeze({
    schema_version: Object.freeze({ type: 'string' }),
    task_type: Object.freeze({ type: 'string' }),
    status: Object.freeze({ enum: Object.freeze(['success', 'failed']) }),
    data: Object.freeze(data),
    warnings: Object.freeze({ type: 'array' })
  })
});

export const EVIDENCE_SUPPORT_GATEWAY_TASK_TYPE = 'evidence_support_assessment';
export const EVIDENCE_SUPPORT_GATEWAY_CONTRACT_VERSION = '4.3-evidence-support-assessment-v1';

const reviewDimensionsSchema = Object.freeze({
  type: 'object',
  required: [
    'subject_match', 'scope_match', 'status_match', 'quantitative_match',
    'entity_match', 'validity_match', 'source_authority', 'support_sufficiency'
  ],
  additionalProperties: false
});

const supportObservationSchema = Object.freeze({
  type: 'object',
  required: ['source_id', 'source_span_id', 'support_excerpt', 'observation_type', 'reason_codes'],
  additionalProperties: false
});

const assessmentSchema = Object.freeze({
  type: 'object',
  required: [
    'source_id', 'source_span_id', 'semantic_relevance', 'evidence_capability',
    'support_level', 'semantic_relationship', 'review_dimensions', 'reason_codes',
    'support_observations'
  ],
  properties: Object.freeze({
    source_id: Object.freeze({ type: 'string' }),
    source_span_id: Object.freeze({ type: 'string' }),
    semantic_relevance: Object.freeze({ type: 'string' }),
    evidence_capability: Object.freeze({ type: 'string' }),
    support_level: Object.freeze({ type: 'string' }),
    semantic_relationship: Object.freeze({ type: 'string' }),
    review_dimensions: reviewDimensionsSchema,
    reason_codes: Object.freeze({ type: 'array' }),
    support_observations: Object.freeze({ type: 'array', items: supportObservationSchema })
  }),
  additionalProperties: false
});

const conflictObservationSchema = Object.freeze({
  type: 'object',
  required: ['conflict_group_id', 'dimension', 'sources', 'reason_codes'],
  properties: Object.freeze({
    conflict_group_id: Object.freeze({ type: 'string' }),
    dimension: Object.freeze({ type: 'string' }),
    sources: Object.freeze({
      type: 'array',
      minItems: 2,
      items: Object.freeze({
        type: 'object',
        required: ['source_id', 'source_span_id', 'observed_value', 'support_excerpt'],
        additionalProperties: false
      })
    }),
    reason_codes: Object.freeze({ type: 'array' })
  }),
  additionalProperties: false
});

const assessmentDataSchema = Object.freeze({
  type: 'object',
  required: ['assessments', 'conflict_observations'],
  properties: Object.freeze({
    assessments: Object.freeze({ type: 'array', items: assessmentSchema }),
    conflict_observations: Object.freeze({ type: 'array', items: conflictObservationSchema })
  }),
  additionalProperties: false
});

const task = (taskType, contractVersion, parser, validator, data, options = {}) => Object.freeze({
  task_type: taskType,
  contract_version: contractVersion,
  schema_version: contractVersion,
  input_schema: gatewayInputSchema,
  output_schema: envelopeOutputSchema(data),
  parser,
  validator,
  transport_normalization: options.transport_normalization || 'legacy_deterministic'
});

export const SEMANTIC_GATEWAY_TASK_REGISTRY = Object.freeze({
  requirement_extraction: task(
    'requirement_extraction',
    '4.3-requirement-extraction',
    'semantic-gateway-envelope-v1',
    'validateRequirementExtractionEnvelope',
    { type: 'object', required: ['requirements'] }
  ),
  response_planning: task(
    'response_planning',
    '4.3-response-planning',
    'semantic-gateway-envelope-v1',
    'validateResponsePlanningEnvelope',
    { type: 'object', required: ['response_plans'] }
  ),
  claim_generation: task(
    'claim_generation',
    '4.3-claim-generation',
    'semantic-gateway-envelope-v1',
    'validateClaimGenerationEnvelope',
    { type: 'object', required: ['claims'] }
  ),
  section_drafting: task(
    'section_drafting',
    '4.3-section-drafting',
    'semantic-gateway-envelope-v1',
    'validateSectionDraftingEnvelope',
    { type: 'object', required: ['chapter_id', 'content_markdown'] }
  ),
  targeted_revision: task(
    'targeted_revision',
    '4.3-targeted-revision',
    'semantic-gateway-envelope-v1',
    'validateTargetedRevisionEnvelope',
    { type: 'object', required: ['revised_text'] }
  ),
  [EVIDENCE_SUPPORT_GATEWAY_TASK_TYPE]: task(
    EVIDENCE_SUPPORT_GATEWAY_TASK_TYPE,
    EVIDENCE_SUPPORT_GATEWAY_CONTRACT_VERSION,
    'evidence-support-assessment-envelope-v1',
    'validateEvidenceSupportGatewayResponse',
    assessmentDataSchema,
    { transport_normalization: 'strict' }
  ),
  // Existing document-generation compatibility path; it is not a new formal task.
  draft_sections: task(
    'draft_sections',
    '4.3-gateway',
    'semantic-gateway-envelope-v1',
    'generic-envelope-compatibility',
    { type: 'object' }
  )
});

export function getSemanticGatewayTask(taskType) {
  return SEMANTIC_GATEWAY_TASK_REGISTRY[String(taskType || '')] || null;
}

export function listSemanticGatewayTaskTypes() {
  return Object.keys(SEMANTIC_GATEWAY_TASK_REGISTRY);
}
