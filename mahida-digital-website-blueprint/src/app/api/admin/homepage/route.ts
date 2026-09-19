import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { settings } from '@/db/schema';
import { getAdminUser } from '@/lib/admin-auth';
import {
  DEFAULT_HOMEPAGE_SETTINGS,
  getHomepageSettings,
  homepageSettingsReady,
  type HomepageSettings,
} from '@/lib/homepage-settings';

function sanitizeHomepageSettings(input: unknown): HomepageSettings {
  const source = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;

  const textValue = (key: keyof HomepageSettings, fallback: string) => {
    const value = source[key];
    return typeof value === 'string' ? value.trim() : fallback;
  };

  const ids = Array.isArray(source.featuredArticleIds)
    ? source.featuredArticleIds
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0)
        .slice(0, 3)
    : [];

  return {
    heroEyebrow: textValue('heroEyebrow', DEFAULT_HOMEPAGE_SETTINGS.heroEyebrow),
    heroTitleLine1: textValue('heroTitleLine1', DEFAULT_HOMEPAGE_SETTINGS.heroTitleLine1),
    heroTitleLine2: textValue('heroTitleLine2', DEFAULT_HOMEPAGE_SETTINGS.heroTitleLine2),
    heroTitleAccent: textValue('heroTitleAccent', DEFAULT_HOMEPAGE_SETTINGS.heroTitleAccent),
    heroDescription: textValue('heroDescription', DEFAULT_HOMEPAGE_SETTINGS.heroDescription),
    heroPrimaryLabel: textValue('heroPrimaryLabel', DEFAULT_HOMEPAGE_SETTINGS.heroPrimaryLabel),
    heroPrimaryHref: textValue('heroPrimaryHref', DEFAULT_HOMEPAGE_SETTINGS.heroPrimaryHref),
    heroSecondaryLabel: textValue('heroSecondaryLabel', DEFAULT_HOMEPAGE_SETTINGS.heroSecondaryLabel),
    heroSecondaryHref: textValue('heroSecondaryHref', DEFAULT_HOMEPAGE_SETTINGS.heroSecondaryHref),
    aboutEyebrow: textValue('aboutEyebrow', DEFAULT_HOMEPAGE_SETTINGS.aboutEyebrow),
    aboutTitle: textValue('aboutTitle', DEFAULT_HOMEPAGE_SETTINGS.aboutTitle),
    aboutDescription: textValue('aboutDescription', DEFAULT_HOMEPAGE_SETTINGS.aboutDescription),
    aboutImageUrl: textValue('aboutImageUrl', ''),
    stat1Value: textValue('stat1Value', ''),
    stat1Label: textValue('stat1Label', DEFAULT_HOMEPAGE_SETTINGS.stat1Label),
    stat2Value: textValue('stat2Value', ''),
    stat2Label: textValue('stat2Label', DEFAULT_HOMEPAGE_SETTINGS.stat2Label),
    stat3Value: textValue('stat3Value', ''),
    stat3Label: textValue('stat3Label', DEFAULT_HOMEPAGE_SETTINGS.stat3Label),
    featuredArticleIds: ids,
  };
}

export async function GET(request: NextRequest) {
  const admin = await getAdminUser(request);
  if (!admin) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  }

  return NextResponse.json({
    ready: await homepageSettingsReady(),
    settings: await getHomepageSettings(),
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
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const value = sanitizeHomepageSettings(body);

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
    return NextResponse.json({ error: 'Gagal menyimpan pengaturan beranda' }, { status: 500 });
  }
}
