import { notFound } from 'next/navigation';
import UnitTemplate from '@/components/UnitTemplate';
import { educationUnits } from '@/lib/design-pages';
import { getPublicPage } from '@/lib/cms';

export function generateStaticParams() { return educationUnits.map((unit) => ({ slug: unit.slug })); }

export default async function UnitPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const unit = educationUnits.find((item) => item.slug === slug);
  if (!unit) notFound();
  const page = await getPublicPage(`/tentang/unit-pendidikan/${slug}`);
  if (!page) notFound();
  return <UnitTemplate title={page.title} level={unit.level} description={page.body || page.intro || undefined} />;
}
