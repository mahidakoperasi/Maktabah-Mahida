import { test, expect } from './fixtures';
import jwt from 'jsonwebtoken';
import pg from 'pg';
import {
  mediaSchema,
  contentSchema,
  emptyContent,
  type Clip,
} from '../src/lib/design-schema';
import { readFile } from 'node:fs/promises';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const profile = '/tentang/profil';
let adminId: number;
const photo = (alt = 'Foto resmi'): Clip => ({
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  area: 'inline',
  afterSection: '',
  type: 'image',
  url: 'https://assets.example.invalid/photo.webp',
  alt,
  poster: '',
  size: 'medium',
  ratio: 'portrait',
  focalX: 25,
  focalY: 75,
});
const body = (title: string, enabled = true) => ({
  ...emptyContent,
  sections: [
    {
      id: 'history',
      title,
      body: '## Catatan resmi\n\nParagraf **tebal**.\n\n- Satu\n- Dua',
      enabled,
      icon: 'book',
    },
  ],
});
function token() {
  return jwt.sign(
    { userId: adminId, email: 'design-ci@example.invalid', role: 'admin' },
    process.env.JWT_SECRET!,
    { expiresIn: '1h' },
  );
}

test.beforeAll(async () => {
  if (
    !process.env.DATABASE_URL ||
    new URL(process.env.DATABASE_URL).pathname !== '/mahida_ci'
  )
    throw Error('Tests require disposable mahida_ci');
  const { rows } = await pool.query(
    "INSERT INTO users(email,password,name,role,email_verified) VALUES('design-ci@example.invalid','test-only','Design CI','admin',true) ON CONFLICT(email) DO UPDATE SET role='admin',email_verified=true RETURNING id",
  );
  adminId = rows[0].id;
  await pool.query(
    "UPDATE cms_pages SET status='published' WHERE path=ANY($1)",
    [
      [
        profile,
        '/tentang/kontak',
        '/tentang/pendaftaran',
        '/media',
        '/media/kegiatan',
        '/media/video',
        '/media/galeri',
      ],
    ],
  );
});
test.afterAll(async () => {
  await pool.end();
});
test.beforeEach(async ({ context, page }) => {
  await page.route('https://assets.example.invalid/**', async (route) => {
    const video = route.request().url().endsWith('.mp4');
    await route.fulfill({
      status: 200,
      contentType: video ? 'video/mp4' : 'image/webp',
      body: video
        ? Buffer.from(videoFixture, 'base64')
        : await readFile('public/brand/mahida-logo.webp'),
    });
  });
  await context.addCookies([
    { name: 'mahida_session', value: token(), domain: '127.0.0.1', path: '/' },
  ]);
  await pool.query('DELETE FROM design_documents');
});

