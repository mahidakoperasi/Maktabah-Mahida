export default function LiterasiPage() {
  return (
    <div>
      <section className="py-16 bg-slate-50 dark:bg-slate-900">
        <div className="container">
          <h1 className="font-serif text-5xl font-bold text-slate-900 dark:text-slate-50 mb-4">
            Literasi
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
            Ruang bacaan umum untuk artikel, esai, opini, pendidikan, budaya, dan refleksi dari Mahida.
          </p>
        </div>
      </section>

      <section className="py-20 bg-white dark:bg-slate-950">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="group cursor-pointer">
                <div className="aspect-video bg-slate-200 dark:bg-slate-800 rounded-lg mb-4"></div>
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 uppercase">Esai</span>
                <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-slate-50 mt-2">
                  Judul Artikel
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                  Deskripsi singkat dari artikel.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
