import test from 'node:test';
import assert from 'node:assert/strict';
import { buildGoldDatasets, validateGoldDatasets } from '../eval/evidence-gold/contract.js';
import { runEvidenceGoldEvaluation } from '../eval/evidence-gold/runner.js';
import { buildReviewPack } from '../eval/evidence-gold/review/review-pack.js';
import { importHumanSubmission, validateHumanSubmission } from '../eval/evidence-gold/review/import-human-review.js';

test('Gold v1 建立 30 个分层真实候选，pending 不混入正式指标',()=>{
  const data=buildGoldDatasets();const validation=validateGoldDatasets(data);assert.equal(validation.ok,true,validation.errors.join(','));
  assert.equal(data.evidence.length,30);assert.equal(data.claims.length,60);
  assert.deepEqual(Object.fromEntries(['easy','medium','hard'].map((x)=>[x,data.evidence.filter((item)=>item.difficulty===x).length])),{easy:10,medium:10,hard:10});
  assert.equal(data.evidence.filter((item)=>item.review_status==='approved').length,3);assert.equal(data.evidence.filter((item)=>item.review_status==='pending').length,27);
  assert.ok(data.evidence.filter((item)=>item.expected_no_sufficient_evidence).length>=5);
  assert.deepEqual(new Set(data.evidence.filter((item)=>item.review_status==='approved').map((item)=>item.requirement_id)),new Set(['REQ-030','REQ-016','REQ-187']));
});

test('Review Pack 将 27 个 pending 均衡分成三批并阻断其 Claim',()=>{
  const data=buildGoldDatasets();const pack=buildReviewPack(data);assert.deepEqual(pack.batches.map((x)=>x.length),[9,9,9]);assert.equal(pack.progress.evidence.pending,27);assert.equal(pack.progress.claim.blocked,54);
  for(const ids of pack.batches){const cases=ids.map((id)=>data.evidence.find((item)=>item.case_id===id));for(const difficulty of ['easy','medium','hard'])assert.ok(cases.some((item)=>item.difficulty===difficulty));assert.ok(new Set(cases.map((item)=>item.material_type)).size>=2);}
  for(const name of ['retrieval-review.md','evidence-batch-1.md','evidence-batch-2.md','evidence-batch-3.md','claim-review.md'])assert.ok(pack.files[name]);
  assert.match(pack.files['evidence-batch-1.md'],/SYSTEM PREDICTION — NOT GOLD TRUTH/);assert.match(pack.files['evidence-batch-1.md'],/HUMAN GOLD — MUST BE FILLED BY REVIEWER/);
});

test('Human Review importer 不允许无审核人、不完整 Gold 或隐式自动批准',()=>{
  const data=buildGoldDatasets();const target=data.evidence.find((x)=>x.review_status==='pending');const base={schema_version:data.schema_version,reviewer:'',reviewed_at:'',reviews:[{case_id:target.case_id,review_status:'approved'}]};assert.equal(validateHumanSubmission(base,data).ok,false);
  const complete={schema_version:data.schema_version,reviewer:'human-reviewer',reviewed_at:'2026-08-21T03:00:00.000Z',reviews:[{case_id:target.case_id,review_status:'approved',anchor_relevant:true,best_evidence_capable_anchor:false,source_span_assessment:'correct',human_gold:{source_span:{char_start:target.resolved_source_span.char_start,char_end:target.resolved_source_span.char_end},source_hash:target.resolved_source_span.source_hash,facts:{subject:'unknown',entities:[],fact_status:'unknown',fact_scopes:[],quantities:[],validity:'unknown'},no_sufficient_evidence:true},review_notes:'人工逐字核验。'}]};const imported=importHumanSubmission(complete);assert.equal(imported.reviews.length,1);assert.equal(imported.reviews[0].reviewer,'human-reviewer');
});

test('Gold provenance、unknown 与通用 schema 被锁定',()=>{
  const data=buildGoldDatasets();
  for(const item of data.evidence.filter((x)=>x.review_status==='approved')){assert.ok(item.expected_source_span.char_end>item.expected_source_span.char_start);assert.match(item.source_reference.expected_source_hash,/^[0-9a-f]{64}$/);assert.ok(item.source_excerpt);}
  assert.ok(data.evidence.some((item)=>Object.values(item.expected_facts).some((value)=>value==='unknown')));
  const schema=JSON.stringify(data.claims.map(({claim_text,review_notes,...item})=>item));for(const token of ['smart_city','medical','智慧城市','医疗器械'])assert.equal(schema.includes(token),false);
});

test('Runner 只统计 approved，并独立报告关键错误率',()=>{
  const report=runEvidenceGoldEvaluation();
  assert.deepEqual(report.counts.evidence,{total:30,approved:3,pending:27});assert.deepEqual(report.counts.claims,{total:60,approved:6,pending:54});
  assert.equal(report.metrics.retrieval.approved_cases,3);assert.equal(report.metrics.evidence.unsupported_match_rate,0);assert.equal(report.metrics.claim_gate.false_allow_rate,0);assert.equal(report.metrics.claim_gate.false_hard_reject_rate,0);
  assert.equal(report.metrics.claim_gate.status_overclaim_detection,1);assert.equal(report.metrics.claim_gate.scope_overclaim_detection,1);assert.equal(report.metrics.claim_gate.quantitative_overclaim_detection,1);assert.equal(report.metrics.claim_gate.entity_expansion_detection,1);
});
