export default function TentangPage() {
  return (
    <div>
      {/* Hero */}
      <section className="py-16 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="container">
          <h1 className="font-serif text-5xl font-bold text-slate-900 dark:text-slate-50 mb-4">
            Tentang Mahida
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl">
            Mengenal lebih dalam tentang Pondok Pesantren Mahida, sejarah, visi misi, pendidikan, dan kehidupan santri.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 bg-white dark:bg-slate-950">
        <div className="container max-w-3xl">
          <div className="space-y-12">
            {/* Profil */}
            <div>
              <h2 className="font-serif text-3xl font-bold text-slate-900 dark:text-slate-50 mb-6">
                Profil Pondok
              </h2>
              <div className="space-y-4 text-slate-600 dark:text-slate-400">
                <p>
                  Pondok Pesantren Mahida adalah lembaga pendidikan Islam yang berlokasi di Magetan, Jawa Timur. Didirikan dengan komitmen untuk mengembangkan intelektual Muslim yang berpengetahuan luas, berpikir kritis, dan memiliki dedikasi tinggi dalam pengabdian masyarakat.
                </p>
                <p>
                  Mahida menggabungkan pendekatan tradisional dalam studi kitab klasik dengan perspektif kontemporer yang relevan dengan zaman. Kurikulum kami dirancang untuk menghasilkan lulusan yang tidak hanya menguasai ilmu agama, tetapi juga mampu berkontribusi positif dalam masyarakat.
                </p>
              </div>
            </div>

            {/* Sejarah */}
            <div>
              <h2 className="font-serif text-3xl font-bold text-slate-900 dark:text-slate-50 mb-6">
                Sejarah
              </h2>
              <div className="space-y-4 text-slate-600 dark:text-slate-400">
                <p>
                  Perjalanan Mahida dimulai dengan visi sederhana namun kuat: menciptakan ruang bagi generasi muda untuk belajar ilmu agama dengan sungguh-sungguh, mengembangkan kreativitas, dan berbakti kepada masyarakat.
                </p>
                <div className="my-6 p-6 bg-emerald-50 dark:bg-emerald-950 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <p className="text-sm text-emerald-900 dark:text-emerald-100">
                    Baca timeline lengkap sejarah Mahida dengan foto dan dokumentasi di halaman{" "}
                    <a href="/tentang/sejarah" className="font-medium hover:underline">
                      Sejarah Mahida
                    </a>
                  </p>
                </div>
              </div>
            </div>

            {/* Visi dan Misi */}
            <div>
              <h2 className="font-serif text-3xl font-bold text-slate-900 dark:text-slate-50 mb-6">
                Visi & Misi
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-serif text-xl font-bold text-slate-900 dark:text-slate-50 mb-3">
                    Visi
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Menjadi lembaga pendidikan yang menghasilkan intelektual Muslim berkualitas tinggi, yang menguasai ilmu keislaman mendalam, berpikir kritis, dan berdedikasi dalam pengabdian.
                  </p>
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold text-slate-900 dark:text-slate-50 mb-3">
                    Misi
                  </h3>
                  <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-2">
                    <li>Menyelenggarakan pendidikan Islam yang komprehensif</li>
                    <li>Mengembangkan karakter dan akhlak santri</li>
                    <li>Mendorong riset dan kajian ilmiah</li>
                    <li>Memberdayakan masyarakat melalui pendidikan</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Pendidikan */}
            <div>
              <h2 className="font-serif text-3xl font-bold text-slate-900 dark:text-slate-50 mb-6">
                Program Pendidikan
              </h2>
              <div className="space-y-4 text-slate-600 dark:text-slate-400">
                <p>
                  Mahida menyelenggarakan berbagai program pendidikan yang disesuaikan dengan kebutuhan santri dan perkembangan zaman.
                </p>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg">
                    <h4 className="font-serif font-bold text-slate-900 dark:text-slate-50 mb-2">
                      Madrasah
                    </h4>
                    <p className="text-sm">Program pendidikan formal dari tingkat dasar hingga menengah atas.</p>
                  </div>
                  <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg">
                    <h4 className="font-serif font-bold text-slate-900 dark:text-slate-50 mb-2">
                      Pesantren
                    </h4>
                    <p className="text-sm">Program pembelajaran kitab klasik dengan metode tradisional pesantren.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="container text-center">
          <h2 className="font-serif text-3xl font-bold text-slate-900 dark:text-slate-50 mb-6">
            Ingin Mengenal Lebih Lanjut?
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/kegiatan"
              className="px-8 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-medium transition-colors"
            >
              Lihat Kegiatan
            </a>
            <a
              href="/media"
              className="px-8 py-3 border-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-50 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg font-medium transition-colors"
            >
              Galeri & Media
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
