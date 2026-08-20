import { createClaimGateEvaluationContract } from './claim-gate-v2-contract.js';

const reasonMessage=(code)=>({
  MAPPING_NOT_APPROVED:'Enterprise Claim 缺少当前 Requirement 的 approved Mapping。',
  EVIDENCE_NOT_APPROVED:'Enterprise Evidence 尚未批准。',
  SOURCE_LINEAGE_REQUIRED:'Enterprise Evidence 缺少可信 Material/Chunk 来源。',
  SOURCE_NOT_USABLE:'Enterprise Evidence 来源不可用于企业事实 Claim。',
  REFERENCE_ONLY:'reference_only Mapping 不能直接形成强企业事实 Claim。',
  EVIDENCE_EXPIRED:'Enterprise Evidence 已过期或撤销。',
  SUPPORT_INSUFFICIENT:'Mapping 支撑级别不足。',
  HUMAN_REVIEW_REQUIRED:'Task 2 尚未判断 scope、status、quantity 与 entity，必须复核。'
}[code]||'Enterprise Claim 未通过 Claim Gate v2。');
const dimensions=()=>({subject_match:'unknown',scope_match:'unknown',status_match:'unknown',quantitative_match:'unknown',entity_match:'unknown',validity_match:'unknown',support_sufficiency:'unknown',source_authority:'unknown'});
const check=(name,passed,actual)=>({check:name,passed,actual});

export function evaluateEnterpriseClaimV2({projectId,claim,binding,evaluatedBy='deterministic_backend'}){
  const result=dimensions();const reasons=[];const checks=[];let decision='needs_review';
  const mapped=Boolean(binding?.mapping_id)&&binding?.project_id===projectId&&binding?.requirement_id===claim.requirement_id&&binding?.evidence_id===claim.basis_evidence_ids?.[0]&&binding?.mapping_status==='approved';
  checks.push(check('approved_mapping',mapped,binding?.mapping_status||null));if(!mapped)reasons.push('MAPPING_NOT_APPROVED');
  const approved=binding?.approval_status==='approved';checks.push(check('evidence_approved',approved,binding?.approval_status||null));if(mapped&&!approved)reasons.push('EVIDENCE_NOT_APPROVED');
  const lineage=binding?.source_lineage_verified===true;checks.push(check('source_lineage_verified',lineage,binding?.source_lineage_verified??null));if(mapped&&approved&&!lineage)reasons.push('SOURCE_LINEAGE_REQUIRED');
  const validity=String(binding?.validity_status||'unknown');result.validity_match=validity==='active'?'match':validity==='expired'||validity==='revoked'?'mismatch':'unknown';checks.push(check('evidence_validity',result.validity_match==='match',validity));if(mapped&&approved&&lineage&&result.validity_match==='mismatch')reasons.push('EVIDENCE_EXPIRED');
  const historical=binding?.material_type==='historical_bid';const usable=binding?.usable_for_claims===true&&!historical;
  if(historical||binding?.usable_for_claims===false)result.source_authority='unusable';else if(binding?.support_level==='reference_only')result.source_authority='reference_only';else if(usable)result.source_authority='usable';
  checks.push(check('source_usable',usable,binding?.usable_for_claims??null));if(mapped&&approved&&lineage&&result.validity_match!=='mismatch'&&(historical||binding?.usable_for_claims===false))reasons.push('SOURCE_NOT_USABLE');
  if(binding?.support_level==='full_support')result.support_sufficiency='sufficient';else if(binding?.support_level==='partial_support')result.support_sufficiency='partial';else if(binding?.support_level==='reference_only')result.support_sufficiency='insufficient';
  checks.push(check('support_level_recorded',['full_support','partial_support','reference_only'].includes(binding?.support_level),binding?.support_level||null));if(mapped&&binding?.support_level==='reference_only')reasons.push('REFERENCE_ONLY');else if(mapped&&!['full_support','partial_support'].includes(binding?.support_level))reasons.push('SUPPORT_INSUFFICIENT');
  if(reasons.some((code)=>['MAPPING_NOT_APPROVED','EVIDENCE_NOT_APPROVED','SOURCE_LINEAGE_REQUIRED','SOURCE_NOT_USABLE','EVIDENCE_EXPIRED','SUPPORT_INSUFFICIENT'].includes(code)))decision='reject';else if(reasons.includes('REFERENCE_ONLY'))decision='restrict';else{decision='needs_review';reasons.push('HUMAN_REVIEW_REQUIRED');}
  const evaluation=createClaimGateEvaluationContract({decision,reason_codes:[...new Set(reasons)],dimensions:result,allowed_scope:binding?.evidence_scope||[],required_conditions:[],evidence_ids:binding?.evidence_id?[binding.evidence_id]:[],mapping_ids:binding?.mapping_id?[binding.mapping_id]:[],deterministic_checks:checks,semantic_assessment:null,semantic_assessment_used:false,human_review_required:decision==='needs_review',evaluated_by:evaluatedBy});
  return{...evaluation,reason_message:reasonMessage(evaluation.reason_codes[0])};
}

export function applyEnterpriseEvaluationToLegacyDecision(item,evaluation){
  if(evaluation.writer_eligible)return{...item,v2_evaluation:evaluation};
  return{...item,decision:{...item.decision,decision:'rejected',reason_code:evaluation.reason_codes[0]||'HUMAN_REVIEW_REQUIRED',reason_message:evaluation.reason_message,rule_version:evaluation.rule_version,decided_at:new Date().toISOString()},v2_evaluation:evaluation};
}
