import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import dotenv from 'dotenv';
import { createPool, PgRepository } from '../src/db.js';
import { createApp } from '../src/app.js';
import { ProjectAuthorizationService } from '../src/project-authorization-service.js';

const directory = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(directory, '../.env') });

const actor = { actor_id:'integration-owner', actor_type:'test', source:'integration' };
const migrationPath = resolve(directory, '../migrations/047_project_memberships.sql');

async function setup() {
  assert.ok(process.env.DATABASE_URL, 'DATABASE_URL is required for PostgreSQL integration tests');
  const pool = createPool();
  const repository = new PgRepository(pool);
  const migration = await readFile(migrationPath, 'utf8');
  await pool.query(migration);
  await pool.query(migration);
  return { pool, repository };
}

async function cleanup(pool, projectIds = []) {
  if (projectIds.length) await pool.query(`DELETE FROM projects WHERE id=ANY($1::uuid[])`, [projectIds]);
  await pool.end();
}

async function withServer(app, work) {
  const server = await new Promise((resolvePromise) => {
    const listener = app.listen(0, '127.0.0.1', () => resolvePromise(listener));
  });
  try { return await work(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise((resolvePromise, reject) => server.close((error) => error ? reject(error) : resolvePromise())); }
}

async function jsonRequest(base, path, body) {
  const response = await fetch(`${base}${path}`, {
    method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify(body)
  });
  return { response, body:await response.json() };
}

test('047 project memberships migration is replayable and persists canonical constraints', async () => {
  const { pool, repository } = await setup();
  let project;
  try {
    project = await repository.createProject({ name:`Authorization constraints ${Date.now()}` });
    const membership = await repository.createProjectMembership({ projectId:project.id, actorId:'actor-constraints', role:'EDITOR', status:'ACTIVE', createdBy:'bootstrap' });
    assert.equal(membership.role, 'EDITOR');
    assert.equal((await repository.getProjectMembership({ projectId:project.id, actorId:'actor-constraints' })).status, 'ACTIVE');
    await assert.rejects(
      () => repository.createProjectMembership({ projectId:project.id, actorId:'actor-constraints', role:'VIEWER', status:'ACTIVE', createdBy:'bootstrap' }),
      (error) => error.code === '23505'
    );
    await assert.rejects(
      () => repository.createProjectMembership({ projectId:randomUUID(), actorId:'actor-missing-project', role:'VIEWER', status:'ACTIVE', createdBy:'bootstrap' }),
      (error) => error.code === '23503'
    );
  } finally { await cleanup(pool, project ? [project.id] : []); }
});

test('project creation HTTP entry creates exactly one trusted OWNER and ignores client actor fields', async () => {
  const { pool, repository } = await setup();
  let projectId;
  const app = createApp({ repository, storage:{}, actorResolver:() => actor });
  try {
    await withServer(app, async (base) => {
      const result = await jsonRequest(base, '/api/projects', {
        name:`Authorized project ${Date.now()}`,
        actor_id:'spoofed-client', user:'spoofed-client', reviewer:'spoofed-client'
      });
      assert.equal(result.response.status, 201);
      projectId = result.body.project.id;
      const rows = (await pool.query(`SELECT actor_id,role,status FROM project_memberships WHERE project_id=$1`, [projectId])).rows;
      assert.deepEqual(rows, [{ actor_id:actor.actor_id, role:'OWNER', status:'ACTIVE' }]);
      assert.equal((await pool.query(`SELECT count(*)::int AS count FROM project_memberships WHERE project_id=$1 AND actor_id='spoofed-client'`, [projectId])).rows[0].count, 0);
    });
  } finally { await cleanup(pool, projectId ? [projectId] : []); }
});

test('project creation rolls back when OWNER membership insert fails', async () => {
  const { pool, repository } = await setup();
  const functionName = 'test_fail_project_membership_insert';
  const triggerName = 'test_fail_project_membership_trigger';
  await pool.query(`CREATE OR REPLACE FUNCTION ${functionName}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'forced membership insert failure'; END; $$`);
  await pool.query(`CREATE TRIGGER ${triggerName} BEFORE INSERT ON project_memberships FOR EACH ROW EXECUTE FUNCTION ${functionName}()`);
  try {
    await assert.rejects(
      () => repository.createProjectWithOwner({ name:`Rollback ${Date.now()}`, owner:actor }),
      /forced membership insert failure/
    );
    assert.equal((await pool.query(`SELECT count(*)::int AS count FROM projects WHERE name LIKE 'Rollback %'`)).rows[0].count, 0);
  } finally {
    await pool.query(`DROP TRIGGER IF EXISTS ${triggerName} ON project_memberships`);
    await pool.query(`DROP FUNCTION IF EXISTS ${functionName}()`);
    await pool.end();
  }
});

test('historical projects receive no automatic membership; explicit OWNER bootstrap is idempotent', async () => {
  const { pool, repository } = await setup();
  let project;
  let other;
  try {
    project = await repository.createProject({ name:`Historical project ${Date.now()}` });
    other = await repository.createProject({ name:`Historical other ${Date.now()}` });
    assert.equal((await repository.listProjectMemberships(project.id)).length, 0);
    const service = new ProjectAuthorizationService({ repository });
    const grantor = { actor_id:'maintenance-operator', actor_type:'maintenance', source:'maintenance_cli' };
    const first = await service.grantOwner({ projectId:project.id, actor:{ actor_id:'historical-owner', actor_type:'maintenance', source:'maintenance_cli' }, grantedBy:grantor });
    const second = await service.grantOwner({ projectId:project.id, actor:{ actor_id:'historical-owner', actor_type:'maintenance', source:'maintenance_cli' }, grantedBy:grantor });
    assert.equal(first.actor_id, 'historical-owner');
    assert.equal(second.status, 'ACTIVE');
    assert.equal((await repository.listProjectMemberships(project.id)).length, 1);
    assert.equal((await repository.listProjectMemberships(other.id)).length, 0);
    await assert.rejects(
      () => service.grantOwner({ projectId:randomUUID(), actor:{ actor_id:'unknown-target', actor_type:'maintenance', source:'maintenance_cli' }, grantedBy:grantor }),
      (error) => error.code === 'PROJECT_NOT_FOUND'
    );
    await repository.revokeProjectMembership({ projectId:project.id, actorId:'historical-owner' });
    await assert.rejects(
      () => service.assertProjectAccess({ actor:{ actor_id:'historical-owner', actor_type:'maintenance', source:'maintenance_cli' }, projectId:project.id, action:'READ' }),
      (error) => error.code === 'PROJECT_ACCESS_DENIED'
    );
  } finally { await cleanup(pool, [project?.id, other?.id].filter(Boolean)); }
});
