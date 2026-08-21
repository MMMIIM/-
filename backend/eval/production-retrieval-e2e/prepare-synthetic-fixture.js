import dotenv from 'dotenv';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createPool,PgRepository} from '../../src/db.js';
import {LocalFileStorage} from '../../src/storage.js';
import {CompanyMaterialService} from '../../src/company-material-service.js';
import {extractTenderText} from '../../src/tender-text-extractor.js';

const here=dirname(fileURLToPath(import.meta.url)),backend=resolve(here,'../..'),workspace=resolve(backend,'..');
dotenv.config({path:resolve(backend,'.env'),quiet:true});
const PROJECT_NAME='E2E-PRODUCTION-RETRIEVAL-V1 [data_classification=synthetic]';
const CORPUS=resolve(backend,'eval/corpus/representative-sme');
const manifest=JSON.parse(await readFile(resolve(CORPUS,'representative-sme-corpus-manifest-v1.json'),'utf8'));
const requirementSpecs=[
  {req_id:'E2E-REQ-001',kind:'quantitative_performance',text:'数据目录查询在50并发、100万条基准数据、缓存预热并持续执行30分钟的条件下，平均响应时间应不超过1.4秒，P95应不超过1.9秒。'},
  {req_id:'E2E-REQ-002',kind:'compatibility',text:'数据交换平台应兼容x86_64、Ubuntu 22.04和PostgreSQL 14运行环境。'},
  {req_id:'E2E-REQ-003',kind:'qualification',text:'供应商应具备有效的ISO/IEC 27001信息安全管理体系认证。'},
  {req_id:'E2E-REQ-004',kind:'project_experience',text:'供应商应具有数据协同平台项目实施并通过验收的项目经验。'},
];
const materialType=(item)=>item.content_roles.includes('qualification')?'qualification':item.content_roles.some((role)=>['project_case','award_record','contract_record','implementation_record','acceptance_record'].includes(role))?'project_case':item.content_roles.includes('personnel_profile')?'personnel':item.content_roles.includes('delivery_capability')?'delivery_capability':item.content_roles.includes('company_positioning')?'company_profile':item.content_roles.includes('technical_reference')?'technical_whitepaper':'product_documentation';
const sha=(text)=>createHash('sha256').update(text).digest('hex');
const canonical=requirementSpecs.map((item,index)=>({req_id:item.req_id,content:item.text,source_excerpt:item.text,source_text:item.text,source_page:null,source_paragraph:null,target_sections:['technical_response'],ordinal:index+1,is_mandatory:false,mandatory_marker:null,source_section:'Synthetic Production Retrieval E2E',source_clause_id:item.req_id,mandatory_scope_source_text:null,mandatory_scope_section:null,exception_clause_ids:[],source_hash:sha(item.text),source_chunk_id:null,category:'requirement',requires_confirmation:false,source_page_start:null,source_page_end:null,source_paragraph_start:null,source_paragraph_end:null,source_paragraphs_json:[],source_match_type:'exact',source_match_score:1,source_resolution_method:'synthetic_fixture_exact',source_verified:true,source_status:'verified',confirmation_type:'verified',requirement_category:'technical',writer_eligible:true,classification_review_required:false,atomicity_review_required:false,classification_method:'manual',confirmation_reasons:[],risk_flags:[],source_evidence:{data_classification:'synthetic',not_real_customer_data:true},deduplication:{rule_version:'synthetic-production-retrieval-e2e-v1'},canonical_rule_version:'synthetic-production-retrieval-e2e-v1'}));
const pool=createPool(),repository=new PgRepository(pool),storage=new LocalFileStorage(resolve(workspace,'uploads')),materials=new CompanyMaterialService({repository,storage,textExtractor:extractTenderText});
try{
  const existing=(await pool.query(`SELECT id FROM projects WHERE name=$1 ORDER BY created_at LIMIT 1`,[PROJECT_NAME])).rows[0];
  if(existing){const counts=(await pool.query(`SELECT count(DISTINCT m.id)::int materials,count(DISTINCT c.chunk_id)::int chunks,count(DISTINCT r.id)::int requirements FROM projects p LEFT JOIN company_materials m ON m.project_id=p.id LEFT JOIN material_chunks c ON c.material_id=m.id LEFT JOIN requirements r ON r.project_id=p.id WHERE p.id=$1`,[existing.id])).rows[0];if(counts.requirements===0){const job=(await pool.query(`SELECT id FROM tender_parse_jobs WHERE project_id=$1 AND status='succeeded' ORDER BY created_at DESC LIMIT 1`,[existing.id])).rows[0];if(!job)throw new Error('SYNTHETIC_FIXTURE_PARSE_JOB_MISSING');await repository.confirmRequirementBaseline({jobId:job.id,requirements:canonical,confirmedBy:'task-7c-synthetic-fixture'});counts.requirements=requirementSpecs.length;}process.stdout.write(`${JSON.stringify({ok:true,reused:true,project_id:existing.id,data_classification:'synthetic',...counts})}\n`);process.exitCode=counts.materials===manifest.materials.length&&counts.requirements===requirementSpecs.length?0:1;}
  else{
    const project=await repository.createProject({name:PROJECT_NAME});
    for(const item of manifest.materials){const fileName=item.source_reference.split('/').at(-1),buffer=await readFile(resolve(CORPUS,fileName));await materials.upload({projectId:project.id,file:{originalname:fileName,mimetype:'text/markdown',size:buffer.length,buffer},materialType:materialType(item)});}
    const tenderText=`REPRESENTATIVE_SYNTHETIC\nNOT_REAL_CUSTOMER_DATA\ndata_classification: synthetic\n\n${requirementSpecs.map((item)=>`${item.req_id} ${item.text}`).join('\n\n')}`;const tenderBuffer=Buffer.from(tenderText);const storageKey=await storage.save({projectId:project.id,originalName:'production-retrieval-v1-requirements.txt',buffer:tenderBuffer});const tender=await repository.addTenderFile({projectId:project.id,originalName:'production-retrieval-v1-requirements.txt',storageKey,mimeType:'text/plain',sizeBytes:tenderBuffer.length});const job=(await pool.query(`INSERT INTO tender_parse_jobs(project_id,tender_file_id,status,summary_json,extracted_text_sha256,extracted_character_count,started_at,finished_at) VALUES($1,$2,'succeeded',$3::jsonb,$4,$5,now(),now()) RETURNING *`,[project.id,tender.id,JSON.stringify({data_classification:'synthetic',knowledge_origin:'enterprise_representative_sme',not_real_customer_data:true}),sha(tenderText),tenderText.length])).rows[0];
    await repository.confirmRequirementBaseline({jobId:job.id,requirements:canonical,confirmedBy:'task-7c-synthetic-fixture'});
    const chunkCount=Number((await pool.query(`SELECT count(*) FROM material_chunks c JOIN company_materials m ON m.id=c.material_id WHERE m.project_id=$1`,[project.id])).rows[0].count);process.stdout.write(`${JSON.stringify({ok:true,reused:false,project_id:project.id,parse_job_id:job.id,data_classification:'synthetic',knowledge_origin:'enterprise_representative_sme',not_real_customer_data:true,materials:manifest.materials.length,chunks:chunkCount,requirements:requirementSpecs.length,requirement_types:requirementSpecs.map((item)=>item.kind)})}\n`);
  }
}finally{await pool.end();}
