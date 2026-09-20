import GalleryEditor from '@/components/admin/GalleryEditor';
export default async function EditGalleryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <GalleryEditor galleryId={Number(id)} />;
}
