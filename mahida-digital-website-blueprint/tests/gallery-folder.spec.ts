import { test, expect } from './fixtures';
import pg from 'pg';
import jwt from 'jsonwebtoken';
import { readFile } from 'node:fs/promises';
import { galleryPhotoSchema, gallerySchema, driveFolder, mergeCandidates, visibleGalleryPhotos } from '../src/lib/gallery-schema';
import { listDrivePhotos } from '../src/lib/drive-folder';
import { driveThumbnailUrl } from '../src/lib/media-links';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const folder = 'https://drive.google.com/drive/folders/folder_0123456789?resourcekey=resource_123';
const photo = (n = 0) => galleryPhotoSchema.parse({ id: `photo_0123456789_${n}`, imageUrl: `https://drive.google.com/file/d/photo_0123456789_${n}/view`, title: `Foto ${n}`, alt: `Keterangan alternatif ${n}` });
const albumData = (title = 'Album Uji Drive') => gallerySchema.parse({ title, folderUrl: folder, photos: [photo()] });
const created: number[] = [];
let adminId: number;
let contentId: number;
test.beforeAll(async () => {
  if (!process.env.DATABASE_URL || new URL(process.env.DATABASE_URL).pathname !== '/mahida_ci') throw Error('Tests only run on disposable mahida_ci');
  for (const access of ['media', 'content']) {
    const { rows } = await pool.query("INSERT INTO users(email,password,name,role,email_verified,admin_access) VALUES($1,'test-only',$2,'admin',true,$3) ON CONFLICT(email) DO UPDATE SET role='admin',email_verified=true,admin_access=$3 RETURNING id", [`gallery-${access}@example.invalid`, `Gallery ${access}`, access]);
    if (access === 'media') adminId = rows[0].id; else contentId = rows[0].id;
  }
  await pool.query("UPDATE cms_pages SET status='published' WHERE path IN ('/media','/media/galeri')");
});
test.afterAll(async () => {
  if (created.length) await pool.query('DELETE FROM galleries WHERE id=ANY($1)', [created]);
  await pool.end();
});
test.beforeEach(async ({ context, page }) => {
  await page.route('https://fonts.googleapis.com/**', (route) => route.fulfill({ contentType: 'text/css', body: '' }));
  await page.route('https://fonts.gstatic.com/**', (route) => route.abort());
  await context.addCookies([{ name: 'mahida_session', value: jwt.sign({ userId: adminId, role: 'admin' }, process.env.JWT_SECRET!, { expiresIn: '1h' }), domain: '127.0.0.1', path: '/' }]);
  await page.route('https://drive.google.com/thumbnail**', async (route) => route.fulfill({ contentType: 'image/webp', body: await readFile('public/brand/mahida-logo.webp') }));
});

test('folder validation, cap, uniqueness, resource keys and candidate merge', async () => {
  expect(driveFolder(folder)?.id).toBe('folder_0123456789');
  for (const url of ['http://drive.google.com/drive/folders/folder_0123456789', 'https://evil.invalid/drive/folders/folder_0123456789', 'https://drive.google.com/file/d/photo_0123456789/view', 'https://drive.google.com@127.0.0.1/drive/folders/folder_0123456789', `${folder}%0D%0Aevil`]) expect(driveFolder(url)).toBeNull();
  expect(gallerySchema.safeParse({ ...albumData(), photos: Array.from({ length: 41 }, (_, n) => photo(n)) }).success).toBe(false);
  expect(gallerySchema.safeParse({ ...albumData(), photos: [photo(), photo()] }).success).toBe(false);
  expect(galleryPhotoSchema.safeParse({ ...photo(), imageUrl: 'javascript:alert(1)' }).success).toBe(false);
  expect(gallerySchema.safeParse({ ...albumData(), photos: [{ ...photo(), imageUrl: '/brand/mahida-logo.webp' }, { ...photo(1), imageUrl: 'https://assets.example.invalid/legacy.webp' }] }).success).toBe(true);
  expect(gallerySchema.safeParse({ ...albumData(), photos: [{ ...photo(), id: 'legacy-1', imageUrl: '/brand/mahida-logo.webp' }, { ...photo(1), id: 'legacy-2', imageUrl: '/brand/mahida-logo.webp' }] }).success).toBe(true);
  expect(gallerySchema.safeParse({ ...albumData(), photos: [{ ...photo(), focalX: 101 }] }).success).toBe(false);
  expect(visibleGalleryPhotos({ ...albumData(), photos: [{ ...photo(), visible: false }] })).toHaveLength(0);
  expect(driveThumbnailUrl(`${photo().imageUrl}?resourcekey=abc_123`)).toContain('resourcekey=abc_123');
  const old = [{ id: photo().id, name: 'Lama', imageUrl: photo().imageUrl, missing: false }];
  const incoming = [{ id: photo(1).id, name: 'Baru', imageUrl: photo(1).imageUrl, missing: false }];
  expect(mergeCandidates(old, incoming)).toEqual([incoming[0], { ...old[0], missing: true }]);
});

