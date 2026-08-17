import dotenv from 'dotenv';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPool } from './db.js';

const directory = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(directory, '../.env') });
const pool = createPool();
try {
  const migrationsDirectory = resolve(directory, '../migrations');
  const migrations = (await readdir(migrationsDirectory))
    .filter((fileName) => fileName.endsWith('.sql'))
    .sort();

  for (const fileName of migrations) {
    const sql = await readFile(resolve(migrationsDirectory, fileName), 'utf8');
    await pool.query(sql);
    console.log(`Applied migration: ${fileName}`);
  }
} finally {
  await pool.end();
}
