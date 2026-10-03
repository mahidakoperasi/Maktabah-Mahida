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
  await pool.query("UPDATE cms_pages SET status='published' WHERE path IN ('/','/karya/artikel','/karya/esai','/karya/terjemahan','/media/berita','/tentang/pendaftaran','/tentang/kontak')");
  for (const [type, category, slug] of [['article',null,'promotion-article'],['essay',null,'promotion-essay'],['news',null,'promotion-news'],['work','terjemahan','promotion-translation']]) {
    await pool.query("INSERT INTO posts(title,slug,type,karya_category,status,content_raw,published_at) VALUES('Judul Arab كتاب',$1,$2,$3,'published',$4,now()) ON CONFLICT(slug) DO UPDATE SET content_raw=excluded.content_raw,status='published'", [slug,type,category,body]);
  }
});
test.afterAll(async () => { await configure(null); await pool.query("DELETE FROM design_documents WHERE path='/tentang/kontak' AND kind='content'"); await pool.end(); });
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
  const preview = page.frameLocator('iframe[title="Layar pratinjau promosi"]');
  await expect(preview.getByRole('button',{name:'Daftar Sekarang'})).toBeDisabled();
  await preview.getByRole('button',{name:'Tutup promosi'}).click();
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

test('old campaigns remain readable; admin fields and independent HP/desktop previews persist', async ({
  page,
  context,
}) => {
  const p = campaign();
  const legacy: Partial<Promotion> = { ...p };
  delete legacy.name;
  delete legacy.posterAlt;
  await pool.query(
    "INSERT INTO settings(key,type,value) VALUES('content_promotion','json',$1) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
    [
      JSON.stringify({
        protectionEnabled: true,
        draft: legacy,
        published: legacy,
      }),
    ],
  );
  expect(
    (await (await context.request.get('/api/promotion')).json()).promotion
      .title,
  ).toBe(p.title);
  await login(context);
  await page.route('https://drive.google.com/**', (route) =>
    route.fulfill({
      contentType: 'image/png',
      body: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aF1sAAAAASUVORK5CYII=',
        'base64',
      ),
    }),
  );
  const events: string[] = [];
  page.on('request', (r) => {
    if (r.url().endsWith('/api/promotion/event')) events.push(r.url());
  });
  await page.goto('/admin/tampilan/promosi');
  await expect(page.getByLabel('Nama promosi', { exact: true })).toHaveValue(
    '',
  );
  await expect(
    page.getByLabel('Teks alternatif poster', { exact: true }),
  ).toHaveValue('');
  await page
    .getByLabel('Nama promosi', { exact: true })
    .fill('SPMB 2027/2028 — kampanye admin');
  await page
    .getByLabel('Teks alternatif poster', { exact: true })
    .fill('Pendaftaran santri MTs dan MA Mahida dibuka');
  await page
    .getByRole('button', { name: 'Simpan Draf & Proteksi', exact: true })
    .click();
  await expect(page.getByRole('status')).toContainText('tersimpan');
  await page.reload();
  await expect(page.getByLabel('Nama promosi', { exact: true })).toHaveValue(
    'SPMB 2027/2028 — kampanye admin',
  );
  await page
    .getByRole('button', { name: 'Pratinjau Pop-up', exact: true })
    .click();
  const frame = page.frameLocator('iframe[title="Layar pratinjau promosi"]');
  await expect(frame.getByRole('dialog')).toBeVisible();
  await expect(frame.getByRole('img')).toHaveAttribute(
    'alt',
    'Pendaftaran santri MTs dan MA Mahida dibuka',
  );
  await expect(
    frame.getByRole('button', { name: 'Daftar Sekarang', exact: true }),
  ).toBeDisabled();
  expect(await frame.locator('body').evaluate(() => innerWidth)).toBe(390);
  await expect(frame.getByRole('dialog')).toHaveCSS(
    'background-color',
    'rgb(251, 250, 244)',
  );
  await page.getByRole('button', { name: 'Desktop', exact: true }).click();
  await expect
    .poll(() => frame.locator('body').evaluate(() => innerWidth))
    .toBe(1280);
  await expect
    .poll(() =>
      frame
        .getByRole('dialog')
        .evaluate((el) => Math.round(el.getBoundingClientRect().width)),
    )
    .toBe(620);
  await page.getByRole('button', { name: 'HP', exact: true }).click();
  await expect
    .poll(() => frame.locator('body').evaluate(() => innerWidth))
    .toBe(390);
  await page.screenshot({ path: 'test-results/promotion-preview-hp.png' });
  await frame
    .getByRole('button', { name: 'Tutup promosi', exact: true })
    .click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(events).toEqual([]);
  await page
    .getByRole('button', { name: 'Terbitkan Promosi', exact: true })
    .click();
  await expect(page.getByRole('status')).toContainText('diterbitkan');
  const published = (await (await context.request.get('/api/promotion')).json())
    .promotion;
  expect(published.name).toBe('SPMB 2027/2028 — kampanye admin');
  expect(published.posterAlt).toBe(
    'Pendaftaran santri MTs dan MA Mahida dibuka',
  );
  const stored = JSON.parse((await pool.query("SELECT value FROM settings WHERE key='content_promotion'")).rows[0].value);
  // Campaign keys remain compatible with the strict schema of the deployed image.
  expect(stored.published).not.toHaveProperty('name');
  expect(stored.published).not.toHaveProperty('posterAlt');
  expect(stored.publishedDetails).toEqual({name:published.name,posterAlt:published.posterAlt});
  await page.getByRole('button', {name:'Jeda Promosi Tayang',exact:true}).click();
  await expect(page.getByRole('status')).toContainText('dijeda');
  const paused = await (await context.request.get('/api/admin/promotion')).json();
  expect(paused.published.name).toBe(published.name);
  expect(paused.published.posterAlt).toBe(published.posterAlt);
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole('button', { name: 'Pratinjau Pop-up', exact: true })
    .click();
  await page.getByRole('button', { name: 'Desktop', exact: true }).click();
  await expect(frame.getByRole('dialog')).toBeVisible();
  expect(await frame.locator('body').evaluate(() => innerWidth)).toBe(1280);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: 'test-results/promotion-preview-desktop-on-hp.png',
  });
  await page
    .getByRole('button', { name: 'Tutup pratinjau', exact: true })
    .click();
});

