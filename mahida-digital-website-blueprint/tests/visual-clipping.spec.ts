import { type BrowserContext, type APIRequestContext } from '@playwright/test';
import { test, expect } from './fixtures';
import pg from 'pg';
import jwt from 'jsonwebtoken';
import { readFile } from 'node:fs/promises';
import {
  BODY_SECTION,
  emptyContent,
  mediaSchema,
  type Clip,
  type MediaDesign,
} from '../src/lib/design-schema';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const profile = '/tentang/profil';
const custom = '/uji-kliping-r3';
const actors: Record<string, number> = {};
const photo = (n = 1, patch: Partial<Clip> = {}): Clip => ({
  id: `aaaaaaaa-aaaa-4aaa-8aaa-${String(n).padStart(12, '0')}`,
  area: 'inline',
  afterSection: BODY_SECTION,
  type: 'image',
  url: `https://assets.example.invalid/r3-${n}.webp`,
  alt: `Foto R3 ${n}`,
  poster: '',
  size: 'medium',
  ratio: 'portrait',
  focalX: 25,
  focalY: 75,
  crop: true,
  ...patch,
});
const content = (title = 'Sejarah dan Muassis') => ({
  ...emptyContent,
  sections: [
    {
      id: 'history-r3',
      title,
      body: '## Catatan Mahida\n\nTeks sejarah yang sudah disetujui. '.repeat(
        12,
      ),
      enabled: true,
      icon: 'none' as const,
    },
  ],
});
async function login(context: BrowserContext, access = 'media') {
  await context.clearCookies();
  await context.addCookies([
    {
      name: 'mahida_session',
      value: jwt.sign(
        { userId: actors[access], role: 'admin' },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' },
      ),
      domain: '127.0.0.1',
      path: '/',
    },
  ]);
}
async function put(
  api: APIRequestContext,
  path: string,
  data: unknown,
  revision = 0,
  action = 'publish',
  kind = 'media',
) {
  return api.put('/api/admin/design', {
    data: { path, kind, data, revision, action },
  });
}
async function seed(path: string, data: unknown, kind = 'content') {
  await pool.query(
    'INSERT INTO design_documents(path,kind,draft,published) VALUES($1,$2,$3::jsonb,$3::jsonb)',
    [path, kind, JSON.stringify(data)],
  );
}

test.beforeAll(async () => {
  if (
    !process.env.DATABASE_URL ||
    new URL(process.env.DATABASE_URL).pathname !== '/mahida_ci'
  )
    throw Error('Release 3 tests require disposable mahida_ci');
  for (const access of ['media', 'content', 'commerce', 'admissions', 'full']) {
    actors[access] = (
      await pool.query(
        "INSERT INTO users(email,password,name,role,email_verified,admin_access) VALUES($1,'test-only',$2,'admin',true,$3) ON CONFLICT(email) DO UPDATE SET admin_access=$3,role='admin',email_verified=true RETURNING id",
        [`r3-${access}@example.invalid`, `R3 ${access}`, access],
      )
    ).rows[0].id;
  }
  await pool.query(
    "INSERT INTO cms_pages(path,title,intro,body,status) VALUES($1,'Halaman uji R3','Pengantar uji','Teks utama resmi untuk kliping.','published') ON CONFLICT(path) DO UPDATE SET status='published'",
    [custom],
  );
});
test.afterAll(async () => {
  await pool.query('DELETE FROM design_documents WHERE path=$1', [custom]);
  await pool.query('DELETE FROM cms_pages WHERE path=$1', [custom]);
  await pool.end();
});
test.beforeEach(async ({ context, page }) => {
  await pool.query('DELETE FROM design_documents');
  await pool.query('DELETE FROM activity_logs WHERE actor_id=ANY($1)', [Object.values(actors)]);
  await login(context);
  await page.route('https://assets.example.invalid/**', async (route) =>
    route.fulfill({
      contentType: 'image/webp',
      body: await readFile('public/brand/mahida-logo.webp'),
    }),
  );
  await page.route('https://fonts.googleapis.com/**', (route) =>
    route.fulfill({ contentType: 'text/css', body: '' }),
  );
  await page.route('https://fonts.gstatic.com/**', (route) => route.abort());
});

