import { notFound } from 'next/navigation';
import { getPublicPage, paragraphs } from '@/lib/cms';
import GenericPageTemplate from '@/components/GenericPageTemplate';
import PublicDirectoryLinks from '@/components/PublicDirectoryLinks';
import ContactForm from '@/components/ContactForm';
import LocationDetails from '@/components/LocationDetails';
import { getVisibleDirectory } from '@/lib/public-directory-store';
import { getDesign } from '@/lib/design-store';
export const dynamic = 'force-dynamic';
export default async function Page() {
  const [page, directory, content] = await Promise.all([
    getPublicPage('/tentang/kontak'),
    getVisibleDirectory(),
    getDesign('/tentang/kontak', 'content'),
  ]);
  if (!page) notFound();
  return (
    <GenericPageTemplate
      path={page.path}
      title={page.title}
      intro={page.intro}
      paragraphs={page.body ? paragraphs(page.body) : []}
    >
      <div className="space-y-10">
        <LocationDetails content={content} />
        {(directory.contacts.length > 0 || directory.socials.length > 0) && (
          <section aria-label="Kontak berdasarkan layanan">
            <div className="space-y-8">
              {(
                [
                  ['pendaftaran', 'Pendaftaran / PPDB'],
                  ['umum', 'Umum / Humas'],
                  ['koperasi', 'Koperasi'],
                  ['lainnya', 'Layanan Lain'],
                ] as const
              ).map(
                ([category, label]) =>
                  directory.contacts.some((c) => c.category === category) && (
                    <section key={category}>
                      <h2 className="mb-4 text-2xl font-bold">{label}</h2>
                      <PublicDirectoryLinks
                        contacts={directory.contacts.filter(
                          (c) => c.category === category,
                        )}
                        socials={[]}
                      />
                    </section>
                  ),
              )}
              <PublicDirectoryLinks contacts={[]} socials={directory.socials} />
            </div>
          </section>
        )}
        {content?.contactFormEnabled && <ContactForm />}
      </div>
    </GenericPageTemplate>
  );
}
