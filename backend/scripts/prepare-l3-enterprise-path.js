import dotenv from 'dotenv';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPool, PgRepository } from '../src/db.js';
import { LocalFileStorage } from '../src/storage.js';
import { CompanyMaterialService } from '../src/company-material-service.js';
import { extractTenderText } from '../src/tender-text-extractor.js';
import { loadL3SyntheticManifest, validateL3SyntheticManifest } from '../eval/corpus/l3-synthetic-enterprise/build.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const backend = path.resolve(here, '..');
const workspace = path.resolve(backend, '..');
dotenv.config({ path: path.resolve(backend, '.env'), quiet: true });

const PROJECT_NAME = 'STAGE20-L3-SYNTHETIC-ENTERPRISE [NOT_REAL_CUSTOMER_DATA]';
const corpusDir = path.resolve(backend, 'eval/corpus/l3-synthetic-enterprise');
const sha = (buffer) => createHash('sha256').update(buffer).digest('hex');
const materialType = (value) => ({
  company_profile: 'company_profile', qualification: 'qualification', case: 'project_case',
  product: 'product_documentation', personnel: 'personnel', technical_capability: 'technical_solution',
  implementation: 'delivery_capability', after_sales: 'delivery_capability', authorization: 'other', other: 'other',
}[value] || 'other');

async function main() {
  const manifest = loadL3SyntheticManifest();
  const validation = validateL3SyntheticManifest(manifest);
  if (!validation.ok) throw new Error(`SYNTHETIC_MANIFEST_INVALID:${validation.errors.join(',')}`);
  const pool = createPool();
  const repository = new PgRepository(pool);
  const storage = new LocalFileStorage(path.resolve(workspace, 'uploads'));
  const service = new CompanyMaterialService({ repository, storage, textExtractor: extractTenderText });
  try {
    let project = (await pool.query('SELECT * FROM projects WHERE name=$1 ORDER BY created_at LIMIT 1', [PROJECT_NAME])).rows[0];
    if (!project) project = await repository.createProject({ name: PROJECT_NAME, status: 'corpus' });
    const materialIds = [];
    for (const definition of manifest.materials) {
      const fileName = definition.source_reference;
      const buffer = await readFile(path.join(corpusDir, fileName));
      const fileHash = sha(buffer);
      let material = await repository.findCompanyMaterialByHash(project.id, fileHash);
      if (!material) {
        material = await service.upload({
          projectId: project.id,
          file: { originalname: fileName, mimetype: 'text/markdown', size: buffer.length, buffer },
          materialType: materialType(definition.material_type),
        });
      }
      const updated = (await pool.query(`
        UPDATE company_materials
        SET corpus_scope='ENTERPRISE_PRIVATE', industry=$2, source_org=$3, source_type='synthetic_controlled',
            authority_level='synthetic_test', usage_status='ACTIVE_FULLTEXT', quality_score=$4,
            review_status='approved', lifecycle_status='ACTIVE', index_status='INDEXED',
            review_notes=$5, synthetic_test_material=true, updated_at=now()
        WHERE id=$1 RETURNING id
      `, [material.id, definition.industry, manifest.subject, definition.quality_score,
        `Synthetic test material; controlled_case=${definition.controlled_case || 'none'}; not real customer data.`])).rows[0];
      materialIds.push(updated.id);
    }
    const counts = (await pool.query(`
      SELECT count(DISTINCT m.id)::int AS materials,
             count(DISTINCT c.chunk_id)::int AS chunks,
             count(DISTINCT CASE WHEN m.synthetic_test_material THEN m.id END)::int AS synthetic_materials
      FROM company_materials m
      LEFT JOIN material_chunks c ON c.material_id=m.id
      WHERE m.project_id=$1 AND m.corpus_scope='ENTERPRISE_PRIVATE'
    `, [project.id])).rows[0];
    console.log(JSON.stringify({
      ok: true,
      project_id: project.id,
      data_classification: 'REPRESENTATIVE_SYNTHETIC / NOT_REAL_CUSTOMER_DATA',
      materials: counts.materials,
      chunks: counts.chunks,
      synthetic_materials: counts.synthetic_materials,
      controlled_cases: manifest.controlled_cases,
      service_path: 'CompanyMaterialService.upload -> extraction -> chunk -> index',
      provider_calls: 0,
      external_calls: 0,
    }, null, 2));
  } finally {
    await pool.end();
  }
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
