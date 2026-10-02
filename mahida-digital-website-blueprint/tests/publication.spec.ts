import { test, expect } from './fixtures';
import type { BrowserContext, APIRequestContext } from '@playwright/test';
import pg from 'pg';
import jwt from 'jsonwebtoken';
import { readFile } from 'node:fs/promises';
import { checkDriveImages } from '../src/lib/drive-image-check';
import { emptyContent } from '../src/lib/design-schema';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const path = '/uji-penerbitan-r4',
  target = `page:${path}`;
const actors: Record<string, number> = {};
let galleryId: number, postId: number;
const pageData = () => ({
  type: 'page',
  path,
  title: 'Judul Draf R4',
  intro: 'Pengantar draf R4',
  body: 'Teks utama draf R4',
  content: {
    ...emptyContent,
    sections: [
      {
        id: 'section-r4',
        title: 'Teks terkait R4',
        body: 'Isi bagian privat R4',
        enabled: true,
        icon: 'none',
      },
    ],
  },
  media: {
    clips: [
      {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-000000000001',
        area: 'inline',
        afterSection: 'section-r4',
        type: 'image',
        url: 'https://assets.example.invalid/linked-r4.webp',
        alt: 'Media terkait privat R4',
        poster: '',
        size: 'medium',
        ratio: 'landscape',
        focalX: 50,
        focalY: 50,
        crop: true,
      },
    ],
  },
});
async function login(context: BrowserContext, role = 'full') {
  await context.clearCookies();
  await context.addCookies([
    {
      name: 'mahida_session',
      value: jwt.sign({ userId: actors[role], role: 'admin' }, process.env.JWT_SECRET!, {
        expiresIn: '1h',
      }),
      domain: '127.0.0.1',
      path: '/',
    },
  ]);
}
async function read(api: APIRequestContext, key = target) {
  const r = await api.get(`/api/admin/publication?target=${encodeURIComponent(key)}`);
  expect(r.ok()).toBeTruthy();
  return r.json();
}
async function save(
  api: APIRequestContext,
  document: { revision: number; source: string },
  data: unknown,
  action = 'draft',
  key = target,
  scheduledAt?: string,
) {
  return api.put('/api/admin/publication', {
    data: {
      target: key,
      revision: document.revision,
      source: document.source,
      data,
      action,
      scheduledAt,
      checklist: action === 'publish' || action === 'schedule' ? {status:true,photos:true,buttons:true,mobile:true,privacy:true} : undefined,
    },
  });
}
test.beforeAll(async () => {
  if (new URL(process.env.DATABASE_URL!).pathname !== '/mahida_ci')
    throw Error('Disposable mahida_ci required');
  for (const access of ['full', 'content', 'media', 'commerce'])
    actors[access] = (
      await pool.query(
        "INSERT INTO users(email,password,name,role,email_verified,admin_access) VALUES($1,'test-only',$1,'admin',true,$2) ON CONFLICT(email) DO UPDATE SET role='admin',email_verified=true,admin_access=$2 RETURNING id",
        [`r4-${access}@example.invalid`, access],
      )
    ).rows[0].id;
  await pool.query(
    "INSERT INTO cms_pages(path,title,intro,body,status) VALUES($1,'Terbitan Lama R4','','Isi lama R4','published') ON CONFLICT(path) DO UPDATE SET status='published'",
    [path],
  );
  galleryId = (
    await pool.query(
      "INSERT INTO galleries(title,slug,description,status) VALUES('Album R4','album-r4-test','Keterangan R4','draft') RETURNING id",
    )
  ).rows[0].id;
  await pool.query(
    'INSERT INTO gallery_documents(gallery_id,draft) VALUES($1,$2::jsonb)',
    [
      galleryId,
      JSON.stringify({
        title: 'Album R4',
        description: 'Keterangan R4',
        photos: [
          {
            id: 'selected-r4',
            imageUrl: 'https://assets.example.invalid/gallery-r4.webp',
            selected: true,
            visible: true,
          },
          {
            id: 'hidden-r4',
            imageUrl: 'https://assets.example.invalid/secret-r4.webp',
            selected: false,
            visible: true,
          },
        ],
      }),
    ],
  );
  postId = (
    await pool.query(
      "INSERT INTO posts(title,slug,content,content_raw,type,status) VALUES('Pengumuman R4','pengumuman-r4-test','Teks pengumuman R4','Teks pengumuman R4','announcement','draft') RETURNING id",
    )
  ).rows[0].id;
});
test.beforeEach(async ({ context, page }) => {
  await login(context);
  await pool.query(
    'DELETE FROM publication_documents WHERE target=$1 OR target=$2 OR target=$3',
    [target, `gallery:${galleryId}`, `announcement:${postId}`],
  );
  await pool.query('DELETE FROM design_documents WHERE path=$1', [path]);
  await pool.query(
    "UPDATE cms_pages SET title='Terbitan Lama R4',body='Isi lama R4',status='published' WHERE path=$1",
    [path],
  );
  await pool.query("UPDATE galleries SET status='draft' WHERE id=$1", [galleryId]);
  await pool.query(
    "UPDATE posts SET title='Pengumuman R4',content='Teks pengumuman R4',content_raw='Teks pengumuman R4',status='draft' WHERE id=$1",
    [postId],
  );
  await page.route('https://assets.example.invalid/**', (r) =>
    r.fulfill({ contentType: 'image/webp', path: 'public/brand/mahida-logo.webp' }),
  );
  await page.route('https://drive.google.com/thumbnail**', (r) =>
    r.fulfill({ contentType: 'image/webp', path: 'public/brand/mahida-logo.webp' }),
  );
  await page.route('https://fonts.googleapis.com/**', (r) =>
    r.fulfill({ contentType: 'text/css', body: '' }),
  );
  await page.route('https://fonts.gstatic.com/**', (r) => r.abort());
});
test.afterAll(async () => {
  await pool.query('DELETE FROM publication_documents WHERE target=ANY($1)', [
    [target, `gallery:${galleryId}`, `announcement:${postId}`],
  ]);
  await pool.query('DELETE FROM design_documents WHERE path=$1', [path]);
  await pool.query('DELETE FROM cms_pages WHERE path=$1', [path]);
  await pool.query('DELETE FROM galleries WHERE id=$1', [galleryId]);
  await pool.query('DELETE FROM posts WHERE id=$1', [postId]);
  await pool.end();
});
test('Drive checks enforce public photo metadata, resource keys, fixed endpoints and no key disclosure', async () => {
  const calls: { url: URL; init?: RequestInit }[] = [];
  const good = async (input: unknown, init?: RequestInit) => {
    calls.push({ url: new URL(String(input)), init });
    return Response.json({ mimeType: 'image/jpeg', trashed: false });
  };
  const url =
    'https://drive.google.com/file/d/publicfile12345/view?resourcekey=resource-r4';
  await checkDriveImages(
    [url, url, 'https://assets.example.invalid/local.webp'],
    'private-test-key',
    good as typeof fetch,
  );
  expect(calls).toHaveLength(1);
  expect(calls[0].url.origin).toBe('https://www.googleapis.com');
  expect(calls[0].url.search).not.toContain('private-test-key');
  expect(calls[0].init?.headers).toMatchObject({
    'X-Goog-Drive-Resource-Keys': 'publicfile12345/resource-r4',
  });
  await expect(checkDriveImages([url], '', good as typeof fetch)).rejects.toThrow(
    'konfigurasi',
  );
  await expect(
    checkDriveImages(
      [url],
      'key',
      async () => Response.json({ mimeType: 'application/pdf' }) as Response,
    ),
  ).rejects.toThrow('foto aktif');
  await expect(
    checkDriveImages([url], 'key', async () => new Response('', { status: 404 })),
  ).rejects.toThrow('publik');
  await expect(
    checkDriveImages([url], 'key', async () => {
      throw Error('private-test-key');
    }),
  ).rejects.not.toThrow('private-test-key');
  expect(await readFile('drizzle/0014_unified_publication.sql', 'utf8')).not.toMatch(
    /DROP TABLE|DELETE FROM/i,
  );
});
test('drafts remain private and full page preview requires both page privileges; spoofed headers fail', async ({
  context,
  page,
}) => {
  const result = await save(context.request, await read(context.request), pageData());
  expect(result.status()).toBe(200);
  const plain = await context.request.get(path);
  expect(await plain.text()).not.toContain('Judul Draf R4');
  await page.goto(`${path}?publicationPreview=${encodeURIComponent(target)}`);
  await expect(
    page.getByRole('heading', { name: 'Judul Draf R4', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Isi bagian privat R4', { exact: true })).toBeVisible();
  for (const role of ['media', 'content', 'commerce']) {
    await login(context, role);
    expect(
      (
        await context.request.get(
          `/api/admin/publication?target=${encodeURIComponent(target)}`,
        )
      ).status(),
    ).toBe(403);
    const r = await context.request.get(
      `${path}?publicationPreview=${encodeURIComponent(target)}`,
    );
    expect(await r.text()).not.toContain('Judul Draf R4');
  }
  await context.clearCookies();
  const fake = await context.request.get(path, {
    headers: { 'x-mahida-publication-preview': target, 'x-mahida-public-path': path },
  });
  expect(await fake.text()).not.toContain('Judul Draf R4');
});
test('atomic linked publish, cross-session conflict and recoverable versions preserve public text/media', async ({
  context,
}) => {
  let doc = await read(context.request);
  const initial = doc;
  doc = await (await save(context.request, doc, pageData())).json();
  expect((await save(context.request, initial, pageData())).status()).toBe(409);
  const denied = await save(
    context.request,
    doc,
    pageData(),
    'publish',
    target,
    undefined,
  );
  expect(denied.status()).toBe(200);
  doc = await denied.json();
  const publicHtml = await (await context.request.get(path)).text();
  expect(publicHtml).toContain('Judul Draf R4');
  expect(publicHtml).toContain('Media terkait privat R4');
  const old = doc.history[0].data;
  const restored = await save(context.request, doc, old);
  expect(restored.status()).toBe(200);
  doc = await restored.json();
  expect(await (await context.request.get(path)).text()).toContain('Judul Draf R4');
  expect((await save(context.request, doc, old, 'publish')).status()).toBe(200);
  const html = await (await context.request.get(path)).text();
  expect(html).toContain('Terbitan Lama R4');
  expect(html).not.toContain('Media terkait privat R4');
});
test('Drive denial and related editor changes block publishing without partial writes', async ({
  context,
}) => {
  let doc = await read(context.request);
  const data = {
    ...pageData(),
    media: {
      clips: [],
      headerLogoUrl: 'https://drive.google.com/file/d/deniedfile123456/view',
    },
  };
  doc = await (await save(context.request, doc, data)).json();
  expect((await save(context.request, doc, data, 'publish')).status()).toBe(400);
  expect(await (await context.request.get(path)).text()).toContain('Terbitan Lama R4');
  await pool.query('UPDATE design_documents SET revision=revision+1 WHERE path=$1', [
    path,
  ]);
  expect((await save(context.request, doc, pageData())).status()).toBe(409);
});
test('scheduled announcement freezes reviewed version and keeps later drafts private; cancellation works', async ({
  context,
}) => {
  const key = `announcement:${postId}`;
  let doc = await read(context.request, key);
  const data = { ...doc.draft, title: 'Jadwal Beku R4' };
  doc = await (
    await save(
      context.request,
      doc,
      data,
      'schedule',
      key,
      new Date(Date.now() + 3600000).toISOString(),
    )
  ).json();
  expect((await context.request.get(doc.publicPath)).status()).toBe(404);
  doc = await (
    await save(
      context.request,
      doc,
      { ...data, title: 'Draf Lebih Baru R4' },
      'draft',
      key,
    )
  ).json();
  await pool.query(
    "UPDATE publication_documents SET scheduled_at=now()-interval '1 second' WHERE target=$1",
    [key],
  );
  const r = await context.request.get(doc.publicPath);
  expect(r.status()).toBe(200);
  expect(await r.text()).toContain('Jadwal Beku R4');
  expect(await r.text()).not.toContain('Draf Lebih Baru R4');
  doc = await read(context.request, key);
  expect(doc.draft.title).toBe('Draf Lebih Baru R4');
  doc = await (
    await save(
      context.request,
      doc,
      doc.draft,
      'schedule',
      key,
      new Date(Date.now() + 3600000).toISOString(),
    )
  ).json();
  doc = await (await save(context.request, doc, doc.draft, 'cancel', key)).json();
  expect(doc.scheduled_at).toBeNull();
});
test('scheduled gallery projects only selected photos, preserves album slug and newer kurations', async ({
  context,
}) => {
  const key = `gallery:${galleryId}`;
  let doc = await read(context.request, key);
  doc = await (
    await save(
      context.request,
      doc,
      doc.draft,
      'schedule',
      key,
      new Date(Date.now() + 3600000).toISOString(),
    )
  ).json();
  await pool.query(
    "UPDATE gallery_documents SET draft=jsonb_set(draft,'{title}','\"Draf Album Baru R4\"'::jsonb),revision=revision+1 WHERE gallery_id=$1",
    [galleryId],
  );
  await pool.query(
    "UPDATE publication_documents SET scheduled_at=now()-interval '1 second' WHERE target=$1",
    [key],
  );
  const r = await context.request.get(doc.publicPath);
  expect(r.status()).toBe(200);
  const html = await r.text();
  expect(html).toContain('gallery-r4.webp');
  expect(html).not.toContain('secret-r4.webp');
  const next = await read(context.request, key);
  expect(next.draft.data.title).toBe('Draf Album Baru R4');
  expect(next.publicPath).toBe('/media/galeri/album-r4-test');
});
test('autosave, full preview, optional header and page publication work through Admin UI', async ({
  page,
  context,
}) => {
  await page.goto(`/admin/tampilan/penerbitan?target=${encodeURIComponent(target)}`);
  await page.getByLabel('Judul halaman', { exact: true }).fill('Judul Otomatis R4');
  await expect
    .poll(async () => (await read(context.request)).draft.title)
    .toBe('Judul Otomatis R4');
  expect(await (await context.request.get(path)).text()).not.toContain(
    'Judul Otomatis R4',
  );
  await page.getByRole('button', { name: 'Pratinjau halaman lengkap' }).click();
  await expect(
    page
      .frameLocator('iframe[title="Pratinjau penerbitan lengkap"]')
      .getByRole('heading', { name: 'Judul Otomatis R4', exact: true }),
  ).toBeVisible();
  await expect(
    page
      .frameLocator('iframe[title="Pratinjau penerbitan lengkap"]')
      .locator('[data-publication-header]'),
  ).toHaveCount(0);
  await page
    .getByLabel('URL Drive logo header', { exact: true })
    .fill('https://drive.google.com/file/d/publicfile12345/view');
  await expect
    .poll(async () => (await read(context.request)).draft.media?.headerLogoUrl)
    .toContain('publicfile12345');
  page.on('dialog', (dialog) => dialog.accept());
  for (const checkbox of await page.getByRole('region', {name:'Checklist sebelum terbit'}).getByRole('checkbox').all()) await checkbox.check();
  await page.getByRole('button', { name: 'Terbitkan teks & media' }).click();
  await expect(page.getByRole('status')).toContainText('diterbitkan bersama');
  await page.goto(path);
  await expect(page.locator('[data-publication-header]')).toBeVisible();
});
test('gallery sidebar stays within content, optional logo scrolls away, mobile dialog restores focus', async ({
  page,
}) => {
  const logo = 'https://drive.google.com/file/d/publicfile12345/view';
  await pool.query(
    "INSERT INTO design_documents(path,kind,draft,published) VALUES('/media/galeri','media',$1::jsonb,$1::jsonb) ON CONFLICT(path,kind) DO UPDATE SET published=$1::jsonb",
    [JSON.stringify({ clips: [], headerLogoUrl: logo, useLegacyMedia: true })],
  );
  await pool.query("UPDATE cms_pages SET body=$1 WHERE path='/media/galeri'", [
    'Paragraf galeri panjang.\n\n'.repeat(70),
  ]);
  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 850 });
    await page.goto('/media/galeri');
    await expect(page.locator('[data-publication-header]')).toBeVisible();
    const header = (await page.locator('[data-publication-header]').boundingBox())!;
    const navigation = (await page.locator('header.site-nav').boundingBox())!;
    expect(header.y + header.height).toBeLessThanOrEqual(navigation.y + 1);
    expect(await page.locator('main [data-publication-header]').count()).toBe(0);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
    ).toBeTruthy();
    if (width === 1440)
      await page.screenshot({ path: 'test-results/header-above-navigation.png' });
    if (width >= 1024) {
      await page.evaluate(() => scrollTo(0, 600));
      expect(
        (await page.locator('[data-publication-header]').boundingBox())!.y,
      ).toBeLessThan(0);
      expect((await page.locator('header.site-nav').boundingBox())!.y).toBe(0);
      expect(
        (await page.locator('[data-gallery-sidebar]').boundingBox())!.y,
      ).toBeGreaterThanOrEqual(80);
    } else {
      const menuTrigger = page.getByRole('button', { name: 'Buka menu', exact: true });
      await menuTrigger.click();
      const mobileMenu = page.getByRole('navigation', { name: 'Navigasi ponsel' });
      await expect(mobileMenu).toBeVisible();
      const menuBounds = (await mobileMenu.boundingBox())!;
      expect(Math.abs(menuBounds.y - navigation.y - navigation.height)).toBeLessThanOrEqual(1);
      expect(menuBounds.y + menuBounds.height).toBeLessThanOrEqual(851);
      await page.keyboard.press('Escape');
      await expect(menuTrigger).toBeFocused();
      const trigger = page.getByRole('button', { name: 'Buka menu galeri' });
      await trigger.click();
      await expect(
        page.getByRole('dialog', { name: 'Menu galeri', exact: true }),
      ).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(trigger).toBeFocused();
    }
  }
  await page.screenshot({ path: 'test-results/r4-gallery-desktop.png', fullPage: false });
  await pool.query(
    "DELETE FROM design_documents WHERE path='/media/galeri' AND kind='media'",
  );
  await page.goto('/media/galeri');
  await expect(page.locator('[data-publication-header]')).toHaveCount(0);
  expect((await page.locator('header.site-nav').boundingBox())!.y).toBe(0);
});

