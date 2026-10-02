import { NextRequest, NextResponse } from 'next/server';
import { asc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { authors } from '@/db/schema';
import { requireAdminAccess } from '@/lib/admin-auth';
import { slugify } from '@/lib/utils';
import { publicImageUrl } from '@/lib/media-links';

export async function GET(request: NextRequest) {
  if (!await requireAdminAccess(request, 'content')) return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  const items = await db.select({ id: authors.id, name: authors.name, slug: authors.slug, bio: authors.bio, photo: authors.photo, institution: authors.institution }).from(authors).orderBy(asc(authors.name));
  return NextResponse.json({ authors: items });
}

export async function PATCH(request: NextRequest) {
  if (!await requireAdminAccess(request, 'content')) return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  const parsed = z.object({
    id: z.number().int().positive(), name: z.string().trim().min(2).max(255),
    bio: z.string().trim().max(3000), photo: z.string().trim().max(2048),
    institution: z.string().trim().max(255),
  }).safeParse(await request.json().catch(() => null));
  if (!parsed.success || parsed.data.photo && !publicImageUrl(parsed.data.photo)) {
    return NextResponse.json({ error: 'Periksa data penulis dan URL foto HTTPS.' }, { status: 400 });
  }
  const { id, name, bio, photo, institution } = parsed.data;
  const [author] = await db.update(authors).set({ name, bio: bio || null, photo: photo || null, institution: institution || null })
    .where(eq(authors.id, id)).returning({ id: authors.id, slug: authors.slug });
  return author ? NextResponse.json({ author }) : NextResponse.json({ error: 'Penulis tidak ditemukan' }, { status: 404 });
}

export async function POST(request: NextRequest) {
  if (!await requireAdminAccess(request, 'content')) return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  const parsed = z.object({ name: z.string().trim().min(2).max(255) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Nama penulis tidak valid' }, { status: 400 });
  const name = parsed.data.name;
  const base = slugify(name);
  if (!base) return NextResponse.json({ error: 'Nama harus memuat huruf atau angka Latin' }, { status: 400 });
  let slug = base;
  for (let suffix = 2; suffix < 1000; suffix++) {
    const [match] = await db.select({ id: authors.id, name: authors.name }).from(authors).where(eq(authors.slug, slug)).limit(1);
    if (!match) break;
    if (match.name.toLocaleLowerCase('id-ID') === name.toLocaleLowerCase('id-ID')) {
      return NextResponse.json({ error: 'Penulis sudah tersedia. Pilih dari daftar.' }, { status: 409 });
    }
    slug = `${base}-${suffix}`;
  }
  try {
    const [author] = await db.insert(authors).values({ name, slug }).returning({ id: authors.id, name: authors.name, slug: authors.slug });
    return NextResponse.json({ author }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Gagal membuat penulis. Muat ulang daftar penulis.' }, { status: 409 });
  }
}
