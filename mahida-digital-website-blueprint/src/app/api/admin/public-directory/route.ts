import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { settings } from '@/db/schema';
import { getAdminUser } from '@/lib/admin-auth';
import { getCommerceSettings } from '@/lib/commerce';
import { PUBLIC_DIRECTORY_KEY, publicDirectorySchema } from '@/lib/public-directory';
import { getPublicDirectory } from '@/lib/public-directory-store';

export async function GET(request: NextRequest) {
  if (!await getAdminUser(request)) return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  const [directory, commerce] = await Promise.all([getPublicDirectory(), getCommerceSettings()]);
  return NextResponse.json({ directory, commerceWhatsappNumber: commerce.whatsappNumber });
}

export async function PUT(request: NextRequest) {
  if (!await getAdminUser(request)) return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  const parsed = publicDirectorySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Data kontak tidak valid' }, { status: 400 });
  }
  if (parsed.data.coopWhatsapp.isVisible && !(await getCommerceSettings()).whatsappNumber) {
    return NextResponse.json({ error: 'Isi nomor WhatsApp di Pengaturan Koperasi sebelum ditampilkan' }, { status: 400 });
  }

  const value = JSON.stringify(parsed.data);
  await db.insert(settings).values({
    key: PUBLIC_DIRECTORY_KEY, type: 'json', value, updatedAt: new Date(),
  }).onConflictDoUpdate({
    target: settings.key,
    set: { value, type: 'json', updatedAt: new Date() },
  });

  return NextResponse.json({ directory: parsed.data });
}
