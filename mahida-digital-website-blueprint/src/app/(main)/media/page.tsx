export default function MediaPage() {
  return (
    <div>
      <section className="py-16 bg-slate-50 dark:bg-slate-900">
        <div className="container">
          <h1 className="font-serif text-5xl font-bold text-slate-900 dark:text-slate-50 mb-4">
            Media
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
            Video, foto, galeri, dokumentasi, dan media kreatif dari Mahida.
          </p>
        </div>
      </section>

      <section className="py-20 bg-white dark:bg-slate-950">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            {["Mahida TV", "Galeri", "Photo Story", "Facebook"].map((cat) => (
              <div key={cat} className="p-4 text-center bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors cursor-pointer">
                <h3 className="font-serif font-bold text-slate-900 dark:text-slate-50">{cat}</h3>
              </div>
            ))}
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="font-serif text-2xl font-bold text-slate-900 dark:text-slate-50 mb-6">Mahida TV</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="aspect-video bg-slate-200 dark:bg-slate-800 rounded-lg flex items-center justify-center cursor-pointer hover:opacity-75 transition-opacity">
                    <svg className="w-12 h-12 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="font-serif text-2xl font-bold text-slate-900 dark:text-slate-50 mb-6">Galeri</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="aspect-square bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer hover:opacity-75 transition-opacity"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
