import { NextRequest, NextResponse } from 'next/server';
import { desc, eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { galleries, galleryImages } from '@/db/schema';
import { getAdminUser } from '@/lib/admin-auth';
import { makeUniqueSlug, normalizeHttpUrl } from '@/lib/media-utils';

type ImageInput = { imageUrl?: unknown; caption?: unknown };

function parseImages(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 100).map((item: ImageInput, index) => ({
    imageUrl: normalizeHttpUrl(item?.imageUrl),
    caption: String(item?.caption ?? '').trim() || null,
    sortOrder: index,
  }));
}

export async function GET(request: NextRequest) {
  const admin = await getAdminUser(request);
  if (!admin) return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });

  const rows = await db
    .select({
      id: galleries.id,
      title: galleries.title,
      slug: galleries.slug,
      description: galleries.description,
      coverImage: galleries.coverImage,
      status: galleries.status,
      createdAt: galleries.createdAt,
      imageCount: sql<number>`count(${galleryImages.id})::int`,
    })
    .from(galleries)
    .leftJoin(galleryImages, eq(galleryImages.galleryId, galleries.id))
    .where(eq(galleries.type, 'album'))
    .groupBy(galleries.id)
    .orderBy(desc(galleries.createdAt));

  return NextResponse.json({ galleries: rows });
}

export async function POST(request: NextRequest) {
  const admin = await getAdminUser(request);
  if (!admin) return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });

  try {
    const body = await request.json();
    const title = String(body.title ?? '').trim();
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
      return Boolean(row);
    });
    const status = body.status === 'published' ? 'published' : 'draft';

    const gallery = await db.transaction(async (tx) => {
      const [created] = await tx.insert(galleries).values({
        title,
        slug,
        description: String(body.description ?? '').trim() || null,
        type: 'album',
        coverImage: coverImage || images[0]?.imageUrl || null,
        status,
      }).returning();

      if (images.length) {
        await tx.insert(galleryImages).values(images.map((image) => ({
          galleryId: created.id,
          imageUrl: image.imageUrl!,
          caption: image.caption,
          sortOrder: image.sortOrder,
        })));
      }
      return created;
    });

    return NextResponse.json({ gallery }, { status: 201 });
  } catch (error) {
    console.error('Create gallery error:', error);
    return NextResponse.json({ error: 'Gagal menyimpan galeri' }, { status: 500 });
  }
}
