import { notFound, permanentRedirect } from 'next/navigation';
import ContentPending from '@/components/ContentPending';

const sections: Record<string, string> = {
  'resensi': 'Resensi',
  'refleksi': 'Refleksi',
  'pendidikan': 'Pendidikan',
  'pesantren': 'Pesantren',
};

export default async function SectionPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  if (slug.length === 1 && slug[0] === 'esai') permanentRedirect('/karya/esai');
  if (slug[0] === 'artikel') {
    if (slug.length === 1) permanentRedirect('/karya/artikel');
    if (slug.length === 2) permanentRedirect(`/karya/artikel/${encodeURIComponent(slug[1])}`);
  }
  const title = slug.length === 1 ? sections[slug[0]] : undefined;
  if (!title) notFound();

  return <ContentPending eyebrow={'Literasi'} title={title} emptyTitle={'Belum ada konten terbit'} />;
}
