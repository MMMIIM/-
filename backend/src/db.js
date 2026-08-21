import pg from 'pg';
import { createHash } from 'node:crypto';
import { sanitizeAuditJson, sanitizeAuditText } from './audit.js';
import { normalizeTenderFileRecord, normalizeUtf8FileName } from './file-name.js';
import { assertMandatoryRequirementMetadata } from './pipeline/mandatory-requirement.js';
import { createClaimGateEvaluationContract } from './pipeline/claim-gate-v2-contract.js';

const { Pool } = pg;
const EVIDENCE_LINEAGE_SQL=`mc.chunk_id IS NOT NULL AND mc.material_id=e.source_document_id AND ((e.source_location->>'resolver_version' IS NULL AND e.source_text=mc.source_text AND e.source_hash=mc.chunk_hash) OR (e.source_location->>'resolver_version'='evidence-source-span-v1' AND jsonb_typeof(e.source_location->'char_start')='number' AND jsonb_typeof(e.source_location->'char_end')='number' AND (e.source_location->>'anchor_chunk_id')=mc.chunk_id AND (e.source_location->>'char_start')::integer>=0 AND (e.source_location->>'char_end')::integer>(e.source_location->>'char_start')::integer AND mc.char_start>=(e.source_location->>'char_start')::integer AND mc.char_end<=(e.source_location->>'char_end')::integer AND e.source_text=substring(m.extracted_text FROM (e.source_location->>'char_start')::integer+1 FOR (e.source_location->>'char_end')::integer-(e.source_location->>'char_start')::integer) AND e.source_hash=encode(digest(convert_to(e.source_text,'UTF8'),'sha256'),'hex')))`;

export function createPool(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) throw new Error('DATABASE_URL is required');
  return new Pool({ connectionString });
}

