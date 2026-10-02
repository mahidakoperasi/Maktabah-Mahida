import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { pool } from '@/db';
import { requireAdminAccess } from '@/lib/admin-auth';
import { sameOrigin } from '@/lib/request-origin';
import { gallerySchema, mergeCandidates, visibleGalleryPhotos, type DriveCandidate } from '@/lib/gallery-schema';
import { legacyGallery } from '@/lib/gallery-store';
import { listDrivePhotos, DriveFolderError } from '@/lib/drive-folder';
import { slugify } from '@/lib/utils';

export const dynamic = 'force-dynamic';
const schema = z.object({ id: z.number().int().positive().optional(), revision: z.number().int().min(0), action: z.enum(['draft', 'publish', 'sync', 'archive']), data: gallerySchema.optional() });

export async function GET(request: NextRequest) {
  if (!await requireAdminAccess(request, 'media')) return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  const { rows } = await pool.query(`SELECT g.id,g.slug,g.status,g.title,g.description,g.updated_at AS "updatedAt",
    d.draft,d.published,d.candidates,d.history,d.revision,d.synced_at AS "syncedAt"
    FROM galleries g LEFT JOIN gallery_documents d ON d.gallery_id=g.id ORDER BY g.updated_at DESC,g.id DESC`);
  const items = await Promise.all(rows.map(async (row) => ({ ...row, revision: row.revision ?? 0, candidates: row.candidates ?? [], history: row.history ?? [], draft: row.draft ?? await legacyGallery(pool, row.id) })));
  return NextResponse.json({ items, driveConfigured: Boolean(process.env.GOOGLE_DRIVE_API_KEY) }, { headers: { 'Cache-Control': 'private, no-store' } });
}

