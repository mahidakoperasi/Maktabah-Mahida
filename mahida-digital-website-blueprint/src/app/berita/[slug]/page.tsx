import { redirect } from 'next/navigation';

export default async function BeritaDetailFallbackPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/media/berita/${encodeURIComponent(slug)}`);
}
