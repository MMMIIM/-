import { AppError } from './errors.js';
import { EvidenceSourceContextResolver } from './pipeline/evidence-source-context-resolver.js';

export class EvidenceSourceSpanService {
  constructor({ repository, resolver=new EvidenceSourceContextResolver() }) { this.repository=repository;this.resolver=resolver; }

  async resolve({ projectId, materialId, anchorChunkId, strategy='auto' }) {
    const material=await this.repository.getCompanyMaterial(materialId);
    if(!material||material.project_id!==projectId)throw new AppError('MATERIAL_NOT_FOUND','企业材料不存在或不属于当前项目。',404);
    const chunks=await this.repository.listMaterialChunks(materialId);
    return this.repository.upsertEvidenceSourceSpan(this.resolver.resolve({material,chunks,anchorChunkId,strategy}));
  }

  async resolveFromRetrieval({ projectId, requirementId, retrievalRunId, anchorChunkId, strategy='auto' }) {
    const source=await this.repository.getRetrievalEvidenceSource({projectId,requirementId,retrievalRunId,chunkId:anchorChunkId});
    if(!source)throw new AppError('ANCHOR_CHUNK_NOT_FOUND','Retrieval Candidate Anchor 不存在或不属于指定运行。',404);
    if(source.status!=='succeeded')throw new AppError('RETRIEVAL_RUN_NOT_READY','Retrieval Run 尚未成功。',409);
    return this.resolve({projectId,materialId:source.material_id,anchorChunkId,strategy});
  }
}
