import {
  getSemanticTaskContract,
  resolveSemanticTaskInstruction,
  validateTaskData
} from '../../../packages/semantic-contracts/index.js';

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
    async dispatch({ taskType, payload }) {
      const contract = getSemanticTaskContract(taskType);
      if (!contract) throw Object.assign(new Error('task unsupported'), { code: 'TASK_UNSUPPORTED' });
      const instruction = resolveSemanticTaskInstruction(taskType);
      if (!instruction) throw Object.assign(new Error('task instruction missing'), { code: 'TASK_UNSUPPORTED' });
      const providerResult = await provider.invoke({ taskType, instruction, payload });
      let data;
      try {
        data = validateTaskData(taskType, providerResult?.data, payload);
      } catch (error) {
        if (!error.code) {
          error.code = error.message.includes('source-bound')
            ? 'SUPPORT_SPAN_INVALID'
            : 'OUTPUT_SCHEMA_INVALID';
        }
        throw error;
      }
      return { data, provider_audit: providerResult?.provider_audit || null };
    }
  };
}
