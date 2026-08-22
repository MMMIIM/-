import {describe,it,expect} from 'vitest';import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {BidDocument,getChapterDisplayState,getGenerationDisplayState} from './main.jsx';
describe('标书生成状态页',()=>{it('展示业务化生成入口、风险、内容检查、章节重生成与版本来源',()=>{const html=renderToStaticMarkup(<BidDocument project={{id:'p',name:'项目'}} onGenerated={async()=>{}} version={{id:'v',title:'技术响应',version_number:2,risk_status:'warning',status:'pending_review',final_text:'## 数据安全与系统管理\n正文',sections_json:[{chapter_id:'chapter-06',title:'数据安全与系统管理',content_markdown:'正文'}],removed_items:[{code:'COMMERCIAL_CONTENT'}],validation_errors:[],warnings_json:[{message:'待人工复核'}]}}/>);expect(html).toContain('标书生成');expect(html).toContain('重新生成');expect(html).toContain('内容检查提醒');expect(html).toContain('warning');expect(html).toContain('pending_review');});});

describe('章节工作台状态投影',()=>{
  it('把持久化章节状态投影为用户可理解的五种状态',()=>{
    expect(getChapterDisplayState({status:'queued'},{status:'running'})).toEqual({key:'waiting',label:'等待生成'});
    expect(getChapterDisplayState({status:'running'},{status:'running'})).toEqual({key:'generating',label:'生成中'});
    expect(getChapterDisplayState({status:'succeeded'},{status:'running'})).toEqual({key:'checking',label:'检查中'});
    expect(getChapterDisplayState({status:'succeeded'},{status:'finalized'})).toEqual({key:'completed',label:'已完成'});
    expect(getChapterDisplayState({status:'succeeded'},{status:'failed'})).toEqual({key:'completed',label:'已完成'});
    expect(getChapterDisplayState({status:'failed'},{status:'failed'})).toEqual({key:'failed',label:'生成失败'});
  });

  it('生成完成后保留可进入投标检查的确定性状态',()=>{
    expect(getGenerationDisplayState({status:'finalized'})).toEqual({key:'completed',label:'已完成'});
    expect(getGenerationDisplayState({status:'running'})).toEqual({key:'running',label:'标书生成中'});
    expect(getGenerationDisplayState({status:'failed'})).toEqual({key:'attention',label:'需要处理'});
  });

  it('工作台显示多章节目录、真实状态和完成章节预览',()=>{
    const html=renderToStaticMarkup(<BidDocument project={{id:'p',name:'项目'}} generations={[{id:'g',status:'running',tasks:[{id:'t1',chapter_id:'chapter-01',title:'项目理解',status:'succeeded',output_markdown:'已完成内容'},{id:'t2',chapter_id:'chapter-02',title:'实施方案',status:'running'}]}]} onGenerated={async()=>{}} />);
    expect(html).toContain('标书生成中');
    expect(html).toContain('0/2 个章节已完成');
    expect(html).toContain('章节目录');
    expect(html).toContain('检查中');
    expect(html).toContain('生成中');
    expect(html).toContain('生成中预览');
    expect(html).toContain('已完成内容');
    expect(html).not.toMatch(/\d+%/);
  });

  it('正式版本完成后显示章节正文并提供投标检查入口',()=>{
    const html=renderToStaticMarkup(<BidDocument project={{id:'p',name:'项目'}} generations={[{id:'g',status:'finalized',tasks:[{id:'t1',chapter_id:'chapter-01',title:'项目理解',status:'succeeded',output_markdown:'正式章节正文'}]}]} version={{id:'v',version_number:1,title:'技术响应 V1',final_text:'# 正文'}} onGenerated={async()=>{}} onStartCheck={()=>{}} />);
    expect(html).toContain('标书已生成');
    expect(html).toContain('1/1 个章节已完成');
    expect(html).toContain('已完成章节');
    expect(html).toContain('正式章节正文');
    expect(html).toContain('开始投标检查');
  });
});