test('server validates media, embeds, permissions, and page scope', async ({
  request,
  context,
}) => {
  expect(
    (await request.get('/api/admin/design?path=/tentang/profil&kind=media')).status(),
  ).toBe(403);
  expect((await request.put('/api/admin/design', { data: { path: profile, kind: 'media', action: 'draft', revision: 0, data: { clips: [] } } })).status()).toBe(
    403,
  );
  expect((await request.get('/api/admin/contact')).status()).toBe(403);
  const api = context.request;
  expect(
    (
      await api.put('/api/admin/design', {
        data: {
          path: '/admin/unsupported',
          kind: 'media',
          action: 'publish',
          revision: 0,
          data: { clips: [] },
        },
      })
    ).status(),
  ).toBe(400);
  for (const patch of [
    { url: 'javascript:alert(1)' },
    { url: '<iframe src="https://bad.invalid"></iframe>' },
    { focalX: 101 },
    { type: 'video', url: 'https://untrusted.invalid/embed' },
  ]) {
    expect(
      mediaSchema.safeParse({ clips: [{ ...photo(), ...patch }] }).success,
    ).toBe(false);
    expect(
      (
        await api.put('/api/admin/design', {
          data: {
            path: profile,
            kind: 'media',
            action: 'publish',
            revision: 0,
            data: { clips: [{ ...photo(), ...patch }] },
          },
        })
      ).status(),
    ).toBe(400);
  }
  expect(
    contentSchema.safeParse({
      ...emptyContent,
      mapEmbed: 'https://evil.invalid/iframe',
    }).success,
  ).toBe(false);
  expect(
    contentSchema.safeParse({ ...emptyContent, mapsUrl: 'javascript:alert(1)' })
      .success,
  ).toBe(false);
  expect(
    (
      await api.put('/api/admin/design', {
        data: {
          path: profile,
          kind: 'content',
          action: 'publish',
          revision: 0,
          data: { ...emptyContent, mapEmbed: 'https://evil.invalid/iframe' },
        },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await api.put('/api/admin/design', {
        headers: { origin: 'https://evil.invalid' },
        data: {
          path: profile,
          kind: 'media',
          action: 'publish',
          revision: 0,
          data: { clips: [] },
        },
      })
    ).status(),
  ).toBe(403);
});

test('draft stays private, published version remains, stale writes fail and restore works', async ({
  page,
  context,
  request,
}) => {
  const api = context.request;
  const save = async (
    action: string,
    revision: number,
    data: unknown,
    version?: number,
  ) =>
    api.put('/api/admin/design', {
      data: { path: profile, kind: 'content', action, revision, data, version },
    });
  expect((await save('publish', 0, body('Sejarah terbit'))).ok()).toBeTruthy();
  expect(
    (await save('draft', 1, body('Sejarah draf privat'))).ok(),
  ).toBeTruthy();
  const publicHtml = await (await request.get(profile)).text();
  expect(publicHtml).toContain('Sejarah terbit');
  expect(publicHtml).not.toContain('Sejarah draf privat');
  expect(
    await (await request.get(profile + '?designPreview=1')).text(),
  ).not.toContain('Sejarah draf privat');
  expect(
    await (
      await request.get(profile, {
        headers: { 'x-mahida-design-preview': profile },
      })
    ).text(),
  ).not.toContain('Sejarah draf privat');
  await page.goto(profile + '?designPreview=1');
  await expect(
    page.getByRole('heading', { name: 'Sejarah draf privat' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Catatan resmi' }),
  ).toBeVisible();
  expect((await save('publish', 1, body('Sesi usang'))).status()).toBe(409);
  expect(
    (await save('publish', 2, body('Sejarah versi kedua'))).ok(),
  ).toBeTruthy();
  expect((await save('restore', 3, undefined, 0)).ok()).toBeTruthy();
  expect(await (await request.get(profile)).text()).toContain('Sejarah terbit');
});

test('legacy media survive migration, draft and baseline restoration; blanks stay hidden', async ({
  context,
  request,
  page,
}) => {
  await pool.query(
    "INSERT INTO settings(key,value,type) VALUES($1,$2,'json') ON CONFLICT(key) DO UPDATE SET value=excluded.value",
    [
      'editorial:' + profile,
      JSON.stringify({
        images: ['https://assets.example.invalid/legacy.webp', '', ''],
        facilities: [],
      }),
    ],
  );
  const legacy = await pool.query('SELECT value FROM settings WHERE key=$1', [
    'editorial:' + profile,
  ]);
  const snapshot = await pool.query(
    'SELECT id,path,title,body,status FROM cms_pages ORDER BY id',
  );
  await pool.query(
    await readFile('drizzle/0010_design_finalization.sql', 'utf8'),
  );
  expect(
    (
      await pool.query(
        'SELECT id,path,title,body,status FROM cms_pages ORDER BY id',
      )
    ).rows,
  ).toEqual(snapshot.rows);
  expect(
    (
      await pool.query('SELECT value FROM settings WHERE key=$1', [
        'editorial:' + profile,
      ])
    ).rows,
  ).toEqual(legacy.rows);
  const put = (action: string, revision: number, version?: number) =>
    context.request.put('/api/admin/design', {
      data: {
        path: profile,
        kind: 'media',
        action,
        revision,
        data: { clips: [photo('Kliping baru')] },
        version,
      },
    });
  expect((await put('draft', 0)).ok()).toBeTruthy();
  let html = await (await request.get(profile)).text();
  expect(html).toContain('legacy.webp');
  expect(html).not.toContain('Kliping baru');
  expect((await put('publish', 1)).ok()).toBeTruthy();
  html = await (await request.get(profile)).text();
  expect(html).toContain('Kliping baru');
  expect(html).not.toContain('legacy.webp');
  expect((await put('restore', 2, -1)).ok()).toBeTruthy();
  expect(await (await request.get(profile)).text()).toContain('legacy.webp');
  await page.goto('/tentang/unit-pendidikan/madrasah-diniyyah');
  await expect(
    page.getByText('Keterangan fasilitas belum tersedia.'),
  ).toHaveCount(0);
  await expect(page.getByText('Fasilitas 01')).toHaveCount(0);
  await expect(
    page.getByText(
      'Informasi resmi unit ini akan ditambahkan melalui pengelolaan Mahida.',
    ),
  ).toHaveCount(0);
});

test('empty and disabled sections stay hidden and unit data remain independent', async ({
  context,
  request,
}) => {
  const first = '/tentang/unit-pendidikan/madrasah-tsanawiyah',
    second = '/tentang/unit-pendidikan/madrasah-aliyyah';
  expect(
    (
      await context.request.put('/api/admin/design', {
        data: {
          path: first,
          kind: 'content',
          action: 'publish',
          revision: 0,
          data: {
            ...emptyContent,
            sections: [
              ...body('MTs resmi').sections,
              {
                id: 'hidden',
                title: 'Bagian dinonaktifkan',
                body: 'Isi rahasia',
                enabled: false,
                icon: 'none',
              },
              {
                id: 'blank',
                title: 'Bagian kosong',
                body: '',
                enabled: true,
                icon: 'none',
              },
            ],
          },
        },
      })
    ).ok(),
  ).toBeTruthy();
  const html = await (await request.get(first)).text();
  expect(html).toContain('MTs resmi');
  expect(html).not.toContain('Bagian dinonaktifkan');
  expect(html).not.toContain('Bagian kosong');
  expect(await (await request.get(second)).text()).not.toContain('MTs resmi');
});

test('hero photo/video use separate overlays, video failure falls back and Drive needs play', async ({
  page,
  context,
}) => {
  const put = (clip: Clip, revision: number) =>
    context.request.put('/api/admin/design', {
      data: {
        path: '/',
        kind: 'media',
        action: 'publish',
        revision,
        data: { clips: [clip] },
      },
    });
  await put({ ...photo(), area: 'hero' }, 0);
  await page.goto('/');
  expect(await page.locator('main header .bg-gradient-to-r').count()).toBe(1);
  await put(
    {
      ...photo('Video hero'),
      area: 'hero',
      type: 'video',
      url: 'https://assets.example.invalid/hero.mp4',
      poster: 'https://assets.example.invalid/poster.webp',
    },
    1,
  );
  await page.goto('/');
  const video = page.locator('main video');
  await expect(video).toHaveAttribute('autoplay', '');
  await expect(video).toHaveAttribute('muted', '');
  await expect(video).toHaveAttribute('playsinline', '');
  await expect(video).toHaveAttribute('loop', '');
  expect(await page.locator('main header .bg-gradient-to-r').count()).toBe(0);
  await video.evaluate((v) => v.dispatchEvent(new Event('error')));
  await expect(page.locator('main header img')).toHaveAttribute(
    'src',
    'https://assets.example.invalid/poster.webp',
  );
  await put(
    {
      ...photo('Video Drive'),
      area: 'hero',
      type: 'video',
      url: 'https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrsTuVwXyZ012345/view',
      poster: 'https://assets.example.invalid/poster.webp',
    },
    2,
  );
  await page.goto('/');
  expect(await page.locator('main header iframe').count()).toBe(0);
  await page.getByRole('button', { name: 'Putar video', exact: true }).click();
  await expect(page.locator('main header iframe')).toHaveAttribute(
    'src',
    /drive.google.com.*preview/,
  );
});

test('contact messages are persisted privately, moderated and spam limited', async ({
  request,
  context,
}) => {
  await pool.query('TRUNCATE contact_messages,contact_rate_limits');
  const message = {
    name: 'Pengirim Uji',
    replyTo: 'contact-ci@example.invalid',
    subject: 'Pertanyaan resmi',
    message: 'Pesan uji integrasi formulir kontak.',
    website: '',
  };
  expect((await request.post('/api/contact', { data: message })).status()).toBe(
    404,
  );
  const enabled = { ...emptyContent, contactFormEnabled: true };
  await context.request.put('/api/admin/design', {
    data: {
      path: '/tentang/kontak',
      kind: 'content',
      action: 'publish',
      revision: 0,
      data: enabled,
    },
  });
  expect(
    (
      await request.post('/api/contact', {
        data: { ...message, website: 'spam' },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post('/api/contact', {
        data: { ...message, replyTo: 'bukan kontak' },
      })
    ).status(),
  ).toBe(400);
  expect((await request.post('/api/contact', { data: message })).status()).toBe(
    201,
  );
  const rows = (await pool.query('SELECT * FROM contact_messages')).rows;
  expect(rows).toHaveLength(1);
  expect(rows[0].reply_to).toBe(message.replyTo);
  const inbox = await context.request.get('/api/admin/contact');
  expect((await inbox.json()).messages[0].message).toBe(message.message);
  expect(
    (
      await context.request.patch('/api/admin/contact', {
        data: { id: rows[0].id, status: 'handled' },
      })
    ).ok(),
  ).toBeTruthy();
  expect(
    (
      await pool.query('SELECT status FROM contact_messages WHERE id=$1', [
        rows[0].id,
      ])
    ).rows[0].status,
  ).toBe('handled');
  expect(await (await request.get('/tentang/kontak')).text()).not.toContain(
    message.replyTo,
  );
  for (let i = 0; i < 4; i++)
    expect(
      (await request.post('/api/contact', { data: message })).status(),
    ).toBe(201);
  expect((await request.post('/api/contact', { data: message })).status()).toBe(
    429,
  );
  expect(
    (await pool.query('SELECT count(*)::int AS count FROM contact_messages'))
      .rows[0].count,
  ).toBe(5);
});

test('gallery lightbox keyboard and focus return', async ({ page }) => {
  const gallery = (
    await pool.query(
      "INSERT INTO galleries(title,slug,status) VALUES('Galeri keyboard','design-ci-gallery','published') ON CONFLICT(slug) DO UPDATE SET status='published' RETURNING id",
    )
  ).rows[0];
  await pool.query('DELETE FROM gallery_images WHERE gallery_id=$1', [
    gallery.id,
  ]);
  await pool.query(
    "INSERT INTO gallery_images(gallery_id,image_url,caption,sort_order) VALUES($1,'/brand/mahida-logo.webp','Foto satu',0),($1,'/brand/mahida-logo.webp','Foto dua',1)",
    [gallery.id],
  );
  await page.goto('/media/galeri/design-ci-gallery');
  const trigger = page.getByRole('button', { name: 'Buka foto Foto satu 1' });
  await trigger.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(dialog.locator('figcaption')).toContainText('Foto dua');
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

// A 64px, one-second green MP4; self-contained and does not rely on external video hosting.
const videoFixture =
  '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';

test('Kliping UI reorders, previews saved draft on three devices and publishes to controlled grid', async ({
  page,
  context,
}, testInfo) => {
  await context.request.put('/api/admin/design', {
    data: {
      path: profile,
      kind: 'content',
      action: 'publish',
      revision: 0,
      data: body('Sejarah resmi untuk pratinjau'),
    },
  });
  await page.goto('/admin/tampilan/kliping');
  await page.getByRole('button', { name: 'Tambah foto/video' }).click();
  let card = page.locator('fieldset').first();
  await card
    .getByLabel('URL media HTTPS', { exact: true })
    .fill('https://assets.example.invalid/one.webp');
  await card.getByLabel('Teks alternatif / judul video').fill('Foto satu');
  await card
    .getByLabel('Letakkan foto/video setelah bagian')
    .selectOption('history');
  await page.getByRole('button', { name: 'Tambah foto/video' }).click();
  card = page.locator('fieldset').nth(1);
  await card
    .getByLabel('URL media HTTPS', { exact: true })
    .fill('https://assets.example.invalid/two.webp');
  await card.getByLabel('Teks alternatif / judul video').fill('Foto dua');
  await card
    .getByLabel('Letakkan foto/video setelah bagian')
    .selectOption('history');
  await card.getByLabel('Rasio crop').selectOption('landscape');
  await card.getByLabel('Ukuran').selectOption('wide');
  await page
    .locator('fieldset')
    .first()
    .getByRole('button', { name: 'Turun', exact: true })
    .click();
  await expect(
    page
      .locator('fieldset')
      .first()
      .getByLabel('Teks alternatif / judul video'),
  ).toHaveValue('Foto dua');
  await page
    .locator('fieldset')
    .first()
    .getByRole('button', { name: 'Seret untuk memindah' })
    .dragTo(page.locator('fieldset').nth(1).getByRole('button', {name:'Seret untuk memindah'}));
  await expect(
    page
      .locator('fieldset')
      .first()
      .getByLabel('Teks alternatif / judul video'),
  ).toHaveValue('Foto satu');
  await page
    .locator('fieldset')
    .first()
    .getByRole('button', { name: 'Turun', exact: true })
    .click();
  await page.getByRole('button', { name: 'Simpan Draf', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Draf tersimpan');
  await page.getByRole('button', { name: 'Pratinjau Draf tersimpan' }).click();
  const frame = page.frameLocator('iframe[title^="Pratinjau halaman publik"]');
  await expect(
    frame.getByRole('heading', { name: 'Sejarah resmi untuk pratinjau' }),
  ).toBeVisible();
  await expect(frame.getByAltText('Foto dua', { exact: true })).toHaveCount(1);
  for (const label of ['HP', 'Tablet', 'PC']) {
    await page.getByRole('button', { name: label, exact: true }).click();
    const expected = label === 'HP' ? 375 : label === 'Tablet' ? 768 : 1440;
    expect(
      await page
        .locator('iframe[title^="Pratinjau halaman publik"]')
        .evaluate((el) => el.clientWidth),
    ).toBe(expected);
  }
  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width + 1);
  }
  await page.getByRole('button', { name: 'Terbitkan', exact: true }).click();
  await expect(page.getByRole('status')).toContainText(
    'Versi terbit diperbarui',
  );
  await page.goto(profile);
  const photos = page.locator('main figure img');
  await expect(photos.nth(0)).toHaveAttribute('alt', 'Foto dua');
  await expect(photos.nth(1)).toHaveAttribute('alt', 'Foto satu');
  for (const width of [375, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.screenshot({
      path: testInfo.outputPath(`profile-${width}.png`),
      fullPage: true,
    });
  }
});

test('admissions enhancements use approved content and a draft CMS profile is visible only to Admin', async ({
  context,
  request,
  page,
}) => {
  const admissions = {
    ...emptyContent,
    brochureUrl: 'https://assets.example.invalid/brochure.pdf',
    fees: 'Rincian resmi dari Admin.',
    faq: [{ question: 'Bagaimana mendaftar?', answer: 'Ikuti tahapan resmi.' }],
    testimonials: [
      {
        name: 'Nama dengan izin',
        text: 'Testimoni yang telah disetujui.',
        permission: true,
      },
    ],
  };
  expect(
    (
      await context.request.put('/api/admin/design', {
        data: {
          path: '/tentang/pendaftaran',
          kind: 'content',
          action: 'publish',
          revision: 0,
          data: admissions,
        },
      })
    ).ok(),
  ).toBeTruthy();
  await page.goto('/tentang/pendaftaran');
  await expect(
    page.getByRole('link', { name: 'Unduh Brosur Resmi' }),
  ).toHaveAttribute('href', admissions.brochureUrl);
  await page.getByText('Bagaimana mendaftar?', { exact: true }).click();
  await expect(
    page.getByText('Ikuti tahapan resmi.', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Testimoni yang telah disetujui.', { exact: true }),
  ).toBeVisible();
  const original = (
    await pool.query('SELECT body,status FROM cms_pages WHERE path=$1', [
      profile,
    ])
  ).rows[0];
  try {
    await pool.query(
      "UPDATE cms_pages SET status='draft',body='Isi CMS privat' WHERE path=$1",
      [profile],
    );
    expect((await request.get(profile + '?designPreview=1')).status()).toBe(
      404,
    );
    await page.goto(profile + '?designPreview=1');
    await expect(
      page.getByText('Isi CMS privat', { exact: true }),
    ).toBeVisible();
  } finally {
    await pool.query('UPDATE cms_pages SET status=$2,body=$3 WHERE path=$1', [
      profile,
      original.status,
      original.body,
    ]);
  }
});

test('autoplay rejection keeps poster and a keyboard accessible play control', async ({
  page,
  context,
}) => {
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = () =>
      Promise.reject(new DOMException('Autoplay declined', 'NotAllowedError'));
  });
  const clip = {
    ...photo('Video dengan poster'),
    area: 'hero',
    type: 'video',
    url: 'https://assets.example.invalid/hero.mp4',
    poster: 'https://assets.example.invalid/poster.webp',
  };
  expect(
    (
      await context.request.put('/api/admin/design', {
        data: {
          path: '/',
          kind: 'media',
          action: 'publish',
          revision: 0,
          data: { clips: [clip] },
        },
      })
    ).ok(),
  ).toBeTruthy();
  await page.goto('/');
  await expect(page.locator('main video')).toHaveAttribute(
    'poster',
    clip.poster,
  );
  await expect(
    page.getByRole('button', { name: 'Putar video latar' }),
  ).toBeVisible();
  await expect(page.locator('main video')).toHaveAttribute('controls', '');
});
