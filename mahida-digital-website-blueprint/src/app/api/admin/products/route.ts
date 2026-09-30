import { NextRequest, NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { products } from '@/db/schema';
import { getAdminUser } from '@/lib/admin-auth';
import { driveIdFromUrl } from '@/lib/media-links';
import { slugify } from '@/lib/utils';

const schema = z.object({
  id: z.number().int().positive().optional(), name: z.string().trim().min(1).max(255),
  description: z.string().trim().max(10000).default(''),
  productType: z.enum(['physical_book','ebook']), price: z.number().int().min(0).max(1000000000),
  imageUrl: z.string().trim().max(2048).default(''), digitalFileUrl: z.string().trim().max(2048).default(''),
  inStock: z.boolean().default(true), status: z.enum(['draft','published']).default('draft'),
});

export async function GET(request: NextRequest) {
  if (!await getAdminUser(request)) return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  const items = await db.select().from(products).orderBy(desc(products.updatedAt));
  return NextResponse.json({ items });
}
async function save(request: NextRequest, edit: boolean) {
  if (!await getAdminUser(request)) return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || (edit && !parsed.data?.id)) return NextResponse.json({ error: 'Data produk tidak valid' }, { status: 400 });
  const { id, name, description, productType, price, imageUrl, digitalFileUrl, inStock, status } = parsed.data;
  if (imageUrl && !driveIdFromUrl(imageUrl)) return NextResponse.json({ error: 'Sampul harus berupa tautan Google Drive' }, { status: 400 });
  if (productType === 'ebook' && status === 'published' && !driveIdFromUrl(digitalFileUrl)) return NextResponse.json({ error: 'E-book terbit memerlukan berkas Google Drive' }, { status: 400 });
  if (digitalFileUrl && !driveIdFromUrl(digitalFileUrl)) return NextResponse.json({ error: 'Berkas e-book harus berupa tautan Google Drive' }, { status: 400 });
  if (productType === 'physical_book' && digitalFileUrl) return NextResponse.json({ error: 'Buku fisik tidak memerlukan URL e-book' }, { status: 400 });
  try {
    const base = slugify(name) || 'produk';
    let slug = base;
    for (let n = 2; n < 1000; n++) {
      const [match] = await db.select({ id: products.id }).from(products).where(eq(products.slug, slug)).limit(1);
      if (!match || match.id === id) break;
      slug = `${base}-${n}`;
    }
    const values = { name, slug, description, productType, price, imageUrl: imageUrl || null, digitalFileUrl: digitalFileUrl || null, inStock, status, updatedAt: new Date() };
    const [item] = edit && id ? await db.update(products).set(values).where(eq(products.id, id)).returning() : await db.insert(products).values(values).returning();
    if (!item) return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
    return NextResponse.json({ item }, { status: edit ? 200 : 201 });
  } catch (error) { console.error('Product save:', error); return NextResponse.json({ error: 'Gagal menyimpan produk' }, { status: 409 }); }
}
export async function POST(request: NextRequest) { return save(request, false); }
export async function PATCH(request: NextRequest) { return save(request, true); }
export async function DELETE(request: NextRequest) {
  if (!await getAdminUser(request)) return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  const parsed = z.object({ id: z.number().int().positive() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
  try { const deleted = await db.delete(products).where(eq(products.id, parsed.data.id)).returning({ id: products.id }); return NextResponse.json({ ok: deleted.length > 0 }); }
  catch { return NextResponse.json({ error: 'Produk dengan pesanan tidak dapat dihapus. Ubah status menjadi draft.' }, { status: 409 }); }
}
