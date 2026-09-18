import { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Agenda',
  description: 'Jadwal kegiatan, acara, dan agenda mendatang Pondok Pesantren Mahida.',
};

const agendaList = [
  { day: '27', month: 'JAN', title: 'Haflah Akhirussanah Genap 2025/2026', type: 'Akademik', location: 'Aula Utama' },
  { day: '01', month: 'FEB', title: 'Maulid Nabi Muhammad SAW 1447 H', type: 'Perayaan', location: 'Halaman Pondok' },
  { day: '10', month: 'FEB', title: 'Ujian Semester Genap', type: 'Akademik', location: 'Kelas Masing-masing' },
  { day: '15', month: 'FEB', title: 'Dauroh Kitab Intensif - Al-Ajurumiyah', type: 'Kajian', location: 'Ruang Belajar Utama' },
  { day: '01', month: 'MAR', title: 'Tahun Baru Islam 1447 H', type: 'Perayaan', location: '-' },
  { day: '15', month: 'MAR', title: 'Wisuda Tahfidz Angkatan Ke-V', type: 'Akademik', location: 'Aula Utama' },
];

export default function AgendaPage() {
  return (
    <>
      <section className="bg-emerald-forest text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="label text-brass-light mb-3">Kegiatan → Agenda</p>
          <h1 className="text-3xl md:text-4xl font-serif font-bold mb-2">Agenda & Jadwal</h1>
          <p className="text-white/70">Kegiatan dan acara mendatang di Mahida.</p>
        </div>
      </section>

      <section className="py-16 bg-cream min-h-[60vh]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Year-Month Header */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-mahida-200">
            <h2 className="font-serif font-bold text-xl text-charcoal">Januari — Maret 2026</h2>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-mahida-100 rounded-sm transition-colors" aria-label="Bulan sebelumnya">←</button>
              <button className="p-2 hover:bg-mahida-100 rounded-sm transition-colors" aria-label="Bulan berikutnya">→</button>
            </div>
          </div>

          {/* Timeline List */}
          <div className="space-y-4">
            {agendaList.map((agenda, i) => (
              <Link
                key={i}
                href="/agenda"
                className="group flex gap-6 p-5 bg-white border-l-2 border-emerald-forest hover:border-brass hover:shadow-card transition-all"
              >
                {/* Date */}
                <div className="text-center flex-shrink-0 w-16">
                  <span className="text-3xl font-serif font-bold text-emerald-forest">{agenda.day}</span>
                  <span className="block text-xs font-semibold tracking-wider text-warm-gray-500 mt-0.5 uppercase">{agenda.month}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <span className="category-pill text-[0.65rem] py-px">{agenda.type}</span>
                  <h3 className="font-semibold text-charcoal mt-1.5 group-hover:text-emerald-forest transition-colors">
                    {agenda.title}
                  </h3>
                  {agenda.location !== '-' && (
                    <p className="text-sm text-warm-gray-500 flex items-center gap-1 mt-1">
                      <MapPin size={13} />
                      {agenda.location}
                    </p>
                  )}
                </div>

                <ArrowRight size={16} className="flex-shrink-0 self-center text-warm-gray-300 group-hover:text-emerald-forest transition-colors opacity-0 group-hover:opacity-100" />
              </Link>
            ))}
          </div>

          {/* Links */}
          <div className="mt-12 grid grid-cols-2 gap-4">
            <Link href="/berita" className="group p-5 bg-white border border-mahida-200 hover:border-emerald-300 transition-all text-center">
              <span className="block font-semibold text-charcoal group-hover:text-emerald-forest transition-colors">Berita Terkini</span>
              <span className="text-sm text-warm-gray-500">Lihat aktivitas yang sudah terlaksana</span>
            </Link>
            <Link href="/kegiatan/pengumuman" className="group p-5 bg-white border border-mahida-200 hover:border-emerald-300 transition-all text-center">
              <span className="block font-semibold text-charcoal group-hover:text-emerald-forest transition-colors">Pengumuman</span>
              <span className="text-sm text-warm-gray-500">Informasi penting untuk santri</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
