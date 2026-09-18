import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen, PenTool, FileText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Literasi',
  description: 'Bacaan pilihan dari Mahida Digital: artikel, esai, opini, resensi, dan refleksi.',
};

const categories = [
  { name: 'Artikel', slug: '/literasi/artikel', count: 42, icon: FileText, desc: 'Tulisan informatif dan edukatif' },
  { name: 'Esai & Opini', slug: '/karya/esai', count: 28, icon: PenTool, desc: 'Gagasan dan pemikiran kritis' },
  { name: 'Resensi', slug: '/literasi/resensi', count: 15, icon: BookOpen, desc: 'Ulasan buku dan kitab' },
  { name: 'Refleksi', slug: '/literasi/refleksi', count: 19, icon: PenTool, desc: 'Renungan dan pengalaman' },
  { name: 'Pendidikan', slug: '/literasi/pendidikan', count: 22, icon: BookOpen, desc: 'Dunia pendidikan pesantren' },
  { name: 'Pesantren', slug: '/literasi/pesantren', count: 31, icon: FileText, desc: 'Kehidupan dan tradisi' },
];

const featuredArticles = [
  {
    title: 'Tradisi Keilmuan Pesantren di Era Digital',
    excerpt: 'Bagaimana sebuah tradisi keilmuan bertahan berabad-abad di pulau Jawa? Jejak pesantren tidak hanya ada dalam bangunan, tapi dalam cara membaca, menghafal, dan merenungkan ilmu.',
    category: 'Refleksi',
    author: 'Penulis Mahida',
    date: '12 Januari 2026',
    readTime: '8 min',
  },
  {
    title: 'Membaca Matan: Lebih dari Sekadar Memoriter',
    excerpt: 'Membaca matan bukan sekadar melafalkan kata, tetapi masuk ke dalam cakrawala pemikiran seorang imam yang telah merintis jalan sebelum kita.',
    category: 'Esai',
    author: 'Ustadz Penulis',
    date: '10 Januari 2026',
    readTime: '6 min',
  },
];

export default function LiterasiPage() {
  return (
    <>
      <section className="bg-emerald-forest text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="label text-brass-light mb-3">Literasi</p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold mb-4">Ruang Baca</h1>
          <p className="text-white/70 max-w-xl text-lg">
            Artikel, esai, opini, resensi, dan refleksi dari lingkungan Mahida.
          </p>
        </div>
      </section>

      {/* Featured Articles */}
      <section className="py-16 bg-white border-b border-mahida-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="heading-lg text-charcoal mb-8">Bacaan Pilihan</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {featuredArticles.map((article) => (
              <article key={article.title} className="group">
                <Link href="/literasi/artikel/contoh" className="block">
                  <span className="category-pill">{article.category}</span>
                  <h3 className="text-xl font-serif font-bold text-charcoal mt-3 group-hover:text-emerald-forest transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-warm-gray-600 mt-2 line-clamp-3 leading-relaxed">{article.excerpt}</p>
                  <div className="flex items-center gap-4 mt-4 text-sm text-warm-gray-500">
                    <span>{article.author}</span>
                    <span>•</span>
                    <span>{article.date}</span>
                    <span>•</span>
                    <span>{article.readTime} baca</span>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="heading-lg text-charcoal mb-8">Jelajahi Kategori</h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={cat.slug}
                className="group bg-white p-6 border border-mahda-150 hover:border-emerald-300 hover:shadow-card transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-mahida-50 rounded-sm flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-50 transition-colors">
                    <cat.icon size={18} className="text-warm-gray-500 group-hover:text-emerald-forest transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-charcoal group-hover:text-emerald-forest transition-colors">{cat.name}</h3>
                    <p className="text-sm text-warm-gray-500 mt-0.5">{cat.desc}</p>
                    <span className="text-xs text-warm-gray-400 mt-2 inline-block">{cat.count} artikel</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
