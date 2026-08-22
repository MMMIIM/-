import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createPool, PgRepository } from '../src/db.js';

const directory = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(directory, '../.env') });

test('040 agent action previews and audits persist idempotently', async () => {
  assert.ok(process.env.DATABASE_URL, 'DATABASE_URL is required for PostgreSQL integration tests');
  const pool = createPool();
  const repository = new PgRepository(pool);
  const project = await repository.createProject({ name: `Agent action ${Date.now()}` });
  try {
    const migration = await readFile(resolve(directory, '../migrations/040_agent_action_control.sql'), 'utf8');
    await pool.query(migration);
    await pool.query(migration);
    const previewId = randomUUID();
    const preview = await repository.createAgentActionPreview({ preview_id: previewId, project_id: project.id, action_type: 'chapter_revision', idempotency_key: `preview-${previewId}`, target: { project_id: project.id, chapter_id: 'implementation' }, preview: { original_text: '原文', proposed_text: '建议修改' }, validation_result: { validation_status: 'pass' } });
    assert.equal(preview.preview_id, previewId);
    assert.equal(preview.target_json.chapter_id, 'implementation');
    const auditId = randomUUID();
    await repository.createAgentActionAudit({ action_id: auditId, project_id: project.id, idempotency_key: `audit-${auditId}`, tool: 'prepareChapterRevision', risk_level: 'L2', result: 'PREVIEW_READY', executed: false, target: { project_id: project.id }, validation_result: { validation_status: 'pass' } });
    const audits = await repository.listAgentActionAudits(project.id);
    assert.equal(audits.length, 1);
    assert.equal(audits[0].result, 'PREVIEW_READY');
  } finally {
    await pool.query('DELETE FROM projects WHERE id=$1', [project.id]);
    await pool.end();
  }
});
