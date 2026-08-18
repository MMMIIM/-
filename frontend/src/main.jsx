import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { marked } from 'marked';
import { ArrowLeft, Clipboard, Download, FilePlus2, FolderPlus, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { api } from './api.js';
import './styles.css';

const tabs = ['概览', '招标文件', '企业材料', '标书', '风险复核', '版本记录'];
const projectTypes = ['智慧城市', '数据治理', '系统集成', '园区运营', '应急管理', 'AI 应用'];
const outputModes = ['技术标初稿', '售前方案', '响应矩阵', '风险清单'];
const statusLabels = { draft: '草稿', generating: '生成中', review: '待复核', confirmed: '已确认', queued: '排队中', running: '进行中', succeeded: '成功', failed: '失败' };
const riskLabels = { pass: '通过', warning: '警告', critical: '严重' };

function formatDate(value, fallback = '—') {
  return value ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : fallback;
}
function sanitizeFileName(name) { return (name || 'AI标书技术响应').replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, '-').slice(0, 60); }
function Badge({ type = 'neutral', children }) { return <span className={`badge ${type}`}>{children}</span>; }
function Notice({ kind, children }) { return <div className={`notice ${kind}`}>{children}</div>; }
function Empty({ title, text }) { return <div className="empty-state"><strong>{title}</strong><p>{text}</p></div>; }
function EmptyCard(props) { return <section className="card"><Empty {...props} /></section>; }
function Loading({ text, full }) { return <div className={`loading ${full ? 'full' : ''}`}><Loader2 className="spin" size={24} /><span>{text}</span></div>; }
function Stat({ label, value }) { return <div><span>{label}</span><strong>{value}</strong></div>; }

function PageShell({ title, subtitle, onBack, children }) {
  return <main className="app-shell"><header className="app-header"><div className="brand-row">{onBack ? <button className="icon-button" onClick={onBack}><ArrowLeft size={20} /></button> : null}<div><p className="eyebrow">政企投标辅助工作台</p><h1>{title}</h1>{subtitle ? <p className="subtitle">{subtitle}</p> : null}</div></div><Badge>Dify Workflow v4.2</Badge></header>{children}</main>;
}

function ProjectList({ onCreate, onOpen }) {
  const [state, setState] = useState({ loading: true, projects: [], error: '' });
  async function load() {
    setState((current) => ({ ...current, loading: true, error: '' }));
    try { const payload = await api.listProjects(); setState({ loading: false, projects: payload.projects || [], error: '' }); }
    catch (error) { setState({ loading: false, projects: [], error: error.message }); }
  }
  useEffect(() => { load(); }, []);
  return <PageShell title="项目归档" subtitle="集中管理项目、生成任务、风险复核和正式版本">
    <div className="page-actions"><button className="secondary-button" onClick={load}><RefreshCw size={16} />刷新</button><button className="primary-inline" onClick={onCreate}><FolderPlus size={17} />新建项目</button></div>
    {state.error ? <Notice kind="error">{state.error}</Notice> : null}
    <section className="card table-card">{state.loading ? <Loading text="正在加载项目" /> : state.projects.length ? <div className="table-scroll"><table className="data-table"><thead><tr><th>项目名称</th><th>状态</th><th>截止时间</th><th>当前版本</th><th>风险状态</th><th>更新时间</th></tr></thead><tbody>{state.projects.map((project) => <tr key={project.id} onClick={() => onOpen(project.id)}><td><button className="link-button">{project.name}</button></td><td><Badge type={project.status}>{statusLabels[project.status] || project.status}</Badge></td><td>{formatDate(project.deadline)}</td><td>{project.current_version ? `V${project.current_version}` : '—'}</td><td>{project.risk_status ? <Badge type={project.risk_status}>{riskLabels[project.risk_status]}</Badge> : '—'}</td><td>{formatDate(project.updated_at)}</td></tr>)}</tbody></table></div> : <Empty title="还没有项目" text="创建第一个项目并上传招标文件，开始建立可追溯的生成归档。" />}</section>
  </PageShell>;
}

