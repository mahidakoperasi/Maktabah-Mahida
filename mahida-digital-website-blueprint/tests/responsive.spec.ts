import { expect, test } from '@playwright/test';
import jwt from 'jsonwebtoken';
import pg from 'pg';

const widths = [320, 375, 768, 1024, 1440];
const publicPaths = [
  '/', '/tentang/profil', '/tentang/kontak', '/karya/artikel',
  '/karya/artikel/responsive-ci-article', '/koperasi', '/koperasi/buku',
  '/koperasi/buku/responsive-ci-book', '/media/video', '/media/galeri', '/masuk',
];
const adminPaths = [
  '/admin', '/admin/tampilan/beranda', '/admin/tampilan/halaman',
  '/admin/tampilan/kontak', '/admin/konten/artikel', '/admin/konten/artikel/new',
  '/admin/koperasi/produk', '/admin/koperasi/pesanan', '/admin/admins',
];
let adminId: number;

test.beforeAll(async () => {
  const url = process.env.DATABASE_URL;
  if (!url || new URL(url).pathname !== '/mahida_ci') {
    throw new Error('Responsive checks only run against the disposable mahida_ci database');
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
    await pool.query(`
      INSERT INTO posts(title, slug, type, status, excerpt, featured_image, published_at)
      VALUES ('Artikel Mahida dengan judul panjang untuk pemeriksaan layar kecil',
        'responsive-ci-article', 'article', 'published', 'Ringkasan artikel uji.',
        '/brand/mahida-logo.webp', now())
      ON CONFLICT (slug) DO NOTHING
    `);
    await pool.query(`
      INSERT INTO products(name, slug, product_type, price, image_url, status)
      VALUES ('Poster Buku Mahida untuk uji tampilan di semua layar',
        'responsive-ci-book', 'physical_book', 50000, '/brand/mahida-logo.webp', 'published')
      ON CONFLICT (slug) DO NOTHING
    `);
    const directory = {
      socials: [{ id: '00000000-0000-4000-8000-000000000001', label: 'Instagram Mahida', platform: 'instagram', url: 'https://instagram.com/mahida', sortOrder: 1, isVisible: true }],
      contacts: [{ id: '00000000-0000-4000-8000-000000000002', label: 'Kontak Pendaftaran Santri', category: 'pendaftaran', channel: 'email', value: 'daftar@example.invalid', sortOrder: 2, isVisible: true }],
      coopWhatsapp: { label: 'WhatsApp Koperasi', sortOrder: 3, isVisible: true },
    };
    await pool.query(`INSERT INTO settings(key, type, value) VALUES ('public_directory', 'json', $1)
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`, [JSON.stringify(directory)]);
    await pool.query(`INSERT INTO settings(key, type, value) VALUES ('commerce', 'json', $1)
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`, [JSON.stringify({ whatsappNumber: '6281234567890' })]);
  } finally {
    await pool.end();
  }
});

for (const width of widths) {
  test(`${width}px: public pages, admin, and navigation fit`, async ({ page, context }) => {
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
          heading: title ? { client: title.clientWidth, scroll: title.scrollWidth } : null,
        };
      });
      expect(layout.page, `${width}px horizontal scroll on ${path}`).toBeLessThanOrEqual(layout.viewport + 1);
      expect(layout.heading?.scroll, `${width}px clipped heading on ${path}`).toBeLessThanOrEqual((layout.heading?.client ?? 0) + 1);
    }

    for (const path of publicPaths) {
      await check(path);
      await expect(page.getByRole('link', { name: 'Kontak Pendaftaran Santri' })).toBeVisible();
    }

    if (width < 1280) {
      await page.goto('/');
      const trigger = page.getByRole('button', { name: 'Buka menu' });
      await trigger.click();
      await expect(page.getByRole('navigation', { name: 'Navigasi ponsel' })).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('navigation', { name: 'Navigasi ponsel' })).toHaveCount(0);
      await expect(trigger).toBeFocused();
    }

    const token = jwt.sign({ userId: adminId, email: 'mahidakoperasi@gmail.com', role: 'admin' }, process.env.JWT_SECRET!);
    await context.addCookies([{ name: 'mahida_session', value: token, url: 'http://127.0.0.1:3010' }]);
    for (const path of adminPaths) await check(path);

    if (width < 1024) {
      const trigger = page.getByRole('button', { name: 'Buka navigasi admin' });
      await trigger.click();
      await expect(page.getByRole('navigation', { name: 'Navigasi admin' })).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(trigger).toBeFocused();
    }
  });
}
