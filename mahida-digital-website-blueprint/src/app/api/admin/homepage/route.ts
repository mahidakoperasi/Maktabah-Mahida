import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { settings } from '@/db/schema';
import { posts } from '@/db/schema';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { getAdminUser } from '@/lib/admin-auth';
import { driveIdFromUrl, publicImageUrl } from '@/lib/media-links';
import {
  DEFAULT_HOMEPAGE_SETTINGS,
  getHomepageSettings,
  homepageSettingsReady,
  type HomepageSettings,
} from '@/lib/homepage-settings';

function sanitizeHomepageSettings(input: unknown): HomepageSettings {
  const source = (input && typeof input === 'object' ? input : {}) as Record<
    string,
    unknown
  >;

  const textValue = (key: keyof HomepageSettings, fallback: string) => {
    const value = source[key];
    return typeof value === 'string' ? value.trim() : fallback;
  };

  const ids = Array.isArray(source.featuredWorkIds)
    ? source.featuredWorkIds
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0)
        .filter((value, index, values) => values.indexOf(value) === index)
        .slice(0, 10)
    : [];

  return {
    siteName: textValue('siteName', DEFAULT_HOMEPAGE_SETTINGS.siteName).slice(
      0,
      100,
    ),
    siteTagline: textValue(
      'siteTagline',
      DEFAULT_HOMEPAGE_SETTINGS.siteTagline,
    ).slice(0, 150),
    siteLogoUrl: textValue(
      'siteLogoUrl',
      DEFAULT_HOMEPAGE_SETTINGS.siteLogoUrl,
    ),
    footerDescription: textValue(
      'footerDescription',
      DEFAULT_HOMEPAGE_SETTINGS.footerDescription,
    ).slice(0, 1000),
    seoTitle: textValue('seoTitle', DEFAULT_HOMEPAGE_SETTINGS.seoTitle).slice(
      0,
      200,
    ),
    seoDescription: textValue(
      'seoDescription',
      DEFAULT_HOMEPAGE_SETTINGS.seoDescription,
    ).slice(0, 500),
    heroEyebrow: textValue(
      'heroEyebrow',
      DEFAULT_HOMEPAGE_SETTINGS.heroEyebrow,
    ),
    heroTitleLine1: textValue(
      'heroTitleLine1',
      DEFAULT_HOMEPAGE_SETTINGS.heroTitleLine1,
    ),
    heroTitleLine2: textValue(
      'heroTitleLine2',
      DEFAULT_HOMEPAGE_SETTINGS.heroTitleLine2,
    ),
    heroTitleAccent: textValue(
      'heroTitleAccent',
      DEFAULT_HOMEPAGE_SETTINGS.heroTitleAccent,
    ),
    heroDescription: textValue(
      'heroDescription',
      DEFAULT_HOMEPAGE_SETTINGS.heroDescription,
    ),
    heroVideoUrl: textValue('heroVideoUrl', ''),
    heroImageUrl: textValue('heroImageUrl', ''),
    unitsEyebrow: textValue(
      'unitsEyebrow',
      DEFAULT_HOMEPAGE_SETTINGS.unitsEyebrow,
    ),
    unitsTitle: textValue('unitsTitle', DEFAULT_HOMEPAGE_SETTINGS.unitsTitle),
    unitsDescription: textValue(
      'unitsDescription',
      DEFAULT_HOMEPAGE_SETTINGS.unitsDescription,
    ),
    newsEyebrow: textValue(
      'newsEyebrow',
      DEFAULT_HOMEPAGE_SETTINGS.newsEyebrow,
    ),
    newsTitle: textValue('newsTitle', DEFAULT_HOMEPAGE_SETTINGS.newsTitle),
    homePostIds: (Array.isArray(source.homePostIds) ? source.homePostIds : [])
      .filter((id): id is number => Number.isInteger(id) && (id as number) > 0)
      .filter((id, index, values) => values.indexOf(id) === index)
      .slice(0, 3),
    heroPrimaryLabel: textValue(
      'heroPrimaryLabel',
      DEFAULT_HOMEPAGE_SETTINGS.heroPrimaryLabel,
    ),
    heroPrimaryHref: textValue(
      'heroPrimaryHref',
      DEFAULT_HOMEPAGE_SETTINGS.heroPrimaryHref,
    ),
    heroSecondaryLabel: textValue(
      'heroSecondaryLabel',
      DEFAULT_HOMEPAGE_SETTINGS.heroSecondaryLabel,
    ),
    heroSecondaryHref: textValue(
      'heroSecondaryHref',
      DEFAULT_HOMEPAGE_SETTINGS.heroSecondaryHref,
    ),
    heroWidgetImageUrl:
      textValue('heroWidgetImageUrl', '') ||
      DEFAULT_HOMEPAGE_SETTINGS.heroWidgetImageUrl,
    heroWidgetArabic: textValue(
      'heroWidgetArabic',
      DEFAULT_HOMEPAGE_SETTINGS.heroWidgetArabic,
    ).slice(0, 120),
    heroWidgetSubtitle: textValue(
      'heroWidgetSubtitle',
      DEFAULT_HOMEPAGE_SETTINGS.heroWidgetSubtitle,
    ).slice(0, 120),
    heroWidgetLayout: source.heroWidgetLayout === 'photo' ? 'photo' : 'logo',
    aboutEyebrow: textValue(
      'aboutEyebrow',
      DEFAULT_HOMEPAGE_SETTINGS.aboutEyebrow,
    ),
    aboutTitle: textValue('aboutTitle', DEFAULT_HOMEPAGE_SETTINGS.aboutTitle),
    aboutDescription: textValue(
      'aboutDescription',
      DEFAULT_HOMEPAGE_SETTINGS.aboutDescription,
    ),
    aboutImageUrl: textValue('aboutImageUrl', ''),
    stat1Value: textValue('stat1Value', ''),
    stat1Label: textValue('stat1Label', DEFAULT_HOMEPAGE_SETTINGS.stat1Label),
    stat2Value: textValue('stat2Value', ''),
    stat2Label: textValue('stat2Label', DEFAULT_HOMEPAGE_SETTINGS.stat2Label),
    stat3Value: textValue('stat3Value', ''),
    stat3Label: textValue('stat3Label', DEFAULT_HOMEPAGE_SETTINGS.stat3Label),
    featuredWorkIds: ids,
  };
}

