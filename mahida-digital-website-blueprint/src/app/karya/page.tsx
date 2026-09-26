import Link from 'next/link';
import { notFound } from 'next/navigation';
import { and, desc, eq, inArray, or } from 'drizzle-orm';
import { db } from '@/db';
import { posts } from '@/db/schema';
import { getPublicMenu, getPublicPage, paragraphs } from '@/lib/cms';

export const dynamic = 'force-dynamic';
export default async function KaryaPage() {
  const page = await getPublicPage('/karya');
  if (!page) notFound();
  const sections = (await getPublicMenu()).find((item) => item.path === '/karya')?.children ?? [];
  const works = await db.select({ id: posts.id, title: posts.title, slug: posts.slug, type: posts.type, category: posts.karyaCategory, excerpt: posts.excerpt })
    .from(posts).where(and(or(inArray(posts.type, ['article','essay']), and(eq(posts.type,'work'), inArray(posts.karyaCategory,['terjemahan','manuskrip']))), eq(posts.status, 'published')))
    .orderBy(desc(posts.publishedAt)).limit(20);
  function pathOf(type: string, category: string | null) {
    return type === 'article' ? '/karya/artikel' : type === 'essay' ? '/karya/esai' : category === 'terjemahan' ? '/karya/terjemahan' : '/karya/manuskrip';
  }
  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-emerald-forest py-14 text-white"><div className="mx-auto max-w-5xl px-4 sm:px-6"><h1 className="display-md text-white">{page.title}</h1>{page.intro && <p className="mt-4 text-white/80">{page.intro}</p>}</div></header>
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        {page.body && <div className="mb-8 space-y-4 text-warm-gray-600">{paragraphs(page.body).map((part, index) => <p key={index}>{part}</p>)}</div>}
        <nav aria-label="Jenis karya" className="mb-8 flex flex-wrap gap-3">{sections.map((item) => <Link key={item.id} href={item.path} className="border border-mahida-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-forest">{item.label}</Link>)}</nav>
        {works.length === 0 ? <div className="border border-mahida-200 bg-white p-8">Belum ada karya terbit. Karya akan muncul setelah diterbitkan oleh admin.</div>
          : <div className="grid gap-5 sm:grid-cols-2">{works.map((work) => <article key={work.id} className="border border-mahida-200 bg-white p-6"><p className="label mb-2">{pathOf(work.type, work.category).split('/').at(-1)}</p><h2 className="font-serif text-xl font-bold"><Link href={`${pathOf(work.type, work.category)}/${work.slug}`}>{work.title}</Link></h2>{work.excerpt && <p className="mt-3 text-sm text-warm-gray-600">{work.excerpt}</p>}</article>)}</div>}
      </div>
    </div>
  );
}
