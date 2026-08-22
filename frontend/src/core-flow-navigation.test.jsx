import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ProjectNavigation, ProfessionalWorkspaceNav } from './main.jsx';

describe('六阶段项目流程导航', () => {
  it('按业务阶段显示当前动作并保留专业工作区入口', () => {
    const html = renderToStaticMarkup(<><ProjectNavigation activeTab="审核中心" setActiveTab={() => {}} data={{ tenderFiles: [{ id: 'file-1' }], requirementBaseline: null, versions: [] }} /><ProfessionalWorkspaceNav activeTab="审核中心" setActiveTab={() => {}} /></>);
    expect(html).toContain('项目信息');
    expect(html).toContain('审核与补充');
    expect(html).toContain('当前');
    expect(html).toContain('专业工作区');
    expect(html).toContain('需求解析');
  });
});
