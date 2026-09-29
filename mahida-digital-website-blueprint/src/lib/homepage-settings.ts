import { db } from '@/db';
import { settings } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export type HomepageSettings = {
  siteName: string;
  siteTagline: string;
  siteLogoUrl: string;
  footerDescription: string;
  seoTitle: string;
  seoDescription: string;
  heroEyebrow: string;
  heroTitleLine1: string;
  heroTitleLine2: string;
  heroTitleAccent: string;
  heroDescription: string;
  heroVideoUrl: string;
  heroImageUrl: string;
  unitsEyebrow: string;
  unitsTitle: string;
  unitsDescription: string;
  newsEyebrow: string;
  newsTitle: string;
  homePostIds: number[];
  heroPrimaryLabel: string;
  heroPrimaryHref: string;
  heroSecondaryLabel: string;
  heroSecondaryHref: string;
  heroWidgetImageUrl: string;
  heroWidgetArabic: string;
  heroWidgetSubtitle: string;
  heroWidgetLayout: 'logo' | 'photo';
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
  featuredWorkIds: number[];
};

export const DEFAULT_HOMEPAGE_SETTINGS: HomepageSettings = {
  siteName: 'MAHIDA',
  siteTagline: 'Digital Pesantren',
  siteLogoUrl: '/brand/mahida-logo.webp',
  footerDescription: 'Ruang untuk ilmu, karya, dokumentasi, dan khidmah Mahida.',
  seoTitle: 'Mahida Digital — Belajar. Berkarya. Berkhidmah.',
  seoDescription: 'Website resmi, media, literasi, arsip, dan ekosistem Mahida. Satu ruang untuk mengenal, membaca, melihat, menjaga, dan mengikuti perjalanan Mahida.',
  heroEyebrow: 'Belajar • Berkarya • Berkhidmah',
  heroTitleLine1: 'Mengenal,',
  heroTitleLine2: 'Membaca, Menjaga',
  heroTitleAccent: 'Mahida.',
  heroDescription:
    'Ruang digital untuk mengenal Mahida dan membaca publikasi yang telah diterbitkan.',
  heroVideoUrl: '',
  heroImageUrl: '',
  unitsEyebrow: 'Pendidikan Mahida',
  unitsTitle: 'Temukan ruang belajar Anda.',
  unitsDescription: 'Lima unit pendidikan dalam satu lingkungan Mahida Salam.',
  newsEyebrow: 'Dari Mahida',
  newsTitle: 'Berita & Artikel Terbaru',
  homePostIds: [],
  heroPrimaryLabel: 'Mulai Membaca',
  heroPrimaryHref: '/literasi',
  heroSecondaryLabel: 'Jelajahi Mahida',
  heroSecondaryHref: '/tentang/profil',
  heroWidgetImageUrl: '/brand/mahida-logo.webp',
  heroWidgetArabic: 'مَنْبَعُ الْهِدَايَةِ',
  heroWidgetSubtitle: 'Sumber Petunjuk',
  heroWidgetLayout: 'logo',
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
  featuredWorkIds: [],
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
    const parsed = JSON.parse(row.value) as Partial<HomepageSettings> & { featuredArticleIds?: number[] };
    return {
      ...DEFAULT_HOMEPAGE_SETTINGS,
      ...parsed,
      heroWidgetLayout: parsed.heroWidgetLayout === 'logo' || parsed.heroWidgetLayout === 'photo'
        ? parsed.heroWidgetLayout
        : parsed.heroWidgetImageUrl && parsed.heroWidgetImageUrl !== DEFAULT_HOMEPAGE_SETTINGS.heroWidgetImageUrl ? 'photo' : 'logo',
      featuredWorkIds: (Array.isArray(parsed.featuredWorkIds) ? parsed.featuredWorkIds : parsed.featuredArticleIds ?? [])
        .filter((value): value is number => Number.isInteger(value) && value > 0)
        .filter((value, index, values) => values.indexOf(value) === index).slice(0, 10),
      homePostIds: (Array.isArray(parsed.homePostIds) ? parsed.homePostIds : [])
        .filter((value): value is number => Number.isInteger(value) && value > 0)
        .filter((value, index, values) => values.indexOf(value) === index).slice(0, 3),
    };
  } catch {
    return DEFAULT_HOMEPAGE_SETTINGS;
  }
}
