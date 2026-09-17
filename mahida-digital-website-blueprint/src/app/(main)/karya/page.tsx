export default function KaryaPage() {
  return (
    <div>
      <section className="py-16 bg-slate-50 dark:bg-slate-900">
        <div className="container">
          <h1 className="font-serif text-5xl font-bold text-slate-900 dark:text-slate-50 mb-4">
            Karya Mahida
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
            Gagasan yang ditulis, ilmu yang diterjemahkan, tradisi yang dirawat, dan kreativitas yang tumbuh dari Mahida.
          </p>
        </div>
      </section>

      <section className="py-20 bg-white dark:bg-slate-950">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
            {["Esai & Gagasan", "Terjemahan", "Sastra", "Media Kreatif"].map((cat) => (
              <div
                key={cat}
                className="p-6 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors cursor-pointer"
              >
                <h3 className="font-serif font-bold text-slate-900 dark:text-slate-50">{cat}</h3>
                <p className="text-sm text-slate-500 mt-2">12 Karya</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="group cursor-pointer">
                <div className="aspect-video bg-slate-200 dark:bg-slate-800 rounded-lg mb-4"></div>
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 uppercase">Esai</span>
                <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-slate-50 mt-2">
                  Judul Karya
                </h3>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
