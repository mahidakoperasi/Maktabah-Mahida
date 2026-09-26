import { notFound } from 'next/navigation';
import ContentPending from '@/components/ContentPending';

const sections: Record<string, string> = {
  'tv': 'Mahida TV',
  'video': 'Video',
  'galeri': 'Galeri',
};

export default async function SectionPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const title = slug.length === 1 ? sections[slug[0]] : undefined;
  if (!title) notFound();

  return <ContentPending eyebrow={'Media'} title={title} emptyTitle={'Belum ada media terbit'} />;
}
