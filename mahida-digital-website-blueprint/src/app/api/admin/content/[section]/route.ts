import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { posts } from '@/db/schema';
import { getAdminUser } from '@/lib/admin-auth';
import { contentSections, isContentSection } from '@/lib/content-sections';
import { calculateReadingTime, slugify } from '@/lib/utils';
import { driveIdFromUrl } from '@/lib/media-links';

const schema = z.object({
  id: z.number().int().positive().optional(),
  title: z.string().trim().min(1).max(500),
  excerpt: z.string().trim().max(2000).default(''),
  content: z.string().trim().min(1).max(1000000),
  featuredImage: z.string().trim().max(2048).default(''),
  status: z.enum(['draft','published']).default('draft'),
});

async function guard(request: NextRequest, context: { params: Promise<{ section: string }> }) {
  if (!await getAdminUser(request)) return null;
  const { section } = await context.params;
  return isContentSection(section) ? { section, config: contentSections[section] } : null;
}

export async function GET(request: NextRequest, context: { params: Promise<{ section: string }> }) {
  const target = await guard(request, context);
  if (!target) return NextResponse.json({ error: 'Tidak diizinkan atau modul tidak dikenal' }, { status: 403 });
  const conditions = [eq(posts.type, target.config.type)];
  if (target.config.category) conditions.push(eq(posts.karyaCategory, target.config.category));
  const items = await db.select({
    id: posts.id, title: posts.title, slug: posts.slug, excerpt: posts.excerpt,
    content: posts.contentRaw, status: posts.status, featuredImage: posts.featuredImage,
  }).from(posts).where(and(...conditions)).orderBy(desc(posts.updatedAt));
  return NextResponse.json({ items });
}

async function save(request: NextRequest, context: { params: Promise<{ section: string }> }, edit: boolean) {
  const target = await guard(request, context);
  if (!target) return NextResponse.json({ error: 'Tidak diizinkan atau modul tidak dikenal' }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || (edit && !parsed.data?.id)) return NextResponse.json({ error: 'Data konten tidak valid' }, { status: 400 });
  const { id, title, excerpt, content, featuredImage, status } = parsed.data;
  if (featuredImage && !driveIdFromUrl(featuredImage)) return NextResponse.json({ error: 'Foto utama harus berupa tautan Google Drive' }, { status: 400 });
  const conditions = [eq(posts.type, target.config.type)];
  if (target.config.category) conditions.push(eq(posts.karyaCategory, target.config.category));
  if (edit && id) {
    const [existing] = await db.select().from(posts).where(and(eq(posts.id, id), ...conditions)).limit(1);
    if (!existing) return NextResponse.json({ error: 'Konten tidak ditemukan dalam modul ini' }, { status: 404 });
  }
  try {
    const now = new Date();
    const slugBase = slugify(title) || 'tulisan';
    let slug = slugBase;
    for (let suffix = 2; suffix < 1000; suffix++) {
      const [match] = await db.select({ id: posts.id }).from(posts).where(eq(posts.slug, slug)).limit(1);
      if (!match || match.id === id) break;
      slug = `${slugBase}-${suffix}`;
    }
    const values = {
      title, slug, excerpt: excerpt || null, content, contentRaw: content,
      featuredImage: featuredImage || null, status, readingTime: calculateReadingTime(content),
      publishedAt: status === 'published' ? now : null,
      updatedAt: now,
    };
    if (edit && id) {
      const [item] = await db.update(posts).set(values).where(and(eq(posts.id, id), ...conditions)).returning();
      return NextResponse.json({ item });
    }
    const admin = await getAdminUser(request);
    const [item] = await db.insert(posts).values({
      ...values, type: target.config.type, karyaCategory: target.config.category,
      createdBy: admin!.id,
    }).returning();
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error('Content save:', error);
    return NextResponse.json({ error: 'Gagal menyimpan. Periksa judul dan gambar.' }, { status: 409 });
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ section: string }> }) { return save(request, context, false); }
export async function PATCH(request: NextRequest, context: { params: Promise<{ section: string }> }) { return save(request, context, true); }

export async function DELETE(request: NextRequest, context: { params: Promise<{ section: string }> }) {
  const target = await guard(request, context);
  if (!target) return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  const parsed = z.object({ id: z.number().int().positive() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
  const conditions = [eq(posts.id, parsed.data.id), eq(posts.type, target.config.type)];
  if (target.config.category) conditions.push(eq(posts.karyaCategory, target.config.category));
  const rows = await db.delete(posts).where(and(...conditions)).returning({ id: posts.id });
  return NextResponse.json({ ok: rows.length > 0 });
}
