'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  ChevronDown,
  Grid3X3,
  LogIn,
  MapPin,
  Menu,
  PenTool,
  Search,
  User,
  UsersRound,
  X,
} from 'lucide-react';

const navItems = [
  { label: 'Beranda', href: '/' },
  {
    label: 'Tentang',
    href: '/tentang',
    children: [
      { label: 'Profil Pondok', href: '/tentang/profil' },
      { label: 'Sejarah', href: '/tentang/sejarah' },
      { label: 'Pengasuh', href: '/tentang/pengasuh' },
      { label: 'Pendidikan', href: '/tentang/pendidikan' },
    ],
  },
  {
    label: 'Literasi',
    href: '/literasi',
    children: [
      { label: 'Artikel', href: '/literasi/artikel' },
      { label: 'Esai & Opini', href: '/literasi/esai' },
      { label: 'Resensi', href: '/literasi/resensi' },
    ],
  },
  {
    label: 'Karya',
    href: '/karya',
    children: [
      { label: 'Esai & Gagasan', href: '/karya/esai' },
      { label: 'Terjemahan', href: '/karya/terjemahan' },
      { label: 'Sastra', href: '/karya/sastra' },
      { label: 'Falak & Sains', href: '/karya/falak' },
      { label: 'Riset & Kajian', href: '/karya/riset' },
      { label: 'Budaya & Tradisi', href: '/karya/budaya' },
      { label: 'Fotografi', href: '/karya/fotografi' },
      { label: 'Media Kreatif', href: '/karya/media-kreatif' },
    ],
  },
  {
    label: 'Maktabah',
    href: '/maktabah',
    children: [
      { label: 'Kitab', href: '/maktabah/kitab' },
      { label: 'Terjemahan', href: '/maktabah/terjemahan' },
      { label: 'Kajian', href: '/maktabah/kajian' },
      { label: 'Nahwu', href: '/maktabah/nahwu' },
      { label: 'Sharaf', href: '/maktabah/sharaf' },
      { label: 'Fiqh', href: '/maktabah/fiqh' },
      { label: 'Tafsir', href: '/maktabah/tafsir' },
      { label: 'Hadits', href: '/maktabah/hadits' },
    ],
  },
  {
    label: 'Kegiatan',
    href: '/kegiatan',
    children: [
      { label: 'Berita', href: '/berita' },
      { label: 'Agenda', href: '/agenda' },
      { label: 'Pengumuman', href: '/kegiatan/pengumuman' },
      { label: 'Prestasi', href: '/kegiatan/prestasi' },
    ],
  },
  {
    label: 'Media',
    href: '/media',
    children: [
      { label: 'Mahida TV', href: '/media/tv' },
      { label: 'Video', href: '/media/video' },
      { label: 'Galeri', href: '/media/galeri' },
    ],
  },
  { label: 'Koperasi', href: '/koperasi' },
];

const megaColumns = [
  {
    title: 'Ilmu',
    items: [
      { label: 'Literasi', href: '/literasi' },
      { label: 'Maktabah', href: '/maktabah' },
      { label: 'Kajian', href: '/maktabah/kajian' },
    ],
  },
  {
    title: 'Karya',
    items: [
      { label: 'Esai & Gagasan', href: '/karya/esai' },
      { label: 'Terjemahan', href: '/karya/terjemahan' },
      { label: 'Sastra', href: '/karya/sastra' },
    ],
  },
  {
    title: 'Mahida',
    items: [
      { label: 'Profil Pondok', href: '/tentang/profil' },
      { label: 'Kegiatan', href: '/kegiatan' },
      { label: 'Media', href: '/media' },
    ],
  },
];

