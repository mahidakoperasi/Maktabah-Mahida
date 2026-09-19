import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { and, eq } from 'drizzle-orm';
import { ArrowLeft } from 'lucide-react';
import { db } from '@/db';
import { posts } from '@/db/schema';

async function getArticle(slug: string) {
  const [article] = await db
    .select()
    .from(posts)
    .where(and(eq(posts.slug, slug), eq(posts.type, 'article'), eq(posts.status, 'published')))
    .limit(1);

  return article ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) return { title: 'Artikel Tidak Ditemukan' };

  return {
    title: article.metaTitle || article.title,
    description: article.metaDescription || article.excerpt || undefined,
  };
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
    <article className="bg-cream min-h-screen">
      <header className="border-b border-mahida-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <Link href="/literasi/artikel" className="mb-6 inline-flex items-center gap-2 text-sm text-warm-gray-500 hover:text-emerald-forest">
            <ArrowLeft size={15} />
            Semua Artikel
          </Link>
          <p className="label mb-3">Artikel</p>
          <h1 className="display-md text-charcoal">{article.title}</h1>
          {article.excerpt && (
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-warm-gray-600">
              {article.excerpt}
            </p>
          )}
          <div className="mt-6 flex flex-wrap gap-4 text-xs text-warm-gray-400">
            {article.publishedAt && (
              <span>
                {new Date(article.publishedAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            )}
            {article.readingTime ? <span>{article.readingTime} menit baca</span> : null}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {article.featuredImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={article.featuredImage} alt="" className="mb-10 w-full max-h-[520px] object-cover" />
        )}
        <div className="prose-article whitespace-pre-wrap">
          {article.contentRaw || article.content}
        </div>
      </div>
    </article>
  );
}
