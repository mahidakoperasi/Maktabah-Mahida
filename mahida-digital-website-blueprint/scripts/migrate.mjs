import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import pg from 'pg';

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

const migrationsDir = path.resolve(process.cwd(), 'drizzle');

function checksum(content) {
  return createHash('sha256').update(content).digest('hex');
}

const pool = new Pool({ connectionString: databaseUrl });

try {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS mahida_migrations (
      filename text PRIMARY KEY,
      checksum text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  const filenames = (await readdir(migrationsDir))
    .filter((name) => /^\d+.*\.sql$/.test(name))
    .sort((a, b) => a.localeCompare(b, 'en'));

  for (const filename of filenames) {
    const fullPath = path.join(migrationsDir, filename);
    const sql = await readFile(fullPath, 'utf8');
    const digest = checksum(sql);

    const existing = await pool.query(
      'SELECT checksum FROM mahida_migrations WHERE filename = $1',
      [filename]
    );

    if (existing.rowCount) {
      if (existing.rows[0].checksum !== digest) {
        throw new Error(
          `Migration ${filename} has changed after it was applied. Create a new migration instead.`
        );
      }
      console.log(`skip  ${filename}`);
      continue;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query(
        'INSERT INTO mahida_migrations (filename, checksum) VALUES ($1, $2)',
        [filename, digest]
      );
      await client.query('COMMIT');
      console.log(`apply ${filename}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  console.log('Database migrations are up to date.');
} finally {
  await pool.end();
}
