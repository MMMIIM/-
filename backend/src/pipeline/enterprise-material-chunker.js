import { createHash } from 'node:crypto';

export const ENTERPRISE_MATERIAL_CHUNKER_VERSION='enterprise-material-v1';
const MAX_CHARS=1200;

const sha=(value)=>createHash('sha256').update(value).digest('hex');

export function chunkEnterpriseMaterial(materialId, extractedText, { maxChars=MAX_CHARS, chunkerVersion=ENTERPRISE_MATERIAL_CHUNKER_VERSION }={}) {
  const source=String(extractedText ?? '');
  const segments=[];
  const matches=[...source.matchAll(/\S[\s\S]*?(?=\r?\n\s*\r?\n|$)/g)];
  for(let paragraph=0;paragraph<matches.length;paragraph+=1){
    const raw=matches[paragraph][0]; const base=matches[paragraph].index;
    for(let offset=0;offset<raw.length;offset+=maxChars){
      const text=raw.slice(offset,offset+maxChars); if(!text.trim())continue;
      segments.push({source_text:text,char_start:base+offset,char_end:base+offset+text.length,paragraph_start:paragraph+1,paragraph_end:paragraph+1});
    }
  }
  return segments.map((item,chunkIndex)=>{
    const chunkHash=sha(item.source_text);
    return {chunk_id:`MCH-${sha(`${materialId}|${chunkerVersion}|${chunkIndex}|${item.char_start}|${item.char_end}|${chunkHash}`).slice(0,32).toUpperCase()}`,material_id:materialId,chunk_index:chunkIndex,...item,page_start:null,page_end:null,section:null,chunk_hash:chunkHash,chunker_version:chunkerVersion};
  });
}
