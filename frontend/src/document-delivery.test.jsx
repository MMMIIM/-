import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { RiskReview } from './main.jsx';

describe('Word 交付入口', () => {
  it('在通过检查的版本上显示业务化导出动作，不暴露渲染器术语', () => {
    const html = renderToStaticMarkup(<RiskReview projectId="p1" version={{ id: 'v1', project_id: 'p1', version_number: 1, risk_status: 'pass', status: 'confirmed', warnings_json: [] }} baseline={{ requirements: [] }} onConfirmed={vi.fn()} />);
    expect(html).toContain('导出 Word');
    expect(html).toContain('当前版本可直接确认');
    expect(html).not.toContain('OOXML');
    expect(html).not.toContain('renderer');
  });
  it('严重风险版本禁用导出并说明影响', () => {
    const html = renderToStaticMarkup(<RiskReview projectId="p1" version={{ id: 'v1', project_id: 'p1', version_number: 1, risk_status: 'critical', status: 'pending_review', warnings_json: [] }} baseline={{ requirements: [] }} />);
    expect(html).toContain('严重风险禁止确认');
    expect(html).toContain('处理完成前不能导出交付文件');
  });
});
