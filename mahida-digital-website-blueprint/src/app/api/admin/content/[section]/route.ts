import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { posts } from '@/db/schema';
import { requireAdminAccess } from '@/lib/admin-auth';
import { logActivity } from '@/lib/activity-log';
import { saveRevision } from '@/lib/revision-log';
import { contentSections, isContentSection } from '@/lib/content-sections';
import { calculateReadingTime, slugify } from '@/lib/utils';
import { driveIdFromUrl } from '@/lib/media-links';
import { invalidDriveImages, invalidVideoMarkers } from '@/lib/rich-markers';
import { checkDriveImages, markerImages } from '@/lib/drive-image-check';
import { validAuthorId } from '@/lib/author';

const schema = z.object({
  id: z.number().int().positive().optional(),
  title: z.string().trim().min(1).max(500),
  excerpt: z.string().trim().max(2000).default(''),
  content: z.string().trim().min(1).max(1000000),
  featuredImage: z.string().trim().max(2048).default(''),
  status: z.enum(['draft','published','archived']).default('draft'),
  authorId: z.number().int().positive().nullable().default(null),
  authorClass: z.string().trim().max(100).default(''),
  revision: z.number().int().min(0).optional(),
});

async function guard(request: NextRequest, context: { params: Promise<{ section: string }> }) {
  const admin = await requireAdminAccess(request, 'content');
  if (!admin) return null;
  const { section } = await context.params;
  return isContentSection(section) ? { section, config: contentSections[section], admin } : null;
}

export async function GET(request: NextRequest, context: { params: Promise<{ section: string }> }) {
  const target = await guard(request, context);
  if (!target) return NextResponse.json({ error: 'Tidak diizinkan atau modul tidak dikenal' }, { status: 403 });
  const conditions = [eq(posts.type, target.config.type)];
  if (target.config.category) conditions.push(eq(posts.karyaCategory, target.config.category));
  const items = await db.select({
    id: posts.id, title: posts.title, slug: posts.slug, excerpt: posts.excerpt,
    content: sql<string>`coalesce(${posts.contentRaw}, ${posts.content}, '')`, status: posts.status, featuredImage: posts.featuredImage,
    authorId: posts.authorId, authorClass: posts.authorClass, revision: posts.revision,
  }).from(posts).where(and(...conditions)).orderBy(desc(posts.updatedAt));
  return NextResponse.json({ items });
}

