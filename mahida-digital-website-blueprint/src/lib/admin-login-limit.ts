import { pool } from '@/db';

const MAX_ATTEMPTS = 10;

export async function allowAdminLogin(userId: number): Promise<boolean> {
  const result = await pool.query<{ attempts: number }>(
    `INSERT INTO login_rate_limits (user_id, attempts, window_start)
     VALUES ($1, 1, now())
     ON CONFLICT (user_id) DO UPDATE SET
       attempts = CASE
         WHEN login_rate_limits.window_start <= now() - interval '15 minutes' THEN 1
         ELSE LEAST(login_rate_limits.attempts + 1, 11)
       END,
       window_start = CASE
         WHEN login_rate_limits.window_start <= now() - interval '15 minutes' THEN now()
         ELSE login_rate_limits.window_start
       END
     RETURNING attempts`,
    [userId]
  );

  return (result.rows[0]?.attempts ?? MAX_ATTEMPTS + 1) <= MAX_ATTEMPTS;
}
