import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { EnterpriseLibrary, IndustryLibraryScopeTabs, INDUSTRY_LIBRARY_SCOPES, MATERIAL_LIBRARY_SCOPES } from './main.jsx';

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

  it('行业资料进一步按政企平台和医疗行业分组，仍保持业务语言', () => {
    const html = renderToStaticMarkup(<IndustryLibraryScopeTabs industryScope="government" setIndustryScope={() => {}} />);
    expect(INDUSTRY_LIBRARY_SCOPES.map((item) => item.label)).toEqual(['政企平台', '医疗行业']);
    expect(html).toContain('政企平台');
    expect(html).toContain('医疗行业');
    expect(html).not.toContain('Embedding');
  });

  it('默认进入企业资料范围，空状态不会暴露技术实现', () => {
    const html = renderToStaticMarkup(<EnterpriseLibrary onNavigate={() => {}} onOpen={() => {}} />);
    expect(html).toContain('企业资料');
    expect(html).toContain('按资料范围查找能帮助当前项目的证明材料');
    expect(html).not.toContain('RAG');
    expect(html).not.toContain('向量');
  });
});
