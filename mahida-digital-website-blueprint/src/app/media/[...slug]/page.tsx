import { redirect } from 'next/navigation';

export default async function MediaFallbackPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const jenis = slug[0] ?? '';
  redirect(`/media?jenis=${encodeURIComponent(jenis)}`);
}
