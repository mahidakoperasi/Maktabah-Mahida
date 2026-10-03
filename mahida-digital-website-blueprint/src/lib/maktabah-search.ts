import "server-only";
import { pool } from "@/db";
import { librarySettings } from "./maktabah-store";
import { getPublicPage } from "./cms";
import {
  searchTerms,
  searchSnippet,
  type SearchHit,
  type SearchResponse,
} from "./kitab-search-text";

export async function searchLibrary(
  query: string,
  options: {
    bookSlug?: string;
    fan?: string;
    kind?: string;
    page?: number;
    selected?: string;
  } = {},
): Promise<SearchResponse> {
  const empty = { hits: [], total: 0, page: 1, pages: 0 };
  const terms = searchTerms(query);
  if (!terms.length || !(await getPublicPage("/maktabah"))) return empty;
  const settings = (await librarySettings()).published;
  const expression = terms.map((term) => `'${term}':*`).join(" & ");
  const filters = [
    "p.status='published'",
    "p.type='work'",
    "p.karya_category='terjemahan'",
    "s.search_vector @@ to_tsquery('simple',$1)",
    "s.content_hash=coalesce(m.content_hash,'')",
    "(coalesce(m.published->>'docsUrl','')='' OR (m.blocked=false AND m.document_id=substring(m.published->>'docsUrl' FROM '^https://docs\\.google\\.com/document/d/([A-Za-z0-9_-]+)')))",
  ];
  const args: unknown[] = [expression];
  if (options.bookSlug) {
    args.push(options.bookSlug);
    filters.push(`p.slug=$${args.length}`, "s.kind IN ('body','footnote')");
  }
  if (!settings.reading.searchFootnotes) filters.push("s.kind <> 'footnote'");
  if (options.kind === "book" || options.kind === "chapter") {
    args.push(options.kind);
    filters.push(`s.kind=$${args.length}`);
  }
  if (options.kind === "body") filters.push("s.kind IN ('body','footnote')");
  if (options.fan) {
    args.push(options.fan);
    filters.push(
      `(coalesce(m.published->>'primaryFan','koleksi-terjemahan')=$${args.length} OR coalesce(m.published->'additionalFans','[]') ? $${args.length})`,
    );
  }
  const from = `FROM maktabah_search_entries s JOIN posts p ON p.id=s.post_id LEFT JOIN maktabah_books m ON m.post_id=p.id WHERE ${filters.join(" AND ")}`;
  const total = Number(
    (await pool.query(`SELECT count(*) AS total ${from}`, args)).rows[0].total,
  );
  const pages = Math.ceil(total / 12);
  const order =
    "CASE s.kind WHEN 'book' THEN 0 WHEN 'chapter' THEN 1 ELSE 2 END,ts_rank(s.search_vector,to_tsquery('simple',$1)) DESC,p.published_at DESC NULLS LAST,s.id";
  let selectedPage: number | undefined;
  if (options.bookSlug && /^\d{1,18}$/.test(options.selected ?? "")) {
    const selected = (
      await pool.query(
        `SELECT ordinal FROM (SELECT s.id,row_number() OVER (ORDER BY ${order}) AS ordinal ${from}) ranked WHERE id=$${args.length + 1}::bigint`,
        [...args, options.selected],
      )
    ).rows[0];
    if (selected) selectedPage = Math.ceil(Number(selected.ordinal) / 12);
  }
  const page = Math.max(
    1,
    Math.min(
      selectedPage ||
        (Number.isFinite(options.page) ? Math.floor(options.page!) : 1) ||
        1,
      pages || 1,
    ),
  );
  const rows = (
    await pool.query(
      `SELECT s.id::text,s.kind,p.slug AS "bookSlug",coalesce(nullif(m.published->>'title',''),p.title) AS "bookTitle",
    coalesce(m.published->>'primaryFan','koleksi-terjemahan') AS fan,s.chapter_id AS "chapterId",s.chapter_title AS "chapterTitle",
    s.block_id AS "blockId",s.content AS text,s.content_hash AS hash ${from}
    ORDER BY ${order}
    LIMIT 12 OFFSET $${args.length + 1}`,
      [...args, (page - 1) * 12],
    )
  ).rows as SearchHit[];
  return {
    hits: rows.map((hit) => ({ ...hit, text: searchSnippet(hit.text, query) })),
    total,
    page,
    pages,
  };
}
