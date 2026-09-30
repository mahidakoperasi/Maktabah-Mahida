import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublicPage, paragraphs } from '@/lib/cms';
import { getAdmissionSettings } from '@/lib/admissions';
import GenericPageTemplate from '@/components/GenericPageTemplate';
import { getDesign } from '@/lib/design-store';
import { getVisibleDirectory } from '@/lib/public-directory-store';
import RichContent from '@/components/RichContent';

export const metadata = { title: 'Informasi Pendaftaran Santri' };

export default async function AdmissionsPage() {
  const page = await getPublicPage('/tentang/pendaftaran');
  if (!page) notFound();
  const settings = await getAdmissionSettings();
  const content = await getDesign(page.path, 'content');
  const directory = await getVisibleDirectory();
  const whatsapp = directory.contacts.find(
    (c) => c.category === 'pendaftaran' && c.channel === 'whatsapp',
  );
  return (
    <GenericPageTemplate
      path={page.path}
      headerActions={
        settings.applicationUrl && (
          <a
            href={settings.applicationUrl}
            className="btn-primary"
            target={
              settings.applicationUrl.startsWith('/') ? undefined : '_blank'
            }
            rel="noopener noreferrer"
          >
            {settings.applicationLabel}
          </a>
        )
      }
      title={page.title}
      intro={settings.introduction || page.intro}
      paragraphs={page.body ? paragraphs(page.body) : []}
      section="Tentang Mahida"
    >
      <div className="grid gap-10">
        <section aria-labelledby="admission-steps">
          <h2 id="admission-steps" className="font-serif text-2xl font-bold">
            Alur Pendaftaran
          </h2>
          {settings.steps.length ? (
            <ol className="mt-6 border-l-2 border-emerald-forest/30 pl-7">
              {settings.steps.map((step, index) => (
                <li key={index} className="relative pb-8 last:pb-0">
                  <span className="absolute -left-[2.55rem] grid h-7 w-7 place-items-center rounded-full bg-emerald-forest text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <p className="break-words leading-7">{step}</p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-4 text-warm-gray-600">
              Tahapan seleksi akan diumumkan melalui kanal resmi Mahida.
            </p>
          )}
        </section>
        <section aria-labelledby="admission-requirements">
          <h2
            id="admission-requirements"
            className="font-serif text-2xl font-bold"
          >
            Persyaratan & Berkas
          </h2>
          {settings.requirements.length ? (
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {settings.requirements.map((item, index) => (
                <li
                  key={index}
                  className="break-words border bg-white p-4 leading-7"
                >
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-warm-gray-600">
              Persyaratan resmi akan diumumkan melalui kanal Mahida.
            </p>
          )}
        </section>
      </div>
      {content?.brochureUrl && (
        <a
          href={content.brochureUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary"
        >
          Unduh Brosur Resmi
        </a>
      )}
      <section aria-label="Informasi biaya">
        <h2 className="mb-4 text-2xl font-bold">Informasi Biaya</h2>
        {content?.fees ? (
          <div className="prose-article space-y-4">
            <RichContent content={content.fees} />
          </div>
        ) : (
          <p>
            Silakan meminta rincian biaya resmi melalui{' '}
            <Link href="/tentang/kontak" className="underline">
              kontak pendaftaran
            </Link>
            .
          </p>
        )}
      </section>
      {Boolean(content?.faq.length) && (
        <section aria-label="Pertanyaan umum" className="space-y-3">
          <h2 className="text-2xl font-bold">Pertanyaan Umum</h2>
          {content?.faq.map((f, i) => (
            <details key={i} className="border bg-white p-4">
              <summary className="cursor-pointer py-2 font-bold">
                {f.question}
              </summary>
              <p className="mt-3 whitespace-pre-line leading-7">{f.answer}</p>
            </details>
          ))}
        </section>
      )}
      {Boolean(content?.testimonials.length) && (
        <section aria-label="Testimoni" className="grid gap-4 sm:grid-cols-2">
          {content?.testimonials
            .filter((t) => t.permission)
            .map((t, i) => (
              <blockquote key={i} className="border bg-white p-5">
                <p>{t.text}</p>
                <footer className="mt-3 font-bold">{t.name}</footer>
              </blockquote>
            ))}
        </section>
      )}
      {whatsapp && (
        <a
          href={whatsapp.href}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-4 right-4 z-40 rounded-full bg-emerald-forest px-5 py-3 text-sm font-bold text-white shadow-lg"
        >
          WhatsApp PPDB
        </a>
      )}
      <section>
        <div className="border border-mahida-200 bg-white p-6 sm:p-8">
          <h2 className="text-2xl font-bold">Siap bergabung dengan Mahida?</h2>
          <div className="mt-5 flex flex-wrap gap-3">
            {settings.applicationUrl && (
              <a
                href={settings.applicationUrl}
                target={
                  settings.applicationUrl.startsWith('/') ? undefined : '_blank'
                }
                rel={
                  settings.applicationUrl.startsWith('/')
                    ? undefined
                    : 'noopener noreferrer'
                }
                className="btn-primary"
              >
                {settings.applicationLabel}
              </a>
            )}
            <Link href="/tentang/kontak" className="btn-secondary">
              Hubungi Mahida
            </Link>
          </div>
        </div>
      </section>
    </GenericPageTemplate>
  );
}