export async function GET(request: NextRequest) {
  const admin = await getAdminUser(request);
  if (!admin) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  }

  const articles = await db
    .select({ id: posts.id, title: posts.title, type: posts.type })
    .from(posts)
    .where(
      and(
        inArray(posts.type, ['article', 'essay', 'work']),
        eq(posts.status, 'published'),
      ),
    )
    .orderBy(desc(posts.publishedAt), desc(posts.id))
    .limit(100);
  return NextResponse.json({
    ready: await homepageSettingsReady(),
    settings: await getHomepageSettings(),
    articles,
  });
}

export async function PUT(request: NextRequest) {
  const admin = await getAdminUser(request);
  if (!admin) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  }

  if (!(await homepageSettingsReady())) {
    return NextResponse.json(
      { error: 'Database pengaturan beranda belum siap' },
      { status: 503 },
    );
  }

  try {
    const body = await request.json();
    const value = sanitizeHomepageSettings(body);
    if (
      value.heroWidgetImageUrl !==
        DEFAULT_HOMEPAGE_SETTINGS.heroWidgetImageUrl &&
      !driveIdFromUrl(value.heroWidgetImageUrl)
    ) {
      return NextResponse.json(
        { error: 'Widget harus memakai tautan berkas Google Drive' },
        { status: 400 },
      );
    }
    if (value.heroImageUrl && !publicImageUrl(value.heroImageUrl))
      return NextResponse.json(
        { error: 'Gambar hero harus memakai tautan HTTPS atau Google Drive' },
        { status: 400 },
      );
    if (value.siteLogoUrl && !publicImageUrl(value.siteLogoUrl))
      return NextResponse.json(
        { error: 'Logo harus memakai tautan HTTPS atau Google Drive' },
        { status: 400 },
      );
    for (const href of [value.heroPrimaryHref, value.heroSecondaryHref]) {
      if (
        href &&
        !(href.startsWith('/') && !href.startsWith('//')) &&
        !/^https:\/\/[^\s/]+/.test(href)
      )
        return NextResponse.json(
          { error: 'Tautan tombol harus berupa path situs atau URL HTTPS' },
          { status: 400 },
        );
    }
    if (value.heroVideoUrl) {
      try {
        const url = new URL(value.heroVideoUrl);
        if (
          url.protocol !== 'https:' ||
          (!driveIdFromUrl(value.heroVideoUrl) &&
            !/\.mp4(?:$|\?)/i.test(value.heroVideoUrl))
        )
          throw new Error('Invalid video');
      } catch {
        return NextResponse.json(
          {
            error: 'Video hero harus berupa tautan Google Drive atau MP4 HTTPS',
          },
          { status: 400 },
        );
      }
    }

    await db
      .insert(settings)
      .values({
        key: 'homepage',
        value: JSON.stringify(value),
        type: 'json',
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: settings.key,
        set: {
          value: JSON.stringify(value),
          type: 'json',
          updatedAt: new Date(),
        },
      });

    return NextResponse.json({ settings: value });
  } catch (error) {
    console.error('Homepage settings update error:', error);
    return NextResponse.json(
      { error: 'Gagal menyimpan pengaturan beranda' },
      { status: 500 },
    );
  }
}
