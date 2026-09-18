import Link from 'next/link';

function titleCase(value: string) {
  return value
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default async function AdminModulePlaceholder({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const moduleName = titleCase(slug[slug.length - 1] ?? 'Modul');

  return (
    <section className="max-w-4xl">
      <p className="label mb-2">Admin Panel</p>
      <h1 className="text-3xl font-serif font-bold text-charcoal mb-4">{moduleName}</h1>
      <div className="bg-white border border-mahida-200 rounded-sm p-6">
        <p className="text-warm-gray-600 mb-4">
          Modul ini sudah memiliki rute yang aman dan akan diaktifkan pada tahap CMS berikutnya.
        </p>
        <Link href="/admin" className="btn-primary inline-flex">
          Kembali ke Dashboard
        </Link>
      </div>
    </section>
  );
}
