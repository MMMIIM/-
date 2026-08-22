import React, { useState } from 'react';
import { api } from './api.js';

const STATUS_LABELS = { SUCCESS: '已完成', NO_RESULT: '暂无结果', BLOCKED: '已拦截', REQUIRES_HUMAN_DECISION: '需要人工确认', ERROR: '暂时无法完成' };
const ACTION_RESULT_LABELS = { EXECUTED: '已完成', PREVIEW_READY: '待你确认', HUMAN_REQUIRED: '需要你确认', BLOCKED: '暂不可执行', STALE: '预览已过期', FAILED: '执行失败', NO_CHANGE: '已处理过' };

function PreviewCard({ projectId, context, item, onNavigate, onApplied }) {
  const [state, setState] = useState({ loading: false, result: null, error: '' });
  const preview = item.preview || {};
  const original = preview.original_text || preview.original || '';
  const proposed = preview.proposed_text || preview.proposed || '';
  async function apply() {
    if (!item.preview_id) return;
    setState({ loading: true, result: null, error: '' });
    try {
      const result = await api.executeCopilotAction(projectId, 'applyApprovedChapterRevision', { preview_id: item.preview_id, version_id: item.target?.version_id, chapter_id: item.target?.chapter_id }, context, true);
      setState({ loading: false, result, error: '' });
      onApplied?.(result);
    } catch (error) { setState({ loading: false, result: null, error: error.message }); }
  }
  return <article className="copilot-preview" aria-label="修订预览">
    <div className="copilot-preview-heading"><strong>章节修订预览</strong><span>{state.result ? (ACTION_RESULT_LABELS[state.result.result] || state.result.result) : '尚未应用'}</span></div>
    <p>系统只准备了差异，当前正式版本还没有改变。请先查看，再决定是否应用。</p>
    <div className="copilot-diff"><div><small>原文</small><pre>{original || '（无内容）'}</pre></div><div><small>建议修改</small><pre>{proposed || '（无内容）'}</pre></div></div>
    {item.validation_result ? <details><summary>查看检查结果</summary><pre>{JSON.stringify(item.validation_result, null, 2)}</pre></details> : null}
    {state.error ? <p className="copilot-error">{state.error}</p> : null}
    {state.result?.result === 'STALE' ? <p className="copilot-error">当前正文已经变化，这份预览不能继续使用，请重新生成预览。</p> : null}
    <div className="compact-actions"><button type="button" className="primary-inline" disabled={state.loading || Boolean(state.result?.result === 'EXECUTED')} onClick={apply}>{state.loading ? '正在应用…' : '接受并应用修改'}</button>{item.target?.chapter_id ? <button type="button" onClick={() => onNavigate?.({ route: 'generation', chapter_id: item.target.chapter_id, document_version_id: item.target.version_id })}>查看章节</button> : null}</div>
  </article>;
}

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
      {response.actions?.length ? <div className="copilot-actions">{response.actions.map((item, index) => item.type === 'preview' ? <PreviewCard key={`${item.preview_id || index}`} projectId={projectId} context={context} item={item} onNavigate={onNavigate} onApplied={(result) => setState((current) => ({ ...current, response: { ...current.response, summary: result.result === 'EXECUTED' ? '章节修订已应用，并已生成新的版本供你继续复核。' : current.response.summary, actions: result.result === 'EXECUTED' ? current.response.actions.filter((action) => action.preview_id !== item.preview_id) : current.response.actions } }))} /> : <button type="button" key={index} onClick={() => onNavigate?.(item)}>{item.label || '打开相关工作区'}</button>)}</div> : null}
    </div> : null}
  </aside>;
}
