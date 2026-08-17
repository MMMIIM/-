import dotenv from 'dotenv';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPool } from './db.js';

const directory = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(directory, '../.env') });
const pool = createPool();
try {
  const sql = await readFile(resolve(directory, '../migrations/001_project_foundation.sql'), 'utf8');
  await pool.query(sql);
  console.log('Applied migration: 001_project_foundation.sql');
} finally {
  await pool.end();
}
