'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { PublicMenuItem } from '@/lib/cms';
function MenuItems({
  items,
  path,
  close,
}: {
  items: PublicMenuItem[];
  path: string;
  close: () => void;
}) {
  return (
    <ul className="space-y-1">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            href={item.path}
            aria-current={path === item.path ? 'page' : undefined}
            onClick={close}
            className={`flex min-h-11 items-center break-words rounded px-3 py-2 text-sm ${path === item.path ? 'bg-emerald-forest font-semibold text-white' : 'hover:bg-mahida-50'}`}
          >
            {item.label}
          </Link>
          {!!item.children.length && (
            <div className="ml-3 border-l border-mahida-200 pl-2">
              <MenuItems items={item.children} path={path} close={close} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
export default function GallerySidebar({
  items,
  children,
}: {
  items: PublicMenuItem[];
  children: ReactNode;
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.querySelector<HTMLElement>('button,a')?.focus();
    const close = () => {
      setOpen(false);
      trigger.current?.focus();
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
      if (event.key === 'Tab') {
        const nodes = [
          ...(panel.current?.querySelectorAll<HTMLElement>('a,button') ?? []),
        ];
        const first = nodes[0],
          last = nodes.at(-1);
        if (event.shiftKey && document.activeElement === first && last) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last && first) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    const wide = window.matchMedia('(min-width: 1024px)');
    const resize = () => {
      if (wide.matches) close();
    };
    document.addEventListener('keydown', key);
    wide.addEventListener('change', resize);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', key);
      wide.removeEventListener('change', resize);
    };
  }, [open]);
  if (!items.length) return children;
  return (
    <div
      data-gallery-shell
      className="mx-auto max-w-[1600px] lg:grid lg:grid-cols-[260px_minmax(0,1fr)]"
    >
      <aside
        data-gallery-sidebar
        className="hidden self-start border-r border-mahida-200 bg-white p-4 lg:sticky lg:top-[92px] lg:block lg:max-h-[calc(100dvh-108px)] lg:overflow-y-auto"
      >
        <nav aria-label="Sidebar galeri">
          <MenuItems items={items} path={path} close={() => setOpen(false)} />
        </nav>
      </aside>
      <div className="min-w-0">
        <div className="px-4 py-3 lg:hidden">
          <button
            ref={trigger}
            type="button"
            aria-controls="gallery-mobile-panel"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="btn-secondary"
          >
            Buka menu galeri
          </button>
        </div>
        {children}
      </div>
      {open && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button
            tabIndex={-1}
            type="button"
            aria-label="Tutup panel galeri"
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setOpen(false);
              trigger.current?.focus();
            }}
          />
          <aside
            ref={panel}
            id="gallery-mobile-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Menu galeri"
            className="relative h-dvh w-[min(320px,90vw)] overflow-y-auto bg-white p-4"
          >
            <button
              type="button"
              className="btn-secondary mb-3"
              onClick={() => {
                setOpen(false);
                trigger.current?.focus();
              }}
            >
              Tutup menu galeri
            </button>
            <nav aria-label="Menu galeri ponsel">
              <MenuItems items={items} path={path} close={() => setOpen(false)} />
            </nav>
          </aside>
        </div>
      )}
    </div>
  );
}
