import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CalendarDays,
  Clock3,
  Leaf,
  Newspaper,
  PenTool,
  Sparkles,
  ShoppingBag,
  Video,
} from 'lucide-react';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { posts } from '@/db/schema';
import { getHomepageSettings } from '@/lib/homepage-settings';

export const dynamic = 'force-dynamic';

function articleHref(slug: string) {
  return `/literasi/artikel/${slug}`;
}

function formatPublishedDate(value: Date | null) {
  if (!value) return '';

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
}

export default async function HomePage() {
  const settings = await getHomepageSettings();

  const latestPublished = await db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      excerpt: posts.excerpt,
      type: posts.type,
      featuredImage: posts.featuredImage,
      publishedAt: posts.publishedAt,
      readingTime: posts.readingTime,
    })
    .from(posts)
    .where(and(eq(posts.status, 'published'), eq(posts.type, 'article')))
    .orderBy(desc(posts.publishedAt))
    .limit(8);

  let featured = latestPublished.slice(0, 3);

  if (settings.featuredArticleIds.length > 0) {
    const selected = await db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        excerpt: posts.excerpt,
        type: posts.type,
        featuredImage: posts.featuredImage,
        publishedAt: posts.publishedAt,
        readingTime: posts.readingTime,
      })
      .from(posts)
      .where(
        and(
          eq(posts.status, 'published'),
          inArray(posts.id, settings.featuredArticleIds)
        )
      );

    const order = new Map(settings.featuredArticleIds.map((id, index) => [id, index]));
    featured = selected.sort(
      (a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99)
    );
  }

  const stats = [
    [settings.stat1Value, settings.stat1Label],
    [settings.stat2Value, settings.stat2Label],
    [settings.stat3Value, settings.stat3Label],
  ].filter(([value]) => Boolean(value));

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
              <Link
                href={settings.heroPrimaryHref}
                className="inline-flex items-center gap-2 rounded-full bg-[#f3d43a] px-6 py-3.5 text-sm font-bold text-[#073c29] transition-all hover:-translate-y-0.5 hover:bg-[#f6dc55]"
              >
                {settings.heroPrimaryLabel}
                <ArrowRight size={16} />
              </Link>
              <Link
                href={settings.heroSecondaryHref}
                className="inline-flex items-center gap-2 rounded-full border border-white/35 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:border-[#e4c72f] hover:text-[#f3dc55]"
              >
                {settings.heroSecondaryLabel}
                <ArrowRight size={15} />
              </Link>
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

      <section className="relative overflow-hidden bg-[#f5f3ea] py-20 sm:py-24">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.34]"
          aria-hidden="true"
          style={{
            backgroundImage:
              'linear-gradient(rgba(7,91,58,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(7,91,58,.035) 1px, transparent 1px)',
            backgroundSize: '62px 62px',
          }}
        />
        <div className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full border border-[#c9ad24]/15" aria-hidden="true" />

        <div className="relative mx-auto max-w-[1450px] px-5 sm:px-8 lg:px-12">
          <div className="mb-10 grid gap-6 border-b border-[#d8ddd2] pb-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="flex items-start gap-5 sm:gap-7">
              <span className="hidden font-serif text-6xl font-bold leading-none text-[#075b3a]/10 sm:block" aria-hidden="true">
                01
              </span>
              <div>
                <div className="flex items-center gap-3">
                  <span className="h-[2px] w-8 bg-[#d0af27]" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#977e20]">
                    Kabar terbaru dari pondok
                  </p>
                </div>
                <h2 className="mt-3 font-serif text-[clamp(2.35rem,4vw,4.35rem)] font-bold leading-none tracking-[-0.04em] text-[#163d2c]">
                  Hari Ini di Mahida
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-[#68746c] sm:text-base">
                  Catatan terbaru tentang ilmu, kegiatan, karya, dan kehidupan yang tumbuh di lingkungan Mahida.
                </p>
              </div>
            </div>

            <Link
              href="/literasi/artikel"
              className="group inline-flex w-fit items-center gap-3 rounded-full border border-[#bac8bd] bg-[#fffef9]/70 px-5 py-3 text-sm font-bold text-[#075b3a] transition-colors hover:border-[#075b3a] hover:bg-[#fffef9]"
            >
              Lihat semua kabar
              <span className="grid h-7 w-7 place-items-center rounded-full bg-[#075b3a] text-white transition-transform group-hover:translate-x-0.5">
                <ArrowRight size={14} />
              </span>
            </Link>
          </div>

          {latestPublished.length === 0 ? (
            <div className="grid min-h-[390px] place-items-center border border-[#d7ddd2] bg-[#fffef9]/80 px-6 text-center">
              <div className="max-w-md">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#e9efe7] text-[#075b3a]">
                  <Newspaper size={24} />
                </div>
                <h3 className="mt-5 font-serif text-2xl font-bold text-[#173d2d]">Ruang kabar sedang disiapkan</h3>
                <p className="mt-3 text-sm leading-7 text-[#707a73]">
                  Artikel terbaru yang diterbitkan melalui Admin Panel akan tampil otomatis di bagian ini.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.48fr)_minmax(390px,.82fr)]">
              <Link
                href={articleHref(latestPublished[0].slug)}
                className="group relative min-h-[520px] overflow-hidden bg-[#0b4933] text-white shadow-[0_25px_70px_rgba(19,61,43,0.13)] sm:min-h-[590px]"
                style={{ borderRadius: '4px 88px 4px 4px' }}
              >
                {latestPublished[0].featuredImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={latestPublished[0].featuredImage}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.025]"
                  />
                ) : (
                  <div className="absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_74%_27%,rgba(228,199,47,.22),transparent_22%),linear-gradient(145deg,#0b6845_0%,#06452f_48%,#082f23_100%)]">
                    <div className="absolute -right-16 top-10 h-80 w-80 rounded-full border border-white/10" />
                    <div className="absolute right-14 top-28 h-48 w-48 rounded-full border border-[#e4c72f]/25" />
                    <Image
                      src="/brand/mahida-logo.webp"
                      alt=""
                      width={270}
                      height={270}
                      className="absolute right-10 top-1/2 h-56 w-56 -translate-y-1/2 object-contain opacity-[0.16] grayscale sm:right-20 sm:h-72 sm:w-72"
                    />
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-[#061f17]/95 via-[#092d22]/38 to-[#062f22]/10" />
                <div className="absolute inset-x-0 top-0 flex items-center justify-between p-6 sm:p-8">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-[#092f24]/45 px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-md">
                    <Sparkles size={12} className="text-[#efd447]" />
                    Sorotan utama
                  </span>
                  <span className="font-serif text-5xl font-bold text-white/18" aria-hidden="true">01</span>
                </div>

                <div className="absolute inset-x-0 bottom-0 p-6 sm:p-9 lg:p-11">
                  <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/67">
                    {latestPublished[0].publishedAt && (
                      <time dateTime={new Date(latestPublished[0].publishedAt).toISOString()} className="inline-flex items-center gap-2">
                        <Calendar size={14} className="text-[#efd447]" />
                        {formatPublishedDate(latestPublished[0].publishedAt)}
                      </time>
                    )}
                    <span className="inline-flex items-center gap-2">
                      <Clock3 size={14} className="text-[#efd447]" />
                      {latestPublished[0].readingTime ? `${latestPublished[0].readingTime} menit baca` : 'Artikel Mahida'}
                    </span>
                  </div>
                  <h3 className="max-w-4xl font-serif text-[clamp(2rem,4vw,4.25rem)] font-bold leading-[1.05] tracking-[-0.035em] text-[#fffef8] transition-colors group-hover:text-[#f2da53]">
                    {latestPublished[0].title}
                  </h3>
                  {latestPublished[0].excerpt && (
                    <p className="mt-5 max-w-2xl text-sm leading-7 text-white/68 sm:text-base sm:leading-8">
                      {latestPublished[0].excerpt}
                    </p>
                  )}
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#f2d844]">
                    Baca selengkapnya <ArrowRight size={16} />
                  </span>
                </div>
              </Link>

              <div className="flex min-h-[520px] flex-col border border-[#d8ddd2] bg-[#fffef9] sm:min-h-[590px]">
                <div className="flex items-center justify-between border-b border-[#e2e6de] px-6 py-5 sm:px-7">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-[#eaf0e7] text-[#075b3a]">
                      <Newspaper size={17} />
                    </span>
                    <div>
                      <p className="font-serif text-lg font-bold text-[#173d2d]">Pembaruan Lainnya</p>
                      <p className="text-[10px] uppercase tracking-[0.16em] text-[#929b94]">Dari ruang redaksi</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#9a8428]">TERBARU</span>
                </div>

                <div className="flex flex-1 flex-col divide-y divide-[#e4e7e0]">
                  {latestPublished.slice(1, 4).map((item, index) => (
                    <Link
                      key={item.id}
                      href={articleHref(item.slug)}
                      className="group grid flex-1 grid-cols-[44px_1fr_auto] gap-4 px-5 py-6 transition-colors hover:bg-[#f5f6ef] sm:px-7"
                    >
                      <span className="font-serif text-3xl font-bold leading-none text-[#075b3a]/16 transition-colors group-hover:text-[#c2a322]">
                        {String(index + 2).padStart(2, '0')}
                      </span>
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#9a8428]">
                          Artikel
                          {item.publishedAt && (
                            <>
                              <span className="h-1 w-1 rounded-full bg-[#cbd1c8]" />
                              <time dateTime={new Date(item.publishedAt).toISOString()} className="font-medium normal-case tracking-normal text-[#8b938d]">
                                {formatPublishedDate(item.publishedAt)}
                              </time>
                            </>
                          )}
                        </span>
                        <span className="mt-2 block font-serif text-xl font-bold leading-snug text-[#254536] transition-colors group-hover:text-[#075b3a] sm:text-[1.35rem]">
                          {item.title}
                        </span>
                        {item.excerpt && (
                          <span className="mt-2 line-clamp-2 block text-xs leading-6 text-[#7a837c]">
                            {item.excerpt}
                          </span>
                        )}
                      </span>
                      <span className="mt-1 grid h-8 w-8 place-items-center rounded-full border border-[#d7ddd4] text-[#075b3a] transition-all group-hover:border-[#075b3a] group-hover:bg-[#075b3a] group-hover:text-white">
                        <ArrowRight size={13} />
                      </span>
                    </Link>
                  ))}

                  {latestPublished.length === 1 && (
                    <div className="grid flex-1 place-items-center px-7 py-10 text-center">
                      <div>
                        <p className="font-serif text-xl font-bold text-[#294b3b]">Kabar berikutnya akan segera hadir.</p>
                        <p className="mt-2 text-sm leading-6 text-[#7a837d]">Artikel baru akan tersusun otomatis berdasarkan waktu terbit.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="mt-5 grid overflow-hidden border border-[#d6dcd1] bg-[#fffef9]/85 md:grid-cols-[1fr_auto] md:items-center">
            <div className="px-6 py-5 sm:px-8">
              <p className="font-serif text-lg font-bold text-[#244735]">Ikuti denyut kehidupan Mahida dari dekat.</p>
              <p className="mt-1 text-xs leading-6 text-[#78827a]">Berita, jadwal kegiatan, dan dokumentasi pondok tersusun dalam ruangnya masing-masing.</p>
            </div>
            <nav className="grid grid-cols-3 border-t border-[#e1e5de] md:border-l md:border-t-0" aria-label="Jelajahi kabar Mahida">
              {[
                { label: 'Berita', href: '/berita', icon: Newspaper },
                { label: 'Agenda', href: '/agenda', icon: CalendarDays },
                { label: 'Media', href: '/media', icon: Video },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="group flex min-w-[108px] flex-col items-center justify-center gap-2 border-l border-[#e1e5de] px-5 py-5 text-xs font-bold text-[#52675b] first:border-l-0 hover:bg-[#075b3a] hover:text-white md:min-w-[126px]"
                >
                  <item.icon size={17} className="text-[#a88e25] group-hover:text-[#efd447]" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </section>

      <section className="bg-[#fffef9] py-24">
        <div className="mx-auto grid max-w-[1450px] items-center gap-12 px-5 sm:px-8 lg:grid-cols-[.92fr_1.08fr] lg:px-12 xl:gap-20">
          <div className="relative min-h-[560px] overflow-hidden bg-[#edf2e8]" style={{ borderRadius: '140px 24px 140px 24px' }}>
            {settings.aboutImageUrl ? (
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

            {stats.length > 0 && (
              <div className="mt-9 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
                {stats.map(([value, label]) => (
                  <div key={label} className="border-t-2 border-[#e4c72f] pt-4">
                    <span className="font-serif text-3xl font-bold text-[#075b3a]">{value}</span>
                    <p className="mt-1 text-sm text-[#778079]">{label}</p>
                  </div>
                ))}
              </div>
            )}

            <Link href="/tentang/profil" className="mt-10 inline-flex items-center gap-2 rounded-full bg-[#075b3a] px-6 py-3.5 text-sm font-bold text-white">
              Mengenal Mahida
              <ArrowRight size={16} />
            </Link>
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
            <Link href="/literasi/artikel" className="inline-flex items-center gap-2 text-sm font-semibold text-white/75 hover:text-[#f3dc55]">
              Jelajahi Artikel <ArrowRight size={15} />
            </Link>
          </div>

          {featured.length === 0 ? (
            <div className="border border-white/12 bg-white/5 p-9 text-sm text-white/60">
              Belum ada bacaan pilihan. Admin dapat memilih artikel setelah artikel diterbitkan.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {featured.map((article, index) => (
                <article key={article.id} className="group relative min-h-[390px] overflow-hidden border border-white/12 bg-white/[0.045] p-7">
                  <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full border border-[#e4c72f]/20" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#e4c72f]">
                    Pilihan {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="mt-10 grid h-20 w-20 place-items-center rounded-full bg-white/[0.07] text-[#f1d63d]">
                    <PenTool size={27} />
                  </div>
                  <h3 className="mt-8 font-serif text-2xl font-bold leading-snug text-white group-hover:text-[#f3dc55]">
                    <Link href={articleHref(article.slug)}>{article.title}</Link>
                  </h3>
                  {article.excerpt && (
                    <p className="mt-4 line-clamp-3 text-sm leading-7 text-white/60">{article.excerpt}</p>
                  )}
                  <div className="absolute bottom-6 left-7 right-7 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-white/45">
                    <span>{article.readingTime ? `${article.readingTime} menit baca` : 'Artikel'}</span>
                    <ArrowRight size={15} className="text-[#e4c72f]" />
                  </div>
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
            {[
              { label: 'Karya', href: '/karya', icon: PenTool, desc: 'Tulisan, terjemahan, sastra, dan karya santri.' },
              { label: 'Maktabah', href: '/maktabah', icon: BookOpen, desc: 'Kitab, buku, kajian, dan ruang ilmu.' },
              { label: 'Media', href: '/media', icon: Video, desc: 'Video, galeri, dokumentasi, dan cerita visual.' },
              { label: 'Kegiatan', href: '/agenda', icon: CalendarDays, desc: 'Agenda, berita, prestasi, dan perjalanan Mahida.' },
            ].map((item, index) => (
              <Link
                key={item.label}
                href={item.href}
                className="group relative min-h-[275px] overflow-hidden border border-[#dfe4d9] bg-[#fffef9] p-7 transition-all hover:-translate-y-1 hover:shadow-[0_18px_48px_rgba(16,56,39,0.1)]"
              >
                <span className="absolute right-5 top-4 font-serif text-5xl font-bold text-[#edf1e9]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="grid h-12 w-12 place-items-center rounded-full bg-[#edf2e9] text-[#075b3a]">
                  <item.icon size={22} />
                </div>
                <h3 className="mt-8 font-serif text-2xl font-bold text-[#173d2d]">{item.label}</h3>
                <p className="mt-3 text-sm leading-7 text-[#6f7871]">{item.desc}</p>
                <span className="absolute bottom-6 left-7 inline-flex items-center gap-2 text-sm font-bold text-[#075b3a]">
                  Jelajahi <ArrowRight size={14} />
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-12 overflow-hidden bg-[#075b3a] text-white" style={{ borderRadius: '34px 110px 34px 34px' }}>
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
          </div>
        </div>
      </section>
    </>
  );
}
