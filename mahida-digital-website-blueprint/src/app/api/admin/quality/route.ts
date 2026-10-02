import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { pool } from '@/db';
import { getAdminUser, requireAdminAccess } from '@/lib/admin-auth';
import { canAccess, type StoredAdminAccess } from '@/lib/admin-permissions';
import { PRIMARY_ADMIN_EMAIL } from '@/lib/admin-config';
import { qualityScope } from '@/lib/quality-schema';
import {
  loadQualitySnapshot,
  snapshotHash,
  postPath,
} from '@/lib/quality-store';
import { checkQuality } from '@/lib/quality-check';
import { publicationSchema, publicationTarget } from '@/lib/publication-schema';
import { sameOrigin } from '@/lib/request-origin';
const headers = { 'Cache-Control': 'private, no-store' };
const inFlight = new Set<number>();
export async function GET(request: NextRequest) {
  const target = request.nextUrl.searchParams.get('target');
  if (target) {
    const scope = qualityScope(target);
    if (!scope || !(await requireAdminAccess(request, scope)))
      return NextResponse.json(
        { error: 'Tidak diizinkan' },
        { status: 403, headers },
      );
    const version =
      request.nextUrl.searchParams.get('version') === 'published'
        ? 'published'
        : 'draft';
    try {
      const snapshot = await loadQualitySnapshot(target, version);
      const report =
        (
          await pool.query(
            'SELECT report FROM quality_reports WHERE target=$1 AND version=$2',
            [target, version],
          )
        ).rows[0]?.report ?? null;
      return NextResponse.json(
        {
          report,
          stale: Boolean(
            report && report.snapshotHash !== snapshotHash(snapshot),
          ),
          title: snapshot.title,
          status: snapshot.status,
          publicPath: snapshot.publicPath,
        },
        { headers },
      );
    } catch {
      return NextResponse.json(
        { error: 'Target tidak ditemukan atau datanya belum valid' },
        { status: 404, headers },
      );
    }
  }
  const admin = await getAdminUser(request);
  if (!admin)
    return NextResponse.json(
      { error: 'Tidak diizinkan' },
      { status: 403, headers },
    );
  const capabilities = Object.fromEntries(
    (['primary', 'content', 'media', 'admissions', 'commerce'] as const).map(
      (s) => [
        s,
        canAccess(
          admin.adminAccess as StoredAdminAccess,
          s,
          admin.email.toLowerCase() === PRIMARY_ADMIN_EMAIL,
        ),
      ],
    ),
  );
  const items: { target: string; title: string; url: string }[] = [];
  const pages = (
    await pool.query(
      "SELECT path,title FROM cms_pages WHERE status<>'archived' ORDER BY path LIMIT 500",
    )
  ).rows;
  if (capabilities.primary)
    items.push(
      ...pages.map((p) => ({
        target: `page:${p.path}`,
        title: p.title,
        url: p.path,
      })),
      ...['homepage', 'navigation', 'directory'].map((target) => ({
        target,
        title:
          target === 'homepage'
            ? 'Teks, tombol & foto Beranda'
            : target === 'navigation'
              ? 'Menu navigasi'
              : 'Media sosial & kontak',
        url: target === 'directory' ? '/tentang/kontak' : '/',
      })),
    );
  if (capabilities.content && !capabilities.primary)
    items.push(
      ...pages.map((p) => ({
        target: `content:${p.path}`,
        title: `Bagian resmi: ${p.title}`,
        url: p.path,
      })),
    );
  if (capabilities.media && !capabilities.primary)
    items.push(
      ...pages.map((p) => ({
        target: `media:${p.path}`,
        title: `Kliping: ${p.title}`,
        url: p.path,
      })),
    );
  if (capabilities.media) {
    const results = await Promise.allSettled([
      pool.query(
        'SELECT id,title,slug FROM galleries ORDER BY id DESC LIMIT 500',
      ),
      pool.query('SELECT id,title,slug FROM videos ORDER BY id DESC LIMIT 500'),
    ]);
    for (const [n, result] of results.entries()) {
      if (result.status !== 'fulfilled') throw result.reason;
      items.push(
        ...result.value.rows.map((row) => ({
          target: `${n === 0 ? 'gallery' : 'video'}:${row.id}`,
          title: row.title,
          url: `/media/${n === 0 ? 'galeri' : 'video'}/${row.slug}`,
        })),
      );
    }
  }
  if (capabilities.content)
    items.push(
      ...(
        await pool.query(
          'SELECT id,title,slug,type,karya_category FROM posts ORDER BY id DESC LIMIT 500',
        )
      ).rows.map((p) => ({
        target: `${p.type === 'announcement' ? 'announcement' : 'post'}:${p.id}`,
        title: p.title,
        url: postPath(p),
      })),
    );
  if (capabilities.admissions)
    items.push({
      target: 'admissions',
      title: 'Formulir pendaftaran santri',
      url: '/tentang/pendaftaran',
    });
  if (capabilities.commerce)
    items.push(
      {
        target: 'commerce',
        title: 'WhatsApp & QRIS koperasi',
        url: '/koperasi',
      },
      ...(
        await pool.query(
          'SELECT id,name,slug,product_type FROM products ORDER BY id DESC LIMIT 500',
        )
      ).rows.map((p) => ({
        target: `product:${p.id}`,
        title: p.name,
        url: `/koperasi/${p.product_type === 'ebook' ? 'ebook' : 'buku'}/${p.slug}`,
      })),
    );
  return NextResponse.json({ items, capabilities }, { headers });
}
const schema = z.object({
  target: z.string().refine((t) => Boolean(qualityScope(t))),
  version: z.enum(['draft', 'published']).default('draft'),
  data: publicationSchema.optional(),
});
export async function POST(request: NextRequest) {
  if (!sameOrigin(request))
    return NextResponse.json(
      { error: 'Asal tidak valid' },
      { status: 403, headers },
    );
  const body = schema.safeParse(await request.json().catch(() => null));
  if (!body.success)
    return NextResponse.json(
      { error: 'Target atau data tidak valid' },
      { status: 400, headers },
    );
  const { target, version, data } = body.data;
  const admin = await requireAdminAccess(request, qualityScope(target)!);
  if (!admin)
    return NextResponse.json(
      { error: 'Tidak diizinkan' },
      { status: 403, headers },
    );
  if (data && (publicationTarget(data) !== target || version !== 'draft'))
    return NextResponse.json(
      { error: 'Isi tidak sesuai target draf' },
      { status: 400, headers },
    );
  if (inFlight.has(admin.id))
    return NextResponse.json(
      { error: 'Pemeriksaan sebelumnya masih berjalan' },
      { status: 429, headers },
    );
  if (inFlight.size >= 20)
    return NextResponse.json(
      { error: 'Pemeriksa sedang sibuk. Coba lagi.' },
      { status: 429, headers },
    );
  inFlight.add(admin.id);
  try {
    const snapshot = await loadQualitySnapshot(target, version, data);
    const report = await checkQuality(snapshot, version);
    await pool.query(
      'INSERT INTO quality_reports(target,version,snapshot_hash,report,checked_by) VALUES($1,$2,$3,$4::jsonb,$5) ON CONFLICT(target,version) DO UPDATE SET snapshot_hash=$3,report=$4::jsonb,checked_by=$5,checked_at=now()',
      [target, version, report.snapshotHash, JSON.stringify(report), admin.id],
    );
    return NextResponse.json({ report }, { headers });
  } catch {
    return NextResponse.json(
      { error: 'Pemeriksaan belum selesai. Data dan terbitan tidak berubah.' },
      { status: 400, headers },
    );
  } finally {
    inFlight.delete(admin.id);
  }
}
