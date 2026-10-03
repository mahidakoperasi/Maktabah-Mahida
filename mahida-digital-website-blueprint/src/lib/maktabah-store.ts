import "server-only";
import { createHash } from "node:crypto";
import { pool } from "@/db";
import {
  bookSchema,
  defaultLibrarySettings,
  librarySettingsSchema,
  type BookMeta,
  type Fan,
  type LibrarySettings,
  docsId,
} from "./maktabah-schema";
import { legacyChapters, type Chapter } from "./kitab-content";
import { fetchDocs, DocsError, docsConfigured } from "./google-docs";
export type Book = {
  id: number;
  slug: string;
  meta: BookMeta;
  chapters: Chapter[];
  contentHash: string;
  publishedAt: string | null;
  sourceBlocked: boolean;
};
export type BookRow = {
  post_id: number;
  slug: string;
  title: string;
  author_name: string | null;
  excerpt: string | null;
  content_raw: string | null;
  featured_image: string | null;
  status: string;
  published_at: string | null;
  draft: BookMeta | null;
  published: BookMeta | null;
  revision: number;
  chapters: Chapter[];
  document_id: string;
  content_hash: string;
  sync_paused: boolean;
  blocked: boolean;
  sync_error: string;
  last_checked_at: string | null;
  last_synced_at: string | null;
};
export function legacyMeta(
  row: Pick<BookRow, "title" | "excerpt" | "featured_image"> & {
    content_raw?: string | null;
    author_name?: string | null;
  },
): BookMeta {
  return bookSchema.parse({
    title: row.title,
    summary: row.excerpt ?? "",
    coverUrl: row.featured_image ?? "",
    legacyContent: row.content_raw ?? "",
    contributorName: row.author_name ?? "",
  });
}
export async function librarySettings(preview = false): Promise<{
  draft: LibrarySettings;
  published: LibrarySettings;
  revision: number;
}> {
  const { rows } = await pool.query(
    "SELECT value FROM settings WHERE key='maktabah_library'",
  );
  let value: { draft?: unknown; published?: unknown; revision?: number } = {};
  try {
    value = JSON.parse(rows[0]?.value ?? "{}");
  } catch {}
  const fallback = { ...defaultLibrarySettings };
  if (!librarySettingsSchema.safeParse(value.published).success) {
    const page = (
      await pool.query(
        "SELECT title,intro,body FROM cms_pages WHERE path='/maktabah'",
      )
    ).rows[0];
    if (page?.intro) fallback.intro = page.intro;
    if (page?.body) fallback.about = page.body;
    if (page?.title && page.title !== "Maktabah") fallback.name = page.title;
  }
  const published = librarySettingsSchema.safeParse(value.published);
  const draft = librarySettingsSchema.safeParse(value.draft);
  return {
    draft: draft.success ? draft.data : fallback,
    published:
      preview && draft.success
        ? draft.data
        : published.success
          ? published.data
          : fallback,
    revision: Number(value.revision ?? 0),
  };
}
export async function fans(): Promise<Fan[]> {
  return (
    await pool.query(
      'SELECT slug,name,intro,image_url AS "imageUrl",image_alt AS "imageAlt",sort_order AS "sortOrder",visible,revision FROM maktabah_fans ORDER BY sort_order,slug',
    )
  ).rows;
}
const select = `SELECT p.id AS post_id,p.slug,p.title,a.name AS author_name,p.excerpt,COALESCE(NULLIF(p.content_raw,''),p.content) AS content_raw,p.featured_image,p.status,p.published_at,m.draft,m.published,COALESCE(m.revision,0) AS revision,COALESCE(m.chapters,'[]'::jsonb) AS chapters,COALESCE(m.document_id,'') AS document_id,COALESCE(m.content_hash,'') AS content_hash,COALESCE(m.sync_paused,false) AS sync_paused,COALESCE(m.blocked,false) AS blocked,COALESCE(m.sync_error,'') AS sync_error,m.last_checked_at,m.last_synced_at FROM posts p LEFT JOIN authors a ON a.id=p.author_id LEFT JOIN maktabah_books m ON m.post_id=p.id WHERE p.type='work' AND p.karya_category='terjemahan'`;
export async function adminBooks(): Promise<BookRow[]> {
  return (await pool.query(select + " ORDER BY p.updated_at DESC,p.id DESC"))
    .rows;
}
export function publicBook(row: BookRow): Book | null {
  if (row.status !== "published") return null;
  const parsed = bookSchema.safeParse(row.published);
  const meta = parsed.success ? parsed.data : legacyMeta(row);
  const sourceId = docsId(meta.docsUrl);
  if (sourceId && (row.blocked || sourceId !== row.document_id)) return null;
  const chapters = sourceId
    ? row.chapters
    : legacyChapters(row.content_raw ?? "");
  return {
    id: row.post_id,
    slug: row.slug,
    meta: { ...meta, docsUrl: "", legacyContent: "" },
    chapters,
    contentHash: sourceId
      ? row.content_hash
      : createHash("sha256").update(JSON.stringify(chapters)).digest("hex"),
    publishedAt: row.published_at,
    sourceBlocked: row.blocked,
  };
}
export async function publicBooks(): Promise<Book[]> {
  // Catalogs only need metadata: never load every kitab's full text/chapters.
  const catalogSelect = select
    .replace(
      "COALESCE(NULLIF(p.content_raw,''),p.content) AS content_raw",
      "NULL::text AS content_raw",
    )
    .replace(
      "m.draft,m.published",
      "NULL::jsonb AS draft,(m.published - 'legacyContent') AS published",
    )
    .replace(
      "COALESCE(m.chapters,'[]'::jsonb) AS chapters",
      "'[]'::jsonb AS chapters",
    );
  const rows = (
    await pool.query(
      catalogSelect +
        " AND p.status='published' ORDER BY p.published_at DESC,p.id DESC",
    )
  ).rows as BookRow[];
  return rows
    .map(publicBook)
    .filter((v): v is Book => v !== null)
    .sort(
      (a, b) =>
        Number(new Date(b.publishedAt ?? 0)) -
        Number(new Date(a.publishedAt ?? 0)),
    );
}
export async function bookBySlug(
  slug: string,
  preview = false,
): Promise<Book | null> {
  const row = (await pool.query(select + " AND p.slug=$1", [slug])).rows[0] as
    BookRow | undefined;
  if (!row) return null;
  if (!preview) return publicBook(row);
  const meta = bookSchema.safeParse(row.draft);
  const draft = meta.success ? meta.data : legacyMeta(row);
  const id = docsId(draft.docsUrl);
  return {
    id: row.post_id,
    slug: row.slug,
    meta: draft,
    chapters:
      id === row.document_id && !row.blocked
        ? row.chapters
        : id
          ? []
          : legacyChapters(draft.legacyContent),
    contentHash: row.content_hash,
    publishedAt: row.published_at,
    sourceBlocked: row.blocked,
  };
}
export async function syncBook(
  id: number,
  manual = false,
  previewOnly = false,
) {
  const client = await pool.connect();
  try {
    const locked = (
      await client.query("SELECT pg_try_advisory_lock(71331,$1) AS locked", [
        id,
      ])
    ).rows[0]?.locked;
    if (!locked)
      throw new DocsError(409, "Sinkronisasi kitab ini masih berlangsung.");
    const row = (
      await client.query("SELECT * FROM maktabah_books WHERE post_id=$1", [id])
    ).rows[0];
    if (!row)
      throw new DocsError(404, "Simpan informasi kitab terlebih dahulu.");
    const meta = bookSchema.parse(
      manual ? row.draft : (row.published ?? row.draft),
    );
    const sourceId = docsId(meta.docsUrl);
    if (!sourceId)
      throw new DocsError(400, "Kitab belum memiliki tautan Google Docs.");
    try {
      const result = await fetchDocs(sourceId);
      if (!result.chapters.length)
        throw new DocsError(
          400,
          "Dokumen belum memiliki isi yang dapat dibaca.",
        );
      if (!previewOnly) {
        if (!manual && row.sync_paused) {
          await client.query(
            "UPDATE maktabah_books SET blocked=false,sync_error=$2,last_checked_at=now() WHERE post_id=$1",
            [id, result.warnings.join(" ")],
          );
        } else {
          const publishedSource = docsId(row.published?.docsUrl ?? "");
          if (publishedSource && publishedSource !== sourceId && manual)
            throw new DocsError(
              409,
              "Tautan baru belum diterbitkan. Gunakan Pratinjau Isi untuk menguji sumber baru; arsip sumber yang sedang tayang dipertahankan.",
            );
          await client.query(
            "UPDATE maktabah_books SET chapters=$2,document_id=$3,content_hash=$4,blocked=false,sync_error=$5,last_checked_at=now(),last_synced_at=now() WHERE post_id=$1",
            [
              id,
              JSON.stringify(result.chapters),
              sourceId,
              result.hash,
              result.warnings.join(" "),
            ],
          );
        }
      }
      return result;
    } catch (error) {
      const denied =
        error instanceof DocsError && [403, 404].includes(error.status);
      const publishedSource = docsId(row.published?.docsUrl ?? "");
      // A preview of a different draft document must not revoke the live source.
      if (!previewOnly || publishedSource === sourceId)
        await client.query(
          "UPDATE maktabah_books SET sync_error=$2,last_checked_at=now(),blocked=CASE WHEN $3 THEN true ELSE blocked END WHERE post_id=$1",
          [
            id,
            error instanceof DocsError
              ? error.message
              : "Koneksi Google Docs gagal. Coba kembali.",
            denied && publishedSource === sourceId,
          ],
        );
      throw error;
    }
  } finally {
    await client
      .query("SELECT pg_advisory_unlock(71331,$1)", [id])
      .catch(() => {});
    client.release();
  }
}
let running = false;
export async function syncLibrary() {
  if (running || !docsConfigured()) return;
  running = true;
  try {
    const rows = (
      await pool.query(
        "SELECT post_id FROM maktabah_books WHERE published->>'docsUrl' <> '' AND (last_checked_at IS NULL OR last_checked_at < now()-interval '115 seconds') ORDER BY last_checked_at NULLS FIRST",
      )
    ).rows;
    let cursor = 0;
    await Promise.all(
      Array.from({ length: Math.min(3, rows.length) }, async () => {
        while (cursor < rows.length) {
          const row = rows[cursor++];
          try {
            await syncBook(row.post_id);
          } catch {
            /* Individual failures are recorded without stopping the next book. */
          }
        }
      }),
    );
  } finally {
    running = false;
  }
}
