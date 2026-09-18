import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Bookmark, Share2, Clock, Eye, Calendar } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Tradisi Keilmuan Pesantren di Era Digital',
  description: 'Bagaimana sebuah tradisi keilmuan bertahan berabad-abad di pulau Jawa? Jejak pesantren tidak hanya ada dalam bangunan.',
};

// Sample article content for demonstration
const articleContent = `
<h2>Jejak yang Tak Pernah Padam</h2>
<p>Pesantren bukan sekadar lembaga pendidikan. Ia adalah peradaban kecil yang telah bertahan selama berabad-abad di Nusantara. Dari garis waktu panjang itu, satu hal yang konsisten: komitmen pada keilmuan yang autentik dan mendalam.</p>

<p>Di Mahida, tradisi ini dijaga dengan cara yang sederhana namun kuat. Setiap pagi, santri berkumpul untuk menghafal. Setiap sore, mereka duduk bersama membaca kitab. Setiap malam, mereka bermuzakarah — berdiskusi tentang apa yang dipelajari.</p>

<h2>Metode yang Teruji Waktu</h2>
<p>Metode <em lang="ar" dir="rtl">سُوْرَان</em> (sorogan) dan <em lang="ar" dir="rtl">بَنْدُوْنَان</em> (bandongan) bukanlah metode kuno yang perlu ditinggalkan. Justru, dalam konteks pembelajaran bahasa Arab dan ilmu-ilmu Islam, metode ini terbukti efektif membangun pemahaman yang mendalam.</p>

<blockquote lang="ar" dir="rtl">
  مَنْ طَلَبَ الْعِلْمَ جُمْلَةً غَلَبَ عَلَيْهِ الْجَهْلُ جُمْلَةً
  <cite>— Para ahli pesantren</cite>
</blockquote>

<p>Baris di atas mengandung makna: "Siapa yang menuntut ilmu secara keseluruhan (tanpa tahapan), maka kebodohan pun akan menguasainya secara keseluruhan." Inilah prinsip yang melandasi sistem pembelajaran bertahap di pesantren.</p>

<h2>Tantangan Era Digital</h2>
<p>Tidak bisa dipungkiri, era digital membawa tantangan baru. Perhatian santri terpecah antara kitab dan smartphone. Tapi di Mahida, kita percaya bahwa kedua dunia ini bisa berjalan berdampingan.</p>

<p>Digitalisasi bukan untuk menggantikan interaksi langsung dengan guru, melainkan untuk <strong>mengakselerasinya</strong>. Kitab tetap dibaca dalam bentuk fisik, tapi catatan, terjemahan, dan diskusi bisa berlangsung secara digital.</p>

<h2>Masa Depan Tradisi</h2>
<p>Tradisi keilmuan pesantren akan terus hidup selama ada orang yang mau belajar dengan penuh ketulusan. Di Mahida, kami berkomitmen menjadi bagian dari rantai panjang penjaga tradisi ini — sambil terus berinovasi untuk menjawab tantangan zaman.</p>

<ul>
  <li><strong>Konsistensi</strong> dalam pembelajaran harian adalah kunci</li>
  <li><strong>Adab</strong> harus mendahului ilmu</li>
  <li><strong>Mudzakarah</strong> (diskusi) memperkuat pemahaman</li>
  <li><strong>Terjemahan</strong> menjembatani tradisi dan modernitas</li>
</ul>

<p>Mahida Digital hadir sebagai upaya untuk memperluas jangkauan tradisi ini. Bukan menggantikan pondok fisik, melainkan menjadi jendela bagi siapa saja yang ingin mengenal, mempelajari, dan mungkin suatu hari, bergabung.</p>
`;

const relatedArticles = [
  { title: 'Membaca Matan: Lebih dari Sekadar Memorier', category: 'Esai' },
  { title: 'Metode Pengajaran Bahasa Arab Ala Pesantren', category: 'Pendidikan' },
  { title: 'Sorogan dan Bandongan: Dua Pilar Pembelajaran', category: 'Refleksi' },
];

