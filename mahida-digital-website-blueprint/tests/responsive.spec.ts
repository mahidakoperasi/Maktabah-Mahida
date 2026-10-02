import { expect, test } from './fixtures';
import jwt from 'jsonwebtoken';
import pg from 'pg';

const widths = [320, 375, 768, 1024, 1440];
const publicPaths = [
  '/',
  '/tentang/profil',
  '/tentang/kontak',
  '/karya/artikel',
  '/karya/esai',
  '/karya/terjemahan',
  '/karya/artikel/responsive-ci-article',
  '/karya',
  '/koperasi',
  '/koperasi/buku',
  '/koperasi/buku/responsive-ci-book',
  '/media/video',
  '/media/galeri',
  '/tentang/pendaftaran',
  '/masuk',
  '/media',
  '/media/kegiatan',
  '/media/galeri/responsive-ci-gallery',
  '/tentang/unit-pendidikan/madrasah-al-quran',
  '/tentang/unit-pendidikan/madrasah-tsanawiyah',
  '/tentang/unit-pendidikan/madrasah-aliyyah',
  '/tentang/unit-pendidikan/madrasah-diniyyah',
  '/tentang/unit-pendidikan/unu-blitar',
];
const adminPaths = [
  '/admin',
  '/admin/tampilan/beranda',
  '/admin/tampilan/halaman',
  '/admin/tampilan/visual',
  '/admin/tampilan/kliping',
  '/admin/tampilan/bagian',
  '/admin/tampilan/pesan',
  '/admin/tampilan/kontak',
  '/admin/tampilan/pendaftaran',
  '/admin/konten/penulis',
  '/admin/konten/artikel',
  '/admin/konten/artikel/new',
  '/admin/koperasi/produk',
  '/admin/koperasi/pesanan',
  '/admin/admins',
];
let adminId: number;

test.beforeEach(async ({ page }) => {
  await page.route('https://drive.google.com/thumbnail**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="green"/></svg>',
    }),
  );
});

