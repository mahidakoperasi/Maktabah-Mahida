import Link from "next/link";

const featureCards = [
  {
    eyebrow: "Literasi",
    title: "Gagasan yang tumbuh dari ruang belajar",
    body: "Esai, opini, pendidikan, terjemahan, dan catatan yang lahir dari tradisi membaca serta berdiskusi.",
    href: "/literasi",
  },
  {
    eyebrow: "Maktabah",
    title: "Kitab, terjemahan, dan kajian yang terjaga",
    body: "Ruang digital untuk menata khazanah keilmuan, memudahkan pencarian, dan memperpanjang usia bacaan.",
    href: "/maktabah",
  },
  {
    eyebrow: "Karya",
    title: "Dari santri, untuk ruang yang lebih luas",
    body: "Tulisan, sastra, riset, media kreatif, dan pekerjaan intelektual yang tumbuh dari keseharian Mahida.",
    href: "/karya",
  },
];

const library = [
  ["Nahwu & Sharaf", "Bahasa Arab"],
  ["Fiqh", "Hukum Islam"],
  ["Tafsir", "Al-Qur'an"],
  ["Aqidah", "Ushuluddin"],
];

export default function HomePage() {
  return (
    <div className="overflow-hidden bg-[#fbfaf6] text-[#18201b]">
      <section className="relative border-b border-[#ded9cd]">
        <div className="mahida-grid absolute inset-0 opacity-50" aria-hidden="true" />
        <div className="container relative grid min-h-[680px] items-stretch lg:grid-cols-[1.08fr_.92fr]">
          <div className="flex flex-col justify-center py-16 pr-0 md:py-24 lg:pr-16">
            <div className="mb-8 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6c766f]">
              <span className="h-px w-10 bg-[#a88953]" />
              Wajah Digital Mahida
            </div>

            <h1 className="max-w-[760px] font-serif text-[clamp(3.5rem,8vw,7.4rem)] font-semibold leading-[0.92] tracking-[-0.055em] text-[#13261d]">
              Belajar.
              <br />
              Berkarya.
              <br />
              <span className="text-[#14553a]">Berkhidmah.</span>
            </h1>

            <p className="mt-8 max-w-xl text-base leading-8 text-[#5f6963] md:text-lg">
              Ruang untuk mengenal, membaca, menjaga arsip, dan mengikuti perjalanan Mahida dalam ilmu, karya, serta khidmah.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/literasi"
                className="inline-flex items-center gap-3 bg-[#14553a] px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#0d3f2b]"
              >
                Mulai membaca
                <span aria-hidden="true">→</span>
              </Link>
              <Link
                href="/tentang"
                className="inline-flex items-center gap-3 border border-[#cfc8b9] bg-[#fbfaf6] px-6 py-3.5 text-sm font-semibold text-[#26362d] transition-colors hover:border-[#14553a] hover:text-[#14553a]"
              >
                Mengenal Mahida
              </Link>
            </div>

            <div className="mt-14 grid max-w-xl grid-cols-3 border-y border-[#ded9cd] py-5 text-sm">
              <div>
                <div className="font-serif text-xl font-semibold text-[#14553a]">Ilmu</div>
                <div className="mt-1 text-xs text-[#7a837d]">Yang dipelajari</div>
              </div>
              <div className="border-x border-[#ded9cd] px-5">
                <div className="font-serif text-xl font-semibold text-[#14553a]">Karya</div>
                <div className="mt-1 text-xs text-[#7a837d]">Yang dilahirkan</div>
              </div>
              <div className="pl-5">
                <div className="font-serif text-xl font-semibold text-[#14553a]">Khidmah</div>
                <div className="mt-1 text-xs text-[#7a837d]">Yang dijalankan</div>
              </div>
            </div>
          </div>

          <div className="relative min-h-[500px] border-l-0 border-[#ded9cd] lg:border-l">
            <div className="mahida-noise absolute inset-0 lg:left-8" />
            <div className="absolute inset-0 lg:left-8">
              <div className="absolute left-8 top-8 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c5d1cb]">
                Mahida / Digital Archive
              </div>
              <div className="absolute bottom-9 left-8 right-8 border-t border-white/25 pt-6 text-[#f4f1e8]">
                <div className="max-w-sm font-serif text-3xl leading-tight">
                  “Menjaga ilmu berarti memberi jalan agar ia terus dibaca.”
                </div>
                <div className="mt-7 grid grid-cols-2 gap-6 text-xs text-[#c8d2cc]">
                  <div>
                    <div className="uppercase tracking-[0.16em]">Ruang</div>
                    <div className="mt-1 text-white">Pesantren · Literasi · Arsip</div>
                  </div>
                  <div>
                    <div className="uppercase tracking-[0.16em]">Arah</div>
                    <div className="mt-1 text-white">Tradisi yang terus bergerak</div>
                  </div>
                </div>
              </div>
              <div className="absolute right-7 top-20 h-40 w-40 rounded-full border border-white/20" />
              <div className="absolute right-20 top-32 h-40 w-40 rounded-full border border-white/10" />
              <div className="absolute right-12 top-28 font-serif text-[150px] leading-none text-white/[0.055]">م</div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#ded9cd] bg-[#f5f1e7]">
        <div className="container grid gap-8 py-16 lg:grid-cols-[.8fr_1.2fr] lg:py-20">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7b837e]">Hari ini di Mahida</div>
            <h2 className="mt-4 max-w-md font-serif text-4xl font-semibold leading-tight tracking-[-0.03em] text-[#17271f] md:text-5xl">
              Bukan sekadar kabar. Ini jejak perjalanan.
            </h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-[#667069]">
              Dokumentasi kegiatan, gagasan, dan karya disusun sebagai arsip hidup—bukan sekadar unggahan yang lewat begitu saja.
            </p>
            <Link href="/kegiatan" className="mt-8 inline-flex border-b border-[#14553a] pb-1 text-sm font-semibold text-[#14553a]">
              Lihat seluruh kegiatan →
            </Link>
          </div>

          <div className="grid gap-px bg-[#d8d2c5] md:grid-cols-2">
            <article className="bg-[#fbfaf6] p-7 md:p-9">
              <div className="mb-12 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.16em] text-[#78817b]">
                <span>Berita utama</span>
                <span>01</span>
              </div>
              <div className="mb-6 aspect-[16/9] bg-[#dfe7e1] p-6">
                <div className="h-full border border-[#b7c8bc] bg-[linear-gradient(135deg,#e8eee9_0%,#cad8cf_100%)]" />
              </div>
              <h3 className="font-serif text-2xl font-semibold leading-snug text-[#1b2a22]">Ruang untuk kabar terbaru Mahida</h3>
              <p className="mt-3 text-sm leading-6 text-[#6c756f]">Konten utama nanti dapat diambil langsung dari database ketika artikel telah dipublikasikan.</p>
            </article>

            <article className="bg-[#fbfaf6] p-7 md:p-9">
              <div className="mb-12 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.16em] text-[#78817b]">
                <span>Catatan pilihan</span>
                <span>02</span>
              </div>
              <div className="border-t border-[#ded9cd] pt-6">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#a08250]">Literasi</div>
                <h3 className="mt-4 font-serif text-3xl font-semibold leading-tight text-[#1b2a22]">Tulisan yang tidak berhenti pada selesai dibaca</h3>
                <p className="mt-4 text-sm leading-7 text-[#6c756f]">Esai dan karya akan ditempatkan sebagai bagian dari percakapan ilmu yang terus berkembang.</p>
              </div>
              <div className="mt-10 border-t border-[#ded9cd] pt-5 text-xs text-[#838b86]">Editorial Mahida Digital</div>
            </article>
          </div>
        </div>
      </section>

      <section className="container py-20 lg:py-24">
        <div className="mb-12 flex flex-col justify-between gap-5 border-b border-[#ded9cd] pb-8 md:flex-row md:items-end">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7b837e]">Ruang utama</div>
            <h2 className="mt-3 font-serif text-4xl font-semibold tracking-[-0.03em] text-[#17271f] md:text-5xl">Satu ekosistem, banyak pintu masuk.</h2>
          </div>
          <p className="max-w-md text-sm leading-7 text-[#69726d]">Mahida Digital menyatukan bacaan, karya, maktabah, media, dan dokumentasi tanpa kehilangan identitas masing-masing.</p>
        </div>

        <div className="grid gap-0 border-y border-[#ded9cd] lg:grid-cols-3">
          {featureCards.map((item, index) => (
            <Link
              key={item.eyebrow}
              href={item.href}
              className={`group px-0 py-8 transition-colors hover:bg-[#f5f1e7] lg:px-8 lg:py-10 ${index > 0 ? "border-t border-[#ded9cd] lg:border-l lg:border-t-0" : ""}`}
            >
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7c857f]">
                <span>{item.eyebrow}</span>
                <span>0{index + 1}</span>
              </div>
              <h3 className="mt-10 font-serif text-2xl font-semibold leading-snug text-[#18271f] transition-colors group-hover:text-[#14553a]">{item.title}</h3>
              <p className="mt-4 text-sm leading-7 text-[#6a746e]">{item.body}</p>
              <div className="mt-8 text-sm font-semibold text-[#14553a]">Jelajahi →</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-[#153f2f] text-[#f7f3e8]">
        <div className="container grid gap-12 py-20 lg:grid-cols-[.72fr_1.28fr] lg:py-24">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#b8cabe]">Maktabah</div>
            <h2 className="mt-4 font-serif text-4xl font-semibold leading-tight tracking-[-0.03em] md:text-5xl">Khazanah yang disusun agar mudah kembali ditemukan.</h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-[#c4d0c8]">Kitab, terjemahan, dan kajian dikelompokkan sebagai ruang belajar yang hidup, bukan sekadar daftar file.</p>
            <Link href="/maktabah" className="mt-8 inline-flex border-b border-[#d3bd8f] pb-1 text-sm font-semibold text-[#f1dfb6]">
              Masuk ke Maktabah →
            </Link>
          </div>

          <div className="border-t border-white/20">
            {library.map(([title, subtitle], index) => (
              <Link key={title} href="/maktabah" className="group grid grid-cols-[42px_1fr_auto] items-center gap-4 border-b border-white/20 py-6">
                <span className="text-xs text-[#9eb2a5]">0{index + 1}</span>
                <span>
                  <span className="block font-serif text-2xl font-semibold transition-colors group-hover:text-[#f1dfb6]">{title}</span>
                  <span className="mt-1 block text-xs text-[#aebfb4]">{subtitle}</span>
                </span>
                <span className="text-[#d3bd8f]">↗</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-20 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="border border-[#ded9cd] bg-[#f5f1e7] p-8 md:p-10">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7b837e]">Media</div>
            <h2 className="mt-4 font-serif text-4xl font-semibold tracking-[-0.03em] text-[#17271f]">Mahida TV & dokumentasi visual</h2>
            <div className="mt-10 aspect-video bg-[#dce4de]">
              <div className="grid h-full place-items-center border border-[#c2d0c7] text-[#14553a]">
                <span className="grid h-16 w-16 place-items-center rounded-full border border-[#14553a] text-xl">▶</span>
              </div>
            </div>
            <Link href="/media" className="mt-7 inline-flex text-sm font-semibold text-[#14553a]">Lihat media →</Link>
          </div>

          <div className="border border-[#ded9cd] bg-[#fbfaf6] p-8 md:p-10">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7b837e]">Koperasi</div>
            <h2 className="mt-4 font-serif text-4xl font-semibold tracking-[-0.03em] text-[#17271f]">Kebutuhan belajar dalam satu pintu.</h2>
            <p className="mt-5 max-w-lg text-sm leading-7 text-[#69726d]">Katalog kitab, buku, ATK, dan kebutuhan pembelajaran dapat terhubung langsung dengan ekosistem Koperasi Mahida.</p>
            <div className="mt-10 grid grid-cols-2 border-y border-[#ded9cd] text-sm">
              {["Kitab", "Buku", "ATK", "Perlengkapan"].map((item, index) => (
                <div key={item} className={`py-5 ${index % 2 === 0 ? "pr-5" : "border-l border-[#ded9cd] pl-5"} ${index > 1 ? "border-t border-[#ded9cd]" : ""}`}>
                  <div className="font-serif text-xl font-semibold text-[#1a2b22]">{item}</div>
                  <div className="mt-1 text-xs text-[#7a837d]">Lihat katalog</div>
                </div>
              ))}
            </div>
            <Link href="/koperasi" className="mt-7 inline-flex text-sm font-semibold text-[#14553a]">Jelajahi koperasi →</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
