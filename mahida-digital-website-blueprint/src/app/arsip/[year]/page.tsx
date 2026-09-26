import { notFound } from 'next/navigation';
import ContentPending from '@/components/ContentPending';

export default async function ArchiveYearPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year } = await params;
  if (!/^\d{4}$/.test(year)) notFound();

  return <ContentPending eyebrow="Arsip" title={`Arsip ${year}`} emptyTitle="Belum ada arsip terbit" />;
}