test.beforeAll(async () => {
  const url = process.env.DATABASE_URL;
  if (!url || new URL(url).pathname !== '/mahida_ci') {
    throw new Error(
      'Responsive checks only run against the disposable mahida_ci database',
    );
  }
  const pool = new pg.Pool({ connectionString: url });
  try {
    const user = await pool.query<{ id: number }>(`
      INSERT INTO users(email, password, name, role, email_verified)
      VALUES ('mahidakoperasi@gmail.com', 'test-only', 'Responsive CI', 'admin', true)
      ON CONFLICT (email) DO UPDATE SET role = 'admin', email_verified = true
      RETURNING id
    `);
    adminId = user.rows[0].id;
    const author = await pool.query<{ id: number }>(`
      INSERT INTO authors(name, slug) VALUES ('Fita Retno Anjani', 'fita-retno-anjani')
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id
    `);
    await pool.query(`
      INSERT INTO posts(title, slug, type, status, excerpt, featured_image, published_at)
      VALUES ('Artikel Mahida dengan judul panjang untuk pemeriksaan layar kecil',
        'responsive-ci-article', 'article', 'published', 'Ringkasan artikel uji.',
        '/brand/mahida-logo.webp', now())
      ON CONFLICT (slug) DO NOTHING
    `);
    await pool.query(`
      INSERT INTO posts(title, slug, type, status, excerpt, content_raw, featured_image, published_at)
      VALUES ('Esai Mahida untuk pengujian sampul', 'responsive-ci-essay', 'essay', 'published',
        'Ringkasan esai.', 'Tonton video berikut.\n\n[[video:https://www.tiktok.com/@scout2015/video/6718335390845095173|Kisah santri]]\n\n[[video:https://www.facebook.com/watch/?v=123456789|Video Facebook]]\n\n[[video:https://www.instagram.com/reel/C8A1B2C3D4E/|Video Instagram]]',
        'https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrsTuVwXyZ012345/view', now() + interval '2 minutes')
      ON CONFLICT (slug) DO NOTHING
    `);
    await pool.query(`
      INSERT INTO posts(title, slug, type, karya_category, status, excerpt, content_raw, featured_image, published_at)
      VALUES ('Terjemahan Mahida untuk pengujian sampul', 'responsive-ci-translation', 'work', 'terjemahan', 'published',
        'Ringkasan terjemahan.', 'Teks terjemahan.',
        'https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrsTuVwXyZ012345/view', now() + interval '3 minutes')
      ON CONFLICT (slug) DO NOTHING
    `);
    await pool.query(
      `UPDATE posts SET author_id = $1, author_class = 'Kelas X MA' WHERE slug = 'responsive-ci-essay'`,
      [author.rows[0].id],
    );
    await pool.query(
      `INSERT INTO galleries(title, slug, description, status) VALUES ('Galeri uji Mahida', 'responsive-ci-gallery', 'Foto Mahida.', 'published') ON CONFLICT (slug) DO NOTHING`,
    );
    const gallery = await pool.query<{ id: number }>(
      `SELECT id FROM galleries WHERE slug = 'responsive-ci-gallery'`,
    );
    await pool.query(
      `INSERT INTO gallery_images(gallery_id, image_url, sort_order) VALUES ($1, '/brand/mahida-logo.webp', 0)`,
      [gallery.rows[0].id],
    );
    await pool.query(`
      INSERT INTO products(name, slug, product_type, price, image_url, status)
      VALUES ('Poster Buku Mahida untuk uji tampilan di semua layar',
        'responsive-ci-book', 'physical_book', 50000, '/brand/mahida-logo.webp', 'published')
      ON CONFLICT (slug) DO NOTHING
    `);
    const directory = {
      socials: [
        {
          id: '00000000-0000-4000-8000-000000000001',
          label: 'Instagram Mahida',
          platform: 'instagram',
          url: 'https://instagram.com/mahida',
          sortOrder: 1,
          isVisible: true,
        },
      ],
      contacts: [
        {
          id: '00000000-0000-4000-8000-000000000002',
          label: 'Kontak Pendaftaran Santri',
          category: 'pendaftaran',
          channel: 'email',
          value: 'daftar@example.invalid',
          sortOrder: 2,
          isVisible: true,
        },
      ],
      coopWhatsapp: {
        label: 'WhatsApp Koperasi',
        sortOrder: 3,
        isVisible: true,
      },
    };
    await pool.query(
      `INSERT INTO settings(key, type, value) VALUES ('public_directory', 'json', $1)
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [JSON.stringify(directory)],
    );
    await pool.query(
      `INSERT INTO settings(key, type, value) VALUES ('commerce', 'json', $1)
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [JSON.stringify({ whatsappNumber: '6281234567890' })],
    );
  } finally {
    await pool.end();
  }
});

for (const width of widths) {
  test(`${width}px: public pages, admin, and navigation fit`, async ({
    page,
    context,
  }) => {
    await page.setViewportSize({ width, height: 900 });

    async function check(path: string) {
      const response = await page.goto(path);
      expect(response?.status(), `${width}px ${path}`).toBeLessThan(400);
      await expect(page.locator('main h1').first()).toBeVisible();
      const layout = await page.evaluate(() => {
        const title = document.querySelector('main h1');
        return {
          viewport: document.documentElement.clientWidth,
          page: document.documentElement.scrollWidth,
          heading: title
            ? { client: title.clientWidth, scroll: title.scrollWidth }
            : null,
        };
      });
      expect(
        layout.page,
        `${width}px horizontal scroll on ${path}`,
      ).toBeLessThanOrEqual(layout.viewport + 1);
      expect(
        layout.heading?.scroll,
        `${width}px clipped heading on ${path}`,
      ).toBeLessThanOrEqual((layout.heading?.client ?? 0) + 1);
    }

    for (const path of publicPaths) {
      await check(path);
      await expect(
        page
          .getByRole('contentinfo')
          .getByRole('link', { name: 'Kontak Pendaftaran Santri' }),
      ).toBeVisible();
    }

    if (width < 1024) {
      await page.goto('/');
      const trigger = page.getByRole('button', { name: 'Buka menu' });
      await trigger.click();
      await expect(
        page.getByRole('navigation', { name: 'Navigasi ponsel' }),
      ).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(
        page.getByRole('navigation', { name: 'Navigasi ponsel' }),
      ).toHaveCount(0);
      await expect(trigger).toBeFocused();
    }

    const token = jwt.sign(
      { userId: adminId, email: 'mahidakoperasi@gmail.com', role: 'admin' },
      process.env.JWT_SECRET!,
    );
    await context.addCookies([
      { name: 'mahida_session', value: token, url: 'http://127.0.0.1:3010' },
    ]);
    for (const path of adminPaths) await check(path);

    if (width < 1024) {
      const trigger = page.getByRole('button', { name: 'Buka navigasi admin' });
      await trigger.click();
      await expect(
        page.getByRole('navigation', { name: 'Navigasi admin' }),
      ).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(trigger).toBeFocused();
    }
  });
}

