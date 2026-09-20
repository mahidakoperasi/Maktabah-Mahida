import { NextRequest, NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { videos } from '@/db/schema';
import { getAdminUser } from '@/lib/admin-auth';
import { defaultYouTubeThumbnail, extractYouTubeId, makeUniqueSlug, normalizeHttpUrl } from '@/lib/media-utils';

export async function GET(request: NextRequest) {
  const admin = await getAdminUser(request);
  if (!admin) return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });

  const rows = await db.select().from(videos).orderBy(desc(videos.createdAt));
  return NextResponse.json({ videos: rows });
}

export async function POST(request: NextRequest) {
  const admin = await getAdminUser(request);
  if (!admin) return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });

  try {
    const body = await request.json();
    const title = String(body.title ?? '').trim();
    const videoId = extractYouTubeId(String(body.youtubeUrl ?? body.videoId ?? ''));
    if (!title) return NextResponse.json({ error: 'Judul video wajib diisi' }, { status: 400 });
    if (!videoId) return NextResponse.json({ error: 'URL atau ID YouTube tidak valid' }, { status: 400 });

    const customThumbnail = String(body.thumbnailUrl ?? '').trim();
    const thumbnailUrl = customThumbnail ? normalizeHttpUrl(customThumbnail) : defaultYouTubeThumbnail(videoId);
    if (customThumbnail && !thumbnailUrl) {
      return NextResponse.json({ error: 'URL thumbnail tidak valid' }, { status: 400 });
    }

    const slug = await makeUniqueSlug(title, 'video', async (candidate) => {
      const [row] = await db.select({ id: videos.id }).from(videos).where(eq(videos.slug, candidate)).limit(1);
      return Boolean(row);
    });
    const status = body.status === 'published' ? 'published' : 'draft';
    const now = new Date();

    const [video] = await db.insert(videos).values({
      title,
      slug,
      videoId,
      platform: 'youtube',
      description: String(body.description ?? '').trim() || null,
      thumbnailUrl,
      featured: Boolean(body.featured),
      status,
      publishedAt: status === 'published' ? now : null,
    }).returning();

    return NextResponse.json({ video }, { status: 201 });
  } catch (error) {
    console.error('Create YouTube video error:', error);
    return NextResponse.json({ error: 'Gagal menyimpan video' }, { status: 500 });
  }
}
