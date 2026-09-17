export default function MaktabahPage() {
  const categories = [
    { name: "Nahwu", icon: "📚" },
    { name: "Sharaf", icon: "✍️" },
    { name: "Fiqh", icon: "⚖️" },
    { name: "Tafsir", icon: "📖" },
    { name: "Hadits", icon: "🎯" },
    { name: "Aqidah", icon: "💡" },
    { name: "Tasawuf", icon: "🕌" },
    { name: "Balaghah", icon: "🎨" },
  ];

  return (
    <div>
      <section className="py-16 bg-slate-50 dark:bg-slate-900">
        <div className="container">
          <h1 className="font-serif text-5xl font-bold text-slate-900 dark:text-slate-50 mb-4">
            Maktabah
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
            Perpustakaan digital untuk kitab, terjemahan, dan kajian ilmu keislaman dari tradisi pesantren.
          </p>
        </div>
      </section>

      <section className="py-20 bg-white dark:bg-slate-950">
        <div className="container">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-12">
            {categories.map((cat) => (
              <div
                key={cat.name}
                className="p-6 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors text-center cursor-pointer"
              >
                <div className="text-3xl mb-2">{cat.icon}</div>
                <h3 className="font-serif font-bold text-slate-900 dark:text-slate-50">{cat.name}</h3>
                <p className="text-xs text-slate-500 mt-2">8 Kitab</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-6 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors cursor-pointer">
                <h3 className="font-serif font-bold text-slate-900 dark:text-slate-50">Nama Kitab</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Penulis • Kategori</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
