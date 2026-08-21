import { runEvidenceGoldEvaluation } from './runner.js';

try{console.log(JSON.stringify(runEvidenceGoldEvaluation(),null,2));}catch(error){console.error(JSON.stringify({ok:false,error:{code:'EVIDENCE_GOLD_EVAL_FAILED',message:String(error.message)}}));process.exitCode=1;}
