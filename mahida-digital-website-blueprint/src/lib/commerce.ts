import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { settings } from '@/db/schema';
import { driveIdFromUrl } from './media-links';

export type CommerceSettings = {
  whatsappNumber: string;
  merchantName: string;
  qrisImageUrl: string;
  qrisEnabled: boolean;
  youtubeChannelUrl: string;
};

const empty: CommerceSettings = { whatsappNumber: '', merchantName: '', qrisImageUrl: '', qrisEnabled: false, youtubeChannelUrl: '' };
export async function getCommerceSettings(): Promise<CommerceSettings> {
  const [row] = await db.select({ value: settings.value }).from(settings).where(eq(settings.key, 'commerce')).limit(1);
  if (!row?.value) return empty;
  try {
    const value = JSON.parse(row.value) as Partial<CommerceSettings>;
    return { ...empty, ...value };
  } catch { return empty; }
}
export function ebookCheckoutReady(settings: CommerceSettings) {
  return settings.qrisEnabled && Boolean(settings.merchantName.trim()) && Boolean(driveIdFromUrl(settings.qrisImageUrl));
}
