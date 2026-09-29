import { expect, test } from '@playwright/test';
import jwt from 'jsonwebtoken';
import pg from 'pg';

let adminId: number;
let articleId: number;
let productId: number;
let galleryId: number;

test.beforeAll(async () => {
  const url = process.env.DATABASE_URL;
  if (!url || new URL(url).pathname !== '/mahida_ci') throw new Error('Stage 4 checks require disposable mahida_ci');
  const pool = new pg.Pool({ connectionString: url });
  try {
    const user = await pool.query<{ id: number }>(`INSERT INTO users(email,password,name,role,email_verified)
      VALUES ('mahidakoperasi@gmail.com','test-only','Responsive CI','admin',true)
      ON CONFLICT (email) DO UPDATE SET role='admin',email_verified=true RETURNING id`);
    adminId = user.rows[0].id;
    const article = await pool.query<{ id: number }>(`INSERT INTO posts(title,slug,type,status,content_raw,published_at)
      VALUES ('Artikel fitur baru','stage4-article','article','published',$1,now())
      ON CONFLICT (slug) DO UPDATE SET content_raw=EXCLUDED.content_raw,status='published' RETURNING id`,
      ['Teks **tebal**, *miring*, dan ++garis bawah++.\n\n[[image:https://drive.google.com/file/d/1234567890abcde/view|Foto pesantren]]']);
    articleId = article.rows[0].id;
    await pool.query(`INSERT INTO posts(title,slug,type,status,content_raw,published_at)
      VALUES ('Artikel rekomendasi','stage4-related','article','published','Tulisan terkait.',now()) ON CONFLICT (slug) DO NOTHING`);
    const product = await pool.query<{ id: number }>(`INSERT INTO products(name,slug,product_type,price,status)
      VALUES ('Buku tahap empat','stage4-book','physical_book',10000,'published') ON CONFLICT (slug) DO UPDATE SET status='published' RETURNING id`);
    productId = product.rows[0].id;
    const gallery = await pool.query<{ id: number }>(`INSERT INTO galleries(title,slug,status)
      VALUES ('Galeri tahap empat','stage4-gallery','published') ON CONFLICT (slug) DO UPDATE SET status='published' RETURNING id`);
    galleryId = gallery.rows[0].id;
  } finally { await pool.end(); }
});

test('editor, gambar, reaksi tamu, moderasi, rekomendasi, dan hero mobile', async ({ page, context }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/');
  await expect(page.locator('main video:not([src])')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(376);
  await page.goto('/karya/artikel/stage4-article');
  const prose = page.locator('.prose-article');
  await expect(prose.locator('strong')).toHaveText('tebal');
  await expect(prose.locator('em')).toHaveText('miring');
  await expect(prose.locator('u')).toHaveText('garis bawah');
  await expect(prose.locator('img')).toHaveAttribute('src', /drive.google.com\/thumbnail\?id=1234567890abcde/);
  await expect(page.getByRole('link', { name: 'Artikel rekomendasi', exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Suka/ }).click();
  await expect(page.getByRole('button', { name: /Suka/ })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('link', { name: /Komentar/ }).click();
  await expect(page.locator('#komentar')).toBeInViewport();
  await page.getByRole('textbox', { name: 'Nama' }).fill('Pembaca Uji');
  await page.getByRole('textbox', { name: 'Komentar' }).fill('Tulisan ini membantu.');
  await page.getByRole('button', { name: 'Kirim komentar' }).click();
  await expect(page.getByRole('status')).toContainText('menunggu persetujuan');
  await expect(page.locator('#komentar')).not.toContainText('Tulisan ini membantu.');

  const token = jwt.sign({ userId: adminId, email: 'mahidakoperasi@gmail.com', role: 'admin' }, process.env.JWT_SECRET!);
  await context.addCookies([{ name: 'mahida_session', value: token, url: 'http://127.0.0.1:3010' }]);
  await page.goto('/admin/konten/komentar');
  const comment = page.locator('article').filter({ hasText: 'Tulisan ini membantu.' });
  await comment.getByRole('button', { name: 'Terbitkan' }).click();
  await page.goto('/karya/artikel/stage4-article');
  await expect(page.locator('#komentar')).toContainText('Tulisan ini membantu.');
  await page.goto('/admin/konten/artikel/new');
  await expect(page.getByRole('toolbar', { name: 'Format tulisan' })).toBeVisible();
  await page.goto('/admin/konten/esai');
  await expect(page.getByRole('toolbar', { name: 'Format tulisan' })).toBeVisible();
  for (const [path, id] of [['/koperasi/buku/stage4-book', productId], ['/media/galeri/stage4-gallery', galleryId]] as const) {
    expect(id).toBeGreaterThan(0);
    await page.goto(path);
    await expect(page.getByRole('button', { name: /Suka/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Bacaan / Konten Lain' })).toBeVisible();
  }
  expect(articleId).toBeGreaterThan(0);
});