test('revoked publisher and archived album cancel due schedules without restoring hidden content', async ({
  context,
}) => {
  const key = `gallery:${galleryId}`;
  await login(context, 'media');
  let doc = await read(context.request, key);
  const r = await save(
    context.request,
    doc,
    doc.draft,
    'schedule',
    key,
    new Date(Date.now() + 3600000).toISOString(),
  );
  expect(r.status()).toBe(200);
  await pool.query("UPDATE users SET admin_access='commerce' WHERE id=$1", [
    actors.media,
  ]);
  await pool.query(
    "UPDATE publication_documents SET scheduled_at=now()-interval '1 second' WHERE target=$1",
    [key],
  );
  await context.request.get('/media/galeri');
  const failed = (
    await pool.query(
      'SELECT scheduled_at,scheduled_error FROM publication_documents WHERE target=$1',
      [key],
    )
  ).rows[0];
  expect(failed.scheduled_at).toBeNull();
  expect(failed.scheduled_error).toContain('hak penerbit');
  await pool.query("UPDATE users SET admin_access='media' WHERE id=$1", [actors.media]);
  doc = await read(context.request, key);
  expect(
    (
      await save(
        context.request,
        doc,
        doc.draft,
        'schedule',
        key,
        new Date(Date.now() + 3600000).toISOString(),
      )
    ).status(),
  ).toBe(200);
  await pool.query("UPDATE galleries SET status='archived' WHERE id=$1", [galleryId]);
  await pool.query(
    "UPDATE publication_documents SET scheduled_at=now()-interval '1 second' WHERE target=$1",
    [key],
  );
  await context.request.get('/media/galeri');
  expect(
    (await pool.query('SELECT status FROM galleries WHERE id=$1', [galleryId])).rows[0]
      .status,
  ).toBe('archived');
  expect(
    (
      await pool.query(
        'SELECT scheduled_error FROM publication_documents WHERE target=$1',
        [key],
      )
    ).rows[0].scheduled_error,
  ).toContain('diarsipkan');
});

