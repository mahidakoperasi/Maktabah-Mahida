'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, Menu, X } from 'lucide-react';
import type { PublicMenuItem } from '@/lib/cms';

function MobileItems({ items, close }: { items: PublicMenuItem[]; close: () => void }) {
  const [expanded, setExpanded] = useState<number[]>([]);
  return <ul className="border-l border-mahida-200 pl-3">
    {items.map((item) => <li key={item.id}>
      <div className="flex items-center border-b border-mahida-100">
        <Link href={item.path} onClick={close} className="flex min-h-11 flex-1 items-center py-2 text-sm font-semibold">{item.label}</Link>
        {item.children.length > 0 && <button type="button" className="grid h-11 w-11 place-items-center" aria-label={`Submenu ${item.label}`} aria-expanded={expanded.includes(item.id)} onClick={() => setExpanded((old) => old.includes(item.id) ? old.filter((id) => id !== item.id) : [...old, item.id])}><ChevronDown size={17} aria-hidden /></button>}
      </div>
      {item.children.length > 0 && expanded.includes(item.id) && <MobileItems items={item.children} close={close} />}
    </li>)}
  </ul>;
}

export default function NavbarClient({ items, brandName = 'MAHIDA' }: { items: PublicMenuItem[]; brandName?: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState<number | null>(null);
  const [childOpen, setChildOpen] = useState<number | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.querySelector<HTMLElement>('a')?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); trigger.current?.focus(); }
      if (event.key === 'Tab') {
        const focusable = [trigger.current, ...Array.from(panel.current?.querySelectorAll<HTMLElement>('a, button') ?? [])].filter((node): node is HTMLElement => Boolean(node));
        const first = focusable[0]; const last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first && last) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last && first) { event.preventDefault(); first.focus(); }
      }
    };
    const wide = window.matchMedia('(min-width: 1024px)');
    const resize = () => { if (wide.matches) setOpen(false); };
    document.addEventListener('keydown', keydown);
    wide.addEventListener('change', resize);
    return () => { document.body.style.overflow = previous; document.removeEventListener('keydown', keydown); wide.removeEventListener('change', resize); };
  }, [open]);

  return <header onKeyDown={(event) => { if (event.key === 'Escape') { setDesktopOpen(null); setChildOpen(null); } }} className="site-nav sticky top-0 z-50 border-b border-mahida-200 bg-[#fffef9]/95 backdrop-blur-lg">
    <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between gap-4 px-4 md:px-8 lg:px-12">
      <Link href="/" onClick={() => setOpen(false)} className="max-w-[45vw] shrink-0 truncate text-xl font-black tracking-tight text-emerald-forest">{brandName}<span className="text-brass">.</span></Link>
      <nav aria-label="Navigasi utama" className="hidden items-center gap-1 lg:flex">
        {items.map((item) => <div key={item.id} className="group/top relative">
          <div className="flex items-center"><Link href={item.path} onClick={() => { setDesktopOpen(null); setChildOpen(null); }} aria-current={pathname === item.path ? 'page' : undefined} className="inline-flex min-h-11 items-center px-3 py-2 text-sm font-bold text-[#183c2d] hover:text-emerald-rich">{item.label}</Link>{item.children.length > 0 && <button type="button" aria-label={`Submenu ${item.label}`} aria-expanded={desktopOpen === item.id} onClick={() => { setDesktopOpen(desktopOpen === item.id ? null : item.id); setChildOpen(null); }} className="grid h-11 w-7 place-items-center"><ChevronDown size={15} aria-hidden /></button>}</div>
          {item.children.length > 0 && <div className={`${desktopOpen === item.id ? 'visible opacity-100' : 'invisible opacity-0'} absolute left-0 top-full w-72 border border-mahida-200 bg-white p-2 shadow-xl transition-opacity group-hover/top:visible group-hover/top:opacity-100 group-focus-within/top:visible group-focus-within/top:opacity-100`}>
            {item.children.map((child) => <div key={child.id} className="group/unit relative">
              <div className="flex items-center"><Link href={child.path} onClick={() => { setDesktopOpen(null); setChildOpen(null); }} className="flex min-h-11 flex-1 items-center px-3 py-2 text-sm hover:bg-mahida-50">{child.label}</Link>{child.children.length > 0 && <button type="button" aria-label={`Submenu ${child.label}`} aria-expanded={childOpen === child.id} onClick={() => setChildOpen(childOpen === child.id ? null : child.id)} className="grid h-11 w-8 place-items-center"><ChevronDown className="-rotate-90" size={14} aria-hidden /></button>}</div>
              {child.children.length > 0 && <div className={`${childOpen === child.id ? 'visible opacity-100' : 'invisible opacity-0'} absolute right-full top-0 w-80 border border-mahida-200 bg-white p-2 shadow-xl group-hover/unit:visible group-hover/unit:opacity-100 group-focus-within/unit:visible group-focus-within/unit:opacity-100`}>
                {child.children.map((unit) => <Link key={unit.id} href={unit.path} className="flex min-h-11 items-center px-3 py-2 text-sm leading-5 hover:bg-mahida-50">{unit.label}</Link>)}
              </div>}
            </div>)}
          </div>}
        </div>)}
      </nav>
      <button ref={trigger} type="button" aria-expanded={open} aria-controls="mobile-site-menu" aria-label={open ? 'Tutup menu' : 'Buka menu'} onClick={() => setOpen((old) => !old)} className="grid h-11 w-11 place-items-center bg-emerald-forest text-white lg:hidden">{open ? <X size={22} /> : <Menu size={22} />}</button>
    </div>
    {open && <><button type="button" tabIndex={-1} aria-label="Tutup menu" onClick={() => setOpen(false)} className="fixed inset-x-0 top-[76px] h-[calc(100dvh-76px)] bg-black/50 lg:hidden" />
      <nav ref={panel} id="mobile-site-menu" aria-label="Navigasi ponsel" className="fixed inset-x-0 top-[76px] max-h-[calc(100dvh-76px)] overflow-y-auto bg-white px-4 py-3 shadow-xl md:left-auto md:w-[420px] lg:hidden"><MobileItems items={items} close={() => setOpen(false)} /></nav>
    </>}
  </header>;
}
