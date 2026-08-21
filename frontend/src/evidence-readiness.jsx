import React, { useEffect, useState } from 'react';
import { api } from './api.js';

const LABEL = { SUPPORTED:'材料已满足', PARTIALLY_SUPPORTED:'材料部分满足', INSUFFICIENT:'材料不足', CONFLICT:'信息存在冲突', NO_EVIDENCE:'缺少证明材料', NEEDS_REVIEW:'待人工确认' };
const FILTER = [['all','全部'], ...Object.entries(LABEL)];

export function EvidenceReadiness({ projectId, onOpenReview, onSupplementMaterial, initialData=null }) {
  const [state,setState]=useState({loading:!initialData,data:initialData,error:''});
  const [filter,setFilter]=useState('all');
  const [selected,setSelected]=useState(null);
  async function load(){try{setState({loading:true,data:null,error:''});setState({loading:false,data:await api.getEvidenceReadiness(projectId),error:''});}catch(error){setState({loading:false,data:null,error:error.message});}}
  useEffect(()=>{if(!initialData)load();},[projectId]);
  if(state.loading)return <section className="card">正在计算材料准备度…</section>;
  if(!state.data)return <section className="card"><div className="notice error">{state.error}</div></section>;
  const d=state.data,visible=d.requirements.filter(x=>filter==='all'||x.readiness===filter);
  return <div className="readiness-layout">
    <section className="card">
      <div className="section-heading"><div><h2>材料准备度</h2><p>依据已确认的招标要求、材料证明内容和需求匹配结果计算，不代表投标合规结论。</p></div><button className="secondary-button" onClick={onOpenReview}>进入审核中心</button></div>
      <div className="readiness-summary"><strong>{Math.round(d.summary.readiness_rate*100)}%</strong><span>材料已满足 / 全部招标要求</span><p>共 {d.summary.total_requirements} 条：已满足 {d.summary.supported} · 部分满足 {d.summary.partially_supported} · 材料不足 {d.summary.insufficient} · 信息冲突 {d.summary.conflict} · 缺少材料 {d.summary.no_evidence} · 待确认 {d.summary.needs_review}</p>{d.generation_readiness?<div className={`notice ${d.generation_readiness.status==='READY_TO_GENERATE'?'success':'warning'}`}><strong>生成准备状态：</strong>{d.generation_readiness.message}</div>:null}</div>
      <div className="source-filter"><label>准备度筛选 <select value={filter} onChange={e=>setFilter(e.target.value)}>{FILTER.map(([v,l])=><option value={v} key={v}>{l}</option>)}</select></label></div>
      <div className="table-scroll"><table className="data-table requirement-table"><thead><tr><th>招标要求</th><th>等级</th><th>准备度</th><th>已有材料 / 已确认内容</th><th>缺口摘要</th><th>操作</th></tr></thead><tbody>{visible.map(item=><tr key={item.requirement_id}><td><strong>{item.requirement_id}</strong><small>{item.requirement_text}</small></td><td>{item.is_mandatory?'★ 实质性要求':'一般要求'}</td><td><span className={`badge ${item.readiness}`}>{LABEL[item.readiness]||item.readiness_label}</span></td><td>{item.existing_evidence_count} / {item.approved_fact_count}</td><td>{item.gap_reason||'当前已有充分正式支撑。'}</td><td><button onClick={()=>setSelected(item)}>查看材料依据</button>{item.readiness==='NEEDS_REVIEW'||item.readiness==='CONFLICT'?<button onClick={onOpenReview}>去审核</button>:null}</td></tr>)}</tbody></table></div>
      {selected?<div className="readiness-detail"><h3>{selected.requirement_id} 材料依据</h3><p>{selected.requirement_text}</p>{selected.mapping_summary.length?selected.mapping_summary.map(m=><div key={m.mapping_id}><strong>{LABEL[selected.readiness]||selected.readiness_label}</strong><p>{m.source.material_name||'未知材料'} · {m.source.material_type||'未知类型'}</p><details><summary>高级信息</summary><code>需求匹配 {m.mapping_id} → 材料证明内容 {m.evidence_fact_id} → 来源片段 {m.source.source_span_id}</code></details></div>):<p>当前没有已确认的需求匹配结果。</p>}<button onClick={()=>setSelected(null)}>关闭</button></div>:null}
    </section>
    <section className="card"><h2>材料缺口</h2>{d.gaps.length?<div className="gap-list">{d.gaps.map(g=><article key={g.requirement_id}><header><strong>{g.requirement_id} · {LABEL[g.readiness]}</strong><span className={`badge ${g.priority}`}>{g.priority==='high'?'优先处理':'一般优先级'}</span></header><p>{g.gap_reason}</p><small>{g.suggested_material||'需人工判断适合补充的材料类别'}；现有 Evidence {g.existing_evidence_count}，approved Fact {g.approved_fact_count}。补充材料可能改善准备度，但不保证满足。</small><button onClick={()=>onSupplementMaterial?.(g)}>补充材料</button></article>)}</div>:<p>当前没有确定性的材料缺口。</p>}
      <h2>建议优先补充材料</h2>{d.suggested_materials.length?<div className="gap-list">{d.suggested_materials.map(m=><article key={m.material_category}><header><strong>{m.material_category}</strong><span>{m.affected_requirement_count} 条需求</span></header><p>{m.suggestion}</p><small>其中 mandatory {m.mandatory_requirement_count} 条；可能补足：{m.requirement_ids.join('、')}</small></article>)}</div>:<p>暂无有确定依据的材料类别建议。</p>}
    </section>
  </div>;
}
