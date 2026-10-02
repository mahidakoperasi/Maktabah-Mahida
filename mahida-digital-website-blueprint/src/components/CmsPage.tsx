import { notFound } from 'next/navigation';
import { getPublicPage, paragraphs } from '@/lib/cms';
import DailyHighlight from './DailyHighlight';
import GenericPageTemplate from './GenericPageTemplate';
import DesignHero from './DesignHero';
import DesignSections from './DesignSections';
import DesignTextBlock from './DesignTextBlock';

const editorialPaths = new Set([
  '/tentang/profil',
  '/tentang/visi-misi',
  '/pesantren/kehidupan',
]);

export default async function CmsPage({ path }: { path: string }) {
  const page = await getPublicPage(path);
  if (!page) notFound();
  if (editorialPaths.has(path))
    return (
      <GenericPageTemplate
        path={path}
        title={page.title}
        intro={page.intro}
        paragraphs={page.body ? paragraphs(page.body) : []}
        section="Mahida Salam"
      />
    );
  return (
    <div className="min-h-screen bg-cream">
      <DesignHero path={path} className="py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h1 className="display-md text-white">{page.title}</h1>
          {page.intro && (
            <p className="mt-4 max-w-2xl text-white/80">{page.intro}</p>
          )}
        </div>
      </DesignHero>
      {(path === '/pesantren' || path === '/tentang') && (
        <DailyHighlight section={path} />
      )}
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <DesignTextBlock path={path} hasText={Boolean(page.body?.trim())}>
          {page.body?.trim() ? (
            <div className="prose-article space-y-5 border border-mahida-200 bg-white p-6 sm:p-10">
              {paragraphs(page.body).map((paragraph, index) => (
                <p key={index} dir="auto">
                  {paragraph}
                </p>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              Informasi resmi akan tersedia setelah diisi melalui pengelolaan
              Mahida.
            </div>
          )}
        </DesignTextBlock>
        <div className="mt-10">
          <DesignSections path={path} />
        </div>
      </section>
    </div>
  );
}
