import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildRequirementExtractionLiveRequest
} from '../src/verification/requirement-extraction-live-input.js';
import {
  defaultLiveExecutor,
  FROZEN_REQUIREMENT_EXTRACTION_PROMPT_HASH,
  FROZEN_REQUIREMENT_CANDIDATE_SCHEMA_HASH,
  runRequirementExtractionLive
} from '../src/verification/requirement-extraction-verifier.js';
import { sanitizeVerificationReport } from '../src/verification/requirement-extraction-report.js';

const env = {
  SEMANTIC_GATEWAY_PROVIDER: 'openai_compatible',
  SEMANTIC_GATEWAY_API_BASE: 'http://127.0.0.1:18082',
  SEMANTIC_GATEWAY_API_KEY: 'service-test-key',
  SEMANTIC_GATEWAY_USER: 'verification-test',
  SEMANTIC_GATEWAY_PROVIDER_API_BASE: 'https://provider.test/v1',
  SEMANTIC_GATEWAY_PROVIDER_API_KEY: 'provider-test-key',
  SEMANTIC_GATEWAY_MODEL: 'test-model'
};

function gatewayResponse(candidate) {
  return new Response(JSON.stringify({
    data: {
      outputs: {
        response_payload_json: JSON.stringify({
          schema_version: '4.3-requirement-extraction-v2',
          task_type: 'requirement_extraction',
          status: 'success',
          data: { requirements: [candidate] },
          warnings: []
        })
      }
    },
    probe_diagnostics: {
      provider_adapter_invoked: true,
      fetch_invoked: true,
      provider_http_reached: true,
      provider_http_status: 200
    }
  }), { status: 200, headers: { 'content-type': 'application/json' } });
}

function fetchFor(candidate) {
  return async (url, options) => {
    assert.match(url, /\/workflows\/run$/);
    assert.equal(options.method, 'POST');
    return gatewayResponse(candidate);
  };
}

function healthyFetch(url) {
  if (url.endsWith('/api/health')) return new Response(JSON.stringify({ ok: true }), { status: 200 });
  if (url.endsWith('/health')) return new Response(JSON.stringify({ service: 'semantic-gateway' }), { status: 200 });
  if (url.endsWith('/ready')) return new Response(JSON.stringify({ status: 'ready', provider_configured: true }), { status: 200 });
  if (url.endsWith('/info')) return new Response(JSON.stringify({
    service: 'semantic-gateway', task_registry_loaded: true,
    task_types: ['requirement_extraction'],
    requirement_extraction_contract_version: '4.3-requirement-extraction-v2',
    requirement_extraction_prompt_hash: FROZEN_REQUIREMENT_EXTRACTION_PROMPT_HASH,
    candidate_schema_contract_version: '4.3-requirement-candidate-v2',
    candidate_schema_sha256: FROZEN_REQUIREMENT_CANDIDATE_SCHEMA_HASH
  }), { status: 200 });
  throw new Error(`unexpected url ${url}`);
}

function candidate(sourceRefs = ['C001-S001']) {
  return {
    text: '系统应提供审计日志。',
    category: 'technical',
    source_refs: sourceRefs,
    mandatory_observed: true,
    requires_confirmation: false
  };
}

test('missing live payload is rejected without an executor call', async () => {
  let calls = 0;
  const result = await runRequirementExtractionLive({
    env,
    confirmOneLiveCall: true,
    gitInfo: { branch: 'feat/v4.3-semantic-boundary-routing', revision: 'test', tracked_clean: true },
    fetchImpl: healthyFetch,
    liveExecutor: async () => { calls += 1; return {}; },
    writeReport: false
  });
  assert.equal(result.ok, false);
  assert.ok(result.report.blockers.includes('LIVE_PAYLOAD_REQUIRED'));
  assert.equal(calls, 0);
});

test('raw FAST-01 chunk builds production span IDs and stays one chunk at 4,930 chars', () => {
  const request = buildRequirementExtractionLiveRequest({ text: '中'.repeat(4_930) });
  assert.equal(request.chunkCount, 1);
  assert.equal(request.chunk.chunk_number, 1);
  assert.equal(request.chunk.segments.length, 1);
  assert.equal(request.chunk.segments[0].source_ref, 'C001-S001');
  assert.equal(request.chunk.segments[0].text.length, 4_930);
  assert.equal(request.chunk.character_count, 4_930);
  assert.match(request.chunk.model_text, /^\[C001-S001\] /);
});

test('default live executor resolves valid refs before Canonical ingestion', async () => {
  const liveRequest = buildRequirementExtractionLiveRequest({ text: '系统应提供审计日志。' });
  const result = await defaultLiveExecutor({
    env,
    liveRequest,
    fetchImpl: fetchFor(candidate())
  });
  assert.equal(result.source_resolution_pass, true);
  assert.equal(result.backend_ingestion_pass, true);
  assert.equal(result.schema_pass, true);
  assert.equal(result.candidate_count, 1);
});

test('unknown source ref blocks live before Canonical ingestion', async () => {
  const liveRequest = buildRequirementExtractionLiveRequest({ text: '系统应提供审计日志。' });
  const result = await defaultLiveExecutor({
    env,
    liveRequest,
    fetchImpl: fetchFor(candidate(['C001-S999']))
  });
  assert.equal(result.source_resolution_pass, false);
  assert.equal(result.backend_ingestion_pass, false);
  assert.equal(result.technical_error_code, 'SOURCE_LOCATION_UNRESOLVED');
});

test('non-contiguous source refs block live before Canonical ingestion', async () => {
  const liveRequest = buildRequirementExtractionLiveRequest({ text: '第一段。\n第二段。\n第三段。' });
  const result = await defaultLiveExecutor({
    env,
    liveRequest,
    fetchImpl: fetchFor(candidate(['C001-S001', 'C001-S003']))
  });
  assert.equal(result.source_resolution_pass, false);
  assert.equal(result.backend_ingestion_pass, false);
  assert.equal(result.technical_error_code, 'SOURCE_LOCATION_UNRESOLVED');
});

test('live report retains only safe booleans/counts and never source or model text', () => {
  const report = sanitizeVerificationReport({
    source_resolution_pass: true,
    candidate_count: 1,
    schema_pass: true,
    backend_ingestion_pass: true,
    source_text: 'private source',
    model_content: 'private model',
    chunk_text: 'private chunk'
  });
  assert.deepEqual(report, {
    source_resolution_pass: true,
    candidate_count: 1,
    schema_pass: true,
    backend_ingestion_pass: true
  });
});

test('source resolution failure is surfaced as BLOCKED with no retry or fallback', async () => {
  const result = await runRequirementExtractionLive({
    env,
    confirmOneLiveCall: true,
    liveRequest: { text: 'synthetic' },
    gitInfo: { branch: 'feat/v4.3-semantic-boundary-routing', revision: 'test', tracked_clean: true },
    fetchImpl: healthyFetch,
    liveExecutor: async () => ({
      executed: true,
      request_count: 1,
      retry_count: 0,
      fallback_count: 0,
      provider_chain_verified: true,
      schema_pass: true,
      source_resolution_pass: false,
      backend_ingestion_pass: false,
      technical_error_code: 'SOURCE_LOCATION_UNRESOLVED'
    }),
    writeReport: false
  });
  assert.equal(result.ok, false);
  assert.equal(result.report.verdict, 'BLOCKED');
  assert.ok(result.report.blockers.includes('SOURCE_LOCATION_UNRESOLVED'));
  assert.equal(result.report.live.retry_count, 0);
  assert.equal(result.report.live.fallback_count, 0);
});
