import React,{useEffect,useState}from'react';
import{api}from'./api.js';

const READINESS={SUPPORTED:'材料已满足',PARTIALLY_SUPPORTED:'材料部分满足',INSUFFICIENT:'材料不足',CONFLICT:'信息存在冲突',NO_EVIDENCE:'缺少证明材料',NEEDS_REVIEW:'待人工确认'};
const count=(value,key)=>(value&&value[key])||0;

export function MaterialProcessingCenter({projectId,onOpenReview,onOpenReadiness,focusMaterialId=null,initialData=null}){
 const[state,setState]=useState({loading:!initialData,data:initialData,error:''}),[filter,setFilter]=useState('all');
 async function load(){try{setState({loading:true,data:null,error:''});setState({loading:false,data:await api.getMaterialProcessing(projectId),error:''});}catch(error){setState({loading:false,data:null,error:error.message});}}
 useEffect(()=>{if(!initialData)load();},[projectId]);
 if(state.loading)return<section className="card">正在读取材料处理状态…</section>;
 if(!state.data)return<section className="card"><div className="notice error"><strong>暂时无法读取材料状态</strong><p>{state.error}</p><button onClick={load}>重新加载</button></div></section>;
 const d=state.data,materials=d.materials.filter(x=>(filter==='all'||(filter==='attention'&&x.stage.code!=='COMPLETED')||(filter==='complete'&&x.stage.code==='COMPLETED'))).sort((a,b)=>(a.material_id===focusMaterialId?-1:b.material_id===focusMaterialId?1:0));
 return <div className="processing-center"><section className="card"><div className="section-heading"><div><h2>材料处理中心</h2><p>查看每份材料处理到哪里、还需做什么，以及它影响了哪些招标要求。</p></div><button className="secondary-button" onClick={load}>刷新状态</button></div>
  <div className="parse-summary"><div><span>材料总数</span><strong>{d.summary.material_count}</strong></div><div><span>需要处理</span><strong>{d.summary.needs_attention}</strong></div><div><span>待人工确认</span><strong>{d.summary.pending_review}</strong></div><div><span>处理完成</span><strong>{d.summary.processing_complete}</strong></div><div><span>已解决缺口</span><strong>{d.summary.resolved_gap_count}</strong></div><div><span>剩余缺口</span><strong>{d.summary.remaining_gap_count}</strong></div></div>
  <div className={`notice ${d.generation_readiness.status==='READY_TO_GENERATE'?'success':'warning'}`}><strong>{d.generation_readiness.status==='READY_TO_GENERATE'?'可进入生成':'建议先处理待办事项'}</strong><p>{d.generation_readiness.message}</p>{d.generation_readiness.status!=='READY_TO_GENERATE'?<button onClick={onOpenReadiness}>查看材料缺口</button>:null}</div>
  <label className="source-filter">显示 <select value={filter} onChange={e=>setFilter(e.target.value)}><option value="attention">需要处理</option><option value="complete">处理完成</option><option value="all">全部材料</option></select></label></section>
  <section className="card processing-list">{materials.length?materials.map(item=><article className={`processing-item ${item.material_id===focusMaterialId?'focused':''}`} key={item.material_id}><header><div><strong>{item.material_name}</strong><small>{item.material_type} · 上传于 {item.uploaded_at?new Date(item.uploaded_at).toLocaleString('zh-CN'):'—'}</small></div><span className={`badge ${item.stage.code}`}>{item.stage.label}</span></header><h3>现在发生了什么？</h3><p>{item.stage.message}</p><div className="processing-facts"><span>解析：{item.extraction_status==='succeeded'?'已完成':item.extraction_status}</span><span>相关内容：{item.chunk_count} 段</span><span>影响要求：{item.affected_requirement_count} 条</span><span>已解决缺口：{item.resolved_gap_count}</span></div>
   {item.affected_requirements.length?<div><h3>影响的招标要求</h3>{item.affected_requirements.map(req=><div className="impact-row" key={req.requirement_id}><strong>{req.requirement_id}{req.mandatory?' · ★ 实质性要求':''}</strong><span>{READINESS[req.before]||req.before} → {READINESS[req.after]||req.after}</span></div>)}</div>:<p className="muted">暂未关联到具体招标要求。材料已经保存，可在证据复核中发起检索。</p>}
   <div className="compact-actions">{['EVIDENCE_REVIEW','FACT_REVIEW','MAPPING_REVIEW','CONFLICT'].includes(item.stage.code)?<button onClick={onOpenReview}>{item.stage.action}</button>:null}<button onClick={onOpenReadiness}>查看材料准备度</button></div>
   <details><summary>高级信息</summary><p>检索运行：{item.retrieval_run_count}；证据确认 待办/通过/拒绝：{count(item.review_counts,'needs_review')+count(item.review_counts,'proposed')} / {count(item.review_counts,'approved')} / {count(item.review_counts,'rejected')}</p><p>证明内容 待办/通过/拒绝：{count(item.fact_counts,'draft')} / {count(item.fact_counts,'approved')} / {count(item.fact_counts,'rejected')}</p><p>需求匹配 待办/通过：{count(item.mapping_counts,'proposed')} / {count(item.mapping_counts,'approved')}</p>{item.extraction_error_code?<code>{item.extraction_error_code}</code>:null}</details>
  </article>):<p>当前筛选下没有材料。</p>}</section></div>;
}
