import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { settings } from '@/db/schema';
import { getCommerceSettings } from '@/lib/commerce';
import {
  EMPTY_PUBLIC_DIRECTORY,
  PUBLIC_DIRECTORY_KEY,
  publicDirectorySchema,
  type PublicDirectory,
} from '@/lib/public-directory';

export type PublicContact = {
  id: string;
  label: string;
  category: PublicDirectory['contacts'][number]['category'];
  channel: PublicDirectory['contacts'][number]['channel'];
  href: string;
  sortOrder: number;
};

export function visibleDirectory(directory: PublicDirectory, commerceWhatsappNumber: string) {
  const socials = directory.socials.filter((item) => item.isVisible && item.url.trim())
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const contacts: PublicContact[] = directory.contacts
    .filter((item) => item.isVisible && item.value.trim())
    .map((item) => ({
      id: item.id, label: item.label, category: item.category, channel: item.channel,
      href: item.channel === 'whatsapp' ? `https://wa.me/${item.value}` :
        item.channel === 'telepon' ? `tel:${item.value}` :
        item.channel === 'email' ? `mailto:${item.value}` : item.value,
      sortOrder: item.sortOrder,
    }));
  if (directory.coopWhatsapp.isVisible && /^[1-9][0-9]{8,14}$/.test(commerceWhatsappNumber)) {
    contacts.push({
      id: 'coop-whatsapp', label: directory.coopWhatsapp.label, category: 'koperasi',
      channel: 'whatsapp', href: `https://wa.me/${commerceWhatsappNumber}`,
      sortOrder: directory.coopWhatsapp.sortOrder,
    });
  }
  contacts.sort((a, b) => a.sortOrder - b.sortOrder);
  return { socials, contacts };
}

export async function getVisibleDirectory() {
  const directory = await getPublicDirectory();
  const commerce = directory.coopWhatsapp.isVisible ? await getCommerceSettings() : null;
  return visibleDirectory(directory, commerce?.whatsappNumber ?? '');
}

export async function getPublicDirectory(): Promise<PublicDirectory> {
  if (!process.env.DATABASE_URL) return EMPTY_PUBLIC_DIRECTORY;
  try {
    const [row] = await db.select({ value: settings.value }).from(settings)
      .where(eq(settings.key, PUBLIC_DIRECTORY_KEY)).limit(1);
    if (!row?.value) return EMPTY_PUBLIC_DIRECTORY;
    const parsed = publicDirectorySchema.safeParse(JSON.parse(row.value));
    return parsed.success ? parsed.data : EMPTY_PUBLIC_DIRECTORY;
  } catch (error) {
    console.error('Public directory unavailable:', error instanceof Error ? error.message : error);
    return EMPTY_PUBLIC_DIRECTORY;
  }
}
