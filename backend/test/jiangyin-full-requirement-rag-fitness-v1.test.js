import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyHandlingType, lexicalScore, extractionAudit, currentHandling } from '../eval/jiangyin-full-requirement-rag-fitness-v1/runner.js';

test('full Jiangyin audit handling classification remains deterministic and source-bound', () => {
  assert.equal(classifyHandlingType({ content: '投标人应提供有效的检测报告', source_text: '★投标人应提供有效的检测报告' }, { source_verified: true }), 'EXTERNAL_PROOF_DRIVEN');
  assert.equal(classifyHandlingType({ content: '系统总体架构和部署方案', source_text: '系统总体架构和部署方案' }, { source_verified: true }), 'SOLUTION_DRIVEN');
  assert.equal(classifyHandlingType({ content: '投标文件应加盖公章并密封', source_text: '投标文件应加盖公章并密封' }, { source_verified: true }), 'DETERMINISTIC_COMPLIANCE');
  assert.equal(classifyHandlingType({ content: '应承诺提供质保服务', source_text: '应承诺提供质保服务' }, { source_verified: true }), 'HUMAN_COMMITMENT_DRIVEN');
  assert.equal(classifyHandlingType({ content: '系统响应时间不超过2秒', source_text: '系统响应时间不超过2秒' }, { source_verified: false }), 'SOURCE_AMBIGUOUS');
});

test('lexical corpus inspection is bounded and does not claim semantic adjudication', () => {
  assert.ok(lexicalScore('接口响应时间和并发用户数', '系统支持接口响应时间，支持并发用户数。') > 0.4);
  assert.equal(lexicalScore('完全不同的主题', '无关内容'), 0);
});

test('extraction audit reports source verification but leaves gold recall/precision unknown', () => {
  const requirements = [
    { content: '系统支持接口', source_text: '系统支持接口', source_page: 1, source_paragraph: 1, source_hash: 'a', is_mandatory: false },
    { content: '系统支持接口', source_text: '系统支持接口', source_page: 1, source_paragraph: 1, source_hash: 'a', is_mandatory: false },
    { content: '未找到', source_text: '未找到', source_page: 3, source_paragraph: 3, source_hash: 'b', is_mandatory: false }
  ];
  const paragraphs = [
    { paragraph: 1, page: 1, text: '系统支持接口', source_start_offset: 0, source_end_offset: 6 },
    { paragraph: 2, page: 1, text: '其他内容', source_start_offset: 7, source_end_offset: 11 }
  ];
  const result = extractionAudit(requirements, paragraphs);
  assert.equal(result.recall, null);
  assert.equal(result.precision, null);
  assert.equal(result.source_verified_count, 2);
  assert.equal(result.counts.DUPLICATE, 2);
  assert.equal(result.counts.WRONG_SOURCE, 1);
});

test('current handling rate counts only safe deterministic or supported actions', () => {
  const result = currentHandling([
    { primary_root_cause: 'RULE_RESOLVABLE', handling_type: 'DETERMINISTIC_COMPLIANCE' },
    { primary_root_cause: 'RAG_STRONG_SUPPORT', handling_type: 'EVIDENCE_DRIVEN' },
    { primary_root_cause: 'RAG_CONTENT_GAP', handling_type: 'EVIDENCE_DRIVEN' },
    { primary_root_cause: 'HUMAN_CONFIRMATION_REQUIRED', handling_type: 'HUMAN_COMMITMENT_DRIVEN' }
  ]);
  assert.equal(result.current_system_handling_rate, 0.5);
  assert.equal(result.needs_rag_material, 1);
  assert.equal(result.needs_human_confirmation, 1);
});
