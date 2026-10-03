import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { pool } from "@/db";
import { requireAdminAccess } from "@/lib/admin-auth";
import { sameOrigin } from "@/lib/request-origin";
import { logActivity } from "@/lib/activity-log";
import { slugify } from "@/lib/utils";
import {
  adminBooks,
  fans,
  librarySettings,
  syncBook,
} from "@/lib/maktabah-store";
import {
  bookSchema,
  fanSchema,
  librarySettingsSchema,
  docsId,
} from "@/lib/maktabah-schema";
import { fetchDocs, docsConfigured, DocsError } from "@/lib/google-docs";
const input = z.object({
  action: z.enum([
    "save",
    "publish",
    "archive",
    "sync",
    "test",
    "preview",
    "pause",
    "fan",
    "layout-save",
    "layout-publish",
  ]),
  id: z.number().int().positive().optional(),
  revision: z.number().int().nonnegative(),
  meta: bookSchema.optional(),
  fan: fanSchema.optional(),
  settings: librarySettingsSchema.optional(),
  paused: z.boolean().optional(),
});
export async function GET(request: NextRequest) {
  if (!(await requireAdminAccess(request, "content")))
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });
  const [books, fanList, settings] = await Promise.all([
    adminBooks(),
    fans(),
    librarySettings(),
  ]);
  return NextResponse.json(
    { books, fans: fanList, settings, docsConfigured: docsConfigured() },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
export async function POST(request: NextRequest) {
  const admin = await requireAdminAccess(request, "content");
  if (!admin || !sameOrigin(request))
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 403 });
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data tidak valid." },
      { status: 400 },
    );
  const data = parsed.data;
  const client = await pool.connect();
  let id = data.id;
  try {
    if (["sync", "test", "preview"].includes(data.action)) {
      if (!id) throw new DocsError(400, "Pilih kitab.");
      const result = await syncBook(id, true, data.action !== "sync");
      return NextResponse.json({
        ok: true,
        result:
          data.action === "test"
            ? {
                title: result.title,
                chapters: result.chapters.length,
                warnings: result.warnings,
              }
            : result,
      });
    }
    await client.query("BEGIN");
    if (data.action.startsWith("layout-")) {
      if (!data.settings) throw new DocsError(400, "Pengaturan belum lengkap.");
      await client.query(
        "INSERT INTO settings(key,type,value) VALUES('maktabah_library','json','{}') ON CONFLICT(key) DO NOTHING",
      );
      const row = (
        await client.query(
          "SELECT value FROM settings WHERE key='maktabah_library' FOR UPDATE",
        )
      ).rows[0];
      const previous = JSON.parse(row.value ?? "{}");
      if (Number(previous.revision ?? 0) !== data.revision)
        throw new DocsError(
          409,
          "Pengaturan berubah. Muat ulang sebelum menyimpan.",
        );
      const next = {
        ...previous,
        draft: data.settings,
        revision: data.revision + 1,
        ...(data.action === "layout-publish"
          ? { published: data.settings }
          : {}),
      };
      await client.query(
        "UPDATE settings SET value=$1 WHERE key='maktabah_library'",
        [JSON.stringify(next)],
      );
    } else if (data.action === "fan") {
      if (!data.fan) throw new DocsError(400, "Fan belum lengkap.");
      const f = data.fan;
      const row = (
        await client.query(
          "SELECT revision FROM maktabah_fans WHERE slug=$1 FOR UPDATE",
          [f.slug],
        )
      ).rows[0];
      if (row && row.revision !== data.revision)
        throw new DocsError(409, "Fan berubah. Muat ulang sebelum menyimpan.");
      await client.query(
        "INSERT INTO maktabah_fans(slug,name,intro,image_url,image_alt,sort_order,visible,revision) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(slug) DO UPDATE SET name=$2,intro=$3,image_url=$4,image_alt=$5,sort_order=$6,visible=$7,revision=$8",
        [
          f.slug,
          f.name,
          f.intro,
          f.imageUrl,
          f.imageAlt,
          f.sortOrder,
          f.visible,
          data.revision + 1,
        ],
      );
    } else {
      if (!id) {
        if (data.action !== "save" || !data.meta)
          throw new DocsError(400, "Simpan kitab terlebih dahulu.");
        const base = slugify(data.meta.title).slice(0, 450) || "kitab";
        id = (
          await client.query(
            "INSERT INTO posts(title,slug,type,karya_category,status) VALUES($1,$2,'work','terjemahan','draft') RETURNING id",
            [data.meta.title, `${base}-${crypto.randomUUID().slice(0, 8)}`],
          )
        ).rows[0].id;
      }
      await client.query("SELECT pg_advisory_xact_lock(71331,$1)", [id]);
      const post = (
        await client.query(
          "SELECT id FROM posts WHERE id=$1 AND type='work' AND karya_category='terjemahan' FOR UPDATE",
          [id],
        )
      ).rows[0];
      if (!post) throw new DocsError(404, "Kitab tidak ditemukan.");
      const previous = (
        await client.query(
          "SELECT * FROM maktabah_books WHERE post_id=$1 FOR UPDATE",
          [id],
        )
      ).rows[0];
      if (Number(previous?.revision ?? 0) !== data.revision)
        throw new DocsError(
          409,
          "Kitab berubah. Muat ulang sebelum menyimpan.",
        );
      if (data.action === "pause") {
        if (!previous)
          throw new DocsError(400, "Simpan kitab terlebih dahulu.");
        await client.query(
          "UPDATE maktabah_books SET sync_paused=$2,revision=revision+1 WHERE post_id=$1",
          [id, data.paused ?? true],
        );
      } else if (data.action === "archive") {
        await client.query(
          "UPDATE posts SET status='archived',updated_at=now(),revision=revision+1 WHERE id=$1",
          [id],
        );
        await client.query(
          "UPDATE maktabah_books SET revision=revision+1 WHERE post_id=$1",
          [id],
        );
      } else {
        if (!data.meta)
          throw new DocsError(400, "Informasi kitab belum lengkap.");
        const meta = data.meta;
        const fanSlugs = [
          ...new Set([meta.primaryFan, ...meta.additionalFans]),
        ];
        const known = (
          await client.query(
            "SELECT slug,visible FROM maktabah_fans WHERE slug=ANY($1::text[])",
            [fanSlugs],
          )
        ).rows;
        if (known.length !== fanSlugs.length)
          throw new DocsError(400, "Pilih fan yang tersedia.");
        const sourceId = docsId(meta.docsUrl);
        let content: Awaited<ReturnType<typeof fetchDocs>> | undefined;
        if (data.action === "publish") {
          if (!known.find((f) => f.slug === meta.primaryFan)?.visible)
            throw new DocsError(
              400,
              "Fan utama harus aktif sebelum kitab diterbitkan.",
            );
          if (sourceId) {
            content = await fetchDocs(sourceId);
            if (!content.chapters.length)
              throw new DocsError(400, "Google Docs belum memiliki isi.");
          } else if (!meta.legacyContent.trim())
            throw new DocsError(
              400,
              "Isi kitab belum tersedia. Hubungkan Google Docs atau lengkapi isi lama.",
            );
        }
        await client.query(
          "INSERT INTO maktabah_books(post_id,draft,revision) VALUES($1,$2,$3) ON CONFLICT(post_id) DO UPDATE SET draft=$2,revision=$3",
          [id, JSON.stringify(meta), data.revision + 1],
        );
        if (data.action === "publish") {
          await client.query(
            "UPDATE maktabah_books SET published=$2,chapters=$3,document_id=$4,content_hash=$5,blocked=false,sync_error=$6,last_checked_at=CASE WHEN $4 <> '' THEN now() ELSE NULL END,last_synced_at=CASE WHEN $4 <> '' THEN now() ELSE NULL END WHERE post_id=$1",
            [
              id,
              JSON.stringify(meta),
              JSON.stringify(content?.chapters ?? []),
              sourceId ?? "",
              content?.hash ?? "",
              content?.warnings.join(" ") ?? "",
            ],
          );
          await client.query(
            "UPDATE posts SET title=$2,excerpt=$3,featured_image=$4,content_raw=CASE WHEN $6 THEN content_raw ELSE $5 END,status='published',published_at=COALESCE(published_at,now()),updated_at=now(),revision=revision+1 WHERE id=$1",
            [
              id,
              meta.title,
              meta.summary,
              meta.coverUrl,
              meta.legacyContent,
              Boolean(sourceId),
            ],
          );
        }
      }
    }
    await client.query("COMMIT");
    await logActivity({
      actorId: admin.id,
      action: data.action.includes("publish")
        ? "published"
        : data.action === "archive"
          ? "archived"
          : "updated",
      targetType: "maktabah",
      targetId: id,
      summary: `Maktabah: ${data.action}`,
    });
    return NextResponse.json({ ok: true, id, revision: data.revision + 1 });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    return NextResponse.json(
      {
        error:
          error instanceof DocsError
            ? error.message
            : "Penyimpanan Maktabah gagal. Coba kembali.",
      },
      { status: error instanceof DocsError ? error.status : 500 },
    );
  } finally {
    client.release();
  }
}
