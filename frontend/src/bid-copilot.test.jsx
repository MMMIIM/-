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
});
