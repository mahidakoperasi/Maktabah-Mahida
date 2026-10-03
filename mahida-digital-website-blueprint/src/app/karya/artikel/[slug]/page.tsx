import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { and, eq } from 'drizzle-orm';
import { ArrowLeft } from 'lucide-react';
import RichContent from '@/components/RichContent';
import ProtectedReading from '@/components/ProtectedReading';
import ArabicText from '@/components/ArabicText';
import DetailEngagement from '@/components/DetailEngagement';
import RelatedContent from '@/components/RelatedContent';
import DrivePreview from '@/components/DrivePreview';
import { driveIdFromUrl } from '@/lib/media-links';
import { db } from '@/db';
import { authors, posts } from '@/db/schema';
import { getPublicPage } from '@/lib/cms';
import AuthorByline from '@/components/AuthorByline';
import { socialMetadata } from '@/lib/social-metadata';

async function getArticle(slug: string) {
  if (!await getPublicPage('/karya/artikel')) return null;
  const [article] = await db
    .select()
    .from(posts)
    .where(and(eq(posts.slug, slug), eq(posts.type, 'article'), eq(posts.status, 'published')))
    .limit(1);

  if (!article) return null;
  const [author] = article.authorId ? await db.select({ name: authors.name, slug: authors.slug }).from(authors).where(eq(authors.id, article.authorId)).limit(1) : [];
  return { ...article, author: author ?? null };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) return { title: 'Artikel Tidak Ditemukan' };

  return socialMetadata({ title: article.metaTitle || article.title, description: article.metaDescription || article.excerpt || article.contentRaw || article.content, image: article.ogImage || article.featuredImage, path: `/karya/artikel/${slug}` });
}

export default async function PublicArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) notFound();

  return (
    <ProtectedReading><article className="bg-cream min-h-screen">
      <header className="border-b border-mahida-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <Link href="/karya/artikel" className="mb-6 inline-flex items-center gap-2 text-sm text-warm-gray-500 hover:text-emerald-forest">
            <ArrowLeft size={15} />
            Semua Artikel
          </Link>
          <p className="label mb-3">Artikel</p>
          <h1 dir="auto" className="display-md text-charcoal"><ArabicText text={article.title} /></h1>
          <AuthorByline author={article.author} authorClass={article.authorClass} publishedAt={article.publishedAt} />
          {article.excerpt && (
            <p dir="auto" className="mt-5 max-w-3xl text-lg leading-relaxed text-warm-gray-600">
              <ArabicText text={article.excerpt} />
            </p>
          )}
          {article.readingTime && <p className="mt-3 text-xs text-warm-gray-500">{article.readingTime} menit baca</p>}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {article.featuredImage && driveIdFromUrl(article.featuredImage) && <div className="mb-10"><DrivePreview url={article.featuredImage} title={article.title} /></div>}
        {article.featuredImage && !driveIdFromUrl(article.featuredImage) && (
          <figure className="mb-10 overflow-hidden border border-mahida-200 bg-white">
            <div className="flex min-h-[280px] max-h-[680px] items-center justify-center bg-[#f7f5ed]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={article.featuredImage}
                alt={article.title}
                className="max-h-[680px] w-full object-contain"
              />
            </div>
          </figure>
        )}
        <div className="prose-article">
          <RichContent content={article.contentRaw || article.content || ''} />
        </div>
      </div>
      <DetailEngagement kind="post" id={article.id}>
        <RelatedContent kind="post" id={article.id} path="/karya/artikel" />
      </DetailEngagement>
    </article></ProtectedReading>
  );
}
