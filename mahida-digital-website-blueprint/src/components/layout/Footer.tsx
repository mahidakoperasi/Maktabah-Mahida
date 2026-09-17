import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[#244b3b] bg-[#0d2f23] text-[#edf2ee]">
      <div className="container py-14 md:py-18">
        <div className="grid gap-12 border-b border-white/15 pb-12 lg:grid-cols-[1.2fr_.8fr_.8fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center bg-[#f0e4c8] font-serif text-lg font-bold text-[#123c2c]">M</span>
              <div>
                <div className="font-serif text-xl font-semibold">Mahida Digital</div>
                <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a9b9af]">Belajar · Berkarya · Berkhidmah</div>
              </div>
            </div>
            <p className="mt-6 max-w-sm text-sm leading-7 text-[#b8c5bd]">
              Ruang digital untuk literasi, maktabah, karya, dokumentasi, dan arsip hidup Pondok Pesantren Manba’ul Hidayah.
            </p>
            <p className="mt-5 text-xs leading-6 text-[#899c91]">
              Salam, Kedawung, Nglegok, Blitar, Jawa Timur.
            </p>
          </div>

          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8fa198]">Jelajahi</div>
            <div className="mt-5 grid gap-3 text-sm text-[#c7d1cb]">
              <Link href="/literasi" className="hover:text-white">Literasi</Link>
              <Link href="/karya" className="hover:text-white">Karya</Link>
              <Link href="/maktabah" className="hover:text-white">Maktabah</Link>
              <Link href="/media" className="hover:text-white">Media</Link>
            </div>
          </div>

          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8fa198]">Mahida</div>
            <div className="mt-5 grid gap-3 text-sm text-[#c7d1cb]">
              <Link href="/tentang" className="hover:text-white">Tentang</Link>
              <Link href="/kegiatan" className="hover:text-white">Kegiatan</Link>
              <Link href="/arsip" className="hover:text-white">Arsip</Link>
              <Link href="/koperasi" className="hover:text-white">Koperasi</Link>
            </div>
          </div>

          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8fa198]">Akses</div>
            <div className="mt-5 grid gap-3 text-sm text-[#c7d1cb]">
              <Link href="/auth/login" className="hover:text-white">Masuk</Link>
              <Link href="/kirim-karya" className="hover:text-white">Kirim karya</Link>
              <Link href="/profile" className="hover:text-white">Profil pengguna</Link>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-8 text-xs text-[#87998f] md:flex-row md:items-center md:justify-between">
          <p>© {currentYear} Mahida Digital. Hak cipta dilindungi.</p>
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-[#d6dfd9]">Privasi</Link>
            <Link href="/terms" className="hover:text-[#d6dfd9]">Ketentuan</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
