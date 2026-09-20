import { NextRequest, NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { socialPosts } from '@/db/schema';
import { getAdminUser } from '@/lib/admin-auth';
import { normalizeHttpUrl } from '@/lib/media-utils';

function facebookUrl(value: unknown) {
  const normalized = normalizeHttpUrl(value);
  if (!normalized) return null;
  const host = new URL(normalized).hostname.replace(/^www\./, '');
  return host === 'facebook.com' || host.endsWith('.facebook.com') || host === 'fb.watch' ? normalized : null;
}

export async function GET(request: NextRequest) {
  const admin = await getAdminUser(request);
  if (!admin) return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  const rows = await db
    .select()
    .from(socialPosts)
    .where(eq(socialPosts.platform, 'facebook'))
    .orderBy(desc(socialPosts.publishedAt), desc(socialPosts.createdAt));
  return NextResponse.json({ posts: rows });
}

export async function POST(request: NextRequest) {
  const admin = await getAdminUser(request);
  if (!admin) return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });

  try {
    const body = await request.json();
    const postUrl = facebookUrl(body.postUrl);
    const caption = String(body.caption ?? '').trim();
    const rawImage = String(body.imageUrl ?? '').trim();
    const imageUrl = rawImage ? normalizeHttpUrl(rawImage) : null;
    if (!postUrl) return NextResponse.json({ error: 'URL postingan Facebook tidak valid' }, { status: 400 });
    if (!caption) return NextResponse.json({ error: 'Caption wajib diisi' }, { status: 400 });
    if (rawImage && !imageUrl) return NextResponse.json({ error: 'URL gambar tidak valid' }, { status: 400 });

    const status = body.status === 'published' ? 'published' : 'draft';
    const [post] = await db.insert(socialPosts).values({
      platform: 'facebook',
      postUrl,
      caption,
      imageUrl,
      featured: Boolean(body.featured),
      status,
      publishedAt: status === 'published' ? new Date() : null,
    }).returning();
    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error('Create Facebook post error:', error);
    return NextResponse.json({ error: 'Gagal menyimpan postingan Facebook' }, { status: 500 });
  }
}
