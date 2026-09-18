'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

function RegisterContent() {
  const [step, setStep] = useState<'register' | 'verify' | 'success'>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillEmail = searchParams.get('email') || '';
  const verifyMode = searchParams.get('verify') === '1';

  useEffect(() => {
    if (prefillEmail) {
      setEmail(prefillEmail);
    }
    if (verifyMode) {
      setStep('verify');
    }
  }, [prefillEmail, verifyMode]);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registrasi gagal');
        return;
      }

      setUserId(data.userId);
      setStep('verify');

      // Show dev OTP in console
      if (data.devOtp) {
        console.log('[DEV] OTP Code:', data.devOtp);
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const code = otp.join('');

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Verifikasi gagal');
        return;
      }

      window.dispatchEvent(new Event('mahida-auth-changed'));
      setStep('success');
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleOtpChange(index: number, value: string) {
    if (value.length > 1) return; // Only allow single digit
    
    const newOtp = [...otp];
    newOtp[index] = value.replace(/[^0-9]/g, '');
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    // Handle backspace - go to previous input
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-cream">
      <div className="w-full max-w-md">
        {/* Back link */}
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-warm-gray-500 hover:text-emerald-forest mb-8 transition-colors">
          <ArrowLeft size={16} />
          Kembali ke Beranda
        </Link>

        {/* Step 1: Registration Form */}
        {step === 'register' && (
          <>
            <div className="mb-10">
              <h1 className="text-3xl font-serif font-bold text-charcoal mb-2">Daftar Akun</h1>
              <p className="text-warm-gray-500">Buat akun untuk mulai membaca dan menandai karya favorit Anda</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-sm text-sm mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-charcoal mb-1.5">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-gray-400" />
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nama lengkap Anda"
                    required
                    className="w-full pl-11 pr-4 py-3 bg-white border border-warm-gray-300 rounded-sm focus:border-emerald-forest focus:ring-1 focus:ring-emerald-forest outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-email" className="block text-sm font-medium text-charcoal mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-gray-400" />
                  <input
                    id="reg-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    required
                    className="w-full pl-11 pr-4 py-3 bg-white border border-warm-gray-300 rounded-sm focus:border-emerald-forest focus:ring-1 focus:ring-emerald-forest outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-password" className="block text-sm font-medium text-charcoal mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-gray-400" />
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                    required
                    minLength={8}
                    className="w-full pl-11 pr-11 py-3 bg-white border border-warm-gray-300 rounded-sm focus:border-emerald-forest focus:ring-1 focus:ring-emerald-forest outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-warm-gray-400 hover:text-warm-gray-600"
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
                    Mendaftar...
                  </>
                ) : (
                  <>
                    Daftar
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-warm-gray-500">
              Sudah punya akun?{' '}
              <Link href="/masuk" className="font-semibold text-emerald-forest hover:underline">
                Masuk
              </Link>
            </p>
          </>
        )}

        {/* Step 2: OTP Verification */}
        {step === 'verify' && (
          <>
            <div className="mb-10 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-emerald-50 rounded-full flex items-center justify-center">
                <ShieldCheck size={28} className="text-emerald-forest" />
              </div>
              <h1 className="text-2xl font-serif font-bold text-charcoal mb-2">Verifikasi Email</h1>
              <p className="text-warm-gray-500">
                Kami telah mengirim kode verifikasi 6 digit ke<br />
                <strong>{email}</strong>
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-sm text-sm mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleVerifyOTP}>
              <div className="flex justify-center gap-2 mb-8">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-12 h-14 text-center text-xl font-semibold bg-white border border-warm-gray-300 rounded-sm focus:border-emerald-forest focus:ring-2 focus:ring-emerald-forest/20 outline-none transition-all"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.some(d => !d)}
                className="w-full btn-primary justify-center py-3.5 disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Memverifikasi...
                  </>
                ) : (
                  'Verifikasi'
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-warm-gray-500">
              Tidak menerima kode?{' '}
              <button 
                onClick={() => { /* TODO: Resend */ }}
                className="font-semibold text-emerald-forest hover:underline"
              >
                Kirim Ulang
              </button>
            </p>
          </>
        )}

        {/* Step 3: Success */}
        {step === 'success' && (
          <div className="text-center py-8">
            <div className="w-20 h-20 mx-auto mb-6 bg-emerald-100 rounded-full flex items-center justify-center">
              <ShieldCheck size={36} className="text-emerald-forest" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-charcoal mb-2">Akun Berhasil Dibuat!</h1>
            <p className="text-warm-gray-500 mb-8">
              Selamat datang di Mahida Digital, {name}.<br />
              Mulai menjelajahi ilmu dan karya.
            </p>
            <Link href="/" className="btn-primary w-full justify-center py-3.5">
              Jelajahi Mahida Digital
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-cream">
        <div className="animate-pulse text-warm-gray-400">Memuat...</div>
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}
