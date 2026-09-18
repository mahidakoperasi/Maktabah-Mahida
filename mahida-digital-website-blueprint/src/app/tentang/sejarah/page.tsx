import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sejarah Mahida',
  description: 'Perjalanan Pondok Pesantren Mahida dari awal berdiri hingga menjadi ekosistem pendidikan Islam modern.',
};

const timeline = [
  { year: '2010', title: 'Awal Mula', description: 'Pondok Pesantren Mahida didirikan dengan visi sederhana: memberikan pendidikan Islam yang mengakar pada tradisi kitab kuning namun terbuka pada perkembangan zaman.' },
  { year: '2012', title: 'Perkembangan Awal', description: 'Jumlah santri meningkat. Kurikulum mulai diperkuat dengan penambahan mata pelajaran bahasa Arab intensif dan program tahfidz.' },
  { year: '2015', title: 'Pengembangan Fasilitas', description: 'Pembangunan gedung baru, perpustakaan, dan asrama yang lebih memadai untuk menampung pertumbuhan jumlah santri.' },
  { year: '2018', title: 'Ekspansi Program', description: 'Dibukanya program khusus terjemahan dan riset, serta pembentukan unit Koperasi Mahida untuk pemberdayaan ekonomi.' },
  { year: '2021', title: 'Transformasi Digital', description: 'Memulai pengembangan platform digital sebagai wajah baru Mahida dalam menjangkau audiens yang lebih luas.' },
  { year: '2024', title: 'Mahida Digital', description: 'Peluncuran Mahida Digital — ekosistem digital yang memadukan literasi, karya, maktabah, media, dan arsip dalam satu platform.' },
  { year: '2026', title: 'Era Baru', description: 'Mahida Digital berkembang menjadi ruang hidup yang terus bertambah, merekam, dan memperlihatkan perjalanan Mahida.' },
];

export default function SejarahPage() {
  return (
    <>
      <section className="bg-emerald-forest text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="label text-brass-light mb-3">Tentang → Sejarah</p>
          <h1 className="text-3xl md:text-4xl font-serif font-bold">Sejarah Perjalanan Mahida</h1>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Intro */}
          <div className="max-w-2xl mb-16">
            <p className="text-lg text-warm-gray-600 leading-relaxed">
              Sejarah Mahida adalah cerita tentang komitmen pada pendidikan Islam yang 
              tidak lekang oleh waktu. Dari awal yang sederhana hingga berkembang menjadi 
              ekosistem yang dinamis, setiap tahun membawa babak baru dalam perjalanan ini.
            </p>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Line */}
            <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-px bg-mahida-300 md:-translate-x-px" />

            {/* Timeline Items */}
            <div className="space-y-12">
              {timeline.map((item, i) => (
                <div 
                  key={item.year} 
                  className={`relative flex flex-col md:flex-row gap-8 ${i % 2 === 0 ? '' : 'md:flex-row-reverse'}`}
                >
                  {/* Dot */}
                  <div className={`absolute left-0 md:left-1/2 w-3 h-3 bg-emerald-forest rounded-full -translate-x-[5px] md:-translate-x-1/2 mt-2 z-10`} />
                  
                  {/* Content */}
                  <div className={`ml-8 md:ml-0 md:w-1/2 ${i % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12'}`}>
                    <span className="font-serif font-bold text-3xl text-brass">{item.year}</span>
                    <h3 className="text-xl font-semibold text-charcoal mt-1 mb-2">{item.title}</h3>
                    <p className="text-warm-gray-600 leading-relaxed">{item.description}</p>
                  </div>
                  
                  {/* Spacer for other side */}
                  <div className="hidden md:block md:w-1/2" />
                </div>
              ))}
            </div>
          </div>

          {/* Related Links */}
          <div className="grid md:grid-cols-3 gap-5 mt-16 pt-10 border-t border-mahida-200">
            <Link href="/tentang/profil" className="group p-5 bg-cream border border-mahida-150 hover:border-emerald-forest transition-colors">
              <span className="label text-xs mb-2 block">Baca Juga</span>
              <h3 className="font-semibold text-charcoal group-hover:text-emerald-forest transition-colors">Profil Pondok</h3>
            </Link>
            <Link href="/tentang/pengasuh" className="group p-5 bg-cream border border-mahida-150 hover:border-emerald-forest transition-colors">
              <span className="label text-xs mb-2 block">Baca Juga</span>
              <h3 className="font-semibold text-charcoal group-hover:text-emerald-forest transition-colors">Pengasuh</h3>
            </Link>
            <Link href="/arsip" className="group p-5 bg-cream border border-mahida-150 hover:border-emerald-forest transition-colors">
              <span className="label text-xs mb-2 block">Jelajahi</span>
              <h3 className="font-semibold text-charcoal group-hover:text-emerald-forest transition-colors">Arsip Lengkap</h3>
              <ArrowRight size={14} className="mt-2 text-warm-gray-400" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
