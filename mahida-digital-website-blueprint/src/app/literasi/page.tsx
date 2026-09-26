import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Literasi',
  description: 'Ruang baca Mahida Digital.',
};

export default function LiterasiPage() {
  return (
    <>
      <section className="bg-emerald-forest py-16 text-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <p className="label mb-3 !text-white/70">Literasi</p>
          <h1 className="display-md text-white">Ruang Baca</h1>
          <p className="mt-4 max-w-2xl text-white/80">
            Jelajahi artikel yang telah diterbitkan di Mahida Digital.
          </p>
        </div>
      </section>
      <section className="mx-auto grid max-w-5xl gap-5 px-4 py-12 sm:px-6 md:grid-cols-2 lg:px-8">
        <Link href="/literasi/artikel" className="group border border-mahida-200 bg-white p-8">
          <h2 className="font-serif text-2xl font-bold text-charcoal">Artikel</h2>
          <p className="mt-3 text-warm-gray-600">Baca artikel yang telah diterbitkan.</p>
          <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-forest">
            Lihat artikel <ArrowRight size={16} />
          </span>
        </Link>
        <Link href="/karya/esai" className="group border border-mahida-200 bg-white p-8">
          <p className="label mb-3">Di Karya</p>
          <h2 className="font-serif text-2xl font-bold text-charcoal">Esai &amp; Opini</h2>
          <p className="mt-3 text-warm-gray-600">
            Esai dan opini berada dalam ruang Karya Mahida.
          </p>
          <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-forest">
            Jelajahi Karya <ArrowRight size={16} />
          </span>
        </Link>
      </section>
    </>
  );
}
