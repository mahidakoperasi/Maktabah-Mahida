import { notFound } from 'next/navigation';
import ContentPending from '@/components/ContentPending';

const sections: Record<string, string> = {
  'kitab': 'Kitab',
  'terjemahan': 'Terjemahan',
  'kajian': 'Kajian',
  'nahwu': 'Nahwu',
  'sharaf': 'Sharaf',
  'fiqh': 'Fiqh',
  'tafsir': 'Tafsir',
  'hadits': 'Hadits',
  'usul-fiqh': 'Usul Fiqh',
  'aqidah': 'Aqidah',
  'tasawuf': 'Tasawuf',
  'balaghah': 'Balaghah',
  'bahasa-arab': 'Bahasa Arab',
};

export default async function SectionPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const title = slug.length === 1 ? sections[slug[0]] : undefined;
  if (!title) notFound();

  return <ContentPending eyebrow={'Maktabah'} title={title} emptyTitle={'Belum ada bahan terbit'} />;
}
