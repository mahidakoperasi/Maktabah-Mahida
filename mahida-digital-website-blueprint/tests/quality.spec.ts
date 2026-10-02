import { test, expect } from './fixtures';
import pg from 'pg';
import jwt from 'jsonwebtoken';
import type { BrowserContext } from '@playwright/test';
import { checkQuality } from '../src/lib/quality-check';
import { publicAddress, probeHttps } from '../src/lib/safe-probe';
import { csvCell } from '../src/lib/export-data';
import { checklistLabels } from '../src/lib/quality-schema';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const actors: Record<string, number> = {};
const path = '/uji-r5-kualitas',
  target = `page:${path}`;
const checklist = {
  status: true,
  photos: true,
  buttons: true,
  mobile: true,
  privacy: true,
};
let album: number, post: number;
async function login(context: BrowserContext, role = 'full') {
  await context.clearCookies();
  await context.addCookies([
    {
      name: 'mahida_session',
      value: jwt.sign(
        { userId: actors[role], role: 'admin' },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' },
      ),
      domain: '127.0.0.1',
      path: '/',
    },
  ]);
}
async function publication(context: BrowserContext) {
  return (
    await context.request.get(
      `/api/admin/publication?target=${encodeURIComponent(target)}`,
    )
  ).json();
}
test.beforeAll(async () => {
  if (new URL(process.env.DATABASE_URL!).pathname !== '/mahida_ci')
    throw Error('Disposable mahida_ci required');
  for (const role of ['full', 'content', 'media', 'admissions', 'commerce'])
    actors[role] = (
      await pool.query(
        "INSERT INTO users(email,password,name,role,email_verified,admin_access) VALUES($1,'test-only',$1,'admin',true,$2) ON CONFLICT(email) DO UPDATE SET admin_access=$2 RETURNING id",
        [`r5-${role}@example.invalid`, role],
      )
    ).rows[0].id;
  await pool.query(
    "INSERT INTO cms_pages(path,title,intro,body,status) VALUES($1,'Kualitas R5','','Teks terbit aman','published') ON CONFLICT(path) DO UPDATE SET status='published'",
    [path],
  );
  album = (
    await pool.query(
      "INSERT INTO galleries(title,slug,status) VALUES('Album Kualitas R5','album-kualitas-r5','published') RETURNING id",
    )
  ).rows[0].id;
  await pool.query(
    'INSERT INTO gallery_documents(gallery_id,draft,published) VALUES($1,$2::jsonb,$2::jsonb)',
    [
      album,
      JSON.stringify({
        title: 'Album Kualitas R5',
        description: '',
        folderUrl: 'https://drive.google.com/drive/folders/folder12345678',
        photos: [
          {
            id: 'removedphoto12345',
            imageUrl: 'https://drive.google.com/file/d/removedphoto12345/view',
            alt: '',
            title: 'Foto dipindah',
            selected: true,
            visible: true,
          },
        ],
      }),
    ],
  );
  post = (
    await pool.query(
      "INSERT INTO posts(title,slug,type,status,content,content_raw) VALUES('Konten R5','konten-kualitas-r5','article','draft','Rahasia editorial R5','Rahasia editorial R5') RETURNING id",
    )
  ).rows[0].id;
});
test.beforeEach(async ({ context, page }) => {
  await login(context);
  await pool.query('DELETE FROM publication_documents WHERE target=$1', [
    target,
  ]);
  await pool.query('DELETE FROM publication_checklists WHERE target=$1', [
    target,
  ]);
  await pool.query('DELETE FROM design_documents WHERE path=$1', [path]);
  await pool.query(
    "UPDATE cms_pages SET title='Kualitas R5',body='Teks terbit aman',status='published' WHERE path=$1",
    [path],
  );
  await pool.query(
    "UPDATE settings SET value='{\"enabled\":true}' WHERE key='routine_analytics'",
  );
  await page.route('https://fonts.googleapis.com/**', (r) =>
    r.fulfill({ contentType: 'text/css', body: '' }),
  );
  await page.route('https://fonts.gstatic.com/**', (r) => r.abort());
});
test.afterAll(async () => {
  await pool.query('DELETE FROM quality_reports WHERE target=ANY($1)', [
    [target, `gallery:${album}`, `post:${post}`],
  ]);
  await pool.query('DELETE FROM publication_documents WHERE target=$1', [
    target,
  ]);
  await pool.query('DELETE FROM publication_checklists WHERE target=$1', [
    target,
  ]);
  await pool.query('DELETE FROM design_documents WHERE path=$1', [path]);
  await pool.query('DELETE FROM cms_pages WHERE path=$1', [path]);
  await pool.query('DELETE FROM galleries WHERE id=$1', [album]);
  await pool.query('DELETE FROM posts WHERE id=$1', [post]);
  await pool.query('DELETE FROM analytics_daily WHERE path=$1', [path]);
  await pool.query(
    "UPDATE settings SET value='{\"enabled\":true}' WHERE key='routine_analytics'",
  );
  await pool.end();
});
test('quality detects public Drive failures, moved photos, weight, alt, titles and personal patterns without downloading media', async () => {
  const calls: { url: URL; init?: RequestInit }[] = [];
  const report = await checkQuality(
    {
      target: 'gallery:1',
      title: '',
      status: 'draft',
      publicPath: '/media/galeri/uji',
      headings: [''],
      texts: ['Kontak pribadi orang@example.invalid'],
      images: [
        {
          url: 'https://drive.google.com/file/d/heavyphoto123456/view?resourcekey=resource123',
          alt: '',
          label: 'Foto berat',
          folderId: 'folder12345678',
        },
        {
          url: 'https://drive.google.com/file/d/deniedphoto12345/view',
          alt: 'Dihapus',
          label: 'Foto hilang',
        },
        {
          url: 'https://drive.google.com/file/d/quotaphoto123456/view',
          alt: 'Kuota',
          label: 'Foto kuota',
        },
      ],
      videos: [{ url: 'https://youtu.be/abcdefghijk', label: 'Video privat' }],
      links: [{ url: 'https://mahida.my.id/tujuan-hilang', label: '' }],
    },
    'draft',
    {
      fetcher: async (input, init) => {
        const url = new URL(String(input));
        calls.push({ url, init });
        if (url.hostname === 'www.youtube.com')
          return Response.json({}, { status: 401 });
        const id = url.pathname.split('/').at(-1)!;
        return id.startsWith('denied')
          ? Response.json({}, { status: 404 })
          : id.startsWith('quota')
            ? Response.json({}, { status: 429 })
            : Response.json({
                mimeType: 'image/jpeg',
                size: String(5 * 1024 * 1024),
                parents: [],
                trashed: false,
              });
      },
      routeExists: async () => false,
      probe: async () => {
        throw Error('No arbitrary URL probe expected');
      },
    },
  );
  for (const code of [
    'empty-title',
    'empty-heading',
    'missing-alt',
    'personal-data',
    'heavy-media',
    'removed-from-folder',
    'drive-unavailable',
    'drive-unverified',
    'youtube-unavailable',
    'broken-internal',
    'empty-button',
  ])
    expect(report.issues.some((i) => i.code === code)).toBeTruthy();
  expect(
    calls.every((c) =>
      ['www.googleapis.com', 'www.youtube.com'].includes(c.url.hostname),
    ),
  ).toBeTruthy();
  const drive = calls.find((c) => c.url.pathname.includes('heavyphoto'))!;
  expect(
    new Headers(drive.init?.headers).get('X-Goog-Drive-Resource-Keys'),
  ).toBe('heavyphoto123456/resource123');
  expect(drive.url.searchParams.has('key')).toBeFalsy();
  expect(JSON.stringify(report)).not.toContain(
    process.env.GOOGLE_DRIVE_API_KEY!,
  );
});
test('temporary Drive and YouTube outages remain unverified instead of declaring media deleted', async () => {
  for (const status of [401, 403, 429, 500, 503]) {
    const report = await checkQuality(
      {
        target: 'page:/',
        title: 'Layanan sementara',
        status: 'published',
        publicPath: '/',
        headings: [],
        texts: [],
        images: [
          {
            url: 'https://drive.google.com/file/d/publicfile12345/view',
            alt: 'Foto',
            label: 'Foto',
          },
        ],
        videos:
          status === 401
            ? []
            : [{ url: 'https://youtu.be/abcdefghijk', label: 'Video' }],
        links: [],
      },
      'published',
      { fetcher: async () => Response.json({}, { status }) },
    );
    expect(
      report.issues.some((i) => i.code === 'drive-unverified'),
    ).toBeTruthy();
    expect(
      report.issues.some(
        (i) =>
          i.code === 'drive-unavailable' || i.code === 'youtube-unavailable',
      ),
    ).toBeFalsy();
    if (status !== 401)
      expect(
        report.issues.some((i) => i.code === 'youtube-unverified'),
      ).toBeTruthy();
  }
});
test('public probes reject private, metadata, reserved and mapped IPs; CSV neutralizes spreadsheet formulas', async () => {
  for (const address of [
    '127.0.0.1',
    '10.2.3.4',
    '100.64.1.1',
    '169.254.169.254',
    '172.16.1.1',
    '192.168.1.1',
    '0.0.0.0',
    '224.1.2.3',
    '::1',
    'fc00::1',
    'fe80::1',
    '2001:db8::1',
    '::ffff:127.0.0.1',
    '2002:7f00:1::',
  ])
    expect(publicAddress(address)).toBeFalsy();
  for (const address of ['8.8.8.8', '1.1.1.1', '2606:4700:4700::1111'])
    expect(publicAddress(address)).toBeTruthy();
  await expect(probeHttps('https://127.0.0.1/internal')).rejects.toThrow(
    'privat',
  );
  await expect(probeHttps('http://example.com')).rejects.toThrow('HTTPS');
  for (const input of ['=HYPERLINK("x")', ' +CMD', '-1', '@SUM(A1)', '\t=1'])
    expect(csvCell(input)).toMatch(/^"'/);
  expect(csvCell('Biasa, "teks"')).toBe('"Biasa, ""teks"""');
});
test('quality and exports enforce each Admin scope and guests cannot read private reports or content', async ({
  context,
}) => {
  for (const [role, allowed, denied, exportAllowed, exportDenied] of [
    ['content', `post:${post}`, `gallery:${album}`, 'content', 'gallery'],
    ['media', `gallery:${album}`, `post:${post}`, 'gallery', 'content'],
    ['admissions', 'admissions', target, 'admissions', 'forms'],
    ['commerce', 'commerce', target, 'orders', 'forms'],
  ]) {
    await login(context, role);
    const list = await (await context.request.get('/api/admin/quality')).json();
    expect(
      list.items.some((t: { target: string }) => t.target === allowed),
    ).toBeTruthy();
    expect(
      list.items.some((t: { target: string }) => t.target === denied),
    ).toBeFalsy();
    expect(
      (
        await context.request.get(
          `/api/admin/quality?target=${encodeURIComponent(denied)}`,
        )
      ).status(),
    ).toBe(403);
    expect(
      (
        await context.request.post('/api/admin/quality', {
          data: { target: denied },
        })
      ).status(),
    ).toBe(403);
    expect(
      (
        await context.request.get(`/api/admin/exports?kind=${exportAllowed}`)
      ).ok(),
    ).toBeTruthy();
    expect(
      (
        await context.request.get(`/api/admin/exports?kind=${exportDenied}`)
      ).status(),
    ).toBe(403);
    expect((await context.request.get('/api/admin/analytics')).status()).toBe(
      403,
    );
  }
  await context.clearCookies();
  for (const url of [
    '/api/admin/quality',
    `/api/admin/quality?target=${encodeURIComponent(target)}`,
    '/api/admin/exports?kind=content',
    '/api/admin/guide',
    '/api/admin/analytics',
  ])
    expect((await context.request.get(url)).status()).toBe(403);
});
test('reports separate draft/published, mark stale snapshots and never alter the public projection', async ({
  context,
}) => {
  const doc = await publication(context),
    data = {
      ...doc.draft,
      title: 'Judul draf privat R5',
      body: 'Kontak orang@example.invalid. [Rusak](https://mahida.my.id/tujuan-r5-hilang) [Relatif](/tujuan-r5-relatif-hilang)',
    };
  expect(
    (
      await context.request.put('/api/admin/publication', {
        data: {
          target,
          revision: doc.revision,
          source: doc.source,
          action: 'draft',
          data,
        },
      })
    ).ok(),
  ).toBeTruthy();
  const checked = await context.request.post('/api/admin/quality', {
    data: { target, version: 'draft' },
  });
  expect(checked.ok()).toBeTruthy();
  const result = await checked.json();
  expect(
    result.report.issues.some(
      (i: { code: string }) => i.code === 'broken-internal',
    ),
  ).toBeTruthy();
  expect(
    result.report.issues.some(
      (i: { code: string; url: string }) =>
        i.code === 'broken-internal' && i.url === '/tujuan-r5-relatif-hilang',
    ),
  ).toBeTruthy();
  expect(
    result.report.issues.some(
      (i: { code: string }) => i.code === 'unsupported-text-link',
    ),
  ).toBeTruthy();
  const saved = await context.request.get(
    `/api/admin/quality?target=${encodeURIComponent(target)}&version=draft`,
  );
  expect(saved.headers()['cache-control']).toContain('no-store');
  expect((await saved.json()).stale).toBeFalsy();
  expect(
    (
      await context.request
        .get(
          `/api/admin/quality?target=${encodeURIComponent(target)}&version=published`,
        )
        .then((r) => r.json())
    ).report,
  ).toBeNull();
  expect(await (await context.request.get(path)).text()).not.toContain(
    'Judul draf privat R5',
  );
  await pool.query(
    "UPDATE publication_documents SET draft=jsonb_set(draft,'{body}',$2::jsonb) WHERE target=$1",
    [target, JSON.stringify('Draf berubah di sesi lain')],
  );
  expect(
    (
      await context.request
        .get(
          `/api/admin/quality?target=${encodeURIComponent(target)}&version=draft`,
        )
        .then((r) => r.json())
    ).stale,
  ).toBeTruthy();
  const cross = await context.request.post('/api/admin/quality', {
    headers: { Origin: 'https://evil.example' },
    data: { target },
  });
  expect(cross.status()).toBe(403);
});
test('quality gallery checks warn when public photos leave the configured folder', async ({
  context,
}) => {
  const r = await context.request.post('/api/admin/quality', {
    data: { target: `gallery:${album}`, version: 'published' },
  });
  expect(r.ok()).toBeTruthy();
  const report = (await r.json()).report;
  expect(
    report.issues.some(
      (i: { code: string }) => i.code === 'removed-from-folder',
    ),
  ).toBeTruthy();
  expect(
    report.issues.some((i: { code: string }) => i.code === 'missing-alt'),
  ).toBeTruthy();
  expect(
    (await pool.query('SELECT status FROM galleries WHERE id=$1', [album]))
      .rows[0].status,
  ).toBe('published');
});
test('unified publication requires five checks and records the reviewed snapshot atomically', async ({
  context,
}) => {
  const doc = await publication(context),
    body = {
      target,
      revision: doc.revision,
      source: doc.source,
      action: 'publish',
      data: doc.draft,
    };
  expect(
    (
      await context.request.put('/api/admin/publication', { data: body })
    ).status(),
  ).toBe(400);
  expect(
    (
      await context.request.put('/api/admin/publication', {
        data: { ...body, checklist: { ...checklist, privacy: false } },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await pool.query(
        'SELECT count(*)::int AS n FROM publication_checklists WHERE target=$1',
        [target],
      )
    ).rows[0].n,
  ).toBe(0);
  expect(
    (
      await context.request.put('/api/admin/publication', {
        data: { ...body, checklist },
      })
    ).ok(),
  ).toBeTruthy();
  const row = (
    await pool.query('SELECT * FROM publication_checklists WHERE target=$1', [
      target,
    ])
  ).rows[0];
  expect(row.checks).toEqual(checklist);
  expect(row.reviewed_by).toBe(actors.full);
  expect(row.snapshot_hash).toHaveLength(64);
});
test('anonymous analytics accepts only public paths/events, strips personal data and excludes Admin, DNT and bots', async ({
  context,
  page,
}) => {
  await context.clearCookies();
  const base = (
    await pool.query(
      "SELECT coalesce(sum(count),0)::int AS n FROM analytics_daily WHERE path=$1 AND event='pageview'",
      [path],
    )
  ).rows[0].n;
  const headers = {
    'User-Agent': 'Mahida Browser Test',
    'X-Real-IP': '198.51.100.4',
  };
  expect(
    (
      await context.request.post('/api/analytics', {
        headers,
        data: { path, event: 'pageview' },
      })
    ).status(),
  ).toBe(204);
  expect(
    (
      await context.request.post('/api/analytics', {
        headers,
        data: { path, event: 'whatsapp' },
      })
    ).status(),
  ).toBe(204);
  for (const body of [
    { path: path + '?email=person@example.invalid', event: 'pageview' },
    { path: '/admin', event: 'pageview' },
    { path, event: 'unknown' },
    { path, event: 'pageview', email: 'person@example.invalid' },
  ])
    expect(
      (
        await context.request.post('/api/analytics', { headers, data: body })
      ).status(),
    ).toBe(400);
  expect(
    (
      await context.request.post('/api/analytics', {
        headers: { ...headers, Origin: 'https://evil.example' },
        data: { path, event: 'pageview' },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await context.request.post('/api/analytics', {
        headers,
        data: { path: '/halaman-r5-tidak-ada', event: 'pageview' },
      })
    ).status(),
  ).toBe(404);
  for (const extra of [
    { DNT: '1' },
    { 'Sec-GPC': '1' },
    { 'User-Agent': 'SearchBot' },
  ] as Record<string, string>[])
    expect(
      (
        await context.request.post('/api/analytics', {
          headers: { ...headers, ...extra },
          data: { path, event: 'pageview' },
        })
      ).status(),
    ).toBe(204);
  await login(context);
  expect(
    (
      await context.request.post('/api/analytics', {
        headers,
        data: { path, event: 'pageview' },
      })
    ).status(),
  ).toBe(204);
  expect(
    (
      await pool.query(
        "SELECT sum(count)::int AS n FROM analytics_daily WHERE path=$1 AND event='pageview'",
        [path],
      )
    ).rows[0].n,
  ).toBe(base + 1);
  expect(
    (
      await pool.query(
        'SELECT count(*)::int AS n FROM analytics_daily WHERE path=$1 AND day<current_date-180',
        [path],
      )
    ).rows[0].n,
  ).toBe(0);
  const cols = (
    await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name='analytics_daily'",
    )
  ).rows.map((r) => r.column_name);
  expect(cols.sort()).toEqual(['count', 'day', 'event', 'path']);
  const stats = await (
    await context.request.get('/api/admin/analytics?days=7')
  ).json();
  expect(stats.days).toBe(7);
  expect(
    stats.pages.some((p: { path: string }) => p.path === path),
  ).toBeTruthy();
  const clicks = (
    await pool.query(
      "SELECT sum(count)::int AS n FROM analytics_daily WHERE path=$1 AND event='whatsapp'",
      [path],
    )
  ).rows[0].n;
  await context.clearCookies();
  await page.setExtraHTTPHeaders({ 'User-Agent': 'Mahida Browser Test' });
  await pool.query('UPDATE cms_pages SET body=$2 WHERE path=$1', [
    path,
    '[WhatsApp uji R5](https://wa.me/6281234567890)',
  ]);
  await page.goto(path);
  await expect
    .poll(
      async () =>
        (
          await pool.query(
            "SELECT sum(count)::int AS n FROM analytics_daily WHERE path=$1 AND event='pageview'",
            [path],
          )
        ).rows[0].n,
    )
    .toBe(base + 2);
  // Exercise the real click listener without opening the external provider.
  await page.evaluate(() =>
    document.addEventListener('click', (event) => event.preventDefault(), {
      capture: true,
    }),
  );
  await page
    .getByRole('link', { name: 'WhatsApp uji R5', exact: true })
    .click();
  await expect
    .poll(
      async () =>
        (
          await pool.query(
            "SELECT sum(count)::int AS n FROM analytics_daily WHERE path=$1 AND event='whatsapp'",
            [path],
          )
        ).rows[0].n,
    )
    .toBe(clicks + 1);
});
test('analytics toggle works without losing legitimate aggregate counts', async ({
  context,
}) => {
  const header = {
    'User-Agent': 'Mahida Browser Test',
    'X-Real-IP': '198.51.100.5',
  };
  await context.clearCookies();
  await context.request.post('/api/analytics', {
    headers: header,
    data: { path, event: 'pageview' },
  });
  await login(context);
  expect(
    (
      await context.request.put('/api/admin/analytics', {
        data: { enabled: false },
      })
    ).ok(),
  ).toBeTruthy();
  const before = (
    await pool.query(
      'SELECT sum(count)::int AS n FROM analytics_daily WHERE path=$1',
      [path],
    )
  ).rows[0].n;
  await context.clearCookies();
  await context.request.post('/api/analytics', {
    headers: header,
    data: { path, event: 'whatsapp' },
  });
  expect(
    (
      await pool.query(
        'SELECT sum(count)::int AS n FROM analytics_daily WHERE path=$1',
        [path],
      )
    ).rows[0].n,
  ).toBe(before);
  await login(context);
  expect(
    (
      await context.request.put('/api/admin/analytics', {
        headers: { Origin: 'https://evil.example' },
        data: { enabled: true },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await context.request.put('/api/admin/analytics', {
        data: { enabled: true },
      })
    ).ok(),
  ).toBeTruthy();
});
test('exports paginate, preserve gallery JSON, neutralize CSV and omit authentication/private delivery fields', async ({
  context,
}) => {
  const ids: number[] = [];
  try {
    for (let i = 0; i < 53; i++)
      ids.push(
        (
          await pool.query(
            "INSERT INTO contact_messages(name,reply_to,subject,message) VALUES('=CMD()','test@example.invalid',$1,'Pesan kontak uji ekspor') RETURNING id",
            [`Subjek R5 ${i}`],
          )
        ).rows[0].id,
      );
    let offset = 0,
      total = 0;
    for (let page = 0; page < 10; page++) {
      const response = await context.request.get(
        `/api/admin/exports?kind=forms&offset=${offset}`,
      );
      expect(response.ok()).toBeTruthy();
      expect(response.headers()['cache-control']).toContain('no-store');
      const data = await response.json();
      expect(data.count).toBeLessThanOrEqual(50);
      total += data.count;
      if (!data.hasMore) break;
      expect(data.nextOffset).toBeGreaterThan(offset);
      offset = data.nextOffset;
    }
    expect(total).toBeGreaterThanOrEqual(53);
    const csv = await (
      await context.request.get('/api/admin/exports?kind=forms&format=csv')
    ).text();
    expect(csv).toContain("'=CMD()");
    const gallery = await (
      await context.request.get('/api/admin/exports?kind=gallery')
    ).json();
    expect(
      gallery.data.some(
        (g: { id: number; draft: { photos: unknown[] } }) =>
          g.id === album && g.draft.photos.length,
      ),
    ).toBeTruthy();
    const orders = await (
      await context.request.get('/api/admin/exports?kind=orders')
    ).json();
    for (const row of orders.data)
      expect(row).not.toHaveProperty('file_url_snapshot');
    expect(
      (await context.request.get('/api/admin/exports?kind=users')).status(),
    ).toBe(400);
    expect(
      (
        await context.request.get('/api/admin/exports?kind=forms&offset=-1')
      ).status(),
    ).toBe(400);
    expect(
      (
        await pool.query(
          "SELECT count(*)::int AS n FROM activity_logs WHERE action='exported' AND actor_id=$1",
          [actors.full],
        )
      ).rows[0].n,
    ).toBeGreaterThan(0);
  } finally {
    await pool.query('DELETE FROM contact_messages WHERE id=ANY($1)', [ids]);
  }
});
test('Admin UI displays quality, scoped exports, statistics and current guide at phone/desktop widths', async ({
  page,
  context,
}, testInfo) => {
  for (const width of [375, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/admin/pengelolaan?target=${encodeURIComponent(target)}`);
    await expect(
      page.getByRole('heading', { name: 'Pengelolaan Harian', exact: true }),
    ).toBeVisible();
    await page
      .getByRole('button', { name: 'Jalankan pemeriksaan', exact: true })
      .click();
    await expect(
      page.getByRole('heading', { name: 'Hasil pemeriksaan', exact: true }),
    ).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath(`quality-${width}.png`),
      fullPage: true,
    });
    await page.getByRole('button', { name: 'Ekspor', exact: true }).click();
    await expect(page.getByLabel('Jenis data')).toContainText(
      'Pesan formulir kontak',
    );
    await page.getByRole('button', { name: 'Statistik', exact: true }).click();
    await expect(
      page.getByRole('heading', {
        name: 'Statistik anonim Mahida',
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.getByText('Pencatatan:', { exact: false })).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath(`statistics-${width}.png`),
      fullPage: true,
    });
    await page
      .getByRole('button', { name: 'Panduan Admin', exact: true })
      .click();
    await expect(
      page.getByRole('heading', { name: 'Panduan Admin Rilis 1–5' }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBeTruthy();
  }
  const guide = await context.request.get('/api/admin/guide');
  expect(guide.ok()).toBeTruthy();
  expect(await guide.text()).toContain('Jawaban pendaftaran tidak disimpan');
  await login(context, 'media');
  await page.goto('/admin/pengelolaan');
  await page.getByRole('button', { name: 'Ekspor', exact: true }).click();
  await expect(page.getByLabel('Jenis data')).not.toContainText(
    'Pesan formulir kontak',
  );
  await expect(
    page.getByRole('button', { name: 'Statistik', exact: true }),
  ).toHaveCount(0);
});
test('changing a reviewed draft invalidates UI checklist before publication', async ({
  page,
}) => {
  await page.goto(
    `/admin/tampilan/penerbitan?target=${encodeURIComponent(target)}`,
  );
  await expect(
    page.getByRole('button', { name: 'Terbitkan teks & media' }),
  ).toBeDisabled();
  const title = page.getByLabel('Judul halaman', { exact: true });
  const original = await title.inputValue();
  for (const label of Object.values(checklistLabels))
    await page.getByLabel(label, { exact: true }).check();
  await expect(
    page.getByRole('button', { name: 'Terbitkan teks & media' }),
  ).toBeEnabled();
  await page
    .getByLabel('Judul halaman', { exact: true })
    .fill('Draf baru perlu tinjauan');
  await expect(
    page.getByRole('button', { name: 'Terbitkan teks & media' }),
  ).toBeDisabled();
  for (const label of Object.values(checklistLabels))
    await expect(page.getByLabel(label, { exact: true })).not.toBeChecked();
  await title.fill(original);
  for (const label of Object.values(checklistLabels))
    await expect(page.getByLabel(label, { exact: true })).not.toBeChecked();
  await title.fill('Versi terakhir sudah ditinjau');
  for (const label of Object.values(checklistLabels))
    await page.getByLabel(label, { exact: true }).check();
  await expect(page.getByRole('status')).toContainText(
    'Draf tersimpan otomatis',
  );
  for (const label of Object.values(checklistLabels))
    await expect(page.getByLabel(label, { exact: true })).toBeChecked();
});
