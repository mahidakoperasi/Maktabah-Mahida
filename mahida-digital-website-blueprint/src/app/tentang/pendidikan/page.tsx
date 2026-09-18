import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Pendidikan',
  description: 'Program pendidikan, kurikulum, dan metode pembelajaran di Pondok Pesantren Mahida.',
};

const programs = [
  {
    name: 'Madrasah Diniyah',
    level: 'Ula, Wustha, Ulya',
    description: 'Program pendidikan Islam formal yang mencakup ilmu-ilmu keislaman dari dasar hingga lanjutan dengan kurikulum yang terstruktur.',
    subjects: ['Al-Quran & Tajwid', 'Aqidah Akhlak', 'Fiqh', 'SKl (Sejarah Kebudayaan Islam)', 'Bahasa Arab'],
  },
  {
    name: 'Pengajian Kitab (Sorogan/Bandongan)',
    level: 'Tingkat Lanjut',
    description: 'Metode pembelajaran klasik pesantren dengan membaca kitab kuning secara langsung (sorogan) atau bersama-sama (bandongan).',
    subjects: ['Nahwu & Sharaf', 'Balaghah', 'Tafsir', 'Hadits', 'Usul Fiqh', 'Tasawuf'],
  },
  {
    name: 'Program Tahfidz',
    level: 'Semua Tingkatan',
    description: 'Program menghafal Al-Qur&#39;an dengan metode talaqqi dan muraja&#39;ah yang terstruktur, target minimal 5 juz untuk semua santri.',
    subjects: ['Hafalan Quran', 'Tajwid Terapan', 'Ghorib', 'Makharijul Huruf'],
  },
  {
    name: 'Program Bahasa Arab Intensif',
    level: 'Ekstra Kurikuler',
    description: 'Program intensif penguasaan bahasa Arab sebagai alat utama akses kitab kuning dan literatur Arab klasik maupun modern.',
    subjects: ['Arabiyah Baynah Yadayk', 'Kalam Natsiyy', 'Muhadatsah', 'Qiroah'],
  },
];

export default function PendidikanPage() {
  return (
    <>
      <section className="bg-emerald-forest text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="label text-brass-light mb-3">Tentang → Pendidikan</p>
          <h1 className="text-3xl md:text-4xl font-serif font-bold">Program Pendidikan</h1>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Intro */}
          <div className="max-w-2xl mb-12">
            <p className="text-lg text-warm-gray-600 leading-relaxed">
              Sistem pendidikan Mahida dirancang untuk menghasilkan lulusan yang tidak hanya 
              berilmu agama, tetapi juga mampu menerapkan dan mengembangkan ilmu dalam 
              konteks kekinian.
            </p>
          </div>

          {/* Programs Grid */}
          <div className="grid md:grid-cols-2 gap-8">
            {programs.map((program) => (
              <article key={program.name} className="border border-mahida-200 rounded-sm p-8 hover:border-emerald-300 transition-colors">
                <span className="category-pill mb-3">{program.level}</span>
                <h2 className="text-xl font-serif font-bold text-charcoal mt-3 mb-2">{program.name}</h2>
                <p className="text-warm-gray-600 text-sm leading-relaxed mb-4">{program.description}</p>
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-mahida-100">
                  {program.subjects.map((subject) => (
                    <span key={subject} className="tag-pill text-xs">{subject}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>

          {/* Metode Pembelajaran */}
          <div className="mt-16 bg-parchment rounded-sm p-8 md:p-10 border border-mahida-150">
            <h2 className="text-xl font-serif font-bold text-charcoal mb-6">Metode Pembelajaran</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {[
                { name: 'Sorogan', desc: 'Membaca kitab satu per satu di hadapan ustaz untuk dibaca dan dikoreksi langsung.' },
                { name: 'Bandongan', desc: 'Pengajian bersama-sama dengan metode simak-kitaq yang disampaikan oleh ustaz.' },
                { name: 'Mudzakarah', desc: 'Diskusi kelompok untuk mendalami materi yang telah dipelajari secara interaktif.' },
                { name: "Bahtsul Masa'il", desc: 'Membahas permasalah hukum aktual dengan pendekatan kitab kuning.' },
              ].map((method) => (
                <div key={method.name} className="bg-white p-5 rounded-sm">
                  <h3 className="font-semibold text-emerald-forest mb-1">{method.name}</h3>
                  <p className="text-sm text-warm-gray-600">{method.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Kehidupan Santri Teaser */}
          <div className="mt-12 text-center">
            <Link href="/tentang/fasilitas" className="btn-secondary">
              Lihat Fasilitas Pondok
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
