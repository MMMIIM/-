import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildGoldDatasets, GOLD_SCHEMA_VERSION, REVIEW_STATUSES } from '../contract.js';

const here=path.dirname(fileURLToPath(import.meta.url));
const spanAssessments=new Set(['correct','too_narrow','too_wide','incorrect']);

export function validateHumanSubmission(input,data=buildGoldDatasets()){
  const errors=[];if(input.schema_version!==GOLD_SCHEMA_VERSION)errors.push('schema_version');if(!String(input.reviewer||'').trim())errors.push('reviewer_required');if(!/^\d{4}-\d{2}-\d{2}T/.test(input.reviewed_at||''))errors.push('reviewed_at_required');
  const pending=new Map(data.evidence.filter((x)=>x.review_status==='pending').map((x)=>[x.case_id,x]));const seen=new Set();
  for(const item of input.reviews||[]){if(seen.has(item.case_id))errors.push(`${item.case_id}:duplicate`);seen.add(item.case_id);if(!pending.has(item.case_id))errors.push(`${item.case_id}:not_pending`);if(!REVIEW_STATUSES.has(item.review_status))errors.push(`${item.case_id}:review_status`);if(item.review_status==='approved'){if(typeof item.anchor_relevant!=='boolean'||typeof item.best_evidence_capable_anchor!=='boolean')errors.push(`${item.case_id}:anchor_decisions_required`);if(!spanAssessments.has(item.source_span_assessment))errors.push(`${item.case_id}:span_assessment_required`);const gold=item.human_gold;if(!gold||!Number.isInteger(gold.source_span?.char_start)||!Number.isInteger(gold.source_span?.char_end)||gold.source_span.char_end<=gold.source_span.char_start||!/^[0-9a-f]{64}$/.test(gold.source_hash||'')||!gold.facts||typeof gold.no_sufficient_evidence!=='boolean')errors.push(`${item.case_id}:complete_human_gold_required`);else for(const key of ['subject','entities','fact_status','fact_scopes','quantities','validity'])if(!(key in gold.facts))errors.push(`${item.case_id}:fact_${key}_required`);}if(item.review_status==='rejected'&&!String(item.review_notes||'').trim())errors.push(`${item.case_id}:rejection_notes_required`);}
  return{ok:errors.length===0,errors};
}

export function importHumanSubmission(input,existing={schema_version:GOLD_SCHEMA_VERSION,reviews:[]}){const data=buildGoldDatasets();const validation=validateHumanSubmission(input,data);if(!validation.ok)throw new Error(`HUMAN_REVIEW_INVALID:${validation.errors.join(',')}`);const merged=new Map((existing.reviews||[]).map((x)=>[x.case_id,x]));for(const item of input.reviews)if(item.review_status!=='pending')merged.set(item.case_id,{...item,reviewer:input.reviewer,reviewed_at:input.reviewed_at});return{schema_version:GOLD_SCHEMA_VERSION,reviews:[...merged.values()].sort((a,b)=>a.case_id.localeCompare(b.case_id))};}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const inputFile=process.argv[2];if(!inputFile){console.error('Usage: node import-human-review.js <explicit-human-submission.json>');process.exitCode=2;}else try{const input=JSON.parse(fs.readFileSync(path.resolve(inputFile),'utf8'));const target=path.join(here,'gold-reviews.json');const existing=fs.existsSync(target)?JSON.parse(fs.readFileSync(target,'utf8')):undefined;const result=importHumanSubmission(input,existing);fs.writeFileSync(target,`${JSON.stringify(result,null,2)}\n`);console.log(JSON.stringify({ok:true,imported:input.reviews.filter((x)=>x.review_status!=='pending').length}));}catch(error){console.error(JSON.stringify({ok:false,error:{code:'HUMAN_REVIEW_IMPORT_FAILED',message:String(error.message)}}));process.exitCode=1;}}
