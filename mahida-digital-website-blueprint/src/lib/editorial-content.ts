import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { settings } from '@/db/schema';

export type EditorialContent = {
  level: string;
  aboutVisible: boolean;
  facilitiesVisible: boolean;
  registrationVisible: boolean;
  accreditation: string;
  sectionLabel: string;
  aboutHeading: string;
  facilitiesHeading: string;
  registrationLabel: string;
  images: string[];
  facilities: {
    title: string;
    description: string;
    imageUrl: string;
    visible?: boolean;
  }[];
  ctaTitle: string;
  ctaLabel: string;
  ctaHref: string;
};

export const emptyEditorialContent: EditorialContent = {
  level: '',
  aboutVisible: true,
  facilitiesVisible: true,
  registrationVisible: true,
  accreditation: '',
  sectionLabel: '',
  aboutHeading: '',
  facilitiesHeading: '',
  registrationLabel: '',
  images: ['', '', ''],
  facilities: [],
  ctaTitle: '',
  ctaLabel: '',
  ctaHref: '',
};

export async function getEditorialContent(
  path: string,
): Promise<EditorialContent> {
  const [row] = await db
    .select({ value: settings.value })
    .from(settings)
    .where(eq(settings.key, `editorial:${path}`))
    .limit(1);
  if (!row?.value) return emptyEditorialContent;
  try {
    const value = JSON.parse(row.value) as Partial<EditorialContent>;
    return {
      ...emptyEditorialContent,
      ...value,
      images: Array.from(
        { length: 3 },
        (_, index) => value.images?.[index] || '',
      ),
      facilities: (value.facilities || []).map((f) => ({
        ...f,
        visible: f.visible ?? true,
      })),
    };
  } catch {
    return emptyEditorialContent;
  }
}
