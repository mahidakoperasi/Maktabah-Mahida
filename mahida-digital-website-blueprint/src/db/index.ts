import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const globalForDb = globalThis as typeof globalThis & {
  __mahidaPostgresqlPool?: Pool;
};

function createPool() {
  const connectionString = process.env.DATABASE_URL;

  return new Pool(
    connectionString
      ? { connectionString }
      : undefined
  );
}

export const pool =
  globalForDb.__mahidaPostgresqlPool ??
  createPool();

if (process.env.NODE_ENV !== "production") {
  globalForDb.__mahidaPostgresqlPool = pool;
}

export const db = drizzle(pool);
