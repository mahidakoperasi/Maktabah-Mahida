import Link from "next/link";

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 relative overflow-hidden">
        <div className="container text-center space-y-6 py-20">
          <div className="inline-block px-4 py-2 bg-emerald-100 dark:bg-emerald-950 rounded-full text-sm font-medium text-emerald-700 dark:text-emerald-400">
            Wajah Digital Mahida
          </div>
          
          <h1 className="font-serif text-5xl md:text-6xl font-bold text-slate-900 dark:text-slate-50">
            Belajar.<br />Berkarya.<br />Berkhidmah.
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg text-slate-600 dark:text-slate-400">
            Ruang untuk mengenal, membaca, melihat, menjaga arsip, dan mengikuti perjalanan Mahida dalam ilmu, karya, dan khidmah.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link
              href="/literasi"
              className="px-8 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-medium transition-colors"
            >
              Mulai Membaca
            </Link>
            <Link
              href="/tentang"
              className="px-8 py-3 border-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-50 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg font-medium transition-colors"
            >
              Jelajahi Mahida
            </Link>
          </div>
        </div>
      </section>

      {/* Mahida Today */}
      <section className="py-20 bg-white dark:bg-slate-950">
        <div className="container">
          <div className="mb-12">
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Terbaru</span>
            <h2 className="font-serif text-4xl font-bold text-slate-900 dark:text-slate-50 mt-2">
              Hari Ini di Mahida
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-3 max-w-2xl">
              Ringkasan aktivitas, berita, artikel, dan karya terbaru dari ekosistem Mahida.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Placeholder cards - akan diisi dengan data real */}
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="group cursor-pointer"
              >
                <div className="aspect-video bg-slate-200 dark:bg-slate-800 rounded-lg mb-4 overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-950 dark:to-emerald-900 flex items-center justify-center">
                    <svg className="w-12 h-12 text-emerald-200 dark:text-emerald-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                  Berita
                </span>
                <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-slate-50 mt-2 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                  Konten Akan Ditampilkan di Sini
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                  Placeholder untuk konten terbaru. Data akan diambil dari database.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tentang Mahida */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="aspect-video bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-950 dark:to-emerald-900 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-24 h-24 text-emerald-200 dark:text-emerald-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5.581m0 0H9m5.581 0a2 2 0 10-5.162 0m0 0H4m11.581 0v3m0-3v3" />
                </svg>
              </div>
            </div>
            <div>
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Tentang</span>
              <h2 className="font-serif text-4xl font-bold text-slate-900 dark:text-slate-50 mt-2">
                Mengenal Mahida
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mt-4">
                Mahida adalah pondok pesantren modern yang berdiri sejak tahun 2004 di Magetan, Jawa Timur. Dengan fokus pada ilmu tradisional dan kontekstual, Mahida mengembangkan intelektual muda yang berkomitmen pada pembelajaran, kreativitas, dan pengabdian.
              </p>
              <p className="text-slate-600 dark:text-slate-400 mt-4">
                Mahida Digital adalah wajah resmi, ruang literasi, pusat media, maktabah digital, dan arsip hidup dari ekosistem Mahida.
              </p>
              <Link
                href="/tentang"
                className="inline-block mt-6 px-6 py-2 text-emerald-700 dark:text-emerald-400 font-medium hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors"
              >
                Mengenal Mahida →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Literasi */}
      <section className="py-20 bg-white dark:bg-slate-950">
        <div className="container">
          <div className="mb-12">
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Bacaan</span>
            <h2 className="font-serif text-4xl font-bold text-slate-900 dark:text-slate-50 mt-2">
              Bacaan Pilihan
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="group cursor-pointer border border-slate-200 dark:border-slate-800 rounded-lg p-6 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
              >
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                  Esai
                </span>
                <h3 className="font-serif text-xl font-bold text-slate-900 dark:text-slate-50 mt-2">
                  Judul Artikel Pilihan
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm mt-3">
                  Ringkasan singkat dari artikel. Ini menampilkan preview dari konten yang akan dimuat dari database.
                </p>
                <div className="flex items-center gap-4 mt-4 text-sm text-slate-500 dark:text-slate-500">
                  <span>Penulis</span>
                  <span>•</span>
                  <span>5 min read</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Karya */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900">
        <div className="container">
          <div className="mb-12">
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Kreativitas</span>
            <h2 className="font-serif text-4xl font-bold text-slate-900 dark:text-slate-50 mt-2">
              Lahir dari Mahida
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-2 max-w-2xl">
              Gagasan yang ditulis, ilmu yang diterjemahkan, tradisi yang dirawat, dan kreativitas yang tumbuh dari Mahida.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {["Esai", "Terjemahan", "Sastra", "Media Kreatif"].map((cat) => (
              <Link
                key={cat}
                href={`/karya?kategori=${cat.toLowerCase()}`}
                className="aspect-square bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors group"
              >
                <div className="text-center">
                  <div className="text-2xl font-serif font-bold text-slate-900 dark:text-slate-50 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                    12
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{cat}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Maktabah */}
      <section className="py-20 bg-white dark:bg-slate-950">
        <div className="container">
          <div className="mb-12">
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Ilmu</span>
            <h2 className="font-serif text-4xl font-bold text-slate-900 dark:text-slate-50 mt-2">
              Maktabah
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Perpustakaan digital untuk kitab, terjemahan, dan kajian ilmu keislaman.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {["Nahwu", "Fiqh", "Tafsir", "Tasawuf"].map((cat) => (
              <Link
                key={cat}
                href={`/maktabah?kategori=${cat.toLowerCase()}`}
                className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors"
              >
                <h3 className="font-serif font-bold text-slate-900 dark:text-slate-50">{cat}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">8 Kitab</p>
              </Link>
            ))}
          </div>

          <Link
            href="/maktabah"
            className="inline-block mt-8 px-6 py-2 text-emerald-700 dark:text-emerald-400 font-medium hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors"
          >
            Jelajahi Maktabah →
          </Link>
        </div>
      </section>

      {/* Mahida TV */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900">
        <div className="container">
          <div className="mb-12">
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Media</span>
            <h2 className="font-serif text-4xl font-bold text-slate-900 dark:text-slate-50 mt-2">
              Mahida TV
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Ruang editorial untuk kajian, dokumentasi, dan karya video dari Mahida.
            </p>
          </div>

          <div className="space-y-8">
            <div className="aspect-video bg-slate-200 dark:bg-slate-800 rounded-lg overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-slate-300 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
                <svg className="w-16 h-16 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-video bg-slate-200 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Koperasi */}
      <section className="py-20 bg-white dark:bg-slate-950">
        <div className="container">
          <div className="mb-12">
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Layanan</span>
            <h2 className="font-serif text-4xl font-bold text-slate-900 dark:text-slate-50 mt-2">
              Koperasi Mahida
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {["Kitab", "Buku", "ATK", "Perlengkapan"].map((cat) => (
              <div
                key={cat}
                className="p-6 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
              >
                <h3 className="font-serif font-bold text-slate-900 dark:text-slate-50">{cat}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">Lihat Katalog</p>
              </div>
            ))}
          </div>

          <Link
            href="/koperasi"
            className="inline-block mt-8 px-6 py-2 text-emerald-700 dark:text-emerald-400 font-medium hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors"
          >
            Jelajahi Koperasi →
          </Link>
        </div>
      </section>
    </div>
  );
}
