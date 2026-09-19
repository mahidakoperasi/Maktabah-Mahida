import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BookOpen, PenTool, Video, ShoppingBag, CalendarDays } from 'lucide-react';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { posts } from '@/db/schema';
import { getHomepageSettings } from '@/lib/homepage-settings';

export const dynamic = 'force-dynamic';

function articleHref(slug: string) {
  return `/literasi/artikel/${slug}`;
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
      publishedAt: posts.publishedAt,
      readingTime: posts.readingTime,
    })
    .from(posts)
    .where(eq(posts.status, 'published'))
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

  return (
    <>
      <section className="relative overflow-hidden bg-[#075b3a] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(18,151,96,0.34),transparent_34%),radial-gradient(circle_at_86%_76%,rgba(2,39,26,0.72),transparent_38%),linear-gradient(120deg,#075b3a_0%,#086d46_48%,#12382a_100%)]" />
        <div
          className="absolute inset-0 opacity-[0.055]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.42) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.42) 1px, transparent 1px)',
            backgroundSize: '54px 54px',
          }}
        />
        <div className="absolute left-[6%] top-10 hidden items-center gap-2 text-[#e4c72f]/60 lg:flex" aria-hidden="true">
          <span className="text-[10px]">★</span>
          <span className="text-[10px]">★</span>
          <span className="text-[10px]">★</span>
          <span className="text-[10px]">★</span>
          <span className="text-[10px]">★</span>
        </div>

        <div className="relative mx-auto grid min-h-[690px] max-w-[1500px] items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.04fr_.96fr] lg:px-12 lg:py-20 xl:gap-16">
          <div className="relative z-10 max-w-[760px]">
            <div className="mb-7 flex items-center gap-3">
              <span className="h-[3px] w-10 -skew-x-[30deg] bg-[#e4c72f]" />
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/58 sm:text-xs">
                {settings.heroEyebrow}
              </p>
            </div>

            <h1 className="font-serif text-[clamp(3.05rem,6vw,6rem)] font-bold leading-[0.98] tracking-[-0.045em] text-[#fffef9]">
              <span className="block">{settings.heroTitleLine1}</span>
              <span className="mt-2 block">{settings.heroTitleLine2}</span>
              <span className="mt-2 inline-block text-[#e4c72f]">{settings.heroTitleAccent}</span>
            </h1>

            <p className="mt-8 max-w-2xl text-base leading-8 text-white/72 sm:text-lg lg:max-w-xl">
              {settings.heroDescription}
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href={settings.heroPrimaryHref}
                className="inline-flex items-center gap-2 bg-[#fffef9] px-6 py-3.5 text-sm font-bold text-[#075b3a] transition-all hover:-translate-y-0.5 hover:bg-white"
              >
                {settings.heroPrimaryLabel}
                <ArrowRight size={16} />
              </Link>
              <Link
                href={settings.heroSecondaryHref}
                className="inline-flex items-center gap-2 border border-white/25 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:border-[#e4c72f] hover:text-[#f3dc55]"
              >
                {settings.heroSecondaryLabel}
                <ArrowRight size={15} />
              </Link>
            </div>

            <div className="mt-12 flex items-center gap-4 text-[10px] font-semibold uppercase tracking-[0.19em] text-white/38">
              <span>Manba&apos;ul Hidayah</span>
              <span className="h-px w-10 bg-white/18" />
              <span>Mahida Digital</span>
            </div>
          </div>

          <div className="relative mx-auto hidden min-h-[530px] w-full max-w-[570px] lg:block">
            <div className="absolute -left-8 top-16 h-[330px] w-[330px] rounded-full border border-white/10" />
            <div className="absolute -right-14 bottom-6 h-[230px] w-[230px] rounded-full border border-[#e4c72f]/18" />

            <div
              className="absolute inset-x-5 inset-y-4 overflow-hidden border border-white/14 bg-[#f5f2e7]"
              style={{
                clipPath: 'polygon(0 0, 100% 0, 100% 84%, 86% 100%, 0 100%)',
                borderTopLeftRadius: '180px',
              }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_52%_42%,rgba(7,91,58,0.06),transparent_34%),linear-gradient(145deg,#f8f6ed_0%,#edf2e8_100%)]" />
              <div className="absolute left-10 top-12 text-[10px] font-bold uppercase tracking-[0.22em] text-[#8a928a]">
                Crest V1 · Mahida
              </div>

              <div className="absolute inset-0 grid place-items-center">
                <div className="relative text-center">
                  <div className="absolute inset-0 scale-[1.45] rounded-full border border-[#075b3a]/7" />
                  <Image
                    src="/brand/mahida-logo.webp"
                    alt="Logo Pondok Pesantren Mahida"
                    width={260}
                    height={260}
                    priority
                    className="relative mx-auto h-[230px] w-[230px] object-contain drop-shadow-[0_20px_35px_rgba(4,62,39,0.12)]"
                  />
                  <p className="mt-5 font-arabic text-3xl text-[#075b3a]">مَنْبَعُ الْهِدَايَةِ</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.26em] text-[#7f887f]">
                    Sumber Petunjuk
                  </p>
                </div>
              </div>

              <div className="absolute -right-16 bottom-20 h-7 w-[310px] -rotate-[13deg] bg-[#e4c72f]" />
              <div className="absolute bottom-5 left-10 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#647168]">
                Belajar · Berkarya · Berkhidmah
              </div>
            </div>

            <div className="absolute -right-1 top-1/2 flex -translate-y-1/2 rotate-90 items-center gap-3 origin-center text-[9px] font-semibold uppercase tracking-[0.28em] text-white/38">
              <span>Salam</span>
              <span className="h-px w-9 bg-[#e4c72f]/70" />
              <span>Kedawung</span>
              <span className="h-px w-9 bg-[#e4c72f]/70" />
              <span>Blitar</span>
            </div>

            <div className="absolute bottom-0 left-0 flex items-center gap-3 text-[10px] uppercase tracking-[0.18em] text-white/35">
              <span className="grid h-7 w-7 place-items-center border border-white/14">01</span>
              <span>Identitas · Ilmu · Khidmah</span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 h-[5px] w-full bg-[#06472e]">
          <div className="h-full w-[32%] -skew-x-[32deg] bg-[#e4c72f]" />
        </div>
      </section>

      <section className="py-14 bg-mahida-50 border-b border-mahida-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 mb-8">
            <div>
              <p className="label mb-2">Terbaru</p>
              <h2 className="heading-lg font-serif text-charcoal">Hari Ini di Mahida</h2>
            </div>
            <Link href="/literasi/artikel" className="text-sm font-semibold text-emerald-forest hover:underline">
              Semua Artikel →
            </Link>
          </div>

          {latestPublished.length === 0 ? (
            <div className="bg-white border border-mahida-200 p-8 text-sm text-warm-gray-500">
              Belum ada konten terbit. Konten terbaru dari Admin Panel akan tampil di sini.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {latestPublished.slice(0, 4).map((item) => (
                <Link key={item.id} href={articleHref(item.slug)} className="group bg-white p-5 border border-mahida-200 hover:border-mahida-300 hover:shadow-elevated transition-all">
                  <span className="category-pill mb-3">{item.type === 'article' ? 'Artikel' : item.type}</span>
                  <h3 className="font-semibold text-charcoal group-hover:text-emerald-forest transition-colors line-clamp-3 mt-3">
                    {item.title}
                  </h3>
                  <div className="mt-3 text-xs text-warm-gray-400">
                    {item.publishedAt
                      ? new Date(item.publishedAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : ''}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-16 items-center">
            <div className="lg:col-span-5">
              <div className="aspect-[4/5] bg-gradient-to-br from-mahida-100 to-mahida-200 overflow-hidden relative">
                {settings.aboutImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={settings.aboutImageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-emerald-forest/10 flex items-center justify-center">
                        <span className="font-arabic text-3xl text-emerald-forest">مَنْبَعُ الْهِدَايَةِ</span>
                      </div>
                      <p className="text-sm text-warm-gray-500 italic">&quot;Sumber Petunjuk&quot;</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-7">
              <p className="label mb-3">{settings.aboutEyebrow}</p>
              <h2 className="display-md text-charcoal mb-6">{settings.aboutTitle}</h2>
              <p className="body-lg text-warm-gray-600 mb-6 leading-relaxed">
                {settings.aboutDescription}
              </p>

              {stats.length > 0 && (
                <div className="flex flex-wrap gap-8 mb-8">
                  {stats.map(([value, label]) => (
                    <div key={label}>
                      <span className="text-3xl font-serif font-bold text-emerald-forest">{value}</span>
                      <p className="text-sm text-warm-gray-500">{label}</p>
                    </div>
                  ))}
                </div>
              )}

              <Link href="/tentang/profil" className="btn-primary">
                Mengenal Mahida
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="label mb-2">Literasi</p>
              <h2 className="display-md text-charcoal">Bacaan Pilihan</h2>
            </div>
            <Link href="/literasi/artikel" className="hidden md:flex items-center gap-2 text-sm font-semibold text-emerald-forest hover:underline">
              Jelajahi Artikel <ArrowRight size={15} />
            </Link>
          </div>

          {featured.length === 0 ? (
            <div className="bg-white border border-mahida-200 p-8 text-sm text-warm-gray-500">
              Belum ada bacaan pilihan. Admin dapat memilih artikel setelah artikel diterbitkan.
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {featured.map((article) => (
                <article key={article.id} className="group">
                  <Link href={articleHref(article.slug)}>
                    <div className="aspect-[3/2] bg-mahida-100 overflow-hidden mb-4 flex items-center justify-center">
                      <PenTool size={28} className="text-mahida-400" />
                    </div>
                    <span className="category-pill">Artikel</span>
                    <h3 className="font-serif font-bold text-lg text-charcoal mt-3 group-hover:text-emerald-forest transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    {article.excerpt && (
                      <p className="text-warm-gray-600 text-sm mt-2 line-clamp-3">{article.excerpt}</p>
                    )}
                    {article.readingTime ? (
                      <span className="text-xs text-warm-gray-400 mt-3 block">{article.readingTime} menit baca</span>
                    ) : null}
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-20 bg-charcoal text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <p className="label text-brass-light mb-3">Jelajahi Mahida Digital</p>
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
              Satu rumah untuk ilmu, karya, dokumentasi, dan khidmah.
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Karya', href: '/karya', icon: PenTool, desc: 'Tulisan, terjemahan, sastra, dan karya santri.' },
              { label: 'Maktabah', href: '/maktabah', icon: BookOpen, desc: 'Kitab, buku, dan ruang ilmu.' },
              { label: 'Media', href: '/media', icon: Video, desc: 'Video, galeri, dan dokumentasi.' },
              { label: 'Kegiatan', href: '/agenda', icon: CalendarDays, desc: 'Agenda dan kegiatan Mahida.' },
            ].map((item) => (
              <Link key={item.label} href={item.href} className="group p-6 border border-white/10 hover:border-brass-light transition-all">
                <item.icon size={24} className="text-brass-light mb-4" />
                <h3 className="font-semibold text-lg mb-2 group-hover:text-brass-light">{item.label}</h3>
                <p className="text-sm text-warm-gray-400 leading-relaxed">{item.desc}</p>
              </Link>
            ))}
          </div>

          <div className="mt-8">
            <Link href="/koperasi" className="inline-flex items-center gap-2 text-sm font-semibold text-brass-light">
              <ShoppingBag size={16} />
              Kunjungi Koperasi Mahida
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
