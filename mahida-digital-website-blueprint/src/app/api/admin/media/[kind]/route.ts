import { NextRequest, NextResponse } from 'next/server';
import { and, asc, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { galleries, galleryImages, videos } from '@/db/schema';
import { requireAdminAccess } from '@/lib/admin-auth';
import { logActivity } from '@/lib/activity-log';
import { saveRevision } from '@/lib/revision-log';
import { driveIdFromUrl, youtubeIdFromUrl } from '@/lib/media-links';
import { slugify } from '@/lib/utils';

const schema = z.object({
  id: z.number().int().positive().optional(), title: z.string().trim().min(1).max(500),
  description: z.string().trim().max(5000).default(''),
  url: z.string().trim().max(2048).default(''),
  images: z.array(z.object({ url: z.string().trim().max(2048), caption: z.string().trim().max(500).default('') })).max(40).default([]),
  status: z.enum(['draft','published','archived']).default('draft'),
});
type Context = { params: Promise<{ kind: string }> };
async function kindOf(request: NextRequest, context: Context) {
  const admin = await requireAdminAccess(request, 'media');
  if (!admin) return null;
  const { kind } = await context.params;
  return kind === 'video' || kind === 'galeri' ? { kind, admin } : null;
}
export async function GET(request: NextRequest, context: Context) {
  const kind = await kindOf(request, context);
  if (!kind) return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  if (kind.kind === 'video') {
    const items = await db.select().from(videos).orderBy(asc(videos.sortOrder), desc(videos.createdAt));
    return NextResponse.json({ items });
  }
  const rows = await db.select().from(galleries).orderBy(desc(galleries.createdAt));
  const images = await db.select().from(galleryImages).orderBy(asc(galleryImages.sortOrder));
  return NextResponse.json({ items: rows.map((row) => ({ ...row, images: images.filter((image) => image.galleryId === row.id) })) });
}
async function save(request: NextRequest, context: Context, edit: boolean) {
  const kind = await kindOf(request, context);
  if (!kind) return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || (edit && !parsed.data?.id)) return NextResponse.json({ error: 'Data media tidak valid' }, { status: 400 });
  const { id, title, description, url, images, status } = parsed.data;
  const videoId = kind.kind === 'video' ? youtubeIdFromUrl(url) : null;
  if (kind.kind === 'video' && !videoId) return NextResponse.json({ error: 'Tautan YouTube tidak valid' }, { status: 400 });
  if (kind.kind === 'galeri' && images.some((image) => !driveIdFromUrl(image.url))) return NextResponse.json({ error: 'Foto harus memakai tautan berkas Google Drive' }, { status: 400 });
  try {
    const table = kind.kind === 'video' ? videos : galleries;
    const base = slugify(title) || 'media';
    let slug = base;
    for (let n = 2; n < 1000; n++) {
      const [existing] = await db.select({ id: table.id }).from(table).where(eq(table.slug, slug)).limit(1);
      if (!existing || existing.id === id) break;
      slug = `${base}-${n}`;
    }
    if (kind.kind === 'video') {
      const values = { title, slug, description, youtubeId: videoId!, status };
      const [item] = edit && id ? await db.update(videos).set(values).where(eq(videos.id, id)).returning() : await db.insert(videos).values(values).returning();
      await saveRevision({ entityType: 'video', entityId: item.id, data: item, note: edit ? 'Video diperbarui' : 'Video dibuat', actorId: kind.admin.id });
      await logActivity({ actorId: kind.admin.id, action: status === 'published' ? 'published' : edit ? 'updated' : 'created', targetType: 'video', targetId: item.id, summary: `${edit ? 'Memperbarui' : 'Membuat'} video: ${item.title}` });
      return NextResponse.json({ item }, { status: edit ? 200 : 201 });
    }
    const item = await db.transaction(async (tx) => {
      const values = { title, slug, description, status };
      const [row] = edit && id ? await tx.update(galleries).set(values).where(eq(galleries.id, id)).returning() : await tx.insert(galleries).values(values).returning();
      if (!row) throw new Error('Galeri tidak ditemukan');
      await tx.delete(galleryImages).where(eq(galleryImages.galleryId, row.id));
      if (images.length) await tx.insert(galleryImages).values(images.map((image, index) => ({ galleryId: row.id, imageUrl: image.url, caption: image.caption, sortOrder: index })));
      return row;
    });
    await saveRevision({ entityType: 'gallery', entityId: item.id, data: { ...item, images }, note: edit ? 'Galeri diperbarui' : 'Galeri dibuat', actorId: kind.admin.id });
    await logActivity({ actorId: kind.admin.id, action: status === 'published' ? 'published' : edit ? 'updated' : 'created', targetType: 'gallery', targetId: item.id, summary: `${edit ? 'Memperbarui' : 'Membuat'} galeri: ${item.title}` });
    return NextResponse.json({ item }, { status: edit ? 200 : 201 });
  } catch (error) {
    console.error('Media save:', error);
    return NextResponse.json({ error: 'Gagal menyimpan media' }, { status: 409 });
  }
}
export async function POST(request: NextRequest, context: Context) { return save(request, context, false); }
export async function PATCH(request: NextRequest, context: Context) { return save(request, context, true); }
export async function DELETE(request: NextRequest, context: Context) {
  const kind = await kindOf(request, context);
  if (!kind) return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  const parsed = z.object({ id: z.number().int().positive() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
  const { id } = parsed.data;
  const archived = kind.kind === 'video'
    ? await db.update(videos).set({ status: 'archived', updatedAt: new Date() }).where(eq(videos.id, id)).returning()
    : await db.update(galleries).set({ status: 'archived', updatedAt: new Date() }).where(eq(galleries.id, id)).returning();
  if (archived[0]) await logActivity({ actorId: kind.admin.id, action: 'archived', targetType: kind.kind, targetId: id, summary: `Mengarsipkan ${kind.kind === 'video' ? 'video' : 'galeri'}: ${archived[0].title}` });
  return NextResponse.json({ ok: archived.length > 0 });
}
