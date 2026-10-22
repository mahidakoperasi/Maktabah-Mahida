import { test, expect } from "./fixtures";
import pg from "pg";
import { randomUUID } from "node:crypto";
import { emptyPromotion } from "../src/lib/promotion-schema";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900"><rect width="600" height="900" fill="#18583f"/><text x="55" y="160" fill="white" font-size="56">SPMB Mahida</text></svg>';
test.beforeAll(async () => {
  if (new URL(process.env.DATABASE_URL!).pathname !== "/mahida_ci") throw Error("Disposable DB required");
  await pool.query("UPDATE cms_pages SET status='published' WHERE path IN ('/','/tentang','/tentang/profil','/tentang/pendaftaran','/maktabah')");
  await pool.query("DELETE FROM settings WHERE key='content_promotion'");
});
test.afterEach(async () => { await pool.query("DELETE FROM settings WHERE key='content_promotion'"); });
test.afterAll(async () => { await pool.end(); });

test("public motion reveals once, settles, and respects live reduced-motion changes", async ({ page }) => {
  await page.addInitScript(() => {
    const animate = Element.prototype.animate;
    (window as unknown as { motionCalls: string[] }).motionCalls = [];
    Element.prototype.animate = function (...args: Parameters<Element["animate"]>) {
      if (this.hasAttribute("data-motion")) {
        (window as unknown as { motionCalls: string[] }).motionCalls.push(this.getAttribute("data-motion")!);
      }
      return animate.apply(this, args);
    };
  });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-public-motion", "on");
  await expect.poll(() => page.evaluate(() => (window as unknown as { motionCalls: string[] }).motionCalls.length)).toBeGreaterThan(0);
  await expect.poll(() => page.locator('[data-motion="hero"]').first().evaluate(el => el.getAnimations().length)).toBe(0);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const before = await page.evaluate(() => (window as unknown as { motionCalls: string[] }).motionCalls.filter(x => x === "hero").length);
  await page.locator("footer").scrollIntoViewIfNeeded();
  await page.evaluate(() => scrollTo(0, 0));
  expect(await page.evaluate(() => (window as unknown as { motionCalls: string[] }).motionCalls.filter(x => x === "hero").length)).toBe(before);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("html")).toHaveAttribute("data-public-motion", "reduce");
  await expect.poll(() => page.evaluate(() => document.getAnimations().length)).toBe(0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator("html")).toHaveAttribute("data-public-motion", "on");
  await page.locator('header.site-nav a[href="/tentang"]').first().click();
  await expect(page).toHaveURL(/\/tentang$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.goto("/masuk");
  await expect(page.locator("html")).not.toHaveAttribute("data-public-motion");
});

test("public content stays visible without JavaScript or animation APIs", async ({ browser, page }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const noJS = await context.newPage();
    await noJS.goto("http://127.0.0.1:3010/");
    await expect(noJS.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(noJS.locator("#unit-heading")).toBeVisible();
    await expect(noJS.locator("footer")).toBeVisible();
  } finally { await context.close(); }
  await page.addInitScript(() => { Object.defineProperty(window, "IntersectionObserver", { value: undefined }); });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("#unit-heading")).toBeVisible();
});

test("mobile menu enters and exits with keyboard focus and scroll restoration", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Buka menu", exact: true });
  await trigger.click();
  await expect(page.getByRole("navigation", { name: "Navigasi ponsel" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("navigation", { name: "Navigasi ponsel" })).toHaveCount(0);
  await expect(trigger).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await trigger.click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("navigation", { name: "Navigasi ponsel" })).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("promotion keeps close and registration visible with long copy on desktop and small phones", async ({ page }) => {
  const promotion = {
    ...emptyPromotion(randomUUID()), enabled: true,
    title: "Pendaftaran santri baru Mahida MTs dan MA tahun ajaran 2027 2028 ".repeat(3).slice(0,160),
    description: "Informasi pendaftaran calon santri dan wali santri Mahida. ".repeat(12).slice(0,600),
    posterUrl: "https://drive.google.com/file/d/promotion12345678/view",
  };
  await pool.query("INSERT INTO settings(key,type,value) VALUES('content_promotion','json',$1) ON CONFLICT(key) DO UPDATE SET value=excluded.value", [JSON.stringify({ protectionEnabled: true, draft: promotion, published: promotion })]);
  await page.route("https://drive.google.com/**", route => route.fulfill({ contentType: "image/svg+xml", body: svg }));
  for (const viewport of [{width:1440,height:900},{width:768,height:700},{width:390,height:844},{width:320,height:568}]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const dialog = page.locator(".promotion-dialog");
    await expect(dialog).toBeVisible();
    const cta = dialog.getByRole("link", { name: "Daftar Sekarang", exact: true });
    const close = dialog.getByRole("button", { name: "Tutup promosi", exact: true });
    for (const item of [cta, close]) {
      const box = (await item.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x+box.width).toBeLessThanOrEqual(viewport.width+1);
      expect(box.y+box.height).toBeLessThanOrEqual(viewport.height+1);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await dialog.locator(".promotion-copy").evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true);
    await page.screenshot({path:`test-results/public-motion-promotion-${viewport.width}.png`});
    await close.click();
    await expect(dialog).toHaveCount(0);
  }
});

test("homepage stagger is capped and banner/card content remains accessible", async ({ page }) => {
  await page.goto("/");
  const cards = page.locator('[data-motion="card"]');
  await expect(cards.first()).toBeVisible();
  const delays = await cards.evaluateAll(elements =>
    elements.map(el => Number((el as HTMLElement).dataset.motionDelay || 0))
  );
  expect(delays.every(delay => Number.isFinite(delay) && delay >= 0 && delay <= 180)).toBe(true);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("html")).toHaveAttribute("data-public-motion", "reduce");
  await expect(cards.first()).toBeVisible();
  await page.setViewportSize({width:320,height:568});
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
