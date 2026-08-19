import { createHash } from 'node:crypto';
import { AppError } from './errors.js';
import { createEvidenceIdentifier } from './company-material-service.js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function assertUuid(value, code, message) { if (!UUID_PATTERN.test(String(value || ''))) throw new AppError(code, message, 400); }
function text(value, name) { const result=String(value || '').trim(); if(!result) throw new AppError('EVIDENCE_VALIDATION_FAILED', `${name}不能为空。`, 422); return result; }
function ids(values) { return [...new Set((values || []).map((value) => String(value).trim()).filter(Boolean))]; }

export class EvidenceService {
  constructor({ repository }) { this.repository = repository; }

  async list(projectId) {
    assertUuid(projectId, 'INVALID_PROJECT_ID', '项目 ID 格式无效。');
    if (!await this.repository.getProject(projectId)) throw new AppError('PROJECT_NOT_FOUND', '项目不存在。', 404);
    return this.repository.listEvidenceCatalog(projectId);
  }

  async create(projectId, input = {}) {
    assertUuid(projectId, 'INVALID_PROJECT_ID', '项目 ID 格式无效。');
    assertUuid(input.material_id, 'INVALID_MATERIAL_ID', '企业材料 ID 格式无效。');
    const material = await this.repository.getCompanyMaterial(input.material_id);
    if (!material || material.project_id !== projectId) throw new AppError('MATERIAL_NOT_FOUND', '企业材料不存在或不属于当前项目。', 404);
    if (material.extraction_status !== 'succeeded') throw new AppError('MATERIAL_NOT_READY', '企业材料尚未成功提取文本。', 409);
    const requirementIds = ids(input.applicable_requirement_ids);
    const invalidIds = await this.repository.findInvalidConfirmedRequirementIds(projectId, requirementIds);
    if (invalidIds.length) throw new AppError('EVIDENCE_REQUIREMENT_INVALID', `Evidence 关联了未确认 Requirement：${invalidIds.join('、')}`, 422);
    const content = text(input.content, 'Evidence 内容');
    const sourceText = input.source_text == null || String(input.source_text).trim() === '' ? null : String(input.source_text).trim();
    const sourcePage = input.source_page == null || input.source_page === '' ? null : Number(input.source_page);
    const sourceParagraph = input.source_paragraph == null || input.source_paragraph === '' ? null : Number(input.source_paragraph);
    if (sourcePage !== null && (!Number.isInteger(sourcePage) || sourcePage < 1)) throw new AppError('EVIDENCE_SOURCE_INVALID', '来源页码必须为正整数。', 422);
    if (sourceParagraph !== null && (!Number.isInteger(sourceParagraph) || sourceParagraph < 1)) throw new AppError('EVIDENCE_SOURCE_INVALID', '来源段落必须为正整数。', 422);
    if (!sourceText && (sourcePage !== null || sourceParagraph !== null)) throw new AppError('EVIDENCE_SOURCE_INVALID', '没有来源原文时，来源页码和段落必须留空。', 422);
    return this.repository.createEvidenceRecord({ evidenceId:createEvidenceIdentifier(), projectId, materialId:material.id,
      evidenceType:text(input.evidence_type || material.material_type, 'Evidence 类型'), title:text(input.title, 'Evidence 标题'), content,
      sourceText, sourcePage, sourceParagraph, sourceHash:sourceText ? createHash('sha256').update(sourceText).digest('hex') : null,
      applicableRequirementIds:requirementIds, usageScope:String(input.usage_scope || '').trim() || null, riskNotes:String(input.risk_notes || '').trim() || null });
  }

  async decide(evidenceId, decision, input = {}) {
    assertUuid(evidenceId, 'INVALID_EVIDENCE_ID', 'Evidence ID 格式无效。');
    if (!['approved','rejected'].includes(decision)) throw new AppError('EVIDENCE_DECISION_INVALID', 'Evidence 审批结论无效。', 422);
    const decidedBy = String(input.decided_by || '').trim();
    if (!decidedBy) throw new AppError('EVIDENCE_DECIDED_BY_REQUIRED', '审批人不能为空。', 422);
    const result = await this.repository.decideEvidence({ id:evidenceId, decision, decidedBy, riskNotes:String(input.risk_notes || '').trim() || null });
    if (!result) throw new AppError('EVIDENCE_NOT_FOUND', 'Evidence 不存在。', 404);
    return result;
  }
}
