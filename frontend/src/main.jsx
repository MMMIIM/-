import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { marked } from 'marked';
import { ArrowLeft, CheckCircle2, Clipboard, Download, FilePlus2, FileSearch, FolderPlus, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { api } from './api.js';
import './styles.css';

const tabs = ['概览', '招标文件', '需求解析', '响应规划', '企业材料', '标书', '风险复核', '版本记录'];
const projectTypes = ['智慧城市', '数据治理', '系统集成', '园区运营', '应急管理', 'AI 应用'];
const outputModes = ['技术标初稿', '售前方案', '响应矩阵', '风险清单'];
const statusLabels = { draft: '草稿', generating: '生成中', review: '待复核', requirements_review: '需求待确认', requirements_confirmed: '需求已确认', confirmed: '已确认', candidate: '候选', queued: '排队中', running: '进行中', succeeded: '成功', failed: '失败' };
const riskLabels = { pass: '通过', warning: '警告', critical: '严重' };
const requirementCategories = ['technical','performance','implementation','delivery','service','contractual','commercial','qualification','context'];
const materialTypes = ['company_profile','qualification','case','product','personnel','technical_solution','delivery_capability','other'];

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
  return <main className="app-shell"><header className="app-header"><div className="brand-row">{onBack ? <button className="icon-button" onClick={onBack}><ArrowLeft size={20} /></button> : null}<div><p className="eyebrow">政企投标辅助工作台</p><h1>{title}</h1>{subtitle ? <p className="subtitle">{subtitle}</p> : null}</div></div><Badge>4.3 后端确定性流程</Badge></header>{children}</main>;
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
  return <PageShell title={data.project.name} subtitle={`项目工作台 · ${statusLabels[data.project.status] || data.project.status}`} onBack={onBack}><nav className="tabs">{tabs.map((tab) => <button className={activeTab === tab ? 'active' : ''} key={tab} onClick={() => setActiveTab(tab)}>{tab}</button>)}</nav>{error ? <Notice kind="error">{error}</Notice> : null}{activeTab === '概览' ? <Overview data={data} /> : null}{activeTab === '招标文件' ? <TenderFiles projectId={projectId} files={data.tenderFiles} onChanged={load} /> : null}{activeTab === '需求解析' ? <RequirementParsing projectId={projectId} files={data.tenderFiles} parseJobs={data.parseJobs || []} baseline={data.requirementBaseline} onChanged={load} /> : null}{activeTab === '响应规划' ? <ProductionBeta projectId={projectId} /> : null}{activeTab === '企业材料' ? <CompanyMaterials projectId={projectId} baseline={data.requirementBaseline} /> : null}{activeTab === '标书' ? <BidDocument project={data.project} version={latestVersion} onGenerated={load} /> : null}{activeTab === '风险复核' ? <RiskReview version={latestVersion} baseline={data.requirementBaseline} onConfirmed={load} /> : null}{activeTab === '版本记录' ? <Versions versions={data.versions} /> : null}</PageShell>;
}

function ProductionBeta({ projectId }) {
  const [state, setState] = useState({ loading: true, data: null, error: null });
  useEffect(() => {
    let active = true;
    api.getProductionBeta(projectId)
      .then((data) => { if (active) setState({ loading: false, data, error: null }); })
      .catch((error) => { if (active) setState({ loading: false, data: null, error }); });
    return () => { active = false; };
  }, [projectId]);
  if (state.loading) return <EmptyCard title="正在读取响应规划" text="加载处理状态、Claim 与覆盖矩阵。" />;
  if (state.error) return <Notice kind="error">{state.error.code} · {state.error.message}</Notice>;
  const data = state.data || {};
  const approved = (data.claims || []).filter((item) => item.decision === 'approved');
  const rejected = (data.claims || []).filter((item) => item.decision === 'rejected');
  return <section className="card">
    <div className="section-heading"><div><h2>Response Plan 与 Claim 门禁</h2><p>后端控制范围、依据、风险决策和覆盖；本阶段不生成正文。</p></div><Badge type={data.run?.status}>{data.run?.status || '尚未处理'}</Badge></div>
    {data.run?.status === 'failed' ? <Notice kind="error">{data.run.error_code} · {data.run.error_message}</Notice> : null}
    <div className="parse-summary"><Stat label="Response Plan" value={`${data.plans?.length || 0} 条`} /><Stat label="Approved Claim" value={`${approved.length} 条`} /><Stat label="Rejected Claim" value={`${rejected.length} 条`} /><Stat label="未覆盖 Requirement" value={`${data.uncovered_requirement_ids?.length || 0} 条`} /></div>
    {data.uncovered_requirement_ids?.length ? <Notice kind="warning">未覆盖：{data.uncovered_requirement_ids.join('、')}</Notice> : null}
    <div className="table-scroll"><table className="data-table"><thead><tr><th>Claim</th><th>类型</th><th>正文</th><th>门禁</th><th>原因</th></tr></thead><tbody>{(data.claims || []).map((claim) => <tr key={claim.claim_id}><td>{claim.claim_id}</td><td>{claim.claim_type}</td><td>{claim.text}</td><td><Badge type={claim.decision}>{claim.decision}</Badge></td><td>{claim.reason_code || '—'}</td></tr>)}</tbody></table></div>
  </section>;
}

