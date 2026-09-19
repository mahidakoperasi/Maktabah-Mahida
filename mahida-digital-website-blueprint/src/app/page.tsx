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
      <section className="relative min-h-[88vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-forest via-emerald-rich to-charcoal" />
        <div className="relative max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="max-w-3xl">
            <p className="label text-white/60 mb-6 tracking-[0.15em]">
              {settings.heroEyebrow}
            </p>
            <h1 className="text-white text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-serif font-bold leading-[1.08] mb-8">
              {settings.heroTitleLine1}<br />
              {settings.heroTitleLine2}<br />
              <span className="text-brass-light">{settings.heroTitleAccent}</span>
            </h1>
            <p className="text-lg md:text-xl text-white/75 leading-relaxed max-w-xl mb-10">
              {settings.heroDescription}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href={settings.heroPrimaryHref} className="bg-white text-emerald-forest px-6 py-3 font-semibold text-sm hover:bg-cream transition-colors flex items-center gap-2">
                {settings.heroPrimaryLabel}
                <ArrowRight size={16} />
              </Link>
              <Link href={settings.heroSecondaryHref} className="border border-white/30 text-white px-6 py-3 font-medium text-sm hover:bg-white/10 transition-colors flex items-center gap-2">
                {settings.heroSecondaryLabel}
              </Link>
            </div>
          </div>
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
