import { notFound } from 'next/navigation';
import { getPublicPage, paragraphs } from '@/lib/cms';

export default async function CmsPage({ path }: { path: string }) {
  const page = await getPublicPage(path);
  if (!page) notFound();
  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-emerald-forest py-14 text-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h1 className="display-md text-white">{page.title}</h1>
          {page.intro && <p className="mt-4 max-w-2xl text-white/80">{page.intro}</p>}
        </div>
      </header>
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        {page.body?.trim() ? (
          <div className="prose-article space-y-5 border border-mahida-200 bg-white p-6 sm:p-10">
            {paragraphs(page.body).map((paragraph, index) => <p key={index} dir="auto">{paragraph}</p>)}
          </div>
        ) : (
          <div className="empty-state">
            Informasi resmi akan tersedia setelah diisi melalui pengelolaan Mahida.
          </div>
        )}
      </section>
    </div>
  );
}
