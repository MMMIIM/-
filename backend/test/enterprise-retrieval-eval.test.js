import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { evaluateRetrieval } from '../scripts/eval-enterprise-retrieval.js';

test('Enterprise Retrieval 固定 fixture 产出可重复 baseline 且保留人工相关性标签',async()=>{
  const fixture=JSON.parse(await fs.readFile(new URL('../fixtures/enterprise-retrieval-eval.json',import.meta.url),'utf8'));
  assert.equal(fixture.queries.length,8);assert.equal(fixture.chunks.length,12);assert.ok(fixture.queries.every((item)=>item.relevant_chunk_ids.length>0));
  const first=evaluateRetrieval(fixture);const second=evaluateRetrieval(fixture);assert.deepEqual(second,first);assert.equal(first.metrics.recall_at_1,0.625);assert.equal(first.metrics.recall_at_3,1);assert.equal(first.metrics.recall_at_5,1);assert.equal(first.metrics.mrr,0.9375);
});
