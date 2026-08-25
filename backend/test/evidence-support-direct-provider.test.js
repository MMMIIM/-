import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createStandaloneGatewayServer } from '../../services/semantic-gateway/src/gateway.js';
import {
  createSemanticGatewayEvidenceSupportEvaluatorFromEnv
} from '../src/pipeline/semantic-gateway-evidence-support-evaluator.js';
import {
  EVIDENCE_SUPPORT_GATEWAY_CONTRACT_VERSION,
  EVIDENCE_SUPPORT_GATEWAY_TASK_TYPE
} from '../src/pipeline/evidence-support-assessment-gateway-contract-v1.js';
import { adaptRetrievalCandidate } from '../src/pipeline/evidence-support-assessment-contract-v1.js';

const hash = value => createHash('sha256').update(String(value)).digest('hex');
const requirement = { req_id: 'REQ-DIRECT-001', text: '企业应提供可核验的性能测试记录。' };
const sourceText = '结果：平均响应时间 1.4 秒。';

function adapter() {
  return adaptRetrievalCandidate({
    requirement,
    candidate: { candidate_id: 'CAND-DIRECT-001' },
    sourceSpan: {
      source_span_id: 'SPAN-DIRECT-001',
      source_text: sourceText,
      source_text_hash: hash(sourceText)
    },
    lineage: { material_id: 'MAT-DIRECT-001', document_id: 'DOC-DIRECT-001', chunk_id: 'CHUNK-DIRECT-001' }
  });
}

function validData() {
  return {
    assessments: [{
      source_id: 'CAND-DIRECT-001',
      source_span_id: 'SPAN-DIRECT-001',
      semantic_relevance: 'relevant',
      evidence_capability: 'capable',
      support_level: 'full_support',
      semantic_relationship: 'direct',
      review_dimensions: {
        subject_match: 'match', scope_match: 'match', status_match: 'match',
        quantitative_match: 'match', entity_match: 'match', validity_match: 'match',
        source_authority: 'match', support_sufficiency: 'match'
      },
      reason_codes: [],
      support_observations: [{
        source_id: 'CAND-DIRECT-001',
        source_span_id: 'SPAN-DIRECT-001',
        support_excerpt: sourceText,
        observation_type: 'direct_support',
        reason_codes: []
      }]
    }],
    conflict_observations: []
  };
}

test('evidence support factory binds only canonical Semantic Gateway config', async () => {
  const calls = [];
  const evaluator = createSemanticGatewayEvidenceSupportEvaluatorFromEnv({
    env: {
      SEMANTIC_GATEWAY_API_BASE: 'http://canonical-gateway.test',
      SEMANTIC_GATEWAY_API_KEY: 'canonical-key',
      SEMANTIC_GATEWAY_USER: 'canonical-user',
      V43_GATEWAY_API_BASE: 'http://legacy-dify.test',
      V43_GATEWAY_API_KEY: 'legacy-key'
    },
    fetchImpl: async (url, options) => {
      calls.push({ url, body: JSON.parse(options.body) });
      return new Response(JSON.stringify({ data: { outputs: { response_payload_json: JSON.stringify({
        schema_version: EVIDENCE_SUPPORT_GATEWAY_CONTRACT_VERSION,
        task_type: EVIDENCE_SUPPORT_GATEWAY_TASK_TYPE,
        status: 'success',
        data: validData(),
        warnings: []
      }) } } }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
  });
  await evaluator.assess({ requirement, adapters: [adapter()] });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'http://canonical-gateway.test/workflows/run');
  assert.equal(calls[0].body.inputs.task_type, EVIDENCE_SUPPORT_GATEWAY_TASK_TYPE);
  assert.doesNotMatch(calls[0].url, /legacy-dify/i);
});

test('canonical evidence task cannot be constructed from legacy-only Dify variables', async () => {
  const evaluator = createSemanticGatewayEvidenceSupportEvaluatorFromEnv({
    env: {
      DIFY_API_BASE: 'http://legacy-dify.test',
      DIFY_API_KEY: 'legacy-key',
      V43_GATEWAY_API_BASE: 'http://legacy-gateway.test',
      V43_GATEWAY_API_KEY: 'legacy-key'
    },
    fetchImpl: async () => { throw new Error('legacy transport must not be called'); }
  });
  await assert.rejects(
    () => evaluator.assess({ requirement, adapters: [adapter()] }),
    error => error.code === 'ASSESSMENT_UNAVAILABLE' && error.audit.technical_error_code === 'GATEWAY_NOT_CONFIGURED'
  );
});

test('standalone task router owns evidence support dispatch and rejects legacy provider shape', async () => {
  const key = 'direct-router-test-key';
  const seen = [];
  const server = createStandaloneGatewayServer({
    config: {
      apiKey: key,
      providerName: 'openai_compatible',
      provider: {
        model: 'fixture-provider',
        async invoke(args) {
          seen.push(args);
          return { data: { requirement_id: 'legacy', source_id: 'legacy', support_level: 'full_support' } };
        }
      }
    }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/workflows/run`, {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({ inputs: {
        task_type: EVIDENCE_SUPPORT_GATEWAY_TASK_TYPE,
        task_instruction: 'caller instruction must be ignored',
        task_payload_json: JSON.stringify({ contract_version: EVIDENCE_SUPPORT_GATEWAY_CONTRACT_VERSION, requirement: { requirement_id: requirement.req_id, requirement_text: requirement.text }, sources: [{ source_id: 'CAND-DIRECT-001', source_kind: 'retrieval_candidate', source_span_id: 'SPAN-DIRECT-001', source_text: sourceText, source_text_hash: hash(sourceText), material_type: null, content_role: null, lineage: {} }] })
      } })
    });
    assert.equal(response.status, 422);
    assert.equal((await response.json()).error_code, 'OUTPUT_SCHEMA_INVALID');
    assert.equal(seen.length, 1);
    assert.match(seen[0].instruction, /不可信业务资料/);
    assert.doesNotMatch(seen[0].instruction, /caller instruction/);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
