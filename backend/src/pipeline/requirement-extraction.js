import { SemanticGatewayError } from './semantic-gateway-client.js';

export const REQUIREMENT_EXTRACTION_TASK_TYPE = 'requirement_extraction';
export const REQUIREMENT_EXTRACTION_INSTRUCTION = [
  '从招标文件文本中提取候选需求。',
  'data 只能包含 requirements 数组。',
  '每项只能包含 content、source_excerpt、source_page、source_paragraph。',
  '不得生成 REQ-ID；不要补充文件中不存在的要求。'
].join('');

function contractError(audit, detail) {
  return new SemanticGatewayError(
    'GATEWAY_REQUIREMENTS_INVALID',
    `候选需求输出契约无效：${detail}`,
    audit,
    422
  );
}

function optionalPositiveInteger(value, field, audit) {
  if (value === null || value === undefined) return null;
  if (!Number.isInteger(value) || value < 1) throw contractError(audit, `${field} 必须为正整数或 null。`);
  return value;
}

function normalizeWarnings(warnings, audit) {
  return warnings.map((warning) => {
    if (typeof warning === 'string' && warning.trim()) {
      return { code: 'GATEWAY_WARNING', message: warning.trim().slice(0, 500) };
    }
    if (warning && typeof warning === 'object' && !Array.isArray(warning)
      && typeof warning.message === 'string' && warning.message.trim()) {
      return {
        code: typeof warning.code === 'string' && warning.code.trim()
          ? warning.code.trim().slice(0, 80)
          : 'GATEWAY_WARNING',
        message: warning.message.trim().slice(0, 500)
      };
    }
    throw contractError(audit, 'warnings 项格式无效。');
  });
}

export function validateRequirementExtractionEnvelope(gatewayResponse) {
  const { envelope, audit } = gatewayResponse;
  if (envelope.status !== 'success') {
    throw new SemanticGatewayError(
      'GATEWAY_TASK_FAILED',
      '语义网关未能完成候选需求提取。',
      audit,
      502
    );
  }
  if (Object.keys(envelope.data).some((key) => key !== 'requirements')
    || !Array.isArray(envelope.data.requirements)) {
    throw contractError(audit, 'data 必须且只能包含 requirements 数组。');
  }

  const candidates = envelope.data.requirements.map((candidate, originalIndex) => {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
      throw contractError(audit, 'requirements 项必须为对象。');
    }
    const allowedKeys = new Set(['content', 'source_excerpt', 'source_page', 'source_paragraph']);
    if (Object.keys(candidate).some((key) => !allowedKeys.has(key))) {
      throw contractError(audit, 'requirements 项包含禁止字段（REQ-ID 必须由后端生成）。');
    }
    if (typeof candidate.content !== 'string' || typeof candidate.source_excerpt !== 'string') {
      throw contractError(audit, '需求内容与来源片段必须为字符串。');
    }
    const content = candidate.content.trim();
    const sourceExcerpt = typeof candidate.source_excerpt === 'string'
      ? candidate.source_excerpt.trim()
      : '';
    if (content && !sourceExcerpt) throw contractError(audit, '非空需求必须提供来源片段。');
    return {
      content,
      source_excerpt: sourceExcerpt,
      source_page: optionalPositiveInteger(candidate.source_page, 'source_page', audit),
      source_paragraph: optionalPositiveInteger(candidate.source_paragraph, 'source_paragraph', audit),
      candidate_index: originalIndex + 1
    };
  });

  return {
    candidates,
    warnings: normalizeWarnings(envelope.warnings, audit),
    audit
  };
}

export function createRequirementExtractionGateway(client) {
  return {
    async extract({ fileName, text, paragraphs, chunk }) {
      const gatewayResponse = await client.run({
        task_type: REQUIREMENT_EXTRACTION_TASK_TYPE,
        task_instruction: REQUIREMENT_EXTRACTION_INSTRUCTION,
        task_payload_json: JSON.stringify({
          file_name: fileName,
          chunk: chunk ? {
            chunk_number: chunk.chunk_number,
            source_start_offset: chunk.source_start_offset,
            source_end_offset: chunk.source_end_offset,
            source_start_page: chunk.source_start_page,
            source_end_page: chunk.source_end_page,
            source_start_paragraph: chunk.source_start_paragraph,
            source_end_paragraph: chunk.source_end_paragraph
          } : undefined,
          text,
          segments: paragraphs.map(({
            paragraph, page, text: segmentText, source_start_offset: sourceStartOffset,
            source_end_offset: sourceEndOffset, source_section: sourceSection,
            source_clause_id: sourceClauseId
          }) => ({
            paragraph,
            page,
            text: segmentText,
            source_start_offset: sourceStartOffset,
            source_end_offset: sourceEndOffset,
            source_section: sourceSection,
            source_clause_id: sourceClauseId
          }))
        })
      });
      return validateRequirementExtractionEnvelope(gatewayResponse);
    }
  };
}
