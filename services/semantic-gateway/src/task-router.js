import {
  getSemanticTaskContract,
  getSemanticTaskInstructionMetadata,
  validateTaskData
} from '../../../packages/semantic-contracts/index.js';
import { createHash } from 'node:crypto';

const instructionHash = value => createHash('sha256').update(String(value), 'utf8').digest('hex');

function observedCategory(value) {
  if (value === undefined) return 'missing';
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function validationDiagnostics(error, data) {
  const message = String(error?.message || 'schema validation failed');
  const envelopeLike = data && typeof data === 'object' && !Array.isArray(data)
    && Object.prototype.hasOwnProperty.call(data, 'schema_version')
    && Object.prototype.hasOwnProperty.call(data, 'task_type')
    && Object.prototype.hasOwnProperty.call(data, 'data');
  if (envelopeLike) {
    return [{
      path: 'provider.data',
      expected: 'object containing assessments and conflict_observations',
      observed_category: 'gateway_envelope',
      validator_code: 'ENVELOPE_ERROR',
      message: 'Provider returned a Gateway envelope where task data was required.'
    }];
  }
  const missing = message.match(/^missing (data\.[A-Za-z0-9_.\[\]-]+)/);
  if (missing) return [{
    path: missing[1],
    expected: 'required field',
    observed_category: 'missing',
    validator_code: 'required',
    message: 'Required canonical field is missing.'
  }];
  const pathMatch = message.match(/^(data\.[^ ]+)/);
  return [{
    path: pathMatch?.[1] || 'data',
    expected: 'canonical task data',
    observed_category: observedCategory(data),
    validator_code: 'OUTPUT_SCHEMA_INVALID',
    message: 'Canonical task data failed strict validation.'
  }];
}

/**
 * The task router is the only place where a semantic task is dispatched to a
 * provider. It deliberately ignores caller-supplied instructions: prompts are
 * gateway-owned and task-specific source text is data, not executable policy.
 */
export function createSemanticTaskRouter({ provider } = {}) {
  if (!provider || typeof provider.invoke !== 'function') {
    throw new Error('Semantic task router requires a provider adapter.');
  }
  return {
    async dispatch({ taskType, payload, contractVersion = null, instructionHash: requestedInstructionHash = null }) {
      const contract = getSemanticTaskContract(taskType);
      if (!contract) throw Object.assign(new Error('task unsupported'), { code: 'TASK_UNSUPPORTED' });
      const instructionMetadata = getSemanticTaskInstructionMetadata(taskType);
      const instruction = instructionMetadata?.instruction;
      if (!instruction || !instructionMetadata?.instruction_hash || instructionHash(instruction) !== instructionMetadata.instruction_hash) {
        throw Object.assign(new Error('semantic task contract instruction hash mismatch'), { code: 'SEMANTIC_CONTRACT_DRIFT' });
      }
      if ((contractVersion && contractVersion !== contract.contract_version)
        || (requestedInstructionHash && requestedInstructionHash !== instructionMetadata.instruction_hash)) {
        throw Object.assign(new Error('semantic task contract metadata mismatch'), { code: 'SEMANTIC_CONTRACT_DRIFT' });
      }
      const providerResult = await provider.invoke({ taskType, instruction, payload });
      let data;
      try {
        data = validateTaskData(taskType, providerResult?.data, payload);
      } catch (error) {
        error.provider_audit = providerResult?.provider_audit || null;
        error.validation_diagnostics = validationDiagnostics(error, providerResult?.data);
        if (!error.code) {
          error.code = error.message.includes('source-bound')
            ? 'SUPPORT_SPAN_INVALID'
            : 'OUTPUT_SCHEMA_INVALID';
        }
        throw error;
      }
      return {
        data,
        provider_audit: {
          ...(providerResult?.provider_audit || {}),
          semantic_contract_version: contract.contract_version,
          instruction_sha256: instructionMetadata.instruction_hash
        }
      };
    }
  };
}