export default function ArtikelContohPage() {
  return (
    <>
      {/* Reading Progress Bar - simulated with JS in production */}
      <div className="reading-progress" style={{ width: '0%' }} />

      <article className="bg-white">
        {/* Article Header */}
        <header className="border-b border-mahida-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10">
            {/* Back link */}
            <Link href="/literasi" className="inline-flex items-center gap-1.5 text-sm text-warm-gray-500 hover:text-emerald-forest mb-6 transition-colors">
              <ArrowLeft size={15} />
              Kembali ke Literasi
            </Link>

            <span className="category-pill mb-4 inline-block">Refleksi</span>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-charcoal leading-[1.08] mb-4">
              Tradisi Keilmuan Pesantren di Era Digital
            </h1>
            
            <p className="text-lg md:text-xl text-warm-gray-600 leading-relaxed max-w-3xl mb-8">
              Bagaimana sebuah tradisi keilmuan bertahan berabad-abad? Jejak pesantren 
              tidak hanya ada dalam bangunan, tapi dalam cara membaca, menghafal, dan merenungkan ilmu.
            </p>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-warm-gray-500 pb-8 border-b border-mahida-100">
              <span>Oleh Ahmad Fauzi</span>
              <span className="w-1 h-1 rounded-full bg-warm-gray-300" />
              <span className="flex items-center gap-1"><Calendar size={13} /> 12 Januari 2026</span>
              <span className="w-1 h-1 rounded-full bg-warm-gray-300" />
              <span className="flex items-center gap-1"><Clock size={13} /> 8 min baca</span>
              <span className="w-1 h-1 rounded-full bg-warm-gray-300" />
              <span className="flex items-center gap-1"><Eye size={13} /> 1.2K dibaca</span>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
          <div className="aspect-[21/9] bg-gradient-to-br from-emerald-forest to-emerald-rich rounded-sm overflow-hidden relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-white/30 font-serif text-2xl">Foto Dokumentasi Mahida</p>
            </div>
          </div>
        </div>

        {/* Article Content */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div 
            className="prose-article"
            dangerouslySetInnerHTML={{ __html: articleContent }}
          />

          {/* Tags */}
          <div className="mt-12 pt-8 border-t border-mahida-200">
            <div className="flex flex-wrap items-center gap-2">
              <span className="label mr-2">Tag:</span>
              {['pesantren', 'tradisi', 'digital', 'keilmuan', 'mahida'].map((tag) => (
                <span key={tag} className="tag-pill cursor-pointer hover:bg-mahida-200 transition-colors">{tag}</span>
              ))}
            </div>
          </div>

          {/* Share & Bookmark */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 py-6 border-y border-mahida-200">
            <div className="flex items-center gap-3">
              <button className="btn-secondary py-2 px-4 text-sm">
                <Bookmark size={15} />
                Simpan
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className="label">Bagikan:</span>
              <button className="w-9 h-9 rounded-full bg-mahida-50 hover:bg-mahida-200 flex items-center justify-center transition-colors text-warm-gray-600">
                f
              </button>
              <button className="w-9 h-9 rounded-full bg-mahida-50 hover:bg-mahida-200 flex items-center justify-center transition-colors text-warm-gray-600">
                𝕏
              </button>
              <button className="w-9 h-9 rounded-full bg-mahida-50 hover:bg-mahida-200 flex items-center justify-center transition-colors text-warm-gray-600">
                ✉
              </button>
              <button className="btn-ghost py-2 px-3 text-sm border border-mahida-200">
                <Share2 size={14} /> Salin Link
              </button>
            </div>
          </div>

          {/* About Author */}
          <div className="mt-8 p-6 bg-cream rounded-sm border border-mahida-150">
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <span className="font-serif font-bold text-xl text-emerald-700">A</span>
              </div>
              <div>
                <h3 className="font-semibold text-charcoal">Ahmad Fauzi</h3>
                <p className="text-sm text-warm-gray-500 mt-1">Pengajar dan penulis di lingkungan Mahida. Tertarik pada perkembangan tradisi keislaman di Indonesia.</p>
                <Link href="#" className="text-sm text-emerald-400 hover:text-emerald-600 mt-2 inline-block font-medium">
                  Lihat semua artikel →
                </Link>
              </div>
            </div>
          </div>

          {/* Related Content */}
          <div className="mt-12">
            <h2 className="heading-lg text-charcoal mb-6">Baca Juga</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedArticles.map((article) => (
                <Link key={article.title} href="/literasi/artikel/contoh" className="group">
                  <div className="aspect-[3/2] bg-mahida-100 rounded-sm mb-3 flex items-center justify-center">
                    <span className="text-mahida-400 text-xs">{article.category}</span>
                  </div>
                  <span className="category-pill text-[10px] mb-2">{article.category}</span>
                  <h3 className="font-semibold text-sm text-charcoal group-hover:text-emerald-forest transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </article>
    </>
  );
}
