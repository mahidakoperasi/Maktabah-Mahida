import { notFound } from 'next/navigation';
import ContentManager from '@/components/admin/ContentManager';
import { contentSections, isContentSection } from '@/lib/content-sections';

export default async function AdminContentSection({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!isContentSection(section)) notFound();
  const config = contentSections[section];
  return <ContentManager section={section} label={config.label} publicPath={config.publicPath} />;
}
