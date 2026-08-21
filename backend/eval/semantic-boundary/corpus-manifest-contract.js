import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONTENT_ROLES, NEED_TYPES } from './contract.js';
import { loadEvaluationSnapshot } from './snapshot.js';

export const MANIFEST_VERSION = '4.3-evidence-corpus-manifest-v1';
export const SOURCE_AUTHORITIES = ['government_primary', 'corporate_primary', 'third_party_authoritative', 'internal_controlled', 'unknown'];
export const REVIEW_STATUSES = ['pending', 'approved', 'rejected'];
export const KNOWLEDGE_ORIGINS = ['enterprise_real_public', 'enterprise_representative_sme', 'industry_public', 'synthetic_fixture'];
const here = path.dirname(fileURLToPath(import.meta.url));
export function loadCorpusManifest(file = path.join(here, 'corpus-manifest-v1.json')) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
export function validateCorpusManifest(manifest, snapshot = loadEvaluationSnapshot()) {
  const errors = [];
  if (manifest.version !== MANIFEST_VERSION) errors.push('MANIFEST_VERSION_INVALID');
  if (!Array.isArray(manifest.materials) || !Array.isArray(manifest.acquisition_targets)) errors.push('MANIFEST_COLLECTION_INVALID');
  const ids = new Set(); const snapshotMaterials = new Map(snapshot.materials.map((x) => [x.material_id, x]));
  for (const item of manifest.materials || []) {
    if (!KNOWLEDGE_ORIGINS.includes(item.knowledge_origin)) errors.push(`${item.material_id}:KNOWLEDGE_ORIGIN_INVALID`);
    if (ids.has(item.material_id)) errors.push(`DUPLICATE_MATERIAL:${item.material_id}`); ids.add(item.material_id);
    for (const field of ['material_id','subject','source_type','source_authority','source_reference','file_hash','review_status','review_notes']) if (!(field in item)) errors.push(`${item.material_id}:MISSING_${field}`);
    for (const field of ['content_roles','topics','project_entities','product_entities','expected_evidence_needs']) if (!Array.isArray(item[field])) errors.push(`${item.material_id}:${field}_NOT_ARRAY`);
    if (!item.content_roles.every((x) => CONTENT_ROLES.includes(x))) errors.push(`${item.material_id}:CONTENT_ROLE_INVALID`);
    if (!item.expected_evidence_needs.every((x) => NEED_TYPES.includes(x))) errors.push(`${item.material_id}:EVIDENCE_NEED_INVALID`);
    if (!SOURCE_AUTHORITIES.includes(item.source_authority)) errors.push(`${item.material_id}:AUTHORITY_INVALID`);
    if (!REVIEW_STATUSES.includes(item.review_status)) errors.push(`${item.material_id}:REVIEW_STATUS_INVALID`);
    const source = snapshotMaterials.get(item.material_id); if (!source) errors.push(`${item.material_id}:SNAPSHOT_MATERIAL_MISSING`); else if (source.file_hash !== item.file_hash) errors.push(`${item.material_id}:FILE_HASH_MISMATCH`);
    if (item.generates_evidence_fact !== false || item.grants_claim_permission !== false) errors.push(`${item.material_id}:PRODUCTION_PERMISSION_FORBIDDEN`);
  }
  if (ids.size !== snapshot.materials.length) errors.push('SNAPSHOT_MATERIAL_COVERAGE_INCOMPLETE');
  const targetIds = new Set(); for (const target of manifest.acquisition_targets || []) { if (targetIds.has(target.target_id)) errors.push(`DUPLICATE_TARGET:${target.target_id}`); targetIds.add(target.target_id); if (!NEED_TYPES.includes(target.evidence_need_type)) errors.push(`${target.target_id}:TARGET_NEED_INVALID`); if (!CONTENT_ROLES.includes(target.target_content_role)) errors.push(`${target.target_id}:TARGET_ROLE_INVALID`); if (target.review_status !== 'pending') errors.push(`${target.target_id}:TARGET_MUST_BE_PENDING`); if (target.real_source_required !== true) errors.push(`${target.target_id}:REAL_SOURCE_REQUIRED`); }
  return { ok: errors.length === 0, errors, counts: { materials: manifest.materials?.length || 0, targets: manifest.acquisition_targets?.length || 0 } };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) { const result = validateCorpusManifest(loadCorpusManifest()); console.log(JSON.stringify(result)); if (!result.ok) process.exitCode = 1; }
