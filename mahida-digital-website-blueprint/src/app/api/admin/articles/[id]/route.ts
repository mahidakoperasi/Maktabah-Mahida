import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { posts } from '@/db/schema';
import { requireAdminAccess } from '@/lib/admin-auth';
import { logActivity } from '@/lib/activity-log';
import { saveRevision } from '@/lib/revision-log';
import { updateArticleInput } from '@/lib/article-input';
import { calculateReadingTime, slugify } from '@/lib/utils';
import { invalidDriveImages, invalidVideoMarkers } from '@/lib/rich-markers';
import { checkDriveImages, markerImages } from '@/lib/drive-image-check';
import { validAuthorId } from '@/lib/author';

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
  const admin = await requireAdminAccess(request, 'content');
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
  const admin = await requireAdminAccess(request, 'content');
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
    let input: unknown;
    try {
      input = await request.json();
    } catch {
      return NextResponse.json({ error: 'Format JSON tidak valid' }, { status: 400 });
    }

    const parsed = updateArticleInput.safeParse(input);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Data artikel tidak valid' }, { status: 400 });
    }
    const body = parsed.data;
    const authorId = body.authorId === undefined ? existing.authorId : body.authorId;
    if (!await validAuthorId(authorId)) return NextResponse.json({ error: 'Penulis tidak ditemukan' }, { status: 400 });
    const title = String(body.title ?? existing.title).trim();
    const excerpt = String(body.excerpt ?? existing.excerpt ?? '').trim();
    const contentRaw = String(body.content ?? existing.contentRaw ?? existing.content ?? '').trim();
    if (invalidDriveImages(contentRaw)) return NextResponse.json({ error: 'Sisipan gambar harus berupa tautan berkas Google Drive' }, { status: 400 });
    if (invalidVideoMarkers(contentRaw)) return NextResponse.json({ error: 'Gunakan tautan video publik YouTube, Facebook, Instagram, atau TikTok yang valid' }, { status: 400 });

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

    if (status === 'published') {
      try { await checkDriveImages([body.featuredImage ?? existing.featuredImage ?? '', ...markerImages(contentRaw)]); }
      catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Periksa foto Drive' }, { status: 400 }); }
    }
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
        authorId,
        authorClass: authorId ? (body.authorClass ?? existing.authorClass ?? '').trim() || null : null,
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
        revision: existing.revision + 1,
      })
      .where(and(eq(posts.id, articleId), eq(posts.type, 'article'), eq(posts.revision, body.revision)))
      .returning();

    if (!article) {
      return NextResponse.json({ error: 'Artikel berubah di sesi lain. Muat ulang sebelum menyimpan.' }, { status: 409 });
    }
    await saveRevision({ entityType: 'article', entityId: article.id, data: article, note: status === 'published' ? 'Terbitan diperbarui' : 'Draft diperbarui', actorId: admin.id });
    await logActivity({ actorId: admin.id, action: status === 'published' ? 'published' : 'updated', targetType: 'article', targetId: article.id, summary: `${status === 'published' ? 'Memperbarui terbitan' : 'Memperbarui draft'} artikel: ${article.title}` });
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
  const admin = await requireAdminAccess(request, 'content');
  if (!admin) return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });

  const { id } = await context.params;
  const articleId = Number(id);
  if (!Number.isInteger(articleId)) {
    return NextResponse.json({ error: 'ID artikel tidak valid' }, { status: 400 });
  }

  const archived = await db
    .update(posts).set({ status: 'archived', updatedAt: new Date() })
    .where(and(eq(posts.id, articleId), eq(posts.type, 'article')))
    .returning({ id: posts.id });

  if (!archived.length) {
    return NextResponse.json({ error: 'Artikel tidak ditemukan' }, { status: 404 });
  }

  await logActivity({ actorId: admin.id, action: 'archived', targetType: 'article', targetId: articleId, summary: 'Mengarsipkan artikel' });
  return NextResponse.json({ ok: true });
}
