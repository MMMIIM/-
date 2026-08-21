import dotenv from 'dotenv';
import { resolve } from 'node:path';
import { createPool } from '../../src/db.js';
import { parseEmbeddingConfig } from '../../src/pipeline/embedding-client.js';

dotenv.config({ path: resolve('backend/.env'), quiet: true });
const config=parseEmbeddingConfig(process.env),pool=createPool();
try{
  const materials=(await pool.query(`SELECT p.id,p.name,count(DISTINCT m.id)::int AS materials,count(DISTINCT c.chunk_id)::int AS chunks,count(DISTINCT e.embedding_id)::int AS embeddings FROM projects p JOIN company_materials m ON m.project_id=p.id AND m.extraction_status='succeeded' LEFT JOIN material_chunks c ON c.material_id=m.id LEFT JOIN material_chunk_embeddings e ON e.chunk_id=c.chunk_id AND e.chunk_hash=c.chunk_hash GROUP BY p.id,p.name ORDER BY chunks DESC`)).rows;
  const requirements=(await pool.query(`SELECT p.id,p.name,count(DISTINCT r.id)::int AS confirmed_requirements FROM projects p JOIN requirements r ON r.project_id=p.id JOIN requirement_baselines b ON b.id=r.baseline_id AND b.status='confirmed' GROUP BY p.id,p.name ORDER BY confirmed_requirements DESC`)).rows;
  const combined=materials.filter((material)=>requirements.some((requirement)=>requirement.id===material.id)).map((material)=>({...material,confirmed_requirements:requirements.find((requirement)=>requirement.id===material.id).confirmed_requirements}));
  process.stdout.write(`${JSON.stringify({provider_category:'openai_compatible',provider_host:new URL(config.apiBase).host,model:config.model,version:config.version,dimension:config.dimension,combined_projects:combined,material_projects:materials,requirement_projects:requirements},null,2)}\n`);
}finally{await pool.end();}