test('popup waits one second, supports poster alt and starts a fresh visit in another tab', async ({
  page,
  context,
}) => {
  const p = {
    ...campaign(),
    posterAlt: 'Poster SPMB dengan jadwal dan kontak pendaftaran',
  };
  await configure(p);
  await context.route('https://drive.google.com/**', (route) =>
    route.fulfill({
      contentType: 'image/png',
      body: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aF1sAAAAASUVORK5CYII=',
        'base64',
      ),
    }),
  );
  await page.addInitScript(() => {
    const times = { requested: 0, opened: 0 };
    Object.assign(window, { promotionTimes: times });
    const fetchOriginal = window.fetch;
    window.fetch = (...args) => {
      if (args[0] === '/api/promotion') times.requested = performance.now();
      return fetchOriginal(...args);
    };
    new MutationObserver(() => {
      if (!times.opened && document.querySelector('.promotion-dialog[open]'))
        times.opened = performance.now();
    }).observe(document, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['open'],
    });
  });
  await page.goto('/karya/artikel/promotion-article');
  await expect(page.getByRole('dialog')).toBeVisible();
  const elapsed = await page.evaluate(() => {
    const times = (
      window as unknown as {
        promotionTimes: { requested: number; opened: number };
      }
    ).promotionTimes;
    return times.opened - times.requested;
  });
  expect(elapsed).toBeGreaterThanOrEqual(900);
  await expect(page.getByRole('dialog').getByRole('img')).toHaveAttribute(
    'alt',
    p.posterAlt,
  );
  await page.getByRole('button', { name: 'Tutup promosi' }).click();
  const tab = await context.newPage();
  await tab.goto('/karya/esai/promotion-essay');
  await expect(tab.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await tab.close();
});

