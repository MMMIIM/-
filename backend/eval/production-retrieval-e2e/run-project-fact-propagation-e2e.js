import dotenv from 'dotenv';
import { resolve } from 'node:path';
import { createPool, PgRepository } from '../../src/db.js';
import { ProjectFactControlService } from '../../src/project-fact-control-service.js';
import { ProjectFactImpactResolver } from '../../src/project-fact-impact-resolver.js';

dotenv.config({ path: resolve('.env') });
const PROJECT_ID='ac1a1037-5e62-44ee-8c28-7b09d48d93e6';
const pool=createPool(),repository=new PgRepository(pool),control=new ProjectFactControlService({repository}),resolver=new ProjectFactImpactResolver({repository});
try{
  const facts=(await repository.listProjectFacts(PROJECT_ID)).filter((fact)=>fact.review_status==='approved'&&fact.conflict_status!=='conflict');
  if(!facts.length)throw new Error('PRODUCTION_PROJECT_APPROVED_FACTS_REQUIRED');
  const selected=[];
  const pick=(predicate)=>facts.find((fact)=>!selected.includes(fact)&&predicate(fact));
  for(const predicate of [
    (f)=>f.value_type==='exact_decimal'||f.value_type==='duration',
    (f)=>f.value_type==='string_set',
    (f)=>f.value_type==='structured'&&Object.hasOwn(f.value||{},'validity'),
    (f)=>f.value_type==='structured'&&Object.hasOwn(f.value||{},'status'),
  ]){const item=pick(predicate);if(item)selected.push(item);}
  if(selected.length<4)throw new Error('PRODUCTION_PROJECT_FACT_CASES_INCOMPLETE');
  const chapterPlan=selected.map((fact,index)=>({chapter_id:`e2e-chapter-${index+1}`,fact_keys:[fact.key],writer_task_ids:[`e2e-writer-task-${index+1}`],future_document_anchor_ids:[`e2e-anchor-${index+1}`]}));
  let bindings=0,affectedChapters=0,affectedTasks=0,unresolved=0;
  for(const fact of selected){const resolution=resolver.resolve({fact,chapterPlan}),context=resolver.writerContext({projectId:PROJECT_ID,chapterId:chapterPlan.find((x)=>x.fact_keys.includes(fact.key)).chapter_id,facts:[fact],bindings:resolution.bindings,versions:{requirementVersion:'production-current',claimGateIdentity:'production-current',chapterPlanVersion:'production-e2e-v1'}}),plan=resolver.planChange({currentFact:fact,resolution,versions:{requirementVersion:'production-current',claimGateIdentity:'production-current',chapterPlanVersion:'production-e2e-v1'}});await resolver.persist({fact,resolution,contexts:[context],plan});bindings+=resolution.bindings.length;affectedChapters+=plan.affected_chapters.length;affectedTasks+=plan.affected_writer_tasks.length;unresolved+=plan.unresolved_targets.length;}
  const original=selected[0],edit=await control.edit(original.project_fact_id,{value_status:'known',value:original.value_type==='exact_decimal'?'100':original.value_type==='duration'?'100':original.value},{editor:'production-e2e',note:'Task 9B deterministic propagation edit'});const approvedEdit=await control.decide(edit.project_fact_id,'approve',{reviewer:'production-e2e'});await repository.invalidateProjectFactArtifactsByFact(original.project_fact_id);const editResolution=resolver.resolve({fact:approvedEdit,chapterPlan,existingBindings:(await repository.listProjectFactPropagationBindings(PROJECT_ID,original.project_fact_id)).map((x)=>({...x,fact_key:original.key,binding_status:'active'}))}),editContext=resolver.writerContext({projectId:PROJECT_ID,chapterId:chapterPlan[0].chapter_id,facts:[approvedEdit],bindings:editResolution.bindings,versions:{requirementVersion:'production-current',claimGateIdentity:'production-current',chapterPlanVersion:'production-e2e-v1'}}),editPlan=resolver.planChange({previousFact:original,currentFact:approvedEdit,resolution:editResolution,versions:{requirementVersion:'production-current',claimGateIdentity:'production-current',chapterPlanVersion:'production-e2e-v1'}});await resolver.persist({fact:approvedEdit,resolution:editResolution,contexts:[editContext],plan:editPlan});
  console.log(JSON.stringify({project_id:PROJECT_ID,approved_project_facts:selected.length,propagation_bindings:bindings+editResolution.bindings.length,affected_chapters:affectedChapters+editPlan.affected_chapters.length,affected_writer_tasks:affectedTasks+editPlan.affected_writer_tasks.length,fact_to_chapter_ratio:(affectedChapters+editPlan.affected_chapters.length)/(selected.length+1),fact_to_writer_task_ratio:(affectedTasks+editPlan.affected_writer_tasks.length)/(selected.length+1),pending_propagation_targets:selected.filter((x)=>x.value_status==='pending').length,unresolved_targets:unresolved+editPlan.unresolved_targets.length,human_edit:{old_fact_invalidated:true,new_identity:approvedEdit.project_fact_id!==original.project_fact_id,new_context_hash:editContext.context_hash},llm_usage:0,external_provider_usage:0,writer_calls:0},null,2));
}finally{await pool.end();}
