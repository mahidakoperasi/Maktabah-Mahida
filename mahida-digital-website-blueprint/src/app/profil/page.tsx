'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { User, Bookmark, FolderOpen, History, Settings, LogOut, Loader2 } from 'lucide-react';

interface SessionUser {
  name: string;
  email: string;
  avatar?: string | null;
  role?: 'user' | 'admin' | null;
}

export default function ProfilPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'same-origin',
          cache: 'no-store',
        });

        if (!response.ok) {
          if (active) setUser(null);
          return;
        }

        const data = await response.json();
        if (active) {
          setUser(data.user ?? null);
        }
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadSession();

    return () => {
      active = false;
    };
  }, []);

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
      });
    } finally {
      window.dispatchEvent(new Event('mahida-auth-changed'));
      window.location.href = '/';
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-cream">
        <div className="flex items-center gap-2 text-warm-gray-500">
          <Loader2 size={18} className="animate-spin" />
          Memuat profil...
        </div>
      </div>
    );
  }

  if (!user) {
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
            <Link href="/masuk?next=/profil" className="btn-primary justify-center py-3">Masuk</Link>
            <Link href="/daftar" className="btn-secondary justify-center py-3">Daftar</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <section className="bg-emerald-forest text-white py-12 lg:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center border-2 border-white/30 overflow-hidden">
              {user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-serif font-bold">{user.name?.charAt(0)}</span>
              )}
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-serif font-bold">{user.name}</h1>
              <p className="text-white/70 mt-1">{user.email}</p>
              {user.role === 'admin' && (
                <Link href="/admin" className="inline-flex mt-3 text-sm font-semibold text-brass-light hover:underline">
                  Buka Admin Panel →
                </Link>
              )}
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
              {'count' in item && (
                <span className="text-xs text-warm-gray-400 bg-mahida-100 px-2.5 py-1 rounded-sm">{item.count}</span>
              )}
            </Link>
          ))}
        </div>

        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-mahida-200">
          <h3 className="label mb-4">Statistik Membaca</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              ['0', 'Dibaca'],
              ['0', 'Bookmark'],
              ['0', 'Koleksi'],
            ].map(([value, label]) => (
              <div key={label} className="bg-cream p-5 rounded-sm">
                <span className="text-2xl font-serif font-bold text-emerald-forest">{value}</span>
                <p className="text-xs text-warm-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
