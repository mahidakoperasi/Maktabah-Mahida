import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-20 bg-slate-900 dark:bg-slate-950 text-slate-50">
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-emerald-600 rounded-sm"></div>
              <span className="font-serif text-lg font-bold">Mahida</span>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              Belajar • Berkarya • Berkhidmah
            </p>
            <p className="text-xs text-slate-500">
              Pondok Pesantren Modern Mahida<br />
              Jl. Raya Panjeng, Magetan, Jawa Timur
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-serif font-bold text-sm mb-4">Konten</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/literasi" className="text-slate-400 hover:text-emerald-400 transition-colors">
                  Literasi
                </Link>
              </li>
              <li>
                <Link href="/karya" className="text-slate-400 hover:text-emerald-400 transition-colors">
                  Karya
                </Link>
              </li>
              <li>
                <Link href="/maktabah" className="text-slate-400 hover:text-emerald-400 transition-colors">
                  Maktabah
                </Link>
              </li>
              <li>
                <Link href="/media" className="text-slate-400 hover:text-emerald-400 transition-colors">
                  Media
                </Link>
              </li>
            </ul>
          </div>

          {/* Organisasi */}
          <div>
            <h3 className="font-serif font-bold text-sm mb-4">Organisasi</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/tentang" className="text-slate-400 hover:text-emerald-400 transition-colors">
                  Tentang Mahida
                </Link>
              </li>
              <li>
                <Link href="/kegiatan" className="text-slate-400 hover:text-emerald-400 transition-colors">
                  Kegiatan
                </Link>
              </li>
              <li>
                <Link href="/arsip" className="text-slate-400 hover:text-emerald-400 transition-colors">
                  Arsip
                </Link>
              </li>
              <li>
                <Link href="/koperasi" className="text-slate-400 hover:text-emerald-400 transition-colors">
                  Koperasi Mahida
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-serif font-bold text-sm mb-4">Hubungi Kami</h3>
            <ul className="space-y-2 text-sm">
              <li className="text-slate-400">
                <a href="tel:+62351" className="hover:text-emerald-400 transition-colors">
                  +62 (0351)
                </a>
              </li>
              <li className="text-slate-400">
                <a href="mailto:info@mahida.ac.id" className="hover:text-emerald-400 transition-colors">
                  info@mahida.ac.id
                </a>
              </li>
              <li className="mt-4 flex gap-4">
                <a href="https://facebook.com/mahida" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a href="https://youtube.com/mahida" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-400">
            <p>&copy; {currentYear} Mahida Digital. Hak Cipta Dilindungi.</p>
            <div className="flex gap-6">
              <Link href="/privacy" className="hover:text-emerald-400 transition-colors">
                Kebijakan Privasi
              </Link>
              <Link href="/terms" className="hover:text-emerald-400 transition-colors">
                Syarat & Ketentuan
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