test('compatible snapshots, crop, layout IDs and video cards are validated', async ({
  context,
}) => {
  const old = photo();
  delete old.crop;
  expect(mediaSchema.safeParse({ clips: [old] }).success).toBe(true);
  expect(
    mediaSchema.safeParse({ clips: [photo(1, { crop: false })] }).success,
  ).toBe(true);
  expect(
    mediaSchema.safeParse({ clips: [{ ...photo(), crop: 'false' }] }).success,
  ).toBe(false);
  const video = photo(1, {
    area: 'card-video',
    type: 'video',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  });
  expect(mediaSchema.safeParse({ clips: [video] }).success).toBe(true);
  expect(
    mediaSchema.safeParse({ clips: [video, { ...video, id: photo(2).id }] })
      .success,
  ).toBe(false);
  const invalid = {
    clips: [],
    sectionLayouts: [
      { sectionId: 'history-r3', layout: 'text-left' },
      { sectionId: 'history-r3', layout: 'text-right' },
    ],
  };
  expect(mediaSchema.safeParse(invalid).success).toBe(false);
  expect((await put(context.request, profile, invalid)).status()).toBe(400);
  expect(
    (await put(context.request, profile, { clips: [video] })).status(),
  ).toBe(400);
  expect(
    (await put(context.request, '/does-not-exist-r3', { clips: [] })).status(),
  ).toBe(404);
  expect(
    (
      await put(context.request, '/media/galeri/some-album', { clips: [] })
    ).status(),
  ).toBe(400);
});

test('media staff see published section metadata and only media drafts in previews', async ({
  context,
  request,
}) => {
  await seed(profile, content());
  await pool.query(
    "UPDATE design_documents SET draft=$2::jsonb WHERE path=$1 AND kind='content'",
    [profile, JSON.stringify(content('Teks draf rahasia R3'))],
  );
  expect(
    (await put(context.request, profile, { clips: [photo(1)] })).ok(),
  ).toBe(true);
  expect(
    (
      await put(context.request, profile, { clips: [photo(2)] }, 1, 'draft')
    ).ok(),
  ).toBe(true);
  const metadata = await context.request.get('/api/admin/design/pages');
  expect(metadata.headers()['cache-control']).toContain('no-store');
  const text = await metadata.text();
  expect(text).toContain('Sejarah dan Muassis');
  expect(text).toContain(custom);
  expect(text).not.toContain('Teks draf rahasia R3');
  expect(text).not.toContain('Teks sejarah yang sudah disetujui');
  expect(
    (
      await context.request.get(
        `/api/admin/design?path=${profile}&kind=content`,
      )
    ).status(),
  ).toBe(403);
  const url = `${profile}?designPreview=1&designKind=media`;
  const preview = await context.request.get(url);
  expect(preview.headers()['cache-control']).toContain('no-store');
  expect(await preview.text()).toContain('r3-2.webp');
  expect(await preview.text()).not.toContain('Teks draf rahasia R3');
  for (const response of [
    await request.get(url),
    await request.get(profile, {
      headers: {
        'x-mahida-design-preview': profile,
        'x-mahida-design-kind': 'media',
      },
    }),
  ]) {
    const html = await response.text();
    expect(html).toContain('r3-1.webp');
    expect(html).not.toContain('r3-2.webp');
  }
  for (const scope of ['commerce', 'admissions']) {
    await login(context, scope);
    expect(
      (await context.request.get('/api/admin/design/pages')).status(),
    ).toBe(403);
    expect(await (await context.request.get(url)).text()).not.toContain(
      'r3-2.webp',
    );
  }
  await login(context, 'content');
  const contentPreview = await context.request.get(
    `${profile}?designPreview=1&designKind=content`,
  );
  expect(await contentPreview.text()).toContain('Teks draf rahasia R3');
  expect(await contentPreview.text()).not.toContain('r3-2.webp');
});

test('concurrent editors preserve the winning draft, publication and activity history', async ({
  context,
  request,
}) => {
  const api = context.request;
  expect((await put(api, custom, { clips: [photo(1)] })).ok()).toBe(true);
  const writes = await Promise.all(
    [2, 3].map((n) =>
      put(
        api,
        custom,
        {
          clips: [photo(n)],
          sectionLayouts: [{ sectionId: BODY_SECTION, layout: 'text-left' }],
        },
        1,
        'draft',
      ),
    ),
  );
  expect(writes.map((r) => r.status()).sort()).toEqual([200, 409]);
  const winning = await writes.find((r) => r.ok())!.json();
  const html = await (await request.get(custom)).text();
  expect(html).toContain('r3-1.webp');
  expect(html).not.toContain(winning.draft.clips[0].url);
  expect((await put(api, custom, winning.draft, 2)).ok()).toBe(true);
  const restored = await api.put('/api/admin/design', {
    data: {
      path: custom,
      kind: 'media',
      action: 'restore',
      version: 0,
      revision: 3,
    },
  });
  expect(restored.ok()).toBe(true);
  expect(await (await request.get(custom)).text()).toContain('r3-1.webp');
  const rows = (
    await pool.query(
      "SELECT action,actor_id FROM activity_logs WHERE target_type='design_media' AND target_id=$1",
      [custom],
    )
  ).rows;
  expect(
    rows.filter((r) => r.action === 'restored' && r.actor_id === actors.media),
  ).toHaveLength(1);
});

