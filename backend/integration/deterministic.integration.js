import test from 'node:test';
import assert from 'node:assert/strict';
import dotenv from 'dotenv';
import {resolve} from 'node:path';
import {createPool,PgRepository} from '../src/db.js';
import {ProductionBetaService} from '../src/pipeline/production-beta-service.js';
import {buildCanonicalRequirements} from '../src/pipeline/canonical-requirements.js';
dotenv.config({path:resolve('.env')});

test('Canonical Requirement v1 审计字段从候选持久化到正式基线',async()=>{const pool=createPool();const repository=new PgRepository(pool);const project=await repository.createProject({name:`Canonical v1 ${Date.now()}`});try{const file=(await pool.query(`INSERT INTO tender_files(project_id,original_name,storage_key,mime_type,size_bytes) VALUES($1,'canonical.txt',$2,'text/plain',1) RETURNING *`,[project.id,`canonical-${project.id}`])).rows[0];const job=await repository.createParseJob({projectId:project.id,tenderFileId:file.id});await pool.query(`UPDATE tender_parse_jobs SET status='running',phase='extracting',total_chunks=1 WHERE id=$1`,[job.id]);const candidates=buildCanonicalRequirements([{text:'系统应支持数据同步。',category:'data',source_text:'系统应支持数据同步。具体接口范围待确认。',source_context_text:'系统应支持数据同步。具体接口范围待确认。',source_clause_id:'5.1',source_verified:true,source_resolution_status:'verified',source_match_type:'exact_single_paragraph',source_hash:'a'.repeat(64),source_chunk_id:null,source_page_start:1,source_page_end:1,source_paragraph_start:1,source_paragraph_end:1,candidate_index:1}]);await repository.completeParseJob({jobId:job.id,candidates,summary:{canonicalization_audit:candidates.audit},warnings:[],gatewayAudit:{provider:'test'},runtimeMs:1});const parsed=await repository.getParseJob(job.id);assert.equal(parsed.candidates[0].requires_confirmation,true);assert.ok(parsed.candidates[0].confirmation_reasons.includes('EXPLICIT_PENDING_CONFIRMATION'));assert.ok(parsed.candidates[0].risk_flags.includes('INTERFACE_SCOPE_UNSPECIFIED'));assert.equal(parsed.candidates[0].source_evidence.verified,true);assert.equal(parsed.candidates[0].deduplication.rule_version,'4.3-canonical-requirement-1');const result=await repository.confirmRequirementBaseline({jobId:job.id,requirements:parsed.candidates.map((item)=>({...item,target_sections:['chapter-05']})),confirmedBy:'integration'});assert.equal(result.requirements.length,1);const baseline=await repository.getRequirementBaseline(project.id);assert.deepEqual(baseline.requirements[0].confirmation_reasons,parsed.candidates[0].confirmation_reasons);assert.deepEqual(baseline.requirements[0].risk_flags,parsed.candidates[0].risk_flags);assert.equal(baseline.requirements[0].source_evidence.verified,true);}finally{await pool.query(`DELETE FROM projects WHERE id=$1`,[project.id]);await pool.end();}});

test('确定性 Plan 编辑保存 PostgreSQL 快照且 anchor 不可改',async()=>{
 const pool=createPool();const repository=new PgRepository(pool);const project=await repository.createProject({name:`Plan edit ${Date.now()}`});
 try{
  const file=(await pool.query(`INSERT INTO tender_files(project_id,original_name,storage_key,mime_type,size_bytes) VALUES($1,'p.txt',$2,'text/plain',1) RETURNING *`,[project.id,`plan-edit-${project.id}`])).rows[0];
  const job=(await pool.query(`INSERT INTO tender_parse_jobs(project_id,tender_file_id,status,phase) VALUES($1,$2,'succeeded','succeeded') RETURNING *`,[project.id,file.id])).rows[0];
  const baseline=(await pool.query(`INSERT INTO requirement_baselines(project_id,parse_job_id,status) VALUES($1,$2,'building') RETURNING *`,[project.id,job.id])).rows[0];const anchor='平台应提供统一审计能力。';
  await pool.query(`INSERT INTO requirements(baseline_id,project_id,req_id,content,source_excerpt,source_text,is_mandatory,target_sections,ordinal,source_status,confirmation_type,requirement_category,writer_eligible,classification_review_required,atomicity_review_required) VALUES($1,$2,'REQ-001',$3,$3,$3,false,'[]',1,'verified','verified','technical',true,false,true)`,[baseline.id,project.id,anchor]);
  await pool.query(`UPDATE requirement_baselines SET status='confirmed',confirmed_at=now(),confirmed_by='test',confirmation_type='verified' WHERE id=$1`,[baseline.id]);
  const service=new ProductionBetaService({repository,provider:{responsePlanning:()=>{throw new Error('network forbidden')}}});await service.generatePlans(project.id);
  const before=(await repository.listResponsePlans(project.id)).plans[0];assert.equal(before.requirement_anchor,anchor);
  await service.editPlan(project.id,'REQ-001',{response_status:'partial',implementation_actions:['人工动作'],conditions:['甲方提供接口'],capability_gap:'待补充能力',supporting_evidence_ids:[],edited_by:'reviewer',edit_reason:'人工复核'});
  const after=(await repository.listResponsePlans(project.id)).plans[0];assert.equal(after.requirement_anchor,anchor);assert.equal(after.response_status,'partial');
  const audits=(await pool.query(`SELECT * FROM response_plan_edit_audits WHERE response_plan_id=$1`,[after.id])).rows;assert.equal(audits.length,1);assert.equal(audits[0].previous_snapshot.requirement_anchor,anchor);assert.equal(audits[0].current_snapshot.capability_gap,'待补充能力');
  await assert.rejects(()=>service.editPlan(project.id,'REQ-001',{requirement_anchor:'篡改',edited_by:'x',edit_reason:'x'}),(e)=>e.code==='RESPONSE_PLAN_IMMUTABLE_FIELD');
 }finally{await pool.query(`DELETE FROM projects WHERE id=$1`,[project.id]);await pool.end();}
});

test('Batch 生成模式与规则版本持久化且旧记录默认兼容',async()=>{
 const pool=createPool();const repository=new PgRepository(pool);const project=await repository.createProject({name:`Batch mode ${Date.now()}`});
 try{
  const generation=await repository.createDocumentGeneration(project.id,{coverage:{},requirements:[],claims:[],evidence:[]},{batch_generation:'4.3-batch-routing-1'});
  const batch={chapter_id:'chapter-06',batch_index:0,claim_ids:['CLM-1'],input:{approved_claims:[]}};
  await repository.createDocumentTasks(generation.id,[batch]);
  let task=(await repository.getDocumentGeneration(generation.id)).tasks[0];assert.equal(task.generation_mode,'semantic_gateway');assert.equal(task.generation_rule_version,'4.3-batch-routing-1');
  await repository.finishDocumentTask(generation.id,batch,'succeeded',{output_markdown:'固定模板',generation_mode:'deterministic_template',generation_rule_version:'4.3-batch-routing-1'});
  task=(await repository.getDocumentGeneration(generation.id)).tasks[0];assert.equal(task.generation_mode,'deterministic_template');assert.equal(task.generation_rule_version,'4.3-batch-routing-1');
 }finally{await pool.query(`DELETE FROM projects WHERE id=$1`,[project.id]);await pool.end();}
});
