import React, { useState } from 'react';
import { api } from './api.js';

const STATUS_LABELS = { SUCCESS: '已完成', NO_RESULT: '暂无结果', BLOCKED: '已拦截', REQUIRES_HUMAN_DECISION: '需要人工确认', ERROR: '暂时无法完成' };

export function BidCopilot({ projectId, context = {}, onNavigate, initialResponse = null }) {
  const [message, setMessage] = useState('');
  const [state, setState] = useState({ loading: false, response: initialResponse, error: '' });
  async function ask(event) {
    event.preventDefault();
    if (!message.trim()) return;
    setState({ loading: true, response: null, error: '' });
    try { const response = await api.askCopilot(projectId, message, context); setState({ loading: false, response, error: '' }); }
    catch (error) { setState({ loading: false, response: null, error: error.message }); }
  }
  const response = state.response;
  return <aside className="copilot-panel" aria-label="项目助手">
    <div className="section-heading"><div><h2>项目助手</h2><p>基于当前项目状态，帮你找出待处理事项和可用材料。</p></div><span className="copilot-badge">辅助</span></div>
    <form className="copilot-form" onSubmit={ask}><textarea aria-label="向项目助手提问" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="例如：这个项目现在还缺什么，下一步先做什么？" /><button className="primary-inline" disabled={state.loading || !message.trim()}>{state.loading ? '正在整理…' : '询问'}</button></form>
    {state.error ? <p className="copilot-error">{state.error}</p> : null}
    {response ? <div className="copilot-result"><div className="copilot-status"><strong>{response.summary || STATUS_LABELS[response.status] || '处理结果'}</strong><span>{STATUS_LABELS[response.status] || response.status}</span></div>
      {response.blockers?.length ? <div className="copilot-blockers"><h3>需要优先处理</h3>{response.blockers.map((item, index) => <article key={`${item.title}-${index}`}><strong>{item.title}</strong><p>{item.reason}</p><small>{item.impact}</small>{item.navigation ? <button type="button" onClick={() => onNavigate?.(item.navigation)}>去处理</button> : null}</article>)}</div> : null}
      {response.tasks?.length ? <div className="copilot-tasks"><h3>建议下一步</h3>{response.tasks.map((item, index) => <article key={`${item.title}-${index}`}><strong>{item.title}</strong><p>{item.reason}</p><small>{item.impact}</small>{item.navigation ? <button type="button" onClick={() => onNavigate?.(item.navigation)}>{item.action || '查看'}</button> : null}{item.candidate_only ? <em>材料候选，尚未确认</em> : null}</article>)}</div> : null}
      {response.actions?.length ? <div className="copilot-actions">{response.actions.map((item, index) => <button type="button" key={index} onClick={() => onNavigate?.(item)}>{item.label || '打开相关工作区'}</button>)}</div> : null}
    </div> : null}
  </aside>;
}
