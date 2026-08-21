import dotenv from 'dotenv';
import {resolve} from 'node:path';
import {resolveExternalWriterRuntime} from '../src/pipeline/external-writer-preflight-v1.js';

dotenv.config({path:resolve('.env'),quiet:true});
const runtime=resolveExternalWriterRuntime();
const fail=(code,message)=>{process.stderr.write(`${JSON.stringify({ok:false,error_code:code,message,provider:runtime.provider,model:runtime.model,host:runtime.host||'UNCONFIGURED',external_writer_calls:0})}\n`);process.exitCode=1;};
if(!runtime.configured)fail('PROVIDER_MODEL_CONFIGURATION_MISSING','External Writer API Base/Key 未配置。');
else try{
  const response=await fetch(`${runtime.api_base}/models`,{method:'GET',headers:{Authorization:`Bearer ${process.env.EXTERNAL_WRITER_API_KEY}`},signal:AbortSignal.timeout(Math.min(runtime.timeout_ms,15000))});
  if(!response.ok)fail('PROVIDER_MODEL_UNAVAILABLE',`Provider model list returned HTTP ${response.status}.`);
  else{const payload=await response.json(),available=Array.isArray(payload?.data)&&payload.data.some(item=>item?.id===runtime.model);if(!available)fail('PROVIDER_MODEL_UNAVAILABLE','Configured model is not available for this account.');else process.stdout.write(`${JSON.stringify({ok:true,provider:runtime.provider,model:runtime.model,host:runtime.host,endpoint_type:'models_capability_check',project_data_sent:false,chat_completion_called:false,external_writer_calls:0})}\n`);}
}catch(error){fail('PROVIDER_MODEL_CHECK_FAILED',error?.name==='TimeoutError'?'Provider model list timed out.':'Provider model list request failed.');}
