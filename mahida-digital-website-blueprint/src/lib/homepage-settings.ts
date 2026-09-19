import { db } from '@/db';
import { settings } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export type HomepageSettings = {
  heroEyebrow: string;
  heroTitleLine1: string;
  heroTitleLine2: string;
  heroTitleAccent: string;
  heroDescription: string;
  heroPrimaryLabel: string;
  heroPrimaryHref: string;
  heroSecondaryLabel: string;
  heroSecondaryHref: string;
  aboutEyebrow: string;
  aboutTitle: string;
  aboutDescription: string;
  aboutImageUrl: string;
  stat1Value: string;
  stat1Label: string;
  stat2Value: string;
  stat2Label: string;
  stat3Value: string;
  stat3Label: string;
  featuredArticleIds: number[];
};

export const DEFAULT_HOMEPAGE_SETTINGS: HomepageSettings = {
  heroEyebrow: 'Belajar • Berkarya • Berkhidmah',
  heroTitleLine1: 'Mengenal,',
  heroTitleLine2: 'Membaca, Menjaga',
  heroTitleAccent: 'Mahida.',
  heroDescription:
    'Satu ruang untuk ilmu, karya, dan kehidupan pesantren. Temukan kitab, terjemahan, esai, dokumentasi, dan perjalanan Mahida di sini.',
  heroPrimaryLabel: 'Mulai Membaca',
  heroPrimaryHref: '/literasi',
  heroSecondaryLabel: 'Jelajahi Mahida',
  heroSecondaryHref: '/tentang/profil',
  aboutEyebrow: 'Tentang Mahida',
  aboutTitle: 'Pondok Pesantren yang Membaca Tradisi dan Zaman',
  aboutDescription:
    'Mahida Digital menjadi ruang untuk mengenalkan perjalanan, ilmu, karya, dan khidmah yang tumbuh di lingkungan pesantren.',
  aboutImageUrl: '',
  stat1Value: '',
  stat1Label: 'Tahun Mengabdi',
  stat2Value: '',
  stat2Label: 'Santri Aktif',
  stat3Value: '',
  stat3Label: 'Alumni',
  featuredArticleIds: [],
};

export async function homepageSettingsReady() {
  try {
    const result = await db.execute(sql`
      select to_regclass('public.settings') is not null as ready
    `);
    return Boolean((result.rows?.[0] as { ready?: boolean } | undefined)?.ready);
  } catch {
    return false;
  }
}

export async function getHomepageSettings(): Promise<HomepageSettings> {
  const ready = await homepageSettingsReady();
  if (!ready) return DEFAULT_HOMEPAGE_SETTINGS;

  const [row] = await db
    .select({ value: settings.value })
    .from(settings)
    .where(eq(settings.key, 'homepage'))
    .limit(1);

  if (!row?.value) return DEFAULT_HOMEPAGE_SETTINGS;

  try {
    const parsed = JSON.parse(row.value) as Partial<HomepageSettings>;
    return {
      ...DEFAULT_HOMEPAGE_SETTINGS,
      ...parsed,
      featuredArticleIds: Array.isArray(parsed.featuredArticleIds)
        ? parsed.featuredArticleIds.filter((value): value is number => Number.isInteger(value))
        : [],
    };
  } catch {
    return DEFAULT_HOMEPAGE_SETTINGS;
  }
}
