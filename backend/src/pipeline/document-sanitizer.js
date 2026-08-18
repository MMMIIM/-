import { hasFixedCommitment } from './claim-gate.js';

const UNCERTAIN_PATTERN = /(?:可能|建议|预计|力争|视情况|待确认|需进一步确认)/;
const THIRD_PARTY_MODIFICATION_PATTERN = /(?:第三方(?:系统|平台|软件|设备)?[^。！？!?；;\n]{0,30}(?:改造|升级|重构|替换|修改|变更))|(?:(?:改造|升级|重构|替换|修改|变更)[^。！？!?；;\n]{0,30}第三方(?:系统|平台|软件|设备)?)/;
const COMMERCIAL_CLAIM_PATTERN = /(?:\d+(?:\.\d+)?\s*(?:元|万元))|(?:(?:价格|报价)[^。！？!?；;\n]{0,16}(?:为|按|不高于|低于|优惠))|(?:折扣|优惠价|免费赠送|降价)/;
const THIRD_PARTY_NEGATION_PATTERN = /(?:不涉及|不包含|无需|不会|不对)[^。！？!?；;\n]{0,12}第三方(?:系统|平台|软件|设备)?[^。！？!?；;\n]{0,12}(?:改造|升级|重构|替换|修改|变更)/;

function splitSentences(text) {
  return String(text || '')
    .split(/(?<=[。！？!?；;])|\n+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

export function classifySentence(sentence, claimGate) {
  const thirdPartyModification = THIRD_PARTY_MODIFICATION_PATTERN.test(sentence)
    && !THIRD_PARTY_NEGATION_PATTERN.test(sentence);
  const commercialClaim = COMMERCIAL_CLAIM_PATTERN.test(sentence);
  const unsupportedFixedCommitment = hasFixedCommitment(sentence)
    && !claimGate.isFixedCommitmentSupported(sentence);
  const risky = thirdPartyModification || commercialClaim || unsupportedFixedCommitment;

  if (risky && UNCERTAIN_PATTERN.test(sentence)) {
    return { action: 'manual', code: 'SEMANTIC_REVISION_REQUIRED' };
  }
  if (thirdPartyModification) return { action: 'delete', code: 'THIRD_PARTY_MODIFICATION' };
  if (commercialClaim) return { action: 'delete', code: 'COMMERCIAL_CLAIM' };
  if (unsupportedFixedCommitment) return { action: 'delete', code: 'UNSUPPORTED_FIXED_COMMITMENT' };
  return { action: 'keep', code: null };
}

export function sanitizeDocument(sections, claimGate) {
  if (!Array.isArray(sections)) throw Object.assign(new Error('章节草稿必须是数组。'), { code: 'DRAFT_INVALID' });

  return sections.map((section) => {
    const events = [];
    const manualIssues = [];
    const kept = [];
    for (const sentence of splitSentences(section.draft_text)) {
      const classification = classifySentence(sentence, claimGate);
      if (classification.action === 'delete') {
        events.push({ code: classification.code, action: 'deleted_sentence' });
        continue;
      }
      if (classification.action === 'manual') {
        manualIssues.push({ code: classification.code, sentence });
      }
      kept.push(sentence);
    }

    return {
      id: section.id,
      title: section.title,
      requirement_ids: [...section.requirement_ids],
      final_text: kept.join('\n'),
      sanitization_events: events,
      requiresManualOrLlmRevision: manualIssues.length > 0,
      manual_revision_issues: manualIssues
    };
  });
}
