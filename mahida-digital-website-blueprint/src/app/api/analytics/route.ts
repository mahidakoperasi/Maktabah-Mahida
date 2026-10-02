import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createHmac, randomBytes } from 'node:crypto';
import { pool } from '@/db';
import { validCmsPath } from '@/lib/cms-paths';
import { publicRouteExists } from '@/lib/quality-store';
import { validAnalyticsEvent } from '@/lib/analytics-schema';
import { analyticsEnabled } from '@/lib/routine-analytics';
import { SESSION_COOKIE_NAME, verifyToken } from '@/lib/utils';
import { sameOrigin } from '@/lib/request-origin';
const schema = z
  .object({
    path: z.string().max(255).refine(validCmsPath),
    event: z.string().refine(validAnalyticsEvent),
  })
  .strict();
const salt = randomBytes(32),
  quota = new Map<string, { count: number; until: number }>();
let cleanedDay = '';
const headers = { 'Cache-Control': 'no-store' };
export async function POST(request: NextRequest) {
  if (
    !sameOrigin(request) ||
    request.headers.get('sec-fetch-site') === 'cross-site'
  )
    return NextResponse.json(
      { error: 'Asal tidak valid' },
      { status: 403, headers },
    );
  if (Number(request.headers.get('content-length') ?? 0) > 2048)
    return new NextResponse(null, { status: 413, headers });
  const text = await request.text();
  if (text.length > 2048)
    return new NextResponse(null, { status: 413, headers });
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return new NextResponse(null, { status: 400, headers });
  }
  const body = schema.safeParse(raw);
  if (!body.success) return new NextResponse(null, { status: 400, headers });
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (
    request.headers.get('dnt') === '1' ||
    request.headers.get('sec-gpc') === '1' ||
    /bot|crawler|spider|headless|playwright/i.test(
      request.headers.get('user-agent') ?? '',
    ) ||
    (token && verifyToken(token)?.role === 'admin')
  )
    return new NextResponse(null, { status: 204, headers });
  if (!(await analyticsEnabled()))
    return new NextResponse(null, { status: 204, headers });
  const now = Date.now();
  for (const [key, entry] of quota) if (entry.until < now) quota.delete(key);
  const network =
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown';
  const key = createHmac('sha256', salt).update(network).digest('hex');
  const entry = quota.get(key) ?? { count: 0, until: now + 60000 };
  if (entry.count >= 120 || (!quota.has(key) && quota.size >= 10000))
    return new NextResponse(null, {
      status: 429,
      headers: { ...headers, 'Retry-After': '60' },
    });
  entry.count++;
  quota.set(key, entry);
  try {
    if (!(await publicRouteExists(body.data.path)))
      return new NextResponse(null, { status: 404, headers });
    await pool.query(
      "INSERT INTO analytics_daily(day,path,event,count) VALUES((now() AT TIME ZONE 'Asia/Jakarta')::date,$1,$2,1) ON CONFLICT(day,path,event) DO UPDATE SET count=least(analytics_daily.count+1,999999999)",
      [body.data.path, body.data.event],
    );
    const day = new Date().toLocaleDateString('en-CA', {
      timeZone: 'Asia/Jakarta',
    });
    if (day !== cleanedDay) {
      await pool.query(
        "DELETE FROM analytics_daily WHERE day < (now() AT TIME ZONE 'Asia/Jakarta')::date-180",
      );
      cleanedDay = day;
    }
    return new NextResponse(null, { status: 204, headers });
  } catch {
    return new NextResponse(null, { status: 503, headers });
  }
}
