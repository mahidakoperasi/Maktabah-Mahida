import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { and, eq } from 'drizzle-orm';
import { ArrowLeft, ArrowUpRight, Play } from 'lucide-react';
import { db } from '@/db';
import { posts } from '@/db/schema';

function getYouTubeId(url: string) {
  try {
    const parsed = new URL(url);

    if (parsed.hostname === 'youtu.be') {
      return parsed.pathname.split('/').filter(Boolean)[0] || null;
    }

    if (parsed.hostname.endsWith('youtube.com')) {
      if (parsed.pathname === '/watch') {
        return parsed.searchParams.get('v');
      }

      const parts = parsed.pathname.split('/').filter(Boolean);
      if (['shorts', 'embed', 'live'].includes(parts[0])) {
        return parts[1] || null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

function YouTubeTeaser({ url, label }: { url: string; label?: string }) {
  const videoId = getYouTubeId(url);
  if (!videoId) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="my-8 flex items-center justify-between gap-4 border border-mahida-200 bg-white p-5 text-emerald-forest hover:bg-mahida-50"
      >
        <span className="font-semibold">{label || 'Tonton video di YouTube'}</span>
        <ArrowUpRight size={18} />
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group my-10 block overflow-hidden border border-mahida-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative aspect-video overflow-hidden bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
          alt=""
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
        <div className="absolute inset-0 bg-black/20 transition group-hover:bg-black/10" />
        <div className="absolute inset-0 grid place-items-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-white/95 text-[#075b3a] shadow-xl transition-transform group-hover:scale-105">
            <Play size={26} fill="currentColor" className="ml-1" />
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between gap-5 p-5 sm:p-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a18725]">Video Mahida</p>
          <h2 className="mt-2 font-serif text-xl font-bold text-[#173d2d] sm:text-2xl">
            {label || 'Saksikan momen lengkapnya'}
          </h2>
          <p className="mt-2 text-sm leading-6 text-warm-gray-500">
            Cuplikan visual dari kisah ini tersedia di YouTube.
          </p>
        </div>
        <ArrowUpRight className="shrink-0 text-[#075b3a]" size={20} />
      </div>
    </a>
  );
}

function renderArticleContent(content: string) {
  const markerPattern = /\[\[youtube:(https?:\/\/[^\]|\s]+)(?:\|([^\]]+))?\]\]/gi;
  const nodes = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = markerPattern.exec(content)) !== null) {
    const before = content.slice(lastIndex, match.index);

    before
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
      .forEach((paragraph) => {
        nodes.push(
          <p key={`p-${key++}`}>
            {paragraph.replace(/\s*\n\s*/g, ' ')}
          </p>
        );
      });

    nodes.push(
      <YouTubeTeaser
        key={`video-${key++}`}
        url={match[1]}
        label={match[2]?.trim()}
      />
    );

    lastIndex = markerPattern.lastIndex;
  }

  content
    .slice(lastIndex)
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .forEach((paragraph) => {
      nodes.push(
        <p key={`p-${key++}`}>
          {paragraph.replace(/\s*\n\s*/g, ' ')}
        </p>
      );
    });

  return nodes;
}

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
          {renderArticleContent(article.contentRaw || article.content || '')}
        </div>
      </div>
    </article>
  );
}
