import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const GOLD_SCHEMA_VERSION='4.3-evidence-claim-gold-v1';
export const REVIEW_STATUSES=new Set(['pending','approved','rejected']);
export const DIMENSIONS=['subject_match','entity_match','status_match','scope_match','quantitative_match','validity_match','support_sufficiency','source_authority'];

const here=path.dirname(fileURLToPath(import.meta.url));

export function loadCandidateSource(file=path.join(here,'gold-candidates.json')){
  return JSON.parse(fs.readFileSync(file,'utf8'));
}

export function loadHumanReviews(file=path.join(here,'review','gold-reviews.json')){
  return fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{schema_version:GOLD_SCHEMA_VERSION,reviews:[]};
}

const unknownFacts=()=>({subject:'unknown',entities:[],fact_status:'unknown',fact_scopes:[],quantities:[],validity:'unknown'});
const approvedFacts=(facts)=>({subject:facts.subject,entities:facts.entities,fact_status:facts.status,fact_scopes:facts.scopes,quantities:facts.quantities,validity:facts.validity});
const allUnknownDimensions=()=>Object.fromEntries(DIMENSIONS.map((key)=>[key,'unknown']));
const candidateId=(req,index)=>`EVD-${req.slice(4)}-${String(index+1).padStart(2,'0')}`;

function approvedClaimProbes(evidenceCase,seed){
  const base={evidence_case_id:evidenceCase.case_id,requirement_id:evidenceCase.requirement_id,claim_type:'enterprise_capability',mapping_support_level:seed.support_level,review_status:'approved'};
  const cases={
    'REQ-030':[
      {claim_text:'东软集团股份有限公司中标数据共享交换平台管理中心软件。',expected_dimensions:{subject_match:'match',entity_match:'match',status_match:'match',scope_match:'match',quantitative_match:'not_applicable',validity_match:'match',support_sufficiency:'partial',source_authority:'usable'},expected_reason_codes:['HUMAN_REVIEW_REQUIRED'],expected_decision:'needs_review',expected_writer_eligible:false,review_notes:'原文只证明中标事实，不证明完成或验收。'},
      {claim_text:'东软集团股份有限公司已完成并验收数据共享交换平台全部建设内容。',expected_dimensions:{subject_match:'match',entity_match:'match',status_match:'mismatch',scope_match:'mismatch',quantitative_match:'not_applicable',validity_match:'match',support_sufficiency:'partial',source_authority:'usable'},expected_reason_codes:['STATUS_OVERCLAIM','EVIDENCE_SCOPE_EXCEEDED'],expected_decision:'reject',expected_writer_eligible:false,review_notes:'award 不得扩张为 completed/accepted。'}
    ],
    'REQ-016':[
      {claim_text:'材料提供系统集成能力参考。',expected_dimensions:{subject_match:'unknown',entity_match:'match',status_match:'unknown',scope_match:'match',quantitative_match:'not_applicable',validity_match:'unknown',support_sufficiency:'partial',source_authority:'usable'},expected_reason_codes:['HUMAN_REVIEW_REQUIRED'],expected_decision:'needs_review',expected_writer_eligible:false,review_notes:'材料不含一秒响应指标。'},
      {claim_text:'系统集成接口响应时间不超过1秒。',expected_dimensions:{subject_match:'unknown',entity_match:'match',status_match:'unknown',scope_match:'match',quantitative_match:'mismatch',validity_match:'unknown',support_sufficiency:'partial',source_authority:'usable'},expected_reason_codes:['QUANTITATIVE_UNSUPPORTED'],expected_decision:'reject',expected_writer_eligible:false,review_notes:'量化指标没有企业材料依据。'}
    ],
    'REQ-187':[
      {claim_text:'材料列示ISO9001:2015资质信息，可供参考。',expected_dimensions:{subject_match:'unknown',entity_match:'match',status_match:'unknown',scope_match:'match',quantitative_match:'not_applicable',validity_match:'unknown',support_sufficiency:'insufficient',source_authority:'reference_only'},expected_reason_codes:['REFERENCE_ONLY'],expected_decision:'restrict',expected_writer_eligible:false,review_notes:'资质清单不能证明指定防火墙检测报告。'},
      {claim_text:'材料证明我司持有ISO9001:2015并已取得指定防火墙检测报告。',expected_dimensions:{subject_match:'unknown',entity_match:'mismatch',status_match:'unknown',scope_match:'mismatch',quantitative_match:'not_applicable',validity_match:'unknown',support_sufficiency:'insufficient',source_authority:'reference_only'},expected_reason_codes:['ENTITY_MISMATCH','EVIDENCE_SCOPE_EXCEEDED','REFERENCE_ONLY'],expected_decision:'reject',expected_writer_eligible:false,review_notes:'增加了原文没有的证书主体和检测报告实体。'}
    ]
  };
  return cases[evidenceCase.requirement_id].map((value,index)=>({...base,case_id:`CLM-${evidenceCase.requirement_id.slice(4)}-${index+1}`,system_output:{dimensions:value.expected_dimensions,reason_codes:value.expected_reason_codes,decision:value.expected_decision,writer_eligible:value.expected_writer_eligible},...value}));
}

