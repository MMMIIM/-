import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { createPool, PgRepository } from './db.js';
import { createDifyClient } from './dify.js';
import { GenerationService } from './service.js';
import { LocalFileStorage } from './storage.js';
import { extractTenderText } from './tender-text-extractor.js';
import { RequirementParseService } from './requirement-parse-service.js';
import { createRequirementExtractionGateway } from './pipeline/requirement-extraction.js';
import { createBackendRuntime } from './backend-runtime.js';
import { ProductionBetaService } from './pipeline/production-beta-service.js';
import { RequirementSourceService } from './requirement-source-service.js';

const directory = dirname(fileURLToPath(import.meta.url));
const runtime = createBackendRuntime();
const runtimeEnv = runtime.env;

const pool = createPool(runtimeEnv.DATABASE_URL);
const repository = new PgRepository(pool);
const storage = new LocalFileStorage(
  runtimeEnv.UPLOAD_DIR ? resolve(directory, '..', runtimeEnv.UPLOAD_DIR) : resolve(directory, '../../uploads')
);
const difyClient = createDifyClient({ apiBase: runtimeEnv.DIFY_API_BASE, apiKey: runtimeEnv.DIFY_API_KEY });
const generationService = new GenerationService({
  repository,
  difyClient,
  workflowVersion: runtimeEnv.DIFY_WORKFLOW_VERSION || '4.2'
});
const requirementParseService = new RequirementParseService({
  repository,
  storage,
  textExtractor: extractTenderText,
  extractionGateway: createRequirementExtractionGateway(runtime.createSemanticGatewayClient()),
  env: runtimeEnv
});
const productionBetaService = new ProductionBetaService({ repository });
const requirementSourceService = new RequirementSourceService({ repository, storage, textExtractor: extractTenderText });
const app = createApp({
  repository,
  storage,
  generationService,
  requirementParseService,
  productionBetaService,
  requirementSourceService,
  corsOrigin: runtimeEnv.CORS_ORIGIN
});

const port = Number(runtimeEnv.PORT || 3001);
const host = runtimeEnv.HOST || '127.0.0.1';
const server = app.listen(port, host, () => console.log(`Backend listening on http://${host}:${port}`));

async function shutdown() {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
