import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { posts } from '@/db/schema';
import { getPublicMenu, getPublicPage } from '@/lib/cms';
import { getHomepageSettings } from '@/lib/homepage-settings';
import { karyaPostPath } from '@/lib/karya-post';
import MediaPlaceholder from '@/components/MediaPlaceholder';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [settings, menu, newsPage, articlePage, published] = await Promise.all([
    getHomepageSettings(), getPublicMenu(), getPublicPage('/media/berita'), getPublicPage('/karya/artikel'),
    process.env.DATABASE_URL ? db.select({ id: posts.id, title: posts.title, slug: posts.slug, type: posts.type,
      karyaCategory: posts.karyaCategory, excerpt: posts.excerpt, publishedAt: posts.publishedAt })
      .from(posts).where(and(inArray(posts.type, ['news', 'article']), eq(posts.status, 'published')))
      .orderBy(desc(posts.publishedAt), desc(posts.id)).limit(20) : Promise.resolve([]),
  ]);
  const units = menu.find((item) => item.path === '/tentang')?.children.find((item) => item.path === '/tentang/pendidikan')?.children ?? [];
  const articles = published.flatMap((post) => {
    if (post.type === 'news' && !newsPage || post.type === 'article' && !articlePage) return [];
    const href = post.type === 'news' ? `/media/berita/${post.slug}` : karyaPostPath(post);
    return href ? [{ ...post, href }] : [];
  }).slice(0, 3);

  return <>
    <section className="relative isolate flex min-h-[590px] items-center overflow-hidden bg-[#123d2b] text-white md:min-h-[670px] lg:min-h-[760px]">
      <video muted playsInline preload="none" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#092d21] via-[#0d3528]/90 to-[#0e3529]/60" />
      <div className="absolute bottom-5 right-4 border border-white/40 px-3 py-2 text-[10px] font-bold tracking-widest text-white/75 md:bottom-8 md:right-8">[MEDIA DRIVE ADMIN: Video Hero]</div>
      <div className="relative mx-auto w-full max-w-[1440px] px-5 py-20 md:px-8 lg:px-12">
        <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-[#e4c72f]">{settings.heroEyebrow}</p>
        <h1 className="max-w-5xl text-4xl font-black leading-[1.08] tracking-[-0.045em] md:text-6xl lg:text-[clamp(4.5rem,7vw,7.5rem)]">{settings.heroTitleLine1}<br />{settings.heroTitleLine2}<br /><span className="text-[#e4c72f]">{settings.heroTitleAccent}</span></h1>
        <p className="mt-7 max-w-xl text-base leading-8 text-white/85 md:text-lg">{settings.heroDescription}</p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Link href="/tentang/pendaftaran" className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#e4c72f] px-6 py-3 text-sm font-bold text-[#123d2b] transition hover:bg-[#f3da60]">Gabung Bersama Kami <ArrowUpRight size={18} aria-hidden /></Link>
          <Link href="/tentang/profil" className="inline-flex min-h-12 items-center justify-center gap-2 border border-white/70 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10">Kenali Mahida <ArrowUpRight size={18} aria-hidden /></Link>
        </div>
      </div>
    </section>

    <section aria-labelledby="unit-heading" className="bg-[#fffef9] py-16 md:py-24 lg:py-28">
      <div className="mx-auto max-w-[1440px] px-5 md:px-8 lg:px-12">
        <div className="mb-9 grid gap-4 md:grid-cols-[1fr_1fr] md:items-end lg:mb-12">
          <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-rich">Pendidikan Mahida</p><h2 id="unit-heading" className="mt-3 max-w-2xl text-3xl font-black leading-tight tracking-tight text-[#143d2a] md:text-5xl lg:text-6xl">Temukan ruang belajar Anda.</h2></div>
          <p className="max-w-md text-base leading-7 text-warm-gray-600 md:justify-self-end">Lima unit pendidikan dalam satu lingkungan Mahida Salam.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-6 lg:gap-4">
          {units.map((unit, index) => <Link key={unit.id} href={unit.path} className={`group flex min-h-[245px] flex-col justify-between border border-mahida-200 bg-[#f1f5ef] p-6 transition hover:-translate-y-1 hover:border-emerald-forest hover:shadow-lg md:min-h-[300px] lg:min-h-[350px] ${index === 0 || index === units.length - 1 ? 'lg:col-span-3' : 'lg:col-span-2'}`}>
            <span className="flex items-start justify-between text-xs font-bold tracking-widest text-emerald-rich"><span>{String(index + 1).padStart(2, '0')} / 05</span><ArrowUpRight size={22} aria-hidden /></span>
            <span className="max-w-md text-2xl font-extrabold leading-tight tracking-tight text-[#143d2a] md:text-3xl lg:text-[clamp(1.5rem,2.2vw,2.5rem)]">{unit.label}</span>
          </Link>)}
        </div>
        {units.length === 0 && <p className="empty-state mt-4">Unit pendidikan akan tampil setelah diterbitkan dan diaktifkan melalui Admin.</p>}
      </div>
    </section>

    <section aria-labelledby="news-heading" className="bg-[#f2f4ed] py-16 md:py-24 lg:py-28">
      <div className="mx-auto max-w-[1440px] px-5 md:px-8 lg:px-12">
        <div className="mb-9 lg:mb-12"><p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-rich">Dari Mahida</p><h2 id="news-heading" className="mt-3 text-3xl font-black tracking-tight text-[#143d2a] md:text-5xl">Berita & Artikel Terbaru</h2></div>
        {articles.length ? <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {articles.map((article, index) => <Link key={article.id} href={article.href} className={`group border border-mahida-200 bg-white transition hover:shadow-lg ${index === 0 ? 'md:col-span-2 lg:col-span-2 lg:row-span-2' : 'lg:col-span-2'}`}>
            <MediaPlaceholder label="Thumbnail Artikel 16:9" className="aspect-video w-full" />
            <div className="p-5 md:p-7"><p className="text-xs font-bold uppercase tracking-widest text-emerald-rich">{article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Artikel'}</p><h3 className={`mt-3 font-bold leading-snug text-[#143d2a] group-hover:text-emerald-rich ${index === 0 ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl'}`}>{article.title}</h3>{article.excerpt && <p className="mt-3 line-clamp-2 text-sm leading-7 text-warm-gray-600">{article.excerpt}</p>}</div>
          </Link>)}
        </div> : <p className="empty-state">Belum ada artikel terbit.</p>}
      </div>
    </section>
  </>;
}
