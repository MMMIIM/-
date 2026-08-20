import test from 'node:test';
import assert from 'node:assert/strict';
import { EmbeddingClient, EmbeddingError } from '../src/pipeline/embedding-client.js';
import { EnterpriseRetrievalService } from '../src/pipeline/enterprise-retrieval-service.js';

const REQUIREMENT_ID='00000000-0000-4000-8000-000000000001';
const PROJECT_ID='00000000-0000-4000-8000-000000000002';

test('Embedding Client 验证批量数量、维度和有限数值',async()=>{
  const requests=[];const client=new EmbeddingClient({apiBase:'https://embedding.invalid/v1',apiKey:'secret',model:'fixture',version:'v1',dimension:3,fetchImpl:async(_url,init)=>{requests.push(JSON.parse(init.body));return new Response(JSON.stringify({data:[{index:1,embedding:[0,1,0]},{index:0,embedding:[1,0,0]}]}),{status:200,headers:{'content-type':'application/json'}});}});
  assert.deepEqual(await client.embed(['query','chunk']),[[1,0,0],[0,1,0]]);assert.equal(requests.length,1);assert.deepEqual(requests[0],{model:'fixture',input:['query','chunk'],dimensions:3});
  const invalid=new EmbeddingClient({apiBase:'x',apiKey:'x',model:'x',version:'x',dimension:3,fetchImpl:async()=>new Response(JSON.stringify({data:[{index:0,embedding:[1,0]}]}),{status:200})});await assert.rejects(()=>invalid.embed(['x']),(error)=>error.code==='EMBEDDING_DIMENSION_MISMATCH');
});

test('Retrieval Query 只使用 Canonical Requirement 且不创建 Evidence',async()=>{
  let completed;let evidenceWrites=0;const repository={getCanonicalRequirementForRetrieval:async()=>({id:REQUIREMENT_ID,project_id:PROJECT_ID,req_id:'REQ-001',text:'国产化部署',requirement_category:'technical'}),createRetrievalRun:async(value)=>({retrieval_run_id:'run',...value}),listChunksForRetrieval:async()=>[{chunk_id:'C1',chunk_hash:'H1',source_text:'麒麟环境',embedding_id:null}],completeRetrievalRun:async(value)=>{completed=value;return{run:{status:'succeeded'},results:[]};},failRetrievalRun:async()=>{},createEvidenceRecord:async()=>{evidenceWrites+=1;}};
  const embeddingClient={model:'fixture',version:'v1',dimension:3,embed:async(texts)=>{assert.deepEqual(texts,['国产化部署','麒麟环境']);return[[1,0,0],[.9,.1,0]];}};const service=new EnterpriseRetrievalService({repository,embeddingClient,defaultTopK:4,clock:()=>10});
  await assert.rejects(()=>service.retrieve(REQUIREMENT_ID,{query_text:'伪造'}),(error)=>error.code==='RETRIEVAL_QUERY_IMMUTABLE');const result=await service.retrieve(REQUIREMENT_ID,{});assert.equal(result.run.status,'succeeded');assert.equal(completed.topK,4);assert.equal(completed.newEmbeddings.length,1);assert.equal(evidenceWrites,0);
});

test('Embedding failure 必须持久化 failed run 且不伪造向量',async()=>{
  let failure;let completed=false;const repository={getCanonicalRequirementForRetrieval:async()=>({id:REQUIREMENT_ID,project_id:PROJECT_ID,req_id:'REQ-001',text:'query'}),createRetrievalRun:async()=>({retrieval_run_id:'run'}),listChunksForRetrieval:async()=>[{chunk_id:'C1',chunk_hash:'H1',source_text:'chunk'}],completeRetrievalRun:async()=>{completed=true;},failRetrievalRun:async(value)=>{failure=value;}};const client={model:'fixture',version:'v1',dimension:3,embed:async()=>{throw new EmbeddingError('EMBEDDING_TIMEOUT','Embedding 服务超时。',504);}};
  await assert.rejects(()=>new EnterpriseRetrievalService({repository,embeddingClient:client}).retrieve(REQUIREMENT_ID),(error)=>error.code==='EMBEDDING_TIMEOUT');assert.equal(failure.errorCode,'EMBEDDING_TIMEOUT');assert.equal(completed,false);
});
