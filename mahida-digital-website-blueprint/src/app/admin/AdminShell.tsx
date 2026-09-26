'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, FileText, Users, ChevronLeft,
  ChevronDown, Menu, X, LogOut, LucideIcon
} from 'lucide-react';

interface NavItem {
  label: string;
  href?: string;
  icon?: LucideIcon;
  children?: { label: string; icon: LucideIcon; href: string }[];
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/admin',
  },
  {
    label: 'Tampilan Website',
    children: [
      { label: 'Beranda', icon: LayoutDashboard, href: '/admin/tampilan/beranda' },
      { label: 'Halaman & Menu', icon: FileText, href: '/admin/tampilan/halaman' },
      { label: 'Media Sosial & Kontak', icon: FileText, href: '/admin/tampilan/kontak' },
    ],
  },
  {
    label: 'Konten',
    children: [
      { label: 'Artikel', icon: FileText, href: '/admin/konten/artikel' },
      { label: 'Esai & Opini', icon: FileText, href: '/admin/konten/esai' },
      { label: 'Terjemahan', icon: FileText, href: '/admin/konten/terjemahan' },
      { label: 'Manuskrip', icon: FileText, href: '/admin/konten/manuskrip' },
      { label: 'Berita', icon: FileText, href: '/admin/konten/berita' },
      { label: 'Kegiatan', icon: FileText, href: '/admin/konten/kegiatan' },
      { label: 'Pengumuman', icon: FileText, href: '/admin/konten/pengumuman' },
      { label: 'Video YouTube', icon: FileText, href: '/admin/media/video' },
      { label: 'Galeri Foto', icon: FileText, href: '/admin/media/galeri' },
      { label: 'Produk Koperasi', icon: FileText, href: '/admin/koperasi/produk' },
      { label: 'Pengaturan Koperasi', icon: FileText, href: '/admin/koperasi/pengaturan' },
      { label: 'Pesanan E-Book', icon: FileText, href: '/admin/koperasi/pesanan' },
    ],
  },
];

function subscribeDesktop(callback: () => void) {
  const media = window.matchMedia('(min-width: 1024px)');
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
}

function getDesktop() { return window.matchMedia('(min-width: 1024px)').matches; }

export default function AdminShell({
  children,
  isPrimaryAdmin = false,
}: {
  children: React.ReactNode;
  isPrimaryAdmin?: boolean;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isDesktop = useSyncExternalStore(subscribeDesktop, getDesktop, () => false);
  const [expandedItems, setExpandedItems] = useState<string[]>(['Konten', 'Tampilan Website']);
  const pathname = usePathname();
  const sidebar = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!sidebarOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    sidebar.current?.querySelector<HTMLElement>('a, button')?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setSidebarOpen(false);
        menuButton.current?.focus();
      } else if (event.key === 'Tab') {
        const focusable = [...(sidebar.current?.querySelectorAll<HTMLElement>('a, button') ?? [])];
        const first = focusable[0];
        const last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first && last) {
          event.preventDefault(); last.focus();
        } else if (!event.shiftKey && document.activeElement === last && first) {
          event.preventDefault(); first.focus();
        }
      }
    }
    const desktop = window.matchMedia('(min-width: 1024px)');
    const onDesktop = () => { if (desktop.matches) setSidebarOpen(false); };
    desktop.addEventListener('change', onDesktop);
    document.addEventListener('keydown', onKeyDown);
    return () => { document.body.style.overflow = previous; document.removeEventListener('keydown', onKeyDown); desktop.removeEventListener('change', onDesktop); };
  }, [sidebarOpen]);

  function toggleExpand(label: string) {
    setExpandedItems(prev =>
      prev.includes(label)
        ? prev.filter(l => l !== label)
        : [...prev, label]
    );
  }

  function renderIcon(IconComponent: LucideIcon, size: number = 18) {
    return <IconComponent size={size} />;
  }

  return (
    <div data-admin-shell className="flex min-h-screen min-w-0 bg-warm-gray-100">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <button type="button" aria-label="Tutup navigasi admin" tabIndex={-1}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside ref={sidebar} id="admin-navigation" tabIndex={-1} inert={!sidebarOpen && !isDesktop} aria-hidden={!sidebarOpen && !isDesktop} className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-[min(18rem,88vw)] flex-col overflow-hidden bg-charcoal text-white transition-transform duration-300 lg:sticky lg:top-0 lg:bottom-auto lg:w-64 lg:shrink-0 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="font-serif font-bold text-lg">MAHIDA</span>
            <span className="text-[10px] uppercase tracking-wider text-warm-gray-500">Admin</span>
          </Link>
          <button type="button" onClick={() => { setSidebarOpen(false); menuButton.current?.focus(); }} aria-label="Tutup navigasi admin" className="grid h-11 w-11 place-items-center text-warm-gray-400 hover:text-white lg:hidden">
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="min-h-0 flex-1 overflow-y-auto p-3 space-y-1" aria-label="Navigasi admin">
          {[
            ...navItems,
            ...(isPrimaryAdmin
              ? [{ label: 'Kelola Admin', icon: Users, href: '/admin/admins' } as NavItem]
              : []),
          ].map((item) => (
            item.href ? (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm transition-colors ${
                  pathname === item.href
                    ? 'bg-emerald-forest text-white'
                    : 'text-warm-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.icon && renderIcon(item.icon)}
                {item.label}
              </Link>
            ) : (
              <div key={item.label}>
                <button
                  type="button"
                  onClick={() => toggleExpand(item.label)}
                  aria-expanded={expandedItems.includes(item.label)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-sm text-sm text-warm-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <span className="font-medium">{item.label}</span>
                  {expandedItems.includes(item.label) ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronLeft size={14} className="rotate-[270deg]" />
                  )}
                </button>
                {expandedItems.includes(item.label) && item.children && (
                  <div className="ml-4 mt-1 space-y-0.5">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-sm text-sm transition-colors ${
                          pathname === child.href
                            ? 'bg-white/10 text-white'
                            : 'text-warm-gray-500 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {renderIcon(child.icon, 16)}
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          ))}
        </nav>

        {/* Logout */}
        <div className="shrink-0 border-t border-white/10 p-4">
          <Link href="/" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm text-warm-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            <LogOut size={18} />
            Kembali ke Website
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex min-h-[72px] items-center justify-between gap-3 border-b border-warm-gray-200 bg-white px-4 py-3 sm:px-6">
          <button
            ref={menuButton}
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Buka navigasi admin"
            aria-expanded={sidebarOpen}
            aria-controls="admin-navigation"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-sm text-warm-gray-600 hover:bg-mahida-50 lg:hidden"
          >
            <Menu size={20} />
          </button>
          
          <div className="hidden sm:flex items-center gap-2 text-sm text-warm-gray-500">
            <span>Admin Panel</span>
          </div>

          <div className="flex min-w-0 items-center gap-3">
            <Link href="/" target="_blank" className="text-xs text-emerald-forest font-medium hover:underline">Lihat Website →</Link>
            <div className="w-8 h-8 bg-mahida-200 rounded-full flex items-center justify-center">
              <span className="text-xs font-semibold text-mahida-700">A</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="min-w-0 p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
