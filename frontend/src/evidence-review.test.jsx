import React from 'react';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from './api.js';
import { EvidenceReview, SUPPORT_LEVELS } from './evidence-review.jsx';
import { MATERIAL_TYPES, formatMaterialType } from './material-types.js';

const requirement = {
  req_id: 'REQ-030',
  content: '系统应支持第三方业务平台数据交换。'
};

function review(overrides = {}) {
  return {
    requirement: {
      req_id: 'REQ-030', text: requirement.content, category: 'integration_special',
      is_mandatory: true, requires_confirmation: false
    },
    retrieval_run: { retrieval_run_id: '11111111-1111-4111-8111-111111111111' },
    results: [{
      chunk_id: 'chunk-1', rank: 1, similarity_score: 0.876,
      material_name: '公开产品资料', material_type: 'product_documentation',
      source_text_preview: '产品支持标准接口协议和数据交换能力。',
      source_location: { page_start: 2, paragraph_start: 3 },
      ...overrides
    }]
  };
}

function render(result = review()) {
  return renderToStaticMarkup(<EvidenceReview projectId="project-1" requirements={[requirement]} initialReview={result} />);
}

afterEach(() => vi.unstubAllGlobals());

describe('Evidence Review UI v1', () => {
  it('展示招标要求、企业材料来源，并明确相关度不是支撑结论', () => {
    const html = render();
    expect(html).toContain('REQ-030');
    expect(html).toContain(requirement.content);
    expect(html).toContain('integration_special');
    expect(html).toContain('实质性要求');
    expect(html).toContain('找到的企业材料');
    expect(html).toContain('相关程度 87.6%');
    expect(html).toContain('不代表已经证明需求、可以直接承诺或可以跳过人工确认');
    expect(html).toContain('产品文档');
    expect(html).toContain('产品支持标准接口协议和数据交换能力。');
    expect(html).toContain('第 2 页 · 第 3 段');
    expect(html).toContain('保存为待确认证明');
  });

  it('显示 Evidence 审批、有效性及 Mapping 人工审核动作', () => {
    const candidate = render(review({
      evidence_id: 'evidence-internal-id', approval_status: 'approved', validity_status: 'active',
      evidence_scope: ['接口能力'], capability_tags: ['开放接口']
    }));
    expect(candidate).toContain('确认可作为企业证明');
    expect(candidate).toContain('确认不能作为证明');
    expect(candidate).toContain('保存有效性');
    expect(candidate).toContain('完整支撑');
    expect(candidate).toContain('部分支撑');
    expect(candidate).toContain('仅供参考');
    expect(candidate).toContain('保存匹配建议');
    expect(candidate).not.toContain('evidence-internal-id');

    const mapped = render(review({
      evidence_id: 'evidence-internal-id', approval_status: 'approved', validity_status: 'active',
      mapping_id: 'mapping-internal-id', mapping_status: 'proposed',
      support_level: 'reference_only', review_notes: '仅证明相关能力，不能证明完整履约。'
    }));
    expect(mapped).toContain('reference_only');
    expect(mapped).toContain('确认匹配');
    expect(mapped).toContain('确认不匹配');
    expect(mapped).toContain('仅证明相关能力，不能证明完整履约。');
    expect(mapped).not.toContain('mapping-internal-id');
  });

  it('对 historical_bid 给出双重警示且不把 rejected 当作 support level', () => {
    const html = render(review({ material_type: 'historical_bid' }));
    expect((html.match(/历史标书，仅供参考/g) || [])).toHaveLength(2);
    expect(SUPPORT_LEVELS.map((item) => item.value)).toEqual([
      'full_support', 'partial_support', 'reference_only'
    ]);
    expect(html).not.toContain('<option value="rejected"');
  });

  it('同一套 Candidate 与 support level UI 支持通用和医疗器械风格 Requirement', () => {
    expect(render()).toContain('保存为待确认证明');
    const medical = '投标产品须具有有效医疗器械注册证。';
    const html = renderToStaticMarkup(<EvidenceReview
      projectId="project-1"
      requirements={[{ req_id: 'REQ-009', content: medical }]}
      initialReview={{ ...review(), requirement: { req_id: 'REQ-009', text: medical, category: 'medical_device', is_mandatory: false, requires_confirmation: true }, results: [{ ...review().results[0], evidence_id: 'evidence-internal-id', approval_status: 'approved', validity_status: 'active' }] }}
    />);
    expect(html).toContain(medical);
    expect(html).toContain('medical_device');
    expect(html).toContain('需确认');
    expect(html).toContain('完整支撑');
    expect(html).toContain('部分支撑');
    expect(html).toContain('仅供参考');
  });

  it('集中维护 12 类材料并对未知类型原样回退', () => {
    expect(MATERIAL_TYPES).toHaveLength(12);
    expect(new Set(MATERIAL_TYPES).size).toBe(12);
    expect(formatMaterialType('project_case')).toBe('项目案例');
    expect(formatMaterialType('future_material')).toBe('future_material');
    expect(render(review({ material_type: 'future_material' }))).toContain('future_material');
  });

  it('组件源代码不包含本阶段禁止新增的行业硬编码', () => {
    const source = readFileSync(new URL('./evidence-review.jsx', import.meta.url), 'utf8');
    expect(source).not.toMatch(/智慧城市|城市治理|数据治理|国产化|第三方系统/);
  });
});

describe('Evidence Review API client', () => {
  it('按冻结路径和 HTTP method 调用全部 Review API', async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify({ ok: true, data: {} }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    }));
    vi.stubGlobal('fetch', fetch);
    await api.getRequirementEvidenceReview('project-1', 'REQ/1');
    await api.createEvidenceCandidateFromRetrieval('project-1', 'REQ/1', { chunk_id: 'chunk-1' });
    await api.decideEvidence('evidence-1', 'approve');
    await api.decideEvidence('evidence-1', 'reject');
    await api.reviewEvidenceValidity('evidence-1', 'active');
    await api.proposeEvidenceMapping('project-1', { evidence_id: 'evidence-1' });
    await api.listEvidenceMappings('project-1', 'REQ/1');
    await api.decideEvidenceMapping('mapping-1', 'approve');
    expect(fetch.mock.calls.map(([url, options = {}]) => [url, options.method || 'GET'])).toEqual([
      ['/api/projects/project-1/requirements/REQ%2F1/evidence-review', 'GET'],
      ['/api/projects/project-1/requirements/REQ%2F1/evidence-candidates/from-retrieval', 'POST'],
      ['/api/evidences/evidence-1/approve', 'POST'],
      ['/api/evidences/evidence-1/reject', 'POST'],
      ['/api/evidences/evidence-1/validity', 'PATCH'],
      ['/api/projects/project-1/evidence-mappings', 'POST'],
      ['/api/projects/project-1/requirements/REQ%2F1/evidence-mappings', 'GET'],
      ['/api/evidence-mappings/mapping-1/approve', 'POST']
    ]);
  });
});
