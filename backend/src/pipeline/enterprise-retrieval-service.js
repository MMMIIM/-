import { createHash } from 'node:crypto';
import { AppError } from '../errors.js';
import { EmbeddingError } from './embedding-client.js';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TYPES=new Set(['company_profile','qualification','case','project_case','product','product_documentation','personnel','technical_solution','technical_whitepaper','delivery_capability','historical_bid','other']);
const sha=(value)=>createHash('sha256').update(value).digest('hex');
const topK=(value,fallback)=>{const parsed=value==null?fallback:Number(value);if(!Number.isInteger(parsed)||parsed<1||parsed>50)throw new AppError('RETRIEVAL_TOP_K_INVALID','top_k 必须是 1 至 50 的整数。',422);return parsed;};

export class EnterpriseRetrievalService{
  constructor({repository,embeddingClient,defaultTopK=5,clock=()=>Date.now()}){this.repository=repository;this.embeddingClient=embeddingClient;this.defaultTopK=Number(defaultTopK)||5;this.clock=clock;}
  async retrieve(requirementId,input={}){
    if(!UUID.test(String(requirementId||'')))throw new AppError('INVALID_REQUIREMENT_ID','Requirement ID 格式无效。',400);
    const requirement=await this.repository.getCanonicalRequirementForRetrieval(requirementId);if(!requirement)throw new AppError('REQUIREMENT_NOT_FOUND','Canonical Requirement 不存在或基线未确认。',404);
    if(Object.hasOwn(input,'query_text'))throw new AppError('RETRIEVAL_QUERY_IMMUTABLE','Retrieval Query 必须来自 Canonical Requirement。',422);
    const limit=topK(input.top_k,this.defaultTopK);const materialTypes=[...new Set((input.material_types||[]).map(String))];if(materialTypes.some((type)=>!TYPES.has(type)))throw new AppError('RETRIEVAL_FILTER_INVALID','material_types 包含无效值。',422);
    const config={model:this.embeddingClient.model,version:this.embeddingClient.version,dimension:this.embeddingClient.dimension};const filters={project_id:requirement.project_id,extraction_status:'succeeded',material_types:materialTypes};const started=this.clock();const run=await this.repository.createRetrievalRun({projectId:requirement.project_id,requirementDbId:requirement.id,requirementRef:requirement.req_id,queryText:requirement.text,queryHash:sha(requirement.text),...config,topK:limit,filters});
    try{
      const chunks=await this.repository.listChunksForRetrieval({projectId:requirement.project_id,materialTypes,...config});if(chunks.some((item)=>item.embedding_id&&Number(item.embedding_dimension)!==config.dimension))throw new AppError('EMBEDDING_IDENTITY_CONFLICT','同一 embedding model/version 的维度不一致，请更新 embedding_version。',409);const missing=chunks.filter((item)=>!item.embedding_id);const vectors=await this.embeddingClient.embed([requirement.text,...missing.map((item)=>item.source_text)]);const queryVector=vectors[0];const newEmbeddings=missing.map((chunk,index)=>({chunkId:chunk.chunk_id,chunkHash:chunk.chunk_hash,embedding:vectors[index+1],...config}));
      return await this.repository.completeRetrievalRun({runId:run.retrieval_run_id,queryVector,newEmbeddings,projectId:requirement.project_id,materialTypes,...config,topK:limit,latencyMs:Math.max(0,this.clock()-started)});
    }catch(error){const code=error instanceof EmbeddingError?error.code:error instanceof AppError?error.code:'RETRIEVAL_FAILED';const message=error instanceof EmbeddingError?error.message:'Enterprise Retrieval 执行失败。';await this.repository.failRetrievalRun({runId:run.retrieval_run_id,errorCode:code,errorMessage:message,latencyMs:Math.max(0,this.clock()-started)});throw error instanceof EmbeddingError?error:new AppError(code,message,error instanceof AppError?error.status:500);}
  }
  async get(runId){if(!UUID.test(String(runId||'')))throw new AppError('INVALID_RETRIEVAL_RUN_ID','Retrieval Run ID 格式无效。',400);const result=await this.repository.getRetrievalRun(runId);if(!result)throw new AppError('RETRIEVAL_RUN_NOT_FOUND','Retrieval Run 不存在。',404);return result;}
}
