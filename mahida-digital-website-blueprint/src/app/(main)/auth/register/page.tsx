"use client";

import Link from "next/link";
import { useState } from "react";

type RegistrationStep = "form" | "otp";

export default function RegisterPage() {
  const [step, setStep] = useState<RegistrationStep>("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      setUserId(data.userId);
      setStep("otp");
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "OTP verification failed");
        return;
      }

      // Redirect to login
      window.location.href = "/auth/login?verified=true";
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="font-serif text-3xl font-bold text-slate-900 dark:text-slate-50">
            Daftar Mahida
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Bergabunglah dengan komunitas pembaca Mahida
          </p>
        </div>

        {step === "form" ? (
          <form onSubmit={handleRegister} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Nama Lengkap
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-400 text-white rounded-lg font-medium transition-colors"
            >
              {isLoading ? "Loading..." : "Lanjutkan"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="bg-emerald-50 dark:bg-emerald-950 p-4 rounded-lg">
              <p className="text-sm text-emerald-800 dark:text-emerald-200">
                Kami telah mengirimkan kode OTP 6 digit ke email <strong>{email}</strong>
              </p>
            </div>

            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Kode OTP
              </label>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                maxLength={6}
                className="w-full px-4 py-2 text-center text-2xl tracking-widest border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                required
              />
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                Masukkan 6 digit kode yang Anda terima
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-400 text-white rounded-lg font-medium transition-colors"
            >
              {isLoading ? "Loading..." : "Verifikasi"}
            </button>

            <button
              type="button"
              onClick={() => setStep("form")}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-50 rounded-lg font-medium hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
            >
              Kembali
            </button>
          </form>
        )}

        <div className="text-center text-sm text-slate-600 dark:text-slate-400">
          Sudah memiliki akun?{" "}
          <Link href="/auth/login" className="text-emerald-700 dark:text-emerald-400 font-medium hover:underline">
            Masuk di sini
          </Link>
        </div>
      </div>
    </div>
  );
}
