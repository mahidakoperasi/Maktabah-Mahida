import YouTubeEditor from '@/components/admin/YouTubeEditor';
export default async function EditYouTubePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <YouTubeEditor videoId={Number(id)} />;
}
