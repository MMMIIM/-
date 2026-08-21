import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chunkEnterpriseMaterial, ENTERPRISE_MATERIAL_CHUNKER_VERSION } from '../../src/pipeline/enterprise-material-chunker.js';
import { loadCandidateSource } from '../evidence-gold/contract.js';

export const SNAPSHOT_VERSION='4.3-semantic-boundary-eval-snapshot-v1';
const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../../..');
const sha=(value)=>createHash('sha256').update(value).digest('hex');
const definitions=[
  ['5a4674b0-aaab-475a-964b-977ae4b1ff65','neusoft-smart-city.md','company_profile','东软智慧城市公开资料'],
  ['c7542760-5ed9-479e-a642-1ebf7999f446','neusoft-system-integration.md','product_documentation','东软系统集成公开资料'],
  ['427e5615-72e0-4d3d-b38a-f44891b993e2','neusoft-qualifications.md','qualification','东软资质认证公开资料'],
  ['2e553e66-a909-4ed1-b99e-a57c25b51824','ccgp-neusoft-project.md','project_case','国家信息中心三大平台项目中标公告']
];

export function buildEvaluationSnapshot(){const source=loadCandidateSource();const materials=[];const chunks=[];for(const [id,file,type,name] of definitions){const relative=`backend/testdata/live-enterprise-materials/${file}`;const text=fs.readFileSync(path.join(root,relative),'utf8').replace(/\r\n/g,'\n');const materialChunks=chunkEnterpriseMaterial(id,text);materials.push({material_id:id,material_type:type,original_name:file,safe_name:name,file_hash:sha(text),extraction_status:'succeeded',extraction_normalization:'utf8-lf-v1',extracted_text_hash:sha(text),source_asset:relative});chunks.push(...materialChunks);}
  const requirements=source.requirements.map((item)=>({requirement_id:item.id,text:item.text,category:item.category,source_text:null,source_clause:null,is_mandatory:null,is_final:true,requires_confirmation:null,source_status:'snapshot_provenance_unavailable',provenance:{source_project:source.project_id,status:'retained_gold_candidate_only'}}));
  return{metadata:{version:SNAPSHOT_VERSION,created_at:'2026-08-21T00:00:00.000Z',source_project:source.project_id,source_reference:'江阴市国有企业集中采购.pdf + four public Neusoft demo materials',contract_versions:{canonical_requirement:'v1',enterprise_material_chunker:ENTERPRISE_MATERIAL_CHUNKER_VERSION,semantic_boundary_candidate:'v1'},completeness_status:'incomplete_requirement_inventory',expected_live_counts:{requirements:221,materials:4,chunks:81},declared_counts:{requirements:requirements.length,materials:materials.length,chunks:chunks.length}},requirements,materials,chunks};}

export function validateEvaluationSnapshot(snapshot){const errors=[];if(snapshot.metadata?.version!==SNAPSHOT_VERSION)errors.push('SNAPSHOT_VERSION_INVALID');for(const key of ['requirements','materials','chunks'])if(snapshot[key].length!==snapshot.metadata.declared_counts[key])errors.push(`COUNT_MISMATCH:${key}`);const unique=(items,key,label)=>{const ids=items.map((x)=>x[key]);if(new Set(ids).size!==ids.length)errors.push(`DUPLICATE_${label}_ID`);};unique(snapshot.requirements,'requirement_id','REQUIREMENT');unique(snapshot.materials,'material_id','MATERIAL');unique(snapshot.chunks,'chunk_id','CHUNK');const materialIds=new Set(snapshot.materials.map((x)=>x.material_id));for(const chunk of snapshot.chunks){if(!materialIds.has(chunk.material_id))errors.push(`CHUNK_MATERIAL_MISSING:${chunk.chunk_id}`);if(!Number.isInteger(chunk.char_start)||!Number.isInteger(chunk.char_end)||chunk.char_end<=chunk.char_start)errors.push(`CHUNK_RANGE_INVALID:${chunk.chunk_id}`);if(sha(chunk.source_text)!==chunk.chunk_hash)errors.push(`CHUNK_HASH_INVALID:${chunk.chunk_id}`);}for(const material of snapshot.materials){const file=path.join(root,material.source_asset);const normalized=fs.existsSync(file)?fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n'):null;if(!normalized||sha(normalized)!==material.file_hash)errors.push(`MATERIAL_HASH_INVALID:${material.material_id}`);}if(snapshot.metadata.completeness_status==='complete'&&snapshot.requirements.some((x)=>!x.source_text||!x.source_status))errors.push('REQUIREMENT_PROVENANCE_INCOMPLETE');const expected=snapshot.metadata.expected_live_counts;const benchmarkComplete=snapshot.metadata.completeness_status==='complete'&&snapshot.requirements.length===expected.requirements&&snapshot.materials.length===expected.materials&&snapshot.chunks.length===expected.chunks;return{ok:errors.length===0,benchmark_complete:benchmarkComplete,errors,snapshot_hash:sha(JSON.stringify(snapshot))};}

export function loadEvaluationSnapshot(file=path.join(here,'snapshot-v1.partial.json')){return JSON.parse(fs.readFileSync(file,'utf8'));}
export function writeEvaluationSnapshot(file=path.join(here,'snapshot-v1.partial.json')){const snapshot=buildEvaluationSnapshot();fs.writeFileSync(file,`${JSON.stringify(snapshot,null,2)}\n`);return{snapshot,validation:validateEvaluationSnapshot(snapshot)};}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const result=writeEvaluationSnapshot();console.log(JSON.stringify({ok:result.validation.ok,benchmark_complete:result.validation.benchmark_complete,counts:result.snapshot.metadata.declared_counts,snapshot_hash:result.validation.snapshot_hash}));if(!result.validation.ok)process.exitCode=1;}
