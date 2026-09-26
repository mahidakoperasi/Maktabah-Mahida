'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ChevronDown, Menu, X } from 'lucide-react';
import type { PublicMenuItem } from '@/lib/cms';

export default function NavbarClient({ items }: { items: PublicMenuItem[] }) {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<number | null>(null);
  const pathname = usePathname();
  return (
    <header className="site-nav fixed inset-x-0 top-0 z-50 border-b border-mahida-200 bg-[#fffef9]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] max-w-[1500px] items-center justify-between gap-4 px-4 sm:px-7">
        <Link href="/" className="flex shrink-0 items-center gap-2" onClick={() => setOpen(false)}>
          <Image src="/brand/mahida-logo.webp" alt="Logo Mahida" width={46} height={46} className="h-11 w-11 object-contain" priority />
          <span className="font-serif text-xl font-bold text-[#075b3a]">MAHIDA</span>
        </Link>
        <nav aria-label="Navigasi utama" className="hidden items-center gap-1 xl:flex">
          {items.map((item) => (
            <div key={item.id} className="group relative">
              <Link href={item.path} className={`inline-flex items-center gap-1 rounded px-3 py-3 text-sm font-semibold hover:bg-mahida-50 ${pathname === item.path ? 'text-emerald-forest' : 'text-charcoal'}`}>
                {item.label}{item.children.length > 0 && <ChevronDown size={14} aria-hidden />}
              </Link>
              {item.children.length > 0 && (
                <div className="invisible absolute left-0 top-full min-w-52 border border-mahida-200 bg-white p-2 opacity-0 shadow-lg group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                  {item.children.map((child) => <Link key={child.id} href={child.path} className="block px-3 py-2.5 text-sm hover:bg-mahida-50">{child.label}</Link>)}
                </div>
              )}
            </div>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/admin" className="hidden px-3 py-2 text-sm font-semibold text-emerald-forest sm:inline-flex">Admin</Link>
          <button type="button" className="grid h-11 w-11 place-items-center rounded bg-emerald-forest text-white xl:hidden" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="mobile-site-menu" aria-label={open ? 'Tutup menu' : 'Buka menu'}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-site-menu" aria-label="Navigasi ponsel" className="max-h-[calc(100dvh-76px)] overflow-y-auto border-t border-mahida-200 bg-white px-4 py-3 xl:hidden">
          {items.map((item) => (
            <div key={item.id} className="border-b border-mahida-100">
              <div className="flex items-center justify-between gap-2">
                <Link href={item.path} onClick={() => setOpen(false)} className="flex-1 py-3 font-semibold">{item.label}</Link>
                {item.children.length > 0 && <button type="button" onClick={() => setSection(section === item.id ? null : item.id)} aria-label={`Submenu ${item.label}`} aria-expanded={section === item.id} className="grid h-11 w-11 place-items-center"><ChevronDown size={18} /></button>}
              </div>
              {section === item.id && item.children.map((child) => <Link key={child.id} href={child.path} onClick={() => setOpen(false)} className="block py-3 pl-5 text-sm text-warm-gray-600">{child.label}</Link>)}
            </div>
          ))}
        </nav>
      )}
    </header>
  );
}
