import { notFound } from 'next/navigation';
import { PublicContentList, PublicContentDetail } from '@/components/PublicContent';
import CmsPage from '@/components/CmsPage';

export const dynamic = 'force-dynamic';
const paths = { esai: 'esai', terjemahan: 'terjemahan', manuskrip: 'manuskrip' } as const;
export default async function KaryaSection({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const section = paths[slug[0] as keyof typeof paths];
  if (!section) return <CmsPage path={`/karya/${slug.join('/')}`} />;
  if (slug.length > 2) notFound();
  return slug.length === 1 ? <PublicContentList section={section} /> : <PublicContentDetail section={section} slug={slug[1]} />;
}
