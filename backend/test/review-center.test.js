import test from'node:test';import assert from'node:assert/strict';
import{ReviewCenterService,businessReason}from'../src/review-center-service.js';
const repo={
 listEvidenceCandidateReviews:async()=>[{review_id:'ER-1',review_status:'needs_review',requirement_ref:'REQ-1',requirement_text:'需求原文',source_span_id:'SPAN-1',source_excerpt:'来源原文',reason_codes:['HUMAN_REVIEW_REQUIRED']}],
 listEvidenceSourceFacts:async()=>[{fact_id:'EF-1',evidence_review_id:'ER-1',review_status:'draft',validity:{status:'unknown'}}],
 listRequirementEvidenceFactMappings:async()=>[{mapping_id:'MAP-1',review_status:'proposed',requirement_identifier:'REQ-1',evidence_fact_id:'EF-1',support_level:'unknown',reason_codes:[]}],
 listProjectFacts:async()=>[{project_fact_id:'PF-1',project_id:'P',key:'deadline',value:'90',review_status:'needs_review',conflict_status:'conflict',version:1,provenance_refs:[]}],
 listClaims:async()=>[{claim_id:'CL-1',requirement_id:'REQ-1',decision:'needs_review',reason_code:'FUTURE_REASON',reason_message:null}],
 listLatestClaimGateEvaluations:async()=>[{claim_id:'CL-1',decision:'restrict'}],
 listProjectFactPropagationBindings:async()=>[{project_fact_id:'PF-1',target_type:'chapter',target_id:'chapter-1',binding_status:'blocked'}],
 listProjectFactMentions:async()=>[{project_fact_id:'PF-1',mention_id:'M-1'}],
 getProjectFactCurrent:async()=>({project_fact_id:'PF-1',project_id:'P'})
};
test('审核中心聚合待办、冲突、未知状态且不自动解决',async()=>{const out=await new ReviewCenterService({repository:repo}).get('P');assert.equal(out.summary.pending,6);assert.equal(out.summary.fact_conflict,1);assert.equal(out.project_facts[0].status,'conflict');assert.equal(out.claims[0].status,'restrict');assert.ok(out.pending.some(x=>x.kind==='evidence_fact'));assert.ok(out.pending.some(x=>x.kind==='mapping'));assert.ok(out.pending.some(x=>x.kind==='propagation'));});
test('影响范围只消费规范 binding 与 mention lineage',async()=>{const out=await new ReviewCenterService({repository:repo}).factImpact('P','PF-1');assert.deepEqual(out.affected_chapters,['chapter-1']);assert.equal(out.mention_count,1);assert.equal(out.unresolved_count,1);});
test('业务文案映射隐藏技术码但未知码仍可见',()=>{assert.equal(businessReason('HUMAN_REVIEW_REQUIRED'),'需要人工确认后才能继续');assert.match(businessReason('NEW_CODE'),/未识别/);});
