import { createHmac, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { pool } from "@/db";
import { sameOrigin } from "@/lib/request-origin";
import { SESSION_COOKIE_NAME, verifyToken } from "@/lib/utils";
import { activePromotion, excludedPromotionPath } from "@/lib/promotion-schema";
import { getPromotionSettings } from "@/lib/promotion-store";
import { publicRouteExists } from "@/lib/quality-store";
const schema = z
  .object({
    id: z.string().uuid(),
    visit: z.string().uuid(),
    event: z.enum(["view", "close", "click"]),
    path: z
      .string()
      .max(255)
      .regex(/^\/(?!\/)[^?#\s]*$/),
  })
  .strict();
const salt = randomBytes(32);
const quota = new Map<string, { until: number; count: number }>();
const seen = new Map<string, number>();
let cleanedDay = "";
const headers = { "Cache-Control": "no-store" };
export async function POST(request: NextRequest) {
  if (
    !sameOrigin(request) ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    return new NextResponse(null, { status: 403, headers });
  if (Number(request.headers.get("content-length") ?? 0) > 2048)
    return new NextResponse(null, { status: 413, headers });
  const raw = await request.text();
  if (raw.length > 2048)
    return new NextResponse(null, { status: 413, headers });
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return new NextResponse(null, { status: 400, headers });
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success || excludedPromotionPath(parsed.data.path))
    return new NextResponse(null, { status: 400, headers });
  const body = parsed.data;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (
    request.headers.get("dnt") === "1" ||
    request.headers.get("sec-gpc") === "1" ||
    /bot|crawler|spider|headless|playwright/i.test(
      request.headers.get("user-agent") ?? "",
    ) ||
    (token && verifyToken(token)?.role === "admin")
  )
    return new NextResponse(null, { status: 204, headers });
  const now = Date.now();
  for (const [key, entry] of quota) if (entry.until <= now) quota.delete(key);
  for (const [key, until] of seen) if (until <= now) seen.delete(key);
  const network =
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  const key = createHmac("sha256", salt).update(network).digest("hex");
  const limit = quota.get(key) ?? { until: now + 60000, count: 0 };
  if (
    limit.count >= 60 ||
    (!quota.has(key) && quota.size >= 10000) ||
    seen.size >= 20000
  )
    return new NextResponse(null, {
      status: 429,
      headers: { ...headers, "Retry-After": "60" },
    });
  limit.count++;
  quota.set(key, limit);
  const dedup = `${key}:${body.id}:${body.visit}:${body.event}`;
  if (seen.has(dedup)) return new NextResponse(null, { status: 204, headers });
  try {
    const promotion = activePromotion((await getPromotionSettings()).published);
    if (!promotion || promotion.id !== body.id || !promotion.statisticsEnabled)
      return new NextResponse(null, { status: 204, headers });
    if (!(await publicRouteExists(body.path)))
      return new NextResponse(null, { status: 404, headers });
    seen.set(dedup, now + 1800000);
    try {
      await pool.query(
        "INSERT INTO analytics_daily(day,path,event,count) VALUES((now() AT TIME ZONE 'Asia/Jakarta')::date,$1,$2,1) ON CONFLICT(day,path,event) DO UPDATE SET count=least(analytics_daily.count+1,999999999)",
        [body.path, `p:${body.id}:${body.event}`],
      );
      const day = new Date().toLocaleDateString("en-CA", {
        timeZone: "Asia/Jakarta",
      });
      if (day !== cleanedDay) {
        await pool.query(
          "DELETE FROM analytics_daily WHERE day < (now() AT TIME ZONE 'Asia/Jakarta')::date-179",
        );
        cleanedDay = day;
      }
    } catch (error) {
      seen.delete(dedup);
      throw error;
    }
    return new NextResponse(null, { status: 204, headers });
  } catch {
    return new NextResponse(null, { status: 503, headers });
  }
}
