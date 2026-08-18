import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createBackendRuntime } from '../src/backend-runtime.js';
import { createPool, PgRepository } from '../src/db.js';
import { RequirementSourceService } from '../src/requirement-source-service.js';
import { LocalFileStorage } from '../src/storage.js';
import { extractTenderText } from '../src/tender-text-extractor.js';

const parseJobId = process.argv[2];
if (!/^[0-9a-f-]{36}$/i.test(String(parseJobId || ''))) {
  console.error('用法：npm run reconcile:sources -w backend -- <parse-job-uuid>');
  process.exit(2);
}
const directory = dirname(fileURLToPath(import.meta.url));
const runtime = createBackendRuntime();
const pool = createPool(runtime.env.DATABASE_URL);
try {
  const repository = new PgRepository(pool);
  const storage = new LocalFileStorage(runtime.env.UPLOAD_DIR
    ? resolve(directory, '..', runtime.env.UPLOAD_DIR)
    : resolve(directory, '../../uploads'));
  const result = await new RequirementSourceService({ repository, storage, textExtractor: extractTenderText })
    .reconcileRequirementSources(parseJobId);
  console.log(JSON.stringify({ parse_job_id: result.parse_job_id, statistics: result.statistics }, null, 2));
} catch (error) {
  console.error(`${error.code || 'SOURCE_RECONCILIATION_FAILED'}: ${error.message}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
