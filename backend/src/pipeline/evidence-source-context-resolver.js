import { createHash } from 'node:crypto';
import { AppError } from '../errors.js';

export const EVIDENCE_SOURCE_RESOLVER_VERSION='evidence-source-span-v1';
export const EVIDENCE_SOURCE_MAX_CHARS=4000;
export const EVIDENCE_SOURCE_MAX_PARAGRAPHS=12;

const sha=(value)=>createHash('sha256').update(value).digest('hex');
const heading=(value)=>{
  const text=String(value||'').trim();
  const markdown=/^(#{1,6})\s+\S/.exec(text);if(markdown)return{level:markdown[1].length};
  if(/^\u7b2c[\u4e00-\u9fa5\d]+[\u7ae0\u8282\u7bc7]\s*\S*/.test(text))return{level:1};
  if(/^[\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d\u5341\u767e\u96f6\u3007\d]+\u3001\s*\S+/.test(text))return{level:2};
  if(/^\([\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d\u5341\u767e\u96f6\u3007\d]+\)\s*\S+/.test(text)||/^[\uff08][\u4e00\u4e8c\u4e09\u56db\u4e94\u516d\u4e03\u516b\u4e5d\u5341\u767e\u96f6\u3007\d]+[\uff09]\s*\S+/.test(text))return{level:3};
  const numbered=/^(\d+(?:\.\d+)*)[.\u3001]?\s+\S+/.exec(text);return numbered?{level:3+numbered[1].split('.').length}:null;
};
const byIndex=(a,b)=>a.chunk_index-b.chunk_index;

export class EvidenceSourceContextResolver {
  resolve({material,chunks,anchorChunkId,strategy='auto'}){
    const ordered=[...(chunks||[])].sort(byIndex);const anchor=ordered.find((item)=>item.chunk_id===anchorChunkId);
    if(!material||!anchor||anchor.material_id!==material.id)throw new AppError('EVIDENCE_SOURCE_CHUNK_INVALID','Retrieval Anchor 不存在或不属于指定材料。',422);
    const sameVersion=ordered.filter((item)=>item.material_id===material.id&&item.chunker_version===anchor.chunker_version);
    const supported=new Set(['auto','anchor_only','paragraph_reconstruction','heading_group','bounded_paragraph_window']);
    if(!supported.has(strategy))throw new AppError('EVIDENCE_SOURCE_RESOLUTION_INVALID','Evidence Source Span 解析策略无效。',422);
    let selected;let method=strategy;
    if(strategy==='auto'){
      const paragraph=sameVersion.filter((item)=>item.paragraph_start===anchor.paragraph_start&&item.paragraph_end===anchor.paragraph_end);
      if(paragraph.length>1){selected=paragraph;method='paragraph_reconstruction';}
      else if(this.headingGroup(sameVersion,anchor).length){selected=this.headingGroup(sameVersion,anchor);method='heading_group';}
      else{selected=this.boundedWindow(sameVersion,anchor);method='bounded_paragraph_window';}
    }else if(strategy==='anchor_only')selected=[anchor];
    else if(strategy==='paragraph_reconstruction')selected=sameVersion.filter((item)=>item.paragraph_start===anchor.paragraph_start&&item.paragraph_end===anchor.paragraph_end);
    else if(strategy==='heading_group')selected=this.headingGroup(sameVersion,anchor);
    else selected=this.boundedWindow(sameVersion,anchor);
    if(!selected?.length||!selected.some((item)=>item.chunk_id===anchor.chunk_id))throw new AppError('EVIDENCE_SOURCE_SPAN_INVALID','解析结果未包含 Retrieval Anchor。',422);
    selected.sort(byIndex);const start=selected[0].char_start;let end=selected.at(-1).char_end;
    if(end-start>EVIDENCE_SOURCE_MAX_CHARS){end=start+EVIDENCE_SOURCE_MAX_CHARS;if(anchor.char_end>end)throw new AppError('EVIDENCE_SOURCE_SPAN_INVALID','Retrieval Anchor 超出 Source Span 字符预算。',422);}
    const source=String(material.extracted_text||'').slice(start,end);
    if(!source||anchor.char_start<start||anchor.char_end>end)throw new AppError('EVIDENCE_SOURCE_SPAN_INVALID','Evidence Source Span 无法回溯 Retrieval Anchor。',422);
    const pages=selected.flatMap((item)=>[item.page_start,item.page_end]).filter(Number.isInteger);
    const paragraphs=selected.flatMap((item)=>[item.paragraph_start,item.paragraph_end]).filter(Number.isInteger);
    return{source_text:source,source_hash:sha(source),source_location:{char_start:start,char_end:end,page_start:pages.length?Math.min(...pages):null,page_end:pages.length?Math.max(...pages):null,paragraph_start:paragraphs.length?Math.min(...paragraphs):null,paragraph_end:paragraphs.length?Math.max(...paragraphs):null,section:anchor.section||null,anchor_chunk_id:anchor.chunk_id,chunk_start_index:selected[0].chunk_index,chunk_end_index:selected.at(-1).chunk_index,resolution_method:method,resolver_version:EVIDENCE_SOURCE_RESOLVER_VERSION}};
  }

  headingGroup(chunks,anchor){
    const anchorPosition=chunks.findIndex((item)=>item.chunk_id===anchor.chunk_id);let start=-1;let level=null;
    for(let index=anchorPosition;index>=0;index-=1){const match=heading(chunks[index].source_text);if(match){start=index;level=match.level;break;}}
    if(start<0)return[];const selected=[];const first=chunks[start];
    for(let index=start;index<chunks.length;index+=1){const item=chunks[index];const match=index===start?null:heading(item.source_text);if(match&&match.level<=level)break;if(item.char_end-first.char_start>EVIDENCE_SOURCE_MAX_CHARS)break;selected.push(item);if(new Set(selected.flatMap((entry)=>[entry.paragraph_start,entry.paragraph_end]).filter(Number.isInteger)).size>EVIDENCE_SOURCE_MAX_PARAGRAPHS){selected.pop();break;}}
    return selected.some((item)=>item.chunk_id===anchor.chunk_id)?selected:[];
  }

  boundedWindow(chunks,anchor){
    const position=chunks.findIndex((item)=>item.chunk_id===anchor.chunk_id);let start=position;let end=position;
    while(start>0&&position-start<2&&!heading(chunks[start-1].source_text))start-=1;
    while(end+1<chunks.length&&end-position<4&&!heading(chunks[end+1].source_text))end+=1;
    let selected=chunks.slice(start,end+1);while(selected.length>1&&(selected.at(-1).char_end-selected[0].char_start>EVIDENCE_SOURCE_MAX_CHARS||new Set(selected.flatMap((item)=>[item.paragraph_start,item.paragraph_end]).filter(Number.isInteger)).size>EVIDENCE_SOURCE_MAX_PARAGRAPHS)){if(position-start>=end-position){selected.shift();start+=1;}else selected.pop();}
    return selected;
  }
}
