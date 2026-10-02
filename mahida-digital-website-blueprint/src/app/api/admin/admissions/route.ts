import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { admissionSettings } from '@/db/schema';
import { requireAdminAccess } from '@/lib/admin-auth';
import { logActivity } from '@/lib/activity-log';
import { getAdmissionSettings, validApplicationUrl } from '@/lib/admissions';

const schema = z.object({
  introduction: z.string().trim().max(3000),
  steps: z.array(z.string().trim().min(1).max(500)).max(12),
  requirements: z.array(z.string().trim().min(1).max(500)).max(25),
  applicationLabel: z.string().trim().min(1).max(100),
  applicationUrl: z.string().trim().max(2048).refine(validApplicationUrl),
});

export async function GET(request: NextRequest) {
  if (!await requireAdminAccess(request, 'admissions')) return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  return NextResponse.json({ settings: await getAdmissionSettings() });
}

export async function PUT(request: NextRequest) {
  const admin = await requireAdminAccess(request, 'admissions');
  if (!admin) return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Periksa tahapan, persyaratan, dan alamat formulir (HTTPS atau jalur situs).' }, { status: 400 });
  const [settings] = await db.insert(admissionSettings).values({ id: 1, ...parsed.data, updatedAt: new Date() })
    .onConflictDoUpdate({ target: admissionSettings.id, set: { ...parsed.data, updatedAt: new Date() } }).returning();
  await logActivity({ actorId: admin.id, action: 'updated', targetType: 'admissions', targetId: 1, summary: 'Memperbarui pengaturan pendaftaran santri' });
  return NextResponse.json({ settings });
}
