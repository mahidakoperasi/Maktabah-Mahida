"use client";

import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="font-serif text-4xl font-bold text-slate-900 dark:text-slate-50 mb-4">
          Oops! Ada Error
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Maaf, terjadi kesalahan yang tidak terduga. Silakan coba lagi atau kembali ke beranda.
        </p>
        {error.message && (
          <p className="text-xs text-slate-500 dark:text-slate-500 mb-6 p-3 bg-slate-100 dark:bg-slate-900 rounded-lg">
            Error: {error.message}
          </p>
        )}
        <div className="flex gap-4 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-medium transition-colors"
          >
            Coba Lagi
          </button>
          <Link
            href="/"
            className="px-6 py-2 border-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-50 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg font-medium transition-colors"
          >
            Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
