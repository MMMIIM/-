import test from 'node:test';
import assert from 'node:assert/strict';
import { CLAIM_GATE_V2_DECISIONS,CLAIM_GATE_V2_DIMENSIONS,CLAIM_GATE_V2_REASON_CODES,createClaimGateEvaluationContract,projectLegacyClaimDecision } from '../src/pipeline/claim-gate-v2-contract.js';

const dimensions=(value='unknown')=>({
  subject_match:value,scope_match:value,status_match:value,quantitative_match:value,
  entity_match:value,validity_match:value,support_sufficiency:value,source_authority:value
});
const valid=(decision,extra={})=>({decision,dimensions:dimensions(),reason_codes:[],allowed_scope:[],required_conditions:[],evidence_ids:[],mapping_ids:[],deterministic_checks:[],semantic_assessment:null,semantic_assessment_used:false,human_review_required:decision==='needs_review',evaluated_by:'backend-contract-test',...extra});

test('四态 decision 产生安全 legacy projection 和 writer eligibility',()=>{
  assert.deepEqual(CLAIM_GATE_V2_DECISIONS,['allow','restrict','reject','needs_review']);
  for(const [decision,writer,legacy] of [['allow',true,'approved'],['reject',false,'rejected'],['needs_review',false,null],['restrict',false,null]]){const result=createClaimGateEvaluationContract(valid(decision));assert.equal(result.writer_eligible,writer);assert.equal(result.legacy_decision_projection,legacy);assert.equal(projectLegacyClaimDecision(decision),legacy);}
});

test('完整 dimensions 与 unknown 合法，非法枚举、缺失和额外字段拒绝',()=>{
  assert.deepEqual(createClaimGateEvaluationContract(valid('allow')).dimensions,dimensions());
  assert.throws(()=>createClaimGateEvaluationContract(valid('allow',{dimensions:{...dimensions(),scope_match:'broad'}})),(error)=>error.code==='CLAIM_GATE_V2_DIMENSION_VALUE_INVALID');
  const missing=dimensions();delete missing.entity_match;assert.throws(()=>createClaimGateEvaluationContract(valid('allow',{dimensions:missing})),(error)=>error.code==='CLAIM_GATE_V2_DIMENSIONS_INVALID');
  assert.throws(()=>createClaimGateEvaluationContract(valid('allow',{dimensions:{...dimensions(),medical_match:'match'}})),(error)=>error.code==='CLAIM_GATE_V2_DIMENSIONS_INVALID');
});

test('非法 reason code 拒绝且 Core reason codes 保持 domain-neutral',()=>{
  assert.throws(()=>createClaimGateEvaluationContract(valid('reject',{reason_codes:['MEDICAL_CERTIFICATE_MISSING']})),(error)=>error.code==='CLAIM_GATE_V2_REASON_CODE_INVALID');
  assert.equal(CLAIM_GATE_V2_REASON_CODES.some((code)=>/smart_city|medical|智慧城市|医疗器械/i.test(code)),false);
  assert.deepEqual(Object.keys(CLAIM_GATE_V2_DIMENSIONS),['subject_match','scope_match','status_match','quantitative_match','entity_match','validity_match','support_sufficiency','source_authority']);
});

test('needs_review 强制人工复核，restrict 不会投影为 approved',()=>{
  assert.throws(()=>createClaimGateEvaluationContract(valid('needs_review',{human_review_required:false})),(error)=>error.code==='CLAIM_GATE_V2_HUMAN_REVIEW_REQUIRED');
  assert.equal(createClaimGateEvaluationContract(valid('restrict')).legacy_decision_projection,null);
});

test('Contract 对通用软件和医疗器械文本不包含行业判断',()=>{
  for(const text of ['系统应支持第三方平台数据交换。','投标产品须具有有效医疗器械注册证。']){const result=createClaimGateEvaluationContract(valid('needs_review',{deterministic_checks:[{check:'claim_text_present',passed:Boolean(text)}],reason_codes:['HUMAN_REVIEW_REQUIRED']}));assert.equal(result.decision,'needs_review');assert.equal(result.deterministic_checks[0].passed,true);}
});
