export class EmbeddingError extends Error{
  constructor(code,message,status=502){super(message);this.name='EmbeddingError';this.code=code;this.status=status;}
}

const positive=(value,fallback)=>{const parsed=Number(value);return Number.isInteger(parsed)&&parsed>0?parsed:fallback;};
const base=(value)=>String(value||'').trim().replace(/\/+$/,'');

export function parseEmbeddingConfig(env={}){return Object.freeze({apiBase:base(env.V43_EMBEDDING_API_BASE),apiKey:String(env.V43_EMBEDDING_API_KEY||'').trim(),model:String(env.V43_EMBEDDING_MODEL||'text-embedding-3-small').trim(),version:String(env.V43_EMBEDDING_VERSION||'1').trim(),dimension:positive(env.V43_EMBEDDING_DIMENSION,1536),timeoutMs:positive(env.V43_EMBEDDING_TIMEOUT_MS,30000)});}

export class EmbeddingClient{
  constructor({apiBase,apiKey,model,version,dimension,timeoutMs=30000,fetchImpl=fetch}){Object.assign(this,{apiBase:base(apiBase),apiKey:String(apiKey||'').trim(),model,version,dimension,timeoutMs,fetchImpl});}
  async embed(texts){
    if(!this.apiBase||!this.apiKey||!this.model||!this.version)throw new EmbeddingError('EMBEDDING_NOT_CONFIGURED','Embedding 服务未完整配置。',500);
    if(!Array.isArray(texts)||!texts.length||texts.some((item)=>typeof item!=='string'||!item.trim()))throw new EmbeddingError('EMBEDDING_INPUT_INVALID','Embedding 输入必须是非空文本数组。',422);
    const controller=new AbortController();let timedOut=false;const timer=setTimeout(()=>{timedOut=true;controller.abort();},this.timeoutMs);let response;
    try{response=await this.fetchImpl(`${this.apiBase}/embeddings`,{method:'POST',headers:{Authorization:`Bearer ${this.apiKey}`,'Content-Type':'application/json'},body:JSON.stringify({model:this.model,input:texts,dimensions:this.dimension}),signal:controller.signal});}
    catch(error){if(timedOut||error?.name==='AbortError')throw new EmbeddingError('EMBEDDING_TIMEOUT','Embedding 服务超时。',504);throw new EmbeddingError('EMBEDDING_NETWORK_ERROR','Embedding 服务网络请求失败。');}finally{clearTimeout(timer);}
    if(!response.ok)throw new EmbeddingError('EMBEDDING_HTTP_ERROR','Embedding 服务返回非成功状态。');let payload;try{payload=await response.json();}catch{throw new EmbeddingError('EMBEDDING_RESPONSE_INVALID','Embedding 服务返回无效 JSON。');}
    const ordered=Array.isArray(payload?.data)?[...payload.data].sort((a,b)=>a.index-b.index):[];if(ordered.length!==texts.length)throw new EmbeddingError('EMBEDDING_RESPONSE_INVALID','Embedding 数量与输入不一致。');
    const vectors=ordered.map((item)=>item.embedding);if(vectors.some((vector)=>!Array.isArray(vector)||vector.length!==this.dimension||vector.some((value)=>!Number.isFinite(value))))throw new EmbeddingError('EMBEDDING_DIMENSION_MISMATCH','Embedding 维度或数值无效。');return vectors;
  }
}

export const createEmbeddingClientFromEnv=({env=process.env,fetchImpl=fetch}={})=>new EmbeddingClient({...parseEmbeddingConfig(env),fetchImpl});
