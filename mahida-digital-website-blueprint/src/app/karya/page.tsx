import DesignHero from '@/components/DesignHero';
import DesignSections from '@/components/DesignSections';
import DesignTextBlock from '@/components/DesignTextBlock';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { and, desc, eq, inArray, or } from 'drizzle-orm';
import { db } from '@/db';
import { posts } from '@/db/schema';
import { getPublicPage, paragraphs } from '@/lib/cms';
import DailyHighlight from '@/components/DailyHighlight';
import SummaryCard from '@/components/SummaryCard';

export const dynamic = 'force-dynamic';
export default async function KaryaPage() {
  const page = await getPublicPage('/karya');
  if (!page) notFound();
  const works = await db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      type: posts.type,
      category: posts.karyaCategory,
      excerpt: posts.excerpt,
      featuredImage: posts.featuredImage,
    })
    .from(posts)
    .where(
      and(
        or(
          inArray(posts.type, ['article', 'essay']),
          and(
            eq(posts.type, 'work'),
            inArray(posts.karyaCategory, ['terjemahan', 'manuskrip']),
          ),
        ),
        eq(posts.status, 'published'),
      ),
    )
    .orderBy(desc(posts.publishedAt))
    .limit(20);
  function pathOf(type: string, category: string | null) {
    return type === 'article'
      ? '/karya/artikel'
      : type === 'essay'
        ? '/karya/esai'
        : category === 'terjemahan'
          ? '/karya/terjemahan'
          : '/karya/manuskrip';
  }
  return (
    <div className="min-h-screen bg-cream">
      <DesignHero path="/karya" className="bg-emerald-forest py-14 text-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h1 className="display-md text-white">{page.title}</h1>
          {page.intro && <p className="mt-4 text-white/80">{page.intro}</p>}
        </div>
      </DesignHero>
      <DailyHighlight section="/karya" />
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <DesignTextBlock path="/karya" hasText={Boolean(page.body)}>
          {page.body && (
            <div className="mb-8 space-y-4 text-warm-gray-600">
              {paragraphs(page.body).map((part, index) => (
                <p key={index}>{part}</p>
              ))}
            </div>
          )}
        </DesignTextBlock>
        {works.length === 0 ? (
          <div className="empty-state">
            Belum ada karya terbit. Karya akan muncul setelah diterbitkan oleh
            admin.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {works.map((work) => (
              <SummaryCard
                key={work.id}
                href={`${pathOf(work.type, work.category)}/${work.slug}`}
                title={work.title}
                excerpt={work.excerpt}
                cover={work.featuredImage}
                label={pathOf(work.type, work.category).split('/').at(-1)}
              />
            ))}
          </div>
        )}
        <div className="mt-10">
          <DesignSections path="/karya" />
        </div>
      </div>
    </div>
  );
}
