import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { settings } from '@/db/schema';
import { getAdminUser } from '@/lib/admin-auth';
import { getCommerceSettings } from '@/lib/commerce';
import { driveIdFromUrl } from '@/lib/media-links';

const schema = z.object({
  whatsappNumber: z.string().trim().regex(/^(?:|[1-9][0-9]{8,14})$/),
  merchantName: z.string().trim().max(150),
  qrisImageUrl: z.string().trim().max(2048),
  qrisEnabled: z.boolean(),
  youtubeChannelUrl: z.string().trim().max(2048),
});
export async function GET(request: NextRequest) {
  if (!await getAdminUser(request)) return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  return NextResponse.json({ settings: await getCommerceSettings() });
}
export async function PUT(request: NextRequest) {
  if (!await getAdminUser(request)) return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Format pengaturan tidak valid' }, { status: 400 });
  const value = parsed.data;
  if (value.qrisImageUrl && !driveIdFromUrl(value.qrisImageUrl)) return NextResponse.json({ error: 'QRIS harus berupa tautan Google Drive' }, { status: 400 });
  if (value.qrisEnabled && (!value.qrisImageUrl || !value.merchantName)) return NextResponse.json({ error: 'Isi nama merchant dan QRIS sebelum membuka pesanan e-book' }, { status: 400 });
  if (value.youtubeChannelUrl) {
    try { const url = new URL(value.youtubeChannelUrl); if (url.protocol !== 'https:' || !['youtube.com','www.youtube.com'].includes(url.hostname)) throw new Error(); }
    catch { return NextResponse.json({ error: 'Tautan kanal YouTube tidak valid' }, { status: 400 }); }
  }
  await db.insert(settings).values({ key: 'commerce', type: 'json', value: JSON.stringify(value), updatedAt: new Date() }).onConflictDoUpdate({ target: settings.key, set: { value: JSON.stringify(value), updatedAt: new Date() } });
  return NextResponse.json({ settings: value });
}