test('Drive reader paginates public images, only contacts Google and never performs writes', async () => {
  const calls: URL[] = [];
  const mock = (async (input: string | URL | Request, options?: RequestInit) => {
    const url = new URL(String(input)); calls.push(url);
    expect(url.origin).toBe('https://www.googleapis.com');
    expect(options?.method ?? 'GET').toBe('GET');
    expect(options?.headers).toMatchObject({ 'X-Goog-Api-Key': 'test-key', 'X-Goog-Drive-Resource-Keys': 'folder_0123456789/resource_123' });
    expect(url.searchParams.has('key')).toBe(false);
    if (url.pathname.endsWith('folder_0123456789')) return Response.json({ name: 'Kegiatan', mimeType: 'application/vnd.google-apps.folder' });
    const n = url.searchParams.get('pageToken') ? 1 : 0;
    return Response.json({ ...(n ? {} : { nextPageToken: 'page-2' }), files: [{ id: photo(n).id, name: `Foto ${n}.jpg`, mimeType: 'image/jpeg', resourceKey: 'photo_key', imageMediaMetadata: { width: 1000, height: 800 } }, { id: 'private_pdf_012345', name: 'Dokumen', mimeType: 'application/pdf' }] });
  }) as typeof fetch;
  const result = await listDrivePhotos(folder, 'test-key', mock);
  expect(result.candidates).toHaveLength(2); expect(calls).toHaveLength(3);
  expect(result.candidates[0].imageUrl).toContain('resourcekey=photo_key');
  expect(JSON.stringify(result)).not.toContain('test-key');
  await expect(listDrivePhotos(folder, '', mock)).rejects.toMatchObject({ status: 503 });
  await expect(listDrivePhotos('https://127.0.0.1/private', 'test-key', mock)).rejects.toMatchObject({ status: 400 });
  await expect(listDrivePhotos(folder, 'test-key', (async () => new Response('{}', { status: 403 })) as typeof fetch)).rejects.toMatchObject({ status: 502 });
  await expect(listDrivePhotos(folder, 'test-key', (async (input) => String(input).includes(`/files/folder_`) ? Response.json({ mimeType: 'application/vnd.google-apps.folder' }) : Response.json({ incompleteSearch: true, files: [] })) as typeof fetch)).rejects.toMatchObject({ status: 502 });
});

