export const RETRIEVAL_CONTRACT_VERSION='4.3-production-retrieval-v1';
export const RERANK_VERSION='4.3-role-need-rerank-v1';
export const PRODUCTION_CANDIDATE_K=20;
export const PRODUCTION_REVIEW_K=8;
export const MAX_RERANK_SHIFT=4;

const shifts=Object.freeze({preferred:-2,compatible:-1,unknown:0,weak:1,incompatible:2});
const preferred={quantitative_performance:['performance_test'],compatibility:['compatibility_evidence'],security_capability:['qualification','technical_parameter'],qualification:['qualification'],project_experience:['project_case'],award:['award_record'],contract:['contract_record'],implementation:['implementation_record'],acceptance_verification:['acceptance_record'],personnel:['personnel_profile'],delivery_capability:['delivery_capability'],service_capability:['service_capability'],product_capability:['product_capability'],technical_parameter:['technical_parameter']};
const compatible={quantitative_performance:['technical_parameter'],compatibility:['product_capability','technical_parameter'],security_capability:['product_capability','technical_reference'],project_experience:['award_record'],capability:['general_capability','product_capability','project_case'],implementation:['project_case'],delivery_capability:['project_case'],service_capability:['project_case']};

export function evidenceNeedCompatibility(need,role){
  if(!need||need==='unknown'||!role||role==='unknown')return'unknown';
  if(preferred[need]?.includes(role))return'preferred';
  if(compatible[need]?.includes(role))return'compatible';
  if(role==='company_positioning')return['capability','other'].includes(need)?'weak':'incompatible';
  if(role==='historical_bid'||role==='technical_reference')return'weak';
  return'incompatible';
}

const sourceId=(item)=>`${item.source_document_id??item.material_id??''}\u0000${item.source_chunk_id??item.chunk_id??''}`;
const normalizedRole=(value)=>{if(typeof value==='string')return{value,status:'approved'};return{value:value?.value??value?.type??'unknown',status:value?.status??value?.review_status??'pending'};};
const normalizedNeeds=(values)=>Array.isArray(values)?values.map((item)=>typeof item==='string'?{value:item,status:'approved'}:{value:item?.value??item?.type??'unknown',status:item?.status??item?.review_status??'pending'}):[];

function semanticInput(input,raw){
  const role=normalizedRole(input?.requirement_role),needs=normalizedNeeds(input?.evidence_needs);
  const byChunk=input?.candidate_roles&&typeof input.candidate_roles==='object'?input.candidate_roles:{};
  const roles=raw.map((item)=>normalizedRole(byChunk[item.chunk_id]));
  const usable=role.status==='approved'&&role.value!=='unknown'&&needs.length>0&&needs.every((need)=>need.status==='approved'&&need.value!=='unknown')&&roles.every((item)=>item.status==='approved'&&item.value!=='unknown');
  return{role,needs,roles,usable};
}

export function rerankProductionCandidates(rawCandidates,semanticMetadata={}){
  const raw=[...rawCandidates].map((item,index)=>({...item,source_document_id:item.source_document_id??item.material_id,source_chunk_id:item.source_chunk_id??item.chunk_id,raw_vector_rank:item.raw_vector_rank??item.rank??index+1,raw_similarity:Number(item.raw_similarity??item.similarity_score)})).sort((a,b)=>a.raw_vector_rank-b.raw_vector_rank||b.raw_similarity-a.raw_similarity||sourceId(a).localeCompare(sourceId(b)));
  const semantic=semanticInput(semanticMetadata,raw);
  const candidates=raw.map((item,index)=>{
    const contentRole=semantic.roles[index].value;
    const compatibilities=semantic.usable?semantic.needs.map((need)=>({need:need.value,compatibility:evidenceNeedCompatibility(need.value,contentRole)})):[];
    const priority={preferred:0,compatible:1,unknown:2,weak:3,incompatible:4};
    const roleCompatibility=semantic.usable?compatibilities.reduce((best,item)=>priority[item.compatibility]<priority[best]?item.compatibility:best,'incompatible'):'unknown';
    const matched=semantic.usable?compatibilities.filter((item)=>['preferred','compatible'].includes(item.compatibility)).map((item)=>item.need):[];
    const requested=semantic.usable?(shifts[roleCompatibility]??0):0;
    const shift=Math.max(-MAX_RERANK_SHIFT,Math.min(MAX_RERANK_SHIFT,requested));
    return{...item,content_role:contentRole,role_compatibility:roleCompatibility,matched_evidence_needs:matched,rerank_reasons:semantic.usable?[`ROLE_COMPATIBILITY_${roleCompatibility.toUpperCase()}`,...(matched.length?['EVIDENCE_NEED_MATCH']:[])]:['RAW_VECTOR_FALLBACK'],rerank_version:RERANK_VERSION,_bounded_rank:item.raw_vector_rank+shift};
  }).sort((a,b)=>a._bounded_rank-b._bounded_rank||a.raw_vector_rank-b.raw_vector_rank||b.raw_similarity-a.raw_similarity||sourceId(a).localeCompare(sourceId(b))).map(({_bounded_rank,...item},index)=>({...item,reranked_rank:index+1,retrieval_contract_version:RETRIEVAL_CONTRACT_VERSION}));
  return{fallback_mode:semantic.usable?null:'raw_vector',raw_candidates:raw,reranked_candidates:candidates,final_candidates:candidates.slice(0,PRODUCTION_REVIEW_K)};
}