test('Sejarah/Muassis pairs default to text left and allow reversal without mobile overflow', async ({
  context,
  page,
}, testInfo) => {
  await seed(profile, content());
  const data: MediaDesign = {
    clips: [
      photo(1, { afterSection: 'history-r3', size: 'wide', crop: false }),
    ],
  };
  expect((await put(context.request, profile, data)).ok()).toBe(true);
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(profile);
    const block = page.locator('[data-text-media-section="history-r3"]');
    await expect(block).toHaveAttribute('data-text-media-layout', 'text-left');
    const text = await block.locator('[data-text-column]').boundingBox(),
      media = await block.locator('[data-media-column]').boundingBox();
    if (width === 375)
      expect(media!.y).toBeGreaterThan(text!.y + text!.height - 1);
    else expect(media!.x).toBeGreaterThan(text!.x + text!.width - 1);
    await expect(block.locator('img')).toHaveCSS('object-fit', 'contain');
    await expect(block.locator('img')).toHaveCSS('object-position', '25% 75%');
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width + 1);
    await page.screenshot({
      path: testInfo.outputPath(`text-left-${width}.png`),
      fullPage: true,
    });
  }
  expect(
    (
      await put(
        context.request,
        profile,
        {
          ...data,
          sectionLayouts: [{ sectionId: 'history-r3', layout: 'text-right' }],
        },
        1,
      )
    ).ok(),
  ).toBe(true);
  await page.goto(profile);
  const block = page.locator('[data-text-media-section="history-r3"]');
  const text = await block.locator('[data-text-column]').boundingBox(),
    media = await block.locator('[data-media-column]').boundingBox();
  expect(text!.x).toBeGreaterThan(media!.x + media!.width - 1);
});

test('existing CMS routes and custom pages render every supported clipping area', async ({
  context,
  request,
}) => {
  const paths = [
    '/tentang/sejarah',
    '/pesantren/sejarah',
    '/tentang/pengasuh',
    '/tentang/fasilitas',
    '/tentang/pendidikan',
    '/karya',
    '/karya/artikel',
    '/karya/esai',
    '/karya/terjemahan',
    '/karya/manuskrip',
    '/koperasi',
    '/koperasi/buku',
    '/koperasi/ebook',
    '/literasi',
    '/maktabah',
    '/berita',
    '/media/berita',
    '/media/pengumuman',
    '/agenda',
    '/arsip',
    '/kegiatan',
    custom,
  ];
  await pool.query(
    "UPDATE cms_pages SET status='published' WHERE path=ANY($1)",
    [paths],
  );
  for (const path of paths) {
    expect(
      (
        await put(context.request, path, {
          clips: [
            photo(1, { area: 'hero' }),
            photo(2, { area: 'gallery' }),
            photo(3),
          ],
        })
      ).ok(),
      path,
    ).toBe(true);
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    const html = await response.text();
    for (const n of [1, 2, 3])
      expect(html, `${path} area ${n}`).toContain(`r3-${n}.webp`);
  }
});

test('Media video cards remain playable, poster crops and card sizes fit devices', async ({
  context,
  page,
}) => {
  const video = photo(1, {
    type: 'video',
    area: 'card-video',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    poster: 'https://assets.example.invalid/poster.webp',
    ratio: 'square',
    size: 'medium',
  });
  expect(
    (
      await put(context.request, '/media', {
        clips: [video, photo(2, { area: 'card-galeri', size: 'wide' })],
      })
    ).ok(),
  ).toBe(true);
  await page.goto('/media');
  const card = page.locator('[data-media-card="card-video"]');
  await expect(card.locator('img')).toHaveAttribute('src', video.poster);
  await expect(card.locator('img')).toHaveCSS('object-fit', 'cover');
  await expect(card.locator('a button, a video, a iframe')).toHaveCount(0);
  await card.getByRole('button', { name: 'Putar video' }).click();
  await expect(card.locator('iframe')).toHaveAttribute(
    'src',
    /youtube-nocookie.com\/embed/,
  );
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width + 1);
    if (width > 375) {
      const medium = await card.boundingBox(),
        wide = await page
          .locator('[data-media-card="card-galeri"]')
          .boundingBox();
      expect(wide!.width).toBeGreaterThan(medium!.width * 1.8);
    }
  }
});

