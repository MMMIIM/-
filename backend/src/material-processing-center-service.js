import { deriveReadiness } from './evidence-readiness-service.js';

const pending=value=>['proposed','needs_review','draft'].includes(String(value||''));
const countBy=(items,key)=>items.reduce((out,item)=>{const value=item[key]||'unknown';out[value]=(out[value]||0)+1;return out;},{});

function projectedReadiness(mappings,reviews,facts){
  let result=deriveReadiness(mappings);
  if(result!=='CONFLICT'&&(reviews.some(x=>pending(x.review_status))||facts.some(x=>x.review_status==='draft')))result='NEEDS_REVIEW';
  return result;
}

function stage(material,activity){
  if(['failed','ocr_required'].includes(material.extraction_status))return{code:'EXCEPTION',label:'存在异常',message:'材料解析未完成，请查看原因并重新上传可读取的文件。',action:'重新上传'};
  if(material.extraction_status!=='succeeded')return{code:'EXTRACTING',label:'解析中',message:'系统正在读取材料内容。',action:'稍后刷新'};
  if(activity.review_counts.proposed||activity.review_counts.needs_review)return{code:'EVIDENCE_REVIEW',label:'证据待确认',message:'已找到可能相关的材料内容，需要人工确认是否可以作为证明。',action:'去审核'};
  if(activity.fact_counts.draft)return{code:'FACT_REVIEW',label:'证明内容待确认',message:'材料中的证明内容已提取，需要人工核验。',action:'去审核'};
  if(activity.mapping_counts.proposed)return{code:'MAPPING_REVIEW',label:'需求匹配待确认',message:'证明内容与需求的匹配关系需要人工确认。',action:'去审核'};
  if(activity.mapping_support.conflict)return{code:'CONFLICT',label:'信息存在冲突',message:'材料内容与需求存在冲突，需要人工处理。',action:'处理冲突'};
  if(activity.approved_mapping_count)return{code:'COMPLETED',label:'材料处理完成',message:'材料已经完成正式确认，准备度已按结果更新。',action:'查看影响'};
  if(activity.retrieval_run_count)return{code:'RETRIEVED',label:'已找到相关内容',message:'检索已完成，下一步需要建立并确认候选证据。',action:'查看相关需求'};
  return{code:'EXTRACTED',label:'解析完成',message:'材料已可用于检索，尚未形成正式证明。',action:'查看相关需求'};
}

export class MaterialProcessingCenterService{
  constructor({repository,evidenceReadinessService}){this.repository=repository;this.evidenceReadinessService=evidenceReadinessService;}
  async get(projectId){
    const[materials,activityRows,reviews,facts,mappings,readiness]=await Promise.all([this.repository.listCompanyMaterials(projectId),this.repository.listMaterialProcessingActivity(projectId),this.repository.listEvidenceCandidateReviews(projectId),this.repository.listEvidenceSourceFacts(projectId),this.repository.listRequirementEvidenceFactMappings(projectId),this.evidenceReadinessService.get(projectId)]),activityByMaterial=new Map(activityRows.map(x=>[x.material_id,x])),readinessByRequirement=new Map(readiness.requirements.map(x=>[x.requirement_id,x]));
    const items=materials.map(material=>{const row=activityByMaterial.get(material.id)||{},materialReviews=reviews.filter(x=>x.material_id===material.id),reviewIds=new Set(materialReviews.map(x=>x.review_id)),materialFacts=facts.filter(x=>x.material_id===material.id||reviewIds.has(x.evidence_review_id)),factIds=new Set(materialFacts.map(x=>x.fact_id)),materialMappings=mappings.filter(x=>x.material_id===material.id||factIds.has(x.evidence_fact_id)),affected=[...new Set([...materialReviews.map(x=>x.requirement_ref),...materialMappings.map(x=>x.requirement_identifier)].filter(Boolean))],reviewCounts=countBy(materialReviews,'review_status'),factCounts=countBy(materialFacts,'review_status'),mappingCounts=countBy(materialMappings,'review_status'),mappingSupport=countBy(materialMappings.filter(x=>x.review_status==='approved'),'support_level'),activity={chunk_count:Number(row.chunk_count||0),retrieval_run_count:Number(row.retrieval_run_count||0),retrieval_statuses:row.retrieval_statuses||[],review_counts:reviewCounts,fact_counts:factCounts,mapping_counts:mappingCounts,mapping_support:mappingSupport,approved_mapping_count:Number(mappingCounts.approved||0)};const transitions=affected.map(id=>{const withoutMappings=mappings.filter(x=>x.requirement_identifier===id&&x.material_id!==material.id),withoutReviews=reviews.filter(x=>x.requirement_ref===id&&x.material_id!==material.id),withoutReviewIds=new Set(withoutReviews.map(x=>x.review_id)),withoutFacts=facts.filter(x=>withoutReviewIds.has(x.evidence_review_id));return{requirement_id:id,before:projectedReadiness(withoutMappings,withoutReviews,withoutFacts),after:readinessByRequirement.get(id)?.readiness||'NO_EVIDENCE',mandatory:Boolean(readinessByRequirement.get(id)?.is_mandatory)};}),currentStage=stage(material,activity);return{material_id:material.id,material_name:material.original_name,material_type:material.material_type,uploaded_at:material.created_at,extraction_status:material.extraction_status,extraction_error_message:material.extraction_error_message||null,extraction_error_code:material.extraction_error_code||null,...activity,stage:currentStage,affected_requirement_count:affected.length,affected_requirements:transitions,resolved_gap_count:transitions.filter(x=>x.before!=='SUPPORTED'&&x.after==='SUPPORTED').length,remaining_gap_count:transitions.filter(x=>x.after!=='SUPPORTED').length,readiness_impact:transitions};});
    const summary={material_count:items.length,needs_attention:items.filter(x=>x.stage.code!=='COMPLETED').length,processing_complete:items.filter(x=>x.stage.code==='COMPLETED').length,pending_review:items.filter(x=>['EVIDENCE_REVIEW','FACT_REVIEW','MAPPING_REVIEW','CONFLICT'].includes(x.stage.code)).length,exceptions:items.filter(x=>x.stage.code==='EXCEPTION').length,resolved_gap_count:items.reduce((n,x)=>n+x.resolved_gap_count,0),remaining_gap_count:readiness.gaps.length};
    return{summary,generation_readiness:readiness.generation_readiness,project_readiness:readiness.summary,materials:items};
  }
}
