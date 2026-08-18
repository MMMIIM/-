import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MANDATORY_MARKERS,
  assertMandatoryRequirementMetadata,
  detectMandatoryRequirement,
  enrichMandatoryRequirement
} from '../src/pipeline/mandatory-requirement.js';
import { canonicalizeRequirements } from '../src/pipeline/canonical-requirements.js';
import { createClaimGate } from '../src/pipeline/claim-gate.js';
import { validateDocument } from '../src/pipeline/document-validator.js';
import { RequirementParseService } from '../src/requirement-parse-service.js';

test('集中规则确定性识别 ★ 并完整保留原始条款和交叉引用', () => {
  assert.deepEqual(MANDATORY_MARKERS, ['★']);
  const sourceText = '★投标人必须满足本条要求，具体指标见第 3.2.1 条。';
  const requirement = enrichMandatoryRequirement({ req_id: 'REQ-013' }, { sourceText });
  assert.equal(requirement.source_text, sourceText);
  assert.equal(requirement.is_mandatory, true);
  assert.equal(requirement.mandatory_marker, '★');
  assert.deepEqual(detectMandatoryRequirement('一般要求。'), {
    is_mandatory: false, mandatory_marker: null
  });
});

test('mandatory 信息缺失或与 source_text 矛盾时拒绝', () => {
  assert.throws(
    () => assertMandatoryRequirementMetadata({
      source_text: '★实质性要求。', is_mandatory: false, mandatory_marker: null
    }),
    (error) => error.code === 'REQUIREMENT_MANDATORY_METADATA_CONFLICT'
  );
  assert.throws(
    () => assertMandatoryRequirementMetadata({ source_text: '一般要求。' }),
    (error) => error.code === 'REQUIREMENT_MANDATORY_METADATA_INVALID'
  );
});

test('canonical Requirement 与 Claim Gate 保留并消费 mandatory 元数据', () => {
  const requirements = canonicalizeRequirements([{
    req_id: 'REQ-013',
    text: '必须提供安全审计能力。',
    source_text: '★必须提供安全审计能力，详见附件 A。',
    is_mandatory: true,
    mandatory_marker: '★'
  }]);
  assert.equal(requirements[0].is_mandatory, true);
  assert.equal(requirements[0].mandatory_marker, '★');
  assert.match(requirements[0].source_text, /附件 A/);
  const gate = createClaimGate(requirements);
  assert.deepEqual(gate.mandatory_requirement_ids, ['REQ-013']);
});

test('coverage validation 对未覆盖实质性 Requirement 生成 critical 错误', () => {
  const requirements = canonicalizeRequirements([{
    req_id: 'REQ-013',
    text: '必须提供安全审计能力。',
    source_text: '★必须提供安全审计能力。',
    is_mandatory: true,
    mandatory_marker: '★'
  }]);
  const validation = validateDocument({
    baselineRequirements: structuredClone(requirements),
    requirements,
    sections: [{
      id: 'security-compliance', title: '安全与合规', requirement_ids: [],
      final_text: '本章说明安全设计。'
    }],
    claimGate: createClaimGate(requirements),
    phase: 'final'
  });
  assert.equal(validation.risk_status, 'critical');
  assert.ok(validation.errors.some((error) => (
    error.code === 'MANDATORY_REQUIREMENT_COVERAGE_INSUFFICIENT'
  )));
});

test('coverage validation 拒绝 canonical mandatory 元数据被后续阶段修改', () => {
  const baseline = canonicalizeRequirements([{
    req_id: 'REQ-013', text: '必须满足安全要求。', source_text: '★必须满足安全要求。',
    is_mandatory: true, mandatory_marker: '★'
  }]);
  const mutated = structuredClone(baseline);
  mutated[0].source_text = '一般要求。';
  mutated[0].is_mandatory = false;
  mutated[0].mandatory_marker = null;
  const validation = validateDocument({
    baselineRequirements: baseline,
    requirements: mutated,
    sections: [],
    claimGate: createClaimGate(baseline),
    phase: 'preflight'
  });
  assert.equal(validation.risk_status, 'critical');
  assert.ok(validation.errors.some((error) => (
    error.code === 'REQUIREMENT_MANDATORY_METADATA_MUTATED'
  )));
});

test('确认基线时 mandatory 信息缺失或矛盾会被阻止', async () => {
  const jobId = '11111111-1111-4111-8111-111111111111';
  let confirmed = false;
  const service = new RequirementParseService({
    repository: {
      getParseJob: async () => ({
        id: jobId,
        status: 'succeeded',
        candidates: [{
          req_id: 'REQ-013', content: '必须满足安全要求。', source_excerpt: '★必须满足安全要求。',
          source_text: '★必须满足安全要求。', is_mandatory: false, mandatory_marker: null,
          source_page: null, source_paragraph: 13, ordinal: 13
        }]
      }),
      confirmRequirementBaseline: async () => { confirmed = true; }
    }
  });
  await assert.rejects(
    () => service.confirm(jobId),
    (error) => error.code === 'REQUIREMENT_MANDATORY_METADATA_CONFLICT' && error.status === 422
  );
  assert.equal(confirmed, false);
});
