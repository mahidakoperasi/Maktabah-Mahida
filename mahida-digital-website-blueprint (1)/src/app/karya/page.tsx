import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Karya Mahida',
  description: 'Ruang yang menghimpun gagasan, tulisan, penerjemahan, penelitian, sastra, kreativitas visual, budaya, dan produksi media dari lingkungan Mahida.',
};

const karyaCategories = [
  {
    name: 'Esai & Gagasan',
    slug: '/karya/esai',
    description: 'Pemikiran, opini, dan gagasan orisinal dari santri, ustadz, dan keluarga Mahida.',
    subcategories: ['Pendidikan', 'Sosial', 'Pesantren', 'Refleksi', 'Budaya', 'Opini'],
    count: 24,
  },
  {
    name: 'Terjemahan & Khazanah',
    slug: '/karya/terjemahan',
    description: 'Terjemahan kitab, syarah, ta\'liq, taqrir, catatan, ringkasan, dan pembahasan kitab.',
    subcategories: ['Terjemahan Kitab', 'Syarah', 'Ta\'liq', 'Ringkasan'],
    count: 12,
  },
  {
    name: 'Sastra',
    slug: '/karya/sastra',
    description: 'Puisi, cerpen, prosa, nadhom, sastra pesantren, Pegon, dan sastra Jawa.',
    subcategories: ['Puisi', 'Cerpen', 'Prosa', 'Nadhom', 'Sastra Pegon'],
    count: 18,
  },
  {
    name: 'Falak & Sains',
    slug: '/karya/falak',
    description: 'Rukyat, hilal, gerhana, kalender Hijriah, astronomi, arah kiblat, dan sains populer.',
    subcategories: ['Rukyat & Hilal', 'Astronomi', 'Kalender Hijriah'],
    count: 7,
  },
  {
    name: 'Riset & Kajian',
    slug: '/karya/riset',
    description: 'Hasil penelitian, makalah, resume kajian, hasil diskusi, bahtsul masa\'il, laporan observasi.',
    subcategories: ['Penelitian', 'Makalah', 'Bahtsul Masa\'il', 'Resume Kajian'],
    count: 9,
  },
  {
    name: 'Budaya & Tradisi',
    slug: '/karya/budaya',
    description: 'Tradisi pesantren, budaya Jawa, Serat, Pegon, macapat, shalawat, kegiatan tradisional.',
    subcategories: ['Tradisi Pesantren', 'Budaya Jawa', 'Macapat', 'Shalawat'],
    count: 15,
  },
  {
    name: 'Fotografi',
    slug: '/karya/fotografi',
    description: 'Photo story, dokumentasi, fotografi santri, kehidupan pondok, lingkungan, human interest.',
    subcategories: ['Photo Story', 'Dokumentasi', 'Human Interest'],
    count: 42,
  },
  {
    name: 'Media Kreatif',
    slug: '/karya/media-kreatif',
    description: 'Film pendek, dokumenter, video, wawancara, podcast, broadcast, motion graphic, desain, visual storytelling.',
    subcategories: ['Film Pendek', 'Dokumenter', 'Podcast', 'Motion Graphic'],
    count: 31,
  },
];

export default function KaryaPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-charcoal text-white py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="label text-brass-light mb-4">Karya Mahida</p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6 max-w-3xl leading-[1.08]">
            Lahir dari Mahida
          </h1>
          <p className="text-lg md:text-xl text-warm-gray-400 max-w-2xl leading-relaxed mb-8">
            Gagasan yang ditulis, ilmu yang diterjemahkan, tradisi yang dirawat, 
            dan kreativitas yang tumbuh dari Mahida.
          </p>
          
          <div className="flex items-center gap-3 text-sm text-warm-gray-500">
            <span>{158} karya diterbitkan</span>
            <span>•</span>
            <span>8 kategori</span>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-16 bg-cream -mt-1 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-6">
            {karyaCategories.map((cat) => (
              <Link
                key={cat.slug}
                href={cat.slug}
                className="group bg-white p-8 border border-mahida-150 hover:border-emerald-300 hover:shadow-card transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-xl font-serif font-bold text-charcoal group-hover:text-emerald-forest transition-colors">
                    {cat.name}
                  </h2>
                  <span className="text-sm font-medium text-warm-gray-400 group-hover:text-emerald-forest transition-colors flex-shrink-0 ml-4">
                    {cat.count}
                  </span>
                </div>
                <p className="text-sm text-warm-gray-600 leading-relaxed mb-4">{cat.description}</p>
                <div className="flex flex-wrap gap-2 pt-4 border-t border-mahida-100">
                  {cat.subcategories.map((sub) => (
                    <span key={sub} className="tag-pill text-xs">{sub}</span>
                  ))}
                </div>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-forest opacity-0 group-hover:opacity-100 transition-opacity mt-4">
                  Jelajahi
                  <ArrowRight size={14} />
                </span>
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-16 text-center bg-parchment rounded-sm p-10 border border-mahida-200">
            <h2 className="text-2xl font-serif font-bold text-charcoal mb-3">Punya Karya untuk Diterbitkan?</h2>
            <p className="text-warm-gray-600 max-w-lg mx-auto mb-6">
              Kirimkan esai, terjemahan, sastra, atau karya kreatifmu untuk menjadi bagian dari Mahida Digital.
            </p>
            <Link href="/kirim-karya" className="btn-primary">
              Lihat Panduan Kirim Karya
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
