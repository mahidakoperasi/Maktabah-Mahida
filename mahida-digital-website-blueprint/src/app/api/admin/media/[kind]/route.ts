import { NextRequest, NextResponse } from 'next/server';
import { and, asc, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { galleries, galleryImages, videos } from '@/db/schema';
import { getAdminUser } from '@/lib/admin-auth';
import { driveIdFromUrl, youtubeIdFromUrl } from '@/lib/media-links';
import { slugify } from '@/lib/utils';

const schema = z.object({
  id: z.number().int().positive().optional(), title: z.string().trim().min(1).max(500),
  description: z.string().trim().max(5000).default(''),
  url: z.string().trim().max(2048).default(''),
  images: z.array(z.object({ url: z.string().trim().max(2048), caption: z.string().trim().max(500).default('') })).max(40).default([]),
  status: z.enum(['draft','published']).default('draft'),
});
type Context = { params: Promise<{ kind: string }> };
async function kindOf(request: NextRequest, context: Context) {
  if (!await getAdminUser(request)) return null;
  const { kind } = await context.params;
  return kind === 'video' || kind === 'galeri' ? kind : null;
}
export async function GET(request: NextRequest, context: Context) {
  const kind = await kindOf(request, context);
  if (!kind) return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  if (kind === 'video') {
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
  const videoId = kind === 'video' ? youtubeIdFromUrl(url) : null;
  if (kind === 'video' && !videoId) return NextResponse.json({ error: 'Tautan YouTube tidak valid' }, { status: 400 });
  if (kind === 'galeri' && images.some((image) => !driveIdFromUrl(image.url))) return NextResponse.json({ error: 'Foto harus memakai tautan berkas Google Drive' }, { status: 400 });
  try {
    const table = kind === 'video' ? videos : galleries;
    const base = slugify(title) || 'media';
    let slug = base;
    for (let n = 2; n < 1000; n++) {
      const [existing] = await db.select({ id: table.id }).from(table).where(eq(table.slug, slug)).limit(1);
      if (!existing || existing.id === id) break;
      slug = `${base}-${n}`;
    }
    if (kind === 'video') {
      const values = { title, slug, description, youtubeId: videoId!, status };
      const [item] = edit && id ? await db.update(videos).set(values).where(eq(videos.id, id)).returning() : await db.insert(videos).values(values).returning();
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
  const deleted = kind === 'video' ? await db.delete(videos).where(eq(videos.id, id)).returning() : await db.delete(galleries).where(eq(galleries.id, id)).returning();
  return NextResponse.json({ ok: deleted.length > 0 });
}
