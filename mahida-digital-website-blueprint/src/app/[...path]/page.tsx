import CmsPage from '@/components/CmsPage';

export const dynamic = 'force-dynamic';
export default async function CustomPage({ params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return <CmsPage path={`/${path.join('/')}`} />;
}
