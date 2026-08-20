import { createHash } from 'node:crypto';
import { AppError } from './errors.js';
import { createEvidenceIdentifier } from './company-material-service.js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function assertUuid(value, code, message) { if (!UUID_PATTERN.test(String(value || ''))) throw new AppError(code, message, 400); }
function text(value, name) { const result=String(value || '').trim(); if(!result) throw new AppError('EVIDENCE_VALIDATION_FAILED', `${name}不能为空。`, 422); return result; }
function ids(values) { return [...new Set((values || []).map((value) => String(value).trim()).filter(Boolean))]; }
const VALIDITY=new Set(['active','expired','revoked','unknown']);
const MAPPING_SOURCES=new Set(['manual','retrieval']);
const MAPPING_DECISIONS=new Set(['approved','rejected']);
function object(value){return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}
function metadata(value){const input=object(value);const result=Object.fromEntries(['issuer','valid_from','valid_until','customer','product','version'].filter((key)=>input[key]!=null&&String(input[key]).trim()).map((key)=>[key,String(input[key]).trim()]));for(const key of ['valid_from','valid_until'])if(result[key]&&!/^\d{4}-\d{2}-\d{2}$/.test(result[key]))throw new AppError('EVIDENCE_METADATA_INVALID',`${key} 必须是 YYYY-MM-DD。`,422);return result;}

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
    let chunk=null;
    if(input.source_chunk_id){
      chunk=await this.repository.getMaterialChunk(String(input.source_chunk_id));
      if(!chunk||chunk.material_id!==material.id) throw new AppError('EVIDENCE_SOURCE_CHUNK_INVALID', 'Material Chunk 不存在或不属于指定材料。', 422);
      if(material.extracted_text.slice(chunk.char_start,chunk.char_end)!==chunk.source_text) throw new AppError('EVIDENCE_SOURCE_LINEAGE_INVALID', 'Material Chunk 无法回溯到材料原文。', 409);
      if(input.source_text!=null&&String(input.source_text)!==chunk.source_text)throw new AppError('EVIDENCE_SOURCE_LINEAGE_INVALID','Evidence source_text 与 Material Chunk 原文不一致。',422);
    }
    if(!chunk&&input.source_text!=null&&String(input.source_text).trim())throw new AppError('EVIDENCE_SOURCE_CHUNK_REQUIRED','Enterprise Evidence 的来源原文必须由真实 Material Chunk 提供。',422);
    const requirementIds = ids(input.applicable_requirement_ids);
    const invalidIds = await this.repository.findInvalidConfirmedRequirementIds(projectId, requirementIds);
    if (invalidIds.length) throw new AppError('EVIDENCE_REQUIREMENT_INVALID', `Evidence 关联了未确认 Requirement：${invalidIds.join('、')}`, 422);
    const content = text(input.content, 'Evidence 内容');
    const sourceText = chunk?.source_text ?? (input.source_text == null || String(input.source_text).trim() === '' ? null : String(input.source_text).trim());
    const sourcePage = chunk?.page_start ?? (input.source_page == null || input.source_page === '' ? null : Number(input.source_page));
    const sourceParagraph = chunk?.paragraph_start ?? (input.source_paragraph == null || input.source_paragraph === '' ? null : Number(input.source_paragraph));
    if (sourcePage !== null && (!Number.isInteger(sourcePage) || sourcePage < 1)) throw new AppError('EVIDENCE_SOURCE_INVALID', '来源页码必须为正整数。', 422);
    if (sourceParagraph !== null && (!Number.isInteger(sourceParagraph) || sourceParagraph < 1)) throw new AppError('EVIDENCE_SOURCE_INVALID', '来源段落必须为正整数。', 422);
    if (!sourceText && (sourcePage !== null || sourceParagraph !== null)) throw new AppError('EVIDENCE_SOURCE_INVALID', '没有来源原文时，来源页码和段落必须留空。', 422);
    const validityStatus='unknown';
    if(input.validity_status!=null&&String(input.validity_status)!=='unknown')throw new AppError('EVIDENCE_VALIDITY_REVIEW_REQUIRED','Evidence 有效性必须通过独立审核接口设置。',422);
    return this.repository.createEvidenceRecord({ evidenceId:createEvidenceIdentifier(), projectId, materialId:material.id, sourceChunkId:chunk?.chunk_id||null,
      evidenceType:text(input.evidence_type || material.material_type, 'Evidence 类型'), title:text(input.title, 'Evidence 标题'), content,
      sourceText, sourcePage, sourceParagraph, sourceHash:chunk?.chunk_hash||(sourceText ? createHash('sha256').update(sourceText).digest('hex') : null),
      sourceLocation:chunk?{char_start:chunk.char_start,char_end:chunk.char_end,page_start:chunk.page_start,page_end:chunk.page_end,paragraph_start:chunk.paragraph_start,paragraph_end:chunk.paragraph_end,section:chunk.section}:{},
      evidenceScope:ids(input.evidence_scope), capabilityTags:ids(input.capability_tags), metadata:metadata(input.metadata), validityStatus,
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

  async setValidity(evidenceId,input={}){
    assertUuid(evidenceId,'INVALID_EVIDENCE_ID','Evidence ID 格式无效。');const validityStatus=String(input.validity_status||'');if(!VALIDITY.has(validityStatus))throw new AppError('EVIDENCE_VALIDITY_INVALID','Evidence 有效性状态无效。',422);
    const reviewedBy=String(input.reviewed_by||'').trim();if(!reviewedBy)throw new AppError('EVIDENCE_VALIDITY_REVIEWER_REQUIRED','有效性审核人不能为空。',422);const result=await this.repository.updateEvidenceValidity({id:evidenceId,validityStatus,reviewedBy});if(!result)throw new AppError('EVIDENCE_NOT_FOUND','Evidence 不存在。',404);return result;
  }

  async proposeMapping(projectId,input={}){
    assertUuid(projectId,'INVALID_PROJECT_ID','项目 ID 格式无效。'); assertUuid(input.evidence_id,'INVALID_EVIDENCE_ID','Evidence ID 格式无效。');
    const source=String(input.mapping_source||'manual'); if(!MAPPING_SOURCES.has(source))throw new AppError('EVIDENCE_MAPPING_SOURCE_INVALID','Mapping 来源无效。',422);
    const createdBy=String(input.created_by||'').trim(); if(!createdBy)throw new AppError('EVIDENCE_MAPPING_CREATED_BY_REQUIRED','Mapping 创建人不能为空。',422);
    const invalid=await this.repository.findInvalidConfirmedRequirementIds(projectId,[String(input.requirement_id||'').trim()]);
    if(invalid.length)throw new AppError('EVIDENCE_REQUIREMENT_INVALID','Mapping 必须关联已确认 Requirement。',422);
    const mapping=await this.repository.createRequirementEvidenceMapping({projectId,requirementId:String(input.requirement_id).trim(),evidenceId:input.evidence_id,mappingSource:source,createdBy});
    if(!mapping)throw new AppError('EVIDENCE_NOT_FOUND','Enterprise Evidence 不存在或不属于当前项目。',404); return mapping;
  }

  async decideMapping(mappingId,decision,input={}){
    assertUuid(mappingId,'INVALID_MAPPING_ID','Mapping ID 格式无效。'); if(!MAPPING_DECISIONS.has(decision))throw new AppError('EVIDENCE_MAPPING_DECISION_INVALID','Mapping 审批结论无效。',422);
    const reviewedBy=String(input.reviewed_by||'').trim(); if(!reviewedBy)throw new AppError('EVIDENCE_MAPPING_REVIEWER_REQUIRED','Mapping 审核人不能为空。',422);
    const result=await this.repository.decideRequirementEvidenceMapping({mappingId,decision,reviewedBy}); if(!result)throw new AppError('EVIDENCE_MAPPING_NOT_FOUND','Requirement-Evidence Mapping 不存在。',404); return result;
  }

  async listApprovedForRequirement(projectId,requirementId){
    assertUuid(projectId,'INVALID_PROJECT_ID','项目 ID 格式无效。'); const invalid=await this.repository.findInvalidConfirmedRequirementIds(projectId,[String(requirementId||'').trim()]);
    if(invalid.length)throw new AppError('EVIDENCE_REQUIREMENT_INVALID','Requirement 不存在或未确认。',404); return {evidences:await this.repository.listApprovedEnterpriseEvidenceForRequirement(projectId,requirementId)};
  }
}