export class PgRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async createProject({ name, deadline }) {
    const { rows } = await this.pool.query(
      `INSERT INTO projects (name, deadline) VALUES ($1, $2) RETURNING *`,
      [name, deadline || null]
    );
    return rows[0];
  }

  async listProjects() {
    const { rows } = await this.pool.query(`
      SELECT p.*, dv.version_number AS current_version, dv.risk_status
      FROM projects p LEFT JOIN document_versions dv ON dv.id = p.current_version_id
      ORDER BY p.updated_at DESC
    `);
    return rows;
  }

  async getProject(id) {
    const { rows } = await this.pool.query(`
      SELECT p.*, dv.version_number AS current_version, dv.risk_status
      FROM projects p LEFT JOIN document_versions dv ON dv.id = p.current_version_id
      WHERE p.id = $1
    `, [id]);
    return rows[0] || null;
  }

  async addTenderFile(file) {
    const { rows } = await this.pool.query(`
      INSERT INTO tender_files (project_id, original_name, storage_key, mime_type, size_bytes)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `, [file.projectId, file.originalName, file.storageKey, file.mimeType, file.sizeBytes]);
    await this.touchProject(file.projectId);
    return rows[0];
  }

  async listTenderFiles(projectId) {
    const { rows } = await this.pool.query(
      `SELECT * FROM tender_files WHERE project_id = $1 ORDER BY created_at DESC`, [projectId]
    );
    return rows.map(normalizeTenderFileRecord);
  }

  async getTenderFile(id) {
    const { rows } = await this.pool.query(
      `SELECT * FROM tender_files WHERE id = $1`, [id]
    );
    return normalizeTenderFileRecord(rows[0] || null);
  }

  async findCompanyMaterialByHash(projectId, fileHash) {
    const { rows } = await this.pool.query(`SELECT * FROM company_materials WHERE project_id=$1 AND file_hash=$2`, [projectId,fileHash]);
    return rows[0] || null;
  }

  async createCompanyMaterial(material) {
    const { rows } = await this.pool.query(`INSERT INTO company_materials(project_id,original_name,storage_key,material_type,mime_type,size_bytes,file_hash) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`, [material.projectId,material.originalName,material.storageKey,material.materialType,material.mimeType,material.sizeBytes,material.fileHash]);
    return rows[0];
  }

  async completeCompanyMaterialExtraction(id, extractedText) {
    const { rows } = await this.pool.query(`UPDATE company_materials SET extraction_status='succeeded',extracted_text=$2,extraction_error_code=NULL,extraction_error_message=NULL,updated_at=now() WHERE id=$1 RETURNING *`, [id,extractedText]);
    return rows[0];
  }

  async failCompanyMaterialExtraction(id, error) {
    const { rows } = await this.pool.query(`UPDATE company_materials SET extraction_status=$2,extracted_text=NULL,extraction_error_code=$3,extraction_error_message=$4,updated_at=now() WHERE id=$1 RETURNING *`, [id,error.status,error.code,error.message]);
    return rows[0];
  }

  async listCompanyMaterials(projectId) {
    const { rows } = await this.pool.query(`SELECT * FROM company_materials WHERE project_id=$1 ORDER BY created_at DESC`, [projectId]);
    return rows;
  }

  async getCompanyMaterial(id) {
    const { rows } = await this.pool.query(`SELECT * FROM company_materials WHERE id=$1`, [id]);
    return rows[0] || null;
  }

  async replaceMaterialChunks(materialId,chunks) {
    const client=await this.pool.connect();
    try{await client.query('BEGIN');await client.query(`DELETE FROM material_chunks WHERE material_id=$1`,[materialId]);
      for(const chunk of chunks)await client.query(`INSERT INTO material_chunks(chunk_id,material_id,chunk_index,source_text,char_start,char_end,page_start,page_end,paragraph_start,paragraph_end,section,chunk_hash,chunker_version) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,[chunk.chunk_id,materialId,chunk.chunk_index,chunk.source_text,chunk.char_start,chunk.char_end,chunk.page_start,chunk.page_end,chunk.paragraph_start,chunk.paragraph_end,chunk.section,chunk.chunk_hash,chunk.chunker_version]);
      await client.query('COMMIT');return chunks;
    }catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
  }

  async listMaterialChunks(materialId){const{rows}=await this.pool.query(`SELECT * FROM material_chunks WHERE material_id=$1 ORDER BY chunk_index`,[materialId]);return rows;}
  async getMaterialChunk(chunkId){const{rows}=await this.pool.query(`SELECT * FROM material_chunks WHERE chunk_id=$1`,[chunkId]);return rows[0]||null;}

  async upsertEvidenceSourceSpan(span){
    const{rows}=await this.pool.query(`INSERT INTO evidence_source_spans(span_id,project_id,material_id,source_document_id,anchor_chunk_id,requested_strategy,resolver_strategy,fallback_reason,start_offset,end_offset,source_text,source_text_hash,heading_path,source_chunk_ids,resolver_version) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14::jsonb,$15) ON CONFLICT(span_id) DO UPDATE SET span_id=EXCLUDED.span_id RETURNING *`,[span.span_id,span.project_id,span.material_id,span.source_document_id,span.anchor_chunk_id,span.requested_strategy,span.resolver_strategy,span.fallback_reason,span.start_offset,span.end_offset,span.source_text,span.source_text_hash,JSON.stringify(span.heading_path),JSON.stringify(span.source_chunk_ids),span.resolver_version]);return rows[0];
  }
  async getEvidenceSourceSpan(spanId){const{rows}=await this.pool.query(`SELECT * FROM evidence_source_spans WHERE span_id=$1`,[spanId]);return rows[0]||null;}

  async getEvidenceReviewCandidate({projectId,requirementId,retrievalRunId,retrievalCandidateId,sourceSpanId}){const{rows}=await this.pool.query(`SELECT $1::uuid AS project_id,r.id AS requirement_db_id,r.req_id AS requirement_id,r.content AS requirement_text,rr.retrieval_run_id,rr.chunk_id AS retrieval_candidate_id,rr.content_role,rr.role_compatibility,rr.matched_evidence_needs,s.span_id AS source_span_id,s.source_text,s.source_text_hash,s.resolver_version,m.id AS material_id,m.original_name AS source_material,m.material_type FROM requirements r JOIN enterprise_retrieval_runs er ON er.requirement_id=r.id AND er.retrieval_run_id=$3 AND er.status='succeeded' JOIN enterprise_retrieval_results rr ON rr.retrieval_run_id=er.retrieval_run_id AND rr.chunk_id=$4 JOIN evidence_source_spans s ON s.span_id=$5 AND s.project_id=$1 AND s.anchor_chunk_id=rr.chunk_id JOIN company_materials m ON m.id=s.material_id AND m.project_id=$1 WHERE r.project_id=$1 AND r.req_id=$2`,[projectId,requirementId,retrievalRunId,retrievalCandidateId,sourceSpanId]);return rows[0]||null;}
  async upsertEvidenceCandidateReview(value){const{rows}=await this.pool.query(`INSERT INTO evidence_candidate_reviews(review_id,project_id,requirement_id,retrieval_run_id,retrieval_candidate_id,source_span_id,requirement_text_hash,source_text_hash,semantic_relevance,evidence_capability,support_level,review_dimensions,reason_codes,requires_human_review,review_status,reviewer_type,reviewer_version,semantic_reviewer_version,contract_version,supplemental_note) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13::jsonb,$14,$15,$16,$17,$18,$19,$20) ON CONFLICT(review_id) DO UPDATE SET review_id=EXCLUDED.review_id RETURNING *`,[value.review_id,value.project_id,value.requirement_id,value.retrieval_run_id,value.retrieval_candidate_id,value.source_span_id,value.requirement_text_hash,value.source_text_hash,value.semantic_relevance,value.evidence_capability,value.support_level,JSON.stringify(value.review_dimensions),JSON.stringify(value.reason_codes),value.requires_human_review,value.review_status,value.reviewer_type,value.reviewer_version,value.semantic_reviewer_version,value.contract_version,value.supplemental_note]);return rows[0];}
  async getEvidenceCandidateReviewCurrent(reviewId){const{rows}=await this.pool.query(`SELECT ecr.*,r.content AS requirement_text,s.source_text_hash AS current_source_text_hash FROM evidence_candidate_reviews ecr JOIN requirements r ON r.id=ecr.requirement_id JOIN evidence_source_spans s ON s.span_id=ecr.source_span_id WHERE ecr.review_id=$1`,[reviewId]);return rows[0]||null;}
  async invalidateEvidenceCandidateReview(reviewId){const{rows}=await this.pool.query(`UPDATE evidence_candidate_reviews SET review_status='invalidated',updated_at=now() WHERE review_id=$1 RETURNING *`,[reviewId]);return rows[0]||null;}
  async decideEvidenceCandidateReview({reviewId,status,reviewer,note}){const{rows}=await this.pool.query(`UPDATE evidence_candidate_reviews SET review_status=$2,reviewer_type='human',reviewed_by=$3,reviewed_at=now(),human_review_version=human_review_version+1,supplemental_note=COALESCE($4,supplemental_note),updated_at=now() WHERE review_id=$1 AND review_status IN ('proposed','needs_review') RETURNING *`,[reviewId,status,reviewer,note]);return rows[0]||null;}
  async listEvidenceCandidateReviews(projectId){const{rows}=await this.pool.query(`SELECT ecr.*,r.req_id AS requirement_ref,r.content AS requirement_text,s.source_text AS source_excerpt,m.original_name AS source_material,m.material_type FROM evidence_candidate_reviews ecr JOIN requirements r ON r.id=ecr.requirement_id JOIN evidence_source_spans s ON s.span_id=ecr.source_span_id JOIN company_materials m ON m.id=s.material_id WHERE ecr.project_id=$1 ORDER BY ecr.created_at,ecr.review_id`,[projectId]);return rows;}

  async getApprovedReviewForFact(reviewId){const{rows}=await this.pool.query(`SELECT ecr.review_id,ecr.project_id,ecr.source_span_id,ecr.evidence_capability,ecr.support_level,ecr.contract_version AS evidence_review_contract_version,s.material_id,s.anchor_chunk_id,s.source_text,s.source_text_hash,m.material_type FROM evidence_candidate_reviews ecr JOIN evidence_source_spans s ON s.span_id=ecr.source_span_id JOIN company_materials m ON m.id=s.material_id WHERE ecr.review_id=$1 AND ecr.review_status='approved'`,[reviewId]);return rows[0]||null;}
  async upsertEvidenceSourceFact(value){const{rows}=await this.pool.query(`INSERT INTO evidence_source_facts(fact_id,project_id,evidence_review_id,source_span_id,material_id,subject,entities,fact_status,scopes,quantities,validity,domain_metadata,source,payload_hash,review_status,extractor_type,extractor_version,contract_version,version,supersedes_fact_id,edited,edited_by,edit_note) VALUES($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8,$9::jsonb,$10::jsonb,$11::jsonb,$12::jsonb,$13::jsonb,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23) ON CONFLICT(fact_id) DO UPDATE SET fact_id=EXCLUDED.fact_id RETURNING *`,[value.fact_id,value.project_id,value.evidence_review_id,value.source_span_id,value.material_id,JSON.stringify(value.subject),JSON.stringify(value.entities),value.status,JSON.stringify(value.scopes),JSON.stringify(value.quantities),JSON.stringify(value.validity),JSON.stringify(value.domain_metadata),JSON.stringify(value.source),value.payload_hash,value.review_status,value.extractor_type,value.extractor_version,value.contract_version,value.version,value.supersedes_fact_id,value.edited,value.edited_by,value.edit_note]);return rows[0];}
  async getEvidenceSourceFactCurrent(factId){const{rows}=await this.pool.query(`SELECT esf.*,esf.source->>'source_text_hash' AS source_text_hash,ecr.review_status AS evidence_review_status,ecr.contract_version AS evidence_review_contract_version,s.source_text,s.source_text_hash AS current_source_text_hash,s.anchor_chunk_id FROM evidence_source_facts esf JOIN evidence_candidate_reviews ecr ON ecr.review_id=esf.evidence_review_id JOIN evidence_source_spans s ON s.span_id=esf.source_span_id WHERE esf.fact_id=$1`,[factId]);return rows[0]||null;}
  async invalidateEvidenceSourceFact(factId){const{rows}=await this.pool.query(`UPDATE evidence_source_facts SET review_status='invalidated',updated_at=now() WHERE fact_id=$1 RETURNING *`,[factId]);return rows[0]||null;}
  async decideEvidenceSourceFact({factId,status,reviewer,note}){const{rows}=await this.pool.query(`UPDATE evidence_source_facts SET review_status=$2,reviewed_by=$3,reviewed_at=now(),human_review_version=human_review_version+1,review_note=$4,updated_at=now() WHERE fact_id=$1 AND review_status='draft' RETURNING *`,[factId,status,reviewer,note]);return rows[0]||null;}
  async listEvidenceSourceFacts(projectId){const{rows}=await this.pool.query(`SELECT esf.*,ecr.review_status AS evidence_review_status,s.source_text_hash AS current_source_text_hash FROM evidence_source_facts esf JOIN evidence_candidate_reviews ecr ON ecr.review_id=esf.evidence_review_id JOIN evidence_source_spans s ON s.span_id=esf.source_span_id WHERE esf.project_id=$1 ORDER BY esf.created_at,esf.fact_id`,[projectId]);return rows;}
  async getRequirementEvidenceFactMappingContext({projectId,requirementId,factId}){const{rows}=await this.pool.query(`SELECT r.id requirement_db_id,r.req_id requirement_id,r.project_id,r.content requirement_text,encode(digest(r.content,'sha256'),'hex') requirement_hash,r.canonical_rule_version requirement_contract_version,(rb.status='confirmed') requirement_valid,esf.fact_id,esf.payload_hash fact_payload_hash,esf.contract_version fact_contract_version,esf.review_status fact_review_status,esf.subject,esf.entities,esf.fact_status,esf.scopes,esf.quantities,esf.validity,esf.evidence_review_id,esf.source_span_id,esf.material_id FROM requirements r JOIN requirement_baselines rb ON rb.id=r.baseline_id JOIN evidence_source_facts esf ON esf.project_id=r.project_id WHERE r.project_id=$1 AND r.req_id=$2 AND esf.fact_id=$3`,[projectId,requirementId,factId]);return rows[0]||null;}
  async upsertRequirementEvidenceFactMapping(value){const{rows}=await this.pool.query(`INSERT INTO requirement_evidence_fact_mappings(mapping_id,project_id,requirement_id,evidence_fact_id,source_type,source,semantic_relationship,support_level,dimensions,reason_codes,review_status,reviewer_type,evaluator_version,contract_version,requirement_hash,requirement_contract_version,fact_payload_hash,fact_contract_version) VALUES($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9::jsonb,$10::jsonb,$11,$12,$13,$14,$15,$16,$17,$18) ON CONFLICT(mapping_id) DO UPDATE SET mapping_id=EXCLUDED.mapping_id RETURNING *`,[value.mapping_id,value.project_id,value.requirement_db_id,value.evidence_fact_id,value.source_type,JSON.stringify(value.source),value.semantic_relationship,value.support_level,JSON.stringify(value.dimensions),JSON.stringify(value.reason_codes),value.review_status,value.reviewer_type,value.evaluator_version,value.contract_version,value.requirement_hash,value.requirement_contract_version,value.fact_payload_hash,value.fact_contract_version]);return rows[0];}
  async invalidateObsoleteRequirementEvidenceFactMappings(value){await this.pool.query(`UPDATE requirement_evidence_fact_mappings SET review_status='invalidated',updated_at=now() WHERE project_id=$1 AND requirement_id=$2 AND evidence_fact_id=$3 AND mapping_id<>$4 AND review_status<>'invalidated'`,[value.project_id,value.requirement_db_id,value.evidence_fact_id,value.mapping_id]);}
  async getRequirementEvidenceFactMappingCurrent(mappingId){const{rows}=await this.pool.query(`SELECT m.*,encode(digest(r.content,'sha256'),'hex') current_requirement_hash,r.canonical_rule_version current_requirement_contract_version,(rb.status='confirmed') requirement_valid,esf.payload_hash current_fact_payload_hash,esf.contract_version current_fact_contract_version,esf.review_status fact_review_status FROM requirement_evidence_fact_mappings m JOIN requirements r ON r.id=m.requirement_id JOIN requirement_baselines rb ON rb.id=r.baseline_id JOIN evidence_source_facts esf ON esf.fact_id=m.evidence_fact_id WHERE m.mapping_id=$1`,[mappingId]);return rows[0]||null;}
  async invalidateRequirementEvidenceFactMapping(mappingId){const{rows}=await this.pool.query(`UPDATE requirement_evidence_fact_mappings SET review_status='invalidated',updated_at=now() WHERE mapping_id=$1 RETURNING *`,[mappingId]);return rows[0]||null;}
  async decideRequirementEvidenceFactMapping({mappingId,status,reviewer,note}){const{rows}=await this.pool.query(`UPDATE requirement_evidence_fact_mappings SET review_status=$2,reviewer_type='human',reviewed_by=$3,reviewed_at=now(),human_review_version=human_review_version+1,review_note=$4,updated_at=now() WHERE mapping_id=$1 AND review_status='proposed' RETURNING *`,[mappingId,status,reviewer,note]);return rows[0]||null;}
  async listRequirementEvidenceFactMappings(projectId){const{rows}=await this.pool.query(`SELECT m.*,r.req_id requirement_identifier FROM requirement_evidence_fact_mappings m JOIN requirements r ON r.id=m.requirement_id WHERE m.project_id=$1 ORDER BY m.created_at,m.mapping_id`,[projectId]);return rows;}

  async resolveProjectFactSources(projectId,refs){const result=[];for(const ref of refs){let row=null;if(ref.source_type==='requirement')row=(await this.pool.query(`SELECT r.req_id source_id,encode(digest(r.content,'sha256'),'hex') snapshot_hash,jsonb_build_object('requirement_id',r.req_id,'source_status',r.source_status,'requirement_text',r.content) source_ref,true available FROM requirements r JOIN requirement_baselines b ON b.id=r.baseline_id WHERE r.project_id=$1 AND r.req_id=$2 AND b.status='confirmed'`,[projectId,ref.source_id])).rows[0];else if(ref.source_type==='evidence_fact')row=(await this.pool.query(`SELECT fact_id source_id,payload_hash snapshot_hash,jsonb_build_object('fact_id',fact_id,'source_span_id',source_span_id,'evidence_review_id',evidence_review_id,'subject',subject,'entities',entities,'status',fact_status,'scopes',scopes,'quantities',quantities,'validity',validity) source_ref,(review_status='approved') available FROM evidence_source_facts WHERE project_id=$1 AND fact_id=$2`,[projectId,ref.source_id])).rows[0];else if(ref.source_type==='approved_claim')row=(await this.pool.query(`SELECT c.claim_id source_id,encode(digest((c.claim_id||':'||c.text||':'||g.id::text)::bytea,'sha256'),'hex') snapshot_hash,jsonb_build_object('claim_id',c.claim_id,'gate_evaluation_id',g.id,'claim_text',c.text) source_ref,(g.decision='allow' AND g.writer_eligible=true) available FROM claims c JOIN LATERAL(SELECT * FROM claim_gate_evaluations x WHERE x.claim_id=c.id ORDER BY x.evaluated_at DESC,x.id DESC LIMIT 1)g ON true WHERE c.project_id=$1 AND c.claim_id=$2`,[projectId,ref.source_id])).rows[0];else if(ref.source_type==='human_input')row={source_id:ref.source_id,snapshot_hash:createHash('sha256').update(String(ref.source_id)).digest('hex'),source_ref:ref.source_ref||null,available:true};else if(ref.source_type==='project_config')row={source_id:ref.source_id,snapshot_hash:'',source_ref:null,available:false};if(row)result.push({source_type:ref.source_type,...row});}return result;}
  projectFactRow(row){return row?{...row,key:row.fact_key,value:row.value_payload,scope:row.scope||[],provenance_refs:row.provenance_refs||[],source_hashes:row.source_hashes||[]}:null;}
  async upsertProjectFact(v){const{rows}=await this.pool.query(`INSERT INTO project_facts(project_fact_id,project_id,fact_key,fact_role,value_type,value_payload,unit,value_status,scope,provenance_refs,source_hashes,payload_hash,review_status,conflict_status,created_by_type,created_by,contract_version,candidate_version,version,supersedes_project_fact_id) VALUES($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9::jsonb,$10::jsonb,$11::jsonb,$12,$13,$14,$15,$16,$17,$18,$19,$20) ON CONFLICT(project_fact_id) DO UPDATE SET project_fact_id=EXCLUDED.project_fact_id RETURNING *`,[v.project_fact_id,v.project_id,v.key,v.fact_role,v.value_type,v.value===null?null:JSON.stringify(v.value),v.unit,v.value_status,JSON.stringify(v.scope),JSON.stringify(v.provenance_refs),JSON.stringify(v.source_hashes),v.payload_hash,v.review_status,v.conflict_status,v.created_by_type,v.created_by,v.contract_version,v.candidate_version,v.version,v.supersedes_project_fact_id]);return this.projectFactRow(rows[0]);}
  async listActiveProjectFactsByKey(projectId,key){const{rows}=await this.pool.query(`SELECT * FROM project_facts WHERE project_id=$1 AND fact_key=$2 AND review_status IN('proposed','needs_review','approved') ORDER BY created_at,project_fact_id`,[projectId,key]);return rows.map(r=>this.projectFactRow(r));}
  async listProjectFacts(projectId){const{rows}=await this.pool.query(`SELECT * FROM project_facts WHERE project_id=$1 ORDER BY fact_key,created_at,project_fact_id`,[projectId]);return rows.map(r=>this.projectFactRow(r));}
  async getProjectFactCurrent(id){const{rows}=await this.pool.query(`SELECT * FROM project_facts WHERE project_fact_id=$1`,[id]);return this.projectFactRow(rows[0]);}
  async markProjectFactConflicts(projectId,key){await this.pool.query(`UPDATE project_facts SET conflict_status='conflict',review_status=CASE WHEN review_status='approved' THEN 'invalidated' ELSE 'needs_review' END,updated_at=now() WHERE project_id=$1 AND fact_key=$2 AND review_status IN('proposed','needs_review','approved')`,[projectId,key]);}
  async decideProjectFact(id,status,reviewer,note){const{rows}=await this.pool.query(`UPDATE project_facts SET review_status=$2,reviewed_by=$3,reviewed_at=now(),human_review_version=human_review_version+1,review_note=$4,updated_at=now() WHERE project_fact_id=$1 AND review_status IN('proposed','needs_review') AND conflict_status<>'conflict' RETURNING *`,[id,status,reviewer,note]);return this.projectFactRow(rows[0]);}
  async invalidateProjectFact(id){const{rows}=await this.pool.query(`UPDATE project_facts SET review_status='invalidated',updated_at=now() WHERE project_fact_id=$1 RETURNING *`,[id]);return this.projectFactRow(rows[0]);}
  async resolveProjectFactConflict(projectId,key,selectedId){await this.pool.query(`UPDATE project_facts SET review_status=CASE WHEN project_fact_id=$3 THEN review_status ELSE 'invalidated' END,conflict_status=CASE WHEN project_fact_id=$3 THEN 'resolved' ELSE conflict_status END,updated_at=now() WHERE project_id=$1 AND fact_key=$2 AND (conflict_status='conflict' OR project_fact_id=$3)`,[projectId,key,selectedId]);}
  async upsertProjectFactPropagationBindings(bindings){const rows=[];for(const v of bindings){const result=await this.pool.query(`INSERT INTO project_fact_propagation_bindings(propagation_id,project_id,project_fact_id,project_fact_version,target_type,target_id,binding_role,binding_status,source_reason,source_ref,propagation_version,contract_version) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$12) ON CONFLICT(project_fact_id,project_fact_version,target_type,target_id,contract_version) DO UPDATE SET binding_role=EXCLUDED.binding_role,binding_status=EXCLUDED.binding_status,source_reason=EXCLUDED.source_reason,source_ref=EXCLUDED.source_ref,updated_at=now() RETURNING *`,[v.propagation_id,v.project_id,v.project_fact_id,v.project_fact_version,v.target_type,v.target_id,v.binding_role,v.binding_status,v.source_reason,JSON.stringify(v.source_ref),v.propagation_version,v.contract_version]);rows.push(result.rows[0]);}return rows;}
  async listProjectFactPropagationBindings(projectId,factId=null){const{rows}=await this.pool.query(`SELECT * FROM project_fact_propagation_bindings WHERE project_id=$1 AND ($2::text IS NULL OR project_fact_id=$2) ORDER BY target_type,target_id`,[projectId,factId]);return rows;}
  async saveProjectFactWriterContext(v){const{rows}=await this.pool.query(`INSERT INTO project_fact_writer_contexts(context_hash,project_id,chapter_id,project_fact_refs,requirement_version,claim_gate_identity,chapter_plan_version,binding_contract_version,propagation_contract_version,contract_version) VALUES($1,$2,$3,$4::jsonb,$5,$6,$7,$8,$9,$10) ON CONFLICT(context_hash) DO UPDATE SET context_hash=EXCLUDED.context_hash RETURNING *`,[v.context_hash,v.project_id,v.chapter_id,JSON.stringify(v.project_fact_refs),v.requirement_version,v.claim_gate_identity,v.chapter_plan_version,v.binding_contract_version,v.propagation_contract_version,v.contract_version]);return rows[0];}
  async saveProjectFactPropagationPlan(v){const{rows}=await this.pool.query(`INSERT INTO project_fact_propagation_plans(plan_id,plan_hash,project_id,previous_fact_id,current_fact_id,affected_requirements,affected_claims,affected_chapters,affected_writer_tasks,future_document_anchors,claim_revalidations,revalidation_required,regeneration_required,expected_target_count,resolved_target_count,unresolved_targets,coverage_status,plan_version,requirement_version,claim_gate_identity,chapter_plan_version,binding_contract_version,contract_version) VALUES($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8::jsonb,$9::jsonb,$10::jsonb,$11::jsonb,$12,$13,$14,$15,$16::jsonb,$17,$18,$19,$20,$21,$22,$23) ON CONFLICT(plan_id) DO UPDATE SET plan_id=EXCLUDED.plan_id RETURNING *`,[v.plan_id,v.plan_hash,v.project_id,v.previous_fact_id,v.current_fact_id,JSON.stringify(v.affected_requirements),JSON.stringify(v.affected_claims),JSON.stringify(v.affected_chapters),JSON.stringify(v.affected_writer_tasks),JSON.stringify(v.future_document_anchors),JSON.stringify(v.claim_revalidations),v.revalidation_required,v.regeneration_required,v.expected_target_count,v.resolved_target_count,JSON.stringify(v.unresolved_targets),v.coverage_status,v.plan_version,v.requirement_version,v.claim_gate_identity,v.chapter_plan_version,v.binding_contract_version,v.contract_version]);return rows[0];}
  async invalidateProjectFactPropagationArtifacts(projectId,v){const context=await this.pool.query(`UPDATE project_fact_writer_contexts SET status='invalidated',invalidation_reason='INPUT_VERSION_CHANGED',invalidated_at=now() WHERE project_id=$1 AND status='active' AND (requirement_version<>$2 OR claim_gate_identity<>$3 OR chapter_plan_version<>$4 OR binding_contract_version<>$5 OR propagation_contract_version<>$6)`,[projectId,v.requirementVersion,v.claimGateIdentity,v.chapterPlanVersion,v.bindingContractVersion,v.propagationContractVersion]);const plan=await this.pool.query(`UPDATE project_fact_propagation_plans SET status='invalidated',invalidation_reason='INPUT_VERSION_CHANGED',invalidated_at=now() WHERE project_id=$1 AND status='active' AND (requirement_version<>$2 OR claim_gate_identity<>$3 OR chapter_plan_version<>$4 OR binding_contract_version<>$5 OR contract_version<>$6)`,[projectId,v.requirementVersion,v.claimGateIdentity,v.chapterPlanVersion,v.bindingContractVersion,'project-fact-propagation-plan-v1']);return{contexts:context.rowCount,plans:plan.rowCount};}
  async invalidateProjectFactArtifactsByFact(factId){const a=await this.pool.query(`UPDATE project_fact_writer_contexts SET status='invalidated',invalidation_reason='PROJECT_FACT_CHANGED',invalidated_at=now() WHERE status='active' AND project_fact_refs @> $1::jsonb`,[JSON.stringify([{project_fact_id:factId}])]);const b=await this.pool.query(`UPDATE project_fact_propagation_plans SET status='invalidated',invalidation_reason='PROJECT_FACT_CHANGED',invalidated_at=now() WHERE status='active' AND current_fact_id=$1`,[factId]);await this.pool.query(`UPDATE project_fact_propagation_bindings SET binding_status='invalidated',updated_at=now() WHERE project_fact_id=$1 AND binding_status='active'`,[factId]);if((await this.pool.query(`SELECT to_regclass('writer_safe_contexts') name`)).rows[0].name){const safe=await this.pool.query(`UPDATE writer_safe_contexts SET status='invalidated',invalidation_reason='PROJECT_FACT_CHANGED',invalidated_at=now() WHERE status='active' AND context_items @> $1::jsonb RETURNING authorization_snapshot_hash`,[JSON.stringify([{project_fact_id:factId}])]);if(safe.rows.length)await this.pool.query(`UPDATE fact_mention_ledger SET status='invalidated',invalidated_at=now() WHERE source_context_hash=ANY($1::text[]) AND status<>'invalidated'`,[safe.rows.map(x=>x.authorization_snapshot_hash)]);}return{contexts:a.rowCount,plans:b.rowCount};}
  async saveWriterSafeContext(v){const{rows}=await this.pool.query(`INSERT INTO writer_safe_contexts(authorization_snapshot_hash,project_id,chapter_id,writer_task_id,context_items,assertable_claims,blocked_items,pending_items,project_fact_context_hash,propagation_binding_version,chapter_plan_version,claim_gate_identity,authorization_contract_version,contract_version) VALUES($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7::jsonb,$8::jsonb,$9,$10,$11,$12,$13,$14) ON CONFLICT(authorization_snapshot_hash) DO UPDATE SET authorization_snapshot_hash=EXCLUDED.authorization_snapshot_hash RETURNING *`,[v.authorization_snapshot_hash,v.project_id,v.chapter_id,v.writer_task_id,JSON.stringify(v.context_items),JSON.stringify(v.assertable_claims),JSON.stringify(v.blocked_items),JSON.stringify(v.pending_items),v.project_fact_context_hash,v.propagation_binding_version,v.chapter_plan_version,v.claim_gate_identity,v.authorization_contract_version,v.contract_version]);return rows[0];}
  async upsertFactMentionLedger(mentions){const rows=[];for(const v of mentions){const result=await this.pool.query(`INSERT INTO fact_mention_ledger(mention_id,project_id,chapter_id,writer_task_id,project_fact_id,project_fact_version,claim_id,gate_result_id,mention_role,source_context_hash,document_anchor,status,contract_version) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12,$13) ON CONFLICT(mention_id) DO UPDATE SET mention_id=EXCLUDED.mention_id RETURNING *`,[v.mention_id,v.project_id,v.chapter_id,v.writer_task_id,v.project_fact_id,v.project_fact_version,v.claim_id,v.gate_result_id,v.mention_role,v.source_context_hash,JSON.stringify(v.document_anchor),v.status,v.contract_version]);rows.push(result.rows[0]);}return rows;}
  async invalidateWriterAuthorization(projectId,v){const{rows}=await this.pool.query(`UPDATE writer_safe_contexts SET status='invalidated',invalidation_reason='AUTHORIZATION_INPUT_CHANGED',invalidated_at=now() WHERE project_id=$1 AND status='active' AND (project_fact_context_hash<>$2 OR propagation_binding_version<>$3 OR chapter_plan_version<>$4 OR claim_gate_identity<>$5 OR authorization_contract_version<>$6) RETURNING authorization_snapshot_hash`,[projectId,v.projectFactContextHash,v.propagationBindingVersion,v.chapterPlanVersion,v.claimGateIdentity,v.authorizationContractVersion]);if(rows.length)await this.pool.query(`UPDATE fact_mention_ledger SET status='invalidated',invalidated_at=now() WHERE source_context_hash=ANY($1::text[]) AND status<>'invalidated'`,[rows.map(x=>x.authorization_snapshot_hash)]);return rows.length;}

  async getCanonicalRequirementForRetrieval(id){const{rows}=await this.pool.query(`SELECT r.id,r.project_id,r.req_id,r.content AS text,r.requirement_category FROM requirements r JOIN requirement_baselines b ON b.id=r.baseline_id WHERE r.id=$1 AND b.status='confirmed'`,[id]);return rows[0]||null;}
  async createRetrievalRun(value){const{rows}=await this.pool.query(`INSERT INTO enterprise_retrieval_runs(project_id,requirement_id,requirement_ref,query_text,query_hash,embedding_model,embedding_version,embedding_dimension,top_k,filters,status,retrieval_contract_version,candidate_k,review_k,rerank_version,semantic_metadata) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,'running',$11,$12,$13,$14,$15::jsonb) RETURNING *`,[value.projectId,value.requirementDbId,value.requirementRef,value.queryText,value.queryHash,value.model,value.version,value.dimension,value.topK,JSON.stringify(value.filters),value.retrievalContractVersion,value.candidateK,value.reviewK,value.rerankVersion,JSON.stringify(value.semanticMetadata||{})]);return rows[0];}
  async listChunksForRetrieval({projectId,materialTypes,model,version}){const{rows}=await this.pool.query(`SELECT c.*,m.project_id,m.material_type,e.embedding_id,e.embedding_dimension FROM material_chunks c JOIN company_materials m ON m.id=c.material_id LEFT JOIN material_chunk_embeddings e ON e.chunk_id=c.chunk_id AND e.chunk_hash=c.chunk_hash AND e.embedding_model=$3 AND e.embedding_version=$4 WHERE m.project_id=$1 AND m.extraction_status='succeeded' AND (cardinality($2::text[])=0 OR m.material_type=ANY($2::text[])) ORDER BY c.material_id,c.chunk_index`,[projectId,materialTypes,model,version]);return rows;}
  async prepareRetrievalCandidates({queryVector,newEmbeddings,projectId,materialTypes,model,version,dimension,candidateK}){
    const vector=(values)=>`[${values.join(',')}]`;const client=await this.pool.connect();try{await client.query('BEGIN');
      for(const item of newEmbeddings)await client.query(`INSERT INTO material_chunk_embeddings(chunk_id,chunk_hash,embedding_model,embedding_version,embedding_dimension,embedding) VALUES($1,$2,$3,$4,$5,$6::vector) ON CONFLICT(chunk_id,chunk_hash,embedding_model,embedding_version) DO NOTHING`,[item.chunkId,item.chunkHash,item.model,item.version,item.dimension,vector(item.embedding)]);
      const{rows}=await client.query(`SELECT e.embedding_id,c.chunk_id,c.material_id,m.material_type,c.source_text,c.chunk_hash,e.embedding_model,e.embedding_version,1-(e.embedding <=> $1::vector) AS similarity_score FROM material_chunk_embeddings e JOIN material_chunks c ON c.chunk_id=e.chunk_id AND c.chunk_hash=e.chunk_hash JOIN company_materials m ON m.id=c.material_id WHERE m.project_id=$2 AND m.extraction_status='succeeded' AND e.embedding_model=$3 AND e.embedding_version=$4 AND e.embedding_dimension=$5 AND (cardinality($6::text[])=0 OR m.material_type=ANY($6::text[])) ORDER BY e.embedding <=> $1::vector,e.embedding_id LIMIT $7`,[vector(queryVector),projectId,model,version,dimension,materialTypes,candidateK]);await client.query('COMMIT');return rows.map((row,index)=>({...row,similarity_score:Number(row.similarity_score),rank:index+1,raw_vector_rank:index+1,raw_similarity:Number(row.similarity_score)}));
    }catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
  }
  async completeRetrievalRun({runId,ranking,latencyMs}){const client=await this.pool.connect();try{await client.query('BEGIN');const finalIds=new Set(ranking.final_candidates.map((item)=>item.chunk_id));for(const item of ranking.reranked_candidates)await client.query(`INSERT INTO enterprise_retrieval_results(retrieval_run_id,chunk_id,embedding_id,rank,similarity_score,raw_vector_rank,raw_similarity,reranked_rank,is_final,content_role,role_compatibility,matched_evidence_needs,rerank_reasons,retrieval_contract_version,rerank_version) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13::jsonb,$14,$15)`,[runId,item.chunk_id,item.embedding_id,item.reranked_rank,item.raw_similarity,item.raw_vector_rank,item.raw_similarity,item.reranked_rank,finalIds.has(item.chunk_id),item.content_role,item.role_compatibility,JSON.stringify(item.matched_evidence_needs),JSON.stringify(item.rerank_reasons),item.retrieval_contract_version,item.rerank_version]);const run=(await client.query(`UPDATE enterprise_retrieval_runs SET status='succeeded',completed_at=now(),latency_ms=$2,fallback_mode=$3 WHERE retrieval_run_id=$1 RETURNING *`,[runId,latencyMs,ranking.fallback_mode])).rows[0];await client.query('COMMIT');const decorate=(item)=>({...item,similarity_score:item.raw_similarity,rank:item.reranked_rank,risk_flags:item.material_type==='historical_bid'?['HISTORICAL_BID_REFERENCE_ONLY']:[],evidence_created:false});return{run,raw_candidates:ranking.raw_candidates.map(decorate),final_candidates:ranking.final_candidates.map(decorate),results:ranking.final_candidates.map(decorate)};}catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}}
  async failRetrievalRun({runId,errorCode,errorMessage,latencyMs}){const{rows}=await this.pool.query(`UPDATE enterprise_retrieval_runs SET status='failed',completed_at=now(),latency_ms=$2,error_code=$3,error_message=$4 WHERE retrieval_run_id=$1 RETURNING *`,[runId,latencyMs,errorCode,errorMessage]);return rows[0]||null;}
  async getRetrievalRun(runId){const run=(await this.pool.query(`SELECT * FROM enterprise_retrieval_runs WHERE retrieval_run_id=$1`,[runId])).rows[0];if(!run)return null;const{rows}=await this.pool.query(`SELECT rr.*,c.material_id,c.source_text,c.chunk_hash,m.material_type,e.embedding_model,e.embedding_version FROM enterprise_retrieval_results rr JOIN material_chunks c ON c.chunk_id=rr.chunk_id JOIN company_materials m ON m.id=c.material_id JOIN material_chunk_embeddings e ON e.embedding_id=rr.embedding_id WHERE rr.retrieval_run_id=$1 ORDER BY rr.reranked_rank NULLS LAST,rr.rank`,[runId]);const decorate=(row)=>({...row,source_document_id:row.material_id,source_chunk_id:row.chunk_id,similarity_score:Number(row.similarity_score),raw_similarity:Number(row.raw_similarity??row.similarity_score),risk_flags:row.material_type==='historical_bid'?['HISTORICAL_BID_REFERENCE_ONLY']:[],evidence_created:false});const rawCandidates=[...rows].sort((a,b)=>(a.raw_vector_rank??a.rank)-(b.raw_vector_rank??b.rank)).map(decorate),finalCandidates=rows.filter((row)=>row.is_final).map(decorate);return{run,raw_candidates:rawCandidates,final_candidates:finalCandidates,results:finalCandidates};}

  async getEvidenceReviewContext({projectId,requirementId,retrievalRunId}){
    const requirement=(await this.pool.query(`SELECT r.id AS requirement_id,r.req_id,r.content AS text,r.requirement_category AS category,r.is_mandatory,r.requires_confirmation FROM requirements r JOIN requirement_baselines b ON b.id=r.baseline_id WHERE r.project_id=$1 AND r.req_id=$2 AND b.status='confirmed'`,[projectId,requirementId])).rows[0];if(!requirement)return null;
    const run=(await this.pool.query(`SELECT retrieval_run_id,status,top_k,started_at AS created_at FROM enterprise_retrieval_runs WHERE project_id=$1 AND requirement_id=$2 AND ($3::uuid IS NULL OR retrieval_run_id=$3) ORDER BY started_at DESC LIMIT 1`,[projectId,requirement.requirement_id,retrievalRunId])).rows[0]||null;if(!run)return{requirement,retrieval_run:null,results:[]};
    const{rows}=await this.pool.query(`SELECT rr.rank,rr.similarity_score,c.chunk_id,c.material_id,m.original_name AS material_name,m.material_type,left(c.source_text,500) AS source_text_preview,jsonb_build_object('char_start',c.char_start,'char_end',c.char_end,'page_start',c.page_start,'page_end',c.page_end,'paragraph_start',c.paragraph_start,'paragraph_end',c.paragraph_end,'section',c.section) AS source_location,c.chunk_hash,e.id AS evidence_id,e.approval_status,e.validity_status,e.evidence_scope,e.capability_tags,(e.approval_status='approved' AND e.validity_status NOT IN ('expired','revoked') AND (${EVIDENCE_LINEAGE_SQL}) AND m.material_type<>'historical_bid') AS usable_for_claims,rem.mapping_id,rem.mapping_status,rem.support_level,rem.review_notes,rem.retrieval_run_id AS mapping_retrieval_run_id,rem.retrieval_chunk_id AS mapping_retrieval_chunk_id FROM enterprise_retrieval_results rr JOIN material_chunks c ON c.chunk_id=rr.chunk_id JOIN company_materials m ON m.id=c.material_id LEFT JOIN LATERAL (SELECT ev.* FROM evidences ev WHERE ev.project_id=$2 AND ev.source_document_id=c.material_id AND ev.source_chunk_id=c.chunk_id ORDER BY ev.created_at DESC LIMIT 1) e ON true LEFT JOIN material_chunks mc ON mc.chunk_id=e.source_chunk_id LEFT JOIN requirement_evidence_mappings rem ON rem.requirement_id=$3 AND rem.evidence_id=e.id WHERE rr.retrieval_run_id=$1 AND rr.is_final=true ORDER BY rr.reranked_rank NULLS LAST,rr.rank`,[run.retrieval_run_id,projectId,requirement.requirement_id]);return{requirement,retrieval_run:run,results:rows.map((row)=>({...row,similarity_score:Number(row.similarity_score)}))};
  }

  async getRetrievalEvidenceSource({projectId,requirementId,retrievalRunId,chunkId}){const{rows}=await this.pool.query(`SELECT er.retrieval_run_id,er.status,er.requirement_id,r.req_id,c.*,m.project_id,m.material_type,m.original_name FROM enterprise_retrieval_results rr JOIN enterprise_retrieval_runs er ON er.retrieval_run_id=rr.retrieval_run_id JOIN requirements r ON r.id=er.requirement_id JOIN material_chunks c ON c.chunk_id=rr.chunk_id JOIN company_materials m ON m.id=c.material_id WHERE er.retrieval_run_id=$3 AND rr.chunk_id=$4 AND er.project_id=$1 AND r.project_id=$1 AND r.req_id=$2 AND m.project_id=$1`,[projectId,requirementId,retrievalRunId,chunkId]);return rows[0]||null;}
  async findEvidenceBySourceSpan(projectId,materialId,charStart,charEnd,sourceHash){const{rows}=await this.pool.query(`SELECT * FROM evidences WHERE project_id=$1 AND source_document_id=$2 AND (source_location->>'char_start')::integer=$3 AND (source_location->>'char_end')::integer=$4 AND source_hash=$5 AND evidence_origin='enterprise' ORDER BY created_at LIMIT 1`,[projectId,materialId,charStart,charEnd,sourceHash]);return rows[0]||null;}

  async findInvalidConfirmedRequirementIds(projectId, requirementIds) {
    if (!requirementIds.length) return [];
    const { rows } = await this.pool.query(`SELECT req_id FROM requirements r JOIN requirement_baselines b ON b.id=r.baseline_id WHERE r.project_id=$1 AND b.status='confirmed' AND r.req_id=ANY($2::text[])`, [projectId,requirementIds]);
    const found = new Set(rows.map((item) => item.req_id));
    return requirementIds.filter((id) => !found.has(id));
  }

  async createEvidenceRecord(evidence) {
    const historical=evidence.evidenceType==='historical_bid';
    const riskNotes=historical?[evidence.riskNotes,'HISTORICAL_BID_REFERENCE_ONLY'].filter(Boolean).join('; '):evidence.riskNotes;
    const { rows } = await this.pool.query(`INSERT INTO evidences(evidence_id,project_id,material_id,source_type,source_roles,module,content,source_page,source_hash,evidence_level,commitment_level,evidence_type,title,source_text,source_paragraph,approval_status,applicable_requirement_ids,usage_scope,risk_notes,evidence_origin,source_document_id,source_chunk_id,source_location,evidence_scope,capability_tags,metadata,validity_status) VALUES($1,$2,$3::text,$4,'[]'::jsonb,$5,$6,$7,$8,'draft',$9,$4,$10,$11,$12,'draft',$13::jsonb,$14,$15,'enterprise',$3::uuid,$16,$17::jsonb,$18::jsonb,$19::jsonb,$20::jsonb,$21) RETURNING *`, [evidence.evidenceId,evidence.projectId,evidence.materialId,evidence.evidenceType,evidence.usageScope || 'general',evidence.content,evidence.sourcePage,evidence.sourceHash,'reference_only',evidence.title,evidence.sourceText,evidence.sourceParagraph,JSON.stringify(evidence.applicableRequirementIds),evidence.usageScope,riskNotes,evidence.sourceChunkId,JSON.stringify(evidence.sourceLocation),JSON.stringify(evidence.evidenceScope),JSON.stringify(evidence.capabilityTags),JSON.stringify(evidence.metadata),evidence.validityStatus]);
    return rows[0];
  }

  async decideEvidence({ id, decision, decidedBy, riskNotes }) {
    const { rows } = await this.pool.query(`UPDATE evidences SET approval_status=$2,approved_by=CASE WHEN $2='approved' THEN $3 ELSE NULL END,approved_at=CASE WHEN $2='approved' THEN now() ELSE NULL END,evidence_level=$2,risk_notes=COALESCE($4,risk_notes),updated_at=now() WHERE id=$1 RETURNING *`, [id,decision,decidedBy,riskNotes]);
    return rows[0] || null;
  }

  async updateEvidenceValidity({id,validityStatus,reviewedBy}){const{rows}=await this.pool.query(`UPDATE evidences SET validity_status=$2,validity_reviewed_by=$3,validity_reviewed_at=now(),updated_at=now() WHERE id=$1 RETURNING *`,[id,validityStatus,reviewedBy]);return rows[0]||null;}

  async listEvidenceCatalog(projectId) {
    const [evidences, counts] = await Promise.all([
      this.pool.query(`SELECT e.*,m.original_name AS material_name,m.material_type,(${EVIDENCE_LINEAGE_SQL}) AS source_lineage_verified,(e.approval_status='approved' AND e.evidence_origin='enterprise' AND e.validity_status NOT IN ('expired','revoked') AND (e.metadata->>'valid_until' IS NULL OR e.metadata->>'valid_until'>=CURRENT_DATE::text) AND (${EVIDENCE_LINEAGE_SQL}) AND m.material_type<>'historical_bid') AS usable_for_claims FROM evidences e LEFT JOIN company_materials m ON m.id=COALESCE(e.source_document_id,CASE WHEN e.material_id~*'^[0-9a-f-]{36}$' THEN e.material_id::uuid END) LEFT JOIN material_chunks mc ON mc.chunk_id=e.source_chunk_id AND mc.material_id=e.source_document_id WHERE e.project_id=$1 ORDER BY e.created_at DESC`, [projectId]),
      this.pool.query(`SELECT count(*) FILTER(WHERE approval_status='draft')::int draft,count(*) FILTER(WHERE approval_status='approved')::int approved,count(*) FILTER(WHERE approval_status='rejected')::int rejected FROM evidences WHERE project_id=$1`, [projectId])
    ]);
    return { evidences:evidences.rows, counts:counts.rows[0] };
  }

  async listApprovedEvidence(projectId) {
    const { rows } = await this.pool.query(`SELECT e.evidence_id,e.project_id,e.material_id,COALESCE(e.evidence_type,e.source_type) AS source_type,e.source_roles,COALESCE(e.usage_scope,e.module,'general') AS module,e.content,e.source_page,e.source_hash,'approved' AS evidence_level,e.commitment_level,e.approval_status,e.applicable_requirement_ids,e.evidence_origin,e.validity_status,true AS source_lineage_verified,(COALESCE(m.material_type,'other')<>'historical_bid') AS usable_for_claims FROM evidences e JOIN company_materials m ON m.id=e.source_document_id JOIN material_chunks mc ON mc.chunk_id=e.source_chunk_id AND mc.material_id=e.source_document_id WHERE e.project_id=$1 AND (${EVIDENCE_LINEAGE_SQL}) AND e.approval_status='approved' AND e.evidence_origin='enterprise' AND e.validity_status NOT IN ('expired','revoked') AND (e.metadata->>'valid_until' IS NULL OR e.metadata->>'valid_until'>=CURRENT_DATE::text) ORDER BY e.created_at`, [projectId]);
    return rows;
  }

  async listEnterpriseEvidenceBindings(projectId){const{rows}=await this.pool.query(`SELECT $1::uuid AS project_id,r.req_id AS requirement_id,rem.mapping_id,rem.mapping_status,rem.support_level,rem.review_notes,e.evidence_id,e.approval_status,e.validity_status,e.evidence_scope,e.capability_tags,e.metadata,e.content,e.source_text,e.title,e.evidence_type,m.material_type,(${EVIDENCE_LINEAGE_SQL}) AS source_lineage_verified,(e.approval_status='approved' AND e.validity_status NOT IN ('expired','revoked') AND (e.metadata->>'valid_until' IS NULL OR e.metadata->>'valid_until'>=CURRENT_DATE::text) AND (${EVIDENCE_LINEAGE_SQL}) AND m.material_type<>'historical_bid') AS usable_for_claims FROM requirement_evidence_mappings rem JOIN requirements r ON r.id=rem.requirement_id AND r.project_id=$1 JOIN evidences e ON e.id=rem.evidence_id AND e.project_id=$1 AND e.evidence_origin='enterprise' LEFT JOIN company_materials m ON m.id=e.source_document_id LEFT JOIN material_chunks mc ON mc.chunk_id=e.source_chunk_id ORDER BY r.ordinal,rem.created_at,rem.mapping_id`,[projectId]);return rows;}
  async listApprovedCurrentEvidenceFacts(projectId){const{rows}=await this.pool.query(`SELECT ef.*,e.evidence_id AS evidence_identifier,true AS is_current FROM evidence_facts ef JOIN evidences e ON e.id=ef.evidence_id AND e.project_id=ef.project_id WHERE ef.project_id=$1 AND ef.review_status='approved' AND NOT EXISTS(SELECT 1 FROM evidence_facts successor WHERE successor.supersedes_fact_id=ef.id AND successor.review_status='approved') ORDER BY ef.evidence_id,ef.created_at,ef.version`,[projectId]);return rows;}

  async validateRetrievalMappingProvenance({projectId,requirementId,evidenceId,retrievalRunId,retrievalChunkId}){const{rows}=await this.pool.query(`SELECT true AS valid FROM enterprise_retrieval_results rr JOIN enterprise_retrieval_runs er ON er.retrieval_run_id=rr.retrieval_run_id JOIN requirements r ON r.id=er.requirement_id JOIN evidences e ON e.id=$3 AND e.project_id=$1 AND e.source_chunk_id=rr.chunk_id WHERE er.retrieval_run_id=$4 AND rr.chunk_id=$5 AND er.project_id=$1 AND r.project_id=$1 AND r.req_id=$2`,[projectId,requirementId,evidenceId,retrievalRunId,retrievalChunkId]);return rows[0]?.valid===true;}
  async validateEvidenceForMapping(projectId,evidenceId){const{rows}=await this.pool.query(`SELECT e.approval_status,(${EVIDENCE_LINEAGE_SQL}) AS source_lineage_verified FROM evidences e LEFT JOIN company_materials m ON m.id=e.source_document_id LEFT JOIN material_chunks mc ON mc.chunk_id=e.source_chunk_id WHERE e.id=$2 AND e.project_id=$1 AND e.evidence_origin='enterprise'`,[projectId,evidenceId]);return rows[0]||null;}
  async createRequirementEvidenceMapping({projectId,requirementId,evidenceId,mappingSource,supportLevel,reviewNotes,retrievalRunId,retrievalChunkId,createdBy}){
    const{rows}=await this.pool.query(`INSERT INTO requirement_evidence_mappings(requirement_id,evidence_id,mapping_source,mapping_status,support_level,review_notes,retrieval_run_id,retrieval_chunk_id,created_by) SELECT r.id,e.id,$4,'proposed',$5,$6,$7,$8,$9 FROM requirements r JOIN requirement_baselines b ON b.id=r.baseline_id JOIN evidences e ON e.id=$3 AND e.project_id=$1 AND e.evidence_origin='enterprise' WHERE r.project_id=$1 AND r.req_id=$2 AND b.status='confirmed' ON CONFLICT(requirement_id,evidence_id) DO UPDATE SET mapping_source=EXCLUDED.mapping_source,mapping_status='proposed',support_level=EXCLUDED.support_level,review_notes=EXCLUDED.review_notes,retrieval_run_id=EXCLUDED.retrieval_run_id,retrieval_chunk_id=EXCLUDED.retrieval_chunk_id,created_by=EXCLUDED.created_by,reviewed_by=NULL,reviewed_at=NULL,updated_at=now() RETURNING *`,[projectId,requirementId,evidenceId,mappingSource,supportLevel,reviewNotes,retrievalRunId,retrievalChunkId,createdBy]);return rows[0]||null;
  }
  async getRequirementEvidenceMapping(mappingId){const{rows}=await this.pool.query(`SELECT * FROM requirement_evidence_mappings WHERE mapping_id=$1`,[mappingId]);return rows[0]||null;}
  async decideRequirementEvidenceMapping({mappingId,decision,supportLevel,reviewNotes,reviewedBy}){const{rows}=await this.pool.query(`WITH changed AS (UPDATE requirement_evidence_mappings SET mapping_status=$2,support_level=CASE WHEN $2='approved' THEN $3 ELSE support_level END,review_notes=COALESCE($4,review_notes),reviewed_by=$5,reviewed_at=now(),updated_at=now() WHERE mapping_id=$1 RETURNING *), linked AS (SELECT changed.*,r.req_id FROM changed JOIN requirements r ON r.id=changed.requirement_id), synced AS (UPDATE evidences e SET applicable_requirement_ids=CASE WHEN $2='approved' THEN (e.applicable_requirement_ids-linked.req_id)||jsonb_build_array(linked.req_id) ELSE e.applicable_requirement_ids-linked.req_id END,updated_at=now() FROM linked WHERE e.id=linked.evidence_id) SELECT mapping_id,requirement_id,evidence_id,mapping_source,mapping_status,support_level,review_notes,retrieval_run_id,retrieval_chunk_id,created_by,reviewed_by,reviewed_at,created_at,updated_at FROM changed`,[mappingId,decision,supportLevel,reviewNotes,reviewedBy]);return rows[0]||null;}
  async listRequirementEvidenceMappings(projectId,requirementId){const{rows}=await this.pool.query(`SELECT rem.mapping_id,r.req_id AS requirement_id,rem.evidence_id,rem.mapping_source,rem.mapping_status,rem.support_level,rem.review_notes,rem.retrieval_run_id,rem.retrieval_chunk_id,rem.created_by,rem.reviewed_by,rem.reviewed_at,rem.created_at,rem.updated_at FROM requirement_evidence_mappings rem JOIN requirements r ON r.id=rem.requirement_id WHERE r.project_id=$1 AND r.req_id=$2 ORDER BY rem.created_at,rem.mapping_id`,[projectId,requirementId]);return rows;}
  async listApprovedEnterpriseEvidenceForRequirement(projectId,requirementId){const{rows}=await this.pool.query(`SELECT e.*,m.original_name AS source_document_name,true AS source_lineage_verified,(rem.support_level IN ('full_support','partial_support') AND m.material_type<>'historical_bid') AS usable_for_claims,rem.mapping_id,rem.mapping_source,rem.support_level,rem.review_notes,rem.retrieval_run_id,rem.retrieval_chunk_id FROM requirement_evidence_mappings rem JOIN requirements r ON r.id=rem.requirement_id JOIN evidences e ON e.id=rem.evidence_id JOIN company_materials m ON m.id=e.source_document_id JOIN material_chunks mc ON mc.chunk_id=e.source_chunk_id AND mc.material_id=e.source_document_id WHERE r.project_id=$1 AND r.req_id=$2 AND (${EVIDENCE_LINEAGE_SQL}) AND rem.mapping_status='approved' AND rem.support_level IS NOT NULL AND e.approval_status='approved' AND e.evidence_origin='enterprise' AND e.validity_status NOT IN ('expired','revoked') AND (e.metadata->>'valid_until' IS NULL OR e.metadata->>'valid_until'>=CURRENT_DATE::text) ORDER BY rem.created_at`,[projectId,requirementId]);return rows;}

  async getEvidenceFactSource(projectId,evidenceId){const{rows}=await this.pool.query(`SELECT e.*,(${EVIDENCE_LINEAGE_SQL}) AS source_lineage_verified,m.material_type FROM evidences e LEFT JOIN company_materials m ON m.id=e.source_document_id LEFT JOIN material_chunks mc ON mc.chunk_id=e.source_chunk_id WHERE e.project_id=$1 AND e.id=$2 AND e.evidence_origin='enterprise'`,[projectId,evidenceId]);return rows[0]||null;}
  async createEvidenceFact(value){const{rows}=await this.pool.query(`INSERT INTO evidence_facts(fact_id,project_id,evidence_id,fact_type,subject_json,entities_json,fact_status,fact_scopes_json,quantities_json,validity_json,domain_metadata,source_text,source_location,source_hash,review_status,contract_version,version,supersedes_fact_id,created_by) VALUES($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7,$8::jsonb,$9::jsonb,$10::jsonb,$11::jsonb,$12,$13::jsonb,$14,'draft','4.3-evidence-fact-1',$15,$16,$17) RETURNING *`,[value.factId,value.projectId,value.evidenceId,value.factType,JSON.stringify(value.subject),JSON.stringify(value.entities),value.factStatus,JSON.stringify(value.factScopes),JSON.stringify(value.quantities),JSON.stringify(value.validity),JSON.stringify(value.domainMetadata),value.sourceText,JSON.stringify(value.sourceLocation),value.sourceHash,value.version,value.supersedesId,value.createdBy]);return rows[0];}
  async getEvidenceFactByIdentifier(identifier){const{rows}=await this.pool.query(`SELECT ef.*,e.approval_status AS evidence_approval_status,e.validity_status AS evidence_validity_status,m.material_type,(${EVIDENCE_LINEAGE_SQL}) AS source_lineage_verified FROM evidence_facts ef JOIN evidences e ON e.id=ef.evidence_id LEFT JOIN company_materials m ON m.id=e.source_document_id LEFT JOIN material_chunks mc ON mc.chunk_id=e.source_chunk_id WHERE ef.fact_id=$1 OR ef.id::text=$1`,[identifier]);return rows[0]||null;}
  async listEvidenceFacts(projectId,evidenceId){const{rows}=await this.pool.query(`SELECT ef.*,NOT EXISTS(SELECT 1 FROM evidence_facts successor WHERE successor.supersedes_fact_id=ef.id AND successor.review_status='approved') AS is_current FROM evidence_facts ef WHERE ef.project_id=$1 AND ef.evidence_id=$2 ORDER BY ef.created_at,ef.version`,[projectId,evidenceId]);return rows;}
  async listApprovedEvidenceFacts(projectId,evidenceId){const{rows}=await this.pool.query(`SELECT ef.*,(NOT EXISTS(SELECT 1 FROM evidence_facts successor WHERE successor.supersedes_fact_id=ef.id AND successor.review_status='approved')) AS is_current,(ef.review_status='approved' AND e.approval_status='approved' AND e.validity_status NOT IN ('expired','revoked') AND (e.metadata->>'valid_until' IS NULL OR e.metadata->>'valid_until'>=CURRENT_DATE::text) AND ef.validity_json->>'status' NOT IN ('expired','revoked') AND (ef.validity_json->>'valid_until' IS NULL OR ef.validity_json->>'valid_until'>=CURRENT_DATE::text) AND (${EVIDENCE_LINEAGE_SQL}) AND m.material_type<>'historical_bid' AND NOT EXISTS(SELECT 1 FROM evidence_facts successor WHERE successor.supersedes_fact_id=ef.id AND successor.review_status='approved')) AS usable_for_claims FROM evidence_facts ef JOIN evidences e ON e.id=ef.evidence_id LEFT JOIN company_materials m ON m.id=e.source_document_id LEFT JOIN material_chunks mc ON mc.chunk_id=e.source_chunk_id WHERE ef.project_id=$1 AND ef.evidence_id=$2 AND ef.review_status='approved' ORDER BY ef.created_at,ef.version`,[projectId,evidenceId]);return rows;}
  async decideEvidenceFact(factId,decision,reviewedBy,reviewNotes){const{rows}=await this.pool.query(`UPDATE evidence_facts ef SET review_status=$2,reviewed_by=$3,reviewed_at=now(),review_notes=$4,updated_at=now() FROM evidences e JOIN company_materials m ON m.id=e.source_document_id JOIN material_chunks mc ON mc.chunk_id=e.source_chunk_id AND mc.material_id=e.source_document_id WHERE ef.evidence_id=e.id AND ef.fact_id=$1 AND ef.review_status='draft' AND e.approval_status='approved' AND e.evidence_origin='enterprise' AND (${EVIDENCE_LINEAGE_SQL}) RETURNING ef.*`,[factId,decision,reviewedBy,reviewNotes]);return rows[0]||null;}

  async createParseJob({ projectId, tenderFileId }) {
    const { rows } = await this.pool.query(`
      INSERT INTO tender_parse_jobs (project_id, tender_file_id, status)
      VALUES ($1, $2, 'queued') RETURNING *
    `, [projectId, tenderFileId]);
    await this.touchProject(projectId);
    return rows[0];
  }

  async updateParseJob(id, status, { phase } = {}) {
    const { rows } = await this.pool.query(`
      UPDATE tender_parse_jobs
      SET status = $2, phase = COALESCE($3, phase),
        started_at = CASE WHEN $2 = 'running' THEN COALESCE(started_at, now()) ELSE started_at END,
        finished_at = CASE WHEN $2 IN ('succeeded', 'failed') THEN now() ELSE finished_at END,
        updated_at = now()
      WHERE id = $1 RETURNING *
    `, [id, status, phase || null]);
    return rows[0] || null;
  }

  async claimParseJob(jobId) {
    const { rows } = await this.pool.query(`
      UPDATE tender_parse_jobs
      SET phase = 'section_classification', updated_at = now()
      WHERE id = $1 AND status = 'running' AND phase = 'text_extraction'
      RETURNING *
    `, [jobId]);
    return rows[0] || null;
  }

  async updateParseJobProgress({
    jobId,
    phase,
    totalChunks,
    completedChunks,
    summary,
    extractedTextSha256,
    extractedCharacterCount
  }) {
    const { rows } = await this.pool.query(`
      UPDATE tender_parse_jobs
      SET phase = $2,
        total_chunks = COALESCE($3, total_chunks),
        completed_chunks = COALESCE($4, completed_chunks),
        summary_json = summary_json || COALESCE($5::jsonb, '{}'::jsonb),
        extracted_text_sha256 = COALESCE($6, extracted_text_sha256),
        extracted_character_count = COALESCE($7, extracted_character_count),
        updated_at = now()
      WHERE id = $1 RETURNING *
    `, [
      jobId, phase, totalChunks ?? null, completedChunks ?? null,
      summary === undefined ? null : JSON.stringify(summary),
      extractedTextSha256 ?? null, extractedCharacterCount ?? null
    ]);
    return rows[0] || null;
  }

  async initializeParseChunks(jobId, chunks) {
    const client = await this.pool.connect();
    const persisted = [];
    try {
      await client.query('BEGIN');
      for (const chunk of chunks) {
        const result = await client.query(`
          INSERT INTO tender_parse_chunks (
            parse_job_id, chunk_number, character_count, estimated_token_count,
            source_start_offset, source_end_offset, source_start_page, source_end_page,
            source_start_paragraph, source_end_paragraph, starts_at_title_boundary,
            content_sha256
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING id, chunk_number
        `, [
          jobId, chunk.chunk_number, chunk.character_count, chunk.estimated_token_count,
          chunk.source_start_offset, chunk.source_end_offset,
          chunk.source_start_page, chunk.source_end_page,
          chunk.source_start_paragraph, chunk.source_end_paragraph,
          chunk.starts_at_title_boundary, chunk.content_sha256
        ]);
        persisted.push(result.rows[0]);
      }
      await client.query(`
        UPDATE tender_parse_jobs
        SET phase = 'extracting', total_chunks = $2, completed_chunks = 0, updated_at = now()
        WHERE id = $1
      `, [jobId, chunks.length]);
      await client.query('COMMIT');
      return persisted;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async saveParseDocumentAnalysis({ jobId, sections, mandatoryScopeRules }) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      for (const section of sections) {
        await client.query(`
          INSERT INTO tender_document_sections (
            parse_job_id, section_key, title, chapter_number, archive_role,
            content_text, content_sha256, character_count,
            source_start_page, source_end_page, source_start_paragraph, source_end_paragraph,
            source_start_offset, source_end_offset
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        `, [
          jobId, section.section_key, section.title, section.chapter_number,
          section.archive_role, section.content_text, section.content_sha256,
          section.character_count, section.source_start_page, section.source_end_page,
          section.source_start_paragraph, section.source_end_paragraph,
          section.source_start_offset, section.source_end_offset
        ]);
      }
      for (const rule of mandatoryScopeRules) {
        await client.query(`
          INSERT INTO tender_mandatory_scope_rules (
            parse_job_id, mandatory_scope_source_text, mandatory_scope_section,
            exception_clause_ids, source_page, source_paragraph
          ) VALUES ($1, $2, $3, $4::jsonb, $5, $6)
        `, [
          jobId, rule.mandatory_scope_source_text, rule.mandatory_scope_section,
          JSON.stringify(rule.exception_clause_ids), rule.source_page, rule.source_paragraph
        ]);
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async startParseChunk(jobId, chunkNumber) {
    const { rows } = await this.pool.query(`
      UPDATE tender_parse_chunks
      SET status = 'running', started_at = now(), updated_at = now()
      WHERE parse_job_id = $1 AND chunk_number = $2 RETURNING *
    `, [jobId, chunkNumber]);
    return rows[0] || null;
  }

  async completeParseChunk({ jobId, chunkNumber, candidateCount, runtimeMs, gatewayAudit }) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`
        UPDATE tender_parse_chunks
        SET status = CASE WHEN $3 = 0 THEN 'succeeded_empty' ELSE 'succeeded' END,
          candidate_count = $3, runtime_ms = $4,
          gateway_audit_json = $5::jsonb, finished_at = now(), updated_at = now()
        WHERE parse_job_id = $1 AND chunk_number = $2
      `, [
        jobId, chunkNumber, candidateCount, runtimeMs,
        gatewayAudit === undefined ? null : JSON.stringify(gatewayAudit)
      ]);
      await client.query(`
        UPDATE tender_parse_jobs
        SET completed_chunks = completed_chunks + 1, updated_at = now()
        WHERE id = $1
      `, [jobId]);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async failParseChunk({ jobId, chunkNumber, errorCode, errorMessage, runtimeMs, gatewayAudit }) {
    await this.pool.query(`
      UPDATE tender_parse_chunks
      SET status = 'failed', error_code = $3, error_message = $4, runtime_ms = $5,
        gateway_audit_json = $6::jsonb, finished_at = now(), updated_at = now()
      WHERE parse_job_id = $1 AND chunk_number = $2
    `, [
      jobId, chunkNumber, errorCode, errorMessage, runtimeMs,
      gatewayAudit === undefined ? null : JSON.stringify(gatewayAudit)
    ]);
  }

  async completeParseJob({
    jobId,
    candidates,
    summary,
    warnings,
    gatewayAudit,
    extractedTextSha256,
    extractedCharacterCount,
    runtimeMs
  }) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const jobResult = await client.query(`
        UPDATE tender_parse_jobs
        SET status = 'succeeded', phase = 'succeeded', completed_chunks = total_chunks,
          summary_json = $2::jsonb, warnings_json = $3::jsonb,
          gateway_audit_json = $4::jsonb, extracted_text_sha256 = $5,
          extracted_character_count = $6, runtime_ms = $7,
          finished_at = now(), updated_at = now()
        WHERE id = $1 AND status = 'running'
        RETURNING *
      `, [
        jobId,
        JSON.stringify(summary),
        JSON.stringify(warnings),
        gatewayAudit === undefined ? null : JSON.stringify(gatewayAudit),
        extractedTextSha256,
        extractedCharacterCount,
        runtimeMs
      ]);
      if (!jobResult.rows[0]) throw new Error('Parse job is not running');
      for (const candidate of candidates) {
        await client.query(`
          INSERT INTO requirement_candidates
            (parse_job_id, req_id, content, source_excerpt, source_page, source_paragraph,
             ordinal, sources_json, source_text, is_mandatory, mandatory_marker,
             source_section, source_clause_id, mandatory_scope_source_text,
             mandatory_scope_section, exception_clause_ids, source_hash, source_chunk_id,
             category, mandatory_observed, requires_confirmation,
             source_page_start, source_page_end, source_paragraph_start, source_paragraph_end,
             source_paragraphs_json, source_match_type, source_match_score,
             source_resolution_status, source_resolution_method, source_resolved_at,
             source_verified, candidate_decision, decision_reason, decided_at, source_status,
             confirmation_reasons, risk_flags, source_evidence_json, deduplication_json, canonical_rule_version,
             requirement_category, writer_eligible, classification_review_required, classification_method)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11,
            $12, $13, $14, $15, $16::jsonb, $17, $18, $19, $20, $21,
            $22, $23, $24, $25, $26::jsonb, $27, $28, $29, $30,
            CASE WHEN $31 THEN now() ELSE NULL END, $31,
            CASE WHEN $31 THEN 'include' ELSE 'pending' END,
            CASE WHEN $31 THEN 'deterministic_source_resolution' ELSE NULL END,
            CASE WHEN $31 THEN now() ELSE NULL END,
            CASE WHEN $31 THEN 'verified' ELSE 'provisional' END,
            $32::jsonb,$33::jsonb,$34::jsonb,$35::jsonb,$36,$37,$38,$39,$40)
        `, [
          jobId, candidate.req_id, candidate.content, candidate.source_excerpt,
          candidate.source_page, candidate.source_paragraph, candidate.ordinal,
          JSON.stringify(candidate.sources || []), candidate.source_text,
          candidate.is_mandatory, candidate.mandatory_marker,
          candidate.source_section, candidate.source_clause_id,
          candidate.mandatory_scope_source_text, candidate.mandatory_scope_section,
          JSON.stringify(candidate.exception_clause_ids || []), candidate.source_hash,
          candidate.source_chunk_id, candidate.category, candidate.mandatory_observed === true,
          candidate.requires_confirmation === true,
          candidate.source_page_start ?? candidate.source_page,
          candidate.source_page_end ?? candidate.source_page,
          candidate.source_paragraph_start ?? candidate.source_paragraph,
          candidate.source_paragraph_end ?? candidate.source_paragraph,
          JSON.stringify(candidate.source_paragraphs_json || []), candidate.source_match_type || null,
          candidate.source_match_score ?? null, candidate.source_resolution_status || (candidate.source_hash ? 'verified' : 'unresolved'),
          candidate.source_resolution_method || (candidate.source_hash ? 'automatic' : null),
          candidate.source_verified === true || Boolean(candidate.source_hash),
          JSON.stringify(candidate.confirmation_reasons || []), JSON.stringify(candidate.risk_flags || []),
          JSON.stringify(candidate.source_evidence || {}), JSON.stringify(candidate.deduplication || {}),
          candidate.deduplication?.rule_version || null, candidate.requirement_category || null,
          candidate.writer_eligible === true, candidate.classification_review_required !== false,
          candidate.classification_method || 'automatic'
        ]);
      }
      await client.query(`UPDATE projects SET status = 'requirements_review', updated_at = now() WHERE id = $1`, [
        jobResult.rows[0].project_id
      ]);
      await client.query('COMMIT');
      return this.getParseJob(jobId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async failParseJob({
    jobId,
    errorCode,
    errorMessage,
    warnings,
    gatewayAudit,
    extractedTextSha256,
    extractedCharacterCount,
    runtimeMs,
    failedChunkNumber,
    summary
  }) {
    const { rows } = await this.pool.query(`
      UPDATE tender_parse_jobs
      SET status = 'failed', phase = 'failed', warnings_json = $2::jsonb,
        gateway_audit_json = $3::jsonb,
        extracted_text_sha256 = COALESCE($4, extracted_text_sha256),
        extracted_character_count = COALESCE($5, extracted_character_count), runtime_ms = $6,
        error_code = $7, error_message = $8, failed_chunk_number = $9,
        summary_json = summary_json || COALESCE($10::jsonb, '{}'::jsonb),
        finished_at = now(), updated_at = now()
      WHERE id = $1 RETURNING *
    `, [
      jobId,
      JSON.stringify(warnings || []),
      gatewayAudit === undefined ? null : JSON.stringify(gatewayAudit),
      extractedTextSha256,
      extractedCharacterCount,
      runtimeMs,
      errorCode,
      errorMessage,
      failedChunkNumber ?? null,
      summary === undefined ? null : JSON.stringify(summary)
    ]);
    if (rows[0]?.project_id) await this.touchProject(rows[0].project_id);
    return rows[0] || null;
  }

  async listParseJobs(projectId) {
    const { rows } = await this.pool.query(`
      SELECT j.id, j.project_id, j.tender_file_id, f.original_name AS file_name,
        j.status, j.phase, j.total_chunks, j.completed_chunks, j.failed_chunk_number,
        j.summary_json, j.warnings_json, j.runtime_ms,
        j.error_code, j.error_message, j.started_at, j.finished_at,
        j.created_at, j.updated_at, count(c.id)::int AS requirement_count
      FROM tender_parse_jobs j
      JOIN tender_files f ON f.id = j.tender_file_id
      LEFT JOIN requirement_candidates c ON c.parse_job_id = j.id
      WHERE j.project_id = $1
      GROUP BY j.id, f.original_name
      ORDER BY j.created_at DESC
    `, [projectId]);
    return rows.map((row) => ({ ...row, file_name: normalizeUtf8FileName(row.file_name) }));
  }

  async getParseJob(id) {
    const { rows } = await this.pool.query(`
      SELECT j.id, j.project_id, j.tender_file_id, f.original_name AS file_name,
        j.status, j.phase, j.total_chunks, j.completed_chunks, j.failed_chunk_number,
        j.summary_json, j.warnings_json, j.runtime_ms,
        j.error_code, j.error_message, j.started_at, j.finished_at,
        j.created_at, j.updated_at
      FROM tender_parse_jobs j
      JOIN tender_files f ON f.id = j.tender_file_id
      WHERE j.id = $1
    `, [id]);
    if (!rows[0]) return null;
    const [candidates, chunks, sections, scopeRules] = await Promise.all([this.pool.query(`
      SELECT id, req_id, content, source_excerpt, source_page, source_paragraph,
        source_text, is_mandatory, mandatory_marker,
        source_section, source_clause_id, mandatory_scope_source_text,
        mandatory_scope_section, exception_clause_ids, source_hash, source_chunk_id,
        category, mandatory_observed, requires_confirmation,
        source_page_start, source_page_end, source_paragraph_start, source_paragraph_end,
        source_paragraphs_json, source_match_type, source_match_score,
        source_resolution_status, source_resolution_method, source_resolved_at,
        source_verified, candidate_decision, decision_reason, decided_at,
        source_status, confirmed_by, confirmed_at, confirmation_type,
        requirement_category, writer_eligible, classification_review_required, atomicity_review_required,
        confirmation_reasons, risk_flags, source_evidence_json AS source_evidence,
        deduplication_json AS deduplication, canonical_rule_version,
        ordinal, status, sources_json, created_at
      FROM requirement_candidates WHERE parse_job_id = $1 ORDER BY ordinal
    `, [id]), this.pool.query(`
      SELECT chunk_number, status, character_count, estimated_token_count,
        source_start_offset, source_end_offset, source_start_page, source_end_page,
        source_start_paragraph, source_end_paragraph, starts_at_title_boundary,
        candidate_count, runtime_ms, error_code, error_message, started_at, finished_at
      FROM tender_parse_chunks WHERE parse_job_id = $1 ORDER BY chunk_number
    `, [id]), this.pool.query(`
      SELECT section_key, title, chapter_number, archive_role, character_count,
        source_start_page, source_end_page, source_start_paragraph, source_end_paragraph
      FROM tender_document_sections WHERE parse_job_id = $1 ORDER BY chapter_number NULLS LAST
    `, [id]), this.pool.query(`
      SELECT mandatory_scope_source_text, mandatory_scope_section, exception_clause_ids,
        source_page, source_paragraph
      FROM tender_mandatory_scope_rules WHERE parse_job_id = $1 ORDER BY created_at
    `, [id])]);
    return {
      ...rows[0],
      file_name: normalizeUtf8FileName(rows[0].file_name),
      candidates: candidates.rows,
      chunks: chunks.rows,
      document_sections: sections.rows,
      mandatory_scope_rules: scopeRules.rows
    };
  }

  async listRequirementCandidates(parseJobId, sourceStatus) {
    const params = [parseJobId];
    const filter = sourceStatus ? ' AND source_status = $2' : '';
    if (sourceStatus) params.push(sourceStatus);
    const job = (await this.pool.query(`SELECT id,project_id,status,phase FROM tender_parse_jobs WHERE id=$1`, [parseJobId])).rows[0];
    if (!job) return null;
    const { rows } = await this.pool.query(`SELECT * FROM requirement_candidates WHERE parse_job_id=$1${filter} ORDER BY ordinal`, params);
    return { job, candidates: rows };
  }

  async getRequirementConfirmationRisk(parseJobId) {
    const job = (await this.pool.query(`SELECT id,project_id,status,phase FROM tender_parse_jobs WHERE id=$1`, [parseJobId])).rows[0];
    if (!job) return null;
    const counts = (await this.pool.query(`
      SELECT count(*)::int total,
        count(*) FILTER(WHERE source_status='verified')::int verified,
        count(*) FILTER(WHERE source_status='provisional')::int provisional,
        count(*) FILTER(WHERE source_status='excluded')::int excluded,
        count(*) FILTER(WHERE source_status='provisional' AND candidate_decision='pending')::int provisional_pending,
        count(*) FILTER(WHERE source_status='provisional' AND candidate_decision='pending' AND is_mandatory)::int mandatory_provisional_pending,
        count(*) FILTER(WHERE classification_review_required)::int classification_review_required,
        count(*) FILTER(WHERE atomicity_review_required)::int atomicity_review_required
      FROM requirement_candidates WHERE parse_job_id=$1
    `, [parseJobId])).rows[0];
    const mandatory = (await this.pool.query(`SELECT id,req_id,content FROM requirement_candidates WHERE parse_job_id=$1 AND source_status='provisional' AND candidate_decision='pending' AND is_mandatory ORDER BY ordinal`, [parseJobId])).rows;
    return { job, ...counts, mandatory_provisional_requirements: mandatory,
      can_confirm: job.status === 'succeeded' && counts.provisional_pending === 0 && counts.total > counts.excluded };
  }

  async setCandidateSourceStatus({ candidateId, sourceStatus, confirmedBy }) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const previous = (await client.query(`SELECT * FROM requirement_candidates WHERE id=$1 FOR UPDATE`, [candidateId])).rows[0];
      if (!previous) throw Object.assign(new Error('候选需求不存在。'), { code: 'REQUIREMENT_CANDIDATE_NOT_FOUND', status: 404 });
      if (previous.status === 'confirmed') throw Object.assign(new Error('需求基线已确认，候选不可修改。'), { code: 'REQUIREMENT_BASELINE_FROZEN', status: 409 });
      if (sourceStatus === 'verified' && !(previous.source_verified && previous.source_hash && (previous.source_page || previous.source_paragraph))) {
        throw Object.assign(new Error('候选没有可核验的来源位置，不能标记为 verified。'), { code: 'VERIFIED_SOURCE_REQUIRED', status: 422 });
      }
      let result;
      if (sourceStatus === 'excluded') {
        result = await client.query(`UPDATE requirement_candidates SET exclusion_previous_state_json=jsonb_build_object('source_status',source_status,'candidate_decision',candidate_decision,'confirmed_by',confirmed_by,'confirmed_at',confirmed_at,'confirmation_type',confirmation_type),source_status='excluded',candidate_decision='exclude',decision_reason='manual_exclusion',decided_at=now(),confirmed_by=$2,confirmed_at=now(),confirmation_type='excluded' WHERE id=$1 RETURNING *`, [candidateId,confirmedBy]);
      } else if (sourceStatus === 'provisional') {
        result = await client.query(`UPDATE requirement_candidates SET source_status='provisional',source_verified=false,source_page=NULL,source_paragraph=NULL,source_page_start=NULL,source_page_end=NULL,source_paragraph_start=NULL,source_paragraph_end=NULL,source_paragraphs_json='[]'::jsonb,source_hash=NULL,source_match_type=NULL,source_match_score=NULL,source_resolution_method=NULL,candidate_decision='pending',decision_reason='manual_source_status_change',decided_at=now(),confirmed_by=NULL,confirmed_at=NULL,confirmation_type=NULL WHERE id=$1 RETURNING *`, [candidateId]);
      } else {
        result = await client.query(`UPDATE requirement_candidates SET source_status='verified',candidate_decision='include',decision_reason='manual_verified_status',decided_at=now(),confirmed_by=$2,confirmed_at=now(),confirmation_type='verified' WHERE id=$1 RETURNING *`, [candidateId,confirmedBy]);
      }
      await client.query(`INSERT INTO requirement_source_decision_audits(parse_job_id,candidate_id,action,previous_state_json,new_state_json,reason) VALUES($1,$2,'set_source_status',$3::jsonb,$4::jsonb,'manual_source_status_change')`, [previous.parse_job_id,candidateId,JSON.stringify({source_status:previous.source_status,candidate_decision:previous.candidate_decision}),JSON.stringify({source_status:result.rows[0].source_status,candidate_decision:result.rows[0].candidate_decision,confirmed_by:confirmedBy})]);
      await client.query('COMMIT'); return result.rows[0];
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }

  async restoreCandidate(candidateId) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const previous = (await client.query(`SELECT * FROM requirement_candidates WHERE id=$1 FOR UPDATE`, [candidateId])).rows[0];
      if (!previous) throw Object.assign(new Error('候选需求不存在。'), { code: 'REQUIREMENT_CANDIDATE_NOT_FOUND', status: 404 });
      if (previous.status === 'confirmed') throw Object.assign(new Error('需求基线已确认，候选不可修改。'), { code: 'REQUIREMENT_BASELINE_FROZEN', status: 409 });
      if (previous.source_status !== 'excluded') throw Object.assign(new Error('只有 excluded 候选可以恢复。'), { code: 'CANDIDATE_NOT_EXCLUDED', status: 409 });
      const state = previous.exclusion_previous_state_json || {};
      const restoredStatus = state.source_status === 'verified' && previous.source_verified ? 'verified' : 'provisional';
      const restoredDecision = restoredStatus === 'verified' ? 'include' : (state.candidate_decision === 'include' ? 'include' : 'pending');
      const result = await client.query(`UPDATE requirement_candidates SET source_status=$2,candidate_decision=$3,confirmed_by=$4,confirmed_at=$5,confirmation_type=$6,decision_reason='manual_restore',decided_at=now(),exclusion_previous_state_json=NULL WHERE id=$1 RETURNING *`, [candidateId,restoredStatus,restoredDecision,state.confirmed_by || null,state.confirmed_at || null,state.confirmation_type === 'excluded' ? null : state.confirmation_type || null]);
      await client.query(`INSERT INTO requirement_source_decision_audits(parse_job_id,candidate_id,action,previous_state_json,new_state_json,reason) VALUES($1,$2,'restore',$3::jsonb,$4::jsonb,'manual_restore')`, [previous.parse_job_id,candidateId,JSON.stringify({source_status:'excluded'}),JSON.stringify({source_status:restoredStatus,candidate_decision:restoredDecision})]);
      await client.query('COMMIT'); return result.rows[0];
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }

  async updateCandidateClassification({ candidateId, requirementCategory, writerEligible }) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const current = (await client.query(`SELECT status FROM requirement_candidates WHERE id=$1 FOR UPDATE`, [candidateId])).rows[0];
      if (!current) throw Object.assign(new Error('候选需求不存在。'), { code:'REQUIREMENT_CANDIDATE_NOT_FOUND', status:404 });
      if (current.status !== 'candidate') throw Object.assign(new Error('需求基线已确认，候选不可修改。'), { code:'REQUIREMENT_BASELINE_FROZEN', status:409 });
      const result = await client.query(`UPDATE requirement_candidates SET requirement_category=$2,writer_eligible=$3,classification_review_required=false,classification_method='manual' WHERE id=$1 RETURNING *`, [candidateId,requirementCategory,writerEligible]);
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }

  async getSourceReconciliationContext(parseJobId) {
    const result = await this.pool.query(`
      SELECT j.*, f.id AS file_id, f.original_name, f.storage_key, f.mime_type, f.size_bytes,
        r.file_hash AS previous_file_hash
      FROM tender_parse_jobs j JOIN tender_files f ON f.id=j.tender_file_id
      LEFT JOIN LATERAL (
        SELECT file_hash FROM requirement_source_reconciliations
        WHERE parse_job_id=j.id ORDER BY reconciled_at DESC LIMIT 1
      ) r ON true WHERE j.id=$1
    `, [parseJobId]);
    if (!result.rows[0]) return null;
    const row = result.rows[0];
    const [candidates, chunks, section] = await Promise.all([
      this.pool.query(`SELECT * FROM requirement_candidates WHERE parse_job_id=$1 ORDER BY ordinal`, [parseJobId]),
      this.pool.query(`SELECT * FROM tender_parse_chunks WHERE parse_job_id=$1 ORDER BY chunk_number`, [parseJobId]),
      this.pool.query(`SELECT * FROM tender_document_sections WHERE parse_job_id=$1 AND archive_role IN ('requirement_extraction','requirement_extraction_fallback') LIMIT 1`, [parseJobId])
    ]);
    return {
      job: row,
      file: { id: row.file_id, original_name: row.original_name, storage_key: row.storage_key, mime_type: row.mime_type, size_bytes: row.size_bytes },
      previous_file_hash: row.previous_file_hash,
      candidates: candidates.rows, chunks: chunks.rows, technical_section: section.rows[0] || null
    };
  }

  async saveSourceReconciliation({ parseJobId, tenderFileId, paragraphs, updates, fileHash, extractedTextHash, extractorVersion, extractedAt, statistics }) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`DELETE FROM tender_document_paragraphs WHERE parse_job_id=$1`, [parseJobId]);
      for (const paragraph of paragraphs) await client.query(`
        INSERT INTO tender_document_paragraphs
          (parse_job_id,tender_file_id,page_number,paragraph_number,text,normalized_text,start_offset,end_offset,text_hash,extractor_version)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      `, [parseJobId, tenderFileId, paragraph.page ?? null, paragraph.paragraph, paragraph.text,
        paragraph.text.normalize('NFKC').replace(/\s+/g, ''), paragraph.source_start_offset,
        paragraph.source_end_offset, createHash('sha256').update(paragraph.text).digest('hex'), extractorVersion]);
      for (const item of updates) await client.query(`
        UPDATE requirement_candidates SET
          source_page=$2,source_paragraph=$3,source_page_start=$4,source_page_end=$5,
          source_paragraph_start=$6,source_paragraph_end=$7,source_paragraphs_json=$8::jsonb,
          source_hash=$9,source_match_type=$10,source_match_score=$11,
          source_resolution_status=$12,source_resolution_method=$13,source_verified=$14,
          source_status=CASE WHEN $14 THEN 'verified' ELSE 'provisional' END,
          source_resolved_at=CASE WHEN $14 THEN now() ELSE NULL END,
          candidate_decision=$15,decision_reason=$16,decided_at=CASE WHEN $15='include' THEN now() ELSE decided_at END
        WHERE id=$1
      `, [item.id,item.source_page,item.source_paragraph,item.source_page_start,item.source_page_end,
        item.source_paragraph_start,item.source_paragraph_end,JSON.stringify(item.source_paragraphs_json || []),
        item.source_hash,item.source_match_type,item.source_match_score,item.source_resolution_status,
        item.source_resolution_method,item.source_verified,item.candidate_decision,item.decision_reason]);
      await client.query(`
        INSERT INTO requirement_source_reconciliations
          (parse_job_id,tender_file_id,extractor_version,file_hash,extracted_text_hash,status,statistics_json,extracted_at,reconciled_at)
        VALUES($1,$2,$3,$4,$5,'succeeded',$6::jsonb,$7,now())
        ON CONFLICT(parse_job_id,extractor_version,file_hash,extracted_text_hash)
        DO UPDATE SET statistics_json=excluded.statistics_json,status='succeeded',reconciled_at=now()
      `, [parseJobId,tenderFileId,extractorVersion,fileHash,extractedTextHash,JSON.stringify(statistics),extractedAt]);
      await client.query(`
        UPDATE tender_parse_jobs SET
          warnings_json=(SELECT COALESCE(jsonb_agg(value),'[]'::jsonb) FROM jsonb_array_elements(warnings_json) value WHERE COALESCE(value->>'code','') NOT LIKE 'SOURCE_LOCATION_%') ||
            CASE WHEN $2::int + $3::int > 0 THEN jsonb_build_array(jsonb_build_object('code','SOURCE_RECONCILIATION_REVIEW_REQUIRED','message',format('仍有 %s 条建议匹配、%s 条未定位候选需人工处理。',$2,$3))) ELSE '[]'::jsonb END,
          summary_json=summary_json || jsonb_build_object('source_reconciliation',$4::jsonb),updated_at=now()
        WHERE id=$1
      `, [parseJobId, statistics.suggested, statistics.unresolved, JSON.stringify(statistics)]);
      await client.query('COMMIT');
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }

  async getCandidateSourceReview(candidateId) {
    const candidate = (await this.pool.query(`
      SELECT c.*,k.source_start_paragraph AS chunk_start_paragraph,k.source_end_paragraph AS chunk_end_paragraph
      FROM requirement_candidates c LEFT JOIN tender_parse_chunks k ON k.id=c.source_chunk_id WHERE c.id=$1
    `, [candidateId])).rows[0];
    if (!candidate) return null;
    const paragraphs = await this.pool.query(`
      SELECT paragraph_number,page_number,text FROM tender_document_paragraphs
      WHERE parse_job_id=$1 AND paragraph_number BETWEEN GREATEST(1,COALESCE($2,$4,1)-3) AND COALESCE($3,$5,1)+3
      ORDER BY paragraph_number
    `, [candidate.parse_job_id, candidate.source_paragraph_start, candidate.source_paragraph_end,
      candidate.chunk_start_paragraph, candidate.chunk_end_paragraph]);
    return { candidate, paragraphs: paragraphs.rows };
  }

  async getCandidateParagraphRange(candidateId, start, end) {
    const { rows } = await this.pool.query(`
      SELECT p.* FROM tender_document_paragraphs p JOIN requirement_candidates c ON c.parse_job_id=p.parse_job_id
      WHERE c.id=$1 AND p.paragraph_number BETWEEN $2 AND $3 ORDER BY p.paragraph_number
    `, [candidateId,start,end]);
    return rows;
  }

  async saveCandidateSourceDecision({ candidateId, action, reason, location, confirmedBy = 'current_user' }) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const previous = (await client.query(`SELECT * FROM requirement_candidates WHERE id=$1 FOR UPDATE`, [candidateId])).rows[0];
      if (!previous) throw Object.assign(new Error('候选需求不存在。'), { code: 'REQUIREMENT_CANDIDATE_NOT_FOUND', status: 404 });
      const result = action === 'exclude'
        ? await client.query(`UPDATE requirement_candidates SET exclusion_previous_state_json=jsonb_build_object('source_status',source_status,'candidate_decision',candidate_decision,'confirmed_by',confirmed_by,'confirmed_at',confirmed_at,'confirmation_type',confirmation_type),candidate_decision='exclude',source_status='excluded',decision_reason=$2,decided_at=now(),confirmed_by=$3,confirmed_at=now(),confirmation_type='excluded' WHERE id=$1 AND status='candidate' RETURNING *`, [candidateId,reason,confirmedBy])
        : await client.query(`UPDATE requirement_candidates SET source_page=$2,source_paragraph=$3,source_page_start=$4,source_page_end=$5,source_paragraph_start=$6,source_paragraph_end=$7,source_paragraphs_json=$8::jsonb,source_hash=$9,source_match_type=$10,source_match_score=$11,source_resolution_status='verified',source_resolution_method='manual',source_verified=true,source_resolved_at=now(),source_status='verified',candidate_decision='include',decision_reason=$12,decided_at=now(),confirmed_by=$13,confirmed_at=now(),confirmation_type='verified' WHERE id=$1 RETURNING *`, [candidateId,location.source_page,location.source_paragraph,location.source_page_start,location.source_page_end,location.source_paragraph_start,location.source_paragraph_end,JSON.stringify(location.source_paragraphs_json),location.source_hash,location.source_match_type,location.source_match_score,reason,confirmedBy]);
      if (!result.rows[0]) throw Object.assign(new Error('需求基线已确认，候选不可修改。'), { code: 'REQUIREMENT_BASELINE_FROZEN', status: 409 });
      await client.query(`INSERT INTO requirement_source_decision_audits(parse_job_id,candidate_id,action,previous_state_json,new_state_json,reason) VALUES($1,$2,$3,$4::jsonb,$5::jsonb,$6)`, [previous.parse_job_id,candidateId,action,JSON.stringify({decision:previous.candidate_decision,status:previous.source_resolution_status}),JSON.stringify({decision:result.rows[0].candidate_decision,status:result.rows[0].source_resolution_status}),reason]);
      await client.query('COMMIT'); return result.rows[0];
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }

  async saveCandidateProvisionalDecision({ candidateId, confirmedBy }) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const previous = (await client.query(`SELECT * FROM requirement_candidates WHERE id=$1 FOR UPDATE`, [candidateId])).rows[0];
      if (!previous || previous.candidate_decision === 'exclude') throw Object.assign(new Error('候选需求不存在或已排除。'), { code: 'REQUIREMENT_CANDIDATE_NOT_FOUND', status: 404 });
      if (previous.status === 'confirmed') throw Object.assign(new Error('需求基线已确认，候选不可修改。'), { code: 'REQUIREMENT_BASELINE_FROZEN', status: 409 });
      if (previous.source_status !== 'provisional') throw Object.assign(new Error('只有 provisional 候选可以执行暂定确认。'), { code: 'CANDIDATE_NOT_PROVISIONAL', status: 409 });
      const result = await client.query(`
        UPDATE requirement_candidates SET candidate_decision='include', source_status='provisional',
          source_page=NULL, source_paragraph=NULL, source_page_start=NULL, source_page_end=NULL,
          source_paragraph_start=NULL, source_paragraph_end=NULL, source_paragraphs_json='[]'::jsonb,
          source_hash=NULL, source_match_type=NULL, source_match_score=NULL,
          source_resolution_method=NULL, source_verified=false,
          decision_reason='provisional_individual_confirmation', decided_at=now(),
          confirmed_by=$2, confirmed_at=now(), confirmation_type='provisional_individual'
        WHERE id=$1 RETURNING *
      `, [candidateId, confirmedBy]);
      await client.query(`INSERT INTO requirement_source_decision_audits(parse_job_id,candidate_id,action,previous_state_json,new_state_json,reason) VALUES($1,$2,'include_provisional',$3::jsonb,$4::jsonb,'provisional_individual_confirmation')`, [previous.parse_job_id,candidateId,JSON.stringify({decision:previous.candidate_decision,source_status:previous.source_status}),JSON.stringify({decision:'include',source_status:'provisional',confirmed_by:confirmedBy})]);
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }

  async includeProvisionalCandidates({ parseJobId, confirmedBy }) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const job = (await client.query(`SELECT status FROM tender_parse_jobs WHERE id=$1 FOR UPDATE`, [parseJobId])).rows[0];
      if (!job) throw Object.assign(new Error('需求解析任务不存在。'), { code: 'TENDER_PARSE_JOB_NOT_FOUND', status: 404 });
      if (job.status !== 'succeeded') throw Object.assign(new Error('需求解析任务尚未完成。'), { code: 'TENDER_PARSE_NOT_READY', status: 409 });
      const baseline = await client.query(`SELECT id FROM requirement_baselines WHERE parse_job_id=$1`, [parseJobId]);
      if (baseline.rows[0]) throw Object.assign(new Error('需求基线已确认，候选不可修改。'), { code: 'REQUIREMENT_BASELINE_FROZEN', status: 409 });
      const result = await client.query(`
        UPDATE requirement_candidates SET candidate_decision='include', source_status='provisional',
          source_page=NULL,source_paragraph=NULL,source_page_start=NULL,source_page_end=NULL,
          source_paragraph_start=NULL,source_paragraph_end=NULL,source_paragraphs_json='[]'::jsonb,
          source_hash=NULL,source_match_type=NULL,source_match_score=NULL,source_resolution_method=NULL,source_verified=false,
          decision_reason='provisional_bulk_confirmation',decided_at=now(),confirmed_by=$2,confirmed_at=now(),confirmation_type='provisional_bulk'
        WHERE parse_job_id=$1 AND source_status='provisional' AND candidate_decision='pending' AND is_mandatory=false
        RETURNING id
      `, [parseJobId, confirmedBy]);
      const mandatory = await client.query(`SELECT id,req_id FROM requirement_candidates WHERE parse_job_id=$1 AND source_status='provisional' AND candidate_decision='pending' AND is_mandatory=true ORDER BY ordinal`, [parseJobId]);
      await client.query(`INSERT INTO requirement_source_decision_audits(parse_job_id,candidate_id,action,previous_state_json,new_state_json,reason) SELECT $1,id,'include_provisional_bulk','{"decision":"pending","source_status":"provisional"}'::jsonb,jsonb_build_object('decision','include','source_status','provisional','confirmed_by',$2::text),'provisional_bulk_confirmation' FROM requirement_candidates WHERE id=ANY($3::uuid[])`, [parseJobId,confirmedBy,result.rows.map((item) => item.id)]);
      await client.query('COMMIT');
      return { included_count: result.rowCount, mandatory_manual_required: mandatory.rows };
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }

  async getRequirementBaseline(projectId) {
    const { rows } = await this.pool.query(`
      SELECT * FROM requirement_baselines
      WHERE project_id = $1 AND status = 'confirmed'
    `, [projectId]);
    if (!rows[0]) return null;
    const requirements = await this.pool.query(`
      SELECT id, req_id, content, source_excerpt, source_page, source_paragraph,
        source_text, is_mandatory, mandatory_marker,
        source_section, source_clause_id, mandatory_scope_source_text,
        mandatory_scope_section, exception_clause_ids, source_hash, source_chunk_id,
        category, requires_confirmation, source_page_start, source_page_end,
        source_paragraph_start, source_paragraph_end, source_paragraphs_json,
        source_match_type, source_match_score, source_resolution_method, source_verified,
        source_status, confirmed_by, confirmed_at, confirmation_type,
        requirement_category, writer_eligible, classification_review_required, atomicity_review_required, classification_method,
        confirmation_reasons, risk_flags, source_evidence_json AS source_evidence,
        deduplication_json AS deduplication, canonical_rule_version,
        target_sections, ordinal, created_at
      FROM requirements WHERE baseline_id = $1 ORDER BY ordinal
    `, [rows[0].id]);
    return { ...rows[0], requirements: requirements.rows };
  }

  async confirmRequirementBaseline({ jobId, requirements, confirmedBy }) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const jobResult = await client.query(`
        SELECT * FROM tender_parse_jobs WHERE id = $1 FOR UPDATE
      `, [jobId]);
      const job = jobResult.rows[0];
      if (!job || job.status !== 'succeeded') {
        throw Object.assign(new Error('Parse job is not ready'), { code: 'TENDER_PARSE_NOT_READY' });
      }
      const existing = await client.query(`
        SELECT id FROM requirement_baselines WHERE project_id = $1
      `, [job.project_id]);
      if (existing.rows[0]) {
        throw Object.assign(new Error('Requirement baseline is frozen'), { code: 'REQUIREMENT_BASELINE_FROZEN' });
      }
      const baselineResult = await client.query(`
        INSERT INTO requirement_baselines (project_id, parse_job_id, status)
        VALUES ($1, $2, 'building') RETURNING *
      `, [job.project_id, job.id]);
      const baseline = baselineResult.rows[0];
      for (const requirement of requirements) {
        assertMandatoryRequirementMetadata(requirement);
        await client.query(`
          INSERT INTO requirements
            (baseline_id, project_id, req_id, content, source_excerpt,
             source_page, source_paragraph, target_sections, ordinal,
             source_text, is_mandatory, mandatory_marker, source_section, source_clause_id,
             mandatory_scope_source_text, mandatory_scope_section, exception_clause_ids,
             source_hash, source_chunk_id, category, requires_confirmation,
             source_page_start, source_page_end, source_paragraph_start, source_paragraph_end,
             source_paragraphs_json, source_match_type, source_match_score,
             source_resolution_method, source_verified, source_status,
             confirmed_by, confirmed_at, confirmation_type, requirement_category,
             writer_eligible, classification_review_required, atomicity_review_required, classification_method,
             confirmation_reasons, risk_flags, source_evidence_json, deduplication_json, canonical_rule_version)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11, $12,
            $13, $14, $15, $16, $17::jsonb, $18, $19, $20, $21,
            $22, $23, $24, $25, $26::jsonb, $27, $28, $29, $30,
            $31, $32, $33, $34, $35, $36, $37, $38, $39,
            $40::jsonb,$41::jsonb,$42::jsonb,$43::jsonb,$44)
        `, [
          baseline.id, job.project_id, requirement.req_id, requirement.content,
          requirement.source_excerpt, requirement.source_page, requirement.source_paragraph,
          JSON.stringify(requirement.target_sections), requirement.ordinal,
          requirement.source_text, requirement.is_mandatory, requirement.mandatory_marker,
          requirement.source_section, requirement.source_clause_id,
          requirement.mandatory_scope_source_text, requirement.mandatory_scope_section,
          JSON.stringify(requirement.exception_clause_ids || []), requirement.source_hash,
          requirement.source_chunk_id, requirement.category,
          requirement.requires_confirmation === true,
          requirement.source_page_start, requirement.source_page_end,
          requirement.source_paragraph_start, requirement.source_paragraph_end,
          JSON.stringify(requirement.source_paragraphs_json || []), requirement.source_match_type,
          requirement.source_match_score, requirement.source_resolution_method,
          requirement.source_verified === true, requirement.source_status,
          requirement.confirmed_by || confirmedBy, requirement.confirmed_at || new Date(),
          requirement.confirmation_type || 'verified', requirement.requirement_category || null,
          requirement.writer_eligible === true, requirement.classification_review_required !== false,
          requirement.atomicity_review_required !== false, requirement.classification_method || 'automatic',
          JSON.stringify(requirement.confirmation_reasons || []), JSON.stringify(requirement.risk_flags || []),
          JSON.stringify(requirement.source_evidence || {}), JSON.stringify(requirement.deduplication || {}),
          requirement.deduplication?.rule_version || requirement.canonical_rule_version || null
        ]);
      }
      const confirmed = await client.query(`
        UPDATE requirement_baselines
        SET status = 'confirmed', confirmed_at = now(), confirmed_by = $2,
          confirmation_type = CASE WHEN EXISTS(SELECT 1 FROM requirements WHERE baseline_id=$1 AND source_status='provisional') THEN 'mixed_provisional' ELSE 'verified' END
        WHERE id = $1 RETURNING *
      `, [baseline.id, confirmedBy]);
      await client.query(`
        UPDATE requirement_candidates SET status = 'confirmed' WHERE parse_job_id = $1
      `, [job.id]);
      await client.query(`
        UPDATE projects SET status = 'requirements_confirmed', updated_at = now() WHERE id = $1
      `, [job.project_id]);
      await client.query('COMMIT');
      return {
        baseline: confirmed.rows[0],
        requirements: requirements.map((requirement) => ({ ...requirement }))
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async createJob({ projectId, inputs }) {
    const { rows } = await this.pool.query(`
      INSERT INTO generation_jobs (project_id, status, request_inputs)
      VALUES ($1, 'queued', $2) RETURNING *
    `, [projectId || null, inputs]);
    if (projectId) await this.pool.query(`UPDATE projects SET status = 'generating', updated_at = now() WHERE id = $1`, [projectId]);
    return rows[0];
  }

  async updateJob(id, status, error = {}) {
    const { rows } = await this.pool.query(`
      UPDATE generation_jobs SET status = $2, error_code = $3, error_message = $4,
        started_at = CASE WHEN $2 = 'running' THEN COALESCE(started_at, now()) ELSE started_at END,
        finished_at = CASE WHEN $2 IN ('succeeded', 'failed') THEN now() ELSE finished_at END,
        updated_at = now()
      WHERE id = $1 RETURNING *
    `, [id, status, error.code || null, error.message || null]);
    if (status === 'failed' && rows[0]?.project_id) {
      await this.pool.query(`UPDATE projects SET status = 'failed', updated_at = now() WHERE id = $1`, [rows[0].project_id]);
    }
    return rows[0];
  }

  async recordFailedGeneration({
    job,
    responsePayloadJson,
    rawDifyResponseJson,
    rawResponseText,
    errorCode,
    errorMessage,
    workflowVersion,
    runtimeMs
  }) {
    const serializedResponsePayload = responsePayloadJson === undefined
      ? null
      : JSON.stringify(responsePayloadJson);
    const serializedDifyResponse = rawDifyResponseJson === undefined
      ? null
      : JSON.stringify(rawDifyResponseJson);
    const { rows } = await this.pool.query(`
      INSERT INTO generations (
        project_id, job_id, response_payload_json, raw_dify_response_json, raw_response_text,
        error_code, error_message, workflow_version, runtime_ms, status
      )
      VALUES ($1, $2, $3::jsonb, $4::jsonb, $5, $6, $7, $8, $9, 'failed')
      RETURNING id, project_id, job_id, status, error_code, error_message,
        workflow_version, runtime_ms, response_payload_json, raw_dify_response_json,
        raw_response_text, created_at
    `, [
      job.project_id,
      job.id,
      serializedResponsePayload,
      serializedDifyResponse,
      rawResponseText ?? null,
      errorCode,
      errorMessage,
      workflowVersion,
      runtimeMs
    ]);
    return rows[0];
  }

  async completeGeneration({ job, parsed, workflowVersion, runtimeMs }) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const serializedPayload = JSON.stringify(parsed.raw);
      const sanitizedDifyResponse = sanitizeAuditJson(parsed.audit?.rawDifyResponseJson);
      const serializedDifyResponse = sanitizedDifyResponse === undefined
        ? null
        : JSON.stringify(sanitizedDifyResponse);
      const generationResult = await client.query(`
        INSERT INTO generations (
          project_id, job_id, response_payload_json, raw_dify_response_json,
          raw_response_text, error_code, error_message, workflow_version, runtime_ms, status
        )
        VALUES ($1, $2, $3::jsonb, $4::jsonb, $5, NULL, NULL, $6, $7, 'succeeded') RETURNING *
      `, [
        job.project_id, job.id, serializedPayload, serializedDifyResponse,
        sanitizeAuditText(parsed.audit?.rawResponseText) ?? null, workflowVersion, runtimeMs
      ]);
      let version = null;
      if (job.project_id) {
        const versionResult = await client.query(`
          INSERT INTO document_versions
            (project_id, generation_id, version_number, title, content_markdown, sections_json, warnings_json, risk_status)
          SELECT $1, $2, COALESCE(MAX(version_number), 0) + 1, $3, $4, $5::jsonb, $6::jsonb, $7
          FROM document_versions WHERE project_id = $1 RETURNING *
        `, [
          job.project_id, generationResult.rows[0].id, parsed.title, parsed.markdown,
          JSON.stringify(parsed.sections), JSON.stringify(parsed.warnings), parsed.riskStatus
        ]);
        version = versionResult.rows[0];
        await client.query(`UPDATE projects SET status = 'review', updated_at = now() WHERE id = $1`, [job.project_id]);
      }
      await client.query(`UPDATE generation_jobs SET status = 'succeeded', finished_at = now(), updated_at = now() WHERE id = $1`, [job.id]);
      await client.query('COMMIT');
      return { generation: generationResult.rows[0], version };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async listJobs(projectId) {
    const { rows } = await this.pool.query(
      `SELECT id, project_id, status, error_code, error_message, started_at, finished_at, created_at, updated_at
       FROM generation_jobs WHERE project_id = $1 ORDER BY created_at DESC`, [projectId]
    );
    return rows;
  }

  async listGenerations(projectId) {
    const { rows } = await this.pool.query(`
      SELECT id, project_id, job_id, status, error_code, error_message,
        workflow_version, runtime_ms, created_at,
        response_payload_json IS NOT NULL AS has_response_payload_json,
        raw_dify_response_json IS NOT NULL AS has_raw_dify_response_json,
        raw_response_text IS NOT NULL AS has_raw_response_text
      FROM generations WHERE project_id = $1 ORDER BY created_at DESC
    `, [projectId]);
    return rows;
  }

  async listVersions(projectId) {
    const { rows } = await this.pool.query(
      `SELECT * FROM document_versions WHERE project_id = $1 ORDER BY version_number DESC`, [projectId]
    );
    return rows;
  }

  async getVersion(id) {
    const { rows } = await this.pool.query(`SELECT * FROM document_versions WHERE id = $1`, [id]);
    return rows[0] || null;
  }

  async confirmVersion(version, confirmationText) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const decision = await client.query(`
        INSERT INTO review_decisions (project_id, document_version_id, decision, confirmation_text)
        VALUES ($1, $2, 'confirmed', $3) RETURNING *
      `, [version.project_id, version.id, confirmationText || null]);
      const versionResult = await client.query(`
        UPDATE document_versions SET status = 'confirmed', confirmed_at = now() WHERE id = $1 RETURNING *
      `, [version.id]);
      await client.query(`
        UPDATE projects SET current_version_id = $2, status = 'confirmed', updated_at = now() WHERE id = $1
      `, [version.project_id, version.id]);
      await client.query('COMMIT');
      return { decision: decision.rows[0], version: versionResult.rows[0] };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getFormalRequirements(projectId) {
    const { rows } = await this.pool.query(`SELECT id,req_id,content AS text,is_mandatory,target_sections,source_status,confirmed_by,confirmed_at,confirmation_type,requirement_category,writer_eligible,classification_review_required,atomicity_review_required,conditions,confirmation_reasons,risk_flags,source_evidence_json AS source_evidence,deduplication_json AS deduplication,canonical_rule_version,ordinal FROM requirements WHERE project_id=$1 AND source_status IN ('verified','provisional') ORDER BY ordinal`, [projectId]);
    return rows;
  }

  async replaceResponsePlans(projectId,{plans,constraints,provider,warnings}) {
    const client=await this.pool.connect();
    try{await client.query('BEGIN');
      await client.query(`DELETE FROM requirement_coverages WHERE project_id=$1`,[projectId]);
      await client.query(`DELETE FROM claims WHERE project_id=$1`,[projectId]);
      await client.query(`DELETE FROM response_plans WHERE project_id=$1`,[projectId]);
      await client.query(`DELETE FROM requirement_constraint_records WHERE project_id=$1`,[projectId]);
      const requirements=(await client.query(`SELECT id,req_id FROM requirements WHERE project_id=$1`,[projectId])).rows;const ids=new Map(requirements.map((r)=>[r.req_id,r.id]));
      for(const p of plans)await client.query(`INSERT INTO response_plans(project_id,requirement_id,response_status,response_summary,implementation_actions,optional_design,deliverables,acceptance_methods,conditions,supporting_evidence_ids,capability_gap,target_sections,source_status,requirement_category,confirmation_type,classification_review_required,atomicity_review_required,provider,provider_warnings,requirement_anchor) VALUES($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7::jsonb,$8::jsonb,$9::jsonb,$10::jsonb,$11,$12::jsonb,$13,$14,$15,$16,$17,$18,$19::jsonb,$20)`,[projectId,ids.get(p.requirement_id),p.response_status,p.response_summary,JSON.stringify(p.implementation_actions),JSON.stringify(p.optional_design),JSON.stringify(p.deliverables),JSON.stringify(p.acceptance_methods),JSON.stringify(p.conditions),JSON.stringify(p.supporting_evidence_ids),p.capability_gap||null,JSON.stringify(p.target_sections),p.source_status,p.requirement_category,p.confirmation_type,p.classification_review_required,p.atomicity_review_required,provider,JSON.stringify(warnings),p.requirement_anchor]);
      for(const c of constraints)await client.query(`INSERT INTO requirement_constraint_records(project_id,requirement_id,summary,source_status,confirmation_type,conditions) VALUES($1,$2,$3,$4,$5,$6::jsonb)`,[projectId,ids.get(c.requirement_id),c.summary,c.source_status,c.confirmation_type,JSON.stringify(c.conditions)]);
      const run=(await client.query(`INSERT INTO production_beta_runs(project_id,status,audit_json) VALUES($1,'succeeded',$2::jsonb) RETURNING *`,[projectId,JSON.stringify({task_type:'response_planning',provider,warnings})])).rows[0];
      await client.query('COMMIT');return run;
    }catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
  }

  async listResponsePlans(projectId){const [plans,constraints]=await Promise.all([this.pool.query(`SELECT rp.*,r.req_id AS requirement_id FROM response_plans rp JOIN requirements r ON r.id=rp.requirement_id WHERE rp.project_id=$1 ORDER BY r.ordinal`,[projectId]),this.pool.query(`SELECT cr.*,r.req_id AS requirement_id FROM requirement_constraint_records cr JOIN requirements r ON r.id=cr.requirement_id WHERE cr.project_id=$1 ORDER BY r.ordinal`,[projectId])]);return{plans:plans.rows,constraint_records:constraints.rows};}

  async editResponsePlan(projectId,requirementId,input){const allowed=['response_status','implementation_actions','conditions','capability_gap','supporting_evidence_ids'];for(const key of ['requirement_id','requirement_anchor','source_status','text','requirement_text'])if(Object.prototype.hasOwnProperty.call(input,key))throw Object.assign(new Error('Requirement 标识、原文、anchor 和来源状态不可编辑。'),{code:'RESPONSE_PLAN_IMMUTABLE_FIELD',status:422});const editedBy=String(input.edited_by||'').trim(),reason=String(input.edit_reason||'').trim();if(!editedBy||!reason)throw Object.assign(new Error('编辑人和编辑原因不能为空。'),{code:'RESPONSE_PLAN_EDIT_AUDIT_REQUIRED',status:422});const client=await this.pool.connect();try{await client.query('BEGIN');const previous=(await client.query(`SELECT rp.*,r.req_id AS requirement_id FROM response_plans rp JOIN requirements r ON r.id=rp.requirement_id WHERE rp.project_id=$1 AND r.req_id=$2 FOR UPDATE`,[projectId,requirementId])).rows[0];if(!previous)throw Object.assign(new Error('ResponsePlan 不存在。'),{code:'RESPONSE_PLAN_NOT_FOUND',status:404});const next={...previous};for(const key of allowed)if(Object.prototype.hasOwnProperty.call(input,key))next[key]=input[key];if(!['full','partial','confirm'].includes(next.response_status))throw Object.assign(new Error('response_status 无效。'),{code:'RESPONSE_PLAN_INVALID',status:422});next.capability_gap=String(next.capability_gap||'').trim();if(next.response_status==='partial'&&!next.capability_gap)throw Object.assign(new Error('partial 必须填写 capability_gap。'),{code:'CAPABILITY_GAP_REQUIRED',status:422});if(next.response_status!=='partial'&&next.capability_gap)throw Object.assign(new Error('非 partial 不得填写 capability_gap。'),{code:'CAPABILITY_GAP_NOT_ALLOWED',status:422});for(const key of ['implementation_actions','conditions','supporting_evidence_ids'])if(!Array.isArray(next[key]))throw Object.assign(new Error(`${key} 必须是数组。`),{code:'RESPONSE_PLAN_EDIT_INVALID',status:422});const approved=(await client.query(`SELECT evidence_id FROM evidence_catalog WHERE project_id=$1 AND approval_status='approved' AND evidence_id=ANY($2::text[])`,[projectId,next.supporting_evidence_ids])).rows.map((r)=>r.evidence_id);if(approved.length!==new Set(next.supporting_evidence_ids).size)throw Object.assign(new Error('只能选择 approved Evidence。'),{code:'EVIDENCE_NOT_APPROVED',status:422});const current=(await client.query(`UPDATE response_plans SET response_status=$2,implementation_actions=$3,conditions=$4,supporting_evidence_ids=$5,capability_gap=NULLIF($6,''),edited_by=$7,edited_at=now(),edit_reason=$8,updated_at=now() WHERE id=$1 RETURNING *`,[previous.id,next.response_status,JSON.stringify(next.implementation_actions),JSON.stringify(next.conditions),JSON.stringify(next.supporting_evidence_ids),next.capability_gap,editedBy,reason])).rows[0];await client.query(`INSERT INTO response_plan_edit_audits(project_id,response_plan_id,edited_by,edit_reason,previous_snapshot,current_snapshot) VALUES($1,$2,$3,$4,$5,$6)`,[projectId,previous.id,editedBy,reason,JSON.stringify(previous),JSON.stringify(current)]);await client.query('COMMIT');return{plan:{...current,requirement_id:requirementId},audit:{edited_by:editedBy,edited_at:current.edited_at,edit_reason:reason}};}catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}}

  async replaceClaimsAndCoverage(projectId,{evaluatedClaims,coverage,provider,warnings}){
    const client=await this.pool.connect();
    try{await client.query('BEGIN');await client.query(`DELETE FROM requirement_coverages WHERE project_id=$1`,[projectId]);await client.query(`DELETE FROM claims WHERE project_id=$1`,[projectId]);
      const requirements=(await client.query(`SELECT id,req_id FROM requirements WHERE project_id=$1`,[projectId])).rows;const ids=new Map(requirements.map((item)=>[item.req_id,item.id]));
      for(const item of evaluatedClaims){const c=item.claim;const row=(await client.query(`INSERT INTO claims(claim_id,project_id,requirement_id,claim_type,text,basis_requirement_ids,basis_evidence_ids,requested_commitment,target_sections,basis_requirement_source_statuses,source_status,requirement_category,confirmation_type,classification_review_required,atomicity_review_required,provider,provider_warnings) VALUES($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8,$9::jsonb,$10::jsonb,$11,$12,$13,$14,$15,$16,$17::jsonb) RETURNING id`,[c.claim_id,projectId,ids.get(c.requirement_id),c.claim_type,c.text,JSON.stringify(c.basis_requirement_ids),JSON.stringify(c.basis_evidence_ids),c.requested_commitment,JSON.stringify(c.target_sections),JSON.stringify(c.basis_requirement_source_statuses),c.source_status,c.requirement_category,c.confirmation_type,c.classification_review_required,c.atomicity_review_required,provider,JSON.stringify(warnings)])).rows[0];const d=item.decision;await client.query(`INSERT INTO claim_decisions(claim_id,decision,gate_decision,reason_code,reason_message,rule_version,decided_at) VALUES($1,$2,$2,$3,$4,$5,$6)`,[row.id,d.decision,d.reason_code,d.reason_message,d.rule_version,d.decided_at]);if(item.v2_evaluation){const v=item.v2_evaluation;await client.query(`INSERT INTO claim_gate_evaluations(claim_id,project_id,requirement_id,decision,reason_codes,dimensions,allowed_scope,required_conditions,evidence_ids,mapping_ids,rule_version,deterministic_checks,semantic_assessment,semantic_assessment_used,human_review_required,writer_eligible,legacy_decision_projection,evaluated_by) VALUES($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7::jsonb,$8::jsonb,$9::jsonb,$10::jsonb,$11,$12::jsonb,$13::jsonb,$14,$15,$16,$17,$18)`,[row.id,projectId,ids.get(c.requirement_id),v.decision,JSON.stringify(v.reason_codes),JSON.stringify(v.dimensions),JSON.stringify(v.allowed_scope),JSON.stringify(v.required_conditions),JSON.stringify(v.evidence_ids),JSON.stringify(v.mapping_ids),v.rule_version,JSON.stringify(v.deterministic_checks),v.semantic_assessment===null?null:JSON.stringify(v.semantic_assessment),v.semantic_assessment_used,v.human_review_required,v.writer_eligible,v.legacy_decision_projection,v.evaluated_by]);}}
      for(const x of coverage.coverage)await client.query(`INSERT INTO requirement_coverages(project_id,requirement_id,covered,approved_claim_ids,severity,source_status,requirement_category,is_mandatory,writer_eligible) VALUES($1,$2,$3,$4::jsonb,$5,$6,$7,$8,$9)`,[projectId,ids.get(x.requirement_id),x.covered,JSON.stringify(x.approved_claim_ids),x.severity,x.source_status,x.requirement_category,x.is_mandatory,x.writer_eligible]);
      const run=(await client.query(`INSERT INTO production_beta_runs(project_id,status,audit_json) VALUES($1,'succeeded',$2::jsonb) RETURNING *`,[projectId,JSON.stringify({task_type:'claim_generation',provider,warnings,coverage:{...coverage,coverage:undefined}})])).rows[0];await client.query('COMMIT');return run;
    }catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
  }

  async listClaims(projectId){const {rows}=await this.pool.query(`SELECT c.claim_id,c.claim_type,c.text,c.basis_requirement_ids,c.basis_evidence_ids,c.basis_requirement_source_statuses,c.requested_commitment,c.target_sections,c.source_status,c.requirement_category,c.confirmation_type,c.classification_review_required,c.atomicity_review_required,c.provider,c.provider_warnings,cd.decision,cd.gate_decision,cd.manual_decision,cd.reason_code,cd.reason_message,cd.rule_version,cd.decided_at,cd.decided_by,r.req_id AS requirement_id FROM claims c JOIN claim_decisions cd ON cd.claim_id=c.id JOIN requirements r ON r.id=c.requirement_id WHERE c.project_id=$1 ORDER BY r.ordinal,c.created_at`,[projectId]);return rows;}

  async createClaimGateEvaluation({projectId,claimId,requirementId,evaluation}){
    const value=createClaimGateEvaluationContract(evaluation);const{rows}=await this.pool.query(`INSERT INTO claim_gate_evaluations(claim_id,project_id,requirement_id,decision,reason_codes,dimensions,allowed_scope,required_conditions,evidence_ids,mapping_ids,rule_version,deterministic_checks,semantic_assessment,semantic_assessment_used,human_review_required,writer_eligible,legacy_decision_projection,evaluated_by) SELECT c.id,c.project_id,r.id,$4,$5::jsonb,$6::jsonb,$7::jsonb,$8::jsonb,$9::jsonb,$10::jsonb,$11,$12::jsonb,$13::jsonb,$14,$15,$16,$17,$18 FROM claims c JOIN requirements r ON r.id=c.requirement_id WHERE c.claim_id=$2 AND c.project_id=$1 AND r.project_id=$1 AND r.req_id=$3 RETURNING *`,[projectId,claimId,requirementId,value.decision,JSON.stringify(value.reason_codes),JSON.stringify(value.dimensions),JSON.stringify(value.allowed_scope),JSON.stringify(value.required_conditions),JSON.stringify(value.evidence_ids),JSON.stringify(value.mapping_ids),value.rule_version,JSON.stringify(value.deterministic_checks),value.semantic_assessment===null?null:JSON.stringify(value.semantic_assessment),value.semantic_assessment_used,value.human_review_required,value.writer_eligible,value.legacy_decision_projection,value.evaluated_by]);if(!rows[0])throw Object.assign(new Error('Claim、Requirement 不存在或不属于同一项目。'),{code:'CLAIM_GATE_EVALUATION_TARGET_INVALID',status:422});if((await this.pool.query(`SELECT to_regclass('writer_safe_contexts') name`)).rows[0].name){const invalidated=await this.pool.query(`UPDATE writer_safe_contexts SET status='invalidated',invalidation_reason='CLAIM_GATE_RESULT_CHANGED',invalidated_at=now() WHERE project_id=$1 AND status='active' AND assertable_claims @> $2::jsonb RETURNING authorization_snapshot_hash`,[projectId,JSON.stringify([{claim_id:claimId}])]);if(invalidated.rows.length)await this.pool.query(`UPDATE fact_mention_ledger SET status='invalidated',invalidated_at=now() WHERE source_context_hash=ANY($1::text[]) AND status<>'invalidated'`,[invalidated.rows.map(x=>x.authorization_snapshot_hash)]);}return rows[0];
  }
  async getClaimGateEvaluation(evaluationId){const{rows}=await this.pool.query(`SELECT cge.*,c.claim_id AS claim_identifier,r.req_id AS requirement_identifier FROM claim_gate_evaluations cge JOIN claims c ON c.id=cge.claim_id JOIN requirements r ON r.id=cge.requirement_id WHERE cge.id=$1`,[evaluationId]);return rows[0]||null;}
  async listClaimGateEvaluations(projectId,{claimId=null}={}){const{rows}=await this.pool.query(`SELECT cge.*,c.claim_id AS claim_identifier,r.req_id AS requirement_identifier FROM claim_gate_evaluations cge JOIN claims c ON c.id=cge.claim_id JOIN requirements r ON r.id=cge.requirement_id WHERE cge.project_id=$1 AND ($2::text IS NULL OR c.claim_id=$2) ORDER BY cge.evaluated_at,cge.created_at,cge.id`,[projectId,claimId]);return rows;}
  async getLatestClaimGateEvaluation(projectId,claimId){const{rows}=await this.pool.query(`SELECT cge.*,c.claim_id AS claim_identifier,r.req_id AS requirement_identifier FROM claim_gate_evaluations cge JOIN claims c ON c.id=cge.claim_id JOIN requirements r ON r.id=cge.requirement_id WHERE cge.project_id=$1 AND c.claim_id=$2 ORDER BY cge.evaluated_at DESC,cge.created_at DESC,cge.id DESC LIMIT 1`,[projectId,claimId]);return rows[0]||null;}

  async listCoverage(projectId){const {rows}=await this.pool.query(`SELECT r.req_id AS requirement_id,rc.covered,rc.approved_claim_ids,rc.severity,rc.source_status,rc.requirement_category,rc.is_mandatory,rc.writer_eligible FROM requirement_coverages rc JOIN requirements r ON r.id=rc.requirement_id WHERE rc.project_id=$1 ORDER BY r.ordinal`,[projectId]);return rows;}

  async replaceCoverage(projectId,coverage){const client=await this.pool.connect();try{await client.query('BEGIN');await client.query(`DELETE FROM requirement_coverages WHERE project_id=$1`,[projectId]);const requirements=(await client.query(`SELECT id,req_id FROM requirements WHERE project_id=$1`,[projectId])).rows;const ids=new Map(requirements.map((r)=>[r.req_id,r.id]));for(const x of coverage.coverage)await client.query(`INSERT INTO requirement_coverages(project_id,requirement_id,covered,approved_claim_ids,severity,source_status,requirement_category,is_mandatory,writer_eligible) VALUES($1,$2,$3,$4::jsonb,$5,$6,$7,$8,$9)`,[projectId,ids.get(x.requirement_id),x.covered,JSON.stringify(x.approved_claim_ids),x.severity,x.source_status,x.requirement_category,x.is_mandatory,x.writer_eligible]);await client.query('COMMIT');}catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}}

  async decideClaim(claimId,decision,decidedBy){const client=await this.pool.connect();try{await client.query('BEGIN');const current=(await client.query(`SELECT c.id,c.project_id,cd.gate_decision FROM claims c JOIN claim_decisions cd ON cd.claim_id=c.id WHERE c.claim_id=$1 FOR UPDATE`,[claimId])).rows[0];if(!current)throw Object.assign(new Error('Claim 不存在。'),{code:'CLAIM_NOT_FOUND',status:404});if(decision==='approved'&&current.gate_decision!=='approved')throw Object.assign(new Error('确定性 Claim Gate 拒绝的 Claim 不能被人工批准。'),{code:'CLAIM_GATE_REJECTION_IMMUTABLE',status:409});const row=(await client.query(`UPDATE claim_decisions SET decision=$2,manual_decision=$2,decided_by=$3,decided_at=now(),reason_code=CASE WHEN $2='rejected' THEN 'MANUAL_REJECTION' ELSE reason_code END,reason_message=CASE WHEN $2='rejected' THEN 'Claim 已被人工拒绝。' ELSE reason_message END WHERE claim_id=$1 RETURNING *`,[current.id,decision,decidedBy])).rows[0];await client.query('COMMIT');return{project_id:current.project_id,decision:row};}catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}}

  async saveProductionBetaResult(projectId, result) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const run = (await client.query(`INSERT INTO production_beta_runs(project_id,status,audit_json) VALUES($1,'succeeded',$2::jsonb) RETURNING *`, [projectId, JSON.stringify({ writer_claim_count: result.writer_input.length, provisional_count: result.provisional_requirements?.length || 0, provisional_requirements: result.provisional_requirements || [] })])).rows[0];
      for (const evidence of result.evidence) await client.query(`INSERT INTO evidences(evidence_id,project_id,material_id,source_type,source_roles,module,content,source_page,source_hash,evidence_level,commitment_level) VALUES($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9,$10,$11) ON CONFLICT(evidence_id) DO NOTHING`, [evidence.evidence_id, projectId, evidence.material_id || null, evidence.source_type, JSON.stringify(evidence.source_roles || []), evidence.module, evidence.content, evidence.source_page || null, evidence.source_hash, evidence.evidence_level, evidence.commitment_level]);
      const requirements = await client.query(`SELECT id,req_id FROM requirements WHERE project_id=$1`, [projectId]);
      const requirementIds = new Map(requirements.rows.map((item) => [item.req_id, item.id]));
      for (const plan of result.plans) await client.query(`INSERT INTO response_plans(project_id,requirement_id,response_status,response_summary,implementation_actions,optional_design,deliverables,acceptance_methods,conditions,supporting_evidence_ids,capability_gap,target_sections) VALUES($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7::jsonb,$8::jsonb,$9::jsonb,$10::jsonb,$11,$12::jsonb) ON CONFLICT(project_id,requirement_id) DO UPDATE SET response_status=excluded.response_status,response_summary=excluded.response_summary,supporting_evidence_ids=excluded.supporting_evidence_ids,capability_gap=excluded.capability_gap,target_sections=excluded.target_sections`, [projectId, requirementIds.get(plan.requirement_id), plan.response_status, plan.response_summary, JSON.stringify(plan.implementation_actions || []), JSON.stringify(plan.optional_design || null), JSON.stringify(plan.deliverables || []), JSON.stringify(plan.acceptance_methods || []), JSON.stringify(plan.conditions || []), JSON.stringify(plan.supporting_evidence_ids || []), plan.capability_gap || null, JSON.stringify(plan.target_sections)]);
      for (const item of result.evaluatedClaims) { const claim=(await client.query(`INSERT INTO claims(claim_id,project_id,requirement_id,claim_type,text,basis_requirement_ids,basis_evidence_ids,requested_commitment,target_sections,basis_requirement_source_statuses) VALUES($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8,$9::jsonb,$10::jsonb) ON CONFLICT(claim_id) DO UPDATE SET text=excluded.text,basis_requirement_source_statuses=excluded.basis_requirement_source_statuses RETURNING id`, [item.claim.claim_id,projectId,requirementIds.get(item.claim.requirement_id)||null,item.claim.claim_type,item.claim.text,JSON.stringify(item.claim.basis_requirement_ids||[]),JSON.stringify(item.claim.basis_evidence_ids||[]),item.claim.requested_commitment||null,JSON.stringify(item.claim.target_sections||[]),JSON.stringify(item.claim.basis_requirement_source_statuses||{})])).rows[0]; await client.query(`INSERT INTO claim_decisions(claim_id,decision,reason_code) VALUES($1,$2,$3) ON CONFLICT(claim_id) DO UPDATE SET decision=excluded.decision,reason_code=excluded.reason_code`,[claim.id,item.decision.decision,item.decision.reason_code]); }
      for (const item of result.coverage.coverage) await client.query(`INSERT INTO requirement_coverages(project_id,requirement_id,covered,approved_claim_ids) VALUES($1,$2,$3,$4::jsonb) ON CONFLICT(project_id,requirement_id) DO UPDATE SET covered=excluded.covered,approved_claim_ids=excluded.approved_claim_ids`,[projectId,requirementIds.get(item.requirement_id),item.covered,JSON.stringify(item.approved_claim_ids)]);
      await client.query('COMMIT');
      return { run, ...result };
    } catch(error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }

  async saveProductionBetaFailure(projectId, error) {
    await this.pool.query(`INSERT INTO production_beta_runs(project_id,status,error_code,error_message,audit_json) VALUES($1,'failed',$2,$3,'{}')`, [projectId, error.code || 'PRODUCTION_BETA_FAILED', String(error.message || '处理失败').slice(0, 500)]);
  }

  async getDocumentGenerationInput(projectId){const [project,baseline,requirements,plans,claims,evidence,coverage]=await Promise.all([this.getProject(projectId),this.getRequirementBaseline(projectId),this.getFormalRequirements(projectId),this.listResponsePlans(projectId),this.listClaims(projectId),this.listApprovedEvidence(projectId),this.listCoverage(projectId)]);return{project,baseline,requirements,plans:plans.plans||plans,claims,evidence,coverage};}
  async createDocumentGeneration(projectId,snapshot,ruleVersions){const {rows}=await this.pool.query(`INSERT INTO document_generations(project_id,status,coverage_snapshot,requirement_snapshot,claim_snapshot,evidence_snapshot,rule_versions) VALUES($1,'created',$2,$3,$4,$5,$6) RETURNING *`,[projectId,JSON.stringify(snapshot.coverage),JSON.stringify(snapshot.requirements),JSON.stringify(snapshot.claims),JSON.stringify(snapshot.evidence),JSON.stringify(ruleVersions)]);return rows[0];}
  async createDocumentTasks(generationId,batches){for(const b of batches)await this.pool.query(`INSERT INTO document_generation_tasks(generation_id,chapter_id,batch_index,status,input_snapshot,claim_ids) VALUES($1,$2,$3,'queued',$4,$5) ON CONFLICT DO NOTHING`,[generationId,b.chapter_id,b.batch_index,JSON.stringify(b.input),JSON.stringify(b.claim_ids)]);}
  async claimDocumentTask(generationId,chapterId,batchIndex){const {rowCount}=await this.pool.query(`UPDATE document_generation_tasks SET status='running',claimed_at=now(),updated_at=now() WHERE generation_id=$1 AND chapter_id=$2 AND batch_index=$3 AND status='queued'`,[generationId,chapterId,batchIndex]);return rowCount===1;}
  async finishDocumentTask(generationId,batch,status,data){await this.pool.query(`UPDATE document_generation_tasks SET status=$4,output_markdown=$5,attempt=$6,runtime_ms=$7,error_code=$8,error_message=$9,provider_audit=$10,generation_mode=COALESCE($11,generation_mode),generation_rule_version=COALESCE($12,generation_rule_version),updated_at=now() WHERE generation_id=$1 AND chapter_id=$2 AND batch_index=$3`,[generationId,batch.chapter_id,batch.batch_index,status,data.output_markdown||null,data.attempt||0,data.runtime_ms||null,data.error_code||null,data.error_message||null,JSON.stringify(data.provider_audit||{}),data.generation_mode||null,data.generation_rule_version||null]);}
  async resetDocumentTasks(generationId,batches){for(const b of batches)await this.pool.query(`UPDATE document_generation_tasks SET status='queued',error_code=NULL,error_message=NULL,claimed_at=NULL WHERE generation_id=$1 AND chapter_id=$2 AND batch_index=$3 AND status='failed'`,[generationId,b.chapter_id,b.batch_index]);}
  async getDocumentGeneration(id){const g=(await this.pool.query(`SELECT * FROM document_generations WHERE id=$1`,[id])).rows[0];if(!g)return null;g.tasks=(await this.pool.query(`SELECT * FROM document_generation_tasks WHERE generation_id=$1 ORDER BY chapter_id,batch_index`,[id])).rows;return g;}
  async updateDocumentGeneration(id,data){const {rows}=await this.pool.query(`UPDATE document_generations SET status=COALESCE($2,status),risk_status=COALESCE($3,risk_status),error_code=$4,error_message=$5,updated_at=now() WHERE id=$1 RETURNING *`,[id,data.status,data.risk_status||null,data.error_code||null,data.error_message||null]);return rows[0];}
  async createPipelineDocumentVersion(x){const c=await this.pool.connect();try{await c.query('BEGIN');const n=Number((await c.query(`SELECT COALESCE(MAX(version_number),0)+1 n FROM document_versions WHERE project_id=$1`,[x.generation.project_id])).rows[0].n);const {rows}=await c.query(`INSERT INTO document_versions(project_id,version_number,title,content_markdown,sections_json,warnings_json,risk_status,status,draft_text,sanitized_text,revised_text,final_text,validation_errors,removed_items,coverage_snapshot,requirement_snapshot,claim_snapshot,evidence_snapshot,chapter_tasks,provider_audit,rule_versions) VALUES($1,$2,$3,$4,$5,$6,$7,'pending_review',$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20) RETURNING *`,[x.generation.project_id,n,`技术响应 V${n}`,x.final_text,JSON.stringify(x.sections_json),JSON.stringify(x.validation.warnings),x.validation.validation_status,x.draft_text,x.sanitized_text,x.revised_text,x.final_text,JSON.stringify(x.validation.errors),JSON.stringify(x.removed_items),JSON.stringify(x.generation.coverage_snapshot),JSON.stringify(x.generation.requirement_snapshot),JSON.stringify(x.generation.claim_snapshot),JSON.stringify(x.generation.evidence_snapshot),JSON.stringify(x.generation.tasks),JSON.stringify(x.generation.provider_audit),JSON.stringify(x.rule_versions)]);await c.query('COMMIT');return rows[0];}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}}
  async listDocumentGenerations(projectId){const {rows}=await this.pool.query(`SELECT * FROM document_generations WHERE project_id=$1 ORDER BY created_at DESC`,[projectId]);return rows;}
  async getPipelineDocumentVersion(id){return this.getVersion(id);}
  async createRegeneratedVersion(parent,chapterId,sections,sanitized,validation,rules){const generation={project_id:parent.project_id,coverage_snapshot:parent.coverage_snapshot,requirement_snapshot:parent.requirement_snapshot,claim_snapshot:parent.claim_snapshot,evidence_snapshot:parent.evidence_snapshot,tasks:[],provider_audit:[]};const row=await this.createPipelineDocumentVersion({generation,draft_text:sanitized.sanitized_text,sanitized_text:sanitized.sanitized_text,revised_text:null,final_text:sanitized.sanitized_text,sections_json:sections,validation,removed_items:sanitized.removed_items,rule_versions:rules});return (await this.pool.query(`UPDATE document_versions SET parent_version_id=$2,regenerated_chapter_id=$3 WHERE id=$1 RETURNING *`,[row.id,parent.id,chapterId])).rows[0];}

  async getProductionBetaResult(projectId) {
    const [runs, plans, claims, coverage] = await Promise.all([
      this.pool.query(`SELECT id,status,error_code,error_message,audit_json,created_at,updated_at FROM production_beta_runs WHERE project_id=$1 ORDER BY created_at DESC LIMIT 1`,[projectId]),
      this.pool.query(`SELECT rp.*,r.req_id AS requirement_id,r.source_status FROM response_plans rp JOIN requirements r ON r.id=rp.requirement_id WHERE rp.project_id=$1 ORDER BY r.ordinal`,[projectId]),
      this.pool.query(`SELECT c.claim_id,c.requirement_id,c.claim_type,c.text,c.basis_requirement_ids,c.basis_evidence_ids,c.basis_requirement_source_statuses,c.requested_commitment,c.target_sections,cd.decision,cd.reason_code,r.source_status FROM claims c JOIN claim_decisions cd ON cd.claim_id=c.id LEFT JOIN requirements r ON r.id=c.requirement_id WHERE c.project_id=$1 ORDER BY c.created_at`,[projectId]),
      this.pool.query(`SELECT r.req_id AS requirement_id,r.source_status,rc.covered,rc.approved_claim_ids FROM requirement_coverages rc JOIN requirements r ON r.id=rc.requirement_id WHERE rc.project_id=$1 ORDER BY r.ordinal`,[projectId])
    ]);
    const run = runs.rows[0] || null;
    return { run, plans:plans.rows, claims:claims.rows, coverage:coverage.rows,
      provisional_requirements:run?.audit_json?.provisional_requirements || [],
      provisional_count:Number(run?.audit_json?.provisional_count || 0),
      uncovered_requirement_ids:coverage.rows.filter((item)=>!item.covered).map((item)=>item.requirement_id) };
  }

  async touchProject(id) {
    await this.pool.query(`UPDATE projects SET updated_at = now() WHERE id = $1`, [id]);
  }
}
