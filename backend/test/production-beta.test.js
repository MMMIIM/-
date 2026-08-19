import test from 'node:test';
import assert from 'node:assert/strict';
import { EvidenceCatalogService } from '../src/pipeline/evidence-catalog-service.js';
import { ResponsePlanValidator } from '../src/pipeline/response-plan-validator.js';
import { ClaimGateService } from '../src/pipeline/claim-gate-service.js';
import { CoverageValidator } from '../src/pipeline/coverage-validator.js';
import { ProductionTaskProvider } from '../src/pipeline/production-task-provider.js';
import { ProductionBetaService } from '../src/pipeline/production-beta-service.js';

const requirements=[
  {req_id:'REQ-001',text:'系统应支持数据接入',is_mandatory:true,source_status:'verified',confirmation_type:'verified',requirement_category:'technical',writer_eligible:true,classification_review_required:false,atomicity_review_required:true},
  {req_id:'REQ-002',text:'提供实施计划',is_mandatory:false,source_status:'provisional',confirmation_type:'provisional_individual',requirement_category:'implementation',writer_eligible:true,classification_review_required:false,atomicity_review_required:false},
  {req_id:'REQ-003',text:'报价不得超过预算',is_mandatory:true,source_status:'verified',requirement_category:'commercial',writer_eligible:false},
  {req_id:'REQ-004',text:'项目背景说明',is_mandatory:false,source_status:'verified',requirement_category:'context',writer_eligible:false},
  {req_id:'REQ-005',text:'投标人资质要求',is_mandatory:false,source_status:'verified',requirement_category:'qualification',writer_eligible:false}
];
const evidence=[{evidence_id:'EVI-001',content:'已有接入能力',approval_status:'approved'},{evidence_id:'EVI-DRAFT',content:'草稿',approval_status:'draft'}];
const plan=(id,extra={})=>({requirement_id:id,response_status:'full',response_summary:'响应',implementation_actions:[],optional_design:[],deliverables:[],acceptance_methods:[],conditions:[],supporting_evidence_ids:['EVI-001'],capability_gap:'',...extra});

test('writer eligible REQ 恰好一个 Plan，禁用类别不进入且 target_sections 后端覆盖',()=>{
  const validator=new ResponsePlanValidator({requirements,evidenceCatalog:new EvidenceCatalogService(evidence)});
  const result=validator.validate([plan('REQ-001',{target_sections:['model-section']}),plan('REQ-002',{conditions:['范围确认后执行']})]);
  assert.deepEqual(result.plans.map((item)=>item.requirement_id),['REQ-001','REQ-002']);
  assert.notDeepEqual(result.plans[0].target_sections,['model-section']); assert.equal(result.warnings[0].code,'MODEL_TARGET_SECTIONS_IGNORED');
  assert.equal(result.plans[1].source_status,'provisional'); assert.equal(result.plans[1].confirmation_type,'provisional_individual');
  assert.throws(()=>validator.validate([plan('REQ-001'),plan('REQ-001'),plan('REQ-002')]),(error)=>error.code==='DUPLICATE_RESPONSE_PLAN');
  assert.throws(()=>validator.validate([plan('REQ-001'),plan('REQ-X')]),(error)=>error.code==='PLAN_REQUIREMENT_INVALID');
});

test('full + conditions 合法；partial 只允许真实 capability gap',()=>{
  const validator=new ResponsePlanValidator({requirements,evidenceCatalog:new EvidenceCatalogService(evidence)});
  assert.equal(validator.validate([plan('REQ-001',{conditions:['经确认后']}),plan('REQ-002')]).plans[0].response_status,'full');
  assert.throws(()=>validator.validate([plan('REQ-001',{response_status:'partial'}),plan('REQ-002')]),(error)=>error.code==='CAPABILITY_GAP_REQUIRED');
  assert.throws(()=>validator.validate([plan('REQ-001',{capability_gap:'不是 partial'}),plan('REQ-002')]),(error)=>error.code==='CAPABILITY_GAP_NOT_ALLOWED');
  assert.throws(()=>validator.validate([plan('REQ-001',{supporting_evidence_ids:['EVI-DRAFT']}),plan('REQ-002')]),(error)=>error.code==='EVIDENCE_NOT_APPROVED');
});

test('Claim ID 与 target_sections 由后端覆盖，confirmed/conditional 和未知依据受门禁',()=>{
  const plans=[plan('REQ-001'),plan('REQ-002',{conditions:['范围确认后执行']})];
  const gate=new ClaimGateService({projectId:'project',requirements,evidenceCatalog:new EvidenceCatalogService(evidence),plans});
  const {evaluated,warnings}=gate.evaluate([
    {claim_id:'MODEL',requirement_id:'REQ-001',claim_type:'requirement_response',text:'系统应支持数据接入',basis_requirement_ids:['REQ-001'],basis_evidence_ids:[],requested_commitment:'confirmed',target_sections:['x']},
    {requirement_id:'REQ-002',claim_type:'requirement_response',text:'提供实施计划；以确认范围为准',basis_requirement_ids:['REQ-002'],basis_evidence_ids:[],requested_commitment:'conditional'},
    {requirement_id:'REQ-X',claim_type:'requirement_response',text:'未知',basis_requirement_ids:['REQ-X'],basis_evidence_ids:[],requested_commitment:'confirmed'}
  ]);
  assert.deepEqual(evaluated.map((item)=>item.decision.decision),['approved','approved','rejected']);
  assert.match(evaluated[0].claim.claim_id,/^CLM-[A-F0-9]{16}$/); assert.notDeepEqual(evaluated[0].claim.target_sections,['x']);
  assert.equal(gate.evaluate([{requirement_id:'REQ-001',claim_type:'requirement_response',text:'系统应支持数据接入',basis_requirement_ids:['REQ-001'],basis_evidence_ids:[],requested_commitment:'confirmed'}]).evaluated[0].claim.claim_id,evaluated[0].claim.claim_id);
  assert.throws(()=>gate.evaluate([{requirement_id:'REQ-001',claim_type:'requirement_response',text:'重复',basis_requirement_ids:['REQ-001'],basis_evidence_ids:[],requested_commitment:'confirmed'},{requirement_id:'REQ-001',claim_type:'requirement_response',text:'重复',basis_requirement_ids:['REQ-001'],basis_evidence_ids:[],requested_commitment:'confirmed'}]),(error)=>error.code==='DUPLICATE_CLAIM');
  assert.equal(evaluated[1].claim.source_status,'provisional'); assert.ok(warnings.some((item)=>item.code==='MODEL_CLAIM_ID_IGNORED'));
});