export default function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 16);
    let active = true;

    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'same-origin',
          cache: 'no-store',
        });
        if (active) setIsLoggedIn(response.ok);
      } catch {
        if (active) setIsLoggedIn(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mahida-auth-changed', checkSession);
    handleScroll();
    checkSession();

    return () => {
      active = false;
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mahida-auth-changed', checkSession);
    };
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setMegaMenuOpen(false);
    setDropdownOpen(null);
  }, [pathname]);

  return (
    <>
      <nav className="site-nav fixed inset-x-0 top-0 z-50 px-3 pt-3 lg:px-6">
        <div
          className={`relative mx-auto flex h-[72px] max-w-[1500px] items-center rounded-[28px] border border-[#dfe4d9] bg-[#fbfaf4]/96 shadow-[0_16px_46px_rgba(16,56,39,0.10)] backdrop-blur-xl transition-all duration-300 lg:h-[78px] ${isScrolled ? 'lg:h-[68px]' : ''}`}
        >
          <Link
            href="/"
            className="relative z-10 flex h-full min-w-[218px] items-center gap-3 overflow-hidden rounded-l-[28px] bg-[#eef3e9] px-4 pr-8 sm:min-w-[260px] lg:min-w-[292px] lg:rounded-br-[56px]"
          >
            <span className="absolute bottom-1 right-2 h-[3px] w-20 -rotate-[7deg] bg-[#e4c72f]" />
            <span className="absolute -bottom-8 -right-8 h-20 w-20 rounded-full border border-[#0a6a44]/10" />

            <Image
              src="/brand/mahida-logo.webp"
              alt="Logo Pondok Pesantren Mahida"
              width={54}
              height={54}
              priority
              className="h-12 w-12 shrink-0 object-contain lg:h-14 lg:w-14"
            />

            <span className="min-w-0 leading-none">
              <span className="block font-serif text-[19px] font-bold tracking-[-0.02em] text-[#075b3a] lg:text-[21px]">
                MAHIDA
              </span>
              <span className="mt-1.5 block truncate text-[8px] font-semibold uppercase tracking-[0.17em] text-[#778078] sm:text-[9px]">
                Digital Pesantren
              </span>
            </span>
          </Link>

          <div className="hidden min-w-0 flex-1 items-center justify-center px-4 xl:flex">
            {navItems.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(`${item.href}/`));

              return (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => item.children && setDropdownOpen(item.label)}
                  onMouseLeave={() => setDropdownOpen(null)}
                >
                  <Link
                    href={item.href}
                    className={`group relative flex items-center gap-1 px-2.5 py-6 text-[13px] font-semibold transition-colors 2xl:px-3 ${active ? 'text-[#075b3a]' : 'text-[#505851] hover:text-[#075b3a]'}`}
                  >
                    {item.label}
                    {item.children && <ChevronDown size={12} className="opacity-45" />}
                    <span
                      className={`absolute bottom-[14px] left-1/2 h-[2px] -translate-x-1/2 rounded-full bg-[#e4c72f] transition-all duration-300 ${active ? 'w-6' : 'w-0 group-hover:w-4'}`}
                    />
                  </Link>

                  {item.children && dropdownOpen === item.label && (
                    <div className="absolute left-1/2 top-[64px] w-60 -translate-x-1/2 border border-[#e2e5dc] bg-[#fffef9] p-2 shadow-[0_18px_50px_rgba(17,54,38,0.14)]">
                      <div className="mb-1 border-b border-[#ece9dc] px-3 py-2">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a18725]">
                          {item.label}
                        </p>
                      </div>
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block border-l-2 border-transparent px-3 py-2.5 text-sm text-[#505851] transition-all hover:border-[#e4c72f] hover:bg-[#f4f6ef] hover:text-[#075b3a]"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="ml-auto flex h-full items-center gap-1.5 pr-3 sm:gap-2 lg:pr-4">
            <button
              onClick={() => setSearchOpen(true)}
              className="grid h-10 w-10 place-items-center text-[#465049] transition-colors hover:bg-[#f0f3eb] hover:text-[#075b3a]"
              aria-label="Cari"
            >
              <Search size={19} />
            </button>

            {isLoggedIn ? (
              <Link
                href="/profil"
                className="grid h-10 w-10 place-items-center text-[#465049] transition-colors hover:bg-[#f0f3eb] hover:text-[#075b3a]"
                aria-label="Profil"
              >
                <User size={19} />
              </Link>
            ) : (
              <Link
                href="/masuk"
                className="hidden items-center gap-1.5 border border-[#b8c7b9] px-3 py-2 text-xs font-semibold text-[#075b3a] transition-colors hover:border-[#075b3a] hover:bg-[#075b3a] hover:text-white sm:flex"
              >
                <LogIn size={14} />
                Masuk
              </Link>
            )}

            <button
              onClick={() => setMegaMenuOpen((value) => !value)}
              className="hidden h-11 w-11 place-items-center rounded-[10px] bg-[#075b3a] text-white transition-colors hover:bg-[#06472e] xl:grid"
              aria-label="Buka menu Mahida"
              aria-expanded={megaMenuOpen}
            >
              {megaMenuOpen ? <X size={18} /> : <Grid3X3 size={18} />}
            </button>

            <button
              onClick={() => setMobileMenuOpen(true)}
              className="grid h-11 w-11 place-items-center rounded-[10px] bg-[#075b3a] text-white xl:hidden"
              aria-label="Menu"
            >
              <Menu size={20} />
            </button>
          </div>

          {megaMenuOpen && (
            <div className="absolute right-[18%] top-[calc(100%+8px)] hidden w-[720px] overflow-hidden rounded-[22px] border border-[#e3e0d4] bg-[#fffdf7] shadow-[0_30px_80px_rgba(11,59,39,0.22)] xl:block">
              <div className="relative p-8 pb-6">
                <div className="grid grid-cols-[1fr_210px] gap-8 border-b border-[#ece8dc] pb-6">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#0c7850]">Mahida Digital</p>
                    <p className="mt-3 max-w-[430px] font-serif text-[28px] font-bold leading-[1.08] text-[#173d2d]">
                      Ilmu, karya, dan kehidupan pesantren dalam satu ruang.
                    </p>
                  </div>
                  <div className="relative overflow-hidden rounded-[18px] bg-[#f4f5ef] p-5">
                    <div className="absolute -right-4 -top-7 h-24 w-24 rounded-full border border-[#0b6c48]/10" />
                    <p className="font-serif text-[13px] italic leading-5 text-[#7e847f]">
                      “Menjaga tradisi,<br />merawat masa depan.”
                    </p>
                    <span className="mt-3 block h-[2px] w-7 bg-[#e4c72f]" />
                  </div>
                </div>

                <div className="grid grid-cols-3 divide-x divide-[#ece8dc] py-6">
                  {megaColumns.map((column, index) => {
                    const Icon = index === 0 ? BookOpen : index === 1 ? PenTool : UsersRound;
                    return (
                      <div key={column.title} className="px-6 first:pl-0 last:pr-0">
                        <div className="mb-4 flex items-center gap-3">
                          <span className="grid h-11 w-11 place-items-center rounded-full bg-[#edf2e9] text-[#075b3a]">
                            <Icon size={19} />
                          </span>
                          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#075b3a]">{column.title}</p>
                        </div>
                        <div className="space-y-3">
                          {column.items.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              className="flex items-center justify-between text-[14px] font-medium text-[#3f4842] hover:text-[#075b3a]"
                            >
                              <span>{item.label}</span>
                              <span className="text-[#77827b]">›</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="relative flex items-center justify-between border-t border-[#ece8dc] pt-5">
                  <div className="flex items-center gap-2 text-xs text-[#717a73]">
                    <MapPin size={15} className="text-[#075b3a]" />
                    <span>Salam · Kedawung · Nglegok · Blitar</span>
                  </div>
                  <Link href="/koperasi" className="inline-flex items-center gap-2 text-sm font-bold text-[#075b3a]">
                    Koperasi Mahida <span>→</span>
                  </Link>
                  <div className="pointer-events-none absolute -bottom-7 right-10 h-12 w-44 rotate-[-9deg] rounded-[50%] border-t-[14px] border-[#e4c72f]/28" />
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      <div
        className={`fixed inset-0 z-[70] bg-[#10251d]/60 backdrop-blur-sm transition-opacity xl:hidden ${mobileMenuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      <aside
        className={`fixed inset-y-0 right-0 z-[80] w-full max-w-[390px] bg-[#fffef9] transition-transform duration-300 xl:hidden ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between border-b border-[#e4e4dc] p-5">
          <div className="flex items-center gap-3">
            <Image src="/brand/mahida-logo.webp" alt="Logo Mahida" width={48} height={48} className="h-12 w-12 object-contain" />
            <div>
              <p className="font-serif text-xl font-bold text-[#075b3a]">MAHIDA</p>
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8b918a]">Digital Pesantren</p>
            </div>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} className="grid h-10 w-10 place-items-center bg-[#eef3e9] text-[#075b3a]">
            <X size={20} />
          </button>
        </div>

        <div className="h-[calc(100vh-89px)] overflow-y-auto px-5 py-6">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.22em] text-[#a18725]">Navigasi</p>
          <div className="divide-y divide-[#ece9dc]">
            {navItems.map((item, index) => (
              <div key={item.label}>
                <Link
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-4 py-4"
                >
                  <span className="w-6 font-serif text-xs text-[#b5a44b]">{String(index + 1).padStart(2, '0')}</span>
                  <span className="font-serif text-xl font-semibold text-[#24342c]">{item.label}</span>
                </Link>
                {item.children && (
                  <div className="mb-3 ml-10 grid grid-cols-2 gap-x-4 gap-y-2">
                    {item.children.slice(0, 6).map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-xs font-medium text-[#737b74] hover:text-[#075b3a]"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-7 border-l-4 border-[#e4c72f] bg-[#f2f5ed] p-4">
            <p className="font-serif text-lg font-bold text-[#075b3a]">Belajar · Berkarya · Berkhidmah</p>
            <p className="mt-1 text-xs leading-relaxed text-[#737b74]">
              Satu rumah digital untuk ilmu, karya, dokumentasi, dan perjalanan Mahida.
            </p>
          </div>
        </div>
      </aside>

      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

function SearchOverlay({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => document.getElementById('global-search')?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setQuery('');
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-[#10251d]/90 backdrop-blur-md" onClick={onClose}>
      <div className="mx-auto mt-[18vh] max-w-2xl p-4" onClick={(event) => event.stopPropagation()}>
        <div className="relative">
          <Search size={22} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8c938d]" />
          <input
            id="global-search"
            type="text"
            placeholder="Cari artikel, karya, kitab, video..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full border-0 bg-[#fffef9] py-4 pl-12 pr-12 text-lg text-[#24342c] outline-none shadow-2xl focus:ring-2 focus:ring-[#e4c72f]/40"
          />
          <button onClick={onClose} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#68716b]">
            <X size={20} />
          </button>
        </div>

        {query.length > 2 && (
          <div className="mt-3 border border-white/10 bg-[#fffef9] p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a18725]">Pencarian Mahida</p>
            <p className="mt-2 font-serif text-xl font-bold text-[#24342c]">&quot;{query}&quot;</p>
            <p className="mt-3 text-sm text-[#747b75]">
              Mesin pencarian penuh akan dihubungkan ke database pada tahap berikutnya.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
