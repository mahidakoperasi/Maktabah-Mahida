import { notFound } from 'next/navigation';
import MediaManager from '@/components/admin/MediaManager';

export default async function AdminMedia({ params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  if (kind !== 'video' && kind !== 'galeri') notFound();
  return <MediaManager kind={kind} />;
}
