import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { settings } from '@/db/schema';

export type EditorialContent = {
  level: string;
  accreditation: string;
  sectionLabel: string;
  aboutHeading: string;
  facilitiesHeading: string;
  registrationLabel: string;
  images: string[];
  facilities: { title: string; description: string; imageUrl: string }[];
  ctaTitle: string;
  ctaLabel: string;
  ctaHref: string;
};

export const emptyEditorialContent: EditorialContent = {
  level: '', accreditation: '', sectionLabel: '', aboutHeading: '', facilitiesHeading: '', registrationLabel: '', images: ['', '', ''], facilities: Array.from({ length: 4 }, () => ({ title: '', description: '', imageUrl: '' })),
  ctaTitle: '', ctaLabel: '', ctaHref: '',
};

export async function getEditorialContent(path: string): Promise<EditorialContent> {
  const [row] = await db.select({ value: settings.value }).from(settings).where(eq(settings.key, `editorial:${path}`)).limit(1);
  if (!row?.value) return emptyEditorialContent;
  try {
    const value = JSON.parse(row.value) as Partial<EditorialContent>;
    return {
      ...emptyEditorialContent, ...value,
      images: Array.from({ length: 3 }, (_, index) => value.images?.[index] || ''),
      facilities: Array.from({ length: 4 }, (_, index) => ({ ...emptyEditorialContent.facilities[index], ...value.facilities?.[index] })),
    };
  } catch { return emptyEditorialContent; }
}
