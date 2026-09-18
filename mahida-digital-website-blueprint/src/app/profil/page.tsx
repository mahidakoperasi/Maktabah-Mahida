'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, Bookmark, FolderOpen, History, Settings, LogOut, BookOpen } from 'lucide-react';

export default function ProfilPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; avatar?: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('mahida_token');
    const userData = localStorage.getItem('mahida_user');
    
    if (token && userData) {
      setIsLoggedIn(true);
      setUser(JSON.parse(userData));
    }
  }, []);

  function handleLogout() {
    localStorage.removeItem('mahida_token');
    localStorage.removeItem('mahida_user');
    window.location.href = '/';
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16 bg-cream">
        <div className="max-w-md w-full text-center bg-white p-10 rounded-sm border border-mahida-200 shadow-elevated">
          <div className="w-20 h-20 mx-auto mb-6 bg-mahida-50 rounded-full flex items-center justify-center">
            <User size={32} className="text-mahida-400" />
          </div>
          <h1 className="font-serif font-bold text-2xl text-charcoal mb-3">Belum Masuk</h1>
          <p className="text-warm-gray-500 mb-8">
            Masuk atau daftar untuk mengakses bookmark, koleksi, dan riwayat bacaan Anda.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/masuk" className="btn-primary justify-center py-3">Masuk</Link>
            <Link href="/daftar" className="btn-secondary justify-center py-3">Daftar</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Profile Header */}
      <section className="bg-emerald-forest text-white py-12 lg:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center border-2 border-white/30">
              {user?.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-3xl font-serif font-bold">{user?.name?.charAt(0)}</span>
              )}
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-serif font-bold">{user?.name}</h1>
              <p className="text-white/70 mt-1">{user?.email}</p>
            </div>
            <div className="md:ml-auto">
              <button onClick={handleLogout} className="btn-ghost text-white hover:text-brass-light border-white/20 px-5 py-2">
                <LogOut size={16} />
                Keluar
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Menu */}
      <section className="py-12 bg-white min-h-[50vh]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <h2 className="label mb-4">Menu Saya</h2>
          
          {[
            { icon: Bookmark, label: 'Bookmark', desc: 'Artikel dan karya yang ditandai', href: '/profil/bookmark', count: 0 },
            { icon: FolderOpen, label: 'Koleksi', desc: 'Koleksi bacaan yang dibuat sendiri', href: '/profil/koleksi', count: 0 },
            { icon: History, label: 'Riwayat Bacaan', desc: 'Pembacaan terakhir Anda', href: '/profil/histori', count: 0 },
            { icon: Settings, label: 'Pengaturan', desc: 'Atur profil dan preferensi akun', href: '/profil/pengaturan' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-4 p-5 border border-mahida-200 rounded-sm hover:border-emerald-300 hover:bg-mahida-50 transition-all"
            >
              <div className="w-11 h-11 bg-mahida-50 group-hover:bg-emerald-50 rounded-sm flex items-center justify-center flex-shrink-0 transition-colors">
                <item.icon size={20} className="text-warm-gray-500 group-hover:text-emerald-forest transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-charcoal group-hover:text-emerald-forest transition-colors">{item.label}</h3>
                <p className="text-sm text-warm-gray-500">{item.desc}</p>
              </div>
              <span className="text-xs text-warm-gray-400 bg-mahida-100 px-2.5 py-1 rounded-sm">{item.count}</span>
            </Link>
          ))}
        </div>

        {/* Stats Placeholder */}
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-mahida-200">
          <h3 className="label mb-4">Statistik Membaca</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-cream p-5 rounded-sm">
              <span className="text-2xl font-serif font-bold text-emerald-forest">0</span>
              <p className="text-xs text-warm-gray-500 mt-1">Dibaca</p>
            </div>
            <div className="bg-cream p-5 rounded-sm">
              <span className="text-2xl font-serif font-bold text-emerald-forest">0</span>
              <p className="text-xs text-warm-gray-500 mt-1">Bookmark</p>
            </div>
            <div className="bg-cream p-5 rounded-sm">
              <span className="text-2xl font-serif font-bold text-emerald-forest">0</span>
              <p className="text-xs text-warm-gray-500 mt-1">Koleksi</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
