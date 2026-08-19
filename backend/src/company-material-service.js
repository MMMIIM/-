import { createHash, randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { AppError } from './errors.js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MATERIAL_TYPES = new Set(['company_profile','qualification','case','product','personnel','technical_solution','delivery_capability','other']);
const SUPPORTED_EXTENSIONS = new Set(['.docx','.pdf','.txt','.md']);

function assertUuid(value, code, message) {
  if (!UUID_PATTERN.test(String(value || ''))) throw new AppError(code, message, 400);
}

export class CompanyMaterialService {
  constructor({ repository, storage, textExtractor }) {
    this.repository = repository; this.storage = storage; this.textExtractor = textExtractor;
  }

  async upload({ projectId, file, materialType }) {
    assertUuid(projectId, 'INVALID_PROJECT_ID', '项目 ID 格式无效。');
    if (!await this.repository.getProject(projectId)) throw new AppError('PROJECT_NOT_FOUND', '项目不存在。', 404);
    if (!file?.buffer) throw new AppError('MATERIAL_FILE_REQUIRED', '请选择企业材料文件。', 422);
    if (!MATERIAL_TYPES.has(materialType)) throw new AppError('MATERIAL_TYPE_INVALID', '企业材料类型无效。', 422);
    const extension = extname(String(file.originalname || '')).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.has(extension)) throw new AppError('MATERIAL_FILE_TYPE_UNSUPPORTED', '企业材料仅支持 DOCX、文本型 PDF、TXT 和 Markdown。', 422);
    const fileHash = createHash('sha256').update(file.buffer).digest('hex');
    const duplicate = await this.repository.findCompanyMaterialByHash(projectId, fileHash);
    if (duplicate) throw new AppError('MATERIAL_DUPLICATE', '该企业材料已经上传，请勿重复添加。', 409);
    const storageKey = await this.storage.save({ projectId, originalName: file.originalname, buffer: file.buffer });
    const material = await this.repository.createCompanyMaterial({ projectId, originalName: file.originalname,
      storageKey, materialType, mimeType: file.mimetype || 'application/octet-stream', sizeBytes: file.size ?? file.buffer.length, fileHash });
    try {
      const extraction = await this.textExtractor({ fileName: file.originalname, mimeType: file.mimetype, buffer: file.buffer });
      return await this.repository.completeCompanyMaterialExtraction(material.id, extraction.text);
    } catch (error) {
      const ocrRequired = extension === '.pdf' && ['TENDER_TEXT_EMPTY','TENDER_TEXT_EXTRACTION_FAILED'].includes(error?.code);
      const code = ocrRequired ? 'OCR_REQUIRED' : (error?.code || 'MATERIAL_EXTRACTION_FAILED');
      const message = ocrRequired ? '该 PDF 未提取到可用文本，请完成 OCR 后重新上传。' : '企业材料文本提取失败，请确认文件未损坏。';
      await this.repository.failCompanyMaterialExtraction(material.id, { status: ocrRequired ? 'ocr_required' : 'failed', code, message });
      throw new AppError(code, message, 422);
    }
  }

  async list(projectId) {
    assertUuid(projectId, 'INVALID_PROJECT_ID', '项目 ID 格式无效。');
    if (!await this.repository.getProject(projectId)) throw new AppError('PROJECT_NOT_FOUND', '项目不存在。', 404);
    return { materials: await this.repository.listCompanyMaterials(projectId) };
  }
}

export function createEvidenceIdentifier() {
  return `EVI-${randomUUID().toUpperCase()}`;
}
