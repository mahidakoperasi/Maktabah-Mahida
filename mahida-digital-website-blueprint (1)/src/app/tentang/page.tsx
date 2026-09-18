import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen, Users, Home, GraduationCap, Calendar } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Tentang Mahida',
  description: 'Mengenal Pondok Pesantren Mahida: profil, sejarah, pengasuh, pendidikan, dan kehidupan santri.',
};

const aboutSections = [
  {
    title: 'Profil Pondok',
    slug: '/tentang/profil',
    description: 'Identitas, visi misi, dan karakteristik Pondok Pesantren Mahida.',
    icon: Home,
  },
  {
    title: 'Sejarah',
    slug: '/tentang/sejarah',
    description: 'Perjalanan Mahida dari awal berdiri hingga saat ini.',
    icon: Calendar,
  },
  {
    title: 'Pengasuh',
    slug: '/tentang/pengasuh',
    description: 'Tokoh pemimpin dan pengasuh yang membina santri.',
    icon: Users,
  },
  {
    title: 'Pendidikan',
    slug: '/tentang/pendidikan',
    description: 'Kurikulum, program studi, dan metode pembelajaran.',
    icon: GraduationCap,
  },
  {
    title: 'Fasilitas',
    slug: '/tentang/fasilitas',
    description: 'Sarana dan prasarana yang menunjang kegiatan pembelajaran.',
    icon: Home,
  },
  {
    title: 'Kontak',
    slug: '/tentang/kontak',
    description: 'Alamat, nomor telepon, email, dan lokasi.',
    icon: BookOpen,
  },
];

export default function TentangPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-emerald-forest text-white py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="label text-brass-light mb-4">Tentang</p>
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6 max-w-3xl">
            Mengenal Lebih Dekat<br />
            <span className="text-brass-light">Pondok Pesantren Mahida</span>
          </h1>
          <p className="text-lg text-white/75 max-w-2xl leading-relaxed">
            Mahida adalah pondok pesantren yang menggabungkan khazanah keilmuan klasik 
            dengan semangat pembelajaran kontemporer untuk membentuk generasi yang 
            berilmu, berkarya, dan berkhidmah.
          </p>
        </div>
      </section>

      {/* Sections Grid */}
      <section className="py-16 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {aboutSections.map((section) => (
              <Link
                key={section.slug}
                href={section.slug}
                className="group bg-white p-8 border border-warm-gray-200 hover:border-emerald-forest hover:shadow-card transition-all duration-300"
              >
                <div className="w-12 h-12 bg-mahida-50 rounded-sm flex items-center justify-center mb-5 group-hover:bg-emerald-forest/10 transition-colors">
                  <section.icon size={22} className="text-warm-gray-500 group-hover:text-emerald-forest transition-colors" />
                </div>
                <h2 className="text-xl font-serif font-bold text-charcoal mb-2 group-hover:text-emerald-forest transition-colors">
                  {section.title}
                </h2>
                <p className="text-warm-gray-600 text-sm leading-relaxed mb-4">
                  {section.description}
                </p>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-forest opacity-0 group-hover:opacity-100 transition-opacity -mb-1">
                  Baca Selengkapnya
                  <ArrowRight size={14} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-16 bg-white border-y border-warm-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '15+', label: 'Tahun Mengabdi' },
              { value: '300+', label: 'Santri Aktif' },
              { value: '1000+', label: 'Alumni' },
              { value: '50+', label: 'Kitab Diajarkan' },
            ].map((stat, i) => (
              <div key={i}>
                <span className="text-3xl md:text-4xl font-serif font-bold text-emerald-forest">{stat.value}</span>
                <p className="text-sm text-warm-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-parchment">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-charcoal mb-4">
            Ingin Mengetahui Lebih Lanjut?
          </h2>
          <p className="text-warm-gray-600 mb-8 max-w-xl mx-auto">
            Hubungi kami untuk informasi pendaftaran, kunjungan, atau pertanyaan seputar Mahida.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/tentang/kontak" className="btn-primary">
              Hubungi Kami
              <ArrowRight size={16} />
            </Link>
            <Link href="/koperasi" className="btn-secondary">
              Lihat Katalog Koperasi
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
