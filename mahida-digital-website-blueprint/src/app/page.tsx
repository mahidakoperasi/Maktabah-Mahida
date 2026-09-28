import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Leaf,
  PenTool,
  ShoppingBag,
  Video,
} from 'lucide-react';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { posts } from '@/db/schema';
import { getHomepageSettings } from '@/lib/homepage-settings';
import { getPublicMenu, getPublicPage } from '@/lib/cms';
import { driveThumbnailUrl, publicImageUrl } from '@/lib/media-links';
import ArticleCover from '@/components/ArticleCover';
import HomepageAboutImage from '@/components/HomepageAboutImage';
import HeroWidgetImage from '@/components/HeroWidgetImage';
import ContentCarousel from '@/components/ContentCarousel';
import { karyaPostLabel, karyaPostPath } from '@/lib/karya-post';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const settings = await getHomepageSettings();
  const widgetImage = driveThumbnailUrl(settings.heroWidgetImageUrl) ?? '/brand/mahida-logo.webp';
  const menu = await getPublicMenu();
  const menuPaths = new Set(menu.flatMap((item) => [item.path, ...item.children.map((child) => child.path)]));
  const explore = await Promise.all(menu.filter((item) => item.path !== '/').slice(0, 4).map(async (item) => ({
    ...item,
    intro: (await getPublicPage(item.path))?.intro,
    icon: item.path === '/karya' ? PenTool : item.path === '/media' ? Video : item.path === '/koperasi' ? ShoppingBag : BookOpen,
  })));

  const latestPublished = (await db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      excerpt: posts.excerpt,
      type: posts.type,
      karyaCategory: posts.karyaCategory,
      publishedAt: posts.publishedAt,
      readingTime: posts.readingTime,
      featuredImage: posts.featuredImage,
    })
    .from(posts)
    .where(and(inArray(posts.type, ['article', 'essay', 'work']), eq(posts.status, 'published')))
    .orderBy(desc(posts.publishedAt), desc(posts.id))
    .limit(25)).flatMap((row) => {
      const href = karyaPostPath(row);
      return href && menuPaths.has(href.slice(0, href.lastIndexOf('/'))) ? [{ ...row, href }] : [];
    });

  let featured = latestPublished.slice(0, 3);

  if (settings.featuredWorkIds.length > 0) {
    const selected = (await db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        excerpt: posts.excerpt,
        type: posts.type,
        karyaCategory: posts.karyaCategory,
        publishedAt: posts.publishedAt,
        readingTime: posts.readingTime,
        featuredImage: posts.featuredImage,
      })
      .from(posts)
      .where(
        and(
          inArray(posts.type, ['article', 'essay', 'work']),
          eq(posts.status, 'published'),
          inArray(posts.id, settings.featuredWorkIds)
        )
      )).flatMap((row) => {
        const href = karyaPostPath(row);
        return href && menuPaths.has(href.slice(0, href.lastIndexOf('/'))) ? [{ ...row, href }] : [];
      });

    const order = new Map(settings.featuredWorkIds.map((id, index) => [id, index]));
    featured = selected.sort(
      (a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99)
    );
  }

  const heroEyebrowParts = settings.heroEyebrow
    .split('•')
    .map((part) => part.trim())
    .filter(Boolean);

  return (
    <>
      <section className="relative -mt-[76px] overflow-hidden bg-[#075b3a] pt-[76px] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_22%,rgba(20,154,99,0.14),transparent_32%),radial-gradient(circle_at_88%_74%,rgba(0,33,22,0.26),transparent_34%)]" />
        <div
          className="absolute inset-0 opacity-[0.055]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.42) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.42) 1px, transparent 1px)',
            backgroundSize: '54px 54px',
          }}
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] overflow-hidden sm:h-[70%] lg:h-[78%]" aria-hidden="true">
          <div
            className="absolute bottom-[-7%] left-[-12%] h-[112%] w-[115%] opacity-[0.62] mix-blend-screen sm:left-[-4%] sm:w-[78%] lg:w-[70%]"
            style={{
              WebkitMaskImage:
                'linear-gradient(to top, #000 14%, #000 72%, rgba(0,0,0,.72) 88%, transparent 100%)',
              maskImage:
                'linear-gradient(to top, #000 14%, #000 72%, rgba(0,0,0,.72) 88%, transparent 100%)',
            }}
          >
            <Image
              src="/brand/pondok-mahida.png"
              alt=""
              fill
              priority
              unoptimized
              sizes="(max-width: 640px) 115vw, 70vw"
              className="object-contain object-bottom grayscale contrast-125 brightness-125"
            />
          </div>

          <div className="absolute inset-0 bg-gradient-to-r from-[#063f2d]/56 via-[#075b3a]/12 to-[#103d2d]/20" />
          <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#08734b]/46 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#042b1e]/76 to-transparent" />
        </div>

        <div className="relative mx-auto grid max-w-[1500px] items-center gap-9 px-4 py-12 sm:px-8 sm:py-16 lg:min-h-[760px] lg:grid-cols-[minmax(0,.98fr)_minmax(0,1.02fr)] lg:px-12 lg:pb-14 lg:pt-20 xl:gap-16">
          <div className="relative z-20 max-w-[690px] lg:-translate-y-2">
            <div className="mb-6 flex items-center gap-3">
              <span className="h-[2px] w-8 bg-[#e4c72f]" />
              <div className="flex flex-wrap items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.20em] text-white/64 sm:text-xs">
                {heroEyebrowParts.map((part, index) => (
                  <span key={part} className="inline-flex items-center gap-2.5">
                    {index > 0 && (
                      <Leaf
                        size={10}
                        strokeWidth={1.8}
                        className="-rotate-[18deg] text-[#d9bd37]"
                        aria-hidden="true"
                      />
                    )}
                    <span>{part}</span>
                  </span>
                ))}
              </div>
            </div>

            <h1 className="font-serif text-[clamp(2.15rem,6vw,5.35rem)] font-bold leading-[1.04] tracking-[-0.035em] text-[#fffef9] lg:leading-[0.98]">
              <span className="block">{settings.heroTitleLine1}</span>
              <span className="mt-2 block">{settings.heroTitleLine2}</span>
              <span className="mt-2 inline-block text-[#e4c72f]">{settings.heroTitleAccent}</span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-8 text-white/72 sm:text-lg">
              {settings.heroDescription}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              {menuPaths.has(settings.heroPrimaryHref) && <Link
                href={settings.heroPrimaryHref}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#f3d43a] px-5 py-3 text-center text-sm font-bold text-[#073c29] transition-all hover:-translate-y-0.5 hover:bg-[#f6dc55]"
              >
                {settings.heroPrimaryLabel}
                <ArrowRight size={16} />
              </Link>}
              {menuPaths.has(settings.heroSecondaryHref) && <Link
                href={settings.heroSecondaryHref}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/35 px-5 py-3 text-center text-sm font-semibold text-white transition-all hover:border-[#e4c72f] hover:text-[#f3dc55]"
              >
                {settings.heroSecondaryLabel}
                <ArrowRight size={15} />
              </Link>}
            </div>

            <div className="mt-10 flex items-center gap-3 text-sm italic text-white/52">
              <span className="h-[2px] w-8 bg-[#e4c72f]" />
              <span className="font-serif">Ilmu hari ini, peradaban esok.</span>
            </div>
          </div>

          <div className="relative z-10 mx-auto flex min-h-[210px] w-full max-w-[590px] items-center justify-end sm:min-h-[340px] lg:min-h-[570px]">
            <div className="absolute -right-5 top-1/2 hidden h-[410px] w-[410px] -translate-y-1/2 rounded-full border border-[#d4b13f]/28 lg:block" />
            {settings.heroWidgetLayout === 'photo' ? (
              <div className="hero-logo-widget relative h-[min(76vw,320px)] w-[min(58vw,240px)] overflow-hidden rounded-3xl border border-white/25 bg-[#073e2b]/50 p-2 shadow-[0_24px_55px_rgba(1,35,23,0.22)] sm:h-[390px] sm:w-[300px] lg:h-[470px] lg:w-[min(32vw,390px)] lg:p-3">
                <HeroWidgetImage src={widgetImage} photo />
              </div>
            ) : (
              <div className="hero-logo-widget relative flex min-h-[180px] w-[min(62vw,240px)] flex-col items-center justify-center rounded-3xl border border-white/20 bg-[#fbfaf2]/95 p-5 text-center shadow-[0_24px_55px_rgba(1,35,23,0.18)] sm:min-h-[290px] sm:w-[300px] lg:min-h-[390px] lg:w-[min(30vw,360px)] lg:p-8">
                <HeroWidgetImage src={widgetImage} photo={false} />
                {settings.heroWidgetArabic && <p className="mt-4 font-arabic text-2xl text-[#075b3a] lg:text-3xl">{settings.heroWidgetArabic}</p>}
                {settings.heroWidgetSubtitle && <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#7d867e]">{settings.heroWidgetSubtitle}</p>}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="bg-[#f6f5ee] py-20">
        <div className="mx-auto max-w-[1450px] px-5 sm:px-8 lg:px-12">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#a18725]">Terbaru dari Mahida</p>
              <h2 className="mt-2 font-serif text-3xl font-bold tracking-[-0.02em] text-[#173d2d] md:text-4xl">
                Hari Ini di Mahida
              </h2>
            </div>
            {menuPaths.has('/karya') && <Link href="/karya" className="inline-flex items-center gap-2 text-sm font-bold text-[#075b3a]">
              Semua Karya <ArrowRight size={15} />
            </Link>}
          </div>

          {latestPublished.length === 0 ? (
            <div className="empty-state text-sm">
              Belum ada konten terbit. Konten terbaru dari Admin Panel akan tampil di sini.
            </div>
          ) : (
            <ContentCarousel label="Hari Ini di Mahida">
              {latestPublished.slice(0, 4).map((item, index) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="group flex w-full flex-col overflow-hidden border border-[#dde3d8] bg-[#fffef9] transition-all hover:shadow-[0_18px_48px_rgba(16,56,39,0.11)]"
                >
                  <div className="bg-[#edf2e9]">
                    <ArticleCover url={item.featuredImage} />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex bg-[#edf2e9] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#50705f]">
                        {karyaPostLabel(item)}
                      </span>
                      <span className="font-serif text-2xl font-bold text-[#9cae9f]">{String(index + 1).padStart(2, '0')}</span>
                    </div>
                    <h3 className="mt-4 font-serif text-xl font-bold leading-snug text-[#203d31] transition-colors group-hover:text-[#075b3a]">
                      {item.title}
                    </h3>
                    {item.publishedAt && <p className="mt-2 text-xs text-[#8a918a]">
                      {new Date(item.publishedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>}
                    {item.excerpt && <p className="mt-4 line-clamp-3 text-sm leading-6 text-[#657168]">{item.excerpt}</p>}
                    <span className="mt-5 flex justify-end border-t border-[#e8ebe3] pt-3 text-[#075b3a]">
                      <ArrowRight size={14} />
                    </span>
                  </div>
                </Link>
              ))}
            </ContentCarousel>
          )}
        </div>
      </section>

      <section className="bg-[#fffef9] py-24">
        <div className="mx-auto grid max-w-[1450px] items-center gap-12 px-5 sm:px-8 lg:grid-cols-[.92fr_1.08fr] lg:px-12 xl:gap-20">
          <div className="relative min-h-[320px] overflow-hidden rounded-xl bg-[#edf2e8] shadow-md sm:min-h-[420px] lg:min-h-[560px]">
            <HomepageAboutImage src={publicImageUrl(settings.aboutImageUrl)} />
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#a18725]">{settings.aboutEyebrow}</p>
            <h2 className="mt-3 max-w-3xl font-serif text-[clamp(2.4rem,4vw,4.7rem)] font-bold leading-[1.02] tracking-[-0.035em] text-[#173d2d]">
              {settings.aboutTitle}
            </h2>
            <p className="mt-7 max-w-2xl text-base leading-8 text-[#657168] sm:text-lg">
              {settings.aboutDescription}
            </p>

            {menuPaths.has('/tentang/profil') && <Link href="/tentang/profil" className="mt-10 inline-flex items-center gap-2 rounded-full bg-[#075b3a] px-6 py-3.5 text-sm font-bold text-white">
              Mengenal Mahida
              <ArrowRight size={16} />
            </Link>}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#0c3b2b] py-24 text-white">
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1px)', backgroundSize: '26px 26px' }} />
        <div className="relative mx-auto max-w-[1450px] px-5 sm:px-8 lg:px-12">
          <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#e4c72f]">Literasi Mahida</p>
              <h2 className="mt-2 font-serif text-4xl font-bold tracking-[-0.03em] md:text-5xl">{settings.featuredWorkIds.length ? 'Bacaan Pilihan' : 'Bacaan Terbaru'}</h2>
            </div>
            {menuPaths.has('/karya') && <Link href="/karya" className="inline-flex items-center gap-2 text-sm font-semibold text-white/75 hover:text-[#f3dc55]">
              Jelajahi Karya <ArrowRight size={15} />
            </Link>}
          </div>

          {featured.length === 0 ? (
            <div className="empty-state empty-state-dark text-sm">
              Belum ada bacaan pilihan. Admin dapat memilih karya setelah karya diterbitkan.
            </div>
          ) : (
            <ContentCarousel label="Bacaan Pilihan">
              {featured.map((article, index) => (
                <article key={article.id} className="group flex w-full flex-col overflow-hidden border border-white/12 bg-white/[0.045]">
                  <Link href={article.href} className="flex h-full flex-col">
                    <div className="bg-white/[0.06]">
                      <ArticleCover url={article.featuredImage} dark />
                    </div>
                    <div className="flex flex-1 flex-col p-7">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f3dc55]">
                        Pilihan {String(index + 1).padStart(2, '0')}
                      </span>
                      <h3 className="mt-3 font-serif text-2xl font-bold leading-snug text-white transition-colors group-hover:text-[#f3dc55]">
                        {article.title}
                      </h3>
                      {article.publishedAt && <p className="mt-2 text-xs text-white/45">
                        {new Date(article.publishedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>}
                      {article.excerpt && (
                        <p className="mt-4 line-clamp-3 text-sm leading-7 text-white/60">{article.excerpt}</p>
                      )}
                      <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-4 text-xs text-white/45">
                        <span>{article.readingTime ? `${article.readingTime} menit baca` : karyaPostLabel(article)}</span>
                        <ArrowRight size={15} className="text-[#e4c72f]" />
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </ContentCarousel>
          )}
        </div>
      </section>

      <section className="bg-[#f6f5ee] py-24">
        <div className="mx-auto max-w-[1450px] px-5 sm:px-8 lg:px-12">
          <div className="mb-12 max-w-3xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#a18725]">Jelajahi Mahida Digital</p>
            <h2 className="mt-3 font-serif text-4xl font-bold tracking-[-0.03em] text-[#173d2d] md:text-5xl">
              Satu rumah untuk ilmu, karya, dokumentasi, dan khidmah.
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {explore.map((item, index) => (
              <Link
                key={item.id}
                href={item.path}
                className="group relative flex min-h-[275px] flex-col overflow-hidden border border-[#dfe4d9] bg-[#fffef9] p-6 transition-all hover:-translate-y-1 hover:shadow-[0_18px_48px_rgba(16,56,39,0.1)] sm:p-7"
              >
                <span className="absolute right-5 top-4 font-serif text-5xl font-bold text-[#edf1e9]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="grid h-12 w-12 place-items-center rounded-full bg-[#edf2e9] text-[#075b3a]">
                  <item.icon size={22} />
                </div>
                <h3 className="mt-8 font-serif text-2xl font-bold text-[#173d2d]">{item.label}</h3>
                <p className="mt-3 text-sm leading-7 text-[#6f7871]">{item.intro || 'Informasi resmi akan tersedia setelah diisi admin.'}</p>
                <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-bold text-[#075b3a]">
                  Jelajahi <ArrowRight size={14} />
                </span>
              </Link>
            ))}
          </div>

          {menuPaths.has('/koperasi') && <div className="mt-12 overflow-hidden bg-[#075b3a] text-white" style={{ borderRadius: '34px 110px 34px 34px' }}>
            <div className="grid items-center gap-8 px-8 py-10 md:grid-cols-[1fr_auto] lg:px-12">
              <div>
                <div className="mb-3 flex items-center gap-2 text-[#e4c72f]">
                  <ShoppingBag size={18} />
                  <span className="text-[10px] font-bold uppercase tracking-[0.22em]">Koperasi Mahida</span>
                </div>
                <h3 className="font-serif text-3xl font-bold">Khidmah yang tumbuh menjadi kemandirian.</h3>
              </div>
              <Link href="/koperasi" className="inline-flex items-center gap-2 rounded-full bg-[#f3d43a] px-6 py-3 text-sm font-bold text-[#073c29]">
                Kunjungi Koperasi <ArrowRight size={15} />
              </Link>
            </div>
          </div>}
        </div>
      </section>
    </>
  );
}