test('无依据指标、责任转移及企业能力被拒，rejected 永不进入 Writer',()=>{
  const gate=new ClaimGateService({requirements,evidenceCatalog:new EvidenceCatalogService(evidence),plans:[plan('REQ-001')]});
  const {evaluated}=gate.evaluate([
    {requirement_id:'REQ-001',claim_type:'quantitative',text:'可用率99.99%',basis_requirement_ids:['REQ-001'],basis_evidence_ids:[],requested_commitment:'confirmed'},
    {requirement_id:'REQ-001',claim_type:'responsibility_transfer',text:'全部责任由第三方承担',basis_requirement_ids:['REQ-001'],basis_evidence_ids:[],requested_commitment:'confirmed'},
    {requirement_id:'REQ-001',claim_type:'company_case',text:'拥有百个案例',basis_requirement_ids:['REQ-001'],basis_evidence_ids:[],requested_commitment:'confirmed'},
    {requirement_id:'REQ-001',claim_type:'requirement_response',text:'系统应支持数据接入',basis_requirement_ids:['REQ-001'],basis_evidence_ids:[],requested_commitment:'confirmed'}
  ]);
  assert.deepEqual(evaluated.map((item)=>item.decision.decision),['rejected','rejected','rejected','approved']);
  assert.equal(gate.writerInput(evaluated).length,1);
});

test('Coverage 排除 commercial/context，mandatory uncovered 为 critical 并保留复核统计',()=>{
  const result=new CoverageValidator().validate({requirements,plans:[plan('REQ-001'),plan('REQ-002')],evaluatedClaims:[]});
  assert.equal(result.writer_eligible_requirement_count,2); assert.equal(result.mandatory_requirement_count,1);
  assert.deepEqual(result.mandatory_uncovered_ids,['REQ-001']); assert.equal(result.risk_status,'critical');
  assert.equal(result.provisional_requirement_count,1); assert.equal(result.atomicity_review_count,1);
  assert.equal(result.coverage.some((item)=>item.requirement_id==='REQ-003'),false);
  assert.equal(result.coverage.some((item)=>item.requirement_id==='REQ-005'),false);
});

test('mock provider 完成独立规划与 Claim 生成，semantic 输出禁用字段不回退',async()=>{
  const mock=new ProductionTaskProvider({provider:'mock'}); const planned=await mock.responsePlanning({requirements:requirements.slice(0,2)});
  assert.equal(planned.items.length,2); const claimed=await mock.claimGeneration({requirements:requirements.slice(0,2),plans:planned.items}); assert.equal(claimed.items.length,2);
  const bad=new ProductionTaskProvider({provider:'semantic_gateway',planClient:{run:async()=>({envelope:{data:{response_plans:[{requirement_id:'REQ-001',result:'forbidden'}]},warnings:[]}})}});
  await assert.rejects(()=>bad.responsePlanning({}),(error)=>error.code==='PROVIDER_SCHEMA_INVALID');
});

test('未确认/空基线明确阻断，contractual 只生成约束记录',async()=>{
  const id='11111111-1111-4111-8111-111111111111';
  const missing=new ProductionBetaService({repository:{getProject:async()=>({id}),getRequirementBaseline:async()=>null},provider:new ProductionTaskProvider({provider:'mock'})});
  await assert.rejects(()=>missing.generatePlans(id),(error)=>error.code==='REQUIREMENT_BASELINE_REQUIRED'&&error.status===409);
  const empty=new ProductionBetaService({repository:{getProject:async()=>({id}),getRequirementBaseline:async()=>({id:'b'}),getFormalRequirements:async()=>[]},provider:new ProductionTaskProvider({provider:'mock'})});
  await assert.rejects(()=>empty.generatePlans(id),(error)=>error.code==='REQUIREMENT_BASELINE_EMPTY');
  let saved;const formal=[requirements[0],{req_id:'REQ-C',text:'合同责任边界',source_status:'verified',confirmation_type:'verified',requirement_category:'contractual',writer_eligible:false}];
  const repository={getProject:async()=>({id}),getRequirementBaseline:async()=>({id:'b'}),getFormalRequirements:async()=>formal,listApprovedEvidence:async()=>[],replaceResponsePlans:async(_id,value)=>{saved=value;},listResponsePlans:async()=>({plans:saved.plans,constraint_records:saved.constraints})};
  const service=new ProductionBetaService({repository,provider:new ProductionTaskProvider({provider:'mock'})});const result=await service.generatePlans(id);
  assert.equal(result.plans.length,1);assert.equal(result.constraint_records.length,1);assert.equal(result.constraint_records[0].requirement_id,'REQ-C');
});