test('three-level public menu follows Admin visibility and keeps published routes accessible', async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(
    page.locator('header.site-nav').getByRole('link', { name: 'Admin' }),
  ).toHaveCount(0);
  const nav = page.getByRole('navigation', { name: 'Navigasi utama' });
  await expect(nav.locator(':scope > div > div > a')).toHaveText([
    'Beranda',
    'Tentang Mahida',
    'Media',
    'Gabung Bersama Kami',
  ]);
  await nav.getByRole('button', { name: 'Submenu Tentang Mahida' }).click();
  await nav.getByRole('button', { name: 'Submenu Unit Pendidikan' }).click();
  const unitNames = [
    'Madrasah Diniyyah Mahida Salam',
    "Madrasah Al-Qur'an Mahida Salam",
    'Madrasah Tsanawiyah Mahida Salam',
    'Madrasah Aliyyah Mahida Salam',
    "Universitas Nahdlatul Ulama' Blitar di Mahida Salam",
  ];
  await expect(nav.locator('a[href^="/tentang/unit-pendidikan/"]')).toHaveText(
    unitNames,
  );
  await page.setViewportSize({ width: 375, height: 800 });
  await page.getByRole('button', { name: 'Buka menu' }).click();
  const mobile = page.getByRole('navigation', { name: 'Navigasi ponsel' });
  await mobile.getByRole('button', { name: 'Submenu Tentang Mahida' }).click();
  await mobile.getByRole('button', { name: 'Submenu Unit Pendidikan' }).click();
  await expect(
    mobile.locator('a[href^="/tentang/unit-pendidikan/"]'),
  ).toHaveText(unitNames);
  const token = jwt.sign(
    { userId: adminId, email: 'mahidakoperasi@gmail.com', role: 'admin' },
    process.env.JWT_SECRET!,
  );
  await context.addCookies([
    { name: 'mahida_session', value: token, url: 'http://127.0.0.1:3010' },
  ]);
  const menus = (
    await (await page.request.get('/api/admin/cms/navigation')).json()
  ).items as {
    id: number;
    parentId: number;
    path: string;
    label: string;
    sortOrder: number;
    isVisible: boolean;
  }[];
  const unit = menus.find((item) => item.path === '/tentang/pendidikan')!;
  try {
    const hidden = await page.request.patch('/api/admin/cms/navigation', {
      data: { ...unit, isVisible: false },
    });
    expect(hidden.ok()).toBe(true);
    await page.reload();
    await expect(
      page.locator(
        'section[aria-labelledby="unit-heading"] a[href^="/tentang/unit-pendidikan/"]',
      ),
    ).toHaveCount(0);
    expect(
      (
        await page.request.get('/tentang/unit-pendidikan/madrasah-diniyyah')
      ).status(),
    ).toBe(200);
  } finally {
    const restored = await page.request.patch('/api/admin/cms/navigation', {
      data: unit,
    });
    expect(restored.ok()).toBe(true);
  }
  await page.goto('/berita');
  await expect(
    page.getByRole('heading', { name: 'Berita', exact: true }),
  ).toBeVisible();
});

