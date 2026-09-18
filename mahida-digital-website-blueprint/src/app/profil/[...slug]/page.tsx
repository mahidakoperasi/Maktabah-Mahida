import { redirect } from 'next/navigation';

export default async function ProfileModuleFallbackPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const tab = slug[0] ?? '';
  redirect(`/profil?tab=${encodeURIComponent(tab)}`);
}