test('API permission, draft privacy, publishing, conflict and archive recovery', async ({ request, context, page }) => {
  expect((await request.get('/api/admin/galleries')).status()).toBe(403);
  const api = context.request;
  expect((await api.post('/api/admin/galleries', { headers: { origin: 'https://evil.invalid' }, data: { revision: 0, action: 'draft', data: albumData() } })).status()).toBe(403);
  const response = await api.post('/api/admin/galleries', { data: { revision: 0, action: 'draft', data: albumData() } });
  expect(response.status()).toBe(201);
  let album = await response.json(); created.push(album.id);
  const path = `/media/galeri/${album.slug}`;
  expect((await request.get(path)).status()).toBe(404);
  expect((await api.patch('/api/admin/galleries', { data: { id: album.id, revision: album.revision, action: 'sync', data: albumData('Tidak boleh disimpan saat sync') } })).status()).toBe(400);
  if (!process.env.GOOGLE_DRIVE_API_KEY) {
    const unsynced = await api.patch('/api/admin/galleries', { data: { id: album.id, revision: album.revision, action: 'sync' } });
    expect(unsynced.status()).toBe(503);
    expect((await pool.query('SELECT revision,candidates FROM gallery_documents WHERE gallery_id=$1', [album.id])).rows[0]).toEqual({ revision: album.revision, candidates: [] });
  }
  const candidate = { id: photo(9).id, name: 'Kandidat rahasia', imageUrl: photo(9).imageUrl, missing: false };
  await pool.query('UPDATE gallery_documents SET candidates=$2::jsonb WHERE gallery_id=$1', [album.id, JSON.stringify([candidate])]);
  const published = await api.patch('/api/admin/galleries', { data: { id: album.id, revision: album.revision, action: 'publish', data: { ...albumData(), photos: [photo(), { ...photo(1), visible: false }, { ...photo(2), selected: false }] } } });
  expect(published.status()).toBe(200); album = await published.json();
  await page.goto(path);
  await expect(page.locator('[data-gallery-layout] img')).toHaveCount(1);
  await expect(page.locator('[data-gallery-layout] img')).toHaveAttribute('alt', 'Keterangan alternatif 0');
  const projected = await pool.query('SELECT * FROM gallery_images WHERE gallery_id=$1', [album.id]);
  expect(projected.rows).toHaveLength(1);
  const changed = { ...albumData('Draft rahasia'), photos: [photo(3)] };
  const saved = await api.patch('/api/admin/galleries', { data: { id: album.id, revision: album.revision, action: 'draft', data: changed } });
  expect(saved.status()).toBe(200);
  const stale = await api.patch('/api/admin/galleries', { data: { id: album.id, revision: album.revision, action: 'publish', data: changed } });
  expect(stale.status()).toBe(409); album = await saved.json();
  const publicHtml = await (await request.get(path)).text();
  expect(publicHtml).not.toContain('Draft rahasia'); expect(publicHtml).not.toContain('Kandidat rahasia'); expect(publicHtml).not.toContain(photo(3).id);
  expect(publicHtml).not.toContain(photo(1).id); expect(publicHtml).not.toContain(photo(2).id); expect(publicHtml).not.toContain(photo(9).id);
  expect((await api.patch('/api/admin/media/galeri', { data: { id: album.id, title: 'Legacy overwrite', status: 'published', images: [] } })).status()).toBe(409);
  const concurrent = await Promise.all(['Sesi A', 'Sesi B'].map((title) => api.patch('/api/admin/galleries', { data: { id: album.id, revision: album.revision, action: 'draft', data: albumData(title) } })));
  expect(concurrent.map((r) => r.status()).sort()).toEqual([200, 409]);
  album = await concurrent.find((r) => r.ok())!.json();
  const archived = await api.patch('/api/admin/galleries', { data: { id: album.id, revision: album.revision, action: 'archive' } });
  expect(archived.status()).toBe(200); album = await archived.json();
  expect((await request.get(path)).status()).toBe(404);
  expect((await api.patch('/api/admin/galleries', { data: { id: album.id, revision: album.revision, action: 'publish', data: albumData() } })).status()).toBe(200);
  expect((await request.get(path)).status()).toBe(200);
  const logs = await pool.query("SELECT actor_id,action FROM activity_logs WHERE target_type='gallery' AND target_id=$1", [String(album.id)]);
  expect(logs.rows.some((r) => r.action === 'restored' && r.actor_id === adminId)).toBe(true);
  await context.clearCookies();
  await context.addCookies([{ name: 'mahida_session', value: jwt.sign({ userId: contentId, role: 'admin' }, process.env.JWT_SECRET!), domain: '127.0.0.1', path: '/' }]);
  expect((await api.get('/api/admin/galleries')).status()).toBe(403);
});