test('typing in a real public form suppresses a pending popup across internal navigation, but refresh resets it', async ({
  page,
}) => {
  await configure(campaign());
  await pool.query(
    "INSERT INTO design_documents(path,kind,draft,published) VALUES('/tentang/kontak','content',$1::jsonb,$1::jsonb) ON CONFLICT(path,kind) DO UPDATE SET draft=excluded.draft,published=excluded.published",
    [JSON.stringify({ sections: [], contactFormEnabled: true })],
  );
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/api/promotion', async (route) => {
    await gate;
    await route.continue();
  });
  await page.route('https://drive.google.com/**', (route) =>
    route.fulfill({
      contentType: 'image/png',
      body: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aF1sAAAAASUVORK5CYII=',
        'base64',
      ),
    }),
  );
  await page.goto('/tentang/kontak');
  const name = page.getByLabel('Nama', { exact: true });
  await expect(name).toBeVisible();
  await name.fill('Calon santri');
  const config = page.waitForResponse('**/api/promotion');
  release();
  await config;
  // Advance time beyond the display delay and prove the filled form remains usable.
  await page.waitForTimeout(1200);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(name).toHaveValue('Calon santri');
  await page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Beranda', exact: true }).click();
  await expect(page).toHaveURL('http://127.0.0.1:3010/');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('dialog')).toBeVisible();
  await pool.query(
    "DELETE FROM design_documents WHERE path='/tentang/kontak' AND kind='content'",
  );
});

test('embedded registration forms are excluded even when inserted while the poster loads', async ({
  page,
}) => {
  await configure(campaign());
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('https://drive.google.com/**', async (route) => {
    await gate;
    await route.fulfill({
      contentType: 'image/png',
      body: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aF1sAAAAASUVORK5CYII=',
        'base64',
      ),
    });
  });
  await page.goto('/tentang/pendaftaran');
  await expect(page.locator('.promotion-dialog')).toHaveCount(1);
  await page.evaluate(() => {
    const wrapper = document.createElement('section');
    wrapper.dataset.registrationForm = '';
    wrapper.style.height = '100px';
    wrapper.textContent = 'Formulir pendaftaran';
    document.body.append(wrapper);
  });
  await expect(page.locator('.promotion-dialog')).toHaveCount(0);
  release();
  await page.waitForTimeout(200);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('routine promotion statistics respect periods, campaign identity and permissions without leaking raw event IDs', async ({
  page,
  context,
}) => {
  const p = { ...campaign(), name: 'SPMB 2027/2028' };
  await configure(p);
  for (const [age, count] of [
    [0, 10],
    [8, 20],
    [40, 30],
    [181, 100],
  ])
    await pool.query(
      "INSERT INTO analytics_daily(day,path,event,count) VALUES((now() AT TIME ZONE 'Asia/Jakarta')::date-$1::integer,'/karya/artikel/promotion-article',$2,$3) ON CONFLICT(day,path,event) DO UPDATE SET count=excluded.count",
      [age, `p:${p.id}:view`, count],
    );
  for (const [event, count] of [
    ['close', 3],
    ['click', 2],
  ])
    await pool.query(
      "INSERT INTO analytics_daily(day,path,event,count) VALUES((now() AT TIME ZONE 'Asia/Jakarta')::date,'/karya/artikel/promotion-article',$1,$2)",
      [`p:${p.id}:${event}`, count],
    );
  await pool.query(
    "INSERT INTO analytics_daily(day,path,event,count) VALUES((now() AT TIME ZONE 'Asia/Jakarta')::date,'/karya/artikel/promotion-article',$1,777)",
    [`p:${randomUUID()}:view`],
  );
  expect(
    (await context.request.get('/api/admin/analytics?days=7')).status(),
  ).toBe(403);
  await login(context, editor);
  expect(
    (await context.request.get('/api/admin/analytics?days=7')).status(),
  ).toBe(403);
  await context.clearCookies();
  await login(context);
  for (const [days, view] of [
    [7, 10],
    [30, 30],
    [90, 60],
  ]) {
    const stats = await (
      await context.request.get(`/api/admin/analytics?days=${days}`)
    ).json();
    expect(stats.promotion.name).toBe(p.name);
    expect(stats.promotion.counts).toEqual({ view, close: 3, click: 2 });
    for (const rows of [stats.events, stats.daily, stats.clicks])
      expect(
        rows.some((row: { event: string }) => row.event.startsWith('p:')),
      ).toBe(false);
  }
  await page.goto('/admin/pengelolaan?tab=statistik');
  const promotion = page.getByRole('region', {
    name: 'Statistik promosi',
    exact: true,
  });
  await expect(promotion).toContainText(p.name);
  await page.getByLabel('Periode statistik').selectOption('7');
  await expect(promotion.locator('dd').first()).toHaveText('10');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: 'test-results/promotion-routine-mobile.png' });
  const other = { ...campaign(), name: 'Kegiatan Mahida' };
  await configure(other);
  expect(
    (await (await context.request.get('/api/admin/analytics?days=7')).json())
      .promotion.counts,
  ).toEqual({ view: 0, close: 0, click: 0 });
});
