const OPEN = new Set(['proposed', 'needs_review', 'draft', 'pending', 'conflict', 'insufficient', 'restrict', 'reject', 'unresolved', 'blocked', 'unknown']);

const REASONS = {
  EVIDENCE_INSUFFICIENT: '现有材料不足以支撑该需求',
  EVIDENCE_CONFLICT: '企业材料之间存在冲突',
  HUMAN_REVIEW_REQUIRED: '需要人工确认后才能继续',
  QUANTITATIVE_COMMITMENT_REVIEW: '定量承诺需要人工核验',
  RESPONSIBILITY_TRANSFER_RISK: '存在责任边界转移风险',
  SOURCE_LOCATION_UNRESOLVED: '来源位置尚未确认'
};

export function businessReason(code) {
  if (!code) return '等待人工处理';
  return REASONS[code] || '存在未识别的控制状态，需要人工核验';
}

function open(value) { return OPEN.has(String(value || '').toLowerCase()); }
function uniq(values) { return [...new Set(values.filter(Boolean))]; }

export class ReviewCenterService {
  constructor({ repository }) { this.repository = repository; }

  async get(projectId) {
    const [reviews, facts, mappings, projectFacts, claims, gates, bindings, mentions] = await Promise.all([
      this.repository.listEvidenceCandidateReviews(projectId),
      this.repository.listEvidenceSourceFacts(projectId),
      this.repository.listRequirementEvidenceFactMappings(projectId),
      this.repository.listProjectFacts(projectId),
      this.repository.listClaims(projectId),
      this.repository.listLatestClaimGateEvaluations(projectId),
      this.repository.listProjectFactPropagationBindings(projectId),
      this.repository.listProjectFactMentions(projectId)
    ]);
    const factByReview = new Map(facts.map((item) => [item.evidence_review_id, item]));
    const evidence = reviews.map((item) => {
      const fact = factByReview.get(item.review_id) || null;
      return {
        kind: 'evidence_review', id: item.review_id, status: item.review_status, material_id:item.material_id,
        requirement_id: item.requirement_ref, requirement_text: item.requirement_text,
        is_mandatory: item.is_mandatory, source_location: { page_start:item.source_page_start, page_end:item.source_page_end, paragraph_start:item.source_paragraph_start, paragraph_end:item.source_paragraph_end },
        source_material: item.source_material, source_span_id: item.source_span_id,
        source_excerpt: item.source_excerpt, support_level: item.support_level,
        evidence_capability: item.evidence_capability, requires_confirmation: item.requires_human_review,
        reason_codes: item.reason_codes || [], reason: businessReason((item.reason_codes || [])[0]),
        fact: fact && { fact_id: fact.fact_id, status: fact.review_status, subject: fact.subject, validity: fact.validity }
      };
    });
    const mappingItems = mappings.map((item) => ({
      kind: 'mapping', id: item.mapping_id, status: item.review_status, material_id:item.material_id,
      requirement_id: item.requirement_identifier, fact_id: item.evidence_fact_id,
      support_level: item.support_level, reason_codes: item.reason_codes || [],
      reason: businessReason((item.reason_codes || [])[0])
    }));
    const reviewById = new Map(reviews.map((item)=>[item.review_id,item]));
    const factItems = facts.map((item)=>{const review=reviewById.get(item.evidence_review_id);return{kind:'evidence_fact',id:item.fact_id,status:item.review_status,material_id:item.material_id,requirement_id:review?.requirement_ref||null,source_span_id:item.source_span_id,subject:item.subject,validity:item.validity,reason:businessReason(item.review_status)};});
    const gateByClaim = new Map(gates.map((item) => [item.claim_id, item]));
    const claimItems = claims.map((item) => ({
      kind: 'claim', id: item.claim_id, status: gateByClaim.get(item.claim_id)?.decision || item.gate_decision || item.decision,
      requirement_id: item.requirement_id, text: item.text, reason_codes: uniq([item.reason_code]),
      reason: item.reason_message || businessReason(item.reason_code), requested_commitment: item.requested_commitment
    }));
    const bindingsByFact = new Map();
    for (const item of bindings) bindingsByFact.set(item.project_fact_id, [...(bindingsByFact.get(item.project_fact_id) || []), item]);
    const mentionCounts = new Map();
    for (const item of mentions) mentionCounts.set(item.project_fact_id, (mentionCounts.get(item.project_fact_id) || 0) + 1);
    const projectFactItems = projectFacts.map((item) => {
      const affected = bindingsByFact.get(item.project_fact_id) || [];
      return { ...item, kind: 'project_fact', status: item.conflict_status === 'conflict' ? 'conflict' : item.review_status,
        affected_target_count: affected.length, affected_chapters: uniq(affected.filter((x) => x.target_type === 'chapter').map((x) => x.target_id)),
        mention_count: mentionCounts.get(item.project_fact_id) || 0,
        reason: item.conflict_status === 'conflict' ? '同一事实存在冲突值，必须人工处理' : businessReason(item.review_status) };
    });
    const propagation = bindings.filter((item)=>['unresolved','blocked'].includes(item.binding_status)).map((item)=>({kind:'propagation',id:item.propagation_id,status:item.binding_status,project_fact_id:item.project_fact_id,target_type:item.target_type,target_id:item.target_id,reason:item.binding_status==='blocked'?'事实传播已被控制门禁阻断':'事实传播目标尚未解决'}));
    const pending = [...evidence, ...factItems, ...mappingItems, ...claimItems, ...projectFactItems, ...propagation].filter((item) => open(item.status) || item.requires_confirmation === true);
    return {
      summary: {
        pending: pending.length,
        evidence_confirmation: evidence.filter((x) => open(x.status)).length,
        fact_confirmation: [...facts, ...projectFacts].filter((x) => open(x.review_status)).length,
        fact_conflict: projectFacts.filter((x) => x.conflict_status === 'conflict').length,
        risky_claims: claimItems.filter((x) => ['needs_review', 'restrict', 'reject', 'rejected'].includes(String(x.status))).length,
        missing_materials: mappingItems.filter((x) => ['insufficient', 'unknown'].includes(String(x.support_level)) || open(x.status)).length
      },
      pending, evidence, evidence_facts:factItems, mappings: mappingItems, claims: claimItems, project_facts: projectFactItems, propagation
    };
  }

  async factImpact(projectId, factId) {
    const fact = await this.repository.getProjectFactCurrent(factId);
    if (!fact || fact.project_id !== projectId) return null;
    const [bindings, mentions] = await Promise.all([
      this.repository.listProjectFactPropagationBindings(projectId, factId),
      this.repository.listProjectFactMentions(projectId, factId)
    ]);
    return { project_fact_id: factId, affected_target_count: bindings.length,
      affected_requirements: uniq(bindings.filter((x) => x.target_type === 'requirement').map((x) => x.target_id)),
      affected_claims: uniq(bindings.filter((x) => x.target_type === 'claim').map((x) => x.target_id)),
      affected_chapters: uniq(bindings.filter((x) => x.target_type === 'chapter').map((x) => x.target_id)),
      affected_writer_tasks: uniq(bindings.filter((x) => x.target_type === 'writer_task').map((x) => x.target_id)),
      mention_count: mentions.length,
      unresolved_count: bindings.filter((x) => ['unresolved', 'blocked'].includes(x.binding_status)).length };
  }
}