async function save(request: NextRequest, create: boolean) {
  const admin = await requireAdminAccess(request, 'media');
  if (!admin || !sameOrigin(request)) return NextResponse.json({ error: 'Tidak diizinkan atau asal permintaan tidak valid' }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Data album tidak valid' }, { status: 400 });
  const { id, revision, action, data } = parsed.data;
  if (['sync', 'archive'].includes(action) && data) return NextResponse.json({ error: 'Sinkronisasi dan arsip tidak menerima perubahan isi album.' }, { status: 400 });
  if ((create && (id || !data || !['draft', 'publish'].includes(action))) || (!create && !id) || (['draft', 'publish'].includes(action) && !data)) return NextResponse.json({ error: 'Data album tidak lengkap' }, { status: 400 });
  if (action === 'publish' && data && !visibleGalleryPhotos(data).length) return NextResponse.json({ error: 'Pilih dan tampilkan minimal satu foto sebelum menerbitkan album.' }, { status: 400 });
  let incoming: Awaited<ReturnType<typeof listDrivePhotos>> | null = null;
  let syncedFolder = '';
  if (action === 'sync') {
    const found = await pool.query('SELECT draft,revision,synced_at FROM gallery_documents WHERE gallery_id=$1', [id]);
    const row = found.rows[0];
    if (!row || row.revision !== revision) return NextResponse.json({ error: 'Album berubah di sesi lain. Muat ulang sebelum sinkronisasi.' }, { status: 409 });
    // DB-backed cooldown survives multiple workers/restarts. Serialize below,
    // checking revision again after the bounded external read finishes.
    if (row.synced_at && Date.now() - new Date(row.synced_at).getTime() < 30000) return NextResponse.json({ error: 'Tunggu 30 detik sebelum sinkronisasi berikutnya.' }, { status: 429 });
    syncedFolder = row.draft.folderUrl;
    try { incoming = await listDrivePhotos(syncedFolder); }
    catch (error) { return NextResponse.json({ error: error instanceof DriveFolderError ? error.message : 'Tidak dapat membaca Drive. Data tetap aman.' }, { status: error instanceof DriveFolderError ? error.status : 502 }); }
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let galleryId = id;
    if (create && data) {
      const base = (slugify(data.title) || 'album').slice(0, 450);
      // Random suffix avoids race collisions. Slug never changes on later edits.
      const slug = `${base}-${crypto.randomUUID().slice(0, 8)}`;
      const result = await client.query("INSERT INTO galleries(title,slug,description,status) VALUES($1,$2,$3,'draft') RETURNING id", [data.title, slug, data.description]);
      galleryId = result.rows[0].id;
      await client.query('INSERT INTO gallery_documents(gallery_id,draft,updated_by) VALUES($1,$2::jsonb,$3)', [galleryId, JSON.stringify(data), admin.id]);
    }
    // Lock parent first: also excludes legacy-route writes once migrated.
    const gallery = await client.query('SELECT * FROM galleries WHERE id=$1 FOR UPDATE', [galleryId]);
    if (!gallery.rows[0]) { await client.query('ROLLBACK'); return NextResponse.json({ error: 'Album tidak ditemukan' }, { status: 404 }); }
    const old = gallery.rows[0];
    const fallback = await legacyGallery(client, galleryId!);
    await client.query('INSERT INTO gallery_documents(gallery_id,draft,published,updated_by) VALUES($1,$2::jsonb,$3::jsonb,$4) ON CONFLICT DO NOTHING', [galleryId, JSON.stringify(fallback), JSON.stringify(old.status === 'published' ? fallback : null), admin.id]);
    const document = (await client.query('SELECT * FROM gallery_documents WHERE gallery_id=$1 FOR UPDATE', [galleryId])).rows[0];
    if (document.revision !== revision) { await client.query('ROLLBACK'); return NextResponse.json({ error: 'Album berubah di sesi lain. Draft Anda tidak ditimpa; muat ulang sebelum menyimpan.' }, { status: 409 }); }
    const next = data ?? document.draft;
    const folderChanged = document.draft.folderUrl !== next.folderUrl;
    const candidates = action === 'sync' && incoming ? mergeCandidates(document.candidates as DriveCandidate[], incoming.candidates) : folderChanged ? [] : document.candidates;
    const history = [{ at: new Date().toISOString(), by: admin.id, action, data: document.draft }, ...document.history].slice(0, 20);
    const published = action === 'publish' ? next : document.published;
    const updated = (await client.query(`UPDATE gallery_documents SET draft=$2::jsonb,published=$3::jsonb,candidates=$4::jsonb,history=$5::jsonb,revision=revision+1,updated_by=$6,updated_at=now(),synced_at=CASE WHEN $7='sync' THEN now() WHEN $8 THEN NULL ELSE synced_at END WHERE gallery_id=$1 RETURNING *`, [galleryId, JSON.stringify(next), JSON.stringify(published), JSON.stringify(candidates), JSON.stringify(history), admin.id, action, folderChanged])).rows[0];
    if (action === 'publish') {
      await client.query("UPDATE galleries SET title=$2,description=$3,status='published',updated_at=now(),revision=revision+1 WHERE id=$1", [galleryId, next.title, next.description]);
      // Public projection contains only selected & visible photos. Legacy public
      // cover/engagement queries keep working without seeing private drafts.
      await client.query('DELETE FROM gallery_images WHERE gallery_id=$1', [galleryId]);
      for (const [order, photo] of visibleGalleryPhotos(next).entries()) await client.query('INSERT INTO gallery_images(gallery_id,image_url,caption,sort_order) VALUES($1,$2,$3,$4)', [galleryId, photo.imageUrl, photo.caption, order]);
    } else if (action === 'archive') await client.query("UPDATE galleries SET status='archived',updated_at=now(),revision=revision+1 WHERE id=$1", [galleryId]);
    // Audit is atomic with the write and includes the acting user.
    await client.query('INSERT INTO activity_logs(actor_id,action,target_type,target_id,summary) VALUES($1,$2,\'gallery\',$3,$4)', [admin.id, action === 'archive' ? 'archived' : action === 'publish' ? old.status === 'archived' ? 'restored' : 'published' : create ? 'created' : 'updated', String(galleryId), `${action === 'sync' ? 'Sinkronisasi kandidat Drive' : action === 'publish' ? 'Menerbitkan album' : action === 'archive' ? 'Mengarsipkan album' : 'Menyimpan draft album'}: ${next.title}`.slice(0, 500)]);
    await client.query('COMMIT');
    return NextResponse.json({ id: galleryId, revision: updated.revision, draft: updated.draft, published: updated.published, candidates: updated.candidates, history: updated.history, syncedAt: updated.synced_at, status: action === 'publish' ? 'published' : action === 'archive' ? 'archived' : old.status, slug: old.slug, folderName: incoming?.name, syncedFolder: syncedFolder || undefined }, { status: create ? 201 : 200 });
  } catch {
    await client.query('ROLLBACK');
    return NextResponse.json({ error: 'Gagal menyimpan album. Tidak ada perubahan sebagian; coba kembali.' }, { status: 500 });
  } finally { client.release(); }
}
export async function POST(request: NextRequest) { return save(request, true); }
export async function PATCH(request: NextRequest) { return save(request, false); }
