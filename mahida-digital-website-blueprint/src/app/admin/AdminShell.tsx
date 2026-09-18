'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, FileText, PenTool, Newspaper, BookOpen,
  Video, Image, Calendar, Building2, Archive, Tag,
  Users, MessageCircle, BarChart3, Settings, ChevronLeft,
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
    label: 'Konten',
    children: [
      { label: 'Artikel', icon: FileText, href: '/admin/konten/artikel' },
      { label: 'Karya', icon: PenTool, href: '/admin/konten/karya' },
      { label: 'Terjemahan', icon: FileText, href: '/admin/konten/terjemahan' },
      { label: 'Berita', icon: Newspaper, href: '/admin/konten/berita' },
      { label: 'Stories', icon: BookOpen, href: '/admin/konten/stories' },
    ],
  },
  {
    label: 'Maktabah',
    children: [
      { label: 'Kitab', icon: BookOpen, href: '/admin/maktabah/kitab' },
      { label: 'Buku', icon: BookOpen, href: '/admin/maktabah/buku' },
      { label: 'Kajian', icon: BookOpen, href: '/admin/maktabah/kajian' },
    ],
  },
  {
    label: 'Media',
    children: [
      { label: 'YouTube', icon: Video, href: '/admin/media/youtube' },
      { label: 'Facebook', icon: FileText, href: '/admin/media/facebook' },
      { label: 'Galeri', icon: Image, href: '/admin/media/galeri' },
      { label: 'Photo Story', icon: Image, href: '/admin/media/photo-story' },
    ],
  },
  {
    label: 'Kegiatan',
    children: [
      { label: 'Agenda', icon: Calendar, href: '/admin/kegiatan/agenda' },
      { label: 'Pengumuman', icon: FileText, href: '/admin/kegiatan/pengumuman' },
      { label: 'Prestasi', icon: FileText, href: '/admin/kegiatan/prestasi' },
    ],
  },
  { label: 'Profil Pondok', icon: Building2, href: '/admin/profil' },
  { label: 'Koperasi', icon: Building2, href: '/admin/koperasi' },
  { label: 'Arsip', icon: Archive, href: '/admin/arsip' },
  { label: 'Kategori & Tag', icon: Tag, href: '/admin/taxonomy' },
  { label: 'Penulis', icon: Users, href: '/admin/authors' },
  { label: 'Pengguna', icon: Users, href: '/admin/users' },
  { label: 'Komentar', icon: MessageCircle, href: '/admin/comments' },
  { label: 'Analytics', icon: BarChart3, href: '/admin/analytics' },
  { label: 'Pengaturan', icon: Settings, href: '/admin/settings' },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(['Konten']);
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
    <div className="min-h-screen bg-warm-gray-100 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-charcoal text-white transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} overflow-y-auto`}>
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
        <nav className="p-3 space-y-1">
          {navItems.map((item) => (
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
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm text-warm-gray-400 hover:text-white hover:bg-white/5 transition-colors">
            <LogOut size={18} />
            Kembali ke Website
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-warm-gray-200 px-6 py-4 flex items-center justify-between sticky top-16 lg:top-0 z-30">
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
