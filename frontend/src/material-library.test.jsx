import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { EnterpriseLibrary, MATERIAL_LIBRARY_SCOPES } from './main.jsx';

describe('企业资料库业务范围信息架构', () => {
  it('显示通用、行业、企业三种资料范围，并用业务语言解释用途', () => {
    const html = renderToStaticMarkup(<EnterpriseLibrary onNavigate={() => {}} onOpen={() => {}} />);
    for (const scope of MATERIAL_LIBRARY_SCOPES) expect(html).toContain(scope.label);
    expect(html).toContain('范围只控制材料可见性');
    expect(html).toContain('实际使用前仍需完成证明确认');
    expect(html).not.toContain('Embedding');
    expect(html).not.toContain('Vector');
    expect(html).not.toContain('Top-K');
  });

  it('默认进入企业资料范围，空状态不会暴露技术实现', () => {
    const html = renderToStaticMarkup(<EnterpriseLibrary onNavigate={() => {}} onOpen={() => {}} />);
    expect(html).toContain('企业资料');
    expect(html).toContain('按资料范围查找能帮助当前项目的证明材料');
    expect(html).not.toContain('RAG');
    expect(html).not.toContain('向量');
  });
});