test('gallery restore loads paired text/photos to draft and unauthorized callers cannot schedule or mutate', async ({
  context,
}) => {
  const key = `gallery:${galleryId}`;
  let doc = await read(context.request, key);
  const initial = doc.draft;
  doc = await (await save(context.request, doc, initial, 'publish', key)).json();
  const changed = {
    ...initial,
    data: {
      ...initial.data,
      title: 'Terbitan Kedua R4',
      photos: [
        ...initial.data.photos,
        {
          id: 'new-r4',
          imageUrl: 'https://assets.example.invalid/new-r4.webp',
          selected: true,
          visible: true,
        },
      ],
    },
  };
  doc = await (await save(context.request, doc, changed, 'publish', key)).json();
  const historical = doc.history[0].data;
  doc = await (await save(context.request, doc, historical, 'draft', key)).json();
  expect((await read(context.request, key)).draft.data.title).toBe(initial.data.title);
  expect(await (await context.request.get(doc.publicPath)).text()).toContain(
    'Terbitan Kedua R4',
  );
  for (const scope of ['content', 'commerce']) {
    await login(context, scope);
    expect((await save(context.request, doc, historical, 'publish', key)).status()).toBe(
      403,
    );
  }
  await login(context, 'full');
  expect(
    (
      await context.request.put('/api/admin/publication', {
        headers: { origin: 'https://evil.invalid' },
        data: {
          target: key,
          revision: doc.revision,
          source: doc.source,
          data: historical,
          action: 'publish',
        },
      })
    ).status(),
  ).toBe(403);
});

