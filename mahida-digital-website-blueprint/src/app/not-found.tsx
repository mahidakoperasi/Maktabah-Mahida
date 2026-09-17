import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-serif font-bold text-emerald-700 dark:text-emerald-400 mb-4">
          404
        </div>
        <h1 className="font-serif text-4xl font-bold text-slate-900 dark:text-slate-50 mb-4">
          Halaman Tidak Ditemukan
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          Maaf, halaman yang Anda cari tidak ada. Mungkin sudah dihapus atau alamatnya berubah.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/"
            className="px-8 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-medium transition-colors"
          >
            Kembali ke Beranda
          </Link>
          <Link
            href="/literasi"
            className="px-8 py-3 border-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-50 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg font-medium transition-colors"
          >
            Jelajahi Literasi
          </Link>
        </div>
      </div>
    </div>
  );
}
