import { NextRequest, NextResponse } from 'next/server';
import { and, count, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { ebookOrders } from '@/db/schema';
import { getAdminUser } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  if (!await getAdminUser(request)) return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  const page = z.coerce.number().int().min(1).max(100000).catch(1).parse(request.nextUrl.searchParams.get('page') ?? '1');
  const pageSize = 50;
  const [totalRow] = await db.select({ total: count() }).from(ebookOrders);
  const orders = await db.select({
    id: ebookOrders.id, code: ebookOrders.code, email: ebookOrders.email,
    price: ebookOrders.priceSnapshot, status: ebookOrders.status,
    createdAt: ebookOrders.createdAt, reportedAt: ebookOrders.reportedAt,
    paidAmount: ebookOrders.paidAmount, paidAt: ebookOrders.paidAt,
    verifiedAt: ebookOrders.verifiedAt, deliveredAt: ebookOrders.deliveredAt,
    productName: ebookOrders.productNameSnapshot, digitalFileUrl: ebookOrders.fileUrlSnapshot,
  }).from(ebookOrders).orderBy(desc(ebookOrders.createdAt),desc(ebookOrders.id)).limit(pageSize).offset((page - 1) * pageSize);
  return NextResponse.json({ orders, total: totalRow.total, page, pageSize });
}

export async function PATCH(request: NextRequest) {
  if (!await getAdminUser(request)) return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  const parsed = z.object({
    id: z.number().int().positive(), action: z.enum(['verify','delivered','cancel']),
    paidAmount: z.number().int().nonnegative().optional(),
    paidAt: z.iso.datetime().optional(),
  }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Perubahan tidak valid' }, { status: 400 });
  const { id, action } = parsed.data;
  if (action === 'verify' && (parsed.data.paidAmount === undefined || !parsed.data.paidAt)) {
    return NextResponse.json({ error: 'Isi nominal dan waktu pembayaran sesuai riwayat QRIS merchant' }, { status: 400 });
  }
  const previous = action === 'verify' ? 'payment_review' : action === 'delivered' ? 'paid' : 'awaiting_payment';
  const status = action === 'verify' ? 'paid' : action === 'delivered' ? 'delivered' : 'cancelled';
  const now = new Date();
  const paidAt = action === 'verify' ? new Date(parsed.data.paidAt!) : null;
  if (paidAt && (Number.isNaN(paidAt.getTime()) || paidAt.getTime() > now.getTime() + 5 * 60 * 1000)) {
    return NextResponse.json({ error: 'Waktu pembayaran tidak valid' }, { status: 400 });
  }
  if (action === 'verify') {
    const [order] = await db.select({ price: ebookOrders.priceSnapshot }).from(ebookOrders).where(eq(ebookOrders.id, id)).limit(1);
    if (!order || order.price !== parsed.data.paidAmount) {
      return NextResponse.json({ error: 'Nominal transaksi harus sama dengan total pesanan. Periksa riwayat QRIS.' }, { status: 409 });
    }
  }
  const [row] = await db.update(ebookOrders).set({
    status, updatedAt: now,
    ...(action === 'verify' ? { verifiedAt: now, paidAt, paidAmount: parsed.data.paidAmount } : {}),
    ...(action === 'delivered' ? { deliveredAt: now } : {}),
  }).where(and(eq(ebookOrders.id,id),eq(ebookOrders.status,previous))).returning({ id: ebookOrders.id });
  if (!row) return NextResponse.json({ error: 'Status pesanan tidak sesuai atau pesanan tidak ditemukan' }, { status: 409 });
  return NextResponse.json({ ok: true, status });
}
