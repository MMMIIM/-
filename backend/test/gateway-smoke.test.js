import test from 'node:test';
import assert from 'node:assert/strict';
import { SemanticGatewayClient } from '../src/pipeline/semantic-gateway-client.js';
import { GATEWAY_HEALTHCHECK_REQUEST, runGatewaySmoke } from '../scripts/gateway-smoke.js';

function gatewayResponse(rawResponsePayloadJson) {
  return new Response(JSON.stringify({
    data: { outputs: { response_payload_json: rawResponsePayloadJson } }
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

function mockClient(fetchImpl) {
  return new SemanticGatewayClient({
    apiBase: 'https://gateway.invalid/v1',
    apiKey: 'never-print-this-test-key',
    user: 'smoke-test',
    fetchImpl,
    timeoutMs: 100
  });
}

test('gateway smoke 通过现有 client 发送固定 healthcheck 并只输出脱敏摘要', async () => {
  let sentInputs;
  const envelope = {
    schema_version: '4.3-gateway',
    task_type: 'healthcheck',
    status: 'success',
    data: { message: 'gateway_contract_ok' },
    warnings: []
  };
  const raw = `<think>不得出现在控制台的内容</think>\n${JSON.stringify(envelope)}`;
  const client = mockClient(async (_url, options) => {
    sentInputs = JSON.parse(options.body).inputs;
    return gatewayResponse(raw);
  });
  const stdout = [];
  const stderr = [];
  const times = [1000, 1025];

  const exitCode = await runGatewaySmoke({
    client,
    stdout: (line) => stdout.push(line),
    stderr: (line) => stderr.push(line),
    now: () => times.shift()
  });

  assert.equal(exitCode, 0);
  const expectedRequest = {
    task_type: 'healthcheck',
    task_instruction: '返回严格 JSON，data 为 {"message":"gateway_contract_ok"}。',
    task_payload_json: '{}'
  };
  assert.deepEqual(GATEWAY_HEALTHCHECK_REQUEST, expectedRequest);
  assert.deepEqual(sentInputs, expectedRequest);
  assert.equal(stderr.length, 0);
  assert.deepEqual(JSON.parse(stdout[0]), {
    task_type: 'healthcheck',
    status: 'success',
    'data.message': 'gateway_contract_ok',
    warnings_count: 0,
    elapsed_ms: 25
  });
  assert.doesNotMatch(stdout[0], /think|never-print-this-test-key|response_payload_json/);
});

test('gateway smoke 异常只输出分类错误码并返回非零退出码', async () => {
  const client = mockClient(async () => new Response(JSON.stringify({
    data: { outputs: { result: '{"status":"success"}' } }
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  }));
  const stdout = [];
  const stderr = [];
  const times = [2000, 2004];

  const exitCode = await runGatewaySmoke({
    client,
    stdout: (line) => stdout.push(line),
    stderr: (line) => stderr.push(line),
    now: () => times.shift()
  });

  assert.equal(exitCode, 1);
  assert.equal(stdout.length, 0);
  assert.deepEqual(JSON.parse(stderr[0]), {
    task_type: 'healthcheck',
    error_code: 'GATEWAY_RESPONSE_PAYLOAD_MISSING',
    elapsed_ms: 4
  });
  assert.doesNotMatch(stderr[0], /result|status|never-print-this-test-key/);
});
