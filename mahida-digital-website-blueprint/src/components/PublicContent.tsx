import Link from 'next/link';
import { notFound } from 'next/navigation';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { authors, posts } from '@/db/schema';
import { getPublicPage, paragraphs } from '@/lib/cms';
import { contentSections, type ContentSection } from '@/lib/content-sections';
import DrivePreview from './DrivePreview';
import RichContent from './RichContent';
import DetailEngagement from './DetailEngagement';
import RelatedContent from './RelatedContent';
import ArticleCover from './ArticleCover';
import SummaryCard from './SummaryCard';
import AuthorByline from './AuthorByline';

function conditions(section: ContentSection) {
  const config = contentSections[section];
  const filters = [eq(posts.type, config.type), eq(posts.status, 'published')];
  if (config.category) filters.push(eq(posts.karyaCategory, config.category));
  return filters;
}

export async function PublicContentList({ section, pagePath }: { section: ContentSection; pagePath?: string }) {
  const config = contentSections[section];
  const page = await getPublicPage(pagePath ?? config.publicPath);
  if (!page) notFound();
  const rows = await db.select({ id: posts.id, title: posts.title, slug: posts.slug, excerpt: posts.excerpt, publishedAt: posts.publishedAt, featuredImage: posts.featuredImage })
    .from(posts).where(and(...conditions(section))).orderBy(desc(posts.publishedAt));
  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-emerald-forest py-14 text-white"><div className="mx-auto max-w-5xl px-4 sm:px-6"><h1 className="display-md text-white">{page.title}</h1>{page.intro && <p className="mt-4 text-white/80">{page.intro}</p>}</div></header>
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        {rows.length === 0 ? <div className="empty-state"><h2 className="font-serif text-xl font-bold">Belum ada konten terbit</h2><p className="mt-2 text-warm-gray-600">Publikasi akan tampil di sini setelah diterbitkan oleh admin.</p></div>
          : <div className="grid gap-5 sm:grid-cols-2">{rows.map((item) => <SummaryCard key={item.id} href={`${config.publicPath}/${item.slug}`} title={item.title} excerpt={item.excerpt} cover={item.featuredImage} />)}</div>}
        {page.body && <div className="mt-10 space-y-4">{paragraphs(page.body).map((paragraph, index) => <p key={index} dir="auto">{paragraph}</p>)}</div>}
      </div>
    </div>
  );
}

export async function PublicContentDetail({ section, slug }: { section: ContentSection; slug: string }) {
  const config = contentSections[section];
  if (!await getPublicPage(config.publicPath)) notFound();
  const [item] = await db.select({ id: posts.id, title: posts.title, excerpt: posts.excerpt, content: posts.content, contentRaw: posts.contentRaw, publishedAt: posts.publishedAt, featuredImage: posts.featuredImage, authorClass: posts.authorClass, authorName: authors.name, authorSlug: authors.slug })
    .from(posts).leftJoin(authors, eq(authors.id, posts.authorId)).where(and(eq(posts.slug, slug), ...conditions(section))).limit(1);
  if (!item) notFound();
  return (
    <article className="min-h-screen bg-cream">
      <header className="bg-emerald-forest py-14 text-white"><div className="mx-auto max-w-4xl px-4 sm:px-6"><Link href={config.publicPath} className="text-sm text-white/75">← Semua {config.label}</Link><h1 className="display-md mt-5 text-white">{item.title}</h1><AuthorByline author={item.authorName && item.authorSlug ? { name: item.authorName, slug: item.authorSlug } : null} authorClass={item.authorClass} publishedAt={item.publishedAt} onDark />{item.excerpt && <p className="mt-4 text-lg text-white/80">{item.excerpt}</p>}</div></header>
      <div className="prose-article mx-auto max-w-4xl space-y-6 px-4 py-12 sm:px-6">
        {item.featuredImage && <DrivePreview url={item.featuredImage} title={item.title} />}
        <RichContent content={item.contentRaw ?? item.content ?? ''} />
      </div>
      <DetailEngagement kind="post" id={item.id}>
        <RelatedContent kind="post" id={item.id} path={config.publicPath} category={config.category} />
      </DetailEngagement>
    </article>
  );
}
