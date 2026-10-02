import { notFound } from 'next/navigation';
import MediaManager from '@/components/admin/MediaManager';
import GalleryManager from '@/components/admin/GalleryManager';

export default async function AdminMedia({ params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  if (kind !== 'video' && kind !== 'galeri') notFound();
  return kind === 'galeri' ? <GalleryManager /> : <MediaManager kind={kind} />;
}