export function buildGoldDatasets(source=loadCandidateSource(),reviewOverlay=loadHumanReviews()){
  if(source.schema_version!==GOLD_SCHEMA_VERSION)throw new Error('GOLD_SCHEMA_VERSION_INVALID');
  const requirements=new Map(source.requirements.map((item)=>[item.id,item]));
  const grouped=new Map();
  for(const row of source.anchors){const [requirementId,chunkId,materialId,materialType,charStart,charEnd,sourceHash,sourceExcerpt]=row;const value={requirementId,chunkId,materialId,materialType,charStart,charEnd,sourceHash,sourceExcerpt};grouped.set(requirementId,[...(grouped.get(requirementId)||[]),value]);}
  const negative=new Set(source.pending_no_sufficient_requirement_ids);
  const retrieval=[];const evidence=[];const claims=[];
  for(const [requirementId,anchors] of grouped){
    const requirement=requirements.get(requirementId);const seed=source.approved_seeds[requirementId];
    const seedRank=seed?anchors.findIndex((item)=>item.chunkId===seed.anchor):-1;
    retrieval.push({case_id:`RET-${requirementId.slice(4)}`,project_id:source.project_id,requirement_id:requirementId,requirement_text:requirement.text,expected_relevant_anchor_chunk_ids:seed?[seed.anchor]:[],expected_best_anchor_chunk_ids:seed?[seed.anchor]:[],expected_no_sufficient_evidence:negative.has(requirementId),review_status:seed?'approved':'pending',review_notes:seed?'已依据公开原文和人工审核 Evidence 核验。':'待人工逐字核验；不计入正式指标。',system_ranked_anchor_chunk_ids:anchors.map((item)=>item.chunkId)});
    anchors.forEach((anchor,index)=>{
      const approved=seed?.anchor===anchor.chunkId;const material=source.materials?.[anchor.materialId]||{};const item={case_id:candidateId(requirementId,index),requirement_id:requirementId,requirement_text:requirement.text,material_id:anchor.materialId,material_name:material.name||'unknown',material_type:anchor.materialType,anchor_chunk_id:anchor.chunkId,anchor_chunk_text:anchor.sourceExcerpt,difficulty:['easy','medium','hard'][index],resolved_source_span:{char_start:anchor.charStart,char_end:anchor.charEnd,source_text:anchor.sourceExcerpt,source_hash:anchor.sourceHash,resolution_method:'retrieval_anchor_chunk'},system_candidate:approved?approvedFacts(seed.facts):unknownFacts(),expected_source_span:approved?{char_start:seed.span[0],char_end:seed.span[1]}:null,expected_facts:approved?approvedFacts(seed.facts):unknownFacts(),source_excerpt:anchor.sourceExcerpt,source_reference:{anchor_char_start:anchor.charStart,anchor_char_end:anchor.charEnd,anchor_chunk_hash:anchor.sourceHash,expected_source_hash:approved?seed.source_hash:null},expected_no_sufficient_evidence:negative.has(requirementId),review_status:approved?'approved':'pending',review_notes:approved?'来源范围和事实已经人工核验。':'候选 anchor 来自真实检索；Gold span/facts 待人工审核。'};
      if(approved)item.system_output={source_span:item.expected_source_span,source_hash:seed.source_hash,facts:item.expected_facts};
      evidence.push(item);
      if(approved)claims.push(...approvedClaimProbes(item,seed));
      else for(let probe=0;probe<2;probe+=1)claims.push({case_id:`CLM-${requirementId.slice(4)}-${index+1}-${probe+1}`,evidence_case_id:item.case_id,requirement_id:requirementId,claim_text:probe===0?requirement.text:`${requirement.text}（候选边界扩张探针，待人工审核）`,claim_type:'enterprise_capability',mapping_support_level:'partial_support',expected_dimensions:allUnknownDimensions(),expected_reason_codes:[],expected_decision:'needs_review',expected_writer_eligible:false,review_status:'pending',review_notes:'仅为人工审核候选，不计入正式指标。'});
    });
  }
  for(const review of reviewOverlay.reviews||[]){
    const target=evidence.find((item)=>item.case_id===review.case_id);if(!target)continue;
    target.review_status=review.review_status;target.review_notes=review.review_notes;target.human_review={reviewer:review.reviewer,reviewed_at:review.reviewed_at,anchor_relevant:review.anchor_relevant,best_evidence_capable_anchor:review.best_evidence_capable_anchor,source_span_assessment:review.source_span_assessment};
    if(review.review_status==='approved'){target.expected_source_span=review.human_gold.source_span;target.expected_facts=review.human_gold.facts;target.expected_no_sufficient_evidence=review.human_gold.no_sufficient_evidence;target.source_reference.expected_source_hash=review.human_gold.source_hash;}
  }
  return{schema_version:GOLD_SCHEMA_VERSION,retrieval,evidence,claims};
}

export function validateGoldDatasets(data){
  const errors=[];const ids=new Set();
  for(const [group,items] of Object.entries({retrieval:data.retrieval,evidence:data.evidence,claims:data.claims}))for(const item of items){if(ids.has(item.case_id))errors.push(`duplicate:${item.case_id}`);ids.add(item.case_id);if(!REVIEW_STATUSES.has(item.review_status))errors.push(`${group}:${item.case_id}:review_status`);}
  if(data.schema_version!==GOLD_SCHEMA_VERSION)errors.push('schema_version');
  if(data.evidence.length!==30)errors.push('evidence_count');
  if(data.claims.length<60||data.claims.length>100)errors.push('claim_count');
  for(const item of data.evidence.filter((x)=>x.review_status==='approved'))if(!item.expected_source_span||!item.source_reference.expected_source_hash)errors.push(`approved_provenance:${item.case_id}`);
  return{ok:errors.length===0,errors};
}
