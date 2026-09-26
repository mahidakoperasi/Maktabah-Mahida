'use client';

import { useState } from 'react';
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

export default function AdminShell({
  children,
  isPrimaryAdmin = false,
}: {
  children: React.ReactNode;
  isPrimaryAdmin?: boolean;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(['Konten', 'Tampilan Website']);
  const pathname = usePathname();

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
    <div data-admin-shell className="min-h-screen bg-warm-gray-100 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-64 flex-col overflow-hidden bg-charcoal text-white transform transition-transform duration-300 lg:sticky lg:top-0 lg:bottom-auto lg:shrink-0 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="font-serif font-bold text-lg">MAHIDA</span>
            <span className="text-[10px] uppercase tracking-wider text-warm-gray-500">Admin</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-warm-gray-400 hover:text-white">
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
                  onClick={() => toggleExpand(item.label)}
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
          <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm text-warm-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            <LogOut size={18} />
            Kembali ke Website
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-warm-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-warm-gray-600 hover:bg-mahida-50 rounded-sm"
          >
            <Menu size={20} />
          </button>
          
          <div className="hidden sm:flex items-center gap-2 text-sm text-warm-gray-500">
            <span>Admin Panel</span>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/" target="_blank" className="text-xs text-emerald-forest font-medium hover:underline">Lihat Website →</Link>
            <div className="w-8 h-8 bg-mahida-200 rounded-full flex items-center justify-center">
              <span className="text-xs font-semibold text-mahida-700">A</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
