export const BATCH_GENERATION_RULE_VERSION='4.3-batch-routing-1';

const empty=(value)=>!Array.isArray(value)||value.length===0;

export function routeBatchGeneration(batch){
  const input=batch?.input||{};
  const claims=Array.isArray(input.approved_claims)?input.approved_claims:[];
  const plans=Array.isArray(input.response_plans)?input.response_plans:[];
  const simple=claims.length===1
    && plans.every((plan)=>empty(plan.implementation_actions))
    && empty(input.approved_evidence)
    && empty(input.conditions)
    && empty(input.responsibility_boundaries);
  if(!simple)return{generation_mode:'semantic_gateway',rule_version:BATCH_GENERATION_RULE_VERSION};
  const anchor=input.requirement_anchors?.[0]?.requirement_anchor||claims[0]?.text||'';
  return{
    generation_mode:'deterministic_template',
    rule_version:BATCH_GENERATION_RULE_VERSION,
    content:`本项目将按照招标文件要求，${anchor}`
  };
}
