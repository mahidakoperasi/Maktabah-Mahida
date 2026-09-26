import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { and, count, eq, gt } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { ebookOrders, products } from '@/db/schema';
import { ebookCheckoutReady, getCommerceSettings } from '@/lib/commerce';

const requestSchema = z.object({
  productId: z.number().int().positive(),
  email: z.email().trim().max(255).transform((value) => value.toLowerCase()),
});

export async function POST(request: NextRequest) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Masukkan email yang benar' }, { status: 400 });
  const commerce = await getCommerceSettings();
  if (!ebookCheckoutReady(commerce)) return NextResponse.json({ error: 'Pembelian e-book belum dibuka: QRIS resmi belum tersedia' }, { status: 503 });
  const [product] = await db.select({ id: products.id, price: products.price, name: products.name, status: products.status, productType: products.productType, digitalFileUrl: products.digitalFileUrl }).from(products).where(eq(products.id, parsed.data.productId)).limit(1);
  if (!product || product.status !== 'published' || product.productType !== 'ebook' || !product.digitalFileUrl) return NextResponse.json({ error: 'E-book tidak tersedia' }, { status: 404 });
  const [usage] = await db.select({ total: count() }).from(ebookOrders).where(and(eq(ebookOrders.email, parsed.data.email), gt(ebookOrders.createdAt, new Date(Date.now() - 60 * 60 * 1000))));
  if (usage.total >= 5) return NextResponse.json({ error: 'Terlalu banyak pesanan. Coba lagi nanti.' }, { status: 429 });
  const code = `MH-${randomBytes(8).toString('hex').toUpperCase()}`;
  await db.insert(ebookOrders).values({ code, productId: product.id, productNameSnapshot: product.name, email: parsed.data.email, priceSnapshot: product.price, fileUrlSnapshot: product.digitalFileUrl });
  return NextResponse.json({ code, productName: product.name, amount: product.price, merchantName: commerce.merchantName, qrisImageUrl: commerce.qrisImageUrl, status: 'awaiting_payment' }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const schema = z.object({ code: z.string().regex(/^MH-[A-F0-9]{16}$/), email: z.email().trim().transform((email) => email.toLowerCase()) });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Pesanan tidak valid' }, { status: 400 });
  const now = new Date();
  const [order] = await db.update(ebookOrders).set({ status: 'payment_review', reportedAt: now, updatedAt: now }).where(and(eq(ebookOrders.code, parsed.data.code), eq(ebookOrders.email, parsed.data.email), eq(ebookOrders.status,'awaiting_payment'))).returning({ id: ebookOrders.id });
  if (!order) return NextResponse.json({ error: 'Pesanan tidak ditemukan atau sudah dilaporkan' }, { status: 404 });
  return NextResponse.json({ ok: true, status: 'payment_review' });
}
