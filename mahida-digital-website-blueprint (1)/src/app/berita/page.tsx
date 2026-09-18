import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Calendar, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Berita',
  description: 'Berita dan kegiatan terbaru Pondok Pesantren Mahida: aktivitas pendidikan, sosial, prestasi, kunjungan.',
};

const beritaList = [
  {
    id: 1,
    title: 'Kajian Kitab Al-Ajurumiyah Dimulai Musim Baru',
    excerpt: 'Pembelajaran nahwu sebagai fondasi utama dalam memahami bahasa Arab secara mendalam dimulai kembali dengan antusiasme tinggi dari seluruh santri baru maupun senior. Pengasuh membuka kajian dengan pengantar pentingnya ilmu nahwu dalam mempelajari kitab kuning.',
    category: 'Akademik',
    date: '15 Januari 2026',
    readTime: '5 min',
    featured: true,
  },
  {
    id: 2,
    title: 'Pengasuh: Ilmu Tanpa Adab Bukan Ilmu',
    excerpt: 'Dalam pidato pembukaan semester baru, Pengasuh menegaskan bahwa adab harus mendahului ilmu. Santri diajak memahami bahwa menuntut ilmu bukan sekadar mengumpulkan informasi.',
    category: 'Gagasan',
    date: '14 Januari 2026',
    readTime: '4 min',
    featured: false,
  },
  {
    id: 3,
    title: 'Santri Mahida Raih Juara MTQ Tingkat Kabupaten',
    excerpt: 'Alhamdulillah, santri kelas V berhasil meraih juara pertama pada cabang tahfidz dan juara kedua cabang tilawah pada MTQ tingkat Kabupaten tahun ini.',
    category: 'Prestasi',
    date: '13 Januari 2026',
    readTime: '3 min',
    featured: false,
  },
  {
    id: 4,
    title: 'Peringatan Maulid Nabi 1447 H Bersama Warga',
    excerpt: 'Mahida mengadakan peringatan Maulid Nabi Muhammad SAW yang dihadiri oleh santri, keluarga, dan masyarakat sekitar. Acara diisi dengan pembacaan shalawat, ceramah, dan tasyakuran.',
    category: 'Kegiatan',
    date: '12 Januari 2026',
    readTime: '4 min',
    featured: false,
  },
  {
    id: 5,
    title: 'Program Tahfidz Capai Target Baru',
    excerpt: 'Target hafalan minimal 5 juz untuk seluruh santri telah tercapai lebih dari 80%. Program intensif akan ditingkatkan di semester depan dengan metode setoran harian terstruktur.',
    category: 'Akademik',
    date: '11 Januari 2026',
    readTime: '3 min',
    featured: false,
  },
  {
    id: 6,
    title: 'Kunjungan Studi ke Perpustakaan Nasional',
    excerpt: 'Sebanyak 30 santri kelas akhir melakukan kunjungan studi ke Perpustakaan Nasional sebagai bagian dari program literasi dan penelitian.',
    category: 'Kegiatan',
    date: '10 Januari 2026',
    readTime: '3 min',
    featured: false,
  },
];

export default function BeritaPage() {
  const featured = beritaList.find(b => b.featured);
  const others = beritaList.filter(b => !b.featured);

  return (
    <>
      <section className="bg-emerald-forest text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="label text-brass-light mb-3">Kegiatan → Berita</p>
          <h1 className="text-3xl md:text-4xl font-serif font-bold mb-2">Berita & Kegiatan</h1>
          <p className="text-white/70">Aktivitas pondok, kegiatan, sosial, pendidikan, kunjungan, dan prestasi.</p>
        </div>
      </section>

      {/* Featured News - Editorial Layout */}
      <section className="py-16 bg-white border-b border-mahida-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {featured && (
            <article className="grid lg:grid-cols-12 gap-8 pb-10 border-b border-mahida-200">
              <div className="lg:col-span-7 group">
                <Link href={`/berita/${featured.id}`}>
                  <div className="aspect-[16/10] bg-gradient-to-br from-emerald-forest to-emerald-rich rounded-sm overflow-hidden relative mb-4">
                    <span className="absolute top-4 left-4 category-pill bg-white text-emerald-forest">Berita Utama</span>
                  </div>
                </Link>
              </div>
              <div className="lg:col-span-5 flex flex-col justify-center">
                <span className="category-pill w-fit">{featured.category}</span>
                <Link href={`/berita/${featured.id}`}>
                  <h2 className="text-2xl md:text-3xl font-serif font-bold text-charcoal mt-3 hover:text-emerald-forest transition-colors leading-tight">
                    {featured.title}
                  </h2>
                </Link>
                <p className="text-warm-gray-600 mt-3 leading-relaxed line-clamp-3">{featured.excerpt}</p>
                <div className="flex items-center gap-4 mt-4 text-sm text-warm-gray-500">
                  <span className="flex items-center gap-1"><Calendar size={14} /> {featured.date}</span>
                  <span className="flex items-center gap-1"><Clock size={14} /> {featured.readTime}</span>
                </div>
              </div>
            </article>
          )}

          {/* Other News Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 pt-10">
            {others.map((berita) => (
              <article key={berita.id} className="group">
                <Link href={`/berita/${berita.id}`} className="block">
                  <div className="aspect-[16/9] bg-mahida-100 rounded-sm overflow-hidden mb-4">
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-mahida-50 to-mahida-150" />
                  </div>
                  <span className="category-pill text-xs">{berita.category}</span>
                  <h3 className="font-serif font-bold text-charcoal mt-2 group-hover:text-emerald-forest transition-colors leading-tight line-clamp-2">
                    {berita.title}
                  </h3>
                  <p className="text-warm-gray-600 text-sm mt-2 line-clamp-2">{berita.excerpt}</p>
                  <div className="flex items-center gap-3 mt-3 text-xs text-warm-gray-500">
                    <span>{berita.date}</span>
                    <span>•</span>
                    <span>{berita.readTime} baca</span>
                  </div>
                </Link>
              </article>
            ))}
          </div>

          {/* Load More */}
          <div className="mt-12 text-center">
            <button className="btn-secondary">Muat Lebih Banyak</button>
          </div>
        </div>
      </section>
    </>
  );
}
