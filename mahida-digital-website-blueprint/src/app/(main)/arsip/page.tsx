export default function ArsipPage() {
  const years = [2024, 2023, 2022, 2021, 2020];

  return (
    <div>
      <section className="py-16 bg-slate-50 dark:bg-slate-900">
        <div className="container">
          <h1 className="font-serif text-5xl font-bold text-slate-900 dark:text-slate-50 mb-4">
            Arsip
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
            Arsip hidup dokumentasi, kegiatan, artikel, dan karya Mahida sepanjang tahun.
          </p>
        </div>
      </section>

      <section className="py-20 bg-white dark:bg-slate-950">
        <div className="container">
          <h2 className="font-serif text-3xl font-bold text-slate-900 dark:text-slate-50 mb-12">
            Berdasarkan Tahun
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-12">
            {years.map((year) => (
              <div
                key={year}
                className="p-6 text-center bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors cursor-pointer"
              >
                <h3 className="font-serif text-3xl font-bold text-slate-900 dark:text-slate-50">{year}</h3>
                <p className="text-sm text-slate-500 mt-2">24 Item</p>
              </div>
            ))}
          </div>

          <div>
            <h2 className="font-serif text-3xl font-bold text-slate-900 dark:text-slate-50 mb-8">
              Arsip 2024
            </h2>

            <div className="space-y-6">
              {["Maulid Nabi", "Liburan Semester", "Wisuda Santri", "Kegiatan Rutin"].map((event) => (
                <div
                  key={event}
                  className="p-6 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors cursor-pointer"
                >
                  <h3 className="font-serif text-xl font-bold text-slate-900 dark:text-slate-50">
                    {event}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                    15 Berita • 8 Foto • 3 Video
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
