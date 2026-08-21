export const READINESS_STATUSES=['SUPPORTED','PARTIALLY_SUPPORTED','INSUFFICIENT','CONFLICT','NO_EVIDENCE','NEEDS_REVIEW'];
const GAP_STATUSES=new Set(['PARTIALLY_SUPPORTED','INSUFFICIENT','CONFLICT','NO_EVIDENCE']);
const LABELS={SUPPORTED:'充分支持',PARTIALLY_SUPPORTED:'部分支持',INSUFFICIENT:'证据不足',CONFLICT:'证据冲突',NO_EVIDENCE:'无证据',NEEDS_REVIEW:'待确认'};
const STATUS_PRIORITY={CONFLICT:4,NO_EVIDENCE:3,INSUFFICIENT:2,PARTIALLY_SUPPORTED:1};
const uniq=a=>[...new Set(a.filter(Boolean))];

export function deriveReadiness(mappings=[]){
 const current=mappings.filter(x=>x.mapping_current!==false&&x.fact_current!==false);
 const approved=current.filter(x=>x.review_status==='approved'&&x.fact_review_status==='approved'&&x.evidence_review_status==='approved');
 if(approved.some(x=>x.support_level==='conflict'||x.semantic_relationship==='conflict'))return'CONFLICT';
 if(current.some(x=>['proposed'].includes(x.review_status)||['draft'].includes(x.fact_review_status)||x.support_level==='unknown'||x.semantic_relationship==='unknown'))return'NEEDS_REVIEW';
 if(approved.some(x=>x.support_level==='full_support'))return'SUPPORTED';
 if(approved.some(x=>x.support_level==='partial_support'))return'PARTIALLY_SUPPORTED';
 if(approved.some(x=>x.support_level==='insufficient'||x.support_level==='reference_only'))return'INSUFFICIENT';
 return'NO_EVIDENCE';
}

export function suggestMaterialCategory(requirement,mappings=[]){
 const category=String(requirement.requirement_category||'').toLowerCase(),risks=(requirement.risk_flags||[]).map(x=>String(x).toLowerCase());
 if(category==='qualification')return{category:'企业资质',suggestion:'建议补充企业资质或有效资格证明'};
 if(category==='performance'||risks.some(x=>x.includes('quantitative')||x.includes('performance')))return{category:'性能测试报告',suggestion:'建议补充性能测试或测评材料'};
 if(category==='implementation'||category==='delivery'||category==='service')return{category:'实施能力材料',suggestion:'建议补充实施、交付或服务能力材料'};
 if(category==='personnel')return{category:'人员资格证明',suggestion:'建议补充人员资格或履历证明'};
 if(category==='case')return{category:'类似项目合同/验收材料',suggestion:'建议补充类似项目合同或验收类材料'};
 if(risks.some(x=>x.includes('compatib'))||mappings.some(x=>x.dimensions?.scope_match==='mismatch'))return{category:'兼容性证明',suggestion:'建议补充兼容性测试或适配证明'};
 if(['technical','integration_special'].includes(category))return{category:'产品能力说明',suggestion:'建议补充产品能力或技术说明材料'};
 return null;
}

