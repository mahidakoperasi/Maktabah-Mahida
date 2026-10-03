import { test, expect } from "./fixtures";
import type { BrowserContext, APIRequestContext } from "@playwright/test";
import pg from "pg";
import jwt from "jsonwebtoken";
import { writeFileSync } from "node:fs";
import {
  bookSchema,
  defaultLibrarySettings,
  librarySettingsSchema,
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
test("internal navigation switches Mahida and Maktabah headers and footers", async ({
  page,
}) => {
  await page.goto("/karya/terjemahan");
  await expect(
    page.getByRole("navigation", { name: "Navigasi utama", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Buka Maktabah Mahida →" }).click();
  await expect(page).toHaveURL("/maktabah");
  await expect(page.locator(".library-header")).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Navigasi utama", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator(".site-footer")).toHaveCount(0);
  await page
    .locator(".library-header")
    .getByRole("link", { name: "← Kembali ke Mahida", exact: true })
    .click();
  await expect(page).toHaveURL("/");
  await expect(
    page.getByRole("navigation", { name: "Navigasi utama", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".site-footer")).toBeVisible();
  await expect(page.locator(".library-header")).toHaveCount(0);
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
  await expect(page.locator(".library-brand")).toContainText(
    "Perpustakaan Draf Uji",
  );
  await expect(
    page.getByRole("heading", { name: "Perpustakaan Draf Uji" }),
  ).toBeVisible();
  expect(
    await page.locator(".library-section").first().getAttribute("id"),
  ).toBe("library-about");
  await context.clearCookies();
  await page.goto("/maktabah?maktabahPreview=1");
  await expect(page.locator(".library-brand")).not.toContainText(
    "Perpustakaan Draf Uji",
  );
  await expect(
    page.getByRole("heading", { name: "Perpustakaan Draf Uji" }),
  ).toHaveCount(0);
  await login(context);
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
  await page.goto("/maktabah?maktabahPreview=1");
  await expect(page.locator(".library-brand")).toContainText(
    "Perpustakaan Draf Uji",
  );
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

test("legacy settings keep existing content and reject unsafe banner/footer destinations", () => {
  const { banner, footer, reading, search, ...legacy } = defaultLibrarySettings;
  void banner;
  void footer;
  void reading;
  void search;
  const parsed = librarySettingsSchema.parse({
    ...legacy,
    name: "Nama lama",
    intro: "Pengantar lama",
  });
  expect(parsed.name).toBe("Nama lama");
  expect(parsed.intro).toBe("Pengantar lama");
  expect(parsed.banner.enabled).toBe(false);
  expect(parsed.footer.source).toBe("mahida");
  expect(parsed.reading.footnoteFontSize).toBe(18);
  expect(parsed.search.buttonLabel).toBe("Cari Koleksi");
  for (const url of [
    "javascript:alert(1)",
    "//evil.invalid",
    "/\\evil.invalid",
    "http://evil.invalid",
    "https://user:pass@evil.invalid/",
  ]) {
    expect(
      librarySettingsSchema.safeParse({
        ...parsed,
        banner: { ...parsed.banner, buttonUrl: url },
      }).success,
    ).toBe(false);
    expect(
      librarySettingsSchema.safeParse({
        ...parsed,
        footer: { ...parsed.footer, joinUrl: url },
      }).success,
    ).toBe(false);
  }
});

test("long preface/source stack vertically and both card styles fit mobile and desktop", async ({
  page,
  context,
}) => {
  await login(context);
  const book = await make(context.request, "Kitab Tata Letak Panjang", false);
  book.meta.preface = `Pengantar pertama. ${"Paragraf panjang tentang tradisi ilmu pesantren. ".repeat(15)}\n\nPengantar kedua. ${"بِسْمِ اللَّهِ dan isi berikutnya. ".repeat(12)}`;
  book.meta.sourceNote = `Sumber pertama. ${"Penjelasan sumber naskah dan penyuntingan. ".repeat(15)}\n\nSumber kedua. ${"Catatan penyuntingan kitab. ".repeat(15)}`;
  expect(
    (await post(context.request, { action: "publish", ...book })).status(),
  ).toBe(200);
  const slug = (
    await pool.query("SELECT slug FROM posts WHERE id=$1", [book.id])
  ).rows[0].slug;
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/maktabah/kitab/${slug}`);
    for (const section of await page.locator(".library-prose-section").all()) {
      const title = await section.locator("h2").first().boundingBox();
      const paragraphs = section.locator(".reading-text > p");
      await expect(paragraphs).toHaveCount(2);
      const first = await paragraphs.nth(0).boundingBox();
      const second = await paragraphs.nth(1).boundingBox();
      expect(title!.width).toBeGreaterThan(width < 640 ? 200 : 500);
      expect(first!.y).toBeGreaterThanOrEqual(title!.y + title!.height);
      expect(second!.y).toBeGreaterThanOrEqual(first!.y + first!.height);
      expect(Math.abs(first!.x - second!.x)).toBeLessThan(1);
      await expect(paragraphs.first()).toHaveCSS("text-align", "justify");
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  for (const cardStyle of ["cover", "compact"] as const) {
    const settings = { ...defaultLibrarySettings, cardStyle };
    const revision = (
      await (await context.request.get("/api/admin/maktabah")).json()
    ).settings.revision;
    expect(
      (
        await post(context.request, {
          action: "layout-publish",
          settings,
          revision,
        })
      ).status(),
    ).toBe(200);
    for (const width of [320, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/karya/terjemahan");
      const grid = page.locator(".library-books");
      await expect(grid).toHaveClass(new RegExp(`library-cards-${cardStyle}`));
      const box = await grid.boundingBox();
      expect(box!.height).toBeGreaterThan(cardStyle === "cover" ? 300 : 190);
      await expect(
        grid.getByRole("heading", { name: book.meta.title }),
      ).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
  }
  await pool.query("DELETE FROM settings WHERE key='maktabah_library'");
});

test("admin edits banner/footer, previews saved drafts and publishes only to Maktabah", async ({
  page,
  context,
}) => {
  await login(context);
  await page.route("https://assets.example.invalid/**", (route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="500"><rect width="1200" height="500" fill="#1d5940"/><circle cx="900" cy="250" r="150" fill="#bd9b54"/></svg>',
    }),
  );
  await page.goto("/admin/maktabah");
  await page
    .getByRole("button", { name: "Tampilan Maktabah", exact: true })
    .click();
  await page.getByLabel("Aktifkan banner", { exact: true }).check();
  await page
    .getByLabel("Judul banner", { exact: true })
    .fill("Ruang Ilmu Maktabah Uji");
  await page
    .getByLabel("Gambar banner — HTTPS / Drive", { exact: true })
    .fill("https://assets.example.invalid/banner-desktop.svg");
  await page
    .getByLabel("Gambar banner khusus HP — opsional", { exact: true })
    .fill("https://assets.example.invalid/banner-mobile.svg");
  await page
    .getByLabel("Teks alternatif banner", { exact: true })
    .fill("Rak kitab Mahida");
  await page
    .getByLabel("Teks tombol banner — kosong untuk sembunyikan", {
      exact: true,
    })
    .fill("Telusuri fan");
  await page
    .getByLabel("Tujuan tombol banner", { exact: true })
    .fill("/maktabah/fan");
  await page
    .getByRole("combobox", { name: /Sumber medsos dan kontak/ })
    .selectOption("custom");
  await page
    .getByRole("button", { name: "Tambah medsos Maktabah", exact: true })
    .click();
  await page
    .getByLabel("Nama akun", { exact: true })
    .fill("Instagram Maktabah Uji");
  await page
    .getByLabel("URL akun HTTPS", { exact: true })
    .fill("https://www.instagram.com/mahida_uji/");
  await page.getByLabel("Tampilkan akun", { exact: true }).check();
  await page
    .getByRole("button", { name: "Tambah kontak Maktabah", exact: true })
    .click();
  await page
    .getByLabel("Label kontak", { exact: true })
    .fill("Hubungi pustakawan");
  await page
    .getByLabel("Nomor kontak internasional — 628…, tanpa spasi", {
      exact: true,
    })
    .fill("6281234567890");
  await page.getByLabel("Tampilkan kontak", { exact: true }).check();
  await page
    .getByLabel("Judul ajakan bergabung", { exact: true })
    .fill("Bergabung dalam tradisi ilmu");
  await page
    .getByLabel("Label tombol daftar / gabung", { exact: true })
    .fill("Daftar Mahida Uji");
  await page
    .getByRole("button", { name: "Naikkan Gabung bersama kami", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Naikkan Gabung bersama kami", exact: true })
    .click();
  await page.getByRole("button", { name: "Pratinjau HP", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Berhasil disimpan.");
  const frame = page.frameLocator('iframe[title="Pratinjau Maktabah 375px"]');
  await expect(
    frame.getByRole("heading", {
      name: "Ruang Ilmu Maktabah Uji",
      exact: true,
    }),
  ).toBeVisible();
  await expect(frame.locator(".library-banner-picture img")).toHaveJSProperty(
    "currentSrc",
    "https://assets.example.invalid/banner-mobile.svg",
  );
  await expect(
    frame.getByRole("link", { name: "Instagram Maktabah Uji", exact: true }),
  ).toBeVisible();
  expect(
    await page
      .locator("iframe")
      .evaluate((el) => el.getBoundingClientRect().width),
  ).toBe(375);
  // Clear the session to verify the saved draft remains private.
  await context.clearCookies();
  const publicPage = await context.newPage();
  await publicPage.goto("http://127.0.0.1:3010/maktabah?maktabahPreview=1");
  await expect(
    publicPage.getByRole("heading", { name: "Ruang Ilmu Maktabah Uji" }),
  ).toHaveCount(0);
  await expect(
    publicPage.getByRole("link", { name: "Instagram Maktabah Uji" }),
  ).toHaveCount(0);
  await publicPage.close();
  await login(context);
  await page
    .getByRole("button", { name: "Terbitkan Tampilan", exact: true })
    .click();
  await expect(page.getByRole("status")).toHaveText("Berhasil diterbitkan.");
  const published = (
    await (await context.request.get("/api/admin/maktabah")).json()
  ).settings.published;
  await context.clearCookies();
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/maktabah");
    await expect(
      page.getByRole("heading", {
        name: "Ruang Ilmu Maktabah Uji",
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.locator(".library-banner-picture img")).toHaveJSProperty(
      "currentSrc",
      `https://assets.example.invalid/banner-${width < 640 ? "mobile" : "desktop"}.svg`,
    );
    await expect(
      page.getByRole("link", { name: "Telusuri fan", exact: true }),
    ).toHaveAttribute("href", "/maktabah/fan");
    await expect(
      page.locator(".library-footer-inner > section").first(),
    ).toHaveClass("library-footer-join");
    await expect(
      page.getByRole("link", { name: "Hubungi pustakawan", exact: true }),
    ).toHaveAttribute("href", "https://wa.me/6281234567890");
    await expect(
      page.getByRole("link", { name: "Daftar Mahida Uji", exact: true }),
    ).toHaveAttribute("href", "/tentang/pendaftaran");
    await expect(page.locator(".site-footer")).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (width === 390 || width === 1440) {
      await page.screenshot({
        path: `test-results/maktabah-appearance-${width}.png`,
        fullPage: width === 1440,
      });
      if (width === 390) {
        await page.locator(".library-footer").scrollIntoViewIfNeeded();
        await page
          .locator(".library-footer")
          .screenshot({ path: "test-results/maktabah-footer-mobile.png" });
      }
    }
  }
  await page.goto("/maktabah/fan");
  await expect(page.locator(".library-banner")).toHaveCount(0);
  await expect(page.locator(".library-footer")).toBeVisible();
  await page.goto("/");
  await expect(page.locator(".library-footer")).toHaveCount(0);
  await expect(page.locator(".site-footer")).toBeVisible();
  await login(context);
  let revision = (
    await (await context.request.get("/api/admin/maktabah")).json()
  ).settings.revision;
  for (const placement of [
    "left",
    "right",
    "above",
    "below",
    "background",
  ] as const) {
    const settings = {
      ...published,
      banner: { ...published.banner, placement, textAlign: "center" },
    };
    expect(
      (
        await post(context.request, {
          action: "layout-publish",
          revision,
          settings,
        })
      ).status(),
    ).toBe(200);
    revision++;
    for (const width of [320, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/maktabah");
      await expect(page.locator(".library-banner")).toHaveClass(
        new RegExp(`library-banner-${placement}`),
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      const copy = await page.locator(".library-banner-copy").boundingBox();
      const image = await page.locator(".library-banner-picture").boundingBox();
      expect(copy!.width).toBeGreaterThan(200);
      expect(image!.height).toBeGreaterThan(150);
    }
  }
  const hidden = {
    ...published,
    banner: { ...published.banner, enabled: false },
    footer: { ...published.footer, enabled: false },
  };
  expect(
    (
      await post(context.request, {
        action: "layout-publish",
        revision,
        settings: hidden,
      })
    ).status(),
  ).toBe(200);
  await page.goto("/maktabah");
  await expect(page.locator(".library-banner")).toHaveCount(0);
  await expect(page.locator(".library-footer")).toHaveCount(0);
  await expect(page.locator("#library-intro h1")).toBeVisible();
  await pool.query("DELETE FROM settings WHERE key='maktabah_library'");
});

test("footer follows visible Mahida contacts and a failed local banner image keeps text usable", async ({
  page,
  context,
}) => {
  const original = (
    await pool.query("SELECT value FROM settings WHERE key='public_directory'")
  ).rows[0]?.value;
  const directory = {
    socials: [
      {
        id: crypto.randomUUID(),
        platform: "youtube",
        label: "YouTube Mahida Uji",
        url: "https://www.youtube.com/@mahida",
        isVisible: true,
        sortOrder: 0,
      },
      {
        id: crypto.randomUUID(),
        platform: "instagram",
        label: "Akun disembunyikan",
        url: "https://www.instagram.com/hidden",
        isVisible: false,
        sortOrder: 1,
      },
    ],
    contacts: [
      {
        id: crypto.randomUUID(),
        category: "umum",
        channel: "email",
        label: "Email Mahida Uji",
        value: "maktabah@example.invalid",
        isVisible: true,
        sortOrder: 0,
      },
    ],
    coopWhatsapp: { label: "Koperasi Mahida", isVisible: false, sortOrder: 0 },
  };
  try {
    await pool.query(
      "INSERT INTO settings(key,type,value) VALUES('public_directory','json',$1) ON CONFLICT(key) DO UPDATE SET value=$1",
      [JSON.stringify(directory)],
    );
    await login(context);
    const revision = (
      await (await context.request.get("/api/admin/maktabah")).json()
    ).settings.revision;
    const settings = {
      ...defaultLibrarySettings,
      banner: {
        ...defaultLibrarySettings.banner,
        enabled: true,
        title: "Banner tetap terbaca",
        imageUrl: "/missing-banner-test.png",
        buttonLabel: "Buka fan",
        buttonUrl: "/maktabah/fan",
      },
    };
    expect(
      (
        await post(context.request, {
          action: "layout-publish",
          revision,
          settings,
        })
      ).status(),
    ).toBe(200);
    for (const width of [320, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/maktabah");
      await expect(page.locator(".library-banner-picture")).toHaveCount(0);
      await expect(
        page.getByRole("heading", {
          name: "Banner tetap terbaca",
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Buka fan", exact: true }),
      ).toHaveAttribute("href", "/maktabah/fan");
      await expect(
        page
          .locator(".library-footer")
          .getByRole("link", { name: "YouTube Mahida Uji", exact: true }),
      ).toHaveAttribute("href", directory.socials[0].url);
      await expect(
        page
          .locator(".library-footer")
          .getByRole("link", { name: "Email Mahida Uji", exact: true }),
      ).toHaveAttribute("href", "mailto:maktabah@example.invalid");
      await expect(
        page.getByRole("link", { name: "Akun disembunyikan", exact: true }),
      ).toHaveCount(0);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
    const book = await make(context.request, "Kitab Dengan Footer", false);
    expect(
      (await post(context.request, { action: "publish", ...book })).status(),
    ).toBe(200);
    const slug = (
      await pool.query("SELECT slug FROM posts WHERE id=$1", [book.id])
    ).rows[0].slug;
    await page.goto(`/maktabah/kitab/${slug}/baca`);
    await expect(page.locator(".library-reading")).toBeVisible();
    const reading = await page.locator(".library-reading").boundingBox();
    const footer = await page.locator(".library-footer").boundingBox();
    expect(footer!.y).toBeGreaterThanOrEqual(reading!.y + reading!.height);
    await expect(page.locator(".library-banner")).toHaveCount(0);
    // Updating the shared directory is reflected without overwriting Maktabah settings.
    directory.contacts[0].label = "Email Mahida Diperbarui";
    await pool.query(
      "UPDATE settings SET value=$1 WHERE key='public_directory'",
      [JSON.stringify(directory)],
    );
    await page.reload();
    await expect(
      page
        .locator(".library-footer")
        .getByRole("link", { name: "Email Mahida Diperbarui", exact: true }),
    ).toBeVisible();
  } finally {
    await pool.query("DELETE FROM settings WHERE key='maktabah_library'");
    if (original === undefined)
      await pool.query("DELETE FROM settings WHERE key='public_directory'");
    else
      await pool.query(
        "UPDATE settings SET value=$1 WHERE key='public_directory'",
        [original],
      );
  }
});

test("search normalization preserves displayed Arabic and SQL matches prefix queries", async () => {
  const { normalizeSearch, matchRanges, searchTerms } =
    await import("../src/lib/kitab-search-text");
  const original = "بِسْمِ اللَّهِ ـ فِقْه ١٢۳ Café";
  const normalized = normalizeSearch(original);
  expect(normalized).toBe("بسم الله  فقه 123 cafe");
  expect(
    (
      await pool.query("SELECT mahida_search_normalize($1) AS value", [
        original,
      ])
    ).rows[0].value,
  ).toBe(normalized);
  expect(
    matchRanges(original, "بسم").map((r) => original.slice(r.start, r.end)),
  ).toEqual(["بِسْمِ"]);
  expect(searchTerms("' OR 1=1 -- @:*")).toEqual(["or", "1"]);
  const parsed = parseDocs(kitabDocument() as DocsDocument);
  expect(
    parsed.chapters[0].blocks
      .flatMap((b) => b.runs ?? [])
      .find((r) => r.footnote)?.footnoteNumber,
  ).toBe("7");
  expect(
    parsed.chapters[0].blocks.find((b) => b.kind === "footnote")?.noteNumber,
  ).toBe("7");
  const { collectFootnotes } = await import("../src/lib/kitab-footnotes");
  const reused = structuredClone(parsed.chapters);
  reused[1].blocks.push({
    id: "reused-note",
    kind: "paragraph",
    runs: [{ text: "", footnote: "t.utama-fn1", footnoteNumber: "7" }],
  });
  reused[1].blocks.push(
    parsed.chapters[0].blocks.find((b) => b.kind === "footnote")!,
  );
  const notes = collectFootnotes(reused);
  expect(notes["t.utama-fn1"].number).toBe("7");
  expect(notes["t.utama-fn1"].references).toHaveLength(2);
  expect(collectFootnotes([reused[1]])["t.utama-fn1"].references).toEqual([
    "footnote-ref-reused-note-0",
  ]);
});

test("collection index searches metadata, headings, tables, notes and legacy content while excluding drafts", async ({
  page,
  context,
}) => {
  state({});
  await login(context);
  const book = await make(context.request, "Kitab Pencarian Indeks");
  const slug = (
    await pool.query("SELECT slug FROM posts WHERE id=$1", [book.id])
  ).rows[0].slug;
  const search = async (q: string, extra: Record<string, string> = {}) => {
    const response = await context.request.get(
      `/api/maktabah/pencarian?${new URLSearchParams({ q, ...extra })}`,
    );
    expect(response.status()).toBe(200);
    return response.json();
  };
  expect(
    (await search("Pencarian Indeks")).hits.filter(
      (h: { bookSlug: string }) => h.bookSlug === slug,
    ),
  ).toHaveLength(0);
  expect(
    (await post(context.request, { action: "publish", ...book })).status(),
  ).toBe(200);
  expect(
    (await search("Pencarian Indeks", { jenis: "book" })).hits.some(
      (h: { bookSlug: string }) => h.bookSlug === slug,
    ),
  ).toBe(true);
  expect(
    (await search("Subbab Pertama", { jenis: "chapter" })).hits.some(
      (h: { bookSlug: string; blockId: string }) =>
        h.bookSlug === slug && h.blockId.includes("sub1"),
    ),
  ).toBe(true);
  expect((await search("Sel tabel Arab", { kitab: slug })).hits).toHaveLength(
    1,
  );
  expect(
    (await search("بسم الله", { kitab: slug })).hits.length,
  ).toBeGreaterThanOrEqual(3);
  const notes = await search("Catatan rujukan", { kitab: slug });
  expect(notes.hits).toHaveLength(1);
  expect(notes.hits[0].kind).toBe("footnote");
  const long = await search("pengujian posisi", { kitab: slug });
  expect(long.total).toBe(20);
  expect(long.hits).toHaveLength(12);
  expect(long.pages).toBe(2);
  expect(long.hits.every((h: { text: string }) => h.text.length <= 242)).toBe(
    true,
  );
  const second = await search("pengujian posisi", { kitab: slug, page: "2" });
  expect(second.hits).toHaveLength(8);
  const selected = await search("pengujian posisi", {
    kitab: slug,
    selected: second.hits[6].id,
  });
  expect(selected.page).toBe(2);
  expect(
    (await search("pengujian posisi", { kitab: slug, page: "1.5" })).page,
  ).toBe(1);
  expect((await search("' @ : * & !")).total).toBe(0);
  expect(
    (
      await context.request.get(`/api/maktabah/pencarian?q=${"a".repeat(201)}`)
    ).status(),
  ).toBe(400);
  const legacy = await make(context.request, "Kitab Pencarian Lama", false);
  expect(
    (await post(context.request, { action: "publish", ...legacy })).status(),
  ).toBe(200);
  const oldSlug = (
    await pool.query("SELECT slug FROM posts WHERE id=$1", [legacy.id])
  ).rows[0].slug;
  const old = await search("Isi lanjutan", { kitab: oldSlug });
  expect(old.total).toBe(1);
  expect(old.hits[0].chapterId).toBe("lama-2");
  await page.goto(
    "/maktabah/pencarian?q=Subbab+Pertama&jenis=chapter&fan=fiqh",
  );
  await expect(
    page.locator(".library-search-results mark").first(),
  ).toBeVisible();
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (width === 390)
      expect(
        (await page.locator(".library-search-filters").boundingBox())!.height,
      ).toBeLessThan(180);
    await page.screenshot({
      path: `test-results/maktabah-global-search-${width}.png`,
    });
  }
  await page
    .locator(".library-search-results a")
    .filter({ hasText: "Subbab Pertama" })
    .first()
    .click();
  await expect(page.locator(".library-search-target")).toBeVisible();
  expect(
    (
      await post(context.request, {
        action: "save",
        id: book.id,
        revision: 2,
        meta: { ...book.meta, title: "Rahasiatersembunyi" },
      })
    ).status(),
  ).toBe(200);
  expect((await search("Rahasiatersembunyi")).total).toBe(0);
  state({ maktabahdocs12345: { version: "uniksinkronisasi" } });
  expect(
    (
      await post(context.request, { action: "sync", id: book.id, revision: 3 })
    ).status(),
  ).toBe(200);
  expect((await search("uniksinkronisasi", { kitab: slug })).total).toBe(1);
  await pool.query("UPDATE maktabah_books SET blocked=true WHERE post_id=$1", [
    book.id,
  ]);
  expect(
    (await search("Pencarian Indeks")).hits.some(
      (h: { bookSlug: string }) => h.bookSlug === slug,
    ),
  ).toBe(false);
  expect((await search("uniksinkronisasi", { kitab: slug })).total).toBe(0);
  await pool.query("UPDATE posts SET status='archived' WHERE id=$1", [
    legacy.id,
  ]);
  expect((await search("Isi lanjutan", { kitab: oldSlug })).total).toBe(0);
  state({});
});

test("reader searches chapters and contents, opens accessible footnotes and restores reading position", async ({
  page,
  context,
}) => {
  state({});
  await login(context);
  const book = await make(context.request, "Kitab Cari dan Catatan");
  expect(
    (await post(context.request, { action: "publish", ...book })).status(),
  ).toBe(200);
  const slug = (
    await pool.query("SELECT slug FROM posts WHERE id=$1", [book.id])
  ).rows[0].slug;
  await context.clearCookies();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`/maktabah/kitab/${slug}/baca/t.utama-h.bab1`);
  const navigation = page.locator(".library-desktop-toc");
  await navigation.getByRole("tab", { name: "Cari Bab" }).click();
  await navigation.getByLabel("Cari judul bab").fill("lanjutan");
  await expect(
    navigation.getByRole("link", { name: "Bagian Lanjutan" }),
  ).toBeVisible();
  await expect(
    navigation.getByRole("link", { name: "Bab Kedua", exact: true }),
  ).toHaveCount(0);
  const marker = page.getByRole("link", { name: "Baca catatan kaki 7" });
  await marker.click();
  const note = page.getByRole("dialog", { name: "Catatan kaki 7" });
  await expect(note).toBeVisible();
  await expect(note.locator("strong")).toContainText("Catatan rujukan");
  await page.screenshot({ path: "test-results/maktabah-footnote-desktop.png" });
  const before = await page.evaluate(() => scrollY);
  await page.keyboard.press("Escape");
  await expect(note).not.toBeVisible();
  await expect(marker).toBeFocused();
  expect(await page.evaluate(() => scrollY)).toBe(before);
  await page.setViewportSize({ width: 390, height: 844 });
  await marker.click();
  await expect(note).toBeVisible();
  const box = await note.boundingBox();
  expect(box!.y + box!.height).toBeCloseTo(844, 0);
  await page.screenshot({ path: "test-results/maktabah-footnote-mobile.png" });
  await note.getByRole("button", { name: "Kembali membaca" }).click();
  await expect(marker).toBeFocused();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.evaluate(() => scrollTo(0, 250));
  const origin = await page.evaluate(() => scrollY);
  await navigation.getByRole("tab", { name: "Cari Isi", exact: true }).click();
  await navigation.getByLabel("Cari teks dalam kitab").fill("pengujian posisi");
  await navigation.getByRole("button", { name: "Cari Isi Kitab" }).click();
  await expect(navigation.getByRole("status")).toContainText("20 hasil");
  await navigation.locator(".library-reader-results a").first().click();
  await expect(page).toHaveURL(/t.utama-h.bab2.*result=/);
  await expect(page.locator(".library-search-target")).toBeVisible();
  await expect(page.locator(".library-reading mark").first()).toBeVisible();
  await page
    .getByRole("button", { name: "Hasil berikutnya", exact: true })
    .click();
  await expect(page.locator(".library-search-target")).toBeVisible();
  await navigation
    .getByRole("button", { name: "Berikutnya", exact: true })
    .click();
  await expect(navigation.locator(".library-reader-pagination")).toContainText(
    "2/2",
  );
  await navigation.locator(".library-reader-results a").first().click();
  await expect(page.locator(".library-search-controls")).toContainText(
    "13 / 20",
  );
  await page
    .getByRole("button", { name: "Hasil sebelumnya", exact: true })
    .click();
  await expect(page.locator(".library-search-controls")).toContainText(
    "12 / 20",
  );
  await page
    .getByRole("button", { name: "Hasil berikutnya", exact: true })
    .click();
  await expect(page.locator(".library-search-controls")).toContainText(
    "13 / 20",
  );
  await page.screenshot({
    path: "test-results/maktabah-content-search-desktop.png",
  });
  await page.getByRole("button", { name: "Kembali ke posisi baca" }).click();
  await expect(page).toHaveURL(/t.utama-h.bab1\?lanjut=1/);
  await expect
    .poll(() =>
      page.evaluate((previous) => Math.abs(scrollY - previous), origin),
    )
    .toBeLessThan(100);
});

test("published reading settings control footnote size and search without changing notes", async ({
  page,
  context,
}) => {
  state({ maktabahdocs12345: { version: "catatanpanjang" } });
  await login(context);
  const book = await make(context.request, "Kitab Pengaturan Catatan");
  expect(
    (await post(context.request, { action: "publish", ...book })).status(),
  ).toBe(200);
  const slug = (
    await pool.query("SELECT slug FROM posts WHERE id=$1", [book.id])
  ).rows[0].slug;
  const settings = {
    ...defaultLibrarySettings,
    reading: { footnoteFontSize: 24, searchFootnotes: false },
    search: {
      ...defaultLibrarySettings.search,
      buttonLabel: "Telusuri Koleksi Uji",
    },
  };
  let revision = Number(
    (await (await context.request.get("/api/admin/maktabah")).json()).settings
      .revision,
  );
  expect(
    (
      await post(context.request, { action: "layout-save", revision, settings })
    ).status(),
  ).toBe(200);
  expect(
    (
      await (
        await context.request.get(
          `/api/maktabah/pencarian?q=Catatan+rujukan&kitab=${slug}`,
        )
      ).json()
    ).total,
  ).toBe(1);
  revision++;
  expect(
    (
      await post(context.request, {
        action: "layout-publish",
        revision,
        settings,
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await (
        await context.request.get(
          `/api/maktabah/pencarian?q=Catatan+rujukan&kitab=${slug}`,
        )
      ).json()
    ).total,
  ).toBe(0);
  await page.goto(`/maktabah/kitab/${slug}/baca/t.utama-h.bab1`);
  await expect(page.locator(".kitab-footnotes")).toHaveCSS("font-size", "24px");
  await page.getByRole("link", { name: "Baca catatan kaki 7" }).click();
  await expect(page.getByRole("dialog", { name: "Catatan kaki 7" })).toHaveCSS(
    "font-size",
    "24px",
  );
  const noteBounds = await page
    .getByRole("dialog", { name: "Catatan kaki 7" })
    .boundingBox();
  expect(noteBounds!.y + noteBounds!.height).toBeLessThanOrEqual(
    page.viewportSize()!.height,
  );
  expect(
    await page
      .getByRole("dialog", { name: "Catatan kaki 7" })
      .evaluate((el) => el.scrollHeight > el.clientHeight),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await page.goto("/maktabah");
  await expect(
    page.getByRole("button", { name: "Telusuri Koleksi Uji" }),
  ).toBeVisible();
  await pool.query("DELETE FROM settings WHERE key='maktabah_library'");
});
