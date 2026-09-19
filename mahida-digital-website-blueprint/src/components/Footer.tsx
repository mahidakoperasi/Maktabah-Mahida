import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Facebook, Instagram, Youtube } from 'lucide-react';

const columns = [
  {
    title: 'Tentang',
    links: [
      { label: 'Profil Pondok', href: '/tentang/profil' },
      { label: 'Sejarah', href: '/tentang/sejarah' },
      { label: 'Pengasuh', href: '/tentang/pengasuh' },
      { label: 'Pendidikan', href: '/tentang/pendidikan' },
    ],
  },
  {
    title: 'Ilmu & Karya',
    links: [
      { label: 'Artikel', href: '/literasi/artikel' },
      { label: 'Esai & Gagasan', href: '/karya/esai' },
      { label: 'Terjemahan', href: '/karya/terjemahan' },
      { label: 'Maktabah', href: '/maktabah' },
    ],
  },
  {
    title: 'Ruang Mahida',
    links: [
      { label: 'Kegiatan', href: '/kegiatan' },
      { label: 'Media', href: '/media' },
      { label: 'Koperasi', href: '/koperasi' },
      { label: 'Arsip', href: '/arsip' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="site-footer relative overflow-hidden bg-[#062d20] text-white">
      <div className="absolute inset-0 opacity-[0.045]" style={{ backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1px)', backgroundSize: '28px 28px' }} />
      <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full border border-[#e4c72f]/12" />
      <div className="absolute right-24 top-14 h-44 w-44 rounded-full border border-white/6" />

      <div className="relative mx-auto max-w-[1450px] px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.15fr_.85fr]">
          <div>
            <div className="flex items-center gap-4">
              <Image src="/brand/mahida-logo.webp" alt="Logo Mahida" width={72} height={72} className="h-16 w-16 object-contain" />
              <div>
                <p className="font-serif text-3xl font-bold">MAHIDA</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.24em] text-white/45">Digital Pesantren</p>
              </div>
            </div>

            <h2 className="mt-8 max-w-2xl font-serif text-3xl font-bold leading-tight md:text-4xl">
              Belajar, berkarya, dan berkhidmah dalam satu rumah digital.
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-white/58">
              Ruang untuk mengenal, membaca, menjaga arsip, dan mengikuti perjalanan Mahida dalam ilmu, karya, dokumentasi, dan khidmah.
            </p>

            <div className="mt-8 flex items-center gap-3">
              <a href="#" aria-label="Facebook" className="grid h-10 w-10 place-items-center rounded-full border border-white/14 text-white/70 transition-colors hover:border-[#e4c72f] hover:text-[#e4c72f]">
                <Facebook size={17} />
              </a>
              <a href="#" aria-label="Instagram" className="grid h-10 w-10 place-items-center rounded-full border border-white/14 text-white/70 transition-colors hover:border-[#e4c72f] hover:text-[#e4c72f]">
                <Instagram size={17} />
              </a>
              <a href="#" aria-label="YouTube" className="grid h-10 w-10 place-items-center rounded-full border border-white/14 text-white/70 transition-colors hover:border-[#e4c72f] hover:text-[#e4c72f]">
                <Youtube size={17} />
              </a>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {columns.map((column) => (
              <div key={column.title}>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#e4c72f]">{column.title}</p>
                <div className="mt-5 space-y-3">
                  {column.links.map((link) => (
                    <Link key={link.href} href={link.href} className="block text-sm text-white/62 transition-colors hover:text-white">
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 grid gap-5 border-t border-white/10 pt-7 md:grid-cols-[1fr_auto] md:items-center">
          <div className="flex flex-wrap items-center gap-4 text-xs text-white/42">
            <span>Salam · Kedawung · Nglegok · Blitar</span>
            <span className="hidden h-px w-8 bg-[#e4c72f]/55 sm:block" />
            <span>© {new Date().getFullYear()} Mahida Digital</span>
          </div>
          <Link href="/tentang/profil" className="inline-flex items-center gap-2 text-sm font-bold text-[#f0d43b]">
            Mengenal Mahida <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </footer>
  );
}
