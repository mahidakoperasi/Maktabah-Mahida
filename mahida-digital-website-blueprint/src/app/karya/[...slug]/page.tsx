import { redirect } from 'next/navigation';

export default async function KaryaFallbackPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const kategori = slug[0] ?? '';
  redirect(`/karya?kategori=${encodeURIComponent(kategori)}`);
}
