export default function KoperasiPage() {
  const categories = ["Kitab", "Buku", "ATK", "Perlengkapan Santri", "Paket Madrasah", "Paket Pesantren"];

  return (
    <div>
      <section className="py-16 bg-slate-50 dark:bg-slate-900">
        <div className="container">
          <h1 className="font-serif text-5xl font-bold text-slate-900 dark:text-slate-50 mb-4">
            Koperasi Mahida
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
            Katalog produk dan layanan Koperasi Mahida untuk kebutuhan santri dan masyarakat.
          </p>
        </div>
      </section>

      <section className="py-20 bg-white dark:bg-slate-950">
        <div className="container">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-12">
            {categories.map((cat) => (
              <div key={cat} className="p-6 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors cursor-pointer">
                <h3 className="font-serif font-bold text-slate-900 dark:text-slate-50">{cat}</h3>
                <p className="text-sm text-slate-500 mt-2">12 Produk</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors cursor-pointer">
                <div className="aspect-square bg-slate-200 dark:bg-slate-800 rounded-lg mb-3"></div>
                <h4 className="font-serif font-bold text-slate-900 dark:text-slate-50 text-sm">Nama Produk</h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">Lihat Detail</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-emerald-50 dark:bg-emerald-950 border-t border-emerald-200 dark:border-emerald-800">
        <div className="container text-center">
          <h2 className="font-serif text-3xl font-bold text-emerald-900 dark:text-emerald-100 mb-4">
            Ingin Memesan?
          </h2>
          <p className="text-emerald-800 dark:text-emerald-200 mb-6 max-w-2xl mx-auto">
            Hubungi Koperasi Mahida melalui email atau kunjungi langsung untuk informasi lebih lanjut tentang produk dan harga.
          </p>
          <a
            href="mailto:koperasi@mahida.ac.id"
            className="inline-block px-8 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-medium transition-colors"
          >
            Hubungi Koperasi
          </a>
        </div>
      </section>
    </div>
  );
}
