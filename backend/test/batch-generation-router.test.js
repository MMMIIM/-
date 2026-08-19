import test from 'node:test';
import assert from 'node:assert/strict';
import { routeBatchGeneration,BATCH_GENERATION_RULE_VERSION } from '../src/pipeline/batch-generation-router.js';
import { DocumentGenerationService } from '../src/pipeline/document-generation-service.js';

const simpleBatch=()=>({chapter_id:'chapter-06',batch_index:0,input:{approved_claims:[{claim_id:'CLM-1',text:'应提供审计日志。'}],response_plans:[{implementation_actions:[]}],approved_evidence:[],conditions:[],responsibility_boundaries:[],requirement_anchors:[{requirement_id:'REQ-1',requirement_anchor:'投标人应提供审计日志。'}]}});

test('简单 Batch 使用需求锚点原文生成固定模板',()=>{const route=routeBatchGeneration(simpleBatch());assert.deepEqual(route,{generation_mode:'deterministic_template',rule_version:BATCH_GENERATION_RULE_VERSION,content:'本项目将按照招标文件要求，投标人应提供审计日志。'});});

test('素材丰富或多 Claim Batch 才允许语义网关',()=>{for(const mutate of [
  (b)=>b.input.approved_claims.push({claim_id:'CLM-2',text:'其他'}),
  (b)=>b.input.response_plans[0].implementation_actions.push('部署'),
  (b)=>b.input.approved_evidence.push({evidence_id:'EVD-1'}),
  (b)=>b.input.conditions.push('验收后'),
  (b)=>b.input.responsibility_boundaries.push('边界')
]){const batch=simpleBatch();mutate(batch);assert.equal(routeBatchGeneration(batch).generation_mode,'semantic_gateway');}});

test('简单 Batch 不调用 Writer，复杂 Batch 才调用',async()=>{const finished=[];let calls=0;const repository={claimDocumentTask:async()=>true,finishDocumentTask:async(_id,_batch,_status,data)=>finished.push(data)};const provider={draft:async()=>{calls++;return{content:'语义正文',audit:{provider:'semantic_gateway'}};}};const service=new DocumentGenerationService({repository,provider,concurrency:1});await service.runBatches('GEN-1',[simpleBatch()]);assert.equal(calls,0);assert.equal(finished[0].generation_mode,'deterministic_template');const complex=simpleBatch();complex.input.conditions=['经确认'];await service.runBatches('GEN-1',[complex]);assert.equal(calls,1);assert.equal(finished[1].generation_mode,'semantic_gateway');});
