import test from 'node:test';
import assert from 'node:assert/strict';
import { EvidenceCatalogService } from '../src/pipeline/evidence-catalog-service.js';
import { ResponsePlanValidator } from '../src/pipeline/response-plan-validator.js';
import { ClaimGateService } from '../src/pipeline/claim-gate-service.js';
import { CoverageValidator } from '../src/pipeline/coverage-validator.js';

const requirements=[{req_id:'REQ-001',text:'系统应支持数据接入',is_mandatory:true,source_status:'verified',writer_eligible:true},{req_id:'REQ-002',text:'提供实施计划',is_mandatory:false,source_status:'provisional',writer_eligible:true}];
const evidence=[{evidence_id:'EVI-001',project_id:'p',material_id:'m',source_type:'company_material',source_roles:['capability'],module:'integration',content:'已有接入能力',source_page:1,source_hash:'sha256:x',evidence_level:'verified',commitment_level:'capability',approval_status:'approved'}];
const plan=(id,extra={})=>({requirement_id:id,response_status:'full',response_summary:'响应',implementation_actions:[],optional_design:null,deliverables:[],acceptance_methods:[],conditions:[],supporting_evidence_ids:['EVI-001'],capability_gap:null,...extra});

test('每个正式 REQ 必须且只能有一条 Plan，target_sections 由后端生成',()=>{
  const validator=new ResponsePlanValidator({requirements,evidenceCatalog:new EvidenceCatalogService(evidence)});
  const result=validator.validate([plan('REQ-001'),plan('REQ-002')]);
  assert.deepEqual(result.map(x=>x.requirement_id),['REQ-001','REQ-002']); assert.ok(result[0].target_sections.length);
  assert.deepEqual(result.map(x=>x.source_status),['verified','provisional']);
  assert.throws(()=>validator.validate([plan('REQ-001'),plan('REQ-001'),plan('REQ-002')]),e=>e.code==='DUPLICATE_RESPONSE_PLAN');
  assert.throws(()=>validator.validate([plan('REQ-001')]),e=>e.code==='RESPONSE_PLAN_MISSING');
});

test('非法 Evidence-ID 与 partial 缺 capability_gap 被拒绝',()=>{
  const validator=new ResponsePlanValidator({requirements,evidenceCatalog:new EvidenceCatalogService(evidence)});
  assert.throws(()=>validator.validate([plan('REQ-001',{supporting_evidence_ids:['EVI-X']}),plan('REQ-002')]),e=>e.code==='EVIDENCE_NOT_FOUND');
  assert.throws(()=>validator.validate([plan('REQ-001',{response_status:'partial'}),plan('REQ-002')]),e=>e.code==='CAPABILITY_GAP_REQUIRED');
});

test('无依据、高风险定量承诺和责任转移 Claim 被审计拒绝且不进入 Writer',()=>{
  const gate=new ClaimGateService({requirements,evidenceCatalog:new EvidenceCatalogService(evidence)});
  const evaluated=gate.evaluate([
    {claim_id:'CLM-1',claim_type:'statement',text:'无依据',basis_requirement_ids:[],basis_evidence_ids:[]},
    {claim_id:'CLM-2',claim_type:'quantitative',text:'99.99%',basis_requirement_ids:['REQ-001'],basis_evidence_ids:[]},
    {claim_id:'CLM-3',claim_type:'responsibility_transfer',text:'由第三方承担',basis_requirement_ids:['REQ-001'],basis_evidence_ids:[]},
    {claim_id:'CLM-4',claim_type:'statement',text:'支持接入',basis_requirement_ids:['REQ-001'],basis_evidence_ids:['EVI-001']}
  ]);
  assert.deepEqual(evaluated.map(x=>x.decision.decision),['rejected','rejected','rejected','approved']);
  assert.equal(evaluated[3].claim.basis_requirement_source_statuses['REQ-001'],'verified');
  assert.deepEqual(gate.writerInput(evaluated).map(x=>x.claim_id),['CLM-4']);
});

test('mandatory Requirement 没有 Approved Claim 时覆盖终检失败',()=>{
  const gate=new ClaimGateService({requirements,evidenceCatalog:new EvidenceCatalogService(evidence)});
  const evaluated=gate.evaluate([{claim_id:'CLM-2',claim_type:'statement',text:'计划',basis_requirement_ids:['REQ-002'],basis_evidence_ids:['EVI-001']}]);
  const result=new CoverageValidator().validate({requirements,evaluatedClaims:evaluated});
  assert.equal(result.valid,false); assert.deepEqual(result.uncovered_mandatory_ids,['REQ-001']);
});
