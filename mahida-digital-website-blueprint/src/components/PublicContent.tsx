import Link from 'next/link';
import { notFound } from 'next/navigation';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { posts } from '@/db/schema';
import { getPublicPage, paragraphs } from '@/lib/cms';
import { contentSections, type ContentSection } from '@/lib/content-sections';
import DrivePreview from './DrivePreview';

function conditions(section: ContentSection) {
  const config = contentSections[section];
  const filters = [eq(posts.type, config.type), eq(posts.status, 'published')];
  if (config.category) filters.push(eq(posts.karyaCategory, config.category));
  return filters;
}

export async function PublicContentList({ section }: { section: ContentSection }) {
  const config = contentSections[section];
  const page = await getPublicPage(config.publicPath);
  if (!page) notFound();
  const rows = await db.select({ id: posts.id, title: posts.title, slug: posts.slug, excerpt: posts.excerpt, publishedAt: posts.publishedAt })
    .from(posts).where(and(...conditions(section))).orderBy(desc(posts.publishedAt));
  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-emerald-forest py-14 text-white"><div className="mx-auto max-w-5xl px-4 sm:px-6"><h1 className="display-md text-white">{page.title}</h1>{page.intro && <p className="mt-4 text-white/80">{page.intro}</p>}</div></header>
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        {rows.length === 0 ? <div className="empty-state"><h2 className="font-serif text-xl font-bold">Belum ada konten terbit</h2><p className="mt-2 text-warm-gray-600">Publikasi akan tampil di sini setelah diterbitkan oleh admin.</p></div>
          : <div className="grid gap-5 sm:grid-cols-2">{rows.map((item) => <article key={item.id} className="border border-mahida-200 bg-white p-6"><h2 className="font-serif text-xl font-bold"><Link href={`${config.publicPath}/${item.slug}`} className="hover:text-emerald-forest">{item.title}</Link></h2>{item.excerpt && <p className="mt-3 text-sm leading-6 text-warm-gray-600">{item.excerpt}</p>}<Link href={`${config.publicPath}/${item.slug}`} className="mt-5 inline-block text-sm font-semibold text-emerald-forest">Baca selengkapnya →</Link></article>)}</div>}
        {page.body && <div className="mt-10 space-y-4">{paragraphs(page.body).map((paragraph, index) => <p key={index} dir="auto">{paragraph}</p>)}</div>}
      </div>
    </div>
  );
}

export async function PublicContentDetail({ section, slug }: { section: ContentSection; slug: string }) {
  const config = contentSections[section];
  if (!await getPublicPage(config.publicPath)) notFound();
  const [item] = await db.select({ title: posts.title, excerpt: posts.excerpt, content: posts.contentRaw, publishedAt: posts.publishedAt, featuredImage: posts.featuredImage })
    .from(posts).where(and(eq(posts.slug, slug), ...conditions(section))).limit(1);
  if (!item) notFound();
  return (
    <article className="min-h-screen bg-cream">
      <header className="bg-emerald-forest py-14 text-white"><div className="mx-auto max-w-4xl px-4 sm:px-6"><Link href={config.publicPath} className="text-sm text-white/75">← Semua {config.label}</Link><h1 className="display-md mt-5 text-white">{item.title}</h1>{item.excerpt && <p className="mt-4 text-lg text-white/80">{item.excerpt}</p>}</div></header>
      <div className="prose-article mx-auto max-w-4xl space-y-6 px-4 py-12 sm:px-6">
        {item.featuredImage && <DrivePreview url={item.featuredImage} title={item.title} />}
        {paragraphs(item.content ?? '').map((paragraph, index) => {
          const arabicCount = [...paragraph.matchAll(/\p{Script=Arabic}/gu)].length;
          const latinCount = [...paragraph.matchAll(/[A-Za-z]/g)].length;
          const isArabic = arabicCount > 0 && arabicCount > latinCount;
          return <p key={index} lang={isArabic ? 'ar' : 'id'} dir={isArabic ? 'rtl' : 'auto'} style={isArabic ? { fontFamily: 'Amiri, serif' } : undefined} className={isArabic ? 'text-2xl leading-[2.1] sm:text-3xl' : ''}>{paragraph}</p>;
        })}
      </div>
    </article>
  );
}
