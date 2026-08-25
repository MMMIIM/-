import test from 'node:test';
import assert from 'node:assert/strict';
import { createStandaloneGatewayServer } from '../src/gateway.js';
import { SemanticGatewayClient } from '../../../backend/src/pipeline/semantic-gateway-client.js';
import { adaptRetrievalCandidate, aggregateEvidenceSufficiency } from '../../../backend/src/pipeline/evidence-support-assessment-contract-v1.js';
import { SemanticGatewayEvidenceSupportEvaluator } from '../../../backend/src/pipeline/semantic-gateway-evidence-support-evaluator.js';

async function withGateway(fn, { provider = 'mock', key = 'gateway-test-key' } = {}) {
  const server = createStandaloneGatewayServer({
    env: { SEMANTIC_GATEWAY_PROVIDER: provider, SEMANTIC_GATEWAY_API_KEY: key, SEMANTIC_GATEWAY_MODEL: 'mock-semantic-v1' }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  try { return await fn({ port, key }); } finally { await new Promise(resolve => server.close(resolve)); }
}

function client(port, key = 'gateway-test-key') {
  return new SemanticGatewayClient({
    apiBase: `http://127.0.0.1:${port}`,
    apiKey: key,
    user: 'standalone-test',
    timeoutMs: 5000
  });
}

test('standalone gateway health/readiness/auth are explicit', async () => {
  await withGateway(async ({ port, key }) => {
    const health = await fetch(`http://127.0.0.1:${port}/health`);
    assert.equal(health.status, 200);
    assert.equal((await health.json()).status, 'ok');
    const ready = await fetch(`http://127.0.0.1:${port}/ready`);
    assert.equal(ready.status, 200);
    assert.equal((await ready.json()).provider, 'mock');
    const unauthorized = await fetch(`http://127.0.0.1:${port}/workflows/run`, { method: 'POST', body: '{}' });
    assert.equal(unauthorized.status, 401);
    const authorized = await fetch(`http://127.0.0.1:${port}/workflows/run`, {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({ inputs: { task_type: 'requirement_extraction', task_instruction: 'ignored by resolver', task_payload_json: '{}' } })
    });
    assert.equal(authorized.status, 200);
  });
});

test('Gateway service auth is independent from Provider auth', async () => {
  const server = createStandaloneGatewayServer({
    env: {
      SEMANTIC_GATEWAY_PROVIDER: 'openai_compatible',
      SEMANTIC_GATEWAY_API_KEY: 'service-key',
      SEMANTIC_GATEWAY_PROVIDER_API_BASE: 'https://provider.invalid/v1',
      SEMANTIC_GATEWAY_PROVIDER_API_KEY: 'provider-key',
      SEMANTIC_GATEWAY_MODEL: 'Qwen/Qwen2.5-7B-Instruct'
    }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const body = JSON.stringify({ inputs: { task_type: '__preflight__', task_instruction: 'preflight', task_payload_json: '{}' } });
    const headers = { 'content-type': 'application/json' };
    const missing = await fetch(`${base}/workflows/run`, { method: 'POST', headers, body });
    assert.equal(missing.status, 401);
    const wrong = await fetch(`${base}/workflows/run`, { method: 'POST', headers: { ...headers, authorization: 'Bearer provider-key' }, body });
    assert.equal(wrong.status, 401);
    const correct = await fetch(`${base}/workflows/run`, { method: 'POST', headers: { ...headers, authorization: 'Bearer service-key' }, body });
    assert.equal(correct.status, 422);
    assert.equal((await correct.json()).error_code, 'TASK_UNSUPPORTED');
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test('OpenAI-compatible readiness fails closed when Provider key is missing', async () => {
  const server = createStandaloneGatewayServer({
    env: {
      SEMANTIC_GATEWAY_PROVIDER: 'openai_compatible',
      SEMANTIC_GATEWAY_API_KEY: 'service-key',
      SEMANTIC_GATEWAY_PROVIDER_API_BASE: 'https://provider.invalid/v1',
      SEMANTIC_GATEWAY_MODEL: 'Qwen/Qwen2.5-7B-Instruct'
    }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const ready = await fetch(`http://127.0.0.1:${server.address().port}/ready`);
    assert.equal(ready.status, 503);
    assert.equal((await ready.json()).provider_configured, false);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test('backend SemanticGatewayClient uses the same /workflows/run transport contract', async () => {
  await withGateway(async ({ port, key }) => {
    const result = await client(port, key).run({ task_type: 'requirement_extraction', task_instruction: 'backend instruction', task_payload_json: '{}' });
    assert.equal(result.envelope.schema_version, '4.3-requirement-extraction');
    assert.equal(result.envelope.task_type, 'requirement_extraction');
    assert.deepEqual(result.envelope.data, { requirements: [] });
  });
});

test('all existing formal tasks dispatch through the same mock provider contract', async () => {
  await withGateway(async ({ port, key }) => {
    const cases = [
      ['requirement_extraction', {}, '4.3-requirement-extraction', data => Array.isArray(data.requirements)],
      ['response_planning', { requirements: [{ req_id: 'REQ-001' }] }, '4.3-response-planning', data => Array.isArray(data.response_plans)],
      ['claim_generation', { plans: [{ requirement_id: 'REQ-001', response_summary: 'x' }] }, '4.3-claim-generation', data => Array.isArray(data.claims)],
      ['section_drafting', { chapter_id: 'chapter-1' }, '4.3-section-drafting', data => typeof data.content_markdown === 'string'],
      ['targeted_revision', { paragraph: '待修订文本' }, '4.3-targeted-revision', data => typeof data.revised_text === 'string']
    ];
    for (const [taskType, payload, version, predicate] of cases) {
      const result = await client(port, key).run({ task_type: taskType, task_instruction: 'formal instruction', task_payload_json: JSON.stringify(payload) });
      assert.equal(result.envelope.schema_version, version);
      assert.equal(result.envelope.task_type, taskType);
      assert.equal(predicate(result.envelope.data), true);
    }
  });
});

test('evidence support Top5 integrates through standalone gateway and deterministic aggregation', async () => {
  await withGateway(async ({ port, key }) => {
    const requirement = { req_id: 'REQ-001', text: '系统应支持统一身份认证。' };
    const texts = [
      '系统应支持统一身份认证。',
      '系统提供统一身份认证能力。[[partial]]',
      '这是背景介绍。[[unrelated]]',
      '状态为已上线。[[conflict:approved]]',
      '状态为建设中。[[conflict:rejected]]'
    ];
    const adapters = texts.map((sourceText, index) => adaptRetrievalCandidate({
      requirement,
      candidate: { candidate_id: `C-${index + 1}` },
      sourceSpan: { source_span_id: `SPAN-${index + 1}`, source_text: sourceText },
      lineage: { material_id: `MAT-${index + 1}`, chunk_id: `CHUNK-${index + 1}` }
    }));
    const evaluator = new SemanticGatewayEvidenceSupportEvaluator({ client: client(port, key) });
    const result = await evaluator.assess({ requirement, adapters });
    assert.equal(result.assessments.length, 5);
    assert.ok(result.assessments.some(item => item.semantic_relationship === 'direct'));
    assert.ok(result.assessments.some(item => item.semantic_relationship === 'partial'));
    assert.ok(result.assessments.some(item => item.semantic_relationship === 'unrelated'));
    assert.ok(result.assessments.every(item => item.support_observations[0].support_excerpt.length > 0));
    const aggregate = aggregateEvidenceSufficiency(result.assessments);
    assert.equal(aggregate.status, 'CONFLICTING_EVIDENCE');
    assert.equal(result.audit.task_type, 'evidence_support_assessment');
  });
});

test('unknown semantic observation remains unknown and does not become a business allow', async () => {
  await withGateway(async ({ port, key }) => {
    const requirement = { req_id: 'REQ-002', text: '系统应支持日志审计。' };
    const adapter = adaptRetrievalCandidate({
      requirement,
      candidate: { candidate_id: 'C-UNKNOWN' },
      sourceSpan: { source_span_id: 'SPAN-UNKNOWN', source_text: '无法判断。[[unknown]]' }
    });
    const result = await new SemanticGatewayEvidenceSupportEvaluator({ client: client(port, key) }).assess({ requirement, adapters: [adapter] });
    assert.equal(result.assessments[0].semantic_relationship, 'unknown');
    assert.equal(aggregateEvidenceSufficiency(result.assessments).status, 'ASSESSMENT_UNAVAILABLE');
  });
});

test('strict output validation rejects unsupported gateway fields', async () => {
  await withGateway(async ({ port, key }) => {
    const response = await fetch(`http://127.0.0.1:${port}/workflows/run`, {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({ inputs: { task_type: 'not_registered', task_instruction: 'x', task_payload_json: '{}' } })
    });
    assert.equal(response.status, 422);
    assert.equal((await response.json()).error_code, 'TASK_UNSUPPORTED');
  });
});

test('provider schema violations are classified as OUTPUT_SCHEMA_INVALID', async () => {
  const key = 'gateway-schema-key';
  const server = createStandaloneGatewayServer({
    config: {
      apiKey: key,
      providerName: 'mock',
      provider: {
        model: 'fixture-invalid',
        async invoke() { return { data: { requirements: 'not-an-array' } }; }
      }
    }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/workflows/run`, {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({ inputs: { task_type: 'requirement_extraction', task_instruction: 'x', task_payload_json: '{}' } })
    });
    assert.equal(response.status, 422);
    assert.equal((await response.json()).error_code, 'OUTPUT_SCHEMA_INVALID');
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test('probe-only diagnostics expose model content and validator details without changing canonical response reads', async () => {
  const key = 'gateway-diagnostic-key';
  const provider = {
    model: 'fixture-invalid',
    async invoke() {
      const parsed = { schema_version: '4.3-evidence-support-assessment-v1', data: { assessments: [] }, warnings: [] };
      return {
        data: parsed,
        provider_audit: {
          model: 'fixture-invalid',
          http_status: 200,
          json_parse_success: true,
          markdown_fence_present: false,
          provider_adapter_invoked: true,
          fetch_invoked: true,
          provider_http_reached: false,
          failure_stage: 'FETCH_INVOKED',
          safe_error_code: 'FETCH_FAILED',
          model_content: JSON.stringify(parsed),
          parsed_json: parsed
        }
      };
    }
  };
  const server = createStandaloneGatewayServer({ config: { apiKey: key, providerName: 'mock', provider } });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/workflows/run`, {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json', 'x-semantic-gateway-diagnostic': 'probe-v1' },
      body: JSON.stringify({ inputs: { task_type: 'requirement_extraction', task_instruction: 'x', task_payload_json: '{}' } })
    });
    assert.equal(response.status, 422);
    const body = await response.json();
    assert.equal(body.error_code, 'OUTPUT_SCHEMA_INVALID');
    assert.equal(body.probe_diagnostics.json_parse_success, true);
    assert.equal(typeof body.probe_diagnostics.model_content, 'string');
    assert.equal(body.probe_diagnostics.schema_validation_errors.length, 1);
    assert.equal(body.probe_diagnostics.schema_validation_errors[0].validator_code, 'OUTPUT_SCHEMA_INVALID');
    assert.equal(body.probe_diagnostics.provider_adapter_invoked, true);
    assert.equal(body.probe_diagnostics.fetch_invoked, true);
    assert.equal(body.probe_diagnostics.provider_http_reached, false);
    assert.equal(body.probe_diagnostics.failure_stage, 'FETCH_INVOKED');
    assert.equal(body.probe_diagnostics.safe_error_code, 'FETCH_FAILED');
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test('provider technical errors keep the controlled Gateway error code', async () => {
  const cases = [
    ['PROVIDER_UNAVAILABLE', 502],
    ['PROVIDER_TIMEOUT', 504],
    ['PROVIDER_OUTPUT_INVALID', 502],
    ['INTERNAL_GATEWAY_ERROR', 500]
  ];
  for (const [code, expectedStatus] of cases) {
    const key = `gateway-${code.toLowerCase()}`;
    const server = createStandaloneGatewayServer({
      config: {
        apiKey: key,
        providerName: 'mock',
        provider: {
          model: 'fixture-error',
          async invoke() { throw Object.assign(new Error('fixture provider failure'), { code }); }
        }
      }
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
      const response = await fetch(`http://127.0.0.1:${server.address().port}/workflows/run`, {
        method: 'POST',
        headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
        body: JSON.stringify({ inputs: { task_type: 'requirement_extraction', task_instruction: 'x', task_payload_json: '{}' } })
      });
      assert.equal(response.status, expectedStatus);
      assert.equal((await response.json()).error_code, code);
    } finally {
      await new Promise(resolve => server.close(resolve));
    }
  }
});
