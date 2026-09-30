import { notFound } from 'next/navigation';
import UnitTemplate from '@/components/UnitTemplate';
import { educationUnits } from '@/lib/design-pages';
import { getPublicPage } from '@/lib/cms';
import { getEditorialContent } from '@/lib/editorial-content';

export function generateStaticParams() {
  return educationUnits.map((unit) => ({ slug: unit.slug }));
}

export default async function UnitPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const unit = educationUnits.find((item) => item.slug === slug);
  if (!unit) notFound();
  const page = await getPublicPage(`/tentang/unit-pendidikan/${slug}`);
  if (!page) notFound();
  const visual = await getEditorialContent(page.path);
  const facilities = visual.facilities.filter(
    (f) => f.visible !== false && f.title.trim(),
  );
  return (
    <UnitTemplate
      path={page.path}
      aboutVisible={visual.aboutVisible}
      facilitiesVisible={visual.facilitiesVisible}
      registrationVisible={visual.registrationVisible}
      title={page.title}
      level={visual.level || unit.level}
      accreditation={visual.accreditation}
      description={page.body || page.intro || undefined}
      images={visual.images}
      facilities={facilities.map((facility) => ({
        title: facility.title,
        description: facility.description,
      }))}
      facilityImages={facilities.map((facility) => facility.imageUrl)}
      ctaTitle={visual.ctaTitle}
      ctaLabel={visual.ctaLabel}
      ctaHref={visual.ctaHref}
      sectionLabel={visual.sectionLabel}
      aboutHeading={visual.aboutHeading}
      facilitiesHeading={visual.facilitiesHeading}
      registrationLabel={visual.registrationLabel}
    />
  );
}
