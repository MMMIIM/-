import fs from 'node:fs/promises';

const fixtureUrl=new URL('../fixtures/enterprise-retrieval-eval.json',import.meta.url);
const cosine=(a,b)=>{const dot=a.reduce((sum,value,index)=>sum+value*b[index],0);const an=Math.sqrt(a.reduce((sum,value)=>sum+value*value,0));const bn=Math.sqrt(b.reduce((sum,value)=>sum+value*value,0));return dot/(an*bn);};

export function evaluateRetrieval(fixture){
  const details=fixture.queries.map((query)=>{
    const ranked=fixture.chunks.map((chunk)=>({chunk_id:chunk.chunk_id,score:cosine(query.vector,chunk.vector)})).sort((a,b)=>b.score-a.score||a.chunk_id.localeCompare(b.chunk_id));
    const relevant=new Set(query.relevant_chunk_ids);const relevantRanks=ranked.map((item,index)=>relevant.has(item.chunk_id)?index+1:null).filter(Boolean);const firstRelevantRank=Math.min(...relevantRanks);
    const recall=(k)=>ranked.slice(0,k).filter((item)=>relevant.has(item.chunk_id)).length/relevant.size;
    const precision=(k)=>ranked.slice(0,k).filter((item)=>relevant.has(item.chunk_id)).length/k;
    return{query_id:query.query_id,requirement:query.requirement,relevant_chunk_ids:query.relevant_chunk_ids,returned_rank:ranked.slice(0,5).map((item)=>item.chunk_id),first_relevant_rank:firstRelevantRank,hit_at_1:firstRelevantRank<=1,hit_at_3:firstRelevantRank<=3,hit_at_5:firstRelevantRank<=5,recall_at_1:recall(1),recall_at_3:recall(3),recall_at_5:recall(5),precision_at_1:precision(1),precision_at_3:precision(3),precision_at_5:precision(5)};
  });
  const mean=(field)=>details.reduce((sum,item)=>sum+item[field],0)/details.length;
  return{schema_version:fixture.schema_version,fixture:{query_count:fixture.queries.length,chunk_count:fixture.chunks.length},metrics:{recall_at_1:mean('recall_at_1'),recall_at_3:mean('recall_at_3'),recall_at_5:mean('recall_at_5'),mrr:details.reduce((sum,item)=>sum+1/item.first_relevant_rank,0)/details.length,precision_at_1:mean('precision_at_1'),precision_at_3:mean('precision_at_3'),precision_at_5:mean('precision_at_5')},details};
}

if(process.argv[1]&&import.meta.url===new URL(`file:///${process.argv[1].replaceAll('\\','/')}`).href){const fixture=JSON.parse(await fs.readFile(fixtureUrl,'utf8'));console.log(JSON.stringify(evaluateRetrieval(fixture),null,2));}