test('legacy albums retain public data and manual input; responsive preview layouts', async ({ context, page }) => {
  const row = (await pool.query("INSERT INTO galleries(title,slug,description,status) VALUES('Album Lama','legacy-r2-test','Data lama','published') RETURNING id")).rows[0];
  created.push(row.id);
  await pool.query('INSERT INTO gallery_images(gallery_id,image_url,caption,sort_order) VALUES($1,$2,$3,0)', [row.id, photo().imageUrl, 'Foto Lama']);
  const before = await pool.query('SELECT image_url,caption FROM gallery_images WHERE gallery_id=$1', [row.id]);
  const data = (await (await context.request.get('/api/admin/galleries')).json()).items.find((p: { id: number }) => p.id === row.id);
  const edited = await context.request.patch('/api/admin/galleries', { data: { id: row.id, revision: 0, action: 'draft', data: { ...data.draft, title: 'Draft Album Lama' } } });
  expect(edited.status()).toBe(200);
  expect((await pool.query('SELECT image_url,caption FROM gallery_images WHERE gallery_id=$1', [row.id])).rows).toEqual(before.rows);
  await page.goto('/media/galeri/legacy-r2-test');
  await expect(page.getByRole('heading', { name: 'Album Lama', exact: true })).toBeVisible();
  await page.goto('/admin/media/galeri');
  await page.getByRole('button', { name: /Draft Album Lama/ }).click();
  await page.getByText('Tambah foto satu per satu (metode lama)', { exact: true }).click();
  await page.getByRole('textbox', { name: /Satu tautan foto Google Drive/ }).fill(`${photo(6).imageUrl} | Foto manual`);
  await page.getByRole('button', { name: 'Tambahkan foto', exact: true }).click();
  const manual = page.locator('fieldset article').last();
  await manual.getByRole('textbox', { name: 'Teks alternatif' }).fill('Foto manual terkurasi');
  await manual.getByRole('combobox').last().selectOption('portrait');
  await manual.getByRole('checkbox', { name: /Crop untuk mengisi rasio/ }).check();
  await page.getByRole('button', { name: 'Pratinjau', exact: true }).click();
  await expect(page.locator('[data-gallery-preview] [data-gallery-layout] img')).toHaveCount(2);
  const manualPreview = page.locator('[data-gallery-preview] [data-gallery-layout] img').last();
  await expect(manualPreview).toHaveAttribute('alt', 'Foto manual terkurasi');
  await expect(manualPreview).toHaveCSS('object-fit', 'cover');
  await manual.getByRole('checkbox', { name: 'Tampilkan', exact: true }).uncheck();
  await expect(page.locator('[data-gallery-preview] [data-gallery-layout] img')).toHaveCount(1);
  await manual.getByRole('checkbox', { name: 'Tampilkan', exact: true }).check();
  await page.locator('[data-gallery-preview] [data-gallery-layout] button').first().click();
  await expect(page.getByRole('dialog', { name: 'Foto galeri' })).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('dialog').locator('img')).toHaveAttribute('alt', 'Foto manual terkurasi');
  await page.getByRole('button', { name: 'Tutup', exact: true }).click();
  for (const [value, label] of [['grid', 'Grid rapi'], ['masonry', 'Masonry dokumentasi'], ['spotlight', 'Sorotan kegiatan']]) {
    await page.getByRole('combobox', { name: 'Layout album', exact: true }).selectOption({ label });
    await expect(page.locator('[data-gallery-preview] [data-gallery-layout]')).toHaveAttribute('data-gallery-layout', value);
    for (const width of [320, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    }
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({ path: 'test-results/gallery-admin-desktop.png', animations: 'disabled' });
  await page.setViewportSize({ width: 320, height: 900 });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({ path: 'test-results/gallery-admin-mobile.png', animations: 'disabled' });
});
