import { extname } from 'node:path';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import { AppError } from './errors.js';

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const PDF_MIME = 'application/pdf';
const TEXT_MIMES = new Set(['text/plain', 'text/markdown', 'text/csv']);

function normalizeText(value) {
  return String(value || '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\t ]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function paragraphsFromText(text, page = null, startAt = 1) {
  return normalizeText(text)
    .split(/\n+/)
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value, index) => ({
      paragraph: startAt + index,
      page,
      text: value
    }));
}

function assertExtracted(result) {
  if (!result.text) {
    throw new AppError(
      'TENDER_TEXT_EMPTY',
      '未能从招标文件中提取到文本；如为扫描件，请先完成 OCR 后重新上传。',
      422
    );
  }
  return result;
}

async function extractDocx(buffer) {
  const result = await mammoth.extractRawText({ buffer });
  const text = normalizeText(result.value);
  return assertExtracted({
    text,
    paragraphs: paragraphsFromText(text),
    pages: [],
    warnings: (result.messages || []).map((message) => ({
      code: 'DOCX_EXTRACTION_WARNING',
      message: String(message.message || 'DOCX 文本提取存在兼容性提示。')
    }))
  });
}

async function extractPdf(buffer) {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText({ pageJoiner: '' });
    const pages = (result.pages || []).map((page) => ({
      page: page.num,
      text: normalizeText(page.text)
    })).filter((page) => page.text);
    let paragraph = 1;
    const paragraphs = pages.flatMap((page) => {
      const items = paragraphsFromText(page.text, page.page, paragraph);
      paragraph += items.length;
      return items;
    });
    return assertExtracted({
      text: normalizeText(pages.map((page) => page.text).join('\n\n')),
      paragraphs,
      pages,
      warnings: []
    });
  } finally {
    await parser.destroy();
  }
}

function extractPlainText(buffer) {
  const text = normalizeText(buffer.toString('utf8'));
  return assertExtracted({
    text,
    paragraphs: paragraphsFromText(text),
    pages: [],
    warnings: []
  });
}

export async function extractTenderText({ fileName, mimeType, buffer }) {
  if (!Buffer.isBuffer(buffer)) {
    throw new AppError('TENDER_FILE_READ_FAILED', '无法读取招标文件内容。', 422);
  }
  const extension = extname(String(fileName || '')).toLowerCase();
  try {
    if (extension === '.docx' || mimeType === DOCX_MIME) return await extractDocx(buffer);
    if (extension === '.pdf' || mimeType === PDF_MIME) return await extractPdf(buffer);
    if (['.txt', '.md', '.csv'].includes(extension) || TEXT_MIMES.has(mimeType)) {
      return extractPlainText(buffer);
    }
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      'TENDER_TEXT_EXTRACTION_FAILED',
      '招标文件文本提取失败，请确认文件未损坏且不是纯扫描件。',
      422,
      error
    );
  }
  throw new AppError(
    'TENDER_FILE_TYPE_UNSUPPORTED',
    '当前仅支持 DOCX、文本型 PDF 和纯文本招标文件。',
    415
  );
}
