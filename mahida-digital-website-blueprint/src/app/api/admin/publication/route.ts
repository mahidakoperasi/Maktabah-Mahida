import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { pool } from '@/db';
import { sameOrigin } from '@/lib/request-origin';
import { checklistSchema } from '@/lib/quality-schema';
import { snapshotHash } from '@/lib/quality-store';
import { requireAdminAccess } from '@/lib/admin-auth';
import {
  publicationSchema,
  publicationTarget,
  validTarget,
} from '@/lib/publication-schema';
import {
  PublicationError,
  readSource,
  requiredScope,
  validatePublication,
  projectPublication,
  recordPublication,
  flushScheduledPublications,
} from '@/lib/publication-store';
const schema = z.object({
  target: z.string().refine(validTarget),
  revision: z.number().int().min(0),
  source: z.string().length(64),
  action: z.enum(['draft', 'publish', 'schedule', 'cancel']),
  data: publicationSchema.optional(),
  scheduledAt: z.string().datetime({ offset: true }).optional(),
  checklist: checklistSchema.optional(),
});
const privateHeaders = { 'Cache-Control': 'private, no-store' };
export async function GET(request: NextRequest) {
  const target = request.nextUrl.searchParams.get('target');
  if (!target) {
    // The UI advertises targets by the exact same scope as the mutating API.
    const pages = await requireAdminAccess(request, 'primary');
    const media = await requireAdminAccess(request, 'media');
    const content = await requireAdminAccess(request, 'content');
    if (!pages && !media && !content)
      return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
    await flushScheduledPublications();
    const items = [];
    if (pages)
      items.push(
        ...(
          await pool.query(
            "SELECT 'page:'||path AS target,title,path AS url FROM cms_pages WHERE status<>'archived' ORDER BY path",
          )
        ).rows.filter((r) => validTarget(r.target)),
      );
    if (media)
      items.push(
        ...(
          await pool.query(
            "SELECT 'gallery:'||id AS target,title,'/media/galeri/'||slug AS url FROM galleries ORDER BY updated_at DESC",
          )
        ).rows,
      );
    if (content)
      items.push(
        ...(
          await pool.query(
            "SELECT 'announcement:'||id AS target,title,'/media/pengumuman/'||slug AS url FROM posts WHERE type='announcement' ORDER BY updated_at DESC",
          )
        ).rows,
      );
    return NextResponse.json({ items }, { headers: privateHeaders });
  }
  if (!validTarget(target))
    return NextResponse.json({ error: 'Target tidak valid' }, { status: 400 });
  if (!(await requireAdminAccess(request, requiredScope(target))))
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  try {
    const source = await readSource(pool, target);
    const row = (
      await pool.query('SELECT * FROM publication_documents WHERE target=$1', [target])
    ).rows[0];
    // Pull related drafts from their existing editors each time this review page opens.
    let draft = row?.draft ?? source.draft;
    if (source.draft.type === 'page')
      draft = { ...draft, content: source.draft.content, media: source.draft.media };
    if (source.draft.type === 'gallery') draft = source.draft;
    return NextResponse.json(
      {
        ...row,
        draft,
        source: source.source,
        publicPath: source.publicPath,
        status: source.status,
        revision: row?.revision ?? 0,
        history: row?.history ?? [],
      },
      { headers: privateHeaders },
    );
  } catch (error) {
    return failure(error);
  }
}
function failure(error: unknown) {
  return NextResponse.json(
    {
      error:
        error instanceof PublicationError
          ? error.message
          : 'Penerbitan gagal. Draf dan terbitan lama tetap tersimpan.',
    },
    { status: error instanceof PublicationError ? error.status : 500 },
  );
}
export async function PUT(request: NextRequest) {
  if (!sameOrigin(request))
    return NextResponse.json({ error: 'Asal permintaan tidak valid' }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Data tidak valid' },
      { status: 400 },
    );
  const { target, revision, source, action, data, scheduledAt, checklist } = parsed.data;
  const admin = await requireAdminAccess(request, requiredScope(target));
  if (!admin) return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  if ((action === 'publish' || action === 'schedule') && !checklist)
    return NextResponse.json({ error: 'Selesaikan lima item checklist sebelum menerbitkan atau menjadwalkan.' }, { status: 400 });
  if (action !== 'cancel' && (!data || publicationTarget(data) !== target))
    return NextResponse.json({ error: 'Isi tidak sesuai target' }, { status: 400 });
  if (
    action === 'schedule' &&
    (data?.type === 'page' || !scheduledAt || Date.parse(scheduledAt) <= Date.now())
  )
    return NextResponse.json(
      { error: 'Pilih waktu mendatang untuk pengumuman atau album galeri.' },
      { status: 400 },
    );
  if (action === 'publish' || action === 'schedule') {
    try {
      await validatePublication(data!);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Periksa foto Drive' },
        { status: 400 },
      );
    }
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Lock the publication row first; all projections then take parent -> child locks.
    await client.query(
      'INSERT INTO publication_documents(target) VALUES($1) ON CONFLICT DO NOTHING',
      [target],
    );
    const row = (
      await client.query(
        'SELECT * FROM publication_documents WHERE target=$1 FOR UPDATE',
        [target],
      )
    ).rows[0];
    if (row.revision !== revision)
      throw new PublicationError(
        'Draf berubah di sesi lain. Perubahan lokal tetap ada; muat versi terbaru.',
        409,
      );
    const previous = await readSource(client, target, true);
    if (previous.source !== source)
      throw new PublicationError(
        'Teks atau media terkait berubah. Muat ulang untuk meninjau versi terbaru.',
        409,
      );
    if (action !== 'cancel') {
      await client.query(
        'UPDATE publication_documents SET draft=$2::jsonb,updated_at=now() WHERE target=$1',
        [target, JSON.stringify(data)],
      );
      // Keep existing editors and full preview on the same private drafts.
      if (data?.type === 'page')
        for (const kind of ['content', 'media'] as const) {
          await client.query(
            'INSERT INTO design_documents(path,kind,draft) VALUES($1,$2,$3::jsonb) ON CONFLICT(path,kind) DO UPDATE SET draft=$3::jsonb,revision=design_documents.revision+1,updated_at=now()',
            [data.path, kind, JSON.stringify(data[kind])],
          );
        }
    }
    if (data?.type === 'gallery' && action !== 'cancel') {
      await client.query(
        `INSERT INTO gallery_documents(gallery_id,draft) VALUES($1,$2::jsonb) ON CONFLICT(gallery_id) DO UPDATE SET draft=$2::jsonb,revision=gallery_documents.revision+1,updated_at=now(),candidates=CASE WHEN gallery_documents.draft->>'folderUrl' IS DISTINCT FROM $3 THEN '[]'::jsonb ELSE gallery_documents.candidates END,synced_at=CASE WHEN gallery_documents.draft->>'folderUrl' IS DISTINCT FROM $3 THEN NULL ELSE gallery_documents.synced_at END`,
        [data.id, JSON.stringify(data.data), data.data.folderUrl],
      );
    }
    if (action === 'publish') {
      await projectPublication(client, data!);
      await recordPublication(
        client,
        target,
        row,
        previous.published,
        previous.status,
        admin.id,
        'published',
      );
    } else {
      await client.query(
        `UPDATE publication_documents SET revision=revision+1,updated_at=now(),scheduled_error=NULL${action === 'schedule' ? ',scheduled=$2::jsonb,scheduled_at=$3::timestamptz,scheduled_by=$4' : action === 'cancel' ? ',scheduled=NULL,scheduled_at=NULL,scheduled_by=NULL' : ''} WHERE target=$1`,
        action === 'schedule'
          ? [target, JSON.stringify(data), scheduledAt, admin.id]
          : [target],
      );
      await client.query(
        "INSERT INTO activity_logs(actor_id,action,target_type,target_id,summary) VALUES($1,$2,'publication',$3,$4)",
        [
          admin.id,
          action === 'schedule' ? 'scheduled' : 'updated',
          target.slice(0, 80),
          `${action}: ${target}`.slice(0, 500),
        ],
      );
    }
    if ((action === 'publish' || action === 'schedule') && checklist)
      await client.query(
        'INSERT INTO publication_checklists(target,snapshot_hash,checks,reviewed_by) VALUES($1,$2,$3::jsonb,$4) ON CONFLICT(target) DO UPDATE SET snapshot_hash=$2,checks=$3::jsonb,reviewed_by=$4,reviewed_at=now()',
        [target, snapshotHash(data), JSON.stringify(checklist), admin.id],
      );
    const result = (
      await client.query('SELECT * FROM publication_documents WHERE target=$1', [target])
    ).rows[0];
    const next = await readSource(client, target);
    await client.query('COMMIT');
    return NextResponse.json(
      {
        ...result,
        source: next.source,
        publicPath: next.publicPath,
        status: next.status,
      },
      { headers: privateHeaders },
    );
  } catch (error) {
    await client.query('ROLLBACK');
    return failure(error);
  } finally {
    client.release();
  }
}
