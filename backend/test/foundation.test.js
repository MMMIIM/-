import test from 'node:test';
import assert from 'node:assert/strict';
import { extractResponsePayload, assertVersionCanBeConfirmed } from '../src/contract.js';
import { createDifyClient } from '../src/dify.js';
import { GenerationService } from '../src/service.js';

const validPayload = { data: { outputs: { response_payload_json: JSON.stringify({
  document: { title: '技术响应', markdown: '# 技术响应\n\n正式正文', sections: [{ id: 'summary', title: '项目概述' }] },
  warnings: [{ level: 'warning', code: 'W-01', message: '交付周期需要复核' }], risk_status: 'warning'
}) } } };

test('合法 response_payload_json 通过契约并提取正式正文', () => {
  const result = extractResponsePayload(validPayload);
  assert.equal(result.markdown, '# 技术响应\n\n正式正文');
  assert.equal(result.riskStatus, 'warning');
  assert.equal(result.sections[0].title, '项目概述');
});

test('非法契约返回 CONTRACT_INVALID 且不创建正式文档版本', async () => {
  let completed = false;
  let failedGenerationRecorded = false;
  let failedAudit;
  const repository = {
    getProject: async () => ({ id: 'project-1' }),
    createJob: async () => ({ id: 'job-1', project_id: 'project-1' }),
    updateJob: async () => {},
    recordFailedGeneration: async (audit) => { failedGenerationRecorded = true; failedAudit = audit; },
    completeGeneration: async () => { completed = true; }
  };
  const difyClient = { run: async () => extractResponsePayload({ data: { outputs: { response_payload_json: '{"risk_status":"pass"}' } } }) };
  const service = new GenerationService({ repository, difyClient, workflowVersion: '4.2' });
  await assert.rejects(() => service.generate({ projectId: 'project-1', inputs: {
    project_name: '测试项目', project_type: '智慧城市', bid_need: '需求', focus_points: '重点', output_mode: '技术标初稿'
  } }), (error) => error.code === 'CONTRACT_INVALID');
  assert.equal(completed, false);
  assert.equal(failedGenerationRecorded, true);
  assert.equal(failedAudit.errorCode, 'CONTRACT_INVALID');
  assert.equal(failedAudit.rawResponseText, undefined);
});

test('四类非法 response_payload_json 都携带可持久化审计上下文', () => {
  const cases = [
    [{ data: { outputs: {} } }, (audit) => assert.equal(audit.responsePayloadMissing, true)],
    [{ data: { outputs: { response_payload_json: 42 } } }, (audit) => assert.equal(audit.responsePayloadJson, 42)],
    [{ data: { outputs: { response_payload_json: '{bad-json' } } }, (audit) => assert.equal(audit.rawResponseText, '{bad-json')],
    [{ data: { outputs: { response_payload_json: { risk_status: 'pass' } } } }, (audit) => assert.deepEqual(audit.responsePayloadJson, { risk_status: 'pass' })]
  ];

  for (const [payload, assertAudit] of cases) {
    assert.throws(() => extractResponsePayload(payload), (error) => {
      assert.equal(error.code, 'CONTRACT_INVALID');
      assertAudit(error.audit);
      return true;
    });
  }
});

test('失败审计数据库错误不覆盖 CONTRACT_INVALID', async () => {
  const logged = [];
  const repository = {
    getProject: async () => ({ id: 'project-1' }),
    createJob: async () => ({ id: 'job-1', project_id: 'project-1' }),
    updateJob: async (_jobId, status) => {
      if (status === 'failed') throw new Error('database unavailable');
    },
    recordFailedGeneration: async () => { throw new Error('jsonb write failed'); }
  };
  const difyClient = {
    run: async () => extractResponsePayload({ data: { outputs: { response_payload_json: '{bad-json' } } })
  };
  const service = new GenerationService({
    repository,
    difyClient,
    workflowVersion: '4.2',
    logger: { error: (...args) => logged.push(args) }
  });

  await assert.rejects(() => service.generate({ projectId: 'project-1', inputs: {
    project_name: '测试项目', project_type: '智慧城市', bid_need: '需求', focus_points: '重点', output_mode: '技术标初稿'
  } }), (error) => error.code === 'CONTRACT_INVALID');
  assert.equal(logged.length, 2);
});

