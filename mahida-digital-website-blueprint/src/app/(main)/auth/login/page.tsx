"use client";

import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      // Redirect to dashboard or home
      window.location.href = "/dashboard";
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
            Masuk ke Mahida
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Akses profil, bookmark, dan koleksi Anda
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

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
            {isLoading ? "Loading..." : "Masuk"}
          </button>
        </form>

        <div className="text-center text-sm text-slate-600 dark:text-slate-400">
          Belum memiliki akun?{" "}
          <Link href="/auth/register" className="text-emerald-700 dark:text-emerald-400 font-medium hover:underline">
            Daftar di sini
          </Link>
        </div>
      </div>
    </div>
  );
}
