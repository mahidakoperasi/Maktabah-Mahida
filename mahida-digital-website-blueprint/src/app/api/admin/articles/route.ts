import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq, ilike, or } from 'drizzle-orm';
import { db } from '@/db';
import { posts } from '@/db/schema';
import { requireAdminAccess } from '@/lib/admin-auth';
import { logActivity } from '@/lib/activity-log';
import { saveRevision } from '@/lib/revision-log';
import { createArticleInput } from '@/lib/article-input';
import { calculateReadingTime, slugify } from '@/lib/utils';
import { invalidDriveImages, invalidVideoMarkers } from '@/lib/rich-markers';
import { validAuthorId } from '@/lib/author';

async function uniqueSlug(title: string, currentId?: number) {
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

export async function GET(request: NextRequest) {
  const admin = await requireAdminAccess(request, 'content');
  if (!admin) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get('q')?.trim() ?? '';
  const status = searchParams.get('status')?.trim() ?? '';

  const conditions = [eq(posts.type, 'article')];

  if (status === 'draft' || status === 'published' || status === 'scheduled' || status === 'archived') {
    conditions.push(eq(posts.status, status));
  }

  if (q) {
    const searchCondition = or(
      ilike(posts.title, `%${q}%`),
      ilike(posts.slug, `%${q}%`),
      ilike(posts.excerpt, `%${q}%`)
    );
    if (searchCondition) conditions.push(searchCondition);
  }

  const rows = await db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      excerpt: posts.excerpt,
      status: posts.status,
      publishedAt: posts.publishedAt,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      viewCount: posts.viewCount,
      readingTime: posts.readingTime,
    })
    .from(posts)
    .where(and(...conditions))
    .orderBy(desc(posts.updatedAt));

  return NextResponse.json({ articles: rows });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdminAccess(request, 'content');
  if (!admin) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    let input: unknown;
    try {
      input = await request.json();
    } catch {
      return NextResponse.json({ error: 'Format JSON tidak valid' }, { status: 400 });
    }

    const parsed = createArticleInput.safeParse(input);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Data artikel tidak valid' }, { status: 400 });
    }
    const body = parsed.data;
    if (!await validAuthorId(body.authorId ?? null)) return NextResponse.json({ error: 'Penulis tidak ditemukan' }, { status: 400 });
    const title = String(body.title ?? '').trim();
    const excerpt = String(body.excerpt ?? '').trim();
    const contentRaw = String(body.content ?? '').trim();
    if (invalidDriveImages(contentRaw)) return NextResponse.json({ error: 'Sisipan gambar harus berupa tautan berkas Google Drive' }, { status: 400 });
    if (invalidVideoMarkers(contentRaw)) return NextResponse.json({ error: 'Gunakan tautan video publik YouTube, Facebook, Instagram, atau TikTok yang valid' }, { status: 400 });
    const requestedStatus = String(body.status ?? 'draft');

    if (!title) {
      return NextResponse.json({ error: 'Judul wajib diisi' }, { status: 400 });
    }

    if (!contentRaw) {
      return NextResponse.json({ error: 'Isi artikel wajib diisi' }, { status: 400 });
    }

    const status = requestedStatus === 'published' ? 'published' : 'draft';
    const slug = await uniqueSlug(title);
    const now = new Date();

    const [article] = await db.insert(posts).values({
      title,
      slug,
      excerpt: excerpt || null,
      content: contentRaw,
      contentRaw,
      type: 'article',
      status,
      createdBy: admin.id,
      authorId: body.authorId ?? null,
      authorClass: body.authorId ? body.authorClass?.trim() || null : null,
      publishedAt: status === 'published' ? now : null,
      readingTime: calculateReadingTime(contentRaw),
      metaTitle: String(body.metaTitle ?? '').trim() || null,
      metaDescription: String(body.metaDescription ?? '').trim() || null,
      featuredImage: String(body.featuredImage ?? '').trim() || null,
      updatedAt: now,
    }).returning();

    await saveRevision({ entityType: 'article', entityId: article.id, data: article, note: status === 'published' ? 'Diterbitkan' : 'Draft dibuat', actorId: admin.id });
    await logActivity({ actorId: admin.id, action: status === 'published' ? 'published' : 'created', targetType: 'article', targetId: article.id, summary: `${status === 'published' ? 'Menerbitkan' : 'Membuat'} artikel: ${article.title}` });
    return NextResponse.json({ article }, { status: 201 });
  } catch (error) {
    console.error('Create article error:', error);
    return NextResponse.json({ error: 'Gagal menyimpan artikel' }, { status: 500 });
  }
}
