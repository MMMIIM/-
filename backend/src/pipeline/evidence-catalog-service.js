function cleanIds(values) {
  return [...new Set((values || []).filter((value) => typeof value === 'string' && value.trim()).map((value) => value.trim()))];
}

export class EvidenceCatalogService {
  constructor(evidence = []) {
    this.evidence = evidence.map((item) => ({ ...item, source_roles: cleanIds(item.source_roles) }));
    this.byId = new Map(this.evidence.map((item) => [item.evidence_id, item]));
  }

  assertExisting(ids = []) {
    const normalized = cleanIds(ids);
    const missing = normalized.filter((id) => !this.byId.has(id));
    if (missing.length) throw Object.assign(new Error(`Evidence 不存在：${missing.join(', ')}`), { code: 'EVIDENCE_NOT_FOUND', missing_ids: missing });
    const unavailable = normalized.filter((id) => this.byId.get(id)?.approval_status !== 'approved');
    if (unavailable.length) throw Object.assign(new Error(`Evidence 尚未批准：${unavailable.join(', ')}`), { code: 'EVIDENCE_NOT_APPROVED', unavailable_ids: unavailable });
    return normalized;
  }

  assertUsableForClaims(ids=[]){
    const normalized=this.assertExisting(ids);
    const unusable=normalized.filter((id)=>this.byId.get(id)?.usable_for_claims!==true);
    if(unusable.length)throw Object.assign(new Error(`Evidence 不可用于 Claim：${unusable.join(', ')}`),{code:'EVIDENCE_NOT_USABLE_FOR_CLAIMS',unavailable_ids:unusable});
    return normalized;
  }

  assertSourceLineage(ids=[]){
    const normalized=this.assertExisting(ids);const invalid=normalized.filter((id)=>this.byId.get(id)?.source_lineage_verified!==true);
    if(invalid.length)throw Object.assign(new Error(`Evidence 缺少可信 Material/Chunk 来源：${invalid.join(', ')}`),{code:'EVIDENCE_SOURCE_LINEAGE_REQUIRED',unavailable_ids:invalid});return normalized;
  }

  assertUsableForClaimType(ids=[],claimType){
    const normalized=this.assertUsableForClaims(ids);const allowed={company_case:new Set(['case','project_case']),qualification:new Set(['qualification']),personnel_capability:new Set(['personnel'])}[claimType];
    if(!allowed)return normalized;const mismatched=normalized.filter((id)=>!allowed.has(this.byId.get(id)?.source_type));
    if(mismatched.length)throw Object.assign(new Error(`Evidence 类型不支持 ${claimType} Claim：${mismatched.join(', ')}`),{code:'EVIDENCE_SCOPE_MISMATCH',unavailable_ids:mismatched});return normalized;
  }

  list() { return this.evidence.filter((item) => item.approval_status === 'approved').map((item) => ({ ...item })); }
}
