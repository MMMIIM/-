import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SEMANTIC_TASK_INSTRUCTIONS,
  getSemanticTaskContract,
  getSemanticTaskInstructionMetadata,
  resolveSemanticTaskInstruction,
  validateTaskData
} from '../../packages/semantic-contracts/index.js';
import { createSemanticTaskRouter } from '../../services/semantic-gateway/src/task-router.js';
import { createStandaloneGatewayServer } from '../../services/semantic-gateway/src/gateway.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const requirementExtractionSource = fs.readFileSync(
  path.resolve(here, '../src/pipeline/requirement-extraction.js'),
  'utf8'
);

test('Requirement Extraction has exactly one canonical instruction and explicit hash', () => {
  const metadata = getSemanticTaskInstructionMetadata('requirement_extraction');
  assert.ok(metadata);
  const activeRequirementInstructions = Object.entries(SEMANTIC_TASK_INSTRUCTIONS)
    .filter(([taskType, instruction]) => taskType === 'requirement_extraction' && typeof instruction === 'string' && instruction.trim());
  assert.equal(activeRequirementInstructions.length, 1);
  assert.equal(metadata.instruction, resolveSemanticTaskInstruction('requirement_extraction'));
  assert.equal(metadata.contract_version, '4.3-requirement-extraction-v1.1');
  assert.equal(metadata.instruction_hash, '4589cfd6f1c7385b313d4de2e1d37a363f48aca1389a51f637f57391fa7d7c81');
  const schema = getSemanticTaskContract('requirement_extraction').data_schema;
  assert.deepEqual(schema.properties.requirements.items.required, [
    'text', 'category', 'source_text', 'source_clause', 'mandatory_observed', 'requires_confirmation'
  ]);
  assert.equal(schema.properties.requirements.items.additionalProperties, false);
  assert.match(requirementExtractionSource, /resolveSemanticTaskInstruction/);
  assert.doesNotMatch(requirementExtractionSource, /REQUIREMENT_EXTRACTION_INSTRUCTION/);
  assert.doesNotMatch(requirementExtractionSource, /从招标文件文本中提取候选需求。/);
});

test('Gateway Task Router resolves the canonical instruction and emits contract metadata', async () => {
  let invocation;
  const router = createSemanticTaskRouter({
    provider: {
      async invoke(input) {
        invocation = input;
        return { data: { requirements: [] }, provider_audit: { model: 'fixture' } };
      }
    }
  });
  const result = await router.dispatch({ taskType: 'requirement_extraction', payload: {} });
  const contract = getSemanticTaskContract('requirement_extraction');
  assert.equal(invocation.instruction, resolveSemanticTaskInstruction('requirement_extraction'));
  assert.equal(result.provider_audit.semantic_contract_version, contract.contract_version);
  assert.equal(result.provider_audit.instruction_sha256, contract.instruction_hash);
});

test('Requirement Extraction shared validator enforces the six-field candidate schema', () => {
  const candidate = {
    text: '系统应提供审计日志。',
    category: 'technical',
    source_text: '系统应提供审计日志。',
    source_clause: null,
    mandatory_observed: true,
    requires_confirmation: false
  };
  assert.deepEqual(validateTaskData('requirement_extraction', { requirements: [candidate] }), { requirements: [candidate] });
  for (const invalid of [
    { ...candidate, legacy: true },
    { ...candidate, mandatory_observed: 'true' },
    { ...candidate, requires_confirmation: 0 },
    { ...candidate, category: 'not-a-category' },
    { ...candidate, source_clause: 3 },
    (() => { const copy = { ...candidate }; delete copy.source_text; return copy; })()
  ]) {
    assert.throws(() => validateTaskData('requirement_extraction', { requirements: [invalid] }), /unsupported fields|missing|required|canonical categories|boolean|string or null/);
  }
});

test('Gateway rejects supplied contract metadata drift before Provider invocation', async () => {
  let providerCalled = false;
  const router = createSemanticTaskRouter({
    provider: {
      async invoke() {
        providerCalled = true;
        return { data: { requirements: [] } };
      }
    }
  });
  await assert.rejects(
    () => router.dispatch({ taskType: 'requirement_extraction', payload: {}, contractVersion: 'old-contract' }),
    error => error.code === 'SEMANTIC_CONTRACT_DRIFT'
  );
  await assert.rejects(
    () => router.dispatch({
      taskType: 'requirement_extraction',
      payload: {},
      instructionHash: '0'.repeat(64)
    }),
    error => error.code === 'SEMANTIC_CONTRACT_DRIFT'
  );
  assert.equal(providerCalled, false);
});

test('Gateway HTTP path ignores caller prompt text and uses the canonical Requirement instruction', async () => {
  let invocation;
  const apiKey = 'contract-owner-test-key';
  const server = createStandaloneGatewayServer({
    config: {
      apiKey,
      providerName: 'mock',
      provider: {
        model: 'fixture',
        async invoke(input) {
          invocation = input;
          return { data: { requirements: [] } };
        }
      }
    }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/workflows/run`, {
      method: 'POST',
      headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        inputs: {
          task_type: 'requirement_extraction',
          task_instruction: 'caller-owned competing prompt',
          task_payload_json: '{}'
        }
      })
    });
    assert.equal(response.status, 200);
    assert.equal(invocation.instruction, resolveSemanticTaskInstruction('requirement_extraction'));
    assert.notEqual(invocation.instruction, 'caller-owned competing prompt');
  } finally {
    await new Promise((resolve, reject) => server.close(error => (error ? reject(error) : resolve())));
  }
});

test('Unrelated semantic task instructions continue to resolve through the same registry', () => {
  const metadata = getSemanticTaskInstructionMetadata('section_drafting');
  assert.equal(metadata.instruction, resolveSemanticTaskInstruction('section_drafting'));
  assert.match(metadata.instruction_hash, /^[a-f0-9]{64}$/);
});