test('editor shortcuts and lists preserve page scroll', async ({
  page,
  context,
}) => {
  const token = jwt.sign(
    { userId: adminId, email: 'mahidakoperasi@gmail.com', role: 'admin' },
    process.env.JWT_SECRET!,
  );
  await context.addCookies([
    { name: 'mahida_session', value: token, url: 'http://127.0.0.1:3010' },
  ]);
  await page.goto('/admin/konten/artikel/new');
  const text = page.getByRole('textbox', { name: 'Isi Artikel' });
  await text.fill('Satu\nDua');
  await text.evaluate((field: HTMLTextAreaElement) =>
    field.setSelectionRange(0, 4),
  );
  await page
    .getByRole('button', { name: 'Daftar bernomor' })
    .scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => window.scrollY);
  await page.getByRole('button', { name: 'Daftar bernomor' }).click();
  await expect(text).toBeFocused();
  expect(
    Math.abs((await page.evaluate(() => window.scrollY)) - before),
  ).toBeLessThanOrEqual(2);
  await page.getByRole('button', { name: 'Pratinjau' }).click();
  await expect(
    page.getByLabel('Pratinjau tulisan').locator('ol li').first(),
  ).toContainText('Satu');
  await text.focus();
  await text.evaluate((field: HTMLTextAreaElement) =>
    field.setSelectionRange(0, 7),
  );
  await page.keyboard.press('Control+b');
  await expect(text).toHaveValue(/\*\*1\. Satu\*\*/);
  await text.fill('Apel\nJeruk');
  await text.evaluate((field: HTMLTextAreaElement) =>
    field.setSelectionRange(0, field.value.length),
  );
  await page.getByRole('button', { name: 'Daftar poin' }).click();
  await expect(
    page.getByLabel('Pratinjau tulisan').locator('ul li'),
  ).toHaveCount(2);
  await text.fill('Judul yang dipilih');
  await text.evaluate((field: HTMLTextAreaElement) =>
    field.setSelectionRange(0, field.value.length),
  );
  await page.getByRole('button', { name: 'Heading', exact: true }).click();
  await expect(text).toHaveValue('\n\n## Judul yang dipilih\n\n');
  await expect(
    page
      .getByLabel('Pratinjau tulisan')
      .getByRole('heading', { name: 'Judul yang dipilih' }),
  ).toBeVisible();
});

test('news remains in the database when archived and can be restored', async ({
  page,
  context,
}) => {
  const token = jwt.sign(
    { userId: adminId, email: 'mahidakoperasi@gmail.com', role: 'admin' },
    process.env.JWT_SECRET!,
  );
  await context.addCookies([
    { name: 'mahida_session', value: token, url: 'http://127.0.0.1:3010' },
  ]);
  const title = `Berita tersimpan ${Date.now()}`;
  const payload = {
    title,
    content: 'Isi berita untuk memeriksa status dan penyimpanan.',
    status: 'published',
  };
  const created = await page.request.post('/api/admin/content/berita', {
    data: payload,
  });
  expect(created.status()).toBe(201);
  const { item } = await created.json();
  await page.goto('/berita');
  await expect(
    page.getByRole('link', { name: title, exact: true }),
  ).toBeVisible();

  const archived = await page.request.delete('/api/admin/content/berita', {
    data: { id: item.id },
  });
  expect(archived.ok()).toBe(true);
  const listing = await page.request.get('/api/admin/content/berita');
  const archivedItem = (await listing.json()).items.find(
    (row: { id: number; revision: number }) => row.id === item.id,
  );
  expect(archivedItem.status).toBe('archived');

  const restored = await page.request.patch('/api/admin/content/berita', {
    data: { ...payload, id: item.id, revision: archivedItem.revision },
  });
  expect(restored.ok()).toBe(true);
  expect((await restored.json()).item.publishedAt).toBe(item.publishedAt);
});

