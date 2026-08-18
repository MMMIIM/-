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
    || !Array.isArray(envelope.data.requirements)
    || envelope.data.requirements.length === 0) {
    throw contractError(audit, 'data 必须且只能包含非空 requirements 数组。');
  }

  const seen = new Set();
  const candidates = envelope.data.requirements.map((candidate, originalIndex) => {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
      throw contractError(audit, 'requirements 项必须为对象。');
    }
    const allowedKeys = new Set(['content', 'source_excerpt', 'source_page', 'source_paragraph']);
    if (Object.keys(candidate).some((key) => !allowedKeys.has(key))) {
      throw contractError(audit, 'requirements 项包含禁止字段（REQ-ID 必须由后端生成）。');
    }
    const content = typeof candidate.content === 'string' ? candidate.content.trim() : '';
    const sourceExcerpt = typeof candidate.source_excerpt === 'string'
      ? candidate.source_excerpt.trim()
      : '';
    if (!content) throw contractError(audit, '需求内容不能为空。');
    if (!sourceExcerpt) throw contractError(audit, '来源片段不能为空。');
    const duplicateKey = content.replace(/\s+/g, '').toLocaleLowerCase('zh-CN');
    if (seen.has(duplicateKey)) throw contractError(audit, '需求内容不得重复。');
    seen.add(duplicateKey);
    return {
      content,
      source_excerpt: sourceExcerpt,
      source_page: optionalPositiveInteger(candidate.source_page, 'source_page', audit),
      source_paragraph: optionalPositiveInteger(candidate.source_paragraph, 'source_paragraph', audit),
      originalIndex
    };
  });

  candidates.sort((left, right) => (
    (left.source_page ?? Number.MAX_SAFE_INTEGER) - (right.source_page ?? Number.MAX_SAFE_INTEGER)
    || (left.source_paragraph ?? Number.MAX_SAFE_INTEGER) - (right.source_paragraph ?? Number.MAX_SAFE_INTEGER)
    || left.originalIndex - right.originalIndex
  ));

  return {
    candidates: candidates.map((candidate, index) => ({
      req_id: `REQ-${String(index + 1).padStart(3, '0')}`,
      content: candidate.content,
      source_excerpt: candidate.source_excerpt,
      source_page: candidate.source_page,
      source_paragraph: candidate.source_paragraph,
      ordinal: index + 1
    })),
    warnings: normalizeWarnings(envelope.warnings, audit),
    audit
  };
}

export function createRequirementExtractionGateway(client) {
  return {
    async extract({ fileName, text, paragraphs }) {
      const gatewayResponse = await client.run({
        task_type: REQUIREMENT_EXTRACTION_TASK_TYPE,
        task_instruction: REQUIREMENT_EXTRACTION_INSTRUCTION,
        task_payload_json: JSON.stringify({
          file_name: fileName,
          text,
          segments: paragraphs.map(({ paragraph, page, text: segmentText }) => ({
            paragraph,
            page,
            text: segmentText
          }))
        })
      });
      return validateRequirementExtractionEnvelope(gatewayResponse);
    }
  };
}
