import { NextRequest, NextResponse } from 'next/server';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { galleries, galleryImages } from '@/db/schema';
import { getAdminUser } from '@/lib/admin-auth';
import { makeUniqueSlug, normalizeHttpUrl } from '@/lib/media-utils';

type ImageInput = { imageUrl?: unknown; caption?: unknown };

function parseId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function parseImages(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 100).map((item: ImageInput, index) => ({
    imageUrl: normalizeHttpUrl(item?.imageUrl),
    caption: String(item?.caption ?? '').trim() || null,
    sortOrder: index,
  }));
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser(request);
  if (!admin) return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  const { id: rawId } = await context.params;
  const id = parseId(rawId);
  if (!id) return NextResponse.json({ error: 'ID galeri tidak valid' }, { status: 400 });

  const [gallery] = await db.select().from(galleries).where(eq(galleries.id, id)).limit(1);
  if (!gallery || gallery.type !== 'album') {
    return NextResponse.json({ error: 'Galeri tidak ditemukan' }, { status: 404 });
  }
  const images = await db.select().from(galleryImages).where(eq(galleryImages.galleryId, id)).orderBy(asc(galleryImages.sortOrder));
  return NextResponse.json({ gallery: { ...gallery, images } });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser(request);
  if (!admin) return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  const { id: rawId } = await context.params;
  const id = parseId(rawId);
  if (!id) return NextResponse.json({ error: 'ID galeri tidak valid' }, { status: 400 });
  const [existing] = await db.select().from(galleries).where(eq(galleries.id, id)).limit(1);
  if (!existing || existing.type !== 'album') {
    return NextResponse.json({ error: 'Galeri tidak ditemukan' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const title = String(body.title ?? existing.title).trim();
    const rawCover = String(body.coverImage ?? '').trim();
    const coverImage = rawCover ? normalizeHttpUrl(rawCover) : null;
    const images = parseImages(body.images);
    if (!title) return NextResponse.json({ error: 'Judul galeri wajib diisi' }, { status: 400 });
    if (rawCover && !coverImage) return NextResponse.json({ error: 'URL sampul tidak valid' }, { status: 400 });
    if (images.some((image) => !image.imageUrl)) {
      return NextResponse.json({ error: 'Salah satu URL foto tidak valid' }, { status: 400 });
    }
    if (!coverImage && images.length === 0) {
      return NextResponse.json({ error: 'Tambahkan minimal satu foto atau sampul galeri' }, { status: 400 });
    }

    const slug = await makeUniqueSlug(title, 'galeri', async (candidate) => {
      const [row] = await db.select({ id: galleries.id }).from(galleries).where(eq(galleries.slug, candidate)).limit(1);
      return Boolean(row && row.id !== id);
    });
    const status = body.status === 'published' ? 'published' : 'draft';

    const gallery = await db.transaction(async (tx) => {
      const [updated] = await tx.update(galleries).set({
        title,
        slug,
        description: String(body.description ?? '').trim() || null,
        coverImage: coverImage || images[0]?.imageUrl || null,
        status,
      }).where(eq(galleries.id, id)).returning();

      await tx.delete(galleryImages).where(eq(galleryImages.galleryId, id));
      if (images.length) {
        await tx.insert(galleryImages).values(images.map((image) => ({
          galleryId: id,
          imageUrl: image.imageUrl!,
          caption: image.caption,
          sortOrder: image.sortOrder,
        })));
      }
      return updated;
    });
    return NextResponse.json({ gallery });
  } catch (error) {
    console.error('Update gallery error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui galeri' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser(request);
  if (!admin) return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  const { id: rawId } = await context.params;
  const id = parseId(rawId);
  if (!id) return NextResponse.json({ error: 'ID galeri tidak valid' }, { status: 400 });
  const deleted = await db.delete(galleries).where(eq(galleries.id, id)).returning({ id: galleries.id });
  return deleted.length
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: 'Galeri tidak ditemukan' }, { status: 404 });
}
