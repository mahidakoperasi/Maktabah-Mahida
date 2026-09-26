import { notFound } from 'next/navigation';
import ContentPending from '@/components/ContentPending';

const sections: Record<string, string> = {
  'esai': 'Esai & Opini',
  'terjemahan': 'Terjemahan',
  'sastra': 'Sastra',
  'falak': 'Falak & Sains',
  'riset': 'Riset & Kajian',
  'budaya': 'Budaya & Tradisi',
  'fotografi': 'Fotografi',
  'media-kreatif': 'Media Kreatif',
};

export default async function SectionPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const title = slug.length === 1 ? sections[slug[0]] : undefined;
  if (!title) notFound();

  return <ContentPending eyebrow={'Karya'} title={title} emptyTitle={'Belum ada karya terbit'} />;
}
