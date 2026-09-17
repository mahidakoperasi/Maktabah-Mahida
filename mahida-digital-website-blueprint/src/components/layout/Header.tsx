"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { label: "Tentang", href: "/tentang" },
  { label: "Literasi", href: "/literasi" },
  { label: "Maktabah", href: "/maktabah" },
  { label: "Karya", href: "/karya" },
  { label: "Kegiatan", href: "/kegiatan" },
  { label: "Media", href: "/media" },
];

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#ded9cd] bg-[#fbfaf6]/95 backdrop-blur">
      <div className="hidden border-b border-[#e8e3d8] bg-[#f4f0e6] md:block">
        <div className="container flex h-8 items-center justify-between text-[11px] font-medium uppercase tracking-[0.18em] text-[#68716b]">
          <span>Belajar · Berkarya · Berkhidmah</span>
          <span>Salam · Kedawung · Blitar</span>
        </div>
      </div>

      <nav className="container flex h-[76px] items-center justify-between gap-6">
        <Link href="/" className="group flex shrink-0 items-center gap-3" aria-label="Mahida Digital">
          <span className="grid h-10 w-10 place-items-center bg-[#14553a] font-serif text-lg font-bold text-[#f8f4e8] transition-transform group-hover:-rotate-2">
            M
          </span>
          <span className="leading-none">
            <span className="block font-serif text-[20px] font-bold tracking-[-0.02em] text-[#14382b]">
              Mahida Digital
            </span>
            <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.18em] text-[#7a817d]">
              Pondok Pesantren
            </span>
          </span>
        </Link>

        <div className="hidden items-center gap-6 lg:flex">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative py-2 text-[13px] font-semibold transition-colors ${
                  active ? "text-[#14553a]" : "text-[#525c56] hover:text-[#14553a]"
                }`}
              >
                {item.label}
                {active && <span className="absolute inset-x-0 -bottom-[21px] h-[2px] bg-[#14553a]" />}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            aria-label="Cari"
            className="grid h-10 w-10 place-items-center text-[#435048] transition-colors hover:bg-[#f0ece2] hover:text-[#14553a]"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="m21 21-4.35-4.35m1.35-5.15a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z" />
            </svg>
          </button>

          <Link
            href="/koperasi"
            className="hidden border border-[#cfc8b9] px-3.5 py-2 text-[12px] font-semibold text-[#435048] transition-colors hover:border-[#14553a] hover:text-[#14553a] xl:inline-flex"
          >
            Koperasi
          </Link>

          <Link
            href="/auth/login"
            className="hidden bg-[#14553a] px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-[#0d3f2b] sm:inline-flex"
          >
            Masuk
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((value) => !value)}
            aria-label="Buka menu"
            aria-expanded={mobileMenuOpen}
            className="grid h-10 w-10 place-items-center text-[#23352b] lg:hidden"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18 18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="border-t border-[#ded9cd] bg-[#fbfaf6] lg:hidden">
          <div className="container grid gap-1 py-4">
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="px-2 py-3 text-sm font-semibold text-[#23352b]">
              Beranda
            </Link>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="border-t border-[#ece7dc] px-2 py-3 text-sm font-semibold text-[#4f5c54]"
              >
                {item.label}
              </Link>
            ))}
            <Link href="/koperasi" onClick={() => setMobileMenuOpen(false)} className="border-t border-[#ece7dc] px-2 py-3 text-sm font-semibold text-[#4f5c54]">
              Koperasi
            </Link>
            <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)} className="mt-2 bg-[#14553a] px-4 py-3 text-center text-sm font-semibold text-white sm:hidden">
              Masuk
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
