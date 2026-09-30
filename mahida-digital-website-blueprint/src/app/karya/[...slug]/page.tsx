import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { posts } from '@/db/schema';
import { contentSections } from '@/lib/content-sections';
import { socialMetadata } from '@/lib/social-metadata';
import { getPublicPage } from '@/lib/cms';
import { PublicContentList, PublicContentDetail } from '@/components/PublicContent';
import CmsPage from '@/components/CmsPage';

export const dynamic = 'force-dynamic';
const paths = { esai: 'esai', terjemahan: 'terjemahan', manuskrip: 'manuskrip' } as const;
export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const { slug } = await params;
  const section = paths[slug[0] as keyof typeof paths];
  if (!section || slug.length !== 2) return {};
  const config = contentSections[section];
  if (!await getPublicPage(config.publicPath)) return {};
  const [work] = await db.select({ title: posts.title, excerpt: posts.excerpt, content: posts.content, featuredImage: posts.featuredImage, ogImage: posts.ogImage })
    .from(posts).where(and(eq(posts.slug, slug[1]), eq(posts.status, 'published'), eq(posts.type, config.type), ...(config.category ? [eq(posts.karyaCategory, config.category)] : []))).limit(1);
  return work ? socialMetadata({ title: work.title, description: work.excerpt || work.content, image: work.ogImage || work.featuredImage, path: `/karya/${slug[0]}/${slug[1]}` }) : {};
}
export default async function KaryaSection({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const section = paths[slug[0] as keyof typeof paths];
  if (!section) return <CmsPage path={`/karya/${slug.join('/')}`} />;
  if (slug.length > 2) notFound();
  return slug.length === 1 ? <PublicContentList section={section} /> : <PublicContentDetail section={section} slug={slug[1]} />;
}
