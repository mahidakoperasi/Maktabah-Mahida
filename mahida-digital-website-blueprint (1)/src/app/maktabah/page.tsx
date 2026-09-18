import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Maktabah',
  description: 'Ruang ilmu Mahida: kitab, terjemahan, kajian, dan buku. Nahwu, Sharaf, Fiqh, Tafsir, Hadits, Aqidah, Tasawuf.',
};

const disciplines = [
  { name: 'Nahwu', arabic: 'النَّحْوُ', slug: '/maktabah/nahwu', count: 18, color: 'bg-emerald-50 text-emerald-800' },
  { name: 'Sharaf', arabic: 'الصَّرْفُ', slug: '/maktabah/sharaf', count: 12, color: 'bg-blue-50 text-blue-800' },
  { name: 'Fiqh', arabic: 'الفِقْهُ', slug: '/maktabah/fiqh', count: 24, color: 'bg-purple-50 text-purple-800' },
  { name: 'Usul Fiqh', arabic: 'أُصُولُ الفِقْهِ', slug: '/maktabah/usul-fiqh', count: 8, color: 'bg-pink-50 text-pink-800' },
  { name: 'Tafsir', arabic: 'التَّفْسِيرُ', slug: '/maktabah/tafsir', count: 10, color: 'bg-amber-50 text-amber-800' },
  { name: 'Hadits', arabic: 'الْحَدِيثُ', slug: '/maktabah/hadits', count: 15, color: 'bg-red-50 text-red-800' },
  { name: 'Aqidah', arabic: 'الْعَقِيدَةُ', slug: '/maktabah/aqidah', count: 9, color: 'bg-indigo-50 text-indigo-800' },
  { name: 'Tasawuf', arabic: 'التَّصَوُّفُ', slug: '/maktabah/tasawuf', count: 7, color: 'bg-teal-50 text-teal-800' },
  { name: 'Balaghah', arabic: 'الْبَلَاغَةُ', slug: '/maktabah/balaghah', count: 6, color: 'bg-cyan-50 text-cyan-800' },
  { name: 'Bahasa Arab', arabic: 'اللُّغَةُ الْعَرَبِيَّةُ', slug: '/maktabah/bahasa-arab', count: 11, color: 'bg-orange-50 text-orange-800' },
];

const featuredBooks = [
  { title: 'Al-Ajurumiyah', author: 'Ibn Ajrum', discipline: 'Nahwu', type: 'Kitab' },
  { title: 'Matn Al-Bayquniyyah', author: 'Al-Bayquni', discipline: 'Hadits', type: 'Matan' },
  { title: 'Sarf al-Galayaini', author: 'Mustafa Al-Galayaini', discipline: 'Sharaf', type: 'Kitab' },
  { title: 'Matn Ummul Barahin', author: 'Al-Sanusi', discipline: 'Aqidah', type: 'Matan' },
  { title: 'Matn Al-Jurjaniyyah', author: 'Al-Jurjani', discipline: 'Balaghah', type: 'Matan' },
  { title: 'Safinatun Najah', author: 'Ibn Salim', discipline: 'Fiqh', type: 'Kitab' },
];

export default function MaktabahPage() {
  return (
    <>
      <section className="bg-emerald-rich text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="label text-brass-light mb-3">Maktabah</p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold mb-4">Ruang Ilmu</h1>
          <p className="text-white/70 max-w-xl text-lg leading-relaxed">
            Kitab-kitab yang dipelajari, diterjemahkan, dijelaskan, dan dijadikan rujukan di Mahida.
            Dari nahwu hingga tasawuf, dari matan hingga syarah.
          </p>
        </div>
      </section>

      {/* Disciplines Grid */}
      <section className="py-16 bg-white border-b border-mahida-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="heading-lg text-charcoal mb-8">Disiplin Ilmu</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {disciplines.map((disc) => (
              <Link
                key={disc.slug}
                href={disc.slug}
                className="group p-5 bg-cream hover:bg-white border border-transparent hover:border-emerald-300 hover:shadow-card transition-all text-center"
              >
                <span className={`font-arabic text-lg block mb-2 ${disc.color.split(' ')[0]} bg-opacity-0`} dir="rtl" lang="ar">{disc.arabic}</span>
                <h3 className="font-semibold text-charcoal group-hover:text-emerald-forest transition-colors text-sm">{disc.name}</h3>
                <p className="text-xs text-warm-gray-400 mt-1">{disc.count} kitab</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Books */}
      <section className="py-16 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="heading-lg text-charcoal">Kitab & Buku Pilihan</h2>
              <p className="text-sm text-warm-gray-500 mt-1">Kitab yang dipelajari dan tersedia di Mahida</p>
            </div>
            <Link href="/maktabah/kitab" className="hidden md:flex items-center gap-2 text-sm font-semibold text-emerald-forest hover:underline">
              Semua Kitab
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {featuredBooks.map((book) => (
              <Link key={book.title} href={`/maktabah/kitab/${book.title.toLowerCase().replace(/\s+/g, '-')}`} className="group">
                <div className="aspect-[3/4] bg-gradient-to-br from-mahida-100 to-mahida-200 rounded-sm shadow-elevated overflow-hidden mb-3 flex flex-col items-center justify-center p-4">
                  <BookOpen size={28} className="text-emerald-forest/30 mb-2" />
                  <span className="tag-pill text-[10px]">{book.discipline}</span>
                </div>
                <h4 className="font-semibold text-sm text-charcoal group-hover:text-emerald-forest transition-colors line-clamp-1">{book.title}</h4>
                <p className="text-xs text-warm-gray-500 mt-0.5">{book.author}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Section Links */}
      <section className="py-16 bg-white border-t border-mahida-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Kitab Diajar', desc: 'Daftar lengkap kitab yang dipelajari di Mahida', href: '/maktabah/kitab' },
              { name: 'Terjemahan', desc: 'Karya terjemahan kitab dan kajian oleh santri dan ustadz', href: '/karya/terjemahan' },
              { name: 'Kajian', desc: 'Catatan kajian dan pembahasan kitab', href: '/maktabah/kajian' },
            ].map((section) => (
              <Link key={section.href} href={section.href} className="group block p-6 border border-mahida-200 hover:border-emerald-300 hover:shadow-card transition-all">
                <h3 className="font-serif font-bold text-charcoal group-hover:text-emerald-forest transition-colors">{section.name}</h3>
                <p className="text-sm text-warm-gray-600 mt-1">{section.desc}</p>
                <ArrowRight size={14} className="mt-3 text-warm-gray-400 group-hover:text-emerald-forest transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
