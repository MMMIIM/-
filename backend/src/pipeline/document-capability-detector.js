import { extname } from 'node:path';
import { AppError } from '../errors.js';

const SUPPORTED_EXTENSIONS = new Set(['.pdf', '.docx', '.txt', '.md', '.csv']);
const TECHNICAL_SIGNAL = /(?:技术|功能|服务|项目|采购).{0,8}(?:要求|需求|参数|规范)|(?:应当|应|须|必须|不得|需提供)/;

function typeOf(fileName, mimeType) {
  const extension = extname(String(fileName || '')).toLowerCase();
  if (extension === '.pdf' || mimeType === 'application/pdf') return 'pdf';
  if (extension === '.docx' || String(mimeType).includes('wordprocessingml')) return 'docx';
  if (['.txt', '.md', '.csv'].includes(extension) || String(mimeType).startsWith('text/')) return 'text';
  return 'unknown';
}

export class DocumentCapabilityDetector {
  detect({ fileName, mimeType, buffer, extraction = null, extractionError = null }) {
    const documentType = typeOf(fileName, mimeType);
    const extension = extname(String(fileName || '')).toLowerCase();
    const encrypted = documentType === 'pdf' && Buffer.isBuffer(buffer)
      && /\/Encrypt\b/.test(buffer.subarray(0, Math.min(buffer.length, 1_000_000)).toString('latin1'));
    const text = String(extraction?.text || '');
    const pageCount = extraction?.pages?.length || 0;
    const likelyScanned = documentType === 'pdf' && (
      extractionError?.code === 'TENDER_TEXT_EMPTY' || (pageCount > 0 && text.length / pageCount < 30)
    );
    const invalidCharacters = (text.match(/\uFFFD/g) || []).length;
    const extractionQuality = !text ? 'none'
      : invalidCharacters / Math.max(text.length, 1) > 0.01 ? 'low'
        : text.length < 40 ? 'fair' : 'good';
    let unsupportedReason = null;
    if (documentType === 'unknown' || (extension && !SUPPORTED_EXTENSIONS.has(extension))) unsupportedReason = 'UNSUPPORTED_DOCUMENT';
    else if (encrypted) unsupportedReason = 'ENCRYPTED_DOCUMENT';
    else if (likelyScanned) unsupportedReason = 'OCR_REQUIRED';
    else if (extraction && extractionQuality === 'low') unsupportedReason = 'EXTRACTION_QUALITY_TOO_LOW';
    return {
      document_type: documentType,
      text_extractable: Boolean(text),
      has_tables: Boolean(extraction?.tables?.length) || /(?:\t.{1,80}\t)|(?:\|[^\n]+\|)/.test(text),
      likely_scanned: likelyScanned,
      encrypted,
      extraction_quality: extractionQuality,
      supported: unsupportedReason === null,
      unsupported_reason: unsupportedReason,
      has_technical_requirement_signals: TECHNICAL_SIGNAL.test(text)
    };
  }

  assertSupported(capability) {
    if (capability.supported) return capability;
    const messages = {
      OCR_REQUIRED: 'PDF 可能为扫描件，请先完成 OCR 后再解析。',
      ENCRYPTED_DOCUMENT: 'PDF 已加密，无法安全提取文本。',
      UNSUPPORTED_DOCUMENT: '当前文件类型不支持需求解析。',
      EXTRACTION_QUALITY_TOO_LOW: '文档文本提取质量过低，请更换可提取版本。'
    };
    throw new AppError(capability.unsupported_reason, messages[capability.unsupported_reason], 422);
  }
}

export const documentCapabilitySignals = Object.freeze({ technical: TECHNICAL_SIGNAL });
