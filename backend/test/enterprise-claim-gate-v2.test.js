import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateEnterpriseClaimV2} from '../src/pipeline/enterprise-claim-gate-v2.js';

const projectId='00000000-0000-4000-8000-000000000001';
const claim={requirement_id:'REQ-030',basis_evidence_ids:['EVD-1']};
const binding=(extra={})=>({project_id:projectId,requirement_id:'REQ-030',mapping_id:'MAP-1',mapping_status:'approved',support_level:'partial_support',evidence_id:'EVD-1',approval_status:'approved',validity_status:'active',source_lineage_verified:true,usable_for_claims:true,material_type:'project_case',evidence_scope:['award_fact'],...extra});
const run=(extra={})=>evaluateEnterpriseClaimV2({projectId,claim,binding:binding(extra)});

test('full/partial support 只投影支撑充分度，未知语义维度保持 unknown',()=>{const full=run({support_level:'full_support'});assert.equal(full.decision,'needs_review');assert.equal(full.dimensions.support_sufficiency,'sufficient');assert.equal(full.dimensions.scope_match,'unknown');assert.equal(full.dimensions.status_match,'unknown');assert.equal(full.dimensions.entity_match,'unknown');assert.equal(run().dimensions.support_sufficiency,'partial');});
test('reference_only 被限制且不得进入 Writer',()=>{const result=run({support_level:'reference_only',usable_for_claims:true});assert.equal(result.decision,'restrict');assert.equal(result.dimensions.support_sufficiency,'insufficient');assert.equal(result.writer_eligible,false);assert.ok(result.reason_codes.includes('REFERENCE_ONLY'));});
test('historical_bid 即使 lineage 完整也不可用',()=>{const result=run({material_type:'historical_bid',usable_for_claims:false});assert.equal(result.decision,'reject');assert.ok(result.reason_codes.includes('SOURCE_NOT_USABLE'));});
test('没有 Mapping、proposed/rejected Mapping 与跨项目 Mapping 均拒绝',()=>{for(const value of [null,binding({mapping_status:'proposed'}),binding({mapping_status:'rejected'}),binding({project_id:'00000000-0000-4000-8000-000000000002'})]){const result=evaluateEnterpriseClaimV2({projectId,claim,binding:value});assert.equal(result.decision,'reject');assert.ok(result.reason_codes.includes('MAPPING_NOT_APPROVED'));}});
test('draft Evidence 与缺失 lineage 分别被拒绝',()=>{assert.ok(run({approval_status:'draft'}).reason_codes.includes('EVIDENCE_NOT_APPROVED'));assert.ok(run({source_lineage_verified:false}).reason_codes.includes('SOURCE_LINEAGE_REQUIRED'));});
test('expired/revoked Evidence 被拒绝，未知 validity 保守复核',()=>{for(const validity_status of ['expired','revoked'])assert.ok(run({validity_status}).reason_codes.includes('EVIDENCE_EXPIRED'));const unknown=run({validity_status:'unknown'});assert.equal(unknown.decision,'needs_review');assert.equal(unknown.dimensions.validity_match,'unknown');assert.equal(unknown.writer_eligible,false);});
test('不可用来源与缺失 support level 均拒绝',()=>{assert.ok(run({usable_for_claims:false}).reason_codes.includes('SOURCE_NOT_USABLE'));assert.ok(run({support_level:null}).reason_codes.includes('SUPPORT_INSUFFICIENT'));});
