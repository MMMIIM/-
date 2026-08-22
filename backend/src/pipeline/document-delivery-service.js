import { AppError } from '../errors.js';
import { buildBidDocumentModel } from './bid-document-model.js';
import { DOCUMENT_FORMAT_POLICY_VERSION, getDocumentFormatPolicy } from './document-format-policy.js';
import { renderBidDocument } from './docx-renderer.js';

const WORD_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

function safeFilePart(value) {
  return String(value || '项目').replace(/[\\/:*?"<>|\r\n]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80) || '项目';
}

function exportError(code, message, status = 422) {
  return new AppError(code, message, status);
}

export class DocumentDeliveryService {
  constructor({ repository, storage, renderer = renderBidDocument, policy = getDocumentFormatPolicy() }) {
    this.repository = repository;
    this.storage = storage;
    this.renderer = renderer;
    this.policy = policy;
  }

  async prepareExport({ projectId, versionId }) {
    const project = await this.repository.getProject(projectId);
    if (!project) throw exportError('PROJECT_NOT_FOUND', '项目不存在或已被移除。', 404);
    const version = await this.repository.getPipelineDocumentVersion(versionId);
    if (!version) throw exportError('VERSION_NOT_FOUND', '文档版本不存在。', 404);
    if (String(version.project_id) !== String(project.id)) throw exportError('VERSION_PROJECT_MISMATCH', '文档版本不属于当前项目。', 409);
    if (project.current_version_id && String(project.current_version_id) !== String(version.id)) throw exportError('VERSION_NOT_CURRENT', '请选择项目当前版本导出。', 409);
    if (version.status === 'invalidated' || version.status === 'rejected') throw exportError('VERSION_NOT_EXPORTABLE', '该版本已失效，不能导出。', 409);
    if (version.risk_status === 'critical') throw exportError('CRITICAL_RISK', '当前版本存在严重风险，不能导出。', 409);
    if (version.risk_status === 'warning' && version.status !== 'confirmed') throw exportError('WARNING_CONFIRMATION_REQUIRED', '请先完成风险确认，再导出 Word。', 409);
    const approvedProjectFacts = this.repository.listProjectFacts
      ? (await this.repository.listProjectFacts(project.id)).filter((fact) => fact.review_status === 'approved' && fact.conflict_status !== 'conflict')
      : [];
    const model = buildBidDocumentModel({ project, version, approvedProjectFacts });
    return { project, version, model };
  }

  async exportWord({ projectId, versionId }) {
    const prepared = await this.prepareExport({ projectId, versionId });
    const buffer = await this.renderer(prepared.model, { policy: this.policy });
    const fileName = `${safeFilePart(prepared.project.name)}-技术标-V${prepared.version.version_number}.docx`;
    const storageKey = await this.storage.save({ projectId, originalName: fileName, buffer });
    const sourceHash = prepared.model.source.final_text_hash;
    const audit = await this.repository.createDocumentExport({
      projectId, versionId: prepared.version.id, fileName, storageKey, mimeType: WORD_MIME,
      fileSizeBytes: buffer.length, sourceHash, modelVersion: prepared.model.model_version,
      renderer: 'docx', policyVersion: DOCUMENT_FORMAT_POLICY_VERSION
    });
    return { ...prepared, audit, fileName, mimeType: WORD_MIME, buffer, fileSizeBytes: buffer.length };
  }
}

export { WORD_MIME, safeFilePart };
