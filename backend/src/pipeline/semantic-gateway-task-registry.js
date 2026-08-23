import {
  GATEWAY_INPUT_SCHEMA,
  SEMANTIC_TASK_CONTRACTS,
  SEMANTIC_TASK_TYPES
} from '../../../packages/semantic-contracts/index.js';

export const EVIDENCE_SUPPORT_GATEWAY_TASK_TYPE = 'evidence_support_assessment';
export const EVIDENCE_SUPPORT_GATEWAY_CONTRACT_VERSION = SEMANTIC_TASK_CONTRACTS[
  EVIDENCE_SUPPORT_GATEWAY_TASK_TYPE
].contract_version;

const envelopeOutputSchema = contract => Object.freeze({
  type: 'object',
  required: Object.freeze(['schema_version', 'task_type', 'status', 'data', 'warnings']),
  properties: Object.freeze({
    schema_version: Object.freeze({ type: 'string', const: contract.contract_version }),
    task_type: Object.freeze({ type: 'string', const: contract.task_type }),
    status: Object.freeze({ enum: Object.freeze(['success', 'failed']) }),
    data: Object.freeze({
      type: 'object',
      required: contract.data_required,
      additionalProperties: false
    }),
    warnings: Object.freeze({ type: 'array' })
  })
});

export const SEMANTIC_GATEWAY_TASK_REGISTRY = Object.freeze(
  Object.fromEntries(SEMANTIC_TASK_TYPES.map(taskType => {
    const contract = SEMANTIC_TASK_CONTRACTS[taskType];
    return [taskType, Object.freeze({
      task_type: contract.task_type,
      contract_version: contract.contract_version,
      schema_version: contract.contract_version,
      input_schema: GATEWAY_INPUT_SCHEMA,
      output_schema: envelopeOutputSchema(contract),
      parser: contract.parser,
      validator: taskType === EVIDENCE_SUPPORT_GATEWAY_TASK_TYPE
        ? 'validateEvidenceSupportGatewayResponse'
        : `validate${taskType.replace(/(^|_)([a-z])/g, (_match, _prefix, letter) => letter.toUpperCase())}Envelope`,
      transport_normalization: contract.strict_transport ? 'strict' : 'legacy_deterministic'
    })];
  }))
);

export function getSemanticGatewayTask(taskType) {
  return SEMANTIC_GATEWAY_TASK_REGISTRY[String(taskType || '')] || null;
}

export function listSemanticGatewayTaskTypes() {
  return Object.keys(SEMANTIC_GATEWAY_TASK_REGISTRY);
}
