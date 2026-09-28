import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { authors, posts } from '@/db/schema';
import { karyaPostPath } from '@/lib/karya-post';
import { driveThumbnailUrl, publicImageUrl } from '@/lib/media-links';
import { getPublicMenu } from '@/lib/cms';
import SummaryCard from '@/components/SummaryCard';
import AuthorPortrait from '@/components/AuthorPortrait';

async function getAuthor(slug: string) {
  const [author] = await db.select({ id: authors.id, name: authors.name, slug: authors.slug, bio: authors.bio, photo: authors.photo, institution: authors.institution }).from(authors).where(eq(authors.slug, slug)).limit(1);
  return author ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const author = await getAuthor((await params).slug);
  return author ? { title: `Karya ${author.name}`, description: `Arsip karya terbit ${author.name} di Mahida Digital.` } : { title: 'Penulis tidak ditemukan' };
}

export default async function AuthorArchive({ params }: { params: Promise<{ slug: string }> }) {
  const author = await getAuthor((await params).slug);
  if (!author) notFound();
  const menu = await getPublicMenu();
  const visibleSections = new Set(menu.flatMap((item) => [item.path, ...item.children.map((child) => child.path)]));
  const photo = author.photo ? driveThumbnailUrl(author.photo) ?? publicImageUrl(author.photo) : null;
  const works = await db.select({ id: posts.id, title: posts.title, slug: posts.slug, type: posts.type, karyaCategory: posts.karyaCategory, excerpt: posts.excerpt, featuredImage: posts.featuredImage })
    .from(posts).where(and(eq(posts.authorId, author.id), eq(posts.status, 'published'), inArray(posts.type, ['article', 'essay', 'work'])))
    .orderBy(desc(posts.publishedAt), desc(posts.id));
  const visibleWorks = works.flatMap((work) => {
    const href = karyaPostPath(work);
    return href && visibleSections.has(href.slice(0, href.lastIndexOf('/'))) ? [{ ...work, href }] : [];
  });
  return <div className="min-h-screen bg-cream">
    <header className="bg-emerald-forest py-14 text-white"><div className="mx-auto flex max-w-5xl flex-wrap items-center gap-6 px-4 sm:px-6">{photo && <AuthorPortrait src={photo} name={author.name} />}<div className="min-w-0"><p className="text-sm text-white/70">Penulis Mahida</p><h1 className="display-md mt-2 text-white">{author.name}</h1>{author.institution && <p className="mt-2 text-white/80">{author.institution}</p>}{author.bio && <p className="mt-4 max-w-2xl text-white/80">{author.bio}</p>}</div></div></header>
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6" aria-label={`Karya ${author.name}`}>
      <h2 className="mb-6 font-serif text-2xl font-bold">Karya Terbit</h2>
      {visibleWorks.length ? <div className="grid gap-5 sm:grid-cols-2">{visibleWorks.map((work) => <SummaryCard key={work.id} href={work.href} title={work.title} excerpt={work.excerpt} cover={work.featuredImage} />)}</div> : <p className="empty-state">Belum ada karya terbit dari penulis ini.</p>}
    </section>
  </div>;
}