test('editorial homepage uses Admin settings and published article covers', async ({
  page,
  context,
}) => {
  await page.route('https://drive.google.com/thumbnail**', async (route) =>
    route.fulfill({
      status: 200,
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="green"/></svg>',
    }),
  );
  const token = jwt.sign(
    { userId: adminId, email: 'mahidakoperasi@gmail.com', role: 'admin' },
    process.env.JWT_SECRET!,
  );
  await context.addCookies([
    { name: 'mahida_session', value: token, url: 'http://127.0.0.1:3010' },
  ]);
  const homepage = await (await page.request.get('/api/admin/homepage')).json();
  const saved = await page.request.put('/api/admin/homepage', {
    data: {
      ...homepage.settings,
      heroTitleLine1: 'Selamat datang di',
      homePostIds: [
        homepage.articles.find((a: { title: string }) =>
          a.title.includes('Artikel Mahida dengan judul panjang'),
        ).id,
      ],
    },
  });
  expect(saved.ok()).toBe(true);

  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Selamat datang di',
  );
  await expect(
    page.locator(
      'section[aria-labelledby="unit-heading"] a[href^="/tentang/unit-pendidikan/"]',
    ),
  ).toHaveCount(5);
  await expect(
    page.locator('a[href="/karya/artikel/responsive-ci-article"]'),
  ).toBeVisible();
  await expect(page.getByText('[MEDIA DRIVE ADMIN: Video Hero]')).toHaveCount(
    0,
  );
  expect(
    await page
      .locator('#news-heading')
      .evaluate(
        (el) =>
          el.compareDocumentPosition(document.querySelector('#unit-heading')!) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ),
  ).toBeTruthy();
  await expect(
    page.locator('a[href="/karya/artikel/responsive-ci-article"] img'),
  ).toHaveAttribute('src', '/brand/mahida-logo.webp');

  await page.goto('/karya/esai');
  await expect(
    page
      .getByRole('link', { name: 'Buka Esai Mahida untuk pengujian sampul' })
      .locator('img'),
  ).toHaveAttribute('src', /drive.google.com\/thumbnail/);
  await page.goto('/karya/esai/responsive-ci-essay');
  await expect(
    page.locator('figure img[alt="Esai Mahida untuk pengujian sampul"]'),
  ).toBeVisible();
  await expect(page.getByText('Buka gambar di Google Drive')).toHaveCount(0);
  await page.getByRole('button', { name: /Putar video TikTok/ }).click();
  await expect(
    page.locator(
      'iframe[src="https://www.tiktok.com/player/v1/6718335390845095173"]',
    ),
  ).toBeVisible();
  await page.getByRole('button', { name: /Putar video Facebook/ }).click();
  await expect(
    page.locator('iframe[src*="facebook.com/plugins/video.php"]'),
  ).toBeVisible();
  await page.getByRole('button', { name: /Putar video Instagram/ }).click();
  await expect(
    page.locator(
      'iframe[src="https://www.instagram.com/reel/C8A1B2C3D4E/embed/"]',
    ),
  ).toBeVisible();

  await page.goto('/admin/tampilan/beranda');
  await expect(
    page.getByRole('textbox', { name: /Gambar latar/ }),
  ).toBeVisible();
});

test('editorial grid fits narrow screens while existing Karya details keep their covers', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 820 });
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Karya-karya Terbaru' }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(321);

  await page.goto('/karya');
  await expect(
    page
      .getByRole('link', { name: 'Buka Esai Mahida untuk pengujian sampul' })
      .locator('img'),
  ).toHaveAttribute('src', /drive.google.com\/thumbnail/);
  await page.goto('/media/galeri');
  await expect(
    page.getByRole('link', { name: /Galeri uji Mahida/ }).locator('img'),
  ).toHaveAttribute('src', '/brand/mahida-logo.webp');
});

