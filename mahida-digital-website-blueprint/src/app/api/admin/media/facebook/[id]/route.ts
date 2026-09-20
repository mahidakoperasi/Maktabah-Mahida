import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
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

function parseId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser(request);
  if (!admin) return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  const { id: rawId } = await context.params;
  const id = parseId(rawId);
  if (!id) return NextResponse.json({ error: 'ID postingan tidak valid' }, { status: 400 });
  const [post] = await db.select().from(socialPosts).where(eq(socialPosts.id, id)).limit(1);
  return post && post.platform === 'facebook'
    ? NextResponse.json({ post })
    : NextResponse.json({ error: 'Postingan tidak ditemukan' }, { status: 404 });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser(request);
  if (!admin) return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  const { id: rawId } = await context.params;
  const id = parseId(rawId);
  if (!id) return NextResponse.json({ error: 'ID postingan tidak valid' }, { status: 400 });
  const [existing] = await db.select().from(socialPosts).where(eq(socialPosts.id, id)).limit(1);
  if (!existing || existing.platform !== 'facebook') {
    return NextResponse.json({ error: 'Postingan tidak ditemukan' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const postUrl = facebookUrl(body.postUrl ?? existing.postUrl);
    const caption = String(body.caption ?? existing.caption ?? '').trim();
    const rawImage = String(body.imageUrl ?? '').trim();
    const imageUrl = rawImage ? normalizeHttpUrl(rawImage) : null;
    if (!postUrl || !caption) {
      return NextResponse.json({ error: 'URL Facebook dan caption wajib valid' }, { status: 400 });
    }
    if (rawImage && !imageUrl) return NextResponse.json({ error: 'URL gambar tidak valid' }, { status: 400 });
    const status = body.status === 'published' ? 'published' : 'draft';

    const [post] = await db.update(socialPosts).set({
      postUrl,
      caption,
      imageUrl,
      featured: Boolean(body.featured),
      status,
      publishedAt: status === 'published' ? existing.publishedAt ?? new Date() : existing.publishedAt,
    }).where(eq(socialPosts.id, id)).returning();
    return NextResponse.json({ post });
  } catch (error) {
    console.error('Update Facebook post error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui postingan Facebook' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser(request);
  if (!admin) return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  const { id: rawId } = await context.params;
  const id = parseId(rawId);
  if (!id) return NextResponse.json({ error: 'ID postingan tidak valid' }, { status: 400 });
  const deleted = await db.delete(socialPosts).where(eq(socialPosts.id, id)).returning({ id: socialPosts.id });
  return deleted.length
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: 'Postingan tidak ditemukan' }, { status: 404 });
}
