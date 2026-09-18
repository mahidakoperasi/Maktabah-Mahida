import { redirect } from 'next/navigation';

export default async function LiterasiFallbackPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const kategori = slug[0] ?? '';
  redirect(`/literasi?kategori=${encodeURIComponent(kategori)}`);
}
