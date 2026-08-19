import { ProductionTaskProvider } from '../src/pipeline/production-task-provider.js';
const task=process.argv[2];const provider=new ProductionTaskProvider({provider:'mock'});
const requirement={req_id:'REQ-SMOKE',text:'系统应支持审计日志。',source_status:'verified',confirmation_type:'verified',requirement_category:'technical',writer_eligible:true};
if(task==='response_planning'){const result=await provider.responsePlanning({requirements:[requirement],approved_evidence:[]});console.log(JSON.stringify({ok:result.items.length===1,task_type:task,item_count:result.items.length,provider:result.provider}));}
else if(task==='claim_generation'){const plans=(await provider.responsePlanning({requirements:[requirement],approved_evidence:[]})).items;const result=await provider.claimGeneration({requirements:[requirement],plans,approved_evidence:[]});console.log(JSON.stringify({ok:result.items.length===1,task_type:task,item_count:result.items.length,provider:result.provider}));}
else{console.error('TASK_INVALID');process.exitCode=1;}
