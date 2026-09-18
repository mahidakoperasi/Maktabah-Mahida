'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Menu, X, User, LogIn } from 'lucide-react';

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
    ]
  },
  { 
    label: 'Literasi', 
    href: '/literasi',
    children: [
      { label: 'Artikel', href: '/literasi/artikel' },
      { label: 'Esai & Opini', href: '/literasi/esai' },
      { label: 'Resensi', href: '/literasi/resensi' },
    ]
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
    ]
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
    ]
  },
  {
    label: 'Kegiatan',
    href: '/kegiatan',
    children: [
      { label: 'Berita', href: '/berita' },
      { label: 'Agenda', href: '/agenda' },
      { label: 'Pengumuman', href: '/kegiatan/pengumuman' },
      { label: 'Prestasi', href: '/kegiatan/prestasi' },
    ]
  },
  {
    label: 'Media',
    href: '/media',
    children: [
      { label: 'Mahida TV', href: '/media/tv' },
      { label: 'Video', href: '/media/video' },
      { label: 'Galeri', href: '/media/galeri' },
    ]
  },
  { label: 'Koperasi', href: '/koperasi' },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    
    // Check if user is logged in
    const token = localStorage.getItem('mahida_token');
    setIsLoggedIn(!!token);

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav 
        className={`site-nav fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-white/95 backdrop-blur-md shadow-elevated' 
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-18">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 flex-shrink-0">
              <div className={`font-serif font-bold text-xl tracking-tight transition-colors ${isScrolled ? 'text-emerald-forest' : 'text-white'}`}>
                <span className={isScrolled ? '' : 'drop-shadow-lg'}>MAHIDA</span>
              </div>
              {!isScrolled && (
                <span className="hidden sm:block text-white/80 text-xs uppercase tracking-[0.2em] font-medium">
                  Digital
                </span>
              )}
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <div 
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => item.children && setDropdownOpen(item.label)}
                  onMouseLeave={() => setDropdownOpen(null)}
                >
                  <Link 
                    href={item.href}
                    className={`px-3 py-2 text-sm font-medium nav-link ${
                      isScrolled ? 'text-warm-gray-700 hover:text-emerald-forest' : 'text-white/90 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </Link>
                  
                  {/* Dropdown */}
                  {item.children && dropdownOpen === item.label && (
                    <div className="absolute top-full left-0 mt-0 w-56 bg-white rounded shadow-card border border-warm-gray-200 py-2 animate-fade-in">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block px-4 py-2.5 text-sm text-warm-gray-700 hover:bg-mahida-50 hover:text-emerald-forest transition-colors"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <button
                onClick={() => setSearchOpen(true)}
                className={`p-2 rounded-sm transition-colors ${
                  isScrolled ? 'text-warm-gray-600 hover:bg-mahida-50' : 'text-white/90 hover:text-white'
                }`}
                aria-label="Cari"
              >
                <Search size={19} />
              </button>

              {/* Auth */}
              {isLoggedIn ? (
                <Link
                  href="/profil"
                  className={`p-2 rounded-sm transition-colors ${
                    isScrolled ? 'text-warm-gray-600 hover:bg-mahida-50' : 'text-white/90 hover:text-white'
                  }`}
                >
                  <User size={19} />
                </Link>
              ) : (
                <Link
                  href="/masuk"
                  className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-sm transition-colors ${
                    isScrolled 
                      ? 'text-emerald-forest border border-emerald-forest hover:bg-emerald-forest hover:text-white' 
                      : 'text-white border border-white/40 hover:bg-white hover:text-emerald-forest'
                  }`}
                >
                  <LogIn size={15} />
                  <span>Masuk</span>
                </Link>
              )}

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className={`lg:hidden p-2 rounded-sm transition-colors ${
                  isScrolled ? 'text-warm-gray-600' : 'text-white'
                }`}
                aria-label="Menu"
              >
                <Menu size={21} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div 
        className={`mobile-nav-overlay ${mobileMenuOpen ? 'open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Mobile Menu Panel */}
      <div className={`mobile-nav-panel ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="flex items-center justify-between mb-8">
          <span className="font-serif font-bold text-lg text-emerald-forest">MAHIDA</span>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 text-warm-gray-500 hover:text-warm-gray-800"
          >
            <X size={22} />
          </button>
        </div>

        <div className="space-y-1">
          {navItems.map((item) => (
            <div key={item.label}>
              <Link
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2.5 text-base font-medium text-charcoal hover:text-emerald-forest"
              >
                {item.label}
              </Link>
              {item.children && (
                <div className="ml-4 space-y-1 mb-3">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-1.5 text-sm text-warm-gray-600 hover:text-emerald-forest"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-warm-gray-200">
          {!isLoggedIn ? (
            <Link
              href="/masuk"
              onClick={() => setMobileMenuOpen(false)}
              className="btn-primary w-full justify-center"
            >
              Masuk / Daftar
            </Link>
          ) : (
            <Link
              href="/profil"
              onClick={() => setMobileMenuOpen(false)}
              className="btn-secondary w-full justify-center"
            >
              Profil Saya
            </Link>
          )}
        </div>
      </div>

      {/* Search Overlay */}
      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

function SearchOverlay({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Focus input when opened
      setTimeout(() => document.getElementById('global-search')?.focus(), 100);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setQuery('');
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className={`search-overlay ${isOpen ? 'open' : ''}`} 
      onClick={onClose}
    >
      <div 
        className="max-w-2xl mx-auto mt-[20vh] p-4" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <Search 
            size={22} 
            className="absolute left-4 top-1/2 -translate-y-1/2 text-warm-gray-400" 
          />
          <input
            id="global-search"
            type="text"
            placeholder="Cari artikel, karya, kitab, video..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-12 py-4 bg-white text-lg rounded-sm border-0 outline-none shadow-modal focus:ring-2 focus:ring-emerald-forest/30"
          />
          <button
            onClick={onClose}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-warm-gray-400 hover:text-warm-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        
        {query.length > 2 && (
          <div className="mt-4 bg-white rounded-sm overflow-hidden shadow-modal">
            <div className="p-4 border-b border-warm-gray-100">
              <p className="label">Hasil pencarian untuk</p>
              <p className="text-lg font-medium text-charcoal">&quot;{query}&quot;</p>
            </div>
            <div className="p-8 text-center text-warm-gray-500">
              <p>Ketik untuk mencari di seluruh Mahida Digital</p>
              <p className="text-sm mt-2">Mendukung pencarian dalam bahasa Arab</p>
            </div>
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          {['Esai', 'Terjemahan', 'Kitab', 'Video'].map((cat) => (
            <button
              key={cat}
              onClick={() => { setQuery(cat); }}
              className="py-2 px-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-sm font-medium rounded-sm transition-colors"
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
