import { notFound } from 'next/navigation';
import { getPublicPage, paragraphs } from '@/lib/cms';
import { getDesign } from '@/lib/design-store';
import GenericPageTemplate from '@/components/GenericPageTemplate';
import LocationDetails from '@/components/LocationDetails';
export const dynamic = 'force-dynamic';
export default async function Page() {
  const page = await getPublicPage('/tentang/profil');
  if (!page) notFound();
  return (
    <GenericPageTemplate
      path={page.path}
      title={page.title}
      intro={page.intro}
      paragraphs={page.body ? paragraphs(page.body) : []}
      section="Mahida Salam"
    >
      <LocationDetails content={await getDesign(page.path, 'content')} />
    </GenericPageTemplate>
  );
}
