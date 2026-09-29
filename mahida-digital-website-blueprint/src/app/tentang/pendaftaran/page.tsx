import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublicPage } from '@/lib/cms';
import { getAdmissionSettings } from '@/lib/admissions';
import GenericPageTemplate from '@/components/GenericPageTemplate';

export const metadata = { title: 'Informasi Pendaftaran Santri' };

export default async function AdmissionsPage() {
  const page = await getPublicPage('/tentang/pendaftaran');
  if (!page) notFound();
  const settings = await getAdmissionSettings();
  return <GenericPageTemplate title={page.title} intro={settings.introduction || page.intro} section="Tentang Mahida">
    <div className="grid gap-10">
      <section aria-labelledby="admission-steps"><h2 id="admission-steps" className="font-serif text-2xl font-bold">Alur Pendaftaran</h2>
        {settings.steps.length ? <ol className="mt-6 border-l-2 border-emerald-forest/30 pl-7">{settings.steps.map((step, index) => <li key={index} className="relative pb-8 last:pb-0"><span className="absolute -left-[2.55rem] grid h-7 w-7 place-items-center rounded-full bg-emerald-forest text-xs font-bold text-white">{index + 1}</span><p className="break-words leading-7">{step}</p></li>)}</ol> : <p className="mt-4 text-warm-gray-600">Tahapan seleksi akan diumumkan melalui kanal resmi Mahida.</p>}
      </section>
      <section aria-labelledby="admission-requirements"><h2 id="admission-requirements" className="font-serif text-2xl font-bold">Persyaratan & Berkas</h2>
        {settings.requirements.length ? <ul className="mt-6 list-disc space-y-3 pl-5 leading-7">{settings.requirements.map((item, index) => <li key={index} className="break-words">{item}</li>)}</ul> : <p className="mt-4 text-warm-gray-600">Persyaratan resmi akan diumumkan melalui kanal Mahida.</p>}
      </section>
    </div>
    <section><div className="border border-mahida-200 bg-white p-6 sm:p-8"><h2 className="text-2xl font-bold">Siap bergabung dengan Mahida?</h2><div className="mt-5 flex flex-wrap gap-3">
      {settings.applicationUrl && <a href={settings.applicationUrl} target={settings.applicationUrl.startsWith('/') ? undefined : '_blank'} rel={settings.applicationUrl.startsWith('/') ? undefined : 'noopener noreferrer'} className="btn-primary">{settings.applicationLabel}</a>}
      <Link href="/tentang/kontak" className="btn-secondary">Hubungi Mahida</Link>
    </div></div></section>
  </GenericPageTemplate>;
}
