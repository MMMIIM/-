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
import { CompanyMaterialService } from './company-material-service.js';
import { EvidenceService } from './evidence-service.js';
import { createWriterProvider } from './pipeline/writer-provider.js';
import { DocumentGenerationService } from './pipeline/document-generation-service.js';
import { createEmbeddingClientFromEnv } from './pipeline/embedding-client.js';
import { EnterpriseRetrievalService } from './pipeline/enterprise-retrieval-service.js';

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
const productionBetaService = new ProductionBetaService({ repository, ordinaryUncoveredSeverity:runtimeEnv.V43_ORDINARY_UNCOVERED_SEVERITY });
const requirementSourceService = new RequirementSourceService({ repository, storage, textExtractor: extractTenderText });
const companyMaterialService = new CompanyMaterialService({ repository, storage, textExtractor: extractTenderText });
const evidenceService = new EvidenceService({ repository });
const enterpriseRetrievalService = new EnterpriseRetrievalService({ repository, embeddingClient:createEmbeddingClientFromEnv({env:runtimeEnv}), defaultTopK:runtimeEnv.V43_RETRIEVAL_TOP_K || 5 });
const documentGenerationService = new DocumentGenerationService({ repository, provider:createWriterProvider({env:runtimeEnv}), concurrency:runtimeEnv.V43_WRITER_CONCURRENCY || 2 });
const app = createApp({
  repository,
  storage,
  generationService,
  requirementParseService,
  productionBetaService,
  requirementSourceService,
  companyMaterialService,
  evidenceService,
  enterpriseRetrievalService,
  documentGenerationService,
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