async function save(request: NextRequest, context: { params: Promise<{ section: string }> }, edit: boolean) {
  const target = await guard(request, context);
  if (!target) return NextResponse.json({ error: 'Tidak diizinkan atau modul tidak dikenal' }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || (edit && !parsed.data?.id)) return NextResponse.json({ error: 'Data konten tidak valid' }, { status: 400 });
  const { id, title, excerpt, content, featuredImage, status, authorId, authorClass, revision } = parsed.data;
  if (!await validAuthorId(authorId)) return NextResponse.json({ error: 'Penulis tidak ditemukan' }, { status: 400 });
  if (featuredImage && !driveIdFromUrl(featuredImage)) return NextResponse.json({ error: 'Foto utama harus berupa tautan Google Drive' }, { status: 400 });
  if (invalidDriveImages(content)) return NextResponse.json({ error: 'Sisipan gambar harus berupa tautan berkas Google Drive' }, { status: 400 });
  if (invalidVideoMarkers(content)) return NextResponse.json({ error: 'Gunakan tautan video publik YouTube, Facebook, Instagram, atau TikTok yang valid' }, { status: 400 });
  if (status === 'published') {
    try { await checkDriveImages([featuredImage, ...markerImages(content)]); }
    catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Periksa foto Drive' }, { status: 400 }); }
  }
  const conditions = [eq(posts.type, target.config.type)];
  if (target.config.category) conditions.push(eq(posts.karyaCategory, target.config.category));
  let existing: typeof posts.$inferSelect | undefined;
  if (edit && id) {
    [existing] = await db.select().from(posts).where(and(eq(posts.id, id), ...conditions)).limit(1);
    if (!existing) return NextResponse.json({ error: 'Konten tidak ditemukan dalam modul ini' }, { status: 404 });
  }
  try {
    const now = new Date();
    const slugBase = slugify(title) || 'tulisan';
    let slug = slugBase;
    for (let suffix = 2; suffix < 1000; suffix++) {
      const [match] = await db.select({ id: posts.id }).from(posts).where(eq(posts.slug, slug)).limit(1);
      if (!match || match.id === id) break;
      slug = `${slugBase}-${suffix}`;
    }
    const values = {
      title, slug, excerpt: excerpt || null, content, contentRaw: content,
      featuredImage: featuredImage || null, status, readingTime: calculateReadingTime(content),
      authorId, authorClass: authorId ? authorClass || null : null,
      publishedAt: status === 'published' ? existing?.publishedAt ?? now : existing?.publishedAt ?? null,
      updatedAt: now, revision: (existing?.revision ?? -1) + 1,
    };
    if (edit && id) {
      if (!existing) return NextResponse.json({ error: 'Konten tidak ditemukan dalam modul ini' }, { status: 404 });
      if (revision !== existing.revision) return NextResponse.json({ error: 'Konten berubah di sesi lain. Muat ulang sebelum menyimpan.' }, { status: 409 });
      const [item] = await db.update(posts).set(values).where(and(eq(posts.id, id), eq(posts.revision, revision), ...conditions)).returning();
      if (!item) return NextResponse.json({ error: 'Konten berubah di sesi lain. Muat ulang sebelum menyimpan.' }, { status: 409 });
      await saveRevision({ entityType: target.section, entityId: item.id, data: item, note: status === 'published' ? 'Terbitan diperbarui' : 'Draft diperbarui', actorId: target.admin.id });
      await logActivity({ actorId: target.admin.id, action: status === 'published' ? 'published' : status === 'archived' ? 'archived' : 'updated', targetType: target.section, targetId: item.id, summary: `Memperbarui ${target.config.label}: ${item.title}` });
      return NextResponse.json({ item });
    }
    const [item] = await db.insert(posts).values({
      ...values, type: target.config.type, karyaCategory: target.config.category,
      createdBy: target.admin.id,
    }).returning();
    await saveRevision({ entityType: target.section, entityId: item.id, data: item, note: status === 'published' ? 'Diterbitkan' : 'Draft dibuat', actorId: target.admin.id });
    await logActivity({ actorId: target.admin.id, action: status === 'published' ? 'published' : 'created', targetType: target.section, targetId: item.id, summary: `${status === 'published' ? 'Menerbitkan' : 'Membuat'} ${target.config.label}: ${item.title}` });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error('Content save:', error);
    return NextResponse.json({ error: 'Gagal menyimpan. Periksa judul dan gambar.' }, { status: 409 });
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ section: string }> }) { return save(request, context, false); }
export async function PATCH(request: NextRequest, context: { params: Promise<{ section: string }> }) { return save(request, context, true); }

export async function DELETE(request: NextRequest, context: { params: Promise<{ section: string }> }) {
  const target = await guard(request, context);
  if (!target) return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  const parsed = z.object({ id: z.number().int().positive() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
  const conditions = [eq(posts.id, parsed.data.id), eq(posts.type, target.config.type)];
  if (target.config.category) conditions.push(eq(posts.karyaCategory, target.config.category));
  const [item] = await db.update(posts).set({ status: 'archived', updatedAt: new Date(), revision: sql`${posts.revision} + 1` })
    .where(and(...conditions)).returning({ id: posts.id });
  if (item) await logActivity({ actorId: target.admin.id, action: 'archived', targetType: target.section, targetId: item.id, summary: `Mengarsipkan ${target.config.label}` });
  return item ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: 'Konten tidak ditemukan' }, { status: 404 });
}
