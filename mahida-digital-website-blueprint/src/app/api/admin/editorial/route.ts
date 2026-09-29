import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { cmsPages, settings } from '@/db/schema';
import { getAdminUser } from '@/lib/admin-auth';
import { getEditorialContent } from '@/lib/editorial-content';
import { editableEditorialPath } from '@/lib/design-pages';
import { publicImageUrl } from '@/lib/media-links';

const image = z.string().trim().max(2000).refine((value) => !value || Boolean(publicImageUrl(value)), 'Gunakan tautan gambar HTTPS atau Google Drive');
const schema = z.object({
  path: z.string().refine(editableEditorialPath),
  level: z.string().trim().max(150), accreditation: z.string().trim().max(150),
  sectionLabel: z.string().trim().max(150), aboutHeading: z.string().trim().max(150), facilitiesHeading: z.string().trim().max(150), registrationLabel: z.string().trim().max(150),
  images: z.array(image).length(3),
  facilities: z.array(z.object({ title: z.string().trim().max(150), description: z.string().trim().max(1000), imageUrl: image })).length(4),
  ctaTitle: z.string().trim().max(200), ctaLabel: z.string().trim().max(100),
  ctaHref: z.string().trim().max(2000).refine((value) => !value || value.startsWith('/') && !value.startsWith('//') || /^https:\/\//.test(value)),
});

async function pageExists(path: string) {
  const [page] = await db.select({ id: cmsPages.id }).from(cmsPages).where(eq(cmsPages.path, path)).limit(1);
  return Boolean(page);
}

export async function GET(request: NextRequest) {
  if (!await getAdminUser(request)) return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  const path = request.nextUrl.searchParams.get('path') ?? '';
  if (!editableEditorialPath(path) || !await pageExists(path)) return NextResponse.json({ error: 'Halaman tidak ditemukan' }, { status: 404 });
  return NextResponse.json({ content: await getEditorialContent(path) });
}

export async function PUT(request: NextRequest) {
  if (!await getAdminUser(request)) return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Data visual tidak valid. Periksa tautan dan panjang isian.' }, { status: 400 });
  const { path, ...content } = parsed.data;
  if (!await pageExists(path)) return NextResponse.json({ error: 'Halaman tidak ditemukan' }, { status: 404 });
  await db.insert(settings).values({ key: `editorial:${path}`, value: JSON.stringify(content), type: 'json', updatedAt: new Date() })
    .onConflictDoUpdate({ target: settings.key, set: { value: JSON.stringify(content), updatedAt: new Date() } });
  return NextResponse.json({ content });
}
