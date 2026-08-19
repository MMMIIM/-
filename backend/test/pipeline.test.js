import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { canonicalizeRequirements } from '../src/pipeline/canonical-requirements.js';
import { createClaimGate } from '../src/pipeline/claim-gate.js';
import { sanitizeDocument } from '../src/pipeline/document-sanitizer.js';
import { validateDocument } from '../src/pipeline/document-validator.js';
import { PIPELINE_STATES, runDeterministicPipeline } from '../src/pipeline/generation-audit.js';

const fixture = JSON.parse(readFileSync(
  new URL('./fixtures/v4.3-mock-writer.json', import.meta.url),
  'utf8'
));

const fixtureWriter = {
  async write() {
    return structuredClone(fixture.sections);
  }
};

function section(text, requirementIds = ['REQ-001']) {
  return {
    id: 'data-integration',
    title: '数据接入与集成',
    requirement_ids: requirementIds,
    draft_text: text
  };
}

test('合法正文生成 schema_version=4.3 且完成完整状态链', async () => {
  const result = await runDeterministicPipeline({
    rawRequirements: fixture.requirements,
    writer: fixtureWriter,
    title: '确定性响应'
  });

  assert.equal(result.ok, true);
  assert.equal(result.envelope.schema_version, '4.3');
  assert.equal(result.envelope.risk_status, 'pass');
  assert.deepEqual(
    result.envelope.generation_audit.events.map((event) => event.state),
    PIPELINE_STATES
  );
  assert.deepEqual(result.envelope.requirements.map((item) => item.req_id), ['REQ-001', 'REQ-002']);
  assert.notDeepEqual(result.envelope.requirements[0].target_sections, ['client-supplied-section']);
  assert.ok(result.envelope.traceability_matrix.every((item) => item.status === 'covered'));
  assert.ok(result.envelope.traceability_matrix.every((item) => item.source_status === 'verified'));
});

test('第三方数据接入是合法正文，不被 sanitizer 删除', () => {
  const requirements = canonicalizeRequirements([fixture.requirements[0]]);
  const sanitized = sanitizeDocument(
    [section('平台支持通过标准接口完成第三方系统数据接入。')],
    createClaimGate(requirements)
  );
  assert.match(sanitized[0].final_text, /第三方系统数据接入/);
  assert.equal(sanitized[0].sanitization_events.length, 0);
});

test('第三方系统改造仅删除完整违规句并保留合法句', () => {
  const requirements = canonicalizeRequirements([fixture.requirements[0]]);
  const sanitized = sanitizeDocument(
    [section('平台支持第三方系统数据接入。我们将改造第三方系统以适配本项目。')],
    createClaimGate(requirements)
  );
  assert.equal(sanitized[0].final_text, '平台支持第三方系统数据接入。');
  assert.deepEqual(sanitized[0].sanitization_events, [
    { code: 'THIRD_PARTY_MODIFICATION', action: 'deleted_sentence' }
  ]);
});

test('第三方改造否定句保留，价格优惠声明整句删除', () => {
  const requirements = canonicalizeRequirements([fixture.requirements[0]]);
  const sanitized = sanitizeDocument(
    [section('本方案不涉及第三方系统改造。项目优惠价为10万元。平台提供标准数据接口。')],
    createClaimGate(requirements)
  );
  assert.equal(sanitized[0].final_text, '本方案不涉及第三方系统改造。\n平台提供标准数据接口。');
  assert.equal(sanitized[0].sanitization_events[0].code, 'COMMERCIAL_CLAIM');
});

test('无依据固定 SLA 被整句删除并形成 warning', () => {
  const requirements = canonicalizeRequirements([
    { req_id: 'REQ-001', text: '提供持续运维与服务保障。' }
  ]);
  const gate = createClaimGate(requirements);
  const sanitized = sanitizeDocument([
    { ...section('提供持续运维服务。我们承诺2小时内完成故障修复。'), id: 'service-commitment', title: '服务与运维' }
  ], gate);
  const validation = validateDocument({
    baselineRequirements: requirements,
    requirements,
    sections: sanitized,
    claimGate: gate,
    phase: 'final'
  });
  assert.equal(sanitized[0].final_text, '提供持续运维服务。');
  assert.equal(sanitized[0].sanitization_events[0].code, 'UNSUPPORTED_FIXED_COMMITMENT');
  assert.equal(validation.valid, true);
  assert.equal(validation.risk_status, 'warning');
});

