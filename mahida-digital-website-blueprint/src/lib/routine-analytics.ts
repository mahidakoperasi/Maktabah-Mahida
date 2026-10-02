import { pool } from '@/db';
export async function analyticsEnabled() {
  try {
    const row = (
      await pool.query(
        "SELECT value FROM settings WHERE key='routine_analytics'",
      )
    ).rows[0];
    return row ? JSON.parse(row.value).enabled === true : false;
  } catch {
    return false;
  }
}
