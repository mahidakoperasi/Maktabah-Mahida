import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Arsip',
  description: 'Arsip konten Mahida Digital berdasarkan tahun dan kategori. Jelajahi sejarah dan dokumen digital Mahida.',
};

const archiveYears = [
  { year: 2026, count: 156 },
  { year: 2025, count: 234 },
  { year: 2024, count: 189 },
  { year: 2023, count: 145 },
  { year: 2022, count: 98 },
  { year: 2021, count: 67 },
];

const categories = [
  'Berita', 'Karya', 'Terjemahan', 'Video', 'Galeri', 'Agenda', 'Artikel',
];

export default function ArsipPage() {
  return (
    <>
      <section className="bg-warm-gray-800 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="label text-brass-light mb-3">Arsip</p>
          <h1 className="text-3xl md:text-4xl font-serif font-bold mb-2">Arsip Digital</h1>
          <p className="text-white/60 max-w-xl">Jelajahi semua konten yang pernah diterbitkan di Mahida Digital.</p>
        </div>
      </section>

      {/* Year Navigation */}
      <section className="py-16 bg-white border-b border-mahida-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="heading-lg text-charcoal mb-8">Berdasarkan Tahun</h2>
          
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {archiveYears.map((item) => (
              <Link
                key={item.year}
                href={`/arsip/${item.year}`}
                className="group p-5 bg-cream hover:bg-emerald-50 border border-mahida-150 hover:border-emerald-300 text-center transition-all"
              >
                <span className="font-serif font-bold text-2xl text-charcoal group-hover:text-emerald-forest transition-colors block">
                  {item.year}
                </span>
                <span className="text-xs text-warm-gray-500 mt-1">{item.count} konten</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Category Navigation */}
      <section className="py-16 bg-cream">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="heading-lg text-charcoal mb-8">Berdasarkan Kategori</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat}
                href={`/arsip?kategori=${cat.toLowerCase()}`}
                className="group p-5 bg-white hover:bg-mahida-50 border border-mahida-150 hover:border-emerald-300 transition-all flex items-center justify-between"
              >
                <span className="font-medium text-charcoal group-hover:text-emerald-forest transition-colors">{cat}</span>
                <ArrowRight size={14} className="text-warm-gray-400 group-hover:text-emerald-forest transition-colors opacity-0 group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Event-based Archive */}
      <section className="py-16 bg-white border-t border-mahida-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="heading-lg text-charcoal mb-8">Arsip Berdasarkan Peristiwa</h2>
          
          <div className="space-y-4">
            {[
              { event: 'Maulid Nabi 1447 H', year: '2026', items: ['Berita', 'Foto', 'Video'] },
              { event: 'Haflah Akhirussanah Genap 2025/2026', year: '2026', items: ['Berita', 'Video', 'Foto', 'Dokumentasi'] },
              { event: 'Wisuda Tahfidz Angkatan Ke-V', year: '2026', items: ['Berita', 'Foto', 'Video'] },
              { event: 'Maulid Nabi 1446 H', year: '2025', items: ['Berita', 'Foto', 'Video'] },
            ].map((event, i) => (
              <Link key={i} href="/arsip" className="flex items-center justify-between p-5 border border-mahida-200 hover:border-emerald-300 hover:bg-mahida-50/30 rounded-sm transition-all group">
                <div>
                  <span className="tag-pill text-xs mb-1 inline-block">{event.year}</span>
                  <h3 className="font-semibold text-charcoal group-hover:text-emerald-forest transition-colors">{event.event}</h3>
                </div>
                <div className="flex gap-2">
                  {event.items.map((item) => (
                    <span key={item} className="text-[11px] px-2 py-0.5 bg-mahida-100 text-mahida-700 rounded-sm">{item}</span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
