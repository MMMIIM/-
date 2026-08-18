import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { request } from './api.js';
import {
  RequirementParsing,
  formatRequirementLevel,
  formatRequirementSource,
  formatTenderParsePhase
} from './main.jsx';

const file = {
  id: 'file-1',
  original_name: '综合测试招标文件.docx'
};

function render(job, baseline = null) {
  return renderToStaticMarkup(<RequirementParsing
    projectId="project-1"
    files={[file]}
    parseJobs={job ? [job] : []}
    baseline={baseline}
    onChanged={async () => {}}
  />);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('前端 tender parse API 错误契约', () => {
  it('将旧后端 HTML 404 分类为明确 HTTP 错误，而不是非预期响应', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('<html>Not Found</html>', {
      status: 404,
      headers: { 'Content-Type': 'text/html' }
    })));
    await expect(request('/api/projects/project-1/tender-parse-jobs')).rejects.toMatchObject({
      code: 'HTTP_404',
      message: '后端接口不可用（HTTP 404），请确认前后端版本和 API 地址。'
    });
  });

  it('读取合法失败 JSON 的 error_code 与安全 error_message', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      ok: false,
      error: { code: 'GATEWAY_INVALID_JSON', message: '需求提取服务返回格式无效。' }
    }), {
      status: 422,
      headers: { 'Content-Type': 'application/json' }
    })));
    await expect(request('/api/tender-parse-jobs/job-1')).rejects.toMatchObject({
      code: 'GATEWAY_INVALID_JSON',
      message: '需求提取服务返回格式无效。'
    });
  });
});

describe('需求解析状态渲染', () => {
  it('展示文本提取、分片进度、汇总校验和失败分片', () => {
    expect(formatTenderParsePhase({ status: 'running', phase: 'text_extraction' })).toBe('文本提取');
    expect(formatTenderParsePhase({ status: 'running', phase: 'section_classification' })).toBe('文档章节分类');
    expect(formatTenderParsePhase({
      status: 'running', phase: 'extracting', completed_chunks: 2, total_chunks: 5
    })).toBe('分片进度 2/5');
    expect(formatTenderParsePhase({ status: 'running', phase: 'aggregating' })).toBe('汇总校验');
    expect(formatTenderParsePhase({
      status: 'failed', failed_chunk_number: 3, total_chunks: 5
    })).toBe('分片 3/5 失败');
    const html = render({
      id: 'job-progress', file_name: file.original_name, status: 'running',
      phase: 'extracting', completed_chunks: 2, total_chunks: 5, warnings_json: []
    });
    expect(html).toContain('分片进度 2/5');
  });

  it('failed 显示错误码和安全消息，允许重新解析但不显示确认按钮', () => {
    const html = render({
      id: 'job-1', file_name: file.original_name, status: 'failed',
      error_code: 'GATEWAY_INVALID_JSON', error_message: '需求提取服务返回格式无效。',
      warnings_json: [], candidates: []
    });
    expect(html).toContain('需求提取失败：GATEWAY_INVALID_JSON');
    expect(html).toContain('需求提取服务返回格式无效。');
    expect(html).toContain('重新解析');
    expect(html).not.toContain('确认需求基线');
    expect(html).not.toMatch(/API_KEY|raw_response|&lt;think&gt;/i);
  });

  it('succeeded 才展示候选需求与确认按钮', () => {
    const html = render({
      id: 'job-2', file_name: file.original_name, status: 'succeeded', warnings_json: [],
      candidates: [{
        req_id: 'REQ-001', content: '支持标准接口。', source_excerpt: '系统应支持标准接口。',
        source_text: '★系统应支持标准接口，详见第 3.2 条。',
        is_mandatory: true, mandatory_marker: '★',
        source_page: 1, source_paragraph: 2, status: 'candidate'
      }]
    });
    expect(html).toContain('REQ-001');
    expect(html).toContain('支持标准接口。');
    expect(html).toContain('要求等级');
    expect(html).toContain('★ 实质性要求');
    expect(html).toContain('确认需求基线');
  });

  it('一般要求显示确定性等级文本', () => {
    expect(formatRequirementLevel({ is_mandatory: false, mandatory_marker: null })).toBe('一般要求');
    expect(formatRequirementLevel({ is_mandatory: true, mandatory_marker: '★' })).toBe('★ 实质性要求');
    expect(formatRequirementLevel({
      is_mandatory: true, mandatory_scope_source_text: '以下除5.2.6外，其余均为实质性要求。'
    })).toBe('章节级实质性要求');
    expect(formatRequirementSource({
      source_section: '项目要求和有关说明', source_clause_id: '5.2.1', source_page: 16
    })).toBe('项目要求和有关说明 · 5.2.1 · 第 16 页');
  });

  it('章节级实质性要求显示来源依据与条款路径', () => {
    const scopeText = '以下除5.2.6外，其余均为实质性要求。';
    const html = render({
      id: 'job-scope', file_name: file.original_name, status: 'succeeded', warnings_json: [],
      candidates: [{
        req_id: 'REQ-013', content: '提供审计能力。', source_excerpt: '5.2.1 提供审计能力。',
        source_text: '5.2.1 提供审计能力。', source_section: '项目要求和有关说明',
        source_clause_id: '5.2.1', source_page: 16, source_paragraph: 434,
        is_mandatory: true, mandatory_marker: null,
        mandatory_scope_source_text: scopeText,
        mandatory_scope_section: '项目要求和有关说明', exception_clause_ids: ['5.2.6'],
        status: 'candidate'
      }]
    });
    expect(html).toContain('章节级实质性要求');
    expect(html).toContain(`依据：${scopeText}`);
    expect(html).toContain('项目要求和有关说明 · 5.2.1 · 第 16 页');
  });

  it('confirmed 显示冻结状态且不允许重新解析', () => {
    const html = render({
      id: 'job-3', file_name: file.original_name, status: 'succeeded', warnings_json: [], candidates: []
    }, {
      status: 'confirmed',
      requirements: [{
        req_id: 'REQ-001', content: '已确认需求。', source_excerpt: '来源片段。',
        source_page: null, source_paragraph: 1
      }]
    });
    expect(html).toContain('基线已确认');
    expect(html).toContain('需求基线已确认');
    expect(html).toContain('不可增删改或合并 REQ-ID');
    expect(html).toContain('基线已冻结');
    expect(html).not.toContain('重新解析');
  });
});
