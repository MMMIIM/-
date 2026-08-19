import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, request } from './api.js';
import {
  RequirementParsing,
  RiskReview,
  CompanyMaterials,
  formatRequirementLevel,
  formatRequirementSource,
  formatTenderParsePhase,
  summarizeRequirementSources
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
  it('汇总已定位、建议匹配、未定位和已排除，不展开重复来源 warning', () => {
    expect(summarizeRequirementSources([
      { source_verified: true, candidate_decision: 'include' },
      { source_verified: false, source_resolution_status: 'suggested', candidate_decision: 'pending' },
      { source_verified: false, source_resolution_status: 'unresolved', candidate_decision: 'pending' },
      { source_verified: false, candidate_decision: 'exclude' }
    ])).toEqual({ total: 4, verified: 1, provisional: 2, suggested: 1, unresolved: 1, excluded: 1, pending: 2 });
  });
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

  it('provisional 展示三态数量、批量纳入、逐条确认和确认前风险摘要', () => {
    const html = render({ id: 'job-provisional', file_name: file.original_name, status: 'succeeded', warnings_json: [], candidates: [
      { id: 'c1', req_id: 'REQ-001', content: '一般暂定需求', source_excerpt: '原文', source_status: 'provisional', source_verified: false, candidate_decision: 'pending', is_mandatory: false },
      { id: 'c2', req_id: 'REQ-002', content: '强制暂定需求', source_excerpt: '★原文', source_text: '★原文', source_status: 'provisional', source_verified: false, candidate_decision: 'pending', is_mandatory: true, mandatory_marker: '★' }
    ] });
    expect(html).toContain('provisional');
    expect(html).toContain('2 条');
    expect(html).toContain('批量纳入 provisional');
    expect(html).toContain('逐条确认纳入');
    expect(html).toContain('mandatory 暂定需求禁止自动确认');
    expect(html).not.toContain('第 99 页');
  });
});

describe('风险复核暂定基线', () => {
  it('没有正文版本时仍展示 provisional 数量与清单', () => {
    const html = renderToStaticMarkup(<RiskReview version={null} baseline={{ requirements: [
      { req_id: 'REQ-001', content: '暂定接口需求', source_status: 'provisional', is_mandatory: false },
      { req_id: 'REQ-002', content: '已定位需求', source_status: 'verified', is_mandatory: false }
    ] }} onConfirmed={async () => {}} />);
    expect(html).toContain('provisional 需求 1 条');
    expect(html).toContain('暂定接口需求');
    expect(html).not.toContain('已定位需求');
  });
});

describe('企业材料与 Evidence 页面', () => {
  it('展示上传、材料分类、Evidence 创建和审批计数入口', () => {
    const html=renderToStaticMarkup(<CompanyMaterials projectId="project-1" baseline={{requirements:[{req_id:'REQ-001',content:'接口需求'}]}} />);
    expect(html).toContain('企业材料'); expect(html).toContain('company_profile'); expect(html).toContain('上传并解析');
    expect(html).toContain('Evidence Catalog'); expect(html).toContain('创建 draft Evidence'); expect(html).toContain('approved'); expect(html).toContain('rejected');
  });

  it('批准、拒绝与上传 API 使用固定路径和 method', async () => {
    const calls=[];
    vi.stubGlobal('fetch',vi.fn(async (url,options={})=>{calls.push({url,options}); return new Response(JSON.stringify({ok:true,data:{}}),{status:200,headers:{'Content-Type':'application/json'}});}));
    await api.uploadCompanyMaterial('p',new Blob(['x']),'case');
    await api.decideEvidence('e-1','approve','reviewer');
    await api.decideEvidence('e-1','reject','reviewer');
    expect(calls.map((item)=>[item.url,item.options.method])).toEqual([
      ['/api/projects/p/company-materials','POST'],['/api/evidences/e-1/approve','POST'],['/api/evidences/e-1/reject','POST']
    ]);
    expect(calls[0].options.body).toBeInstanceOf(FormData);
  });
});
