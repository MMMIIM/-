import dotenv from 'dotenv';
import { resolve } from 'node:path';
import { createPool, PgRepository } from '../../src/db.js';
import { EvidenceReviewService } from '../../src/evidence-review-service.js';
import { EvidenceSourceFactService } from '../../src/evidence-source-fact-service.js';
import { ProjectAuthorizationService } from '../../src/project-authorization-service.js';

dotenv.config({path:resolve(process.cwd(),'backend/.env'),quiet:true});
const PROJECT_ID='ac1a1037-5e62-44ee-8c28-7b09d48d93e6';
const REQUIREMENTS=['E2E-REQ-001','E2E-REQ-002','E2E-REQ-003','E2E-REQ-004'];
const pool=createPool();
const repository=new PgRepository(pool);

const fixtureFacts=(context)=>{
  const source=context.source_text;
  if(source.includes('平均 1.4 秒')&&source.includes('P95 1.9 秒'))return[
    {subject:{type:'product',name:'澄明数据交换平台 V3.2'},entities:[],status:'unknown',scopes:[],quantities:[{metric:'concurrency',value:'50',unit:'concurrent_user'}],validity:{status:'unknown'},domain_metadata:{}},
    {subject:{type:'product',name:'澄明数据交换平台 V3.2'},entities:[],status:'unknown',scopes:[],quantities:[{metric:'average_response_time',value:'1.4',unit:'second',conditions:{concurrency:'50'}}],validity:{status:'unknown'},domain_metadata:{}},
    {subject:{type:'product',name:'澄明数据交换平台 V3.2'},entities:[],status:'unknown',scopes:[],quantities:[{metric:'p95_response_time',value:'1.9',unit:'second',conditions:{concurrency:'50'}}],validity:{status:'unknown'},domain_metadata:{}}
  ];
  if(source.includes('x86_64 + Ubuntu 22.04 + PostgreSQL 14'))return[{subject:{type:'product',name:null},entities:[],status:'unknown',scopes:['x86_64','Ubuntu 22.04','PostgreSQL 14'],scope_source_texts:{x86_64:'x86_64 + Ubuntu 22.04 + PostgreSQL 14', 'Ubuntu 22.04':'x86_64 + Ubuntu 22.04 + PostgreSQL 14','PostgreSQL 14':'x86_64 + Ubuntu 22.04 + PostgreSQL 14'},quantities:[],validity:{status:'unknown'},domain_metadata:{}}];
  if(source.includes('ISO/IEC 27001'))return[{subject:{type:'qualification',name:'ISO/IEC 27001'},entities:[{type:'certificate',name:'ISO/IEC 27001',identifier:'CM-Q-27001-2024'}],status:'unknown',scopes:[],quantities:[],validity:{status:'known',valid_until:'2027-11-30'},domain_metadata:{}}];
  if(source.includes('南泽业务协同升级片段（虚构）'))return[{subject:{type:'project',name:'南泽业务协同升级片段（虚构）'},entities:[{type:'customer',name:'南泽公共服务机构（虚构）'}],status:'unknown',scopes:[],quantities:[],validity:{status:'unknown'},domain_metadata:{}}];
  return[];
};
class DeterministicFixtureExtractor {constructor(){this.version='task-8c-deterministic-fixture-v1';this.calls=0;}async extract(context){this.calls+=1;return fixtureFacts(context);}}
const boundaries=async()=>{const{rows}=await pool.query(`SELECT (SELECT count(*)::int FROM requirement_evidence_mappings rem JOIN requirements r ON r.id=rem.requirement_id WHERE r.project_id=$1 AND rem.mapping_status='approved') approved_mappings,(SELECT count(*)::int FROM claims WHERE project_id=$1) claims,(SELECT count(*)::int FROM document_generations WHERE project_id=$1) generations,(SELECT count(*)::int FROM evidence_facts WHERE project_id=$1) legacy_facts`,[PROJECT_ID]);return rows[0];};

