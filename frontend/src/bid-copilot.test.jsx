import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { BidCopilot } from './bid-copilot.jsx';
import { api } from './api.js';

afterEach(() => vi.restoreAllMocks());

describe('Bid Copilot contextual panel', () => {
  it('uses plain business language and distinguishes candidate evidence', () => {
    const html = renderToStaticMarkup(<BidCopilot projectId="P" context={{ current_route: '材料准备度' }} initialResponse={{ status: 'SUCCESS', summary: '找到了可供确认的材料候选；它们还不是正式证明。', tasks: [{ title: '企业材料', reason: '与当前需求存在检索关联。', impact: '仍需人工确认后才能作为正式依据。', candidate_only: true }], blockers: [], actions: [] }} />);
    expect(html).toContain('项目助手'); expect(html).toContain('材料候选，尚未确认'); expect(html).toContain('它们还不是正式证明'); expect(html).not.toContain('Claim Gate');
  });

  it('calls the project-scoped Copilot endpoint', async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify({ ok: true, data: { status: 'SUCCESS' } }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetch);
    await api.askCopilot('P', '下一步先做什么？', { current_route: '概览' });
    expect(fetch).toHaveBeenCalledWith('/api/projects/P/copilot', expect.objectContaining({ method: 'POST' }));
  });

  it('shows a chapter preview and keeps formal application behind an explicit action', () => {
    const html = renderToStaticMarkup(<BidCopilot projectId="P" context={{ current_route: '标书', document_version_id: 'v1', chapter_id: 'implementation' }} initialResponse={{ status: 'SUCCESS', summary: '已准备章节修订预览。', tasks: [], blockers: [], actions: [{ type: 'preview', label: '查看预览差异', tool: 'prepareChapterRevision', preview_id: 'preview-1', target: { version_id: 'v1', chapter_id: 'implementation' }, preview: { original_text: '原文', proposed_text: '建议修改' }, validation_result: { validation_status: 'pass' } }] }} />);
    expect(html).toContain('章节修订预览');
    expect(html).toContain('接受并应用修改');
    expect(html).toContain('建议修改');
    expect(html).toContain('正式版本还没有改变');
  });

  it('calls the explicit action endpoint with human approval only when requested', async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify({ ok: true, data: { result: 'EXECUTED' } }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetch);
    await api.executeCopilotAction('P', 'applyApprovedChapterRevision', { preview_id: 'preview-1' }, { chapter_id: 'implementation' }, true);
    expect(fetch).toHaveBeenCalledWith('/api/projects/P/copilot/actions/execute', expect.objectContaining({ method: 'POST' }));
    expect(JSON.parse(fetch.mock.calls[0][1].body).human_approved).toBe(true);
  });
});
