import { test, expect } from "./fixtures";
import type { BrowserContext, APIRequestContext } from "@playwright/test";
import pg from "pg";
import jwt from "jsonwebtoken";
import { writeFileSync } from "node:fs";
import {
  bookSchema,
  defaultLibrarySettings,
  docsId,
} from "../src/lib/maktabah-schema";
import { parseDocs, type DocsDocument } from "../src/lib/kitab-content";
// @ts-expect-error Plain JS fixture is shared with the application test preload.
import { kitabDocument } from "./maktabah-fixture.mjs";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
let admin: number, media: number;
const created: number[] = [];
const docUrl = "https://docs.google.com/document/d/maktabahdocs12345/edit";
function state(value: unknown) {
  writeFileSync("/tmp/mahida-maktabah-fixture.json", JSON.stringify(value));
}
async function login(context: BrowserContext, id = admin) {
  await context.addCookies([
    {
      name: "mahida_session",
      value: jwt.sign({ userId: id, role: "admin" }, process.env.JWT_SECRET!, {
        expiresIn: "1h",
      }),
      domain: "127.0.0.1",
      path: "/",
    },
  ]);
}
async function post(request: APIRequestContext, data: unknown) {
  return request.post("/api/admin/maktabah", { data });
}
async function make(
  request: APIRequestContext,
  title = "Kitab Pengujian",
  docs = true,
) {
  const meta = bookSchema.parse({
    title,
    summary: "Ringkasan fikih dan akhlak kehidupan sehari-hari.",
    arabicTitle: "كتاب العلم",
    primaryFan: "fiqh",
    authorName: "Pengarang Uji",
    translatorName: "Penerjemah Mahida",
    coverUrl: "https://drive.google.com/file/d/maktabahcover12345/view",
    coverAlt: "Sampul kitab uji",
    preface:
      "Kata pengantar **tebal**.\n\n> Kutipan kitab.\n\n| Kolom | Isi |\n| --- | --- |\n| Arab | العربية |",
    sourceNote: "Sumber kitab klasik; disunting Mahida.",
    featured: true,
    docsUrl: docs ? docUrl : "",
    legacyContent: docs
      ? ""
      : "## Bab Awal\n\nIsi terjemahan lama.\n\n## Bab Akhir\n\nIsi lanjutan.",
  });
  const save = await post(request, { action: "save", revision: 0, meta });
  expect(save.status()).toBe(200);
  const id = (await save.json()).id;
  created.push(id);
  return { id, meta, revision: 1 };
}
test.beforeAll(async () => {
  if (new URL(process.env.DATABASE_URL!).pathname !== "/mahida_ci")
    throw Error("Disposable DB required");
  state({});
  for (const access of ["full", "media"]) {
    const row = (
      await pool.query(
        "INSERT INTO users(email,password,name,role,email_verified,admin_access) VALUES($1,'test-only',$1,'admin',true,$2) ON CONFLICT(email) DO UPDATE SET admin_access=$2 RETURNING id",
        [`maktabah-${access}@example.invalid`, access],
      )
    ).rows[0];
    if (access === "full") admin = row.id;
    else media = row.id;
  }
  await pool.query(
    "UPDATE cms_pages SET status='published' WHERE path IN ('/maktabah','/karya/terjemahan')",
  );
});
test.afterAll(async () => {
  state({});
  await pool.query("DELETE FROM posts WHERE id=ANY($1::int[])", [created]);
  await pool.query("DELETE FROM settings WHERE key='maktabah_library'");
  await pool.query("UPDATE maktabah_fans SET visible=true WHERE slug='fiqh'");
  await pool.query("DELETE FROM maktabah_fans WHERE slug='fan-pengujian'");
  await pool.end();
});
test("Docs parser preserves tabs, chapter levels, lists, tables and footnotes", () => {
  const result = parseDocs(kitabDocument() as DocsDocument);
  expect(result.chapters.map((c) => c.id)).toEqual([
    "t.utama-h.bab1",
    "t.utama-h.bab2",
    "t.tambahan-h.lampiran",
  ]);
  expect(result.chapters[0].blocks.some((b) => b.kind === "table")).toBe(true);
  expect(result.chapters[0].blocks.some((b) => b.kind === "footnote")).toBe(
    true,
  );
  expect(
    result.chapters[0].blocks
      .filter((b) => b.kind === "heading")
      .map((b) => b.level),
  ).toEqual([1, 2, 3]);
  expect(parseDocs(kitabDocument("baru")).hash).not.toBe(result.hash);
  expect(
    docsId("https://evil.example/document/d/maktabahdocs12345"),
  ).toBeNull();
});
test("authorization, origin checks and optimistic concurrency protect writes", async ({
  context,
}) => {
  expect((await context.request.get("/api/admin/maktabah")).status()).toBe(403);
  await login(context, media);
  expect((await context.request.get("/api/admin/maktabah")).status()).toBe(403);
  await context.clearCookies();
  await login(context);
  const book = await make(context.request);
  expect(
    (
      await context.request.post("/api/admin/maktabah", {
        headers: { Origin: "https://evil.example" },
        data: { action: "save", ...book },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await post(context.request, { action: "save", ...book, revision: 0 })
    ).status(),
  ).toBe(409);
  expect(
    (await post(context.request, { action: "save", ...book })).status(),
  ).toBe(200);
});
test("one translation identity serves library, draft preview and legacy URLs", async ({
  page,
  context,
}) => {
  await login(context);
  const book = await make(context.request, "Kitab Satu Sumber", false);
  const row = (
    await pool.query("SELECT slug FROM posts WHERE id=$1", [book.id])
  ).rows[0];
  expect(
    (await context.request.get(`/maktabah/kitab/${row.slug}`)).status(),
  ).toBe(404);
  expect(
    (
      await context.request.get(`/maktabah/kitab/${row.slug}?maktabahPreview=1`)
    ).status(),
  ).toBe(200);
  expect(
    (await post(context.request, { action: "publish", ...book })).status(),
  ).toBe(200);
  await page.goto(`/karya/terjemahan/${row.slug}`);
  await expect(page).toHaveURL(`/maktabah/kitab/${row.slug}`);
  await expect(
    page.getByRole("heading", { name: "Kitab Satu Sumber" }),
  ).toBeVisible();
  await page.goto("/karya/terjemahan");
  await expect(
    page.getByRole("link", { name: /Kitab Satu Sumber/ }),
  ).toBeVisible();
  expect(
    (await pool.query("SELECT count(*) FROM posts WHERE slug=$1", [row.slug]))
      .rows[0].count,
  ).toBe("1");
  const draft = { ...book.meta, title: "Judul Draf Rahasia" };
  expect(
    (
      await post(context.request, {
        action: "save",
        id: book.id,
        revision: 2,
        meta: draft,
      })
    ).status(),
  ).toBe(200);
  await context.clearCookies();
  await page.goto(`/maktabah/kitab/${row.slug}?maktabahPreview=1`);
  await expect(
    page.getByRole("heading", { name: "Kitab Satu Sumber" }),
  ).toBeVisible();
  await expect(page.getByText("Judul Draf Rahasia")).toHaveCount(0);
});
test("fan management hides empty fans, supports extra fans and preserves book identity", async ({
  page,
  context,
}) => {
  await login(context);
  expect(
    (
      await post(context.request, {
        action: "fan",
        revision: 0,
        fan: {
          slug: "fan-pengujian",
          name: "Fan Uji",
          intro: "Pengantar fan uji",
          sortOrder: 1,
          visible: true,
        },
      })
    ).status(),
  ).toBe(200);
  await page.goto("/maktabah");
  await expect(page.locator(".library-fans").getByText("Fan Uji")).toHaveCount(
    0,
  );
  const book = await make(context.request, "Kitab Fan Tambahan", false);
  book.meta.additionalFans = ["fan-pengujian"];
  expect(
    (await post(context.request, { action: "publish", ...book })).status(),
  ).toBe(200);
  await page.goto("/maktabah/fan/fan-pengujian");
  await expect(page.getByRole("heading", { name: "Fan Uji" })).toBeVisible();
  await expect(page.getByText("Pengantar fan uji")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Kitab Fan Tambahan" }),
  ).toBeVisible();
  expect(
    (
      await post(context.request, {
        action: "fan",
        revision: 1,
        fan: { slug: "fan-pengujian", name: "Fan Uji", visible: false },
      })
    ).status(),
  ).toBe(200);
  expect(
    (await context.request.get("/maktabah/fan/fan-pengujian")).status(),
  ).toBe(404);
});
test("admin controls layout drafts, section placement, titles and legacy clipping", async ({
  page,
  context,
}) => {
  await login(context);
  let revision = Number(
    (await (await context.request.get("/api/admin/maktabah")).json()).settings
      .revision,
  );
  const settings = {
    ...defaultLibrarySettings,
    name: "Perpustakaan Draf Uji",
    sections: [...defaultLibrarySettings.sections].reverse().map((s) =>
      s.id === "latest"
        ? {
            ...s,
            title: "Koleksi Terbaru Uji",
            imageUrl: "https://assets.example.invalid/library.webp",
            imagePlacement: "left",
          }
        : s,
    ),
  };
  expect(
    (
      await post(context.request, { action: "layout-save", revision, settings })
    ).status(),
  ).toBe(200);
  revision++;
  await page.goto("/maktabah");
  await expect(
    page.getByRole("heading", { name: "Perpustakaan Draf Uji" }),
  ).toHaveCount(0);
  await page.goto("/maktabah?maktabahPreview=1");
  await expect(
    page.getByRole("heading", { name: "Perpustakaan Draf Uji" }),
  ).toBeVisible();
  expect(
    await page.locator(".library-section").first().getAttribute("id"),
  ).toBe("library-about");
  expect(
    (
      await post(context.request, {
        action: "layout-publish",
        revision,
        settings,
      })
    ).status(),
  ).toBe(200);
  await context.clearCookies();
  await page.goto("/maktabah");
  await expect(
    page.getByRole("heading", { name: "Perpustakaan Draf Uji" }),
  ).toBeVisible();
  await expect(page.locator("#library-latest")).toHaveClass(
    /library-image-left/,
  );
  await pool.query("DELETE FROM settings WHERE key='maktabah_library'");
});
test("Docs source renders protected reader and fits 320–1440px with accessible TOC", async ({
  page,
  context,
}) => {
  state({});
  await login(context);
  const book = await make(context.request, "Kitab Pembaca Docs");
  expect(
    (
      await post(context.request, { action: "test", id: book.id, revision: 1 })
    ).status(),
  ).toBe(200);
  expect(
    (await post(context.request, { action: "publish", ...book })).status(),
  ).toBe(200);
  const slug = (
    await pool.query("SELECT slug FROM posts WHERE id=$1", [book.id])
  ).rows[0].slug;
  await context.clearCookies();
  await page.route("https://drive.google.com/**", (route) => route.abort());
  for (const width of [320, 390, 768, 1280, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(`/maktabah/kitab/${slug}/baca/t.utama-h.bab1`);
    await expect(
      page.getByRole("heading", { name: "Bab Pertama", exact: true }).first(),
    ).toBeVisible();
    await expect(page.locator("[data-protected-reading]")).toHaveCount(1);
    await expect(page.locator(".kitab-blocks>p").first()).toHaveCSS(
      "text-align",
      "justify",
    );
    await expect(page.locator(".kitab-blocks>p").nth(1)).toHaveCSS(
      "direction",
      "rtl",
    );
    await expect(page.locator(".arabic-inline").first()).toHaveCSS(
      "font-family",
      /Amiri/,
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      await page
        .locator(".kitab-blocks>p")
        .first()
        .evaluate((el) => {
          const e = new Event("copy", { bubbles: true, cancelable: true });
          el.dispatchEvent(e);
          return e.defaultPrevented;
        }),
    ).toBe(true);
    await expect(page.locator('a[href^="javascript:"]')).toHaveCount(0);
    await expect(
      page.getByText("Catatan sumber dan penjelasan kitab."),
    ).toBeVisible();
    if (width < 1024) {
      await page
        .getByRole("button", { name: "Daftar Isi", exact: true })
        .click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(
        page.getByRole("dialog").getByRole("link", { name: "Bagian Lanjutan" }),
      ).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(
        page.getByRole("button", { name: "Daftar Isi", exact: true }),
      ).toBeFocused();
    }
  }
  await page.getByRole("button", { name: "Perbesar huruf" }).click();
  await expect(page.getByLabel("Ukuran huruf saat ini")).toHaveText("22px");
  await page.screenshot({ path: "test-results/maktabah-reader-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "test-results/maktabah-reader-mobile.png" });
  const publicStatus = await (
    await context.request.get(`/api/maktabah/kitab/${slug}`)
  ).text();
  expect(publicStatus).not.toContain("docs.google.com");
  expect(publicStatus.length).toBeLessThan(200);
});
test("resume reading stores chapter and scroll locally without an account", async ({
  page,
  context,
}) => {
  await login(context);
  const book = await make(context.request, "Kitab Posisi Baca");
  expect(
    (await post(context.request, { action: "publish", ...book })).status(),
  ).toBe(200);
  const slug = (
    await pool.query("SELECT slug FROM posts WHERE id=$1", [book.id])
  ).rows[0].slug;
  await context.clearCookies();
  await page.goto(`/maktabah/kitab/${slug}/baca/t.utama-h.bab2`);
  await page.evaluate(() => scrollTo(0, 900));
  await expect
    .poll(() =>
      page.evaluate(
        (id) =>
          JSON.parse(localStorage.getItem(`mahida-reading-${id}`) ?? "null")
            ?.scroll,
        book.id,
      ),
    )
    .toBeGreaterThan(500);
  await page.goto(`/maktabah/kitab/${slug}`);
  await page.getByRole("link", { name: "Lanjutkan Membaca" }).click();
  await expect(page).toHaveURL(/baca\/t.utama-h.bab2\?lanjut=1/);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(500);
});
test("reader announces new content without jumping and revoked paused sources stop displaying", async ({
  page,
  context,
}) => {
  state({});
  await login(context);
  const book = await make(context.request, "Kitab Pembaruan");
  expect(
    (await post(context.request, { action: "publish", ...book })).status(),
  ).toBe(200);
  const slug = (
    await pool.query("SELECT slug FROM posts WHERE id=$1", [book.id])
  ).rows[0].slug;
  await context.clearCookies();
  await page.clock.install();
  await page.goto(`/maktabah/kitab/${slug}/baca/t.utama-h.bab2`);
  await page.evaluate(() => scrollTo(0, 850));
  const previous = await page.evaluate(() => scrollY);
  await login(context);
  state({ maktabahdocs12345: { version: "baru" } });
  expect(
    (
      await post(context.request, { action: "sync", id: book.id, revision: 2 })
    ).status(),
  ).toBe(200);
  await context.clearCookies();
  await page.clock.fastForward(120001);
  await expect(
    page.getByRole("button", { name: "Muat pembaruan" }),
  ).toBeVisible();
  expect(
    Math.abs((await page.evaluate(() => scrollY)) - previous),
  ).toBeLessThan(150);
  await login(context);
  expect(
    (
      await post(context.request, {
        action: "pause",
        id: book.id,
        revision: 2,
        paused: true,
      })
    ).status(),
  ).toBe(200);
  state({ maktabahdocs12345: { denied: true } });
  await pool.query(
    "UPDATE maktabah_books SET last_checked_at=now()-interval '10 minutes' WHERE post_id=$1",
    [book.id],
  );
  expect(
    (await context.request.post("/api/internal/maktabah/sync")).status(),
  ).toBe(403);
  expect(
    (
      await context.request.post("/api/internal/maktabah/sync", {
        headers: { Authorization: "Bearer maktabah-fixture-only" },
      })
    ).status(),
  ).toBe(200);
  await context.clearCookies();
  expect((await context.request.get(`/maktabah/kitab/${slug}`)).status()).toBe(
    404,
  );
  expect(
    (await context.request.get(`/karya/terjemahan/${slug}`)).status(),
  ).toBe(404);
  await page.clock.fastForward(120001);
  await expect(page.locator('p[role="alert"]')).toContainText(
    "Kitab sementara tidak tersedia",
  );
  await expect(page.locator("[data-protected-reading]")).toHaveCount(0);
  state({});
});
test("admin editor and all tabs remain usable on narrow screens", async ({
  page,
  context,
}) => {
  await login(context);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/admin/maktabah");
  await expect(
    page.getByRole("heading", { name: "Maktabah & Terjemahan" }),
  ).toBeVisible();
  await page.getByLabel("Kata pengantar", { exact: true }).fill("بسم الله");
  const preface = page.getByLabel("Kata pengantar", { exact: true });
  expect(
    await preface.evaluate((el) => {
      const e = new Event("copy", { bubbles: true, cancelable: true });
      el.dispatchEvent(e);
      return e.defaultPrevented;
    }),
  ).toBe(false);
  await page
    .getByRole("button", { name: "Arah Arab", exact: true })
    .first()
    .click();
  await expect(preface).toHaveAttribute("dir", "rtl");
  for (const name of ["Fan Kitab", "Tampilan Maktabah", "Kitab & Terjemahan"]) {
    await page.getByRole("button", { name, exact: true }).click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
