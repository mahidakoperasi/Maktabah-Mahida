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
import { driveIdFromUrl } from '@/lib/media-links';

export const dynamic = 'force-dynamic';

function articleHref(slug: string) {
  return `/karya/artikel/${slug}`;
}

export default async function HomePage() {
  const settings = await getHomepageSettings();
  const menu = await getPublicMenu();
  const menuPaths = new Set(menu.flatMap((item) => [item.path, ...item.children.map((child) => child.path)]));
  const articlesEnabled = Boolean(await getPublicPage('/karya/artikel'));
  const explore = await Promise.all(menu.filter((item) => item.path !== '/').slice(0, 4).map(async (item) => ({
    ...item,
    intro: (await getPublicPage(item.path))?.intro,
    icon: item.path === '/karya' ? PenTool : item.path === '/media' ? Video : item.path === '/koperasi' ? ShoppingBag : BookOpen,
  })));

  const latestPublished = articlesEnabled ? await db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      excerpt: posts.excerpt,
      type: posts.type,
      publishedAt: posts.publishedAt,
      readingTime: posts.readingTime,
      featuredImage: posts.featuredImage,
    })
    .from(posts)
    .where(and(eq(posts.type, 'article'), eq(posts.status, 'published')))
    .orderBy(desc(posts.publishedAt))
    .limit(8) : [];

  let featured = latestPublished.slice(0, 3);

  if (articlesEnabled && settings.featuredArticleIds.length > 0) {
    const selected = await db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        excerpt: posts.excerpt,
        type: posts.type,
        publishedAt: posts.publishedAt,
        readingTime: posts.readingTime,
        featuredImage: posts.featuredImage,
      })
      .from(posts)
      .where(
        and(
          eq(posts.type, 'article'),
          eq(posts.status, 'published'),
          inArray(posts.id, settings.featuredArticleIds)
        )
      );

    const order = new Map(settings.featuredArticleIds.map((id, index) => [id, index]));
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
      <section className="relative -mt-[88px] overflow-hidden bg-[#075b3a] pt-[88px] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_22%,rgba(20,154,99,0.14),transparent_32%),radial-gradient(circle_at_88%_74%,rgba(0,33,22,0.26),transparent_34%)]" />
        <div
          className="absolute inset-0 opacity-[0.055]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.42) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.42) 1px, transparent 1px)',
            backgroundSize: '54px 54px',
          }}
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[78%] overflow-hidden" aria-hidden="true">
          <div
            className="absolute bottom-[-7%] left-[-4%] h-[112%] w-[70%] opacity-[0.56] mix-blend-screen"
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
              sizes="70vw"
              className="object-contain object-bottom grayscale contrast-125 brightness-125"
            />
          </div>

          <div className="absolute inset-0 bg-gradient-to-r from-[#063f2d]/56 via-[#075b3a]/12 to-[#103d2d]/20" />
          <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#08734b]/46 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#042b1e]/76 to-transparent" />
        </div>

        <div className="relative mx-auto grid min-h-[760px] max-w-[1500px] items-center gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[.98fr_1.02fr] lg:px-12 lg:pb-14 lg:pt-20 xl:gap-16">
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

            <h1 className="font-serif text-[clamp(3rem,5.15vw,5.35rem)] font-bold leading-[0.98] tracking-[-0.042em] text-[#fffef9]">
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
                className="inline-flex items-center gap-2 rounded-full bg-[#f3d43a] px-6 py-3.5 text-sm font-bold text-[#073c29] transition-all hover:-translate-y-0.5 hover:bg-[#f6dc55]"
              >
                {settings.heroPrimaryLabel}
                <ArrowRight size={16} />
              </Link>}
              {menuPaths.has(settings.heroSecondaryHref) && <Link
                href={settings.heroSecondaryHref}
                className="inline-flex items-center gap-2 rounded-full border border-white/35 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:border-[#e4c72f] hover:text-[#f3dc55]"
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

          <div className="relative z-10 mx-auto min-h-[500px] w-full max-w-[590px] lg:min-h-[570px] lg:translate-x-2">
            <div className="absolute -right-10 top-10 h-[410px] w-[410px] rounded-full border border-[#d4b13f]/28" />

            <div
              className="absolute inset-x-3 inset-y-0 overflow-hidden border border-white/12 bg-[#fbfaf2] shadow-[0_28px_80px_rgba(1,35,23,0.20)]"
              style={{
                borderRadius: '168px 168px 42px 168px',
                clipPath: 'polygon(0 0, 100% 0, 100% 88%, 88% 100%, 0 100%)',
              }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(7,91,58,0.035),transparent_38%),linear-gradient(145deg,#fffef8_0%,#f1f3eb_100%)]" />

              <div className="absolute inset-0 flex items-center justify-center px-10 py-12">
                <div className="relative text-center">
                  <div className="absolute left-1/2 top-1/2 h-[390px] w-[285px] -translate-x-1/2 -translate-y-1/2 rounded-[48%] border border-[#b99a3c]/40" />
                  <Image
                    src="/brand/mahida-logo.webp"
                    alt="Logo Pondok Pesantren Mahida"
                    width={280}
                    height={280}
                    priority
                    className="relative mx-auto h-[245px] w-[245px] object-contain drop-shadow-[0_22px_34px_rgba(4,62,39,0.12)]"
                  />
                  <p className="mt-4 font-arabic text-4xl text-[#075b3a]">مَنْبَعُ الْهِدَايَةِ</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.27em] text-[#7d867e]">
                    Sumber Petunjuk
                  </p>
                </div>
              </div>
            </div>
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
            {menuPaths.has('/karya/artikel') && <Link href="/karya/artikel" className="inline-flex items-center gap-2 text-sm font-bold text-[#075b3a]">
              Semua Artikel <ArrowRight size={15} />
            </Link>}
          </div>

          {latestPublished.length === 0 ? (
            <div className="border border-[#dfe4d9] bg-[#fffef9] p-10 text-sm text-[#777f78]">
              Belum ada konten terbit. Konten terbaru dari Admin Panel akan tampil di sini.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {latestPublished.slice(0, 4).map((item, index) => (
                <Link
                  key={item.id}
                  href={articleHref(item.slug)}
                  className="group overflow-hidden border border-[#dde3d8] bg-[#fffef9] transition-all hover:-translate-y-1 hover:shadow-[0_18px_48px_rgba(16,56,39,0.11)]"
                >
                  <div className="relative aspect-[16/9] overflow-hidden bg-[#edf2e9]">
                    {item.featuredImage && !driveIdFromUrl(item.featuredImage) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.featuredImage}
                        alt=""
                        className="h-full w-full object-contain object-center p-2 transition-transform duration-500 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="absolute inset-0 grid place-items-center text-[#759081]">
                        <PenTool size={28} strokeWidth={1.5} />
                      </div>
                    )}
                    <span className="absolute right-4 top-3 font-serif text-4xl font-bold text-white/80 drop-shadow">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="relative min-h-[210px] p-6">
                    <span className="inline-flex bg-[#edf2e9] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#50705f]">
                      {item.type === 'article' ? 'Artikel' : item.type}
                    </span>
                    <h3 className="mt-5 font-serif text-xl font-bold leading-snug text-[#203d31] transition-colors group-hover:text-[#075b3a]">
                      {item.title}
                    </h3>
                    <div className="absolute bottom-5 left-6 right-6 flex items-center justify-between border-t border-[#e8ebe3] pt-4 text-xs text-[#8a918a]">
                      <span>
                        {item.publishedAt
                          ? new Date(item.publishedAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : ''}
                      </span>
                      <ArrowRight size={14} className="text-[#075b3a]" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-[#fffef9] py-24">
        <div className="mx-auto grid max-w-[1450px] items-center gap-12 px-5 sm:px-8 lg:grid-cols-[.92fr_1.08fr] lg:px-12 xl:gap-20">
          <div className="relative min-h-[560px] overflow-hidden bg-[#edf2e8]" style={{ borderRadius: '140px 24px 140px 24px' }}>
            {settings.aboutImageUrl && !driveIdFromUrl(settings.aboutImageUrl) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={settings.aboutImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 grid place-items-center">
                <div className="text-center">
                  <Image src="/brand/mahida-logo.webp" alt="" width={190} height={190} className="mx-auto h-44 w-44 object-contain opacity-95" />
                  <p className="mt-5 font-arabic text-3xl text-[#075b3a]">مَنْبَعُ الْهِدَايَةِ</p>
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#839087]">Sumber Petunjuk</p>
                </div>
              </div>
            )}
            <div className="absolute -right-16 bottom-16 h-7 w-[330px] -rotate-[13deg] bg-[#e4c72f]" />
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
              <h2 className="mt-2 font-serif text-4xl font-bold tracking-[-0.03em] md:text-5xl">Bacaan Pilihan</h2>
            </div>
            {menuPaths.has('/karya/artikel') && <Link href="/karya/artikel" className="inline-flex items-center gap-2 text-sm font-semibold text-white/75 hover:text-[#f3dc55]">
              Jelajahi Artikel <ArrowRight size={15} />
            </Link>}
          </div>

          {featured.length === 0 ? (
            <div className="border border-white/12 bg-white/5 p-9 text-sm text-white/60">
              Belum ada bacaan pilihan. Admin dapat memilih artikel setelah artikel diterbitkan.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {featured.map((article, index) => (
                <article key={article.id} className="group overflow-hidden border border-white/12 bg-white/[0.045]">
                  <Link href={articleHref(article.slug)} className="block">
                    <div className="relative aspect-[16/9] overflow-hidden bg-white/[0.06]">
                      {article.featuredImage && !driveIdFromUrl(article.featuredImage) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={article.featuredImage}
                          alt=""
                          className="h-full w-full object-contain object-center p-2 opacity-95 transition-all duration-500 group-hover:scale-[1.02] group-hover:opacity-100"
                        />
                      ) : (
                        <div className="absolute inset-0 grid place-items-center text-[#f1d63d]">
                          <PenTool size={32} strokeWidth={1.5} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0c3b2b]/55 via-transparent to-transparent" />
                      <span className="absolute left-5 top-5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#f3dc55]">
                        Pilihan {String(index + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <div className="relative min-h-[260px] p-7">
                      <h3 className="font-serif text-2xl font-bold leading-snug text-white transition-colors group-hover:text-[#f3dc55]">
                        {article.title}
                      </h3>
                      {article.excerpt && (
                        <p className="mt-4 line-clamp-3 text-sm leading-7 text-white/60">{article.excerpt}</p>
                      )}
                      <div className="absolute bottom-6 left-7 right-7 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-white/45">
                        <span>{article.readingTime ? `${article.readingTime} menit baca` : 'Artikel'}</span>
                        <ArrowRight size={15} className="text-[#e4c72f]" />
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
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
                className="group relative min-h-[275px] overflow-hidden border border-[#dfe4d9] bg-[#fffef9] p-7 transition-all hover:-translate-y-1 hover:shadow-[0_18px_48px_rgba(16,56,39,0.1)]"
              >
                <span className="absolute right-5 top-4 font-serif text-5xl font-bold text-[#edf1e9]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="grid h-12 w-12 place-items-center rounded-full bg-[#edf2e9] text-[#075b3a]">
                  <item.icon size={22} />
                </div>
                <h3 className="mt-8 font-serif text-2xl font-bold text-[#173d2d]">{item.label}</h3>
                <p className="mt-3 text-sm leading-7 text-[#6f7871]">{item.intro || 'Informasi resmi akan tersedia setelah diisi admin.'}</p>
                <span className="absolute bottom-6 left-7 inline-flex items-center gap-2 text-sm font-bold text-[#075b3a]">
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
