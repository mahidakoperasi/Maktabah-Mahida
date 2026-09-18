import { redirect } from 'next/navigation';

export default async function MaktabahFallbackPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const kategori = slug[0] ?? '';
  redirect(`/maktabah?kategori=${encodeURIComponent(kategori)}`);
}