test('editor supports replacement, drag/drop, mobile ordering, removal and saved preview', async ({
  page,
  context,
}) => {
  await seed(profile, content());
  await seed(
    profile,
    {
      clips: [
        photo(1, { afterSection: 'history-r3' }),
        photo(2, { afterSection: 'history-r3' }),
      ],
      sectionLayouts: [{ sectionId: 'history-r3', layout: 'text-left' }],
    },
    'media',
  );
  await page.goto('/admin/tampilan/kliping');
  const cards = page.locator('[data-clip-editor]');
  await expect(cards).toHaveCount(2);
  await cards
    .first()
    .getByLabel('URL media HTTPS', { exact: true })
    .fill('https://assets.example.invalid/replacement.webp');
  await cards.first().getByLabel('Crop untuk mengisi bingkai').uncheck();
  await expect(
    page.getByRole('button', { name: 'Pratinjau Draf tersimpan' }),
  ).toBeDisabled();
  const source = await cards.first().getAttribute('data-clip-editor');
  const transfer = await page.evaluateHandle((id) => {
    const data = new DataTransfer();
    data.setData('application/x-mahida-clip', id!);
    return data;
  }, source);
  await cards.nth(1).dispatchEvent('drop', { dataTransfer: transfer });
  await expect(cards.nth(1)).toHaveAttribute('data-clip-editor', source!);
  await page.setViewportSize({ width: 375, height: 900 });
  await cards.nth(1).getByRole('button', { name: 'Naik', exact: true }).click();
  await expect(cards.first()).toHaveAttribute('data-clip-editor', source!);
  await cards
    .nth(1)
    .getByRole('button', { name: 'Hapus', exact: true })
    .click();
  await expect(cards).toHaveCount(1);
  await page.getByRole('button', { name: 'Simpan Draf', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Draf tersimpan');
  const doc = await (
    await context.request.get(`/api/admin/design?path=${profile}&kind=media`)
  ).json();
  expect(doc.draft.clips[0].url).toContain('replacement');
  expect(doc.draft.clips[0].crop).toBe(false);
  expect(doc.draft.sectionLayouts).toEqual([
    { sectionId: 'history-r3', layout: 'text-left' },
  ]);
  expect(doc.published.clips).toHaveLength(2);
  await page.getByRole('button', { name: 'Pratinjau Draf tersimpan' }).click();
  const frame = page.frameLocator('iframe[title^="Pratinjau halaman publik"]');
  await expect(frame.getByAltText('Foto R3 1')).toHaveAttribute(
    'src',
    /replacement/,
  );
  for (const [label, width] of [
    ['HP', 375],
    ['Tablet', 768],
    ['PC', 1440],
  ] as const) {
    await page.getByRole('button', { name: label, exact: true }).click();
    expect(
      await page
        .locator('iframe[title^="Pratinjau halaman publik"]')
        .evaluate((e) => e.clientWidth),
    ).toBe(width);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(376);
  }
});

test('editor preserves unsaved work after conflict and asks before changing pages', async ({
  page,
  context,
}) => {
  await seed(profile, { clips: [photo()] }, 'media');
  await page.goto('/admin/tampilan/kliping');
  const input = page.getByLabel('Teks alternatif / judul video');
  await expect(input).toHaveValue('Foto R3 1');
  await input.fill('Perubahan lokal R3');
  page.once('dialog', (d) => d.dismiss());
  await page.getByLabel('Halaman', { exact: true }).selectOption(custom);
  await expect(page.getByLabel('Halaman', { exact: true })).toHaveValue(
    profile,
  );
  await expect(input).toHaveValue('Perubahan lokal R3');
  expect(
    (
      await put(context.request, profile, { clips: [photo(2)] }, 0, 'draft')
    ).ok(),
  ).toBe(true);
  await page.getByRole('button', { name: 'Simpan Draf', exact: true }).click();
  await expect(page.locator('main').getByRole('alert')).toContainText(
    'sesi lain',
  );
  await expect(input).toHaveValue('Perubahan lokal R3');
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Muat versi terbaru' }).click();
  await expect(input).toHaveValue('Foto R3 2');
});

test('archived and draft CMS pages cannot expose their text to media preview', async ({
  context,
  request,
}) => {
  const old = (
    await pool.query('SELECT status,body FROM cms_pages WHERE path=$1', [
      custom,
    ])
  ).rows[0];
  try {
    await pool.query(
      "UPDATE cms_pages SET status='draft',body='Isi CMS privat R3' WHERE path=$1",
      [custom],
    );
    expect(
      (
        await put(context.request, custom, { clips: [photo()] }, 0, 'draft')
      ).ok(),
    ).toBe(true);
    expect(
      (
        await context.request.get(`${custom}?designPreview=1&designKind=media`)
      ).status(),
    ).toBe(404);
    expect((await request.get(`${custom}?designPreview=1`)).status()).toBe(404);
    await pool.query("UPDATE cms_pages SET status='archived' WHERE path=$1", [
      custom,
    ]);
    expect(
      (
        await context.request.get(`/api/admin/design?path=${custom}&kind=media`)
      ).status(),
    ).toBe(404);
    expect(
      (await put(context.request, custom, { clips: [] }, 1)).status(),
    ).toBe(404);
  } finally {
    await pool.query('UPDATE cms_pages SET status=$2,body=$3 WHERE path=$1', [
      custom,
      old.status,
      old.body,
    ]);
  }
});
