import Link from 'next/link';
import { and, desc, eq, sql } from 'drizzle-orm';
import { ArrowRight, FileText } from 'lucide-react';
import { notFound } from 'next/navigation';
import { db } from '@/db';
import { posts } from '@/db/schema';
import { getPublicPage, paragraphs } from '@/lib/cms';
import ArticleCover from '@/components/ArticleCover';

export const dynamic = 'force-dynamic';

export default async function ArticleListingPage() {
  const page = await getPublicPage('/karya/artikel');
  if (!page) notFound();
  const readyResult = await db.execute(sql`
    select to_regclass('public.posts') is not null as ready
  `);
  const ready = Boolean((readyResult.rows?.[0] as { ready?: boolean } | undefined)?.ready);

  const articles = ready
    ? await db
        .select({
          id: posts.id,
          title: posts.title,
          slug: posts.slug,
          excerpt: posts.excerpt,
          featuredImage: posts.featuredImage,
          publishedAt: posts.publishedAt,
          readingTime: posts.readingTime,
        })
        .from(posts)
        .where(and(eq(posts.type, 'article'), eq(posts.status, 'published')))
        .orderBy(desc(posts.publishedAt))
    : [];

  const publishedArticles = articles.filter((article) => article.slug);

  return (
    <div className="bg-cream min-h-screen">
      <section className="bg-emerald-forest py-16 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="display-md text-white">{page.title}</h1>
          <p className="mt-4 max-w-2xl text-white/70">
            {page.intro}
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {page.body && <div className="mb-8 space-y-4 text-warm-gray-600">{paragraphs(page.body).map((part, index) => <p key={index}>{part}</p>)}</div>}
        {publishedArticles.length === 0 ? (
          <div className="empty-state">
            <FileText size={36} className="mx-auto mb-3 text-mahida-300" />
            <h2 className="font-serif text-xl font-bold text-charcoal">Belum ada artikel terbit</h2>
            <p className="mt-2 text-sm text-warm-gray-500">
              Artikel resmi akan muncul di sini setelah diterbitkan.
            </p>
          </div>
        ) : (
          <div className="columns-1 gap-6 md:columns-2 lg:columns-3">
            {publishedArticles.map((article) => (
              <article key={article.id} className="mb-6 inline-block w-full break-inside-avoid overflow-hidden border border-mahida-200 bg-white align-top">
                <Link href={`/karya/artikel/${article.slug}`} className="block bg-mahida-100">
                  <ArticleCover url={article.featuredImage} />
                </Link>
                <div className="p-6">
                  <h2 className="font-serif text-2xl font-bold text-charcoal">
                    <Link href={`/karya/artikel/${article.slug}`} className="hover:text-emerald-forest">
                      {article.title}
                    </Link>
                  </h2>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-warm-gray-400">
                    {article.publishedAt && <span>
                      {new Date(article.publishedAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>}
                    {article.readingTime ? <span>{article.readingTime} menit baca</span> : null}
                  </div>
                  {article.excerpt && <p className="mt-4 line-clamp-3 text-sm leading-6 text-warm-gray-600">{article.excerpt}</p>}
                  <Link
                    href={`/karya/artikel/${article.slug}`}
                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-forest"
                  >
                    Baca artikel <ArrowRight size={15} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
