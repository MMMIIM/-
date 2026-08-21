import dotenv from 'dotenv';
import {resolve} from 'node:path';
import {resolveExternalWriterRuntime} from '../src/pipeline/external-writer-preflight-v1.js';

dotenv.config({path:resolve('.env'),quiet:true});
const runtime=resolveExternalWriterRuntime();
const fail=(code,message)=>{process.stderr.write(`${JSON.stringify({ok:false,error_code:code,message,provider:runtime.provider,model:runtime.model,host:runtime.host||'UNCONFIGURED',external_writer_calls:0})}\n`);process.exitCode=1;};
if(!runtime.configured)fail('PROVIDER_MODEL_CONFIGURATION_MISSING','External Writer API Base/Key 未配置。');
else try{
  const keySetting=String(process.env.EXTERNAL_WRITER_API_KEY||''),reference=keySetting.match(/^\$\{([A-Z][A-Z0-9_]*)\}$/)?.[1],apiKey=reference?process.env[reference]:keySetting;
  const response=await fetch(`${runtime.api_base}/models?sub_type=chat`,{method:'GET',headers:{Authorization:`Bearer ${apiKey}`},signal:AbortSignal.timeout(Math.min(runtime.timeout_ms,15000))});
  if(!response.ok)fail('PROVIDER_MODEL_UNAVAILABLE',`Provider model list returned HTTP ${response.status}.`);
  else{const payload=await response.json(),models=Array.isArray(payload?.data)?payload.data.map(item=>item?.id).filter(Boolean):[],available=models.includes(runtime.model);process.stdout.write(`${JSON.stringify({ok:true,provider:runtime.provider,selected_model:runtime.model||null,selected_model_available:available,available_chat_models:models,host:runtime.host,endpoint_type:'models_capability_check',project_data_sent:false,chat_completion_called:false,external_writer_calls:0})}\n`);if(runtime.model&&!available)process.exitCode=1;}
}catch(error){fail('PROVIDER_MODEL_CHECK_FAILED',error?.name==='TimeoutError'?'Provider model list timed out.':'Provider model list request failed.');}
