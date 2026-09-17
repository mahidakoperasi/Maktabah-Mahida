export default function KegiatanPage() {
  return (
    <div>
      <section className="py-16 bg-slate-50 dark:bg-slate-900">
        <div className="container">
          <h1 className="font-serif text-5xl font-bold text-slate-900 dark:text-slate-50 mb-4">
            Kegiatan
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
            Berita, agenda, pengumuman, prestasi, dan dokumentasi kegiatan Mahida.
          </p>
        </div>
      </section>

      <section className="py-20 bg-white dark:bg-slate-950">
        <div className="container">
          <div className="grid grid-cols-4 gap-4 mb-12">
            {["Berita", "Agenda", "Pengumuman", "Prestasi"].map((cat) => (
              <div key={cat} className="p-4 text-center bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors cursor-pointer">
                <h3 className="font-serif font-bold text-slate-900 dark:text-slate-50">{cat}</h3>
                <p className="text-xs text-slate-500 mt-1">8 Item</p>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-6 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors cursor-pointer">
                <div className="flex gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-serif font-bold text-emerald-700 dark:text-emerald-400">27</div>
                    <div className="text-xs text-slate-500 dark:text-slate-500">SEP</div>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 uppercase">Berita</span>
                    <h3 className="font-serif text-lg font-bold text-slate-900 dark:text-slate-50 mt-1">
                      Judul Kegiatan
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                      Deskripsi singkat kegiatan.
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