function CreateProject({ onBack, onCreated }) {
  const [form, setForm] = useState({ name: '', deadline: '', file: null });
  const [state, setState] = useState({ loading: false, error: '' });
  async function submit(event) {
    event.preventDefault();
    if (!form.name.trim()) return setState({ loading: false, error: '请填写项目名称。' });
    setState({ loading: true, error: '' });
    try { const result = await api.createProject(form); onCreated(result.project.id); }
    catch (error) { setState({ loading: false, error: error.message }); }
  }
  return <PageShell title="新建项目" subtitle="建立项目归档并关联首份招标文件" onBack={onBack}><form className="card form-card" onSubmit={submit}><label className="field"><span>项目名称 *</span><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="例如：某市智慧城市综合治理平台" /></label><label className="field"><span>截止时间</span><input type="datetime-local" value={form.deadline} onChange={(event) => setForm({ ...form, deadline: event.target.value })} /></label><label className="field"><span>招标文件</span><input type="file" onChange={(event) => setForm({ ...form, file: event.target.files?.[0] || null })} /></label><p className="helper">文件保存在后端配置的存储目录，不进入 Git。单个文件最大 50 MB。</p>{state.error ? <Notice kind="error">{state.error}</Notice> : null}<button className="primary-button" disabled={state.loading}>{state.loading ? <Loader2 className="spin" size={18} /> : <FolderPlus size={18} />}{state.loading ? '创建中…' : '创建项目'}</button></form></PageShell>;
}

function Workspace({ projectId, onBack }) {
  const [activeTab, setActiveTab] = useState('概览');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  async function load() { setError(''); try { setData(await api.getProject(projectId)); } catch (requestError) { setError(requestError.message); } }
  useEffect(() => {
    let active = true;
    const refresh = async () => { if (active) await load(); };
    refresh();
    const timer = window.setInterval(refresh, 2500);
    return () => { active = false; window.clearInterval(timer); };
  }, [projectId]);
  if (!data && !error) return <Loading text="正在加载项目工作台" full />;
  if (!data) return <PageShell title="项目工作台" onBack={onBack}><Notice kind="error">{error}</Notice></PageShell>;
  const latestVersion = data.versions?.[0];
  return <PageShell title={data.project.name} subtitle={`项目工作台 · ${statusLabels[data.project.status] || data.project.status}`} onBack={onBack}><nav className="tabs">{tabs.map((tab) => <button className={activeTab === tab ? 'active' : ''} key={tab} onClick={() => setActiveTab(tab)}>{tab}</button>)}</nav>{error ? <Notice kind="error">{error}</Notice> : null}{activeTab === '概览' ? <Overview data={data} /> : null}{activeTab === '招标文件' ? <TenderFiles projectId={projectId} files={data.tenderFiles} onChanged={load} /> : null}{activeTab === '企业材料' ? <EmptyCard title="企业材料将在后续阶段接入" text="P0-1 仅保留业务入口，本阶段不接入企业 RAG、知识库检索或材料解析。" /> : null}{activeTab === '标书' ? <BidDocument project={data.project} version={latestVersion} onGenerated={load} /> : null}{activeTab === '风险复核' ? <RiskReview version={latestVersion} onConfirmed={load} /> : null}{activeTab === '版本记录' ? <Versions versions={data.versions} /> : null}</PageShell>;
}