test('adding a header preserves legacy gallery images and full reviewers can pair unpublished sections', async ({
  context,
  page,
}) => {
  const galleryPath = '/media/galeri';
  const image = 'https://assets.example.invalid/legacy-keep-r4.webp';
  const prior = (
    await pool.query('SELECT value FROM settings WHERE key=$1', [
      `editorial:${galleryPath}`,
    ])
  ).rows[0];
  await pool.query(
    "INSERT INTO settings(key,value,type) VALUES($1,$2,'json') ON CONFLICT(key) DO UPDATE SET value=$2",
    [`editorial:${galleryPath}`, JSON.stringify({ images: [image] })],
  );
  await pool.query(
    "INSERT INTO design_documents(path,kind,draft,published) VALUES($1,'media',$2::jsonb,$2::jsonb) ON CONFLICT(path,kind) DO UPDATE SET draft=$2::jsonb,published=$2::jsonb",
    [
      galleryPath,
      JSON.stringify({
        clips: [],
        headerLogoUrl: 'https://drive.google.com/file/d/publicfile12345/view',
        useLegacyMedia: true,
      }),
    ],
  );
  try {
    await page.goto(galleryPath);
    await expect(page.locator('[data-publication-header]')).toBeVisible();
    await expect(page.locator(`img[src="${image}"]`)).toBeVisible();
    await save(context.request, await read(context.request), pageData());
    const full = await (await context.request.get('/api/admin/design/pages')).json();
    expect(
      full.pages
        .find((p: { path: string }) => p.path === path)
        .sections.some((s: { id: string }) => s.id === 'section-r4'),
    ).toBeTruthy();
    await login(context, 'media');
    const media = await (await context.request.get('/api/admin/design/pages')).json();
    expect(
      media.pages
        .find((p: { path: string }) => p.path === path)
        .sections.some((s: { id: string }) => s.id === 'section-r4'),
    ).toBeFalsy();
  } finally {
    await pool.query("DELETE FROM design_documents WHERE path=$1 AND kind='media'", [
      galleryPath,
    ]);
    if (prior)
      await pool.query('UPDATE settings SET value=$2 WHERE key=$1', [
        `editorial:${galleryPath}`,
        prior.value,
      ]);
    else
      await pool.query('DELETE FROM settings WHERE key=$1', [`editorial:${galleryPath}`]);
  }
});
