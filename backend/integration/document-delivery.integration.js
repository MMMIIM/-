import test from 'node:test';
import assert from 'node:assert/strict';
import dotenv from 'dotenv';
import { resolve } from 'node:path';
import { createPool, PgRepository } from '../src/db.js';
import { LocalFileStorage } from '../src/storage.js';
import { DocumentDeliveryService } from '../src/pipeline/document-delivery-service.js';
import { renderBidDocument } from '../src/pipeline/docx-renderer.js';

dotenv.config({ path: resolve('.env') });

test('Document delivery PostgreSQL audit is linked to a formal version and idempotently listable', async () => {
  assert.ok(process.env.DATABASE_URL, 'DATABASE_URL is required for PostgreSQL integration tests');
  const pool = createPool();
  const repository = new PgRepository(pool);
  const project = await repository.createProject({ name: `Word delivery ${Date.now()}` });
  const storage = new LocalFileStorage(resolve('uploads'));
  try {
    const job = (await pool.query(`INSERT INTO generation_jobs(project_id,status,request_inputs) VALUES($1,'succeeded','{}') RETURNING id`, [project.id])).rows[0];
    const generation = (await pool.query(`INSERT INTO generations(project_id,job_id,response_payload_json,workflow_version,runtime_ms,status) VALUES($1,$2,'{}','fixture',1,'succeeded') RETURNING id`, [project.id, job.id])).rows[0];
    const version = (await pool.query(`INSERT INTO document_versions(project_id,generation_id,version_number,title,content_markdown,sections_json,warnings_json,risk_status,status,final_text) VALUES($1,$2,1,'技术响应 V1','# 总则\\n\\n正文。','[{"chapter_id":"chapter-01","title":"总则","content_markdown":"正文。"}]','[]','pass','confirmed','# 总则\\n\\n正文。') RETURNING *`, [project.id, generation.id])).rows[0];
    const service = new DocumentDeliveryService({ repository, storage, renderer: renderBidDocument });
    const result = await service.exportWord({ projectId: project.id, versionId: version.id });
    assert.equal(result.audit.project_id, project.id);
    assert.equal(result.audit.document_version_id, version.id);
    assert.equal((await repository.listDocumentExports(project.id)).length, 1);
  } finally {
    await pool.query(`DELETE FROM projects WHERE id=$1`, [project.id]);
    await pool.end();
  }
});