export class EvidenceReadinessService{
 constructor({repository}){this.repository=repository;}
 async get(projectId){
  const[requirements,mappings,reviews,facts]=await Promise.all([this.repository.getFormalRequirements(projectId),this.repository.listRequirementEvidenceFactMappings(projectId),this.repository.listEvidenceCandidateReviews(projectId),this.repository.listEvidenceSourceFacts(projectId)]),byReq=new Map(),reviewsByReq=new Map(),factsByReview=new Map();
  for(const mapping of mappings)byReq.set(mapping.requirement_identifier,[...(byReq.get(mapping.requirement_identifier)||[]),mapping]);
  for(const review of reviews)reviewsByReq.set(review.requirement_ref,[...(reviewsByReq.get(review.requirement_ref)||[]),review]);for(const fact of facts)factsByReview.set(fact.evidence_review_id,[...(factsByReview.get(fact.evidence_review_id)||[]),fact]);
  const items=requirements.map(requirement=>{const related=byReq.get(requirement.req_id)||[],relatedReviews=reviewsByReq.get(requirement.req_id)||[],relatedFacts=relatedReviews.flatMap(x=>factsByReview.get(x.review_id)||[]);let readiness=deriveReadiness(related);const pendingReviewCount=relatedReviews.filter(x=>['proposed','needs_review'].includes(x.review_status)).length+relatedFacts.filter(x=>x.review_status==='draft').length+related.filter(x=>x.review_status==='proposed').length;const lifecyclePending=pendingReviewCount>0;if(readiness!=='CONFLICT'&&lifecyclePending)readiness='NEEDS_REVIEW';const approvedReviews=relatedReviews.filter(x=>x.review_status==='approved'),approvedFacts=relatedFacts.filter(x=>x.review_status==='approved'),approvedMappings=related.filter(x=>x.review_status==='approved'&&x.mapping_current!==false&&x.fact_current!==false),suggested=suggestMaterialCategory(requirement,related);return{requirement_id:requirement.req_id,requirement_text:requirement.text,is_mandatory:requirement.is_mandatory,requirement_category:requirement.requirement_category,source_evidence:requirement.source_evidence,readiness,readiness_label:LABELS[readiness],existing_evidence_count:new Set([...related.map(x=>x.material_id),...relatedReviews.map(x=>x.material_id)].filter(Boolean)).size,approved_evidence_count:new Set(approvedReviews.map(x=>x.source_span_id)).size,approved_fact_count:new Set(approvedFacts.map(x=>x.fact_id)).size,approved_mapping_count:new Set(approvedMappings.map(x=>x.mapping_id)).size,pending_review_count:pendingReviewCount,mapping_summary:related.map(x=>({mapping_id:x.mapping_id,review_status:x.review_status,support_level:x.support_level,semantic_relationship:x.semantic_relationship,evidence_fact_id:x.evidence_fact_id,source:{evidence_review_id:x.source?.evidence_review_id||null,material_id:x.material_id,material_name:x.material_name,material_type:x.material_type,source_span_id:x.source_span_id}})),gap_reason:this.gapReason(readiness),suggested_material_category:suggested?.category||null,suggested_material:suggested?.suggestion||null};});
  const counts=Object.fromEntries(READINESS_STATUSES.map(status=>[status,items.filter(x=>x.readiness===status).length])),total=items.length;
  const gaps=items.filter(x=>GAP_STATUSES.has(x.readiness)).map(x=>({...x,affected_requirement_count:1,priority:(x.is_mandatory||['CONFLICT','NO_EVIDENCE'].includes(x.readiness))?'high':'medium'}));
  const groups=new Map();for(const gap of gaps){if(!gap.suggested_material_category)continue;const current=groups.get(gap.suggested_material_category)||{material_category:gap.suggested_material_category,suggestion:gap.suggested_material,requirement_ids:[],mandatory_requirement_count:0,severity:0};current.requirement_ids.push(gap.requirement_id);current.mandatory_requirement_count+=gap.is_mandatory?1:0;current.severity=Math.max(current.severity,STATUS_PRIORITY[gap.readiness]||0);groups.set(current.material_category,current);}
  const suggested_materials=[...groups.values()].map(x=>({...x,affected_requirement_count:x.requirement_ids.length,priority:x.mandatory_requirement_count||x.severity>=3?'high':'medium'})).sort((a,b)=>b.affected_requirement_count-a.affected_requirement_count||b.mandatory_requirement_count-a.mandatory_requirement_count||b.severity-a.severity||a.material_category.localeCompare(b.material_category));
  const generationBlockers={unresolved_mandatory_requirement_ids:items.filter(x=>x.is_mandatory&&x.readiness!=='SUPPORTED').map(x=>x.requirement_id),needs_review_requirement_ids:items.filter(x=>x.readiness==='NEEDS_REVIEW').map(x=>x.requirement_id),conflict_requirement_ids:items.filter(x=>x.readiness==='CONFLICT').map(x=>x.requirement_id)};const blockerCount=new Set(Object.values(generationBlockers).flat()).size;
  return{formula:'SUPPORTED / TOTAL_REQUIREMENTS',summary:{total_requirements:total,supported:counts.SUPPORTED,partially_supported:counts.PARTIALLY_SUPPORTED,insufficient:counts.INSUFFICIENT,conflict:counts.CONFLICT,no_evidence:counts.NO_EVIDENCE,needs_review:counts.NEEDS_REVIEW,readiness_rate:total?counts.SUPPORTED/total:0},generation_readiness:{status:blockerCount?'NEEDS_ATTENTION':'READY_TO_GENERATE',message:blockerCount?'存在待处理项，建议处理后生成。':'当前正式状态未发现平台定义的生成前阻塞项，可进入生成。',blocker_count:blockerCount,...generationBlockers,advisory_only:true},requirements:items,gaps,suggested_materials};
 }
 gapReason(status){return{PARTIALLY_SUPPORTED:'现有正式证据只能部分支撑该需求。',INSUFFICIENT:'现有正式证据不足以支撑该需求。',CONFLICT:'现有正式证据与需求存在明确冲突。',NO_EVIDENCE:'当前没有可用且已批准的正式支撑关系。',NEEDS_REVIEW:'存在尚未完成的人工作业。'}[status]||null;}
}
