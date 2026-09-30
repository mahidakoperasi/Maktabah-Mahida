'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login admin gagal');
        return;
      }

      window.dispatchEvent(new Event('mahida-auth-changed'));

      const next = new URLSearchParams(window.location.search).get('next');
      const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : '/admin';
      router.replace(safeNext);
      router.refresh();
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-cream">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-warm-gray-500 hover:text-emerald-forest mb-8 transition-colors">
          <ArrowLeft size={16} />
          Kembali ke Beranda
        </Link>

        <div className="mb-8">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-forest">
            <ShieldCheck size={22} />
          </div>
          <h1 className="text-3xl font-serif font-bold text-charcoal mb-2">Masuk Admin</h1>
          <p className="text-warm-gray-500">Akses ini khusus pengelola Mahida Digital.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-sm text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-charcoal mb-1.5">Email Admin</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-gray-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@mahida..."
                required
                autoComplete="email"
                className="w-full pl-11 pr-4 py-3 bg-white border border-warm-gray-300 rounded-sm focus:border-emerald-forest focus:ring-1 focus:ring-emerald-forest outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-charcoal mb-1.5">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-gray-400" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                required
                minLength={8}
                autoComplete="current-password"
                className="w-full pl-11 pr-11 py-3 bg-white border border-warm-gray-300 rounded-sm focus:border-emerald-forest focus:ring-1 focus:ring-emerald-forest outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-warm-gray-400 hover:text-warm-gray-600"
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="w-full btn-primary justify-center py-3.5 disabled:opacity-60">
            {isLoading ? <><Loader2 size={18} className="animate-spin" />Memproses...</> : 'Masuk ke Admin'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs leading-relaxed text-warm-gray-400">
          Tidak ada pendaftaran akun publik. Admin baru ditambahkan oleh admin utama.
        </p>
      </div>
    </div>
  );
}
