import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const migrationPath = fileURLToPath(new URL('../../migrations/001_initial.sql', import.meta.url));
await pool.query(await readFile(migrationPath, 'utf8'));
await pool.end();
console.log('Database migration applied.');
