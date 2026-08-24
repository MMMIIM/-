import test from 'node:test';
import assert from 'node:assert/strict';
import { RequirementParseService } from '../src/requirement-parse-service.js';
import { clearUnverifiedLocation, deriveCandidateSourceStatus } from '../src/pipeline/requirement-source-status.js';

const JOB_ID = '00000000-0000-0000-0000-000000000001';

function candidate(overrides = {}) {
  return {
    id: 'candidate-1', req_id: 'REQ-001', content: '提供审计能力。', source_excerpt: '提供审计能力。',
    source_text: '提供审计能力。', is_mandatory: false, mandatory_marker: null,
    mandatory_scope_source_text: null, mandatory_scope_section: null, exception_clause_ids: [],
    candidate_decision: 'include', source_status: 'provisional', source_verified: false,
    confirmed_by: 'reviewer', confirmed_at: '2026-08-19T00:00:00.000Z',
    confirmation_type: 'provisional_individual', ordinal: 1,
    source_page: 99, source_paragraph: 99, source_page_start: 99, source_page_end: 99,
    source_paragraph_start: 99, source_paragraph_end: 99, source_hash: 'invented',
    ...overrides
  };
}

test('provisional 来源位置在进入暂定基线前被强制清空', () => {
  const normalized = clearUnverifiedLocation(candidate());
  assert.equal(deriveCandidateSourceStatus(normalized), 'provisional');
  assert.equal(normalized.source_page, null);
  assert.equal(normalized.source_paragraph, null);
  assert.equal(normalized.source_hash, null);
  assert.deepEqual(normalized.source_paragraphs_json, []);
});

test('普通 provisional 经明确确认后可进入暂定基线并保存确认元数据', async () => {
  let persisted;
  const service = new RequirementParseService({ repository: {
    getParseJob: async () => ({ id: JOB_ID, status: 'succeeded', candidates: [candidate()] }),
    confirmRequirementBaseline: async (input) => { persisted = input; return { baseline: { status: 'confirmed' }, requirements: input.requirements }; }
  } });
  await service.confirm(JOB_ID, { confirmed_by: 'baseline-owner' });
  assert.equal(persisted.confirmedBy, 'baseline-owner');
  assert.equal(persisted.requirements[0].source_status, 'provisional');
  assert.equal(persisted.requirements[0].source_page, null);
  assert.equal(persisted.requirements[0].confirmation_type, 'provisional_individual');
});

test('mandatory provisional 禁止批量确认，必须逐条人工确认', async () => {
  const mandatory = candidate({ is_mandatory: true, mandatory_marker: '★', source_text: '★提供审计能力。', confirmation_type: 'provisional_bulk' });
  const service = new RequirementParseService({ repository: {
    getParseJob: async () => ({ id: JOB_ID, status: 'succeeded', candidates: [mandatory] }),
    confirmRequirementBaseline: async () => { throw new Error('不应持久化'); }
  } });
  await assert.rejects(() => service.confirm(JOB_ID, { confirmed_by: 'baseline-owner' }), (error) => error.code === 'MANDATORY_PROVISIONAL_CONFIRMATION_REQUIRED');
});