function Overview({ data }) {
  const auditsByJob = new Map((data.generations || []).map((generation) => [generation.job_id, generation]));
  const tasks = [
    ...data.jobs.map((job) => ({ ...job, type: '标书生成', audit: auditsByJob.get(job.id) })),
    ...(data.parseJobs || []).map((job) => ({ ...job, type: `需求解析 · ${job.file_name}` })),
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

export function CompanyMaterials({ projectId, baseline }) {
  const [state, setState] = useState({ loading:true, error:'', materials:[], evidences:[], counts:{draft:0,approved:0,rejected:0} });
  const [upload, setUpload] = useState({ file:null, material_type:'company_profile' });
  const [form, setForm] = useState({ material_id:'', evidence_type:'technical_solution', title:'', content:'', source_text:'', source_page:'', source_paragraph:'', applicable_requirement_ids:[], usage_scope:'', risk_notes:'' });
  async function load() {
    try {
      const [materials, catalog] = await Promise.all([api.listCompanyMaterials(projectId), api.listEvidences(projectId)]);
      setState({ loading:false, error:'', materials:materials.materials || [], evidences:catalog.evidences || [], counts:catalog.counts || {draft:0,approved:0,rejected:0} });
    } catch (error) { setState((current) => ({ ...current, loading:false, error:error.message })); }
  }
  useEffect(() => { load(); }, [projectId]);
  async function uploadFile() {
    if (!upload.file) return setState((current) => ({ ...current, error:'请选择企业材料文件。' }));
    try { await api.uploadCompanyMaterial(projectId, upload.file, upload.material_type); setUpload({ ...upload, file:null }); await load(); }
    catch (error) { setState((current) => ({ ...current, error:error.message })); await load(); }
  }
  async function createEvidence() {
    try { await api.createEvidence(projectId, { ...form, source_page:form.source_page || null, source_paragraph:form.source_paragraph || null }); setForm({ ...form, title:'', content:'', source_text:'', source_page:'', source_paragraph:'', risk_notes:'' }); await load(); }
    catch (error) { setState((current) => ({ ...current, error:error.message })); }
  }
  async function decide(id, decision) { try { await api.decideEvidence(id, decision); await load(); } catch (error) { setState((current) => ({ ...current, error:error.message })); } }
  const requirements = baseline?.requirements || [];
  return <div className="document-layout"><section className="card"><div className="section-heading"><div><h2>企业材料</h2><p>保存原文件并在本地提取文本；扫描 PDF 会标记 OCR_REQUIRED。</p></div></div>{state.error ? <Notice kind="error">{state.error}</Notice> : null}<div className="upload-actions"><input type="file" accept=".docx,.pdf,.txt,.md" onChange={(event) => setUpload({ ...upload, file:event.target.files?.[0] || null })} /><select value={upload.material_type} onChange={(event) => setUpload({ ...upload, material_type:event.target.value })}>{materialTypes.map((type) => <option key={type}>{type}</option>)}</select><button className="primary-inline" onClick={uploadFile}>上传并解析</button></div>{state.loading ? <Loading text="正在读取企业材料" /> : <div className="file-list">{state.materials.map((material) => <div key={material.id}><strong>{material.original_name}</strong><span>{material.material_type} · {material.extraction_status}</span><Badge type={material.extraction_status === 'succeeded' ? 'succeeded' : material.extraction_status === 'ocr_required' ? 'warning' : 'neutral'}>{material.extraction_status}</Badge>{material.extraction_error_message ? <small>{material.extraction_error_message}</small> : null}{material.extracted_text ? <details><summary>预览提取文本</summary><p>{material.extracted_text.slice(0,1000)}</p></details> : null}</div>)}</div>}</section><section className="card"><h2>Evidence Catalog</h2><div className="parse-summary"><Stat label="draft" value={state.counts.draft || 0} /><Stat label="approved" value={state.counts.approved || 0} /><Stat label="rejected" value={state.counts.rejected || 0} /></div><label className="field"><span>来源材料</span><select value={form.material_id} onChange={(event) => setForm({ ...form, material_id:event.target.value })}><option value="">请选择已解析材料</option>{state.materials.filter((item) => item.extraction_status === 'succeeded').map((item) => <option key={item.id} value={item.id}>{item.original_name}</option>)}</select></label><label className="field"><span>Evidence 类型</span><select value={form.evidence_type} onChange={(event) => setForm({ ...form, evidence_type:event.target.value })}>{materialTypes.map((type) => <option key={type}>{type}</option>)}</select></label><label className="field"><span>标题</span><input value={form.title} onChange={(event) => setForm({ ...form, title:event.target.value })} /></label><label className="field"><span>内容</span><textarea value={form.content} onChange={(event) => setForm({ ...form, content:event.target.value })} /></label><label className="field"><span>来源原文（未知可留空）</span><textarea value={form.source_text} onChange={(event) => setForm({ ...form, source_text:event.target.value })} /></label><div className="compact-actions"><input type="number" placeholder="来源页" value={form.source_page} onChange={(event) => setForm({ ...form, source_page:event.target.value })} /><input type="number" placeholder="来源段" value={form.source_paragraph} onChange={(event) => setForm({ ...form, source_paragraph:event.target.value })} /></div><fieldset><legend>关联已确认 Requirement</legend>{requirements.map((requirement) => <label key={requirement.req_id}><input type="checkbox" checked={form.applicable_requirement_ids.includes(requirement.req_id)} onChange={(event) => setForm({ ...form, applicable_requirement_ids:event.target.checked ? [...form.applicable_requirement_ids,requirement.req_id] : form.applicable_requirement_ids.filter((id) => id !== requirement.req_id) })} />{requirement.req_id} · {requirement.content}</label>)}</fieldset><label className="field"><span>使用范围</span><input value={form.usage_scope} onChange={(event) => setForm({ ...form, usage_scope:event.target.value })} /></label><label className="field"><span>风险备注</span><textarea value={form.risk_notes} onChange={(event) => setForm({ ...form, risk_notes:event.target.value })} /></label><button className="primary-inline" onClick={createEvidence}>创建 draft Evidence</button><div className="version-list">{state.evidences.map((evidence) => <div key={evidence.id}><div><strong>{evidence.evidence_id} · {evidence.title}</strong><p>{evidence.content}</p><small>{evidence.material_name || '材料'} · {evidence.approval_status} · 关联 {(evidence.applicable_requirement_ids || []).join('、') || '无'}</small></div><Badge type={evidence.approval_status}>{evidence.approval_status}</Badge>{evidence.approval_status === 'draft' ? <div className="compact-actions"><button onClick={() => decide(evidence.id,'approve')}>批准</button><button onClick={() => decide(evidence.id,'reject')}>拒绝</button></div> : null}</div>)}</div></section></div>;
}

export function formatTenderParseError(value) {
  const code = value?.code || value?.error_code;
  const message = value?.message || value?.error_message;
  if (code && message) return `需求提取失败：${code} · ${message}`;
  if (code) return `需求提取失败：${code}`;
  return message ? `需求提取失败：${message}` : '需求提取失败，请稍后重试。';
}

export function formatTenderParsePhase(job) {
  if (!job) return '等待开始';
  if (job.status === 'failed') {
    return job.failed_chunk_number
      ? `分片 ${job.failed_chunk_number}/${job.total_chunks || '?'} 失败`
      : '处理失败';
  }
  const labels = {
    queued: '等待执行',
    text_extraction: '文本提取',
    section_classification: '文档章节分类',
    chunking: '文本分片',
    aggregating: '汇总校验',
    succeeded: '解析完成'
  };
  if (job.phase === 'extracting') {
    return `分片进度 ${job.completed_chunks || 0}/${job.total_chunks || 0}`;
  }
  return labels[job.phase] || labels[job.status] || '处理中';
}

export function formatRequirementLevel(requirement) {
  if (requirement?.is_mandatory && requirement?.mandatory_scope_source_text) {
    return '章节级实质性要求';
  }
  return requirement?.is_mandatory
    ? `${requirement.mandatory_marker || '★'} 实质性要求`
    : '一般要求';
}

export function formatRequirementSource(requirement) {
  if (requirement?.source_resolution_status === 'suggested') return '建议匹配';
  if (requirement?.source_verified === false) return '未定位';
  if (!Object.hasOwn(requirement || {}, 'source_page_start')) {
    return [requirement?.source_section, requirement?.source_clause_id,
      requirement?.source_page ? `第 ${requirement.source_page} 页` : null,
      requirement?.source_paragraph ? `第 ${requirement.source_paragraph} 段` : null
    ].filter(Boolean).join(' · ') || '未标注';
  }
  const pageStart = requirement.source_page_start ?? requirement.source_page;
  const pageEnd = requirement.source_page_end ?? pageStart;
  const paragraphStart = requirement.source_paragraph_start ?? requirement.source_paragraph;
  const paragraphEnd = requirement.source_paragraph_end ?? paragraphStart;
  if (pageStart && paragraphStart) {
    const pages = pageEnd && pageEnd !== pageStart ? `第${pageStart}–${pageEnd}页` : `第${pageStart}页`;
    const paragraphs = paragraphEnd && paragraphEnd !== paragraphStart ? `第${paragraphStart}–${paragraphEnd}段` : `第${paragraphStart}段`;
    return `${pages}·${paragraphs}`;
  }
  return [
    requirement?.source_section,
    requirement?.source_clause_id,
    requirement?.source_page ? `第 ${requirement.source_page} 页` : null,
    requirement?.source_paragraph ? `第 ${requirement.source_paragraph} 段` : null
  ].filter(Boolean).join(' · ') || '未标注';
}

export function summarizeRequirementSources(candidates = []) {
  const statusOf = (item) => item.candidate_decision === 'exclude' || item.source_status === 'excluded'
    ? 'excluded' : item.source_status || (item.source_verified === true || (item.source_verified === undefined && (item.source_page || item.source_paragraph)) ? 'verified' : 'provisional');
  return {
    total: candidates.length,
    verified: candidates.filter((item) => statusOf(item) === 'verified').length,
    provisional: candidates.filter((item) => statusOf(item) === 'provisional').length,
    suggested: candidates.filter((item) => statusOf(item) === 'provisional' && item.source_resolution_status === 'suggested').length,
    unresolved: candidates.filter((item) => statusOf(item) === 'provisional' && item.source_resolution_status !== 'suggested').length,
    excluded: candidates.filter((item) => statusOf(item) === 'excluded').length,
    pending: candidates.filter((item) => item.candidate_decision === 'pending').length
  };
}

function RequirementCandidatePanel({ candidates, visibleCandidates, sourceSummary, sourceFilter, setSourceFilter,
  displayJob, isConfirmed, isLoading, state, safeWarnings, review, setReview, openSourceReview,
  saveSourceDecision, decideCandidate, updateClassification, includeProvisionalBatch, confirmBaseline, startParse, selectedFileId,
  setSelectedFileId, files, actionLabel, emptyText, confirmBlocked, mandatoryPending, provisionalPending }) {
  const statusOf = (candidate) => candidate.candidate_decision === 'exclude' || candidate.source_status === 'excluded'
    ? 'excluded' : candidate.source_status || (candidate.source_verified === true || (candidate.source_verified === undefined && (candidate.source_page || candidate.source_paragraph)) ? 'verified' : 'provisional');
  return <section className="card requirement-panel">
    <div className="section-heading"><div><h2>需求解析与基线确认</h2><p>来源状态独立保留；暂定需求不会生成页码或段落号。</p></div><div className="parse-actions"><select value={selectedFileId} onChange={(event) => setSelectedFileId(event.target.value)} disabled={isConfirmed || isLoading}><option value="">选择招标文件</option>{files.map((file) => <option value={file.id} key={file.id}>{file.original_name}</option>)}</select><button className="primary-inline" onClick={startParse} disabled={isConfirmed || isLoading || !files.length}>{isLoading ? <Loader2 className="spin" size={16} /> : <FileSearch size={16} />}{actionLabel}</button></div></div>
    {state.error ? <Notice kind="error">{formatTenderParseError(state.error)}</Notice> : null}{state.message ? <Notice kind="success">{state.message}</Notice> : null}
    {displayJob ? <div className="parse-summary"><Stat label="总候选数" value={`${sourceSummary.total || displayJob.requirement_count || 0} 条`} /><Stat label="verified" value={`${sourceSummary.verified} 条`} /><Stat label="provisional" value={`${sourceSummary.provisional} 条`} /><Stat label="excluded" value={`${sourceSummary.excluded} 条`} /><Stat label="处理阶段" value={isConfirmed ? '基线已确认' : formatTenderParsePhase(displayJob)} /></div> : null}
    {displayJob?.status === 'failed' && !state.error ? <Notice kind="error">{formatTenderParseError(displayJob)}</Notice> : null}{safeWarnings.map((warning, index) => <Notice kind="warning" key={index}>{warning.message || String(warning)}</Notice>)}
    {candidates.length ? <>
      <div className="source-filter"><label>来源状态筛选 <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}><option value="all">全部</option><option value="verified">verified</option><option value="provisional">provisional</option><option value="excluded">excluded</option></select></label>{!isConfirmed && provisionalPending.some((item) => !item.is_mandatory) ? <button className="secondary-button" onClick={includeProvisionalBatch}>批量纳入 provisional</button> : null}</div>
      <div className="table-scroll"><table className="data-table requirement-table"><thead><tr><th>REQ-ID</th><th>需求内容</th><th>来源位置</th><th>要求等级</th><th>用途分类</th><th>来源状态</th><th>处理</th></tr></thead><tbody>{visibleCandidates.map((candidate) => <tr key={candidate.req_id}><td><strong>{candidate.req_id}</strong></td><td>{candidate.content}</td><td>{statusOf(candidate) === 'provisional' ? '—' : formatRequirementSource(candidate)}</td><td><div>{formatRequirementLevel(candidate)}</div>{candidate.mandatory_scope_source_text ? <small>依据：{candidate.mandatory_scope_source_text}</small> : null}</td><td><select value={candidate.requirement_category || ''} disabled={isConfirmed} onChange={(event) => updateClassification(candidate, event.target.value)}><option value="">待复核</option>{requirementCategories.map((category) => <option key={category} value={category}>{category}</option>)}</select><small>{candidate.writer_eligible ? '可用于技术正文' : '不直接进入技术正文'}{candidate.atomicity_review_required ? ' · 待原子性复核' : ''}</small></td><td><Badge type={statusOf(candidate) === 'verified' ? 'succeeded' : 'neutral'}>{statusOf(candidate)}</Badge></td><td>{isConfirmed ? '已冻结' : statusOf(candidate) === 'excluded' ? <button onClick={() => decideCandidate(candidate, 'restore')}>恢复</button> : <div className="compact-actions">{statusOf(candidate) === 'provisional' && candidate.candidate_decision === 'pending' ? <button onClick={() => decideCandidate(candidate, 'include_provisional')}>{candidate.is_mandatory ? '逐条确认纳入' : '纳入'}</button> : null}<button onClick={() => decideCandidate(candidate, 'exclude')}>排除</button>{statusOf(candidate) === 'provisional' ? <button onClick={() => openSourceReview(candidate)}>定位来源</button> : null}</div>}</td></tr>)}</tbody></table></div>
      {review ? <div className="source-review"><h3>处理 {review.candidate.req_id} 来源</h3><p><strong>候选需求：</strong>{review.candidate.content}</p><p><strong>模型引用：</strong>{review.candidate.source_text}</p>{review.error ? <Notice kind="error">{review.error}</Notice> : null}<div className="review-paragraphs">{review.paragraphs.map((item) => <p key={item.paragraph_number}>第{item.page_number || '—'}页·第{item.paragraph_number}段：{item.text}</p>)}</div><div className="compact-actions"><input type="number" placeholder="起始段" value={review.start} onChange={(event) => setReview({ ...review, start: event.target.value })} /><input type="number" placeholder="结束段" value={review.end} onChange={(event) => setReview({ ...review, end: event.target.value })} /><button onClick={() => saveSourceDecision('associate')}>关联连续段落</button><button onClick={() => saveSourceDecision('exclude')}>排除此候选</button><button onClick={() => setReview(null)}>取消</button></div></div> : null}
      {!isConfirmed ? <div className="warning-summary"><strong>确认前风险摘要</strong><p>暂定需求 {sourceSummary.provisional} 条；其中待确认 {provisionalPending.length} 条。</p>{mandatoryPending.length ? <Notice kind="warning">{mandatoryPending.length} 条 mandatory 暂定需求禁止自动确认，必须逐条人工确认或排除。</Notice> : null}<p>暂定需求的来源位置保持为空，进入响应规划后仍保留 provisional 状态。</p></div> : null}
      <div className="baseline-actions"><p>{isConfirmed ? '该基线已冻结，不可增删改或合并 REQ-ID。' : sourceSummary.pending ? `仍有 ${sourceSummary.pending} 条候选待明确纳入或排除。` : '全部候选已处理，可按门禁确认。'}</p><button className="primary-inline" onClick={confirmBaseline} disabled={isConfirmed || isLoading || displayJob?.status !== 'succeeded' || confirmBlocked}><CheckCircle2 size={16} />{isConfirmed ? '需求基线已确认' : '确认需求基线'}</button></div>
    </> : <Empty title="暂无候选需求" text={emptyText} />}
  </section>;
}

export function RequirementParsing({ projectId, files, parseJobs, baseline, onChanged }) {
  const latestJob = parseJobs[0];
  const [selectedFileId, setSelectedFileId] = useState(files[0]?.id || '');
  const [jobDetail, setJobDetail] = useState(latestJob?.candidates ? latestJob : null);
  const [state, setState] = useState({ loading: false, error: null, message: '' });
  const [sourceFilter, setSourceFilter] = useState('all');
  const [review, setReview] = useState(null);

  useEffect(() => {
    if (!selectedFileId && files[0]?.id) setSelectedFileId(files[0].id);
  }, [files, selectedFileId]);

  useEffect(() => {
    let active = true;
    if (!latestJob?.id) { setJobDetail(null); return () => { active = false; }; }
    api.getTenderParseJob(latestJob.id)
      .then((payload) => { if (active) setJobDetail(payload.job); })
      .catch((error) => { if (active) setState((current) => ({ ...current, error })); });
    return () => { active = false; };
  }, [latestJob?.id, latestJob?.updated_at]);

  async function startParse() {
    if (!selectedFileId) return setState({ loading: false, error: { message: '请先上传并选择招标文件。' }, message: '' });
    setState({ loading: true, error: null, message: '' });
    try {
      const payload = await api.startTenderParse(projectId, selectedFileId);
      setJobDetail(payload.job);
      setState({
        loading: false,
        error: null,
        message: payload.job.status === 'succeeded'
          ? '需求解析完成，请核对候选需求后确认基线。'
          : '需求解析任务已创建，请等待状态更新。'
      });
      await onChanged();
    } catch (error) {
      setState({ loading: false, error, message: '' });
      await onChanged();
    }
  }

  async function confirmBaseline() {
    if (!jobDetail?.id) return;
    setState({ loading: true, error: null, message: '' });
    try {
      await api.confirmRequirementBaseline(jobDetail.id);
      setState({ loading: false, error: null, message: '需求基线已确认并冻结。' });
      await onChanged();
    } catch (error) {
      setState({ loading: false, error, message: '' });
    }
  }

  async function decideCandidate(candidate, action) {
    setState({ loading: true, error: null, message: '' });
    try {
      if (action === 'include_provisional') await api.confirmProvisionalCandidate(candidate.id);
      else if (action === 'exclude') await api.excludeRequirementCandidate(candidate.id);
      else await api.restoreRequirementCandidate(candidate.id);
      const payload = await api.getTenderParseJob(displayJob.id);
      setJobDetail(payload.job);
      setState({ loading: false, error: null, message: action === 'exclude' ? '候选需求已排除。' : action === 'restore' ? '候选需求已恢复。' : '候选需求已逐条纳入暂定基线。' });
    } catch (error) { setState({ loading: false, error, message: '' }); }
  }

  async function updateClassification(candidate, requirementCategory) {
    if (!requirementCategory) return;
    try {
      await api.updateRequirementClassification(candidate.id, requirementCategory);
      const payload = await api.getTenderParseJob(displayJob.id); setJobDetail(payload.job);
    } catch (error) { setState((current) => ({ ...current, error })); }
  }

  async function includeProvisionalBatch() {
    setState({ loading: true, error: null, message: '' });
    try {
      const result = await api.includeProvisionalBatch(displayJob.id);
      const payload = await api.getTenderParseJob(displayJob.id);
      setJobDetail(payload.job);
      const mandatoryCount = result.mandatory_manual_required?.length || 0;
      setState({ loading: false, error: null, message: `已批量纳入 ${result.included_count} 条暂定需求${mandatoryCount ? `；${mandatoryCount} 条 mandatory 仍需逐条确认` : ''}。` });
    } catch (error) { setState({ loading: false, error, message: '' }); }
  }

  async function openSourceReview(candidate) {
    try { const payload = await api.getCandidateSourceReview(candidate.id); setReview({ ...payload, start: '', end: '', error: '' }); }
    catch (error) { setState((current) => ({ ...current, error })); }
  }

  async function saveSourceDecision(action) {
    try {
      await api.decideCandidateSource(review.candidate.id, action === 'exclude'
        ? { action, reason: review.reason || '人工排除' }
        : { action, source_paragraph_start: Number(review.start), source_paragraph_end: Number(review.end), reason: review.reason || '人工关联来源' });
      const payload = await api.getTenderParseJob(displayJob.id); setJobDetail(payload.job); setReview(null);
    } catch (error) { setReview((current) => ({ ...current, error: error.message })); }
  }

  const displayJob = jobDetail || latestJob;
  const isConfirmed = Boolean(baseline);
  const isLoading = state.loading || ['queued', 'running'].includes(displayJob?.status);
  const candidates = isConfirmed
    ? baseline.requirements || []
    : displayJob?.status === 'succeeded' ? jobDetail?.candidates || [] : [];
  const sourceSummary = summarizeRequirementSources(candidates);
  const candidateStatus = (candidate) => candidate.candidate_decision === 'exclude' || candidate.source_status === 'excluded'
    ? 'excluded' : candidate.source_status || (candidate.source_verified === true || (candidate.source_verified === undefined && (candidate.source_page || candidate.source_paragraph)) ? 'verified' : 'provisional');
  const visibleCandidates = candidates.filter((candidate) => sourceFilter === 'all' || sourceFilter === candidateStatus(candidate));
  const status = isConfirmed ? 'confirmed' : isLoading ? 'loading' : displayJob?.status;
  const actionLabel = isConfirmed ? '基线已冻结' : isLoading ? '解析中…' : displayJob ? '重新解析' : '发起需求解析';
  const emptyText = status === 'failed'
    ? '本次解析失败，检查安全错误信息后可重新解析。'
    : files.length ? '选择招标文件并发起需求解析。' : '请先在“招标文件”页上传 DOCX、文本型 PDF 或纯文本文件。';
  const safeWarnings = (displayJob?.warnings_json || []).filter((warning) => !String(warning.code || '').startsWith('SOURCE_LOCATION_'));
  const mandatoryPending = candidates.filter((item) => item.is_mandatory && candidateStatus(item) === 'provisional' && item.candidate_decision === 'pending');
  const provisionalPending = candidates.filter((item) => candidateStatus(item) === 'provisional' && item.candidate_decision === 'pending');
  const confirmBlocked = sourceSummary.pending > 0 || !candidates.some((item) => item.candidate_decision === 'include');
  return <RequirementCandidatePanel {...{
    candidates, visibleCandidates, sourceSummary, sourceFilter, setSourceFilter, displayJob, isConfirmed,
    isLoading, state, safeWarnings, review, setReview, openSourceReview, saveSourceDecision,
    decideCandidate, updateClassification, includeProvisionalBatch, confirmBaseline, startParse, selectedFileId,
    setSelectedFileId, files, actionLabel, emptyText, confirmBlocked, mandatoryPending, provisionalPending
  }} />;
  return <section className="card requirement-panel"><div className="section-heading"><div><h2>需求解析与基线确认</h2><p>语义网关只提取候选内容；来源、REQ-ID 与冻结由后端控制。</p></div><div className="parse-actions"><select value={selectedFileId} onChange={(event) => setSelectedFileId(event.target.value)} disabled={isConfirmed || isLoading}><option value="">选择招标文件</option>{files.map((file) => <option value={file.id} key={file.id}>{file.original_name}</option>)}</select><button className="primary-inline" onClick={startParse} disabled={isConfirmed || isLoading || !files.length}>{isLoading ? <Loader2 className="spin" size={16} /> : <FileSearch size={16} />}{actionLabel}</button></div></div>{state.error ? <Notice kind="error">{formatTenderParseError(state.error)}</Notice> : null}{state.message ? <Notice kind="success">{state.message}</Notice> : null}{displayJob ? <div className="parse-summary"><Stat label="总候选数" value={`${sourceSummary.total || displayJob.requirement_count || 0} 条`} /><Stat label="已定位" value={`${sourceSummary.verified} 条`} /><Stat label="建议匹配" value={`${sourceSummary.suggested} 条`} /><Stat label="未定位" value={`${sourceSummary.unresolved} 条`} /><Stat label="已排除" value={`${sourceSummary.excluded} 条`} /><Stat label="处理阶段" value={isConfirmed ? '基线已确认' : formatTenderParsePhase(displayJob)} /></div> : null}{displayJob?.status === 'failed' && !state.error ? <Notice kind="error">{formatTenderParseError(displayJob)}</Notice> : null}{safeWarnings.map((warning, index) => <Notice kind="warning" key={index}>{warning.message || String(warning)}</Notice>)}{candidates.length ? <><div className="source-filter"><label>来源状态筛选 <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}><option value="all">全部</option><option value="verified">已定位</option><option value="suggested">建议匹配</option><option value="unresolved">未定位</option><option value="excluded">已排除</option></select></label></div><div className="table-scroll"><table className="data-table requirement-table"><thead><tr><th>REQ-ID</th><th>需求内容</th><th>来源片段</th><th>来源位置</th><th>要求等级</th><th>处理</th></tr></thead><tbody>{visibleCandidates.map((candidate) => <tr key={candidate.req_id}><td><strong>{candidate.req_id}</strong></td><td>{candidate.content}</td><td>{candidate.source_excerpt}</td><td>{formatRequirementSource(candidate)}</td><td><div>{formatRequirementLevel(candidate)}</div>{candidate.mandatory_scope_source_text ? <small>依据：{candidate.mandatory_scope_source_text}</small> : null}</td><td>{candidate.candidate_decision === 'exclude' ? <Badge>已排除</Badge> : candidate.source_verified ? <Badge type="succeeded">已定位</Badge> : <button className="secondary-button" onClick={() => openSourceReview(candidate)}>处理来源</button>}</td></tr>)}</tbody></table></div>{review ? <div className="source-review"><h3>处理 {review.candidate.req_id} 来源</h3><p><strong>候选需求：</strong>{review.candidate.content}</p><p><strong>模型引用：</strong>{review.candidate.source_text}</p>{review.error ? <Notice kind="error">{review.error}</Notice> : null}<div className="review-paragraphs">{review.paragraphs.map((item) => <p key={item.paragraph_number}>第{item.page_number || '—'}页·第{item.paragraph_number}段：{item.text}</p>)}</div><div className="compact-actions"><input type="number" placeholder="起始段" value={review.start} onChange={(event) => setReview({ ...review, start: event.target.value })} /><input type="number" placeholder="结束段" value={review.end} onChange={(event) => setReview({ ...review, end: event.target.value })} /><button onClick={() => saveSourceDecision('associate')}>关联连续段落</button><button onClick={() => saveSourceDecision('exclude')}>排除此候选</button><button onClick={() => setReview(null)}>取消</button></div></div> : null}<div className="baseline-actions"><p>{isConfirmed ? '该基线已冻结，不可增删改或合并 REQ-ID。' : sourceSummary.pending ? `仍有 ${sourceSummary.pending} 条候选待人工关联来源或排除。` : '全部候选已处理，可按门禁确认。'}</p><button className="primary-inline" onClick={confirmBaseline} disabled={isConfirmed || isLoading || displayJob?.status !== 'succeeded' || confirmBlocked}><CheckCircle2 size={16} />{isConfirmed ? '需求基线已确认' : '确认需求基线'}</button></div></> : <Empty title="暂无候选需求" text={emptyText} />}</section>;
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

export function RiskReview({ version, baseline, onConfirmed }) {
  const [confirmation, setConfirmation] = useState('');
  const [state, setState] = useState({ loading: false, message: '', error: '' });
  const provisional = (baseline?.requirements || []).filter((item) => item.source_status === 'provisional');
  if (!version) return <section className="card review-card"><Empty title="暂无待复核版本" text="生成合法的标书正文后，风险门禁会显示在这里。" /><div className="warning-summary"><strong>暂定基线风险</strong><p>provisional 需求 {provisional.length} 条。</p>{provisional.length ? <ul>{provisional.map((item) => <li key={item.req_id}>{item.content}{item.is_mandatory ? '（mandatory）' : ''}</li>)}</ul> : <p>当前基线无 provisional 需求。</p>}</div></section>;
  async function confirm() { setState({ loading: true, message: '', error: '' }); try { await api.confirmVersion(version.id, confirmation); setState({ loading: false, message: '版本已确认并设为项目当前版本。', error: '' }); await onConfirmed(); } catch (error) { setState({ loading: false, message: '', error: error.message }); } }
  const blocked = version.risk_status === 'critical' || version.status === 'confirmed';
  return <section className="card review-card"><div className="risk-hero"><Badge type={version.risk_status}>{riskLabels[version.risk_status]}</Badge><div><h2>V{version.version_number} 风险门禁</h2><p>{version.risk_status === 'pass' ? '当前版本可直接确认。' : version.risk_status === 'warning' ? '必须填写风险确认说明后才能确认。' : '存在严重风险，禁止确认此版本。'}</p></div></div><div className="warning-summary"><strong>暂定基线风险</strong><p>provisional 需求 {provisional.length} 条。</p>{provisional.length ? <ul>{provisional.map((item) => <li key={item.req_id}>{item.content}{item.is_mandatory ? '（mandatory）' : ''}</li>)}</ul> : <p>当前基线无 provisional 需求。</p>}</div>{version.warnings_json?.map((warning, index) => <Notice kind={warning.level === 'critical' ? 'error' : 'warning'} key={index}>{warning.message}</Notice>)}{version.risk_status === 'warning' ? <label className="field"><span>风险确认说明 *</span><textarea value={confirmation} onChange={(e) => setConfirmation(e.target.value)} placeholder="说明已知风险、接受原因与后续处置责任。" /></label> : null}{state.error ? <Notice kind="error">{state.error}</Notice> : null}{state.message ? <Notice kind="success">{state.message}</Notice> : null}<button className="primary-inline" disabled={blocked || state.loading || (version.risk_status === 'warning' && !confirmation.trim())} onClick={confirm}>{version.status === 'confirmed' ? '已确认' : version.risk_status === 'critical' ? '严重风险禁止确认' : '确认此版本'}</button></section>;
  return <section className="card review-card"><div className="risk-hero"><Badge type={version.risk_status}>{riskLabels[version.risk_status]}</Badge><div><h2>V{version.version_number} 风险门禁</h2><p>{version.risk_status === 'pass' ? '当前版本可直接确认。' : version.risk_status === 'warning' ? '必须填写风险确认说明后才能确认。' : '存在严重风险，禁止确认此版本。'}</p></div></div>{version.warnings_json?.map((warning, index) => <Notice kind={warning.level === 'critical' ? 'error' : 'warning'} key={index}>{warning.message}</Notice>)}{version.risk_status === 'warning' ? <label className="field"><span>风险确认说明 *</span><textarea value={confirmation} onChange={(e) => setConfirmation(e.target.value)} placeholder="说明已知风险、接受原因与后续处置责任。" /></label> : null}{state.error ? <Notice kind="error">{state.error}</Notice> : null}{state.message ? <Notice kind="success">{state.message}</Notice> : null}<button className="primary-inline" disabled={blocked || state.loading || (version.risk_status === 'warning' && !confirmation.trim())} onClick={confirm}>{version.status === 'confirmed' ? '已确认' : version.risk_status === 'critical' ? '严重风险禁止确认' : '确认此版本'}</button></section>;
}

function Versions({ versions }) {
  return <section className="card"><h2>版本记录</h2>{versions.length ? <div className="version-list">{versions.map((version) => <div key={version.id}><div><strong>V{version.version_number} · {version.title}</strong><p>{formatDate(version.created_at)}{version.confirmed_at ? ` · 确认于 ${formatDate(version.confirmed_at)}` : ''}</p></div><Badge type={version.risk_status}>{riskLabels[version.risk_status]}</Badge><Badge type={version.status}>{version.status === 'confirmed' ? '已确认' : '待确认'}</Badge></div>)}</div> : <Empty title="暂无版本" text="通过后端契约与风险校验的生成结果会形成可追溯版本。" />}</section>;
}

function App() {
  const [route, setRoute] = useState({ page: 'list', projectId: null });
  if (route.page === 'create') return <CreateProject onBack={() => setRoute({ page: 'list' })} onCreated={(projectId) => setRoute({ page: 'workspace', projectId })} />;
  if (route.page === 'workspace') return <Workspace projectId={route.projectId} onBack={() => setRoute({ page: 'list' })} />;
  return <ProjectList onCreate={() => setRoute({ page: 'create' })} onOpen={(projectId) => setRoute({ page: 'workspace', projectId })} />;
}

if (typeof document !== 'undefined') {
  createRoot(document.getElementById('root')).render(<App />);
}