function Overview({ data }) {
  const auditsByJob = new Map((data.generations || []).map((generation) => [generation.job_id, generation]));
  const tasks = [
    ...data.jobs.map((job) => ({ ...job, type: '标书生成', audit: auditsByJob.get(job.id) })),
    ...data.tenderFiles.map((file) => ({ id: `file-${file.id}`, type: `文件上传 · ${file.original_name}`, status: file.status, created_at: file.created_at }))
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return <div className="overview-grid"><section className="card stats"><Stat label="项目状态" value={statusLabels[data.project.status] || data.project.status} /><Stat label="招标文件" value={`${data.tenderFiles.length} 份`} /><Stat label="文档版本" value={`${data.versions.length} 个`} /><Stat label="风险状态" value={data.versions[0] ? riskLabels[data.versions[0].risk_status] : '待生成'} /></section><section className="card"><h2>任务中心</h2>{tasks.length ? <div className="task-list">{tasks.map((task) => <div key={task.id} className="task-item"><div><strong>{task.type}</strong><p>{formatDate(task.created_at)}</p>{task.audit ? <p className="audit-summary">审计已归档 · Workflow {task.audit.workflow_version} · {task.audit.runtime_ms} ms{task.audit.error_code ? ` · ${task.audit.error_code}` : ''}</p> : null}</div><Badge type={task.status}>{statusLabels[task.status] || task.status}</Badge>{task.error_message ? <span className="task-error">{task.error_message}</span> : null}</div>)}</div> : <Empty title="暂无任务" text="上传招标文件或在“标书”页发起生成。" />}</section></div>;
}

function TenderFiles({ projectId, files, onChanged }) {
  const [state, setState] = useState({ file: null, loading: false, error: '' });
  async function uploadFile() {
    if (!state.file) return setState({ ...state, error: '请选择文件。' });
    setState({ ...state, loading: true, error: '' });
    try { await api.uploadTenderFile(projectId, state.file); setState({ file: null, loading: false, error: '' }); await onChanged(); }
    catch (error) { setState({ ...state, loading: false, error: error.message }); }
  }
  return <section className="card"><div className="section-heading"><div><h2>招标文件</h2><p>文件内容保存在后端存储，不进入版本库。</p></div><div className="upload-actions"><input type="file" onChange={(event) => setState({ ...state, file: event.target.files?.[0] || null, error: '' })} /><button className="primary-inline" onClick={uploadFile} disabled={state.loading}><FilePlus2 size={16} />上传</button></div></div>{state.error ? <Notice kind="error">{state.error}</Notice> : null}{files.length ? <div className="file-list">{files.map((file) => <div key={file.id}><strong>{file.original_name}</strong><span>{Math.ceil(Number(file.size_bytes) / 1024)} KB · {formatDate(file.created_at)}</span><Badge type={file.status}>{statusLabels[file.status] || file.status}</Badge></div>)}</div> : <Empty title="暂无招标文件" text="上传文件后会关联到当前项目。" />}</section>;
}

function BidDocument({ project, version, onGenerated }) {
  const [form, setForm] = useState({ project_name: project.name, project_type: projectTypes[0], output_mode: outputModes[0], bid_need: '', focus_points: '' });
  const [state, setState] = useState({ loading: false, error: '', copy: '' });
  const html = useMemo(() => marked.parse(version?.content_markdown || '# 尚未生成正式正文\n\n填写生成参数后发起任务。', { breaks: true, gfm: true }), [version]);
  async function generate(event) {
    event.preventDefault();
    if (Object.values(form).some((value) => !String(value).trim())) return setState({ ...state, error: '请完整填写生成参数。' });
    setState({ loading: true, error: '', copy: '' });
    try { await api.generate(project.id, form); setState({ loading: false, error: '', copy: '' }); await onGenerated(); }
    catch (error) { setState({ loading: false, error: error.message, copy: '' }); await onGenerated(); }
  }
  async function copy() { if (version) { await navigator.clipboard.writeText(version.content_markdown); setState({ ...state, copy: '已复制' }); } }
  function download() { if (!version) return; const url = URL.createObjectURL(new Blob([version.content_markdown], { type: 'text/markdown;charset=utf-8' })); const link = document.createElement('a'); link.href = url; link.download = `${sanitizeFileName(project.name)}-V${version.version_number}.md`; link.click(); URL.revokeObjectURL(url); }
  return <div className="document-layout"><form className="card generation-form" onSubmit={generate}><h2>生成参数</h2><label className="field"><span>项目类型</span><select value={form.project_type} onChange={(e) => setForm({ ...form, project_type: e.target.value })}>{projectTypes.map((item) => <option key={item}>{item}</option>)}</select></label><label className="field"><span>输出类型</span><select value={form.output_mode} onChange={(e) => setForm({ ...form, output_mode: e.target.value })}>{outputModes.map((item) => <option key={item}>{item}</option>)}</select></label><label className="field"><span>招标需求</span><textarea rows="7" value={form.bid_need} onChange={(e) => setForm({ ...form, bid_need: e.target.value })} /></label><label className="field"><span>重点响应要求</span><textarea rows="5" value={form.focus_points} onChange={(e) => setForm({ ...form, focus_points: e.target.value })} /></label>{state.error ? <Notice kind="error">{state.error}</Notice> : null}<button className="primary-button" disabled={state.loading}>{state.loading ? <Loader2 className="spin" size={18} /> : <Sparkles size={18} />}{state.loading ? '生成中…' : '生成新版本'}</button></form><section className="card document-card"><div className="section-heading"><div><h2>{version?.title || '正式正文'}</h2><p>{version ? `V${version.version_number} · ${riskLabels[version.risk_status]}` : '等待生成'}</p></div><div className="compact-actions"><button onClick={copy} disabled={!version}><Clipboard size={16} />{state.copy || '复制'}</button><button onClick={download} disabled={!version}><Download size={16} />下载</button></div></div>{version?.sections_json?.length ? <aside className="toc"><strong>章节目录</strong>{version.sections_json.map((section) => <span key={section.id}>{section.title}</span>)}</aside> : null}{version?.warnings_json?.length ? <div className="warning-summary"><strong>警告摘要</strong>{version.warnings_json.map((warning, index) => <p key={index}>{warning.message}</p>)}</div> : null}<article className="markdown-preview" dangerouslySetInnerHTML={{ __html: html }} /></section></div>;
}

function RiskReview({ version, onConfirmed }) {
  const [confirmation, setConfirmation] = useState('');
  const [state, setState] = useState({ loading: false, message: '', error: '' });
  if (!version) return <EmptyCard title="暂无待复核版本" text="生成合法的标书正文后，风险门禁会显示在这里。" />;
  async function confirm() { setState({ loading: true, message: '', error: '' }); try { await api.confirmVersion(version.id, confirmation); setState({ loading: false, message: '版本已确认并设为项目当前版本。', error: '' }); await onConfirmed(); } catch (error) { setState({ loading: false, message: '', error: error.message }); } }
  const blocked = version.risk_status === 'critical' || version.status === 'confirmed';
  return <section className="card review-card"><div className="risk-hero"><Badge type={version.risk_status}>{riskLabels[version.risk_status]}</Badge><div><h2>V{version.version_number} 风险门禁</h2><p>{version.risk_status === 'pass' ? '当前版本可直接确认。' : version.risk_status === 'warning' ? '必须填写风险确认说明后才能确认。' : '存在严重风险，禁止确认此版本。'}</p></div></div>{version.warnings_json?.map((warning, index) => <Notice kind={warning.level === 'critical' ? 'error' : 'warning'} key={index}>{warning.message}</Notice>)}{version.risk_status === 'warning' ? <label className="field"><span>风险确认说明 *</span><textarea value={confirmation} onChange={(e) => setConfirmation(e.target.value)} placeholder="说明已知风险、接受原因与后续处置责任。" /></label> : null}{state.error ? <Notice kind="error">{state.error}</Notice> : null}{state.message ? <Notice kind="success">{state.message}</Notice> : null}<button className="primary-inline" disabled={blocked || state.loading || (version.risk_status === 'warning' && !confirmation.trim())} onClick={confirm}>{version.status === 'confirmed' ? '已确认' : version.risk_status === 'critical' ? '严重风险禁止确认' : '确认此版本'}</button></section>;
}

function Versions({ versions }) {
  return <section className="card"><h2>版本记录</h2>{versions.length ? <div className="version-list">{versions.map((version) => <div key={version.id}><div><strong>V{version.version_number} · {version.title}</strong><p>{formatDate(version.created_at)}{version.confirmed_at ? ` · 确认于 ${formatDate(version.confirmed_at)}` : ''}</p></div><Badge type={version.risk_status}>{riskLabels[version.risk_status]}</Badge><Badge type={version.status}>{version.status === 'confirmed' ? '已确认' : '待确认'}</Badge></div>)}</div> : <Empty title="暂无版本" text="合法的 Dify 契约输出会形成可追溯版本。" />}</section>;
}

function App() {
  const [route, setRoute] = useState({ page: 'list', projectId: null });
  if (route.page === 'create') return <CreateProject onBack={() => setRoute({ page: 'list' })} onCreated={(projectId) => setRoute({ page: 'workspace', projectId })} />;
  if (route.page === 'workspace') return <Workspace projectId={route.projectId} onBack={() => setRoute({ page: 'list' })} />;
  return <ProjectList onCreate={() => setRoute({ page: 'create' })} onOpen={(projectId) => setRoute({ page: 'workspace', projectId })} />;
}

createRoot(document.getElementById('root')).render(<App />);
