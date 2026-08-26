/**
 * Additive, versioned prompt for a future semantic-adjudication task.
 *
 * The accepted evidence_support_assessment prompt remains the default for
 * the frozen Gateway task.  This helper deliberately is not wired into that
 * task until a separately versioned remote contract is approved.
 */
export const SEMANTIC_ADJUDICATION_PROMPT_VERSION = 'semantic-adjudication-prompt-v1';

const asText = value => String(value ?? '').trim();
const asObject = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};

export function buildSemanticAdjudicationPrompt({
  requirement,
  candidateEvidence,
  deterministicFindings = {},
  unresolvedQuestion
} = {}) {
  const requirementText = asText(requirement?.text ?? requirement?.requirement_text);
  const sourceText = asText(candidateEvidence?.source_text ?? candidateEvidence?.source_text_excerpt);
  const question = asText(unresolvedQuestion);
  if (!requirementText || !sourceText || !question) {
    throw new TypeError('requirement、candidateEvidence 和 unresolvedQuestion 不能为空。');
  }
  return [
    `semantic adjudication prompt version: ${SEMANTIC_ADJUDICATION_PROMPT_VERSION}`,
    '判断 Requirement 与候选 Evidence 的未决语义关系。',
    '只输出结构化语义观察，不创建事实、映射、Claim 或审批状态。',
    'Requirement:',
    requirementText,
    'Candidate Evidence:',
    sourceText,
    '已完成的确定性检查（不得重新计算或覆盖）:',
    JSON.stringify(asObject(deterministicFindings)),
    '待回答的唯一语义问题:',
    question,
    '需要输出：semantic_relationship、语义 reason_codes、support_observations。'
  ].join('\n');
}