test('critical 风险禁止确认版本', () => {
  assert.throws(() => assertVersionCanBeConfirmed({ risk_status: 'critical' }, '已知悉'), (error) => error.code === 'CRITICAL_RISK' && error.status === 409);
});

test('Dify 调用失败返回明确错误码', async () => {
  const client = createDifyClient({ apiBase: 'https://api.dify.example/v1', apiKey: 'test-only', fetchImpl: async () => { throw new Error('network unavailable'); } });
  await assert.rejects(() => client.run({ project_name: '测试' }), (error) => error.code === 'DIFY_CALL_FAILED' && error.status === 502);
});

test('Dify HTTP 失败响应携带可脱敏持久化审计', async () => {
  const client = createDifyClient({
    apiBase: 'https://dify.invalid/v1', apiKey: 'test-only',
    fetchImpl: async () => new Response(JSON.stringify({ code: 'upstream_error', message: 'private detail' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' }
    })
  });
  await assert.rejects(() => client.run({ project_name: '测试' }), (error) => {
    assert.equal(error.code, 'DIFY_CALL_FAILED');
    assert.deepEqual(error.audit.rawDifyResponseJson, { code: 'upstream_error', message: 'private detail' });
    return true;
  });
});

test('Dify 调用失败也创建 failed Generation 审计', async () => {
  let failedAudit;
  const repository = {
    getProject: async () => ({ id: 'project-1' }),
    createJob: async () => ({ id: 'job-1', project_id: 'project-1' }),
    updateJob: async () => {},
    recordFailedGeneration: async (audit) => { failedAudit = audit; }
  };
  const service = new GenerationService({
    repository,
    difyClient: createDifyClient({
      apiBase: 'https://dify.invalid/v1', apiKey: 'test-only',
      fetchImpl: async () => { throw new Error('network unavailable'); }
    }),
    workflowVersion: '4.2'
  });
  await assert.rejects(() => service.generate({ projectId: 'project-1', inputs: {
    project_name: '测试项目', project_type: '智慧城市', bid_need: '需求', focus_points: '重点', output_mode: '技术标初稿'
  } }), (error) => error.code === 'DIFY_CALL_FAILED');
  assert.equal(failedAudit.errorCode, 'DIFY_CALL_FAILED');
  assert.equal(failedAudit.workflowVersion, '4.2');
});

test('Dify 成功返回携带可持久化的外层响应审计', async () => {
  const client = createDifyClient({
    apiBase: 'https://dify.invalid/v1',
    apiKey: 'test-only',
    fetchImpl: async () => new Response(JSON.stringify(validPayload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  });
  const parsed = await client.run({ project_name: '测试' });
  assert.deepEqual(parsed.audit.rawDifyResponseJson, validPayload);
});

test('禁止从 result/text/answer 兜底读取正文', () => {
  assert.throws(() => extractResponsePayload({ data: { outputs: { result: '# 不应读取', text: '# 不应读取', answer: '# 不应读取' } } }), (error) => error.code === 'CONTRACT_INVALID');
});

test('语义输出只接受 data.outputs.response_payload_json', () => {
  const valid = validPayload.data.outputs.response_payload_json;
  const forbiddenEnvelopes = [
    { outputs: { response_payload_json: valid } },
    { data: { response_payload_json: valid } },
    { data: { outputs: { response_payload_json: null } } },
    { data: { outputs: { response_payload_json: 7 } } },
    { data: { outputs: {} } },
    { data: {} },
    {}
  ];
  for (const payload of forbiddenEnvelopes) {
    assert.throws(() => extractResponsePayload(payload), (error) => error.code === 'CONTRACT_INVALID');
  }
});
