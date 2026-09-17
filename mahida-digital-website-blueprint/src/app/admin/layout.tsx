"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();

  const menuItems = [
    { label: "Dashboard", href: "/admin", icon: "📊" },
    {
      label: "Konten",
      icon: "📝",
      submenu: [
        { label: "Artikel", href: "/admin/konten/artikel" },
        { label: "Karya", href: "/admin/konten/karya" },
        { label: "Berita", href: "/admin/konten/berita" },
      ],
    },
    {
      label: "Maktabah",
      icon: "📚",
      submenu: [
        { label: "Kitab", href: "/admin/maktabah/kitab" },
        { label: "Kajian", href: "/admin/maktabah/kajian" },
      ],
    },
    {
      label: "Media",
      icon: "🎬",
      submenu: [
        { label: "Video", href: "/admin/media/video" },
        { label: "Galeri", href: "/admin/media/galeri" },
      ],
    },
    { label: "Kategori", href: "/admin/kategori", icon: "🏷️" },
    { label: "Pengguna", href: "/admin/pengguna", icon: "👥" },
    { label: "Pengaturan", href: "/admin/pengaturan", icon: "⚙️" },
  ];

  return (
    <div className="flex h-screen bg-slate-900 dark:bg-slate-950">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-slate-800 dark:bg-slate-900 border-r border-slate-700 dark:border-slate-800 transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-sm"></div>
              <span className="font-bold text-white text-sm">Mahida CMS</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-slate-400 hover:text-slate-300 p-1"
          >
            ☰
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto py-6 px-2">
          <div className="space-y-2">
            {menuItems.map((item) => (
              <div key={item.label}>
                {item.href ? (
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      pathname === item.href
                        ? "bg-emerald-600 text-white"
                        : "text-slate-300 hover:text-white hover:bg-slate-700"
                    }`}
                  >
                    <span>{item.icon}</span>
                    {sidebarOpen && <span>{item.label}</span>}
                  </Link>
                ) : (
                  <>
                    <div className="flex items-center gap-3 px-4 py-2 text-slate-400 text-xs font-semibold uppercase">
                      <span>{item.icon}</span>
                      {sidebarOpen && <span>{item.label}</span>}
                    </div>
                    {sidebarOpen && item.submenu && (
                      <div className="pl-8 space-y-1">
                        {item.submenu.map((sub) => (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className={`block px-4 py-2 text-xs rounded-lg transition-colors ${
                              pathname === sub.href
                                ? "bg-emerald-600 text-white"
                                : "text-slate-400 hover:text-white hover:bg-slate-700"
                            }`}
                          >
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </nav>

        {/* User */}
        <div className="h-16 border-t border-slate-700 px-4 flex items-center justify-between">
          {sidebarOpen && <span className="text-sm text-slate-400">Admin</span>}
          <button className="text-slate-400 hover:text-slate-300">🚪</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-slate-950">
        {/* Top Bar */}
        <div className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between">
          <h1 className="text-white font-semibold">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <button className="text-slate-400 hover:text-slate-300">🔔</button>
            <button className="text-slate-400 hover:text-slate-300">⚙️</button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
