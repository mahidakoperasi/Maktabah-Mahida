export default function KirimKaryaPage() {
  return (
    <div>
      {/* Hero */}
      <section className="py-16 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="container">
          <h1 className="font-serif text-5xl font-bold text-slate-900 dark:text-slate-50 mb-4">
            Kirim Karya
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl">
            Bagikan tulisan, penelitian, terjemahan, atau karya kreatif Anda dengan komunitas Mahida.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 bg-white dark:bg-slate-950">
        <div className="container max-w-3xl space-y-12">
          {/* Introduction */}
          <div>
            <h2 className="font-serif text-3xl font-bold text-slate-900 dark:text-slate-50 mb-4">
              Kami Menerima Karya Anda
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Mahida Digital membuka kesempatan bagi santri, alumni, dan masyarakat umum untuk berbagi karya ilmiah, literasi, dan kreativitas. Semua karya akan melalui proses review sebelum dipublikasikan.
            </p>
          </div>

          {/* Jenis Karya */}
          <div>
            <h2 className="font-serif text-3xl font-bold text-slate-900 dark:text-slate-50 mb-6">
              Jenis Karya yang Diterima
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  title: "Esai & Artikel",
                  desc: "Tulisan mendalam tentang pendidikan, budaya, sosial, atau refleksi personal.",
                },
                {
                  title: "Terjemahan Kitab",
                  desc: "Terjemahan dari kitab klasik dengan penjelasan atau catatan kaki.",
                },
                {
                  title: "Penelitian & Kajian",
                  desc: "Hasil penelitian, makalah akademik, atau ringkasan kajian ilmiah.",
                },
                {
                  title: "Sastra & Puisi",
                  desc: "Puisi, cerpen, prosa, atau karya sastra lainnya dalam bahasa Indonesia atau Arab.",
                },
                {
                  title: "Fotografi & Dokumentasi",
                  desc: "Foto berkualitas tinggi dengan narasi atau cerita yang mendalam.",
                },
                {
                  title: "Media Kreatif",
                  desc: "Video, animasi, desain, atau karya media digital lainnya.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="p-6 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
                >
                  <h3 className="font-serif font-bold text-slate-900 dark:text-slate-50 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Format */}
          <div>
            <h2 className="font-serif text-3xl font-bold text-slate-900 dark:text-slate-50 mb-4">
              Format Pengiriman
            </h2>
            <div className="p-6 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-lg">
              <h3 className="font-serif font-bold text-emerald-900 dark:text-emerald-100 mb-3">
                Format Utama: Microsoft Word (.docx)
              </h3>
              <p className="text-emerald-800 dark:text-emerald-200 text-sm">
                Kirimkan karya Anda dalam format .docx untuk memudahkan proses review dan publikasi. Format ini mendukung:
              </p>
              <ul className="list-disc list-inside mt-3 text-emerald-800 dark:text-emerald-200 text-sm space-y-1">
                <li>Teks dengan formatting (bold, italic, underline)</li>
                <li>Headings dan struktur dokumen</li>
                <li>Gambar dan foto</li>
                <li>Footnote dan endnote</li>
                <li>Tabel dan list</li>
                <li>Teks Arab dengan harakat</li>
              </ul>
            </div>
          </div>

          {/* Ketentuan */}
          <div>
            <h2 className="font-serif text-3xl font-bold text-slate-900 dark:text-slate-50 mb-4">
              Ketentuan & Pedoman
            </h2>
            <div className="space-y-4">
              <div className="p-4 border-l-4 border-emerald-500 bg-slate-50 dark:bg-slate-900 rounded-r-lg">
                <h3 className="font-serif font-bold text-slate-900 dark:text-slate-50 mb-2">
                  Panjang Karya
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Minimal 500 kata untuk artikel. Tidak ada batasan maksimal, tapi disarankan tidak lebih dari 5000 kata per bagian. Untuk karya panjang, dapat dibagi menjadi beberapa seri.
                </p>
              </div>

              <div className="p-4 border-l-4 border-emerald-500 bg-slate-50 dark:bg-slate-900 rounded-r-lg">
                <h3 className="font-serif font-bold text-slate-900 dark:text-slate-50 mb-2">
                  Bahasa
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Gunakan Bahasa Indonesia yang baik dan benar, atau Bahasa Arab yang fasih. Hindari bahasa yang terlalu kasual atau mengandung unsur kalimat kasar.
                </p>
              </div>

              <div className="p-4 border-l-4 border-emerald-500 bg-slate-50 dark:bg-slate-900 rounded-r-lg">
                <h3 className="font-serif font-bold text-slate-900 dark:text-slate-50 mb-2">
                  Orisinalitas
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Karya harus original atau original translation. Jika mengutip sumber lain, cantumkan dengan jelas dan sediakan referensi lengkap.
                </p>
              </div>

              <div className="p-4 border-l-4 border-emerald-500 bg-slate-50 dark:bg-slate-900 rounded-r-lg">
                <h3 className="font-serif font-bold text-slate-900 dark:text-slate-50 mb-2">
                  Konten
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Karya harus menghormati nilai-nilai Islam dan etika akademik. Hindari konten yang menyerang, tidak sopan, atau mencermarkan nama baik orang lain.
                </p>
              </div>

              <div className="p-4 border-l-4 border-emerald-500 bg-slate-50 dark:bg-slate-900 rounded-r-lg">
                <h3 className="font-serif font-bold text-slate-900 dark:text-slate-50 mb-2">
                  Gambar & Media
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Semua gambar atau media harus berlisensi bebas atau Anda memiliki hak untuk menggunakannya. Cantumkan sumber dan atribusi jika diperlukan.
                </p>
              </div>
            </div>
          </div>

          {/* Hak Cipta */}
          <div>
            <h2 className="font-serif text-3xl font-bold text-slate-900 dark:text-slate-50 mb-4">
              Hak Cipta & Publikasi
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Dengan mengirimkan karya ke Mahida Digital, Anda:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-400">
              <li>Menyetujui untuk mempublikasikan karya Anda di Mahida Digital</li>
              <li>Tetap memiliki hak cipta penuh atas karya Anda</li>
              <li>Mengizinkan Mahida untuk menampilkan karya Anda dengan atribusi penulis</li>
              <li>
                Memahami bahwa karya dipublikasikan di bawah lisensi Creative Commons (CC BY-NC-SA)
              </li>
            </ul>
          </div>

          {/* Proses Review */}
          <div>
            <h2 className="font-serif text-3xl font-bold text-slate-900 dark:text-slate-50 mb-4">
              Proses Review
            </h2>
            <div className="space-y-3">
              {[
                { step: 1, title: "Penerimaan", desc: "Karya Anda diterima dan dicatat" },
                { step: 2, title: "Review", desc: "Tim Mahida melakukan review untuk konten dan kualitas" },
                { step: 3, title: "Editing", desc: "Jika diperlukan, karya akan di-edit untuk perbaikan" },
                { step: 4, title: "Publikasi", desc: "Karya dipublikasikan dan menjadi bagian dari Mahida Digital" },
              ].map((item) => (
                <div key={item.step} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-emerald-700 dark:bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-slate-900 dark:text-slate-50">
                      {item.title}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-6 p-4 bg-slate-100 dark:bg-slate-900 rounded-lg">
              ℹ️ Proses review biasanya memakan waktu 1-2 minggu. Kami akan menghubungi Anda melalui email untuk update.
            </p>
          </div>

          {/* CTA */}
          <div className="p-8 bg-emerald-50 dark:bg-emerald-950 border-2 border-emerald-300 dark:border-emerald-700 rounded-lg text-center">
            <h2 className="font-serif text-2xl font-bold text-emerald-900 dark:text-emerald-100 mb-4">
              Siap Mengirim Karya Anda?
            </h2>
            <p className="text-emerald-800 dark:text-emerald-200 mb-6 max-w-2xl mx-auto">
              Siapkan karya Anda dalam format .docx, lalu kirimkan ke email di bawah dengan subjek berisi judul karya Anda.
            </p>
            <a
              href="mailto:karya@mahida.ac.id"
              className="inline-flex items-center gap-2 px-8 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-medium transition-colors"
            >
              ✉️ Kirim Karya ke Email
            </a>
            <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-4">
              karya@mahida.ac.id
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900">
        <div className="container max-w-3xl">
          <h2 className="font-serif text-3xl font-bold text-slate-900 dark:text-slate-50 mb-8 text-center">
            Pertanyaan Umum
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "Apakah saya harus menjadi santri Mahida untuk mengirim karya?",
                a: "Tidak. Siapa saja yang memiliki karya berkualitas dapat mengirimkan ke Mahida Digital. Kami terbuka untuk alumni, masyarakat umum, dan pecinta literasi.",
              },
              {
                q: "Berapa lama waktu review karya saya?",
                a: "Biasanya 1-2 minggu. Untuk karya yang lebih panjang atau memerlukan research tambahan, mungkin lebih lama. Kami akan update progress via email.",
              },
              {
                q: "Apakah karya saya akan mendapat bayaran?",
                a: "Mahida Digital adalah platform publikasi, bukan marketplace komersial. Kami menerbitkan karya untuk memperkaya ekosistem literasi. Anda akan mendapat apresiasi dan eksposur.",
              },
              {
                q: "Bagaimana jika karya saya ditolak?",
                a: "Tim kami akan mengirimkan feedback lengkap tentang alasan penolakan. Anda dapat merevisi dan mengirim kembali karya Anda.",
              },
            ].map((item, idx) => (
              <details
                key={idx}
                className="p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
              >
                <summary className="font-serif font-bold text-slate-900 dark:text-slate-50">
                  {item.q}
                </summary>
                <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
