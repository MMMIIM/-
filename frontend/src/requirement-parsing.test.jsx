import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { request } from './api.js';
import { RequirementParsing } from './main.jsx';

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
        source_page: 1, source_paragraph: 2, status: 'candidate'
      }]
    });
    expect(html).toContain('REQ-001');
    expect(html).toContain('支持标准接口。');
    expect(html).toContain('确认需求基线');
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
