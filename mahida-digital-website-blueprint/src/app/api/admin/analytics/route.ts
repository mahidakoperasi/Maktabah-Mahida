import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { pool } from '@/db';
import { requireAdminAccess } from '@/lib/admin-auth';
import { sameOrigin } from '@/lib/request-origin';
import { analyticsEnabled } from '@/lib/routine-analytics';
const headers = { 'Cache-Control': 'private, no-store' };
export async function GET(request: NextRequest) {
  if (!(await requireAdminAccess(request, 'primary')))
    return NextResponse.json(
      { error: 'Tidak diizinkan' },
      { status: 403, headers },
    );
  const days = [7, 30, 90].includes(
    Number(request.nextUrl.searchParams.get('days')),
  )
    ? Number(request.nextUrl.searchParams.get('days'))
    : 30;
  const since =
    "day >= (now() AT TIME ZONE 'Asia/Jakarta')::date-($1::integer-1)";
  const result = await Promise.allSettled([
    pool.query(
      `SELECT event,sum(count)::bigint AS count FROM analytics_daily WHERE ${since} GROUP BY event ORDER BY count DESC`,
      [days],
    ),
    pool.query(
      `SELECT path,sum(count)::bigint AS count FROM analytics_daily WHERE ${since} AND event='pageview' GROUP BY path ORDER BY count DESC,path LIMIT 50`,
      [days],
    ),
    pool.query(
      `SELECT day::text,event,sum(count)::bigint AS count FROM analytics_daily WHERE ${since} GROUP BY day,event ORDER BY day,event`,
      [days],
    ),
    pool.query(
      `SELECT path,event,sum(count)::bigint AS count FROM analytics_daily WHERE ${since} AND event<>'pageview' GROUP BY path,event ORDER BY count DESC,path LIMIT 50`,
      [days],
    ),
  ]);
  const rows = result.map((r) => {
    if (r.status !== 'fulfilled') throw r.reason;
    return r.value.rows.map((row) => ({ ...row, count: Number(row.count) }));
  });
  return NextResponse.json(
    {
      enabled: await analyticsEnabled(),
      days,
      events: rows[0],
      pages: rows[1],
      daily: rows[2],
      clicks: rows[3],
    },
    { headers },
  );
}
export async function PUT(request: NextRequest) {
  const admin = await requireAdminAccess(request, 'primary');
  if (!admin || !sameOrigin(request))
    return NextResponse.json(
      { error: 'Tidak diizinkan' },
      { status: 403, headers },
    );
  const body = z
    .object({ enabled: z.boolean() })
    .strict()
    .safeParse(await request.json().catch(() => null));
  if (!body.success)
    return NextResponse.json(
      { error: 'Data tidak valid' },
      { status: 400, headers },
    );
  await pool.query(
    "INSERT INTO settings(key,value) VALUES('routine_analytics',$1) ON CONFLICT(key) DO UPDATE SET value=$1,updated_at=now()",
    [JSON.stringify(body.data)],
  );
  await pool.query(
    "INSERT INTO activity_logs(actor_id,action,target_type,target_id,summary) VALUES($1,'updated','analytics','routine',$2)",
    [
      admin.id,
      body.data.enabled
        ? 'Mengaktifkan statistik anonim'
        : 'Menonaktifkan statistik anonim',
    ],
  );
  return NextResponse.json({ enabled: body.data.enabled }, { headers });
}