try{
  const before=await boundaries();
  const {rows:reviews}=await pool.query(`SELECT DISTINCT ON (r.req_id) r.req_id,ecr.review_id,ecr.review_status FROM evidence_candidate_reviews ecr JOIN requirements r ON r.id=ecr.requirement_id WHERE ecr.project_id=$1 AND r.req_id=ANY($2::text[]) ORDER BY r.req_id,ecr.created_at DESC`,[PROJECT_ID,REQUIREMENTS]);
  if(reviews.length!==4)throw Object.assign(new Error('四类 Evidence Review 输入不完整。'),{code:'EVIDENCE_FACT_E2E_INPUT_INCOMPLETE'});
  const reviewService=new EvidenceReviewService({repository});
  for(const review of reviews)if(['proposed','needs_review'].includes(review.review_status))await reviewService.decide(review.review_id,'approve',{reviewer:'task-8c-e2e-human',note:'Synthetic E2E Source Span 逐字核验'});
  const extractor=new DeterministicFixtureExtractor();
  const actor={actor_id:'task-8c-e2e-human',actor_type:'maintenance',source:'maintenance_cli'};
  await repository.upsertProjectMembership({projectId:PROJECT_ID,actorId:actor.actor_id,role:'OWNER',status:'ACTIVE',createdBy:actor.actor_id});
  const service=new EvidenceSourceFactService({repository,projectAuthorizationService:new ProjectAuthorizationService({repository}),extractor});
  const cases=[];
  for(const review of reviews){const result=await service.extract({projectId:PROJECT_ID,reviewId:review.review_id,actor});if(!result.facts.length)throw Object.assign(new Error(`${review.req_id} 未产生 Fact Candidate。`),{code:'EVIDENCE_FACT_E2E_EMPTY'});cases.push({requirement_id:review.req_id,review_id:review.review_id,fact_count:result.facts.length,facts:result.facts.map((fact)=>({fact_id:fact.fact_id,status:fact.fact_status,review_status:fact.review_status,version:fact.version,subject:fact.subject,entities:fact.entities,scopes:fact.scopes,quantities:fact.quantities,validity:fact.validity,source_span_id:fact.source_span_id,source_hash:fact.source?.source_text_hash}))});}
  const facts=await repository.listEvidenceSourceFacts(PROJECT_ID);
  const selected=facts.filter((fact)=>reviews.some((review)=>review.review_id===fact.evidence_review_id));
  const after=await boundaries();
  if(JSON.stringify(before)!==JSON.stringify(after))throw Object.assign(new Error('Fact E2E 产生了禁止的 Mapping/Claim/Writer 副作用。'),{code:'EVIDENCE_FACT_BOUNDARY_VIOLATION'});
  const stats={evidence_reviews_count:reviews.length,fact_candidates_count:selected.length,needs_human_review_count:selected.filter((fact)=>fact.review_status==='draft').length,approved_facts_count:selected.filter((fact)=>fact.review_status==='approved').length,rejected_facts_count:selected.filter((fact)=>fact.review_status==='rejected').length,edited_facts_count:selected.filter((fact)=>fact.edited).length,facts_per_review_ratio:selected.length/reviews.length,compression_reduction_ratio:1-(selected.length/reviews.length)};
  console.log(JSON.stringify({schema_version:'evidence-fact-e2e-v1',contract_version:'evidence-fact-v1',data_classification:'REPRESENTATIVE_SYNTHETIC / NOT_REAL_CUSTOMER_DATA',project_id:PROJECT_ID,external_provider_calls:0,llm_calls:0,extractor_calls:extractor.calls,statistics:stats,cases,before,after},null,2));
}catch(error){console.error(JSON.stringify({ok:false,error:{code:error.code||'EVIDENCE_FACT_E2E_FAILED',message:error.message}}));process.exitCode=1;}finally{await pool.end();}