test('Requirement 明确依据的固定 SLA 可保留', () => {
  const requirements = canonicalizeRequirements([
    { req_id: 'REQ-001', text: '运维服务须在2小时内完成故障修复。' }
  ]);
  const sanitized = sanitizeDocument([
    { ...section('运维团队在2小时内完成故障修复。'), id: 'service-commitment', title: '服务与运维' }
  ], createClaimGate(requirements));
  assert.equal(sanitized[0].final_text, '运维团队在2小时内完成故障修复。');
  assert.equal(sanitized[0].sanitization_events.length, 0);
});

test('语义不确定问题只标记 requiresManualOrLlmRevision，不硬改正文', () => {
  const requirements = canonicalizeRequirements([
    { req_id: 'REQ-001', text: '提供持续运维与服务保障。' }
  ]);
  const sanitized = sanitizeDocument([
    { ...section('预计2小时内完成故障修复。'), id: 'service-commitment', title: '服务与运维' }
  ], createClaimGate(requirements));
  assert.equal(sanitized[0].final_text, '预计2小时内完成故障修复。');
  assert.equal(sanitized[0].requiresManualOrLlmRevision, true);
  assert.equal(sanitized[0].sanitization_events.length, 0);
});

test('REQ 覆盖不足导致 critical 并进入 failed', async () => {
  const writer = {
    async write() {
      return [fixture.sections[0]];
    }
  };
  const result = await runDeterministicPipeline({ rawRequirements: fixture.requirements, writer });
  assert.equal(result.ok, false);
  assert.equal(result.error.code, 'DOCUMENT_VALIDATION_FAILED');
  assert.equal(result.envelope.risk_status, 'critical');
  assert.equal(result.envelope.generation_audit.state, 'failed');
  assert.ok(result.envelope.warnings.some((item) => item.code === 'REQUIREMENT_COVERAGE_INSUFFICIENT'));
});

test('writer 异常在当前阶段转入 failed 审计', async () => {
  const result = await runDeterministicPipeline({
    rawRequirements: fixture.requirements,
    writer: { async write() { throw Object.assign(new Error('mock writer failed'), { code: 'WRITER_FAILED' }); } }
  });
  assert.equal(result.ok, false);
  assert.equal(result.envelope.generation_audit.state, 'failed');
  assert.deepEqual(
    result.envelope.generation_audit.events.map((event) => event.state),
    ['created', 'canonicalized', 'planned', 'claims_gated', 'failed']
  );
});

test('writer 无法修改 canonical Requirement 基线', async () => {
  const result = await runDeterministicPipeline({
    rawRequirements: [fixture.requirements[0]],
    writer: {
      async write({ requirements }) {
        requirements[0].req_id = 'REQ-TAMPERED';
        return [fixture.sections[0]];
      }
    }
  });
  assert.equal(result.ok, false);
  assert.equal(result.envelope.generation_audit.state, 'failed');
  assert.deepEqual(result.envelope.requirements.map((item) => item.req_id), ['REQ-001']);
});

test('正式正文拒绝展示内部 REQ-ID 或来源未定位字样', () => {
  const requirements = canonicalizeRequirements([fixture.requirements[0]]);
  const gate = createClaimGate(requirements);
  for (const text of ['响应 REQ-001 的接口要求。', '该项来源未定位，但可暂定响应。']) {
    const sections = [{ ...section(text), final_text: text, sanitization_events: [] }];
    const result = validateDocument({ baselineRequirements: requirements, requirements, sections, claimGate: gate });
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((item) => item.code === 'INTERNAL_REQUIREMENT_METADATA_EXPOSED'));
  }
});
