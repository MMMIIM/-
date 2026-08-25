import test from 'node:test';
import assert from 'node:assert/strict';
import { ProjectAuthorizationService } from '../src/project-authorization-service.js';

const actor = { actor_id:'actor-owner', actor_type:'test', source:'test' };

function serviceFor(membership) {
  return new ProjectAuthorizationService({
    repository: {
      async getProjectMembership() { return membership; }
    }
  });
}

for (const action of ['READ', 'WRITE', 'MANAGE']) {
  test(`ProjectAuthorization OWNER ${action} allows`, async () => {
    const result = await serviceFor({ project_id:'project-1', actor_id:actor.actor_id, role:'OWNER', status:'ACTIVE' })
      .assertProjectAccess({ actor, projectId:'project-1', action });
    assert.equal(result.membership.role, 'OWNER');
  });
}

for (const action of ['READ', 'WRITE']) {
  test(`ProjectAuthorization EDITOR ${action} allows`, async () => {
    await serviceFor({ project_id:'project-1', actor_id:actor.actor_id, role:'EDITOR', status:'ACTIVE' })
      .assertProjectAccess({ actor, projectId:'project-1', action });
  });
}

for (const action of ['MANAGE']) {
  test(`ProjectAuthorization EDITOR ${action} denies`, async () => {
    await assert.rejects(
      () => serviceFor({ project_id:'project-1', actor_id:actor.actor_id, role:'EDITOR', status:'ACTIVE' })
        .assertProjectAccess({ actor, projectId:'project-1', action }),
      (error) => error.code === 'PROJECT_ACCESS_DENIED'
    );
  });
}

test('ProjectAuthorization VIEWER only allows READ', async () => {
  const service = serviceFor({ project_id:'project-1', actor_id:actor.actor_id, role:'VIEWER', status:'ACTIVE' });
  await service.assertProjectAccess({ actor, projectId:'project-1', action:'READ' });
  for (const action of ['WRITE', 'MANAGE']) await assert.rejects(
    () => service.assertProjectAccess({ actor, projectId:'project-1', action }),
    (error) => error.code === 'PROJECT_ACCESS_DENIED'
  );
});

for (const membership of [null, { role:'OWNER', status:'REVOKED' }, { role:'UNKNOWN', status:'ACTIVE' }, { role:'OWNER', status:'UNKNOWN' }]) {
  test(`ProjectAuthorization fail-closed for ${membership ? `${membership.role}/${membership.status}` : 'no membership'}`, async () => {
    await assert.rejects(
      () => serviceFor(membership).assertProjectAccess({ actor, projectId:'project-1', action:'READ' }),
      (error) => error.code === 'PROJECT_ACCESS_DENIED'
    );
  });
}

for (const invalidActor of [null, {}, { actor_id:'actor-client', actor_type:'client', source:'request_body' }, { actor_id:'current_user', source:'server_config' }]) {
  test('ProjectAuthorization rejects missing or untrusted actor', async () => {
    const service = serviceFor({ project_id:'project-1', actor_id:'actor-owner', role:'OWNER', status:'ACTIVE' });
    await assert.rejects(
      () => service.assertProjectAccess({ actor:invalidActor, projectId:'project-1', action:'READ' }),
      (error) => error.code === 'TRUSTED_ACTOR_REQUIRED'
    );
  });
}

test('ProjectAuthorization does not treat a client actor as a trusted server actor', () => {
  assert.throws(
    () => serviceFor(null).assertTrustedActor({ actor_id:'spoofed', source:'request_body' }),
    (error) => error.code === 'TRUSTED_ACTOR_REQUIRED'
  );
});
