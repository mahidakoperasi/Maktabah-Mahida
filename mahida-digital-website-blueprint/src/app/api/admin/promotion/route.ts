import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { pool } from "@/db";
import { requireAdminAccess } from "@/lib/admin-auth";
import { sameOrigin } from "@/lib/request-origin";
import { checkDriveImages } from "@/lib/drive-image-check";
import {
  PROMOTION_KEY,
  emptyPromotion,
  promotionSchema,
  type PromotionSettings,
} from "@/lib/promotion-schema";
import {
  getPromotionSettings,
  promotionStatistics,
} from "@/lib/promotion-store";
const headers = { "Cache-Control": "private, no-store" };
const schema = z
  .object({
    action: z.enum(["save", "publish", "pause"]),
    protectionEnabled: z.boolean(),
    draft: promotionSchema,
  })
  .strict();
export async function GET(request: NextRequest) {
  if (!(await requireAdminAccess(request, "primary")))
    return NextResponse.json(
      { error: "Tidak diizinkan" },
      { status: 403, headers },
    );
  const settings = await getPromotionSettings();
  return NextResponse.json(
    {
      ...settings,
      observedAt: Date.now(),
      draft: settings.draft ?? emptyPromotion(randomUUID()),
      statistics: await promotionStatistics(settings.published?.id),
    },
    { headers },
  );
}
export async function PUT(request: NextRequest) {
  if (!sameOrigin(request) || !(await requireAdminAccess(request, "primary")))
    return NextResponse.json(
      { error: "Tidak diizinkan" },
      { status: 403, headers },
    );
  if (Number(request.headers.get("content-length") ?? 0) > 12000)
    return new NextResponse(null, { status: 413, headers });
  const raw = await request.text();
  if (raw.length > 12000)
    return new NextResponse(null, { status: 413, headers });
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return NextResponse.json(
      { error: "Data tidak valid" },
      { status: 400, headers },
    );
  }
  const body = schema.safeParse(json);
  if (!body.success)
    return NextResponse.json(
      { error: body.error.issues[0]?.message ?? "Data tidak valid" },
      { status: 400, headers },
    );
  const { action, draft, protectionEnabled } = body.data;
  if (action === "publish") {
    if (
      !draft.title ||
      !draft.posterUrl ||
      !draft.buttonLabel ||
      !draft.buttonUrl ||
      !draft.enabled
    )
      return NextResponse.json(
        {
          error:
            "Lengkapi judul, poster, tombol dan tujuan; aktifkan promosi sebelum menerbitkan.",
        },
        { status: 400, headers },
      );
    if (draft.endsAt && Date.parse(draft.endsAt) <= Date.now())
      return NextResponse.json(
        { error: "Jadwal selesai sudah lewat." },
        { status: 400, headers },
      );
    try {
      await checkDriveImages([draft.posterUrl]);
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Poster belum dapat diperiksa.",
        },
        { status: 400, headers },
      );
    }
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Serializes the first write too, without adding a new table or migration.
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtext('mahida-content-promotion'))",
    );
    const old = (
      await client.query("SELECT value FROM settings WHERE key=$1 FOR UPDATE", [
        PROMOTION_KEY,
      ])
    ).rows[0];
    const stored = old
      ? (JSON.parse(old.value) as PromotionSettings)
      : { published: null };
    const published =
      action === "publish"
        ? draft
        : action === "pause" && stored.published
          ? { ...stored.published, enabled: false }
          : stored.published;
    const value: PromotionSettings = { protectionEnabled, draft, published };
    await client.query(
      "INSERT INTO settings(key,type,value,updated_at) VALUES($1,'json',$2,now()) ON CONFLICT(key) DO UPDATE SET value=excluded.value,type='json',updated_at=now()",
      [PROMOTION_KEY, JSON.stringify(value)],
    );
    await client.query("COMMIT");
    return NextResponse.json(
      {
        ...value,
        observedAt: Date.now(),
        statistics: await promotionStatistics(published?.id),
      },
      { headers },
    );
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Promotion save failed", error);
    return NextResponse.json(
      { error: "Pengaturan belum tersimpan. Coba lagi." },
      { status: 500, headers },
    );
  } finally {
    client.release();
  }
}
