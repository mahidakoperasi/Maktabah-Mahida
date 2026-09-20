import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { videos } from '@/db/schema';
import { getAdminUser } from '@/lib/admin-auth';
import { defaultYouTubeThumbnail, extractYouTubeId, makeUniqueSlug, normalizeHttpUrl } from '@/lib/media-utils';

function parseId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser(request);
  if (!admin) return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  const { id: rawId } = await context.params;
  const id = parseId(rawId);
  if (!id) return NextResponse.json({ error: 'ID video tidak valid' }, { status: 400 });
  const [video] = await db.select().from(videos).where(eq(videos.id, id)).limit(1);
  return video
    ? NextResponse.json({ video })
    : NextResponse.json({ error: 'Video tidak ditemukan' }, { status: 404 });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser(request);
  if (!admin) return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  const { id: rawId } = await context.params;
  const id = parseId(rawId);
  if (!id) return NextResponse.json({ error: 'ID video tidak valid' }, { status: 400 });

  const [existing] = await db.select().from(videos).where(eq(videos.id, id)).limit(1);
  if (!existing) return NextResponse.json({ error: 'Video tidak ditemukan' }, { status: 404 });

  try {
    const body = await request.json();
    const title = String(body.title ?? existing.title).trim();
    const videoId = extractYouTubeId(String(body.youtubeUrl ?? body.videoId ?? existing.videoId));
    if (!title || !videoId) {
      return NextResponse.json({ error: 'Judul dan URL YouTube wajib valid' }, { status: 400 });
    }

    const customThumbnail = String(body.thumbnailUrl ?? '').trim();
    const thumbnailUrl = customThumbnail ? normalizeHttpUrl(customThumbnail) : defaultYouTubeThumbnail(videoId);
    if (customThumbnail && !thumbnailUrl) {
      return NextResponse.json({ error: 'URL thumbnail tidak valid' }, { status: 400 });
    }

    const slug = await makeUniqueSlug(title, 'video', async (candidate) => {
      const [row] = await db
        .select({ id: videos.id })
        .from(videos)
        .where(eq(videos.slug, candidate))
        .limit(1);
      return Boolean(row && row.id !== id);
    });
    const status = body.status === 'published' ? 'published' : 'draft';

    const [video] = await db.update(videos).set({
      title,
      slug,
      videoId,
      description: String(body.description ?? '').trim() || null,
      thumbnailUrl,
      featured: Boolean(body.featured),
      status,
      publishedAt: status === 'published' ? existing.publishedAt ?? new Date() : existing.publishedAt,
    }).where(eq(videos.id, id)).returning();

    return NextResponse.json({ video });
  } catch (error) {
    console.error('Update YouTube video error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui video' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser(request);
  if (!admin) return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  const { id: rawId } = await context.params;
  const id = parseId(rawId);
  if (!id) return NextResponse.json({ error: 'ID video tidak valid' }, { status: 400 });
  const deleted = await db.delete(videos).where(eq(videos.id, id)).returning({ id: videos.id });
  return deleted.length
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: 'Video tidak ditemukan' }, { status: 404 });
}
