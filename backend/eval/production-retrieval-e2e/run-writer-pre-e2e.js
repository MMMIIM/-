import dotenv from 'dotenv';
import {resolve} from 'node:path';
import {createPool,PgRepository} from '../../src/db.js';
import {createWriterSafeContext} from '../../src/pipeline/writer-input-authorization-v1.js';
import {WriterExecutionService} from '../../src/writer-execution-service.js';
import {buildSafePositiveWriterFixture,resolveExternalWriterRuntime,writerTaskInventory} from '../../src/pipeline/external-writer-preflight-v1.js';

dotenv.config({path:resolve('.env'),quiet:true});
const PROJECT_ID='ac1a1037-5e62-44ee-8c28-7b09d48d93e6';
const pool=createPool(),repository=new PgRepository(pool),service=new WriterExecutionService();

try{
  const facts=(await repository.listProjectFacts(PROJECT_ID)).filter(x=>x.review_status==='approved'&&x.conflict_status!=='conflict');
  const bindings=(await repository.listProjectFactPropagationBindings(PROJECT_ID)).filter(x=>x.binding_status==='active');
  const selected=[];
  for(const predicate of[(f)=>f.value_type==='exact_decimal'||f.value_type==='duration',(f)=>f.value_type==='string_set',(f)=>f.value_type==='structured'&&Object.hasOwn(f.value||{},'validity'),(f)=>f.value_type==='structured'&&Object.hasOwn(f.value||{},'status'),(f)=>f.version>1]){
    const found=facts.find(f=>!selected.includes(f)&&predicate(f)&&bindings.some(b=>b.project_fact_id===f.project_fact_id&&b.target_type==='chapter'));
    if(found)selected.push(found);
  }
  if(selected.length<4)throw new Error('WRITER_PRE_PRODUCTION_FACT_CASES_INCOMPLETE');
  const negativeTasks=[],negativeResults=[];
  for(const fact of selected){
    const chapterBinding=bindings.find(x=>x.project_fact_id===fact.project_fact_id&&x.target_type==='chapter');
    const context=createWriterSafeContext({projectId:PROJECT_ID,chapterId:chapterBinding.target_id,writerTaskId:null,facts:[fact],bindings:[chapterBinding],versions:{projectFactContextHash:fact.payload_hash,propagationBindingVersion:chapterBinding.contract_version,chapterPlanVersion:'production-e2e-v1',claimGateIdentity:'production-current'}});
    const task=service.buildTask({safeContext:context,chapterRole:'production_pre',chapterInstruction:'仅使用当前 Safe Context；不得把 claim_required 内容表达为企业 Claim。',bindings:[chapterBinding]});
    negativeTasks.push(task);negativeResults.push(service.runDeterministic(task));
  }
  const positive=buildSafePositiveWriterFixture({projectId:PROJECT_ID}),runtime=resolveExternalWriterRuntime(),inventory=writerTaskInventory(positive.writer_task,runtime.max_output_tokens);
  const chain={claim_assertion:{id:positive.claim.claim_id,status:'current'},gate_result:{id:positive.gate.gate_result_id,decision:positive.gate.decision,current:positive.gate.current},writer_eligible:positive.gate.writer_eligible,project_fact:{id:positive.project_fact.project_fact_id,status:positive.project_fact.review_status,current:true},propagation_binding:{id:positive.binding.propagation_id,status:positive.binding.binding_status,current:true},writer_safe_context:{id:positive.safe_context.authorization_snapshot_hash,status:'current'},assertable_claims:positive.safe_context.assertable_claims.length};
  const ready=runtime.configured&&runtime.model_available&&inventory.assertable_claims_count>=1&&chain.gate_result.decision==='allow'&&chain.writer_eligible===true;
  const preflight={authorization_status:ready?'READY_FOR_EXPLICIT_AUTHORIZATION':'BLOCKED_PENDING_RUNTIME_CONFIGURATION',data_classification:'REPRESENTATIVE_SYNTHETIC / NOT_REAL_CUSTOMER_DATA',customer_private_data:false,project_id:PROJECT_ID,provider:runtime.provider,model:runtime.model,model_availability:runtime.model_available?'AVAILABLE':'NOT_VERIFIED',endpoint_type:runtime.endpoint_type,endpoint_host:runtime.host||'UNCONFIGURED',mode:runtime.mode,prompt_version:runtime.prompt_version,positive_writer_task_count:1,negative_safety_task_count:negativeTasks.length,positive_tasks:[{...inventory,authorization_chain:chain}],totals:{context_items:inventory.context_items_count,assertable_claims:inventory.assertable_claims_count,estimated_input_characters:inventory.estimated_chars,estimated_input_tokens:inventory.estimated_input_tokens,max_output_tokens:runtime.max_output_tokens,expected_external_requests:1,concurrency:runtime.concurrency,retry_policy:'NO_AUTOMATIC_RETRY'},outbound_data_categories:{chapter_instruction:true,writer_task_minimal_metadata:true,current_chapter_safe_context:true,approved_project_fact_structured_values:true,current_assertable_claims:true,evidence_fact_structured_values:true},excluded_data_categories:{customer_private_data:true,evidence_source_span_raw_text:true,material_raw_text:true,full_enterprise_corpus:true,full_tender:true,other_chapters:true,audit_records:true,historical_writer_outputs:true,api_key_in_body:true},logging_policy:{allowed:['provider','model','request_id','writer_task_id','sanitized_request_hash','input_tokens','output_tokens','latency','provider_status','output_identity'],api_key_logged:false,authorization_header_logged:false,full_request_body_logged:false,full_provider_raw_response_logged:false},external_writer_calls_performed:0};
  if(!process.argv.includes('--preflight-only'))process.stdout.write(`${JSON.stringify({project_id:PROJECT_ID,negative_safety:{tasks:negativeTasks.length,rejected_outputs:negativeResults.filter(x=>x.output.status==='rejected').length,assertable_claims:negativeTasks.flatMap(x=>x.assertable_claims).length},positive_fixture:{gate_decision:positive.gate.decision,writer_eligible:positive.gate.writer_eligible,assertable_claims:positive.safe_context.assertable_claims.length},llm_usage:0,dify_usage:0,external_provider_usage:0,writer_calls:0},null,2)}\n`);
  process.stdout.write(`${JSON.stringify({external_writer_preflight:preflight},null,2)}\n`);
}finally{await pool.end();}
