'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [requiresVerification, setRequiresVerification] = useState(false);
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
        setError(data.error || 'Login gagal');
        return;
      }

      if (data.requiresVerification) {
        setRequiresVerification(true);
        return;
      }

      window.dispatchEvent(new Event('mahida-auth-changed'));

      const next = new URLSearchParams(window.location.search).get('next');
      const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : null;

      if (safeNext) {
        router.replace(safeNext);
      } else if (data.user?.role === 'admin') {
        router.replace('/admin');
      } else {
        router.replace('/');
      }

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

        <div className="mb-10">
          <h1 className="text-3xl font-serif font-bold text-charcoal mb-2">Masuk</h1>
          <p className="text-warm-gray-500">Masuk ke akun Mahida Digital Anda</p>
        </div>

        {requiresVerification ? (
          <div className="bg-blue-50 border border-blue-200 rounded-sm p-6 text-center">
            <Mail size={32} className="mx-auto mb-3 text-blue-600" />
            <h2 className="font-semibold text-charcoal mb-2">Verifikasi Diperlukan</h2>
            <p className="text-sm text-warm-gray-600 mb-4">
              Kami telah membuat kode verifikasi baru untuk email Anda.
            </p>
            <Link
              href={`/daftar?email=${encodeURIComponent(email)}&verify=1`}
              className="btn-primary w-full justify-center"
            >
              Verifikasi Email
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-sm text-sm mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-charcoal mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    required
                    autoComplete="email"
                    className="w-full pl-11 pr-4 py-3 bg-white border border-warm-gray-300 rounded-sm focus:border-emerald-forest focus:ring-1 focus:ring-emerald-forest outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-charcoal mb-1.5">
                  Password
                </label>
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
                    className="w-full pl-11 pr-11 py-3 bg-white border border-warm-gray-300 rounded-sm focus:border-emerald-forest focus:ring-1 focus:ring-emerald-forest outline-none transition-colors"
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary justify-center py-3.5 disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Memproses...
                  </>
                ) : (
                  'Masuk'
                )}
              </button>
            </form>

            <div className="mt-8 text-center space-y-3">
              <p className="text-sm text-warm-gray-500">
                Belum punya akun?{' '}
                <Link href="/daftar" className="font-semibold text-emerald-forest hover:underline">
                  Daftar Sekarang
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
