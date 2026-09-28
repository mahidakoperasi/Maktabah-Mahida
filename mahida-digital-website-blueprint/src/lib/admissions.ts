import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { admissionSettings } from '@/db/schema';

export async function getAdmissionSettings() {
  const [value] = await db.select().from(admissionSettings).where(eq(admissionSettings.id, 1)).limit(1);
  return value ?? { id: 1, introduction: '', steps: [], requirements: [], applicationLabel: 'Daftar Sekarang', applicationUrl: '', updatedAt: new Date() };
}

export function validApplicationUrl(url: string) {
  if (!url) return true;
  if (url.startsWith('/') && !url.startsWith('//') && !url.startsWith('/\\')) return true;
  try { return new URL(url).protocol === 'https:'; } catch { return false; }
}
