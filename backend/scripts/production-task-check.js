import dotenv from 'dotenv';
import { dirname,resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const directory=dirname(fileURLToPath(import.meta.url));
dotenv.config({path:resolve(directory,'../.env'),override:true});
const task=process.argv[2]; const prefix=task==='response_planning'?'V43_PLAN_GATEWAY':'V43_CLAIM_GATEWAY';
if(!['response_planning','claim_generation'].includes(task)){console.error('TASK_INVALID');process.exitCode=1;}
else if((process.env.GENERATION_PROVIDER||'mock')==='mock')console.log(JSON.stringify({ok:true,task_type:task,provider:'mock'}));
else {const configured=Boolean(process.env[`${prefix}_API_BASE`]&&process.env[`${prefix}_API_KEY`]);console.log(JSON.stringify({ok:configured,task_type:task,provider:'semantic_gateway',configured}));if(!configured)process.exitCode=1;}
