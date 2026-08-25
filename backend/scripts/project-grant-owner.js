import dotenv from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPool, PgRepository } from '../src/db.js';
import { ProjectAuthorizationService } from '../src/project-authorization-service.js';
import { createServerActorResolver } from '../src/request-actor.js';

const directory = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(directory, '../.env') });

const [projectId, targetActorId] = process.argv.slice(2).map((value) => String(value || '').trim());
if (!projectId || !targetActorId) {
  console.error('Usage: npm run project:grant-owner -- <projectId> <actorId>');
  process.exitCode = 2;
} else {
  const resolver = createServerActorResolver({ actorId: process.env.BACKEND_DEV_ACTOR_ID, actorType: 'development' });
  const grantedBy = resolver();
  if (!grantedBy) {
    console.error('BACKEND_DEV_ACTOR_ID is required for maintenance ownership bootstrap.');
    process.exitCode = 2;
  } else {
    const pool = createPool();
    try {
      const repository = new PgRepository(pool);
      const service = new ProjectAuthorizationService({ repository });
      const membership = await service.grantOwner({
        projectId,
        actor: { actor_id: targetActorId, actor_type: 'maintenance', source: 'maintenance_cli' },
        grantedBy
      });
      console.log(JSON.stringify({
        project_id: membership.project_id,
        actor_id: membership.actor_id,
        role: membership.role,
        status: membership.status,
        created_by: membership.created_by
      }));
    } catch (error) {
      console.error(JSON.stringify({ code: error.code || 'PROJECT_OWNER_BOOTSTRAP_FAILED', message: error.message }));
      process.exitCode = 1;
    } finally {
      await pool.end();
    }
  }
}
