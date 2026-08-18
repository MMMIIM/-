import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SemanticGatewayClient,
  createGenerationProvider,
  createSemanticGatewayClientFromEnv,
  normalizeGatewayTransport
} from '../src/pipeline/semantic-gateway-client.js';
import { DeterministicPipelineService, runDeterministicPipeline } from '../src/pipeline/generation-audit.js';
import { isAbsolute } from 'node:path';
import { BACKEND_ENV_PATH, createBackendRuntime } from '../src/backend-runtime.js';

const request = {
  task_type: 'draft_sections',
  task_instruction: '生成脱敏章节草稿。',
  task_payload_json: '{"requirements":["REQ-001"]}'
};

function gatewayEnvelope(overrides = {}) {
  return {
    schema_version: '4.3-gateway',
    task_type: 'draft_sections',
    status: 'success',
    data: { sections: [] },
    warnings: [],
    ...overrides
  };
}

function gatewayResponse(responsePayloadJson, extraOutputs = {}) {
  return new Response(JSON.stringify({
    data: { outputs: { ...extraOutputs, response_payload_json: responsePayloadJson } }
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

function client(fetchImpl, timeoutMs = 100) {
  return new SemanticGatewayClient({
    apiBase: 'https://gateway.invalid/v1',
    apiKey: 'test-only',
    user: 'gateway-test',
    fetchImpl,
    timeoutMs
  });
}

test('干净 response_payload_json 成功并按契约发送三个 inputs', async () => {
  let sentBody;
  const raw = JSON.stringify(gatewayEnvelope());
  const result = await client(async (_url, options) => {
    sentBody = JSON.parse(options.body);
    return gatewayResponse(raw);
  }).run(request);

  assert.equal(result.envelope.schema_version, '4.3-gateway');
  assert.equal(result.audit.raw_response_payload_json, raw);
  assert.deepEqual(sentBody.inputs, {
    task_type: request.task_type,
    task_instruction: request.task_instruction,
    task_payload_json: request.task_payload_json
  });
  assert.equal(sentBody.response_mode, 'blocking');
  assert.equal(sentBody.user, 'gateway-test');
});

test('仅剥离字符串开头的一段完整 think 块及相邻空白', async () => {
  const json = JSON.stringify(gatewayEnvelope());
  const raw = `<think>仅用于 transport 测试</think>\n\t ${json}`;
  const result = await client(async () => gatewayResponse(raw)).run(request);
  assert.equal(result.envelope.status, 'success');
  assert.equal(result.audit.raw_response_payload_json, raw);

  const twice = `<think>first</think>\n<think>second</think>${json}`;
  assert.equal(normalizeGatewayTransport(twice), `<think>second</think>${json}`);
  await assert.rejects(
    () => client(async () => gatewayResponse(twice)).run(request),
    (error) => error.code === 'GATEWAY_INVALID_JSON'
  );
});

test('缺少 response_payload_json 返回专用错误码', async () => {
  const response = new Response(JSON.stringify({ data: { outputs: {} } }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
  await assert.rejects(
    () => client(async () => response).run(request),
    (error) => error.code === 'GATEWAY_RESPONSE_PAYLOAD_MISSING'
  );

  const wrongPath = new Response(JSON.stringify({
    outputs: { response_payload_json: JSON.stringify(gatewayEnvelope()) }
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
  await assert.rejects(
    () => client(async () => wrongPath).run(request),
    (error) => error.code === 'GATEWAY_RESPONSE_PAYLOAD_MISSING'
  );
});

test('response_payload_json 必须保留为原始字符串输入', async () => {
  await assert.rejects(
    () => client(async () => gatewayResponse(gatewayEnvelope())).run(request),
    (error) => error.code === 'GATEWAY_ENVELOPE_INVALID'
      && error.audit.raw_response_payload_json?.schema_version === '4.3-gateway'
  );
});

test('response_payload_json 非法 JSON 返回 GATEWAY_INVALID_JSON 并保留原始字符串审计', async () => {
  await assert.rejects(
    () => client(async () => gatewayResponse('{bad-json')).run(request),
    (error) => {
      assert.equal(error.code, 'GATEWAY_INVALID_JSON');
      assert.equal(error.audit.raw_response_payload_json, '{bad-json');
      return true;
    }
  );
});

test('task_type 不匹配返回 GATEWAY_TASK_TYPE_MISMATCH', async () => {
  const raw = JSON.stringify(gatewayEnvelope({ task_type: 'review_claims' }));
  await assert.rejects(
    () => client(async () => gatewayResponse(raw)).run(request),
    (error) => error.code === 'GATEWAY_TASK_TYPE_MISMATCH'
  );
});

test('网络失败与超时使用不同错误码和审计分类', async () => {
  await assert.rejects(
    () => client(async () => { throw new Error('network down'); }).run(request),
    (error) => error.code === 'GATEWAY_NETWORK_ERROR' && error.audit.provider === 'semantic_gateway'
  );

  const timeoutFetch = async (_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener('abort', () => {
      reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
    });
  });
  await assert.rejects(
    () => client(timeoutFetch, 5).run(request),
    (error) => error.code === 'GATEWAY_TIMEOUT' && error.status === 504
  );
});

test('非法 gateway envelope 与 HTTP 失败分别审计', async () => {
  const invalidEnvelopes = [
    gatewayEnvelope({ schema_version: '4.2' }),
    gatewayEnvelope({ status: 'unknown' }),
    gatewayEnvelope({ data: [] }),
    gatewayEnvelope({ warnings: {} })
  ];
  for (const envelope of invalidEnvelopes) {
    await assert.rejects(
      () => client(async () => gatewayResponse(JSON.stringify(envelope))).run(request),
      (error) => error.code === 'GATEWAY_ENVELOPE_INVALID'
    );
  }

  await assert.rejects(
    () => client(async () => new Response('unavailable', { status: 503 })).run(request),
    (error) => error.code === 'GATEWAY_HTTP_ERROR' && error.audit.http_status === 503
  );
});

test('禁用输出字段即使携带合法 envelope 也绝不作为回退', async () => {
  const forbiddenValue = JSON.stringify(gatewayEnvelope());
  const onlyForbidden = new Response(JSON.stringify({
    data: { outputs: { result: forbiddenValue, text: forbiddenValue, answer: forbiddenValue } }
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
  await assert.rejects(
    () => client(async () => onlyForbidden).run(request),
    (error) => error.code === 'GATEWAY_RESPONSE_PAYLOAD_MISSING'
  );

  await assert.rejects(
    () => client(async () => gatewayResponse('{invalid', {
      result: forbiddenValue,
      text: forbiddenValue,
      answer: forbiddenValue
    })).run(request),
    (error) => error.code === 'GATEWAY_INVALID_JSON'
  );
});

test('默认 GENERATION_PROVIDER=mock 保持原 writer，semantic_gateway 审计进入 4.3 envelope', async () => {
  const mockWriter = { async write() { return []; } };
  assert.equal(createGenerationProvider({ mockWriter, env: {} }), mockWriter);
  const service = new DeterministicPipelineService({ repository: {}, mockWriter, env: {} });
  assert.equal(service.writer, mockWriter);

  const sections = [{
    id: 'data-integration',
    title: '数据接入与集成',
    requirement_ids: ['REQ-001'],
    draft_text: '平台支持通过标准接口完成第三方系统数据接入。'
  }];
  const raw = JSON.stringify(gatewayEnvelope({ data: { sections } }));
  const semanticWriter = createGenerationProvider({
    env: {
      GENERATION_PROVIDER: 'semantic_gateway',
      V43_GATEWAY_API_BASE: 'https://gateway.invalid/v1',
      V43_GATEWAY_API_KEY: 'test-only',
      V43_GATEWAY_USER: 'gateway-test'
    },
    fetchImpl: async () => gatewayResponse(raw)
  });
  const pipelineResult = await runDeterministicPipeline({
    rawRequirements: [{ req_id: 'REQ-001', text: '支持通过标准接口完成第三方系统数据接入。' }],
    writer: semanticWriter
  });
  assert.equal(pipelineResult.ok, true);
  assert.equal(pipelineResult.envelope.provider_audit.raw_response_payload_json, raw);
});

test('backend/.env 使用唯一绝对路径并覆盖长期进程继承的旧网关配置', async () => {
  const env = {
    V43_GATEWAY_API_BASE: 'https://stale.invalid/v1',
    V43_GATEWAY_API_KEY: 'stale-test-key',
    V43_GATEWAY_USER: 'stale-user'
  };
  let dotenvOptions;
  const runtime = createBackendRuntime({
    env,
    dotenvConfig(options) {
      dotenvOptions = options;
      Object.assign(options.processEnv, {
        V43_GATEWAY_API_BASE: 'http://127.0.0.1:18080/v1',
        V43_GATEWAY_API_KEY: 'runtime-test-key',
        V43_GATEWAY_USER: 'runtime-user'
      });
      return { parsed: {} };
    }
  });
  assert.equal(isAbsolute(BACKEND_ENV_PATH), true);
  assert.match(BACKEND_ENV_PATH.replace(/\\/g, '/'), /\/backend\/\.env$/);
  assert.equal(dotenvOptions.path, BACKEND_ENV_PATH);
  assert.equal(dotenvOptions.override, true);
  assert.equal(dotenvOptions.processEnv, env);
  assert.equal(runtime.env.V43_GATEWAY_API_BASE, 'http://127.0.0.1:18080/v1');
});

test('网关配置解析器只接受 V43_GATEWAY_*，绝不回退到旧 DIFY_*', async () => {
  const legacyOnlyClient = createSemanticGatewayClientFromEnv({
    env: {
      DIFY_API_BASE: 'https://api.dify.invalid/v1',
      DIFY_API_KEY: 'legacy-test-key',
      DIFY_USER: 'legacy-user'
    },
    fetchImpl: async () => { throw new Error('must not be called'); }
  });
  await assert.rejects(
    () => legacyOnlyClient.run(request),
    (error) => error.code === 'GATEWAY_NOT_CONFIGURED'
  );
});

test('网络诊断只记录 provider、host、port 与错误分类', async () => {
  const diagnostics = [];
  const gatewayClient = createSemanticGatewayClientFromEnv({
    env: {
      V43_GATEWAY_API_BASE: 'http://127.0.0.1:18080/v1',
      V43_GATEWAY_API_KEY: 'never-log-this-test-key',
      V43_GATEWAY_USER: 'diagnostic-user'
    },
    fetchImpl: async () => { throw new Error('private network detail'); },
    logger: { warn: (...args) => diagnostics.push(args) }
  });
  await assert.rejects(
    () => gatewayClient.run(request),
    (error) => error.code === 'GATEWAY_NETWORK_ERROR'
  );
  assert.deepEqual(diagnostics, [[
    'Semantic Gateway transport diagnostic',
    {
      provider: 'semantic_gateway',
      gateway_host: '127.0.0.1',
      gateway_port: '18080',
      error_classification: 'GATEWAY_NETWORK_ERROR'
    }
  ]]);
  assert.doesNotMatch(JSON.stringify(diagnostics), /never-log|Authorization|private network|task_instruction/i);
});
