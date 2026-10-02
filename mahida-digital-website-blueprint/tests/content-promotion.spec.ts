import { test, expect } from './fixtures';
import type { BrowserContext } from '@playwright/test';
import pg from 'pg';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { activePromotion, emptyPromotion, promotionSchema, promotionHref, type Promotion } from '../src/lib/promotion-schema';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
let admin: number, editor: number;
const body = 'Teks Indonesia dengan **بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ** di tengah kalimat. Paragraf panjang untuk menguji perataan isi di semua ukuran layar.\n\nبِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\n\n## Judul isi\n\n[Tautan tetap bekerja](https://example.org)';
const poster = 'https://drive.google.com/file/d/promotion12345678/view';
function campaign(): Promotion { return { ...emptyPromotion(randomUUID()), title: 'SPMB Mahida', posterUrl: poster, enabled: true }; }
async function configure(published: Promotion | null, enabled = true) { await pool.query("INSERT INTO settings(key,type,value) VALUES('content_promotion','json',$1) ON CONFLICT(key) DO UPDATE SET value=excluded.value", [JSON.stringify({ protectionEnabled: enabled, draft: published, published })]); }
async function login(context: BrowserContext, id = admin) { await context.addCookies([{ name: 'mahida_session', value: jwt.sign({ userId: id, role: 'admin' }, process.env.JWT_SECRET!, { expiresIn: '1h' }), domain: '127.0.0.1', path: '/' }]); }
test.beforeAll(async () => {
  if (new URL(process.env.DATABASE_URL!).pathname !== '/mahida_ci') throw Error('Disposable mahida_ci required');
  for (const access of ['full','content']) {
    const id = (await pool.query("INSERT INTO users(email,password,name,role,email_verified,admin_access) VALUES($1,'test-only',$1,'admin',true,$2) ON CONFLICT(email) DO UPDATE SET admin_access=$2 RETURNING id", [`promotion-${access}@example.invalid`, access])).rows[0].id;
    if (access === 'full') admin = id; else editor = id;
  }
  await pool.query("UPDATE cms_pages SET status='published' WHERE path IN ('/','/karya/artikel','/karya/esai','/karya/terjemahan','/media/berita','/tentang/pendaftaran')");
  for (const [type, category, slug] of [['article',null,'promotion-article'],['essay',null,'promotion-essay'],['news',null,'promotion-news'],['work','terjemahan','promotion-translation']]) {
    await pool.query("INSERT INTO posts(title,slug,type,karya_category,status,content_raw,published_at) VALUES('Judul Arab كتاب',$1,$2,$3,'published',$4,now()) ON CONFLICT(slug) DO UPDATE SET content_raw=excluded.content_raw,status='published'", [slug,type,category,body]);
  }
});
test.afterAll(async () => { await configure(null); await pool.end(); });
test('schedule boundaries and unsafe destinations are rejected', () => {
  const now = Date.now(), p = campaign();
  expect(activePromotion({ ...p, startsAt: new Date(now + 1000).toISOString() }, now)).toBeNull();
  expect(activePromotion({ ...p, startsAt: new Date(now).toISOString() }, now)).not.toBeNull();
  expect(activePromotion({ ...p, endsAt: new Date(now).toISOString() }, now)).toBeNull();
  expect(promotionSchema.safeParse({ ...p, startsAt: new Date(now).toISOString(), endsAt: new Date(now - 1).toISOString() }).success).toBe(false);
  for (const url of ['javascript:alert(1)','//evil.test','/api/secrets','/admin','/%61dmin','/one/../admin','https://name:pass@example.org','/\\evil.test']) expect(promotionHref(url)).toBeNull();
  expect(promotionHref('/tentang/pendaftaran')).toBe('/tentang/pendaftaran');
});
test('public protection, mixed Arabic font, RTL and justify on desktop/mobile', async ({ page }) => {
  await configure(null);
  for (const width of [1280,390]) {
    await page.setViewportSize({ width, height: 844 });
    for (const path of ['/karya/artikel/promotion-article','/karya/esai/promotion-essay','/media/berita/promotion-news','/karya/terjemahan/promotion-translation']) {
      await page.goto(path);
      await expect(page.locator('[data-protected-reading]')).toHaveCount(1);
      await expect(page.locator('.reading-text > p').first()).toHaveCSS('text-align','justify');
      await expect(page.locator('.reading-text > p').nth(1)).toHaveCSS('direction','rtl');
      await expect(page.locator('.reading-text > p').first()).toHaveCSS('direction','ltr');
      await expect(page.locator('.reading-text h2')).toHaveCSS('text-align','start');
      const font = await page.locator('.reading-text .arabic-inline').first().evaluate(el => getComputedStyle(el).fontFamily);
      expect(font).toContain('Amiri');
      const prevented = await page.locator('.reading-text > p').first().evaluate(el => { const ev = new Event('copy', { bubbles: true, cancelable: true }); el.dispatchEvent(ev); return ev.defaultPrevented; });
      expect(prevented).toBe(true);
      expect(await page.locator('.reading-text > p').first().evaluate(el => { const range = document.createRange(); range.selectNodeContents(el); const selection = getSelection()!; selection.removeAllRanges(); selection.addRange(range); const ev = new Event('copy', { bubbles: true, cancelable: true }); document.body.dispatchEvent(ev); selection.removeAllRanges(); return ev.defaultPrevented; })).toBe(true);
      expect(await page.locator('.reading-text > p').first().evaluate(el => { const ev = new Event('dragstart', { bubbles: true, cancelable: true }); el.dispatchEvent(ev); return ev.defaultPrevented; })).toBe(true);
      const link = page.getByRole('link',{name:'Tautan tetap bekerja'});
      await expect(link).toHaveAttribute('href','https://example.org/');
      expect(await link.evaluate(el => { const ev = new Event('contextmenu',{bubbles:true,cancelable:true}); el.dispatchEvent(ev); return ev.defaultPrevented; })).toBe(false);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  }
});
test('protection toggle and admin editors permit copying', async ({ page, context }) => {
  await configure(null,false);
  await page.goto('/karya/artikel/promotion-article');
  await expect(page.locator('[data-protected-reading]')).toHaveCount(0);
  await login(context);
  await page.goto('/admin/tampilan/promosi');
  await expect(page.getByRole('heading',{name:'Proteksi & Promosi',exact:true})).toBeVisible();
  await page.getByLabel('Judul promosi',{exact:true}).fill('Dapat disalin');
  expect(await page.getByLabel('Judul promosi',{exact:true}).evaluate(el => { const ev = new Event('copy',{bubbles:true,cancelable:true}); el.dispatchEvent(ev); return ev.defaultPrevented; })).toBe(false);
  await expect(page.locator('[data-protected-reading]')).toHaveCount(0);
});
test('admin authorization, draft isolation, Drive failure, publish and pause', async ({ context }) => {
  await configure(null);
  const draft = campaign();
  expect((await context.request.get('/api/admin/promotion')).status()).toBe(403);
  await login(context,editor);
  expect((await context.request.put('/api/admin/promotion',{data:{action:'save',draft,protectionEnabled:true}})).status()).toBe(403);
  await context.clearCookies(); await login(context);
  expect((await context.request.put('/api/admin/promotion',{data:{action:'save',draft,protectionEnabled:true}})).status()).toBe(200);
  expect((await (await context.request.get('/api/promotion')).json()).promotion).toBeNull();
  const denied = await context.request.put('/api/admin/promotion',{data:{action:'publish',draft:{...draft,posterUrl:'https://drive.google.com/file/d/denied12345678/view'},protectionEnabled:true}});
  expect(denied.status()).toBe(400);
  expect((await context.request.put('/api/admin/promotion',{data:{action:'publish',draft,protectionEnabled:true}})).status()).toBe(200);
  expect((await (await context.request.get('/api/promotion')).json()).promotion.title).toBe(draft.title);
  expect((await context.request.put('/api/admin/promotion',{data:{action:'save',draft:{...draft,title:'Draf berikut'},protectionEnabled:true}})).status()).toBe(200);
  expect((await (await context.request.get('/api/promotion')).json()).promotion.title).toBe(draft.title);
  expect((await context.request.put('/api/admin/promotion',{data:{action:'pause',draft,protectionEnabled:true}})).status()).toBe(200);
  expect((await (await context.request.get('/api/promotion')).json()).promotion).toBeNull();
});
test('popup from deep link remains dismissed on navigation and returns after refresh', async ({ page }) => {
  const events: { event: string; visit: string; path: string }[] = [];
  page.on('request', request => { if (request.url().endsWith('/api/promotion/event')) events.push(request.postDataJSON()); });
  await configure(campaign());
  await page.route('https://drive.google.com/**', route => route.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aF1sAAAAASUVORK5CYII=','base64')}));
  await page.goto('/karya/artikel/promotion-article');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(page.getByRole('button',{name:'Tutup promosi'})).toBeFocused();
  await page.screenshot({path:'test-results/promotion-desktop.png'});
  await page.getByRole('button',{name:'Tutup promosi'}).click();
  await expect.poll(() => events.map(e => e.event)).toEqual(['view','close']);
  expect(events[0].path).toBe('/karya/artikel/promotion-article');
  await expect(dialog).toHaveCount(0);
  await page.getByRole('link',{name:'Semua Artikel',exact:true}).click();
  await expect(page).toHaveURL(/\/karya\/artikel$/);
  await expect(dialog).toHaveCount(0);
  await page.reload();
  await expect(dialog).toBeVisible();
  await page.getByRole('link',{name:'Daftar Sekarang',exact:true}).click();
  await expect.poll(() => events.map(e => e.event)).toEqual(['view','close','view','click']);
  expect(events[2].visit).not.toBe(events[0].visit);
  await expect(page).toHaveURL(/\/tentang\/pendaftaran$/);
  await expect(dialog).toHaveCount(0);
  await page.setViewportSize({width:390,height:844});
  await page.reload(); await expect(dialog).toBeVisible();
  expect(await dialog.evaluate(el => el.getBoundingClientRect().width <= innerWidth && el.getBoundingClientRect().height <= innerHeight)).toBe(true);
  await page.screenshot({path:'test-results/promotion-mobile.png'});
  await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0);
});
test('preview, login, future, expired, failed poster do not obstruct pages', async ({ page, context }) => {
  const p = campaign(); await configure(p);
  await page.goto('/masuk'); await expect(page.getByRole('dialog')).toHaveCount(0);
  await login(context); await page.goto('/admin/tampilan/promosi');
  await page.getByRole('button',{name:'Pratinjau Pop-up'}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('button',{name:'Daftar Sekarang'})).toBeDisabled();
  await page.getByRole('button',{name:'Tutup promosi'}).click();
  await context.clearCookies();
  for (const timing of [{startsAt:new Date(Date.now()+3600000).toISOString()},{endsAt:new Date(Date.now()-3600000).toISOString()}]) {
    await configure({...p,...timing}); await page.goto('/karya/artikel/promotion-article'); await expect(page.getByRole('dialog')).toHaveCount(0);
  }
  await configure(p); await page.route('https://drive.google.com/**',route=>route.abort());
  await page.goto('/karya/artikel/promotion-article');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByRole('link',{name:'Semua Artikel',exact:true})).toBeVisible();
});
test('statistics are anonymous, deduplicated and exclude privacy/admin traffic', async ({ context }) => {
  const p = campaign(); await configure(p);
  const payload = {id:p.id,visit:randomUUID(),event:'view',path:'/karya/artikel/promotion-article'};
  const headers = {'User-Agent':'Mozilla/5.0 MahidaVisitor',Origin:'http://127.0.0.1:3010'};
  for (let i=0;i<2;i++) expect((await context.request.post('/api/promotion/event',{headers,data:payload})).status()).toBe(204);
  await context.request.post('/api/promotion/event',{headers:{...headers,DNT:'1'},data:{...payload,visit:randomUUID()}});
  await context.request.post('/api/promotion/event',{headers:{...headers,'Sec-GPC':'1'},data:{...payload,visit:randomUUID()}});
  expect((await context.request.post('/api/promotion/event',{headers:{...headers,Origin:'https://evil.test'},data:payload})).status()).toBe(403);
  await login(context);
  await context.request.post('/api/promotion/event',{headers,data:{...payload,visit:randomUUID()}});
  const result = await (await context.request.get('/api/admin/promotion')).json();
  expect(result.statistics.view).toBe(1);
  expect(result.statistics.close).toBe(0);
});
