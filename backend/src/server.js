import dotenv from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { createPool, PgRepository } from './db.js';
import { createDifyClient } from './dify.js';
import { GenerationService } from './service.js';
import { LocalFileStorage } from './storage.js';

const directory = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(directory, '../.env') });

const pool = createPool();
const repository = new PgRepository(pool);
const storage = new LocalFileStorage(
  process.env.UPLOAD_DIR ? resolve(directory, '..', process.env.UPLOAD_DIR) : resolve(directory, '../../uploads')
);
const difyClient = createDifyClient({ apiBase: process.env.DIFY_API_BASE, apiKey: process.env.DIFY_API_KEY });
const generationService = new GenerationService({
  repository,
  difyClient,
  workflowVersion: process.env.DIFY_WORKFLOW_VERSION || '4.2'
});
const app = createApp({ repository, storage, generationService, corsOrigin: process.env.CORS_ORIGIN });

const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || '127.0.0.1';
const server = app.listen(port, host, () => console.log(`Backend listening on http://${host}:${port}`));

async function shutdown() {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
