import { createHash } from 'node:crypto';
import { routeRequirement } from './chapter-router.js';

const RULE_VERSION='4.3.0';
const COMMITMENTS=new Set(['confirmed','conditional','reference_only']);
const ENTERPRISE_TYPES=new Set(['company_case','qualification','personnel_capability','enterprise_capability']);
const FORBIDDEN_CATEGORIES=new Set(['commercial','qualification','context']);
const HIGH_RISK_TYPES=new Set(['responsibility_transfer','scope_exclusion','product_selection']);
const unique=(values)=>[...new Set((values||[]).map(String).map((value)=>value.trim()).filter(Boolean))];
const tokens=(text)=>String(text||'').match(/\d+(?:\.\d+)?%?|\d+\s*(?:小时|天|日|年|人|次\/秒)|[A-Za-z][A-Za-z0-9._-]*/g)||[];
const stableClaimId=(projectId,claim)=>`CLM-${createHash('sha256').update(`${projectId}|${claim.requirement_id}|${claim.claim_type}|${claim.text}|${unique(claim.basis_requirement_ids).sort().join(',')}|${unique(claim.basis_evidence_ids).sort().join(',')}`).digest('hex').slice(0,16).toUpperCase()}`;

export class ClaimGateService {
  constructor({projectId='',requirements,evidenceCatalog,plans=[]}) {
    this.projectId=projectId; this.byId=new Map(requirements.map((item)=>[item.req_id,item]));
    this.evidenceCatalog=evidenceCatalog; this.planById=new Map(plans.map((item)=>[item.requirement_id,item]));
  }
  evaluate(claims=[],providerWarnings=[]) {
    const warnings=[...providerWarnings]; const seenClaimIds=new Set();
    const evaluated=claims.map((raw,index)=>{
      const basisIds=unique(raw.basis_requirement_ids); const invalid=basisIds.filter((id)=>!this.byId.has(id));
      let evidenceIds=[]; let reasonCode=null; let reasonMessage='Claim 通过确定性门禁。';
      try { evidenceIds=this.evidenceCatalog.assertExisting(raw.basis_evidence_ids); }
      catch(error) { reasonCode=error.code; reasonMessage=error.message; }
      if(!basisIds.length){reasonCode='CLAIM_REQUIREMENT_BASIS_REQUIRED';reasonMessage='Claim 必须至少引用一个合法 Requirement。';}
      if(invalid.length){reasonCode='CLAIM_REQUIREMENT_BASIS_INVALID';reasonMessage=`Claim 引用了未知 Requirement：${invalid.join('、')}`;}
      const primary=this.byId.get(raw.requirement_id); const basis=basisIds.map((id)=>this.byId.get(id)).filter(Boolean);
      if(!primary||!basisIds.includes(raw.requirement_id)){reasonCode='CLAIM_PRIMARY_REQUIREMENT_INVALID';reasonMessage='Claim 必须归属并引用一个合法主 Requirement。';}
      if(basis.some((item)=>FORBIDDEN_CATEGORIES.has(item.requirement_category)||item.writer_eligible!==true)){reasonCode='REQUIREMENT_NOT_WRITER_ELIGIBLE';reasonMessage='commercial、qualification、context 或非 writer eligible Requirement 不得形成技术正文 Claim。';}
      const commitment=String(raw.requested_commitment||'reference_only'); const plan=this.planById.get(raw.requirement_id);
      if(!COMMITMENTS.has(commitment)){reasonCode='CLAIM_COMMITMENT_INVALID';reasonMessage='requested_commitment 无效。';}
      if(commitment==='confirmed'&&(primary?.source_status==='provisional'||plan?.conditions?.length)){reasonCode='CLAIM_CONDITION_REQUIRED';reasonMessage='暂定来源或带条件 Plan 只能形成 conditional/reference_only Claim。';}
      if(commitment==='conditional'&&raw.claim_type!=='requirement_response'&&!String(raw.text||'').match(/条件|范围|为准|确认|前提|依据/)){reasonCode='CLAIM_CONDITION_MISSING';reasonMessage='conditional Claim 必须保留关键条件或前提。';}
      if(ENTERPRISE_TYPES.has(raw.claim_type)&&!evidenceIds.length){reasonCode='ENTERPRISE_EVIDENCE_REQUIRED';reasonMessage='案例、资质、人员或企业能力 Claim 必须有 approved Evidence。';}
      const basisText=basis.map((item)=>item.text).join('\n');
      if(tokens(raw.text).some((token)=>!basisText.includes(token))&&!evidenceIds.length){reasonCode='UNSUPPORTED_QUANTITATIVE_OR_PRODUCT_CLAIM';reasonMessage='Claim 含 Requirement/Evidence 未支持的指标、期限、数量或技术选型。';}
      if(HIGH_RISK_TYPES.has(raw.claim_type)&&!basisText.includes(String(raw.text||'').trim())&&!evidenceIds.length){reasonCode='HIGH_RISK_CLAIM_UNSUPPORTED';reasonMessage='责任转移、范围排除或产品选型必须被 Requirement 或 approved Evidence 明确支持。';}
      if(Object.prototype.hasOwnProperty.call(raw,'target_sections'))warnings.push({code:'MODEL_TARGET_SECTIONS_IGNORED',message:`Claim ${index+1} 的 target_sections 已由后端覆盖。`});
      if(Object.prototype.hasOwnProperty.call(raw,'claim_id'))warnings.push({code:'MODEL_CLAIM_ID_IGNORED',message:`Claim ${index+1} 的 claim_id 已由后端覆盖。`});
      const claim={claim_id:stableClaimId(this.projectId,raw),requirement_id:raw.requirement_id,claim_type:String(raw.claim_type||'').trim(),text:String(raw.text||'').trim(),basis_requirement_ids:basisIds,basis_evidence_ids:evidenceIds,requested_commitment:commitment,target_sections:primary?routeRequirement(primary):[],source_status:primary?.source_status||null,requirement_category:primary?.requirement_category||null,confirmation_type:primary?.confirmation_type||null,classification_review_required:Boolean(primary?.classification_review_required),atomicity_review_required:Boolean(primary?.atomicity_review_required),basis_requirement_source_statuses:Object.fromEntries(basis.map((item)=>[item.req_id,item.source_status]))};
      if(seenClaimIds.has(claim.claim_id))throw Object.assign(new Error('模型输出了重复 Claim。'),{code:'DUPLICATE_CLAIM',status:422});seenClaimIds.add(claim.claim_id);
      return {claim,decision:{claim_id:claim.claim_id,decision:reasonCode?'rejected':'approved',reason_code:reasonCode,reason_message:reasonMessage,rule_version:RULE_VERSION,decided_at:new Date().toISOString()}};
    });
    return {evaluated,warnings};
  }
  writerInput(evaluated){return evaluated.filter((item)=>item.decision.decision==='approved').map((item)=>item.claim);}
}
