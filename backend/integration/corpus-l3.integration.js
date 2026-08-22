import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createPool, PgRepository } from '../src/db.js';
import { chunkEnterpriseMaterial } from '../src/pipeline/enterprise-material-chunker.js';
import { PUBLIC_CORPUS_PROJECT_ID } from '../src/pipeline/corpus-contract.js';
import { deterministicEmbed, DETERMINISTIC_EMBEDDING_DIMENSION, DETERMINISTIC_EMBEDDING_MODEL, DETERMINISTIC_EMBEDDING_VERSION } from '../src/pipeline/deterministic-embedding.js';
import { EnterpriseRetrievalService } from '../src/pipeline/enterprise-retrieval-service.js';

dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../.env') });

test('041 corpus metadata migration is replayable and active public material is visible to retrieval path', async () => {
  const pool = createPool();
  const repository = new PgRepository(pool);
  const source = `政务数据共享应遵循标准统一和安全可控。集成测试 ${randomUUID()}`;
  const fileHash = createHash('sha256').update(source).digest('hex');
  let material;
  try {
    const migration = await readFile(resolve(dirname(fileURLToPath(import.meta.url)), '../migrations/041_corpus_l3_public_materials.sql'), 'utf8');
    await pool.query(migration);
    await pool.query(migration);
    material = (await pool.query(`INSERT INTO company_materials(project_id,original_name,storage_key,material_type,mime_type,size_bytes,file_hash,extraction_status,extracted_text,corpus_scope,industry,source_org,source_url,source_type,document_number,effective_status,usage_status,review_status,lifecycle_status,index_status,quality_score) VALUES($1,$2,$3,'technical_whitepaper','text/markdown',$4,$5,'succeeded',$6,'GOVERNMENT_ENTERPRISE','政务信息化','集成测试','https://example.invalid/corpus','official','TEST','current','ACTIVE_EXCERPT','approved','ACTIVE','INDEXED',95) RETURNING *`, [PUBLIC_CORPUS_PROJECT_ID, `integration-${randomUUID()}.md`, `integration-${randomUUID()}`, Buffer.byteLength(source), fileHash, source])).rows[0];
    const chunks = chunkEnterpriseMaterial(material.id, source);
    await repository.replaceMaterialChunks(material.id, chunks);
    const vector = deterministicEmbed(source, DETERMINISTIC_EMBEDDING_DIMENSION);
    await pool.query(`INSERT INTO material_chunk_embeddings(chunk_id,chunk_hash,embedding_model,embedding_version,embedding_dimension,embedding) VALUES($1,$2,$3,$4,$5,$6::vector)`, [chunks[0].chunk_id, chunks[0].chunk_hash, DETERMINISTIC_EMBEDDING_MODEL, DETERMINISTIC_EMBEDDING_VERSION, DETERMINISTIC_EMBEDDING_DIMENSION, `[${vector.join(',')}]`]);
    const listed = await repository.listPublicCorpusMaterials({ scope: 'GOVERNMENT_ENTERPRISE' });
    assert.ok(listed.some((item) => item.id === material.id));
    const chunksForRetrieval = await repository.listChunksForRetrieval({ projectId: randomUUID(), materialTypes: [], model: DETERMINISTIC_EMBEDDING_MODEL, version: DETERMINISTIC_EMBEDDING_VERSION, corpusScopes: ['GOVERNMENT_ENTERPRISE'], corpusProjectId: PUBLIC_CORPUS_PROJECT_ID });
    assert.ok(chunksForRetrieval.some((item) => item.chunk_id === chunks[0].chunk_id && item.embedding_id));
    const tender = (await pool.query(`INSERT INTO tender_files(project_id,original_name,storage_key,mime_type,size_bytes) VALUES($1,'corpus.txt',$2,'text/plain',1) RETURNING id`, [material.id ? (await pool.query('SELECT id FROM projects WHERE id=$1', [PUBLIC_CORPUS_PROJECT_ID])).rows[0].id : PUBLIC_CORPUS_PROJECT_ID, `corpus-tender-${randomUUID()}`])).rows[0];
    const retrievalProject = (await pool.query(`INSERT INTO projects(name) VALUES($1) RETURNING id`, [`corpus-retrieval-${randomUUID()}`])).rows[0];
    await pool.query(`UPDATE tender_files SET project_id=$2 WHERE id=$1`, [tender.id, retrievalProject.id]);
    const job = (await pool.query(`INSERT INTO tender_parse_jobs(project_id,tender_file_id,status,phase) VALUES($1,$2,'succeeded','succeeded') RETURNING id`, [retrievalProject.id, tender.id])).rows[0];
    const baseline = (await pool.query(`INSERT INTO requirement_baselines(project_id,parse_job_id,status) VALUES($1,$2,'building') RETURNING id`, [retrievalProject.id, job.id])).rows[0];
    const requirement = (await pool.query(`INSERT INTO requirements(baseline_id,project_id,req_id,content,source_excerpt,source_text,is_mandatory,target_sections,ordinal,source_status,confirmation_type,requirement_category,writer_eligible) VALUES($1,$2,'REQ-CORPUS','政务数据共享应遵循标准统一和安全可控。','政务数据共享应遵循标准统一和安全可控。','政务数据共享应遵循标准统一和安全可控。',false,'[]',1,'verified','verified','technical',true) RETURNING id`, [baseline.id, retrievalProject.id])).rows[0];
    await pool.query(`UPDATE requirement_baselines SET status='confirmed',confirmed_at=now(),confirmed_by='integration',confirmation_type='verified' WHERE id=$1`, [baseline.id]);
    const retrieval = await new EnterpriseRetrievalService({ repository, embeddingClient: { model: DETERMINISTIC_EMBEDDING_MODEL, version: DETERMINISTIC_EMBEDDING_VERSION, dimension: DETERMINISTIC_EMBEDDING_DIMENSION, embed: async (texts) => texts.map((text) => deterministicEmbed(text)) } }).retrieve(requirement.id, { top_k: 3, corpus_scopes: ['GOVERNMENT_ENTERPRISE'] });
    assert.equal(retrieval.answer_status, 'CANDIDATES_FOUND');
    assert.ok(retrieval.results.some((item) => item.material_id === material.id));
    await pool.query('DELETE FROM projects WHERE id=$1', [retrievalProject.id]);
  } finally {
    if (material) {
      await pool.query('DELETE FROM enterprise_retrieval_results WHERE chunk_id IN (SELECT chunk_id FROM material_chunks WHERE material_id=$1)', [material.id]);
      await pool.query('DELETE FROM company_materials WHERE id=$1', [material.id]);
    }
    await pool.end();
  }
});
