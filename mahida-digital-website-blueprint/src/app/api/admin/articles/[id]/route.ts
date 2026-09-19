import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { posts } from '@/db/schema';
import { getAdminUser } from '@/lib/admin-auth';
import { calculateReadingTime, slugify } from '@/lib/utils';

async function uniqueSlug(title: string, currentId: number) {
  const base = slugify(title) || 'artikel';
  let candidate = base;
  let suffix = 2;

  while (true) {
    const [existing] = await db
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.slug, candidate))
      .limit(1);

    if (!existing || existing.id === currentId) return candidate;
    candidate = `${base}-${suffix++}`;
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser(request);
  if (!admin) return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });

  const { id } = await context.params;
  const articleId = Number(id);
  if (!Number.isInteger(articleId)) {
    return NextResponse.json({ error: 'ID artikel tidak valid' }, { status: 400 });
  }

  const [article] = await db
    .select()
    .from(posts)
    .where(eq(posts.id, articleId))
    .limit(1);

  if (!article || article.type !== 'article') {
    return NextResponse.json({ error: 'Artikel tidak ditemukan' }, { status: 404 });
  }

  return NextResponse.json({ article });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser(request);
  if (!admin) return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });

  const { id } = await context.params;
  const articleId = Number(id);
  if (!Number.isInteger(articleId)) {
    return NextResponse.json({ error: 'ID artikel tidak valid' }, { status: 400 });
  }

  const [existing] = await db
    .select()
    .from(posts)
    .where(eq(posts.id, articleId))
    .limit(1);

  if (!existing || existing.type !== 'article') {
    return NextResponse.json({ error: 'Artikel tidak ditemukan' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const title = String(body.title ?? existing.title).trim();
    const excerpt = String(body.excerpt ?? existing.excerpt ?? '').trim();
    const contentRaw = String(body.content ?? existing.contentRaw ?? existing.content ?? '').trim();

    if (!title || !contentRaw) {
      return NextResponse.json(
        { error: 'Judul dan isi artikel wajib diisi' },
        { status: 400 }
      );
    }

    const requestedStatus = String(body.status ?? existing.status);
    const status =
      requestedStatus === 'published'
        ? 'published'
        : requestedStatus === 'archived'
          ? 'archived'
          : 'draft';

    const slug = await uniqueSlug(title, articleId);
    const now = new Date();

    const [article] = await db
      .update(posts)
      .set({
        title,
        slug,
        excerpt: excerpt || null,
        content: contentRaw,
        contentRaw,
        status,
        publishedAt:
          status === 'published'
            ? existing.publishedAt ?? now
            : existing.publishedAt,
        readingTime: calculateReadingTime(contentRaw),
        metaTitle: String(body.metaTitle ?? existing.metaTitle ?? '').trim() || null,
        metaDescription:
          String(body.metaDescription ?? existing.metaDescription ?? '').trim() || null,
        featuredImage:
          String(body.featuredImage ?? existing.featuredImage ?? '').trim() || null,
        updatedAt: now,
      })
      .where(eq(posts.id, articleId))
      .returning();

    return NextResponse.json({ article });
  } catch (error) {
    console.error('Update article error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui artikel' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser(request);
  if (!admin) return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });

  const { id } = await context.params;
  const articleId = Number(id);
  if (!Number.isInteger(articleId)) {
    return NextResponse.json({ error: 'ID artikel tidak valid' }, { status: 400 });
  }

  const deleted = await db
    .delete(posts)
    .where(eq(posts.id, articleId))
    .returning({ id: posts.id });

  if (!deleted.length) {
    return NextResponse.json({ error: 'Artikel tidak ditemukan' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