test('Admin changes to hero and unit details appear on public pages', async ({
  page,
  context,
}) => {
  await page.route('https://drive.google.com/thumbnail**', async (route) =>
    route.fulfill({
      status: 200,
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" />',
    }),
  );
  const token = jwt.sign(
    { userId: adminId, email: 'mahidakoperasi@gmail.com', role: 'admin' },
    process.env.JWT_SECRET!,
  );
  await context.addCookies([
    { name: 'mahida_session', value: token, url: 'http://127.0.0.1:3010' },
  ]);
  const path = '/tentang/unit-pendidikan/madrasah-diniyyah';
  const previousHome = (
    await (await page.request.get('/api/admin/homepage')).json()
  ).settings;
  const previousUnit = (
    await (
      await page.request.get(
        `/api/admin/editorial?path=${encodeURIComponent(path)}`,
      )
    ).json()
  ).content;
  try {
    expect(
      (
        await page.request.put('/api/admin/homepage', {
          data: {
            ...previousHome,
            siteName: 'MAHIDA UJI',
            footerDescription: 'Deskripsi footer uji.',
            heroPrimaryLabel: 'Daftar Sekarang',
            heroPrimaryHref: '/tentang/pendaftaran',
            unitsTitle: 'Belajar di Mahida',
          },
        })
      ).ok(),
    ).toBe(true);
    expect(
      (
        await page.request.put('/api/admin/editorial', {
          data: {
            path,
            ...previousUnit,
            accreditation: 'Akreditasi A',
            level: 'Diniyyah Uji',
            images: [
              'https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrsTuVwXyZ012345/view',
              '',
              '',
            ],
            facilities: [
              {
                title: 'Perpustakaan',
                description: 'Ruang baca',
                imageUrl: '',
              },
              ...previousUnit.facilities.slice(1),
            ],
          },
        })
      ).ok(),
    ).toBe(true);
    await page.goto('/');
    await expect(
      page.getByRole('link', { name: 'Daftar Sekarang' }),
    ).toHaveAttribute('href', '/tentang/pendaftaran');
    await expect(
      page.getByRole('heading', { name: 'Belajar di Mahida' }),
    ).toBeVisible();
    await expect(page.locator('header.site-nav')).toContainText('MAHIDA UJI');
    await expect(page.locator('footer')).toContainText('Deskripsi footer uji.');
    await page.goto(path);
    await expect(page.getByText('Akreditasi A')).toBeVisible();
    await expect(page.getByText('Diniyyah Uji')).toBeVisible();
    await expect(
      page.locator('img[alt="Gambar Madrasah Diniyyah Mahida Salam"]'),
    ).toHaveAttribute('src', /drive.google.com\/thumbnail/);
    await expect(page.getByText('Perpustakaan')).toBeVisible();
  } finally {
    expect(
      (
        await page.request.put('/api/admin/homepage', { data: previousHome })
      ).ok(),
    ).toBe(true);
    expect(
      (
        await page.request.put('/api/admin/editorial', {
          data: { path, ...previousUnit },
        })
      ).ok(),
    ).toBe(true);
  }
});

test('author archive, social metadata, and admission settings show published data', async ({
  page,
  context,
}) => {
  const token = jwt.sign(
    { userId: adminId, email: 'mahidakoperasi@gmail.com', role: 'admin' },
    process.env.JWT_SECRET!,
  );
  await context.addCookies([
    { name: 'mahida_session', value: token, url: 'http://127.0.0.1:3010' },
  ]);
  const authorResponse = await page.request.get('/api/admin/authors');
  expect(authorResponse.ok()).toBe(true);
  expect(
    (await authorResponse.json()).authors.some(
      (author: { slug: string }) => author.slug === 'fita-retno-anjani',
    ),
  ).toBe(true);

  await page.goto('/karya/esai/responsive-ci-essay');
  await expect(
    page.getByRole('link', { name: 'Fita Retno Anjani' }),
  ).toHaveAttribute('href', '/penulis/fita-retno-anjani');
  await expect(page.getByText(/Kelas X MA/)).toBeVisible();
  await expect(page.locator('time').filter({ hasText: 'WIB' })).toBeVisible();
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    /https:\/\/mahida\.my\.id\/api\/og-image\//,
  );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    'content',
    'summary_large_image',
  );
  await page.getByRole('link', { name: 'Fita Retno Anjani' }).click();
  await expect(
    page.getByRole('link', { name: 'Buka Esai Mahida untuk pengujian sampul' }),
  ).toBeVisible();

  const saved = await page.request.put('/api/admin/admissions', {
    data: {
      introduction: 'Pendaftaran santri Mahida.',
      steps: ['Isi formulir', 'Verifikasi berkas'],
      requirements: ['Identitas calon santri'],
      applicationLabel: 'Isi formulir',
      applicationUrl: 'https://example.invalid/daftar',
    },
  });
  expect(saved.ok()).toBe(true);
  await page.goto('/tentang/pendaftaran');
  await expect(
    page.getByRole('heading', { name: 'Informasi Pendaftaran Santri' }),
  ).toBeVisible();
  await expect(
    page.getByRole('listitem').filter({ hasText: 'Verifikasi berkas' }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Isi formulir' }).first(),
  ).toHaveAttribute('href', 'https://example.invalid/daftar');
});
