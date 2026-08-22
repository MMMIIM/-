import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadBackendEnvironment } from '../src/backend-runtime.js';
import { createPool } from '../src/db.js';
import { chunkEnterpriseMaterial } from '../src/pipeline/enterprise-material-chunker.js';
import { PUBLIC_CORPUS_PROJECT_ID } from '../src/pipeline/corpus-contract.js';
import { getRealPublicCorpus, REAL_PUBLIC_CORPUS_VERSION } from '../eval/corpus/real-public-authoritative/catalog.js';
import { deterministicEmbed, DETERMINISTIC_EMBEDDING_DIMENSION, DETERMINISTIC_EMBEDDING_MODEL, DETERMINISTIC_EMBEDDING_VERSION } from '../src/pipeline/deterministic-embedding.js';

loadBackendEnvironment();
const pool = createPool();
const here = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.resolve(here, '../eval/corpus/real-public-authoritative/manifest.json');

const sha = (value) => createHash('sha256').update(value).digest('hex');
const uuidFor = (key) => {
  const hex = sha(key).slice(0, 32).split('');
  hex[12] = '4';
  hex[16] = ((Number.parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  return `${hex.slice(0, 8).join('')}-${hex.slice(8, 12).join('')}-${hex.slice(12, 16).join('')}-${hex.slice(16, 20).join('')}-${hex.slice(20).join('')}`;
};
const vectorLiteral = (values) => `[${values.join(',')}]`;

async function upsertMaterial(item) {
  const extractedText = `# ${item.title}\n\n来源机构：${item.source_org}\n文号：${item.document_number || '无'}\n\n${item.excerpt}`;
  const fileHash = sha(`${item.source_url}\n${item.source_version}\n${extractedText}`);
  const materialId = uuidFor(`corpus-l3|${item.material_id}`);
  const originalName = `${item.title}（官方摘录）.md`;
  const result = await pool.query(`
    INSERT INTO company_materials
      (id,project_id,original_name,storage_key,material_type,mime_type,size_bytes,file_hash,
       extraction_status,extracted_text,corpus_scope,industry,source_org,source_url,source_type,
       document_number,published_at,effective_from,effective_status,source_version,authority_level,
       usage_status,quality_score,review_status,lifecycle_status,index_status,review_notes,synthetic_test_material,updated_at)
    VALUES($1,$2,$3,$4,$5,'text/markdown',$6,$7,'succeeded',$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,95,'approved','ACTIVE','INDEXED',$21,false,now())
    ON CONFLICT(project_id,file_hash) DO UPDATE SET
      original_name=EXCLUDED.original_name, storage_key=EXCLUDED.storage_key, material_type=EXCLUDED.material_type,
      mime_type=EXCLUDED.mime_type, size_bytes=EXCLUDED.size_bytes, extraction_status='succeeded',
      extracted_text=EXCLUDED.extracted_text, corpus_scope=EXCLUDED.corpus_scope, industry=EXCLUDED.industry,
      source_org=EXCLUDED.source_org, source_url=EXCLUDED.source_url, source_type=EXCLUDED.source_type,
      document_number=EXCLUDED.document_number, published_at=EXCLUDED.published_at, effective_from=EXCLUDED.effective_from,
      effective_status=EXCLUDED.effective_status, source_version=EXCLUDED.source_version, authority_level=EXCLUDED.authority_level,
      usage_status=EXCLUDED.usage_status, quality_score=EXCLUDED.quality_score, review_status='approved',
      lifecycle_status='ACTIVE', index_status='INDEXED', review_notes=EXCLUDED.review_notes,
      synthetic_test_material=false, updated_at=now()
    RETURNING id, original_name, file_hash, corpus_scope, industry`,
    [materialId, PUBLIC_CORPUS_PROJECT_ID, originalName, `corpus-l3/${materialId}.md`, item.material_type,
      Buffer.byteLength(extractedText, 'utf8'), fileHash, extractedText, item.scope, item.industry || null,
      item.source_org, item.source_url, item.source_type, item.document_number, item.published_at,
      item.effective_from, item.effective_status, item.source_version, item.authority_level,
      item.usage_status, `reviewed official excerpt; ${REAL_PUBLIC_CORPUS_VERSION}`]);
  const material = result.rows[0];
  const chunks = chunkEnterpriseMaterial(material.id, extractedText, { maxChars: 1200 });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existing = (await client.query('SELECT chunk_id,chunk_hash FROM material_chunks WHERE material_id=$1', [material.id])).rows;
    const incomingIds = new Set(chunks.map((chunk) => chunk.chunk_id));
    const changed = existing.length !== chunks.length || existing.some((chunk) => !incomingIds.has(chunk.chunk_id));
    if (changed && existing.length) {
      const oldIds = existing.map((chunk) => chunk.chunk_id);
      await client.query('DELETE FROM enterprise_retrieval_results WHERE chunk_id=ANY($1::text[])', [oldIds]);
      await client.query('DELETE FROM material_chunk_embeddings WHERE chunk_id=ANY($1::text[])', [oldIds]);
      await client.query('DELETE FROM material_chunks WHERE chunk_id=ANY($1::text[])', [oldIds]);
    }
    for (const chunk of chunks) {
      await client.query(`INSERT INTO material_chunks(chunk_id,material_id,chunk_index,source_text,char_start,char_end,page_start,page_end,paragraph_start,paragraph_end,section,chunk_hash,chunker_version)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) ON CONFLICT(chunk_id) DO UPDATE SET source_text=EXCLUDED.source_text,char_start=EXCLUDED.char_start,char_end=EXCLUDED.char_end,section=EXCLUDED.section,chunk_hash=EXCLUDED.chunk_hash,chunker_version=EXCLUDED.chunker_version`,
        [chunk.chunk_id, material.id, chunk.chunk_index, chunk.source_text, chunk.char_start, chunk.char_end,
          chunk.page_start, chunk.page_end, chunk.paragraph_start, chunk.paragraph_end, item.title,
          chunk.chunk_hash, chunk.chunker_version]);
      const vector = deterministicEmbed(chunk.source_text, DETERMINISTIC_EMBEDDING_DIMENSION);
      await client.query(`INSERT INTO material_chunk_embeddings(chunk_id,chunk_hash,embedding_model,embedding_version,embedding_dimension,embedding)
        VALUES($1,$2,$3,$4,$5,$6::vector) ON CONFLICT(chunk_id,chunk_hash,embedding_model,embedding_version) DO NOTHING`, [chunk.chunk_id, chunk.chunk_hash, DETERMINISTIC_EMBEDDING_MODEL,
        DETERMINISTIC_EMBEDDING_VERSION, DETERMINISTIC_EMBEDDING_DIMENSION, vectorLiteral(vector)]);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    await pool.query(`UPDATE company_materials SET index_status='FAILED', lifecycle_status='PROCESSED', review_notes=$2, updated_at=now() WHERE id=$1`, [material.id, `index failed: ${error.message}`]);
    throw error;
  } finally {
    client.release();
  }
  return { ...item, material_id: material.id, original_name: material.original_name, file_hash: material.file_hash, chunk_count: chunks.length, index_model: DETERMINISTIC_EMBEDDING_MODEL, lifecycle_status: 'ACTIVE', review_status: 'approved', usage_status: item.usage_status, index_status: 'INDEXED' };
}

async function main() {
  const definitions = getRealPublicCorpus();
  const processed = [];
  for (const item of definitions) processed.push(await upsertMaterial(item));
  await mkdir(path.dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, `${JSON.stringify({ schema_version: '4.3-real-public-corpus-v1', generated_at: 'deterministic-from-catalog', corpus_version: REAL_PUBLIC_CORPUS_VERSION, source_policy: 'ACTIVE_EXCERPT', materials: processed }, null, 2)}\n`, 'utf8');
  const counts = Object.fromEntries(['GENERAL', 'GOVERNMENT_ENTERPRISE', 'HEALTHCARE'].map((scope) => [scope, processed.filter((item) => item.scope === scope).length]));
  console.log(JSON.stringify({ discovered: definitions.length, processed: processed.length, active: processed.length, indexed_chunks: processed.reduce((sum, item) => sum + item.chunk_count, 0), by_scope: counts, provider_calls: 0, external_calls: 0 }, null, 2));
}

try { await main(); } finally { await pool.end(); }
