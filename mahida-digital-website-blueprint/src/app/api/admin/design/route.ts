import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { pool } from '@/db';
import { sameOrigin } from '@/lib/request-origin';
import { requireAdminAccess } from '@/lib/admin-auth';
import { designPath, mediaSchema, contentSchema } from '@/lib/design-schema';
const requestSchema = z.object({
  path: z.string().refine(designPath),
  kind: z.enum(['media', 'content']),
  action: z.enum(['draft', 'publish', 'restore']),
  revision: z.number().int().min(0),
  data: z.unknown().optional(),
  version: z.number().int().min(-1).optional(),
});
export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get('path') || '',
    kind = request.nextUrl.searchParams.get('kind');
  if (!designPath(path) || !['media', 'content'].includes(kind || ''))
    return NextResponse.json(
      { error: 'Halaman tidak didukung' },
      { status: 400 },
    );
  if (
    !(await requireAdminAccess(request, kind === 'media' ? 'media' : 'content'))
  )
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  if (
    !(
      await pool.query(
        "SELECT 1 FROM cms_pages WHERE path=$1 AND status<>'archived'",
        [path],
      )
    ).rowCount
  )
    return NextResponse.json(
      { error: 'Halaman tidak ditemukan' },
      { status: 404 },
    );
  const { rows } = await pool.query(
    'SELECT draft,published,history,revision FROM design_documents WHERE path=$1 AND kind=$2',
    [path, kind],
  );
  return NextResponse.json(
    rows[0] || { draft: null, published: null, history: [], revision: 0 },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
export async function PUT(request: NextRequest) {
  if (!sameOrigin(request))
    return NextResponse.json(
      { error: 'Asal permintaan tidak valid' },
      { status: 403 },
    );
  const parsed = requestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 });
  const { path, kind, action, revision, version } = parsed.data;
  const admin = await requireAdminAccess(
    request,
    kind === 'media' ? 'media' : 'content',
  );
  if (!admin)
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  if (
    !(
      await pool.query(
        "SELECT 1 FROM cms_pages WHERE path=$1 AND status<>'archived'",
        [path],
      )
    ).rowCount
  )
    return NextResponse.json(
      { error: 'Halaman tidak ditemukan' },
      { status: 404 },
    );
  const data = (kind === 'media' ? mediaSchema : contentSchema).safeParse(
    parsed.data.data,
  );
  if (action !== 'restore' && !data.success)
    return NextResponse.json(
      { error: data.error?.issues.map((i) => i.message).join('; ') },
      { status: 400 },
    );
  if (kind === 'media' && data.success && 'clips' in data.data) {
    if (
      data.data.clips.some(
        (c) => c.area.startsWith('card-') && path !== '/media',
      )
    )
      return NextResponse.json(
        { error: 'Area kartu hanya tersedia di Media' },
        { status: 400 },
      );
  }
  if (
    kind === 'content' &&
    action === 'publish' &&
    data.success &&
    'featuredVideoId' in data.data &&
    data.data.featuredVideoId
  ) {
    const found = await pool.query(
      "SELECT 1 FROM videos WHERE id=$1 AND status='published'",
      [data.data.featuredVideoId],
    );
    if (!found.rowCount)
      return NextResponse.json(
        { error: 'Video sorotan harus terbit dari modul Video' },
        { status: 400 },
      );
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      'INSERT INTO design_documents(path,kind) VALUES($1,$2) ON CONFLICT DO NOTHING',
      [path, kind],
    );
    const { rows } = await client.query(
      'SELECT * FROM design_documents WHERE path=$1 AND kind=$2 FOR UPDATE',
      [path, kind],
    );
    const row = rows[0];
    if (row.revision !== revision) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        {
          error: 'Halaman berubah di sesi lain. Muat ulang sebelum menyimpan.',
        },
        { status: 409 },
      );
    }
    const restored = version === undefined ? null : row.history[version]?.data;
    const checked = (kind === 'media' ? mediaSchema : contentSchema).safeParse(
      restored,
    );
    const legacy = action === 'restore' && version === -1 && kind === 'media';
    if (action === 'restore' && !legacy && !checked.success) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { error: 'Versi tidak tersedia' },
        { status: 400 },
      );
    }
    const next = legacy
      ? null
      : action === 'restore'
        ? checked.data
        : data.data;
    const history =
      action === 'draft'
        ? row.history
        : [
            ...(row.published
              ? [
                  {
                    at: new Date().toISOString(),
                    by: admin.id,
                    data: row.published,
                  },
                ]
              : []),
            ...row.history,
          ].slice(0, 20);
    const { rows: result } = await client.query(
      'UPDATE design_documents SET draft=$3::jsonb,published=$4::jsonb,history=$5::jsonb,revision=revision+1,updated_by=$6,updated_at=now() WHERE path=$1 AND kind=$2 RETURNING draft,published,history,revision',
      [
        path,
        kind,
        JSON.stringify(next),
        JSON.stringify(action === 'draft' ? row.published : next),
        JSON.stringify(history),
        admin.id,
      ],
    );
    await client.query(
      'INSERT INTO activity_logs(actor_id,action,target_type,target_id,summary) VALUES($1,$2,$3,$4,$5)',
      [
        admin.id,
        action === 'restore'
          ? 'restored'
          : action === 'publish'
            ? 'published'
            : 'updated',
        `design_${kind}`,
        path.slice(0, 80),
        `${action === 'restore' ? 'Memulihkan' : action === 'publish' ? 'Menerbitkan' : 'Menyimpan draft'} desain ${path}`.slice(
          0,
          500,
        ),
      ],
    );
    await client.query('COMMIT');
    return NextResponse.json(result[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Design update failed', error);
    return NextResponse.json(
      { error: 'Gagal menyimpan desain' },
      { status: 500 },
    );
  } finally {
    client.release();
  }
}
