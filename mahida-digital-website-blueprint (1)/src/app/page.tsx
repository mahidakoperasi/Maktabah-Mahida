import Link from 'next/link';
import { ArrowRight, BookOpen, PenTool, Calendar, Play, Eye } from 'lucide-react';

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background with gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-forest via-emerald-rich to-charcoal" />
        
        {/* Subtle pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="max-w-3xl">
            {/* Tagline */}
            <p className="label text-white/60 mb-6 tracking-[0.15em]">Belajar • Berkarya • Berkhidmah</p>
            
            {/* Main Headline */}
            <h1 className="text-white text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-serif font-bold leading-[1.08] mb-8">
              Mengenal,<br />
              Membaca, Menjaga<br />
              <span className="text-brass-light">Mahida.</span>
            </h1>
            
            {/* Subheadline */}
            <p className="text-lg md:text-xl text-white/75 leading-relaxed max-w-xl mb-10">
              Satu ruang untuk ilmu, karya, dan kehidupan pesantren. 
              Temukan kitab, terjemahan, esai, dokumentasi, dan perjalanan Mahida di sini.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4">
              <Link href="/literasi" className="bg-white text-emerald-forest px-6 py-3 font-semibold text-sm hover:bg-cream transition-colors flex items-center gap-2">
                Mulai Membaca
                <ArrowRight size={16} />
              </Link>
              <Link href="/tentang/profil" className="border border-white/30 text-white px-6 py-3 font-medium text-sm hover:bg-white/10 transition-colors flex items-center gap-2">
                Jelajahi Mahida
              </Link>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:block">
            <div className="w-5 h-8 rounded-full border-2 border-white/30 flex justify-center pt-1.5">
              <div className="w-1 h-2 bg-white/50 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </section>

      {/* MAHIDA TODAY Section */}
      <section className="py-16 bg-mahida-50 border-b border-mahida-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1.5 h-6 bg-brass rounded-full" />
            <h2 className="heading-lg font-serif text-charcoal">Hari Ini di Mahida</h2>
            <span className="text-xs text-warm-gray-400 ml-2">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { type: 'Berita', title: 'Kajian Kitab Sarf Al-Galayaini Dimulai', time: '2 jam lalu', link: '/berita' },
              { type: 'Agenda', title: 'Istighotsah Malam Jumat Kliwon', time: '19:00 WIB', link: '/agenda' },
              { type: 'Karya', title: 'Terjemahan Matan Al-Ajrūmiyah Selesai', time: 'Baru', link: '/karya/terjemahan' },
              { type: 'Video', title: 'Dokumentasi Upacara Hari Santri', time: 'Kemarin', link: '/media/video' },
            ].map((item, i) => (
              <Link key={i} href={item.link} className="group bg-white p-5 border border-mahida-150 hover:border-mahida-300 hover:shadow-elevated transition-all duration-250">
                <span className={`category-pill mb-3 ${item.type === 'Berita' ? 'bg-red-50 text-red-700' : item.type === 'Agenda' ? 'bg-blue-50 text-blue-700' : item.type === 'Karya' ? 'bg-emerald-50 text-emerald-800' : 'bg-purple-50 text-purple-700'}`}>
                  {item.type}
                </span>
                <h3 className="font-semibold text-charcoal group-hover:text-emerald-forest transition-colors line-clamp-2 mt-3">
                  {item.title}
                </h3>
                <span className="text-xs text-warm-gray-500 mt-2 block">{item.time}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* TENTANG MAHIDA Teaser */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-16 items-center">
            <div className="lg:col-span-5 order-2 lg:order-1">
              <div className="aspect-[4/5] bg-gradient-to-br from-mahida-100 to-mahida-200 rounded-sm overflow-hidden relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-emerald-forest/10 flex items-center justify-center">
                      <span className="font-arabic text-3xl text-emerald-forest">مَنْبَعُ الْهِدَايَةِ</span>
                    </div>
                    <p className="text-sm text-warm-gray-500 italic">&quot;Sumber Petunjuk&quot;</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-7 order-1 lg:order-2">
              <p className="label mb-3">Tentang Mahida</p>
              <h2 className="display-md text-charcoal mb-6">
                Pondok Pesantren yang<br />Membaca Tradisi dan Zaman
              </h2>
              <p className="body-lg text-warm-gray-600 mb-6 leading-relaxed">
                Mahida adalah pondok pesantren yang menggabungkan khazanah keilmuan klasik dengan semangat pembelajaran kontemporer. Di sini, santri tidak hanya mempelajari kitab kuning, tetapi juga menerjemahkan, menulis, berkarya, dan berkhidmah untuk masyarakat.
              </p>
              <div className="flex flex-wrap gap-6 mb-8">
                <div>
                  <span className="text-3xl font-serif font-bold text-emerald-forest">15+</span>
                  <p className="text-sm text-warm-gray-500">Tahun Mengabdi</p>
                </div>
                <div>
                  <span className="text-3xl font-serif font-bold text-emerald-forest">300+</span>
                  <p className="text-sm text-warm-gray-500">Santri Aktif</p>
                </div>
                <div>
                  <span className="text-3xl font-serif font-bold text-emerald-forest">1000+</span>
                  <p className="text-sm text-warm-gray-500">Alumni</p>
                </div>
              </div>
              <Link href="/tentang/profil" className="btn-primary">
                Mengenal Mahida
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* BERITA UTAMA - Editorial Layout */}
      <section className="py-20 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="label mb-2">Terkini</p>
              <h2 className="display-md text-charcoal">Berita & Kegiatan</h2>
            </div>
            <Link href="/berita" className="hidden md:flex items-center gap-2 text-sm font-semibold text-emerald-forest hover:underline">
              Semua Berita
              <ArrowRight size={15} />
            </Link>
          </div>

          {/* Editorial Layout - Not identical cards */}
          <div className="grid lg:grid-cols-12 gap-6 lg:gap-8">
            {/* Main Featured News */}
            <article className="lg:col-span-7 group">
              <Link href="/berita/contoh" className="block">
                <div className="aspect-[16/10] bg-gradient-to-br from-mahida-200 to-mahida-300 overflow-hidden relative mb-4">
                  <div className="absolute inset-0 flex items-center justify-center bg-emerald-forest/80">
                    <Eye size={48} className="text-white/40" />
                  </div>
                  <span className="absolute top-4 left-4 category-pill bg-white text-emerald-forest">Utama</span>
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl md:text-2xl font-serif font-bold text-charcoal group-hover:text-emerald-forest transition-colors leading-tight">
                    Kajian Kitab Al-Ajurumiyah Dimulai Musim Baru
                  </h3>
                  <p className="text-warm-gray-600 line-clamp-3">
                    Pembelajaran nahwu sebagai fondasi utama dalam memahami bahasa Arab secara mendalam dimulai kembali dengan antusiasme tinggi dari seluruh santri baru maupun senior.
                  </p>
                  <div className="flex items-center gap-4 text-sm text-warm-gray-500">
                    <span>15 Januari 2026</span>
                    <span>•</span>
                    <span>5 min baca</span>
                  </div>
                </div>
              </Link>
            </article>

            {/* Secondary News */}
            <div className="lg:col-span-5 space-y-6">
              {[
                {
                  title: 'Pengasuh: Ilmu Tanpa Adab Bukan Ilmu',
                  date: '14 Jan',
                  cat: 'Gagasan'
                },
                {
                  title: 'Santri Mahida Raih Juara MTQ Tingkat Kabupaten',
                  date: '13 Jan',
                  cat: 'Prestasi'
                },
                {
                  title: 'Peringatan Maulid Nabi 1447 H Bersama Warga',
                  date: '12 Jan',
                  cat: 'Kegiatan'
                }
              ].map((news, i) => (
                <Link key={i} href="/berita/contoh" className="group flex gap-4 pb-6 border-b border-warm-gray-200 last:border-0 last:pb-0">
                  <div className="flex-shrink-0 w-20 h-20 bg-mahida-100 rounded-sm overflow-hidden">
                    <div className="w-full h-full flex items-center justify-center bg-emerald-forest/5">
                      <BookOpen size={18} className="text-emerald-forest/30" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="category-pill text-[0.65rem] py-0.5">{news.cat}</span>
                    <h4 className="font-semibold text-charcoal group-hover:text-emerald-forest transition-colors mt-1.5 line-clamp-2">
                      {news.title}
                    </h4>
                    <span className="text-xs text-warm-gray-400 mt-1 block">{news.date}</span>
                  </div>
                </Link>
              ))}

              <Link href="/berita" className="md:hidden inline-flex items-center gap-2 text-sm font-semibold text-emerald-forest mt-4">
                Lihat Semua Berita →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* LITERASI - Bacaan Pilihan */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="label mb-2">Literasi</p>
              <h2 className="display-md text-charcoal">Bacaan Pilihan</h2>
            </div>
            <Link href="/literasi" className="hidden md:flex items-center gap-2 text-sm font-semibold text-emerald-forest hover:underline">
              Jelajahi Literasi
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                excerpt: 'Bagaimana sebuah tradisi keilmuan bertahan berabad-abad di pulau Jawa? Jejak pesantren tidak hanya ada dalam bangunan, tapi dalam cara membaca, menghafal, dan merenungkan ilmu.',
                category: 'Refleksi',
                title: 'Tradisi Keilmuan Pesantren di Era Digital',
                readTime: '8 min'
              },
              {
                excerpt: 'Membaca matan bukan sekadar melafalkan kata, tetapi masuk ke dalam cakrawala pemikiran seorang imam yang telah merintis jalan sebelum kita.',
                category: 'Esai',
                title: 'Membaca Matan: Lebih dari Sekadar Memoriter',
                readTime: '6 min'
              },
              {
                excerpt: 'Bahasa Arab di pesantren diajarkan dengan metode yang berbeda dari kursus formal. Ada pendekatan, ritual, dan budaya membaca yang unik.',
                category: 'Pendidikan',
                title: 'Metode Pengajaran Bahasa Arab Ala Pesantren',
                readTime: '10 min'
              }
            ].map((article, i) => (
              <article key={i} className="group">
                <Link href="/literasi/artikel/contoh">
                  <div className="aspect-[3/2] bg-mahida-100 rounded-sm overflow-hidden mb-4">
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-mahida-50 to-mahida-200">
                      <PenTool size={28} className="text-mahida-400" />
                    </div>
                  </div>
                  <span className="category-pill">{article.category}</span>
                  <h3 className="font-serif font-bold text-lg text-charcoal mt-3 group-hover:text-emerald-forest transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-warm-gray-600 text-sm mt-2 line-clamp-3">{article.excerpt}</p>
                  <span className="text-xs text-warm-gray-400 mt-3 block">{article.readTime} baca</span>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* KARYA - Lahir dari Mahida */}
      <section className="py-20 bg-charcoal text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <p className="label text-brass-light mb-3">Karya Mahida</p>
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
              Lahir dari Mahida
            </h2>
            <p className="text-warm-gray-400 text-lg leading-relaxed">
              Gagasan yang ditulis, ilmu yang diterjemahkan, tradisi yang dirawat, 
              dan kreativitas yang tumbuh dari Mahida.
            </p>
          </div>

          {/* Karya Categories Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Esai & Gagasan', slug: 'esai', icon: '✎', count: 24 },
              { name: 'Terjemahan', slug: 'terjemahan', icon: '⇄', count: 12 },
              { name: 'Sastra', slug: 'sastra', icon: '❋', count: 18 },
              { name: 'Media Kreatif', slug: 'media-kreatif', icon: '◈', count: 31 },
            ].map((cat) => (
              <Link
                key={cat.slug}
                href={`/karya/${cat.slug}`}
                className="group p-6 border border-white/10 hover:border-brass-light hover:bg-white/[0.02] transition-all duration-300"
              >
                <span className="text-2xl mb-3 block text-brass-light/70 group-hover:text-brass-light transition-colors">{cat.icon}</span>
                <h3 className="font-semibold text-base mb-1 group-hover:text-brass-light transition-colors">{cat.name}</h3>
                <p className="text-sm text-warm-gray-500">{cat.count} karya</p>
              </Link>
            ))}
          </div>

          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Falak & Sains', slug: 'falak', icon: '☽', count: 7 },
              { name: 'Riset & Kajian', slug: 'riset', icon: '◉', count: 9 },
              { name: 'Budaya & Tradisi', slug: 'budaya', icon: '☘', count: 15 },
              { name: 'Fotografi', slug: 'fotografi', icon: '▣', count: 42 },
            ].map((cat) => (
              <Link
                key={cat.slug}
                href={`/karya/${cat.slug}`}
                className="group p-6 border border-white/10 hover:border-brass-light hover:bg-white/[0.02] transition-all duration-300"
              >
                <span className="text-2xl mb-3 block text-brass-light/70 group-hover:text-brass-light transition-colors">{cat.icon}</span>
                <h3 className="font-semibold text-base mb-1 group-hover:text-brass-light transition-colors">{cat.name}</h3>
                <p className="text-sm text-warm-gray-500">{cat.count} karya</p>
              </Link>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link href="/karya" className="btn-secondary border-white/30 text-white hover:bg-white hover:text-charcoal">
              Jelajahi Semua Karya
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* MAKTABAH Section */}
      <section className="py-20 bg-parchment">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="label mb-2 text-warm-gray-500">Maktabah</p>
              <h2 className="display-md text-charcoal">Ruang Ilmu</h2>
              <p className="mt-2 text-warm-gray-600 max-w-xl">Kitab-kitab yang dipelajari, diterjemahkan, dan dijelaskan di Mahida.</p>
            </div>
            <Link href="/maktabah" className="hidden md:flex items-center gap-2 text-sm font-semibold text-emerald-forest hover:underline">
              Jelajahi Maktabah
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {['Nahwu', 'Sharaf', 'Fiqh', 'Tafsir', 'Hadits', 'Aqidah'].map((discipline) => (
              <Link
                key={discipline}
                href={`/maktabah/${discipline.toLowerCase()}`}
                className="group p-5 bg-white border border-mahida-150 hover:border-emerald-forest hover:shadow-card transition-all text-center"
              >
                <BookOpen size={22} className="mx-auto mb-3 text-warm-gray-400 group-hover:text-emerald-forest transition-colors" />
                <h3 className="font-semibold text-sm text-charcoal group-hover:text-emerald-forest transition-colors">
                  {discipline}
                </h3>
              </Link>
            ))}
          </div>

          {/* Featured Books Row */}
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { title: 'Al-Ajurumiyah', author: 'Ibn Ajrum', cover: 'Nahwu' },
              { title: 'Matn Al-Bayquniyyah', author: 'Al-Bayquni', cover: 'Hadits' },
              { title: 'Matn Ummul Barahin', author: 'Al-Sanusi', cover: 'Aqidah' },
              { title: 'Sarf al-Galayaini', author: 'Mustafa Al-Galayaini', cover: 'Sharaf' },
            ].map((book, i) => (
              <Link key={i} href={`/maktabah/kitab/${book.title.toLowerCase().replace(/\s+/g, '-')}`} className="group">
                <div className="aspect-[3/4] bg-gradient-to-br from-mahida-100 to-mahida-200 rounded-sm shadow-elevated overflow-hidden mb-3 flex items-center justify-center">
                  <div className="text-center p-4">
                    <BookOpen size={28} className="mx-auto mb-2 text-emerald-forest/30" />
                    <p className="text-[10px] uppercase tracking-wider text-warm-gray-500">{book.cover}</p>
                  </div>
                </div>
                <h4 className="font-semibold text-sm text-charcoal group-hover:text-emerald-forest transition-colors line-clamp-1">{book.title}</h4>
                <p className="text-xs text-warm-gray-500 mt-0.5">{book.author}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* MAHIDA TV Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="label mb-2">Media</p>
              <h2 className="display-md text-charcoal">Mahida TV</h2>
            </div>
            <Link href="/media/tv" className="hidden md:flex items-center gap-2 text-sm font-semibold text-emerald-forest hover:underline">
              Semua Video
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="grid lg:grid-cols-12 gap-6">
            {/* Main Video */}
            <div className="lg:col-span-7 group cursor-pointer">
              <div className="aspect-video bg-charcoal rounded-sm overflow-hidden relative">
                <div className="absolute inset-0 flex items-center justify-center bg-emerald-forest/10">
                  <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-elevated group-hover:scale-110 transition-transform">
                    <Play size={24} className="text-emerald-forest ml-1" fill="currentColor" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/80 to-transparent">
                  <h3 className="font-semibold text-white text-lg">Dokumentasi Kehidupan Santri Mahida 2026</h3>
                  <p className="text-white/70 text-sm mt-1">Mahida Digital • 1.2K views</p>
                </div>
              </div>
            </div>

            {/* Video List */}
            <div className="lg:col-span-5 space-y-4">
              {[
                { title: 'Pembukaan Tahun Ajaran Baru 2026', time: '12:34', views: '856' },
                { title: 'Kajian Kitab Tauhid Bersama Ustadz', time: '45:21', views: '1.2K' },
                { title: 'Wisuda Tahfidz Angkatan ke-V', time: '8:45', views: '2.3K' },
              ].map((video, i) => (
                <Link key={i} href="/media/video/contoh" className="group flex gap-4 p-3 -mx-3 rounded-sm hover:bg-mahida-50 transition-colors">
                  <div className="flex-shrink-0 w-36 aspect-video bg-mahida-100 rounded-sm overflow-hidden relative">
                    <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 rounded-sm">{video.time}</div>
                    <div className="w-full h-full flex items-center justify-center">
                      <Play size={14} className="text-mahida-400" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 py-1">
                    <h4 className="font-medium text-sm text-charcoal group-hover:text-emerald-forest transition-colors line-clamp-2">{video.title}</h4>
                    <span className="text-xs text-warm-gray-400 mt-1 block">{video.views} • 3 hari lalu</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* AGENDA Section */}
      <section className="py-16 bg-mahida-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="label mb-2">Jadwal</p>
              <h2 className="heading-xl text-charcoal">Agenda Mendatang</h2>
            </div>
            <Link href="/agenda" className="hidden md:flex items-center gap-2 text-sm font-semibold text-emerald-forest hover:underline">
              Semua Agenda
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { day: '27', month: 'JAN', title: 'Haflah Akhirussanah Genap 2025/2026', type: 'Akademik' },
              { day: '01', month: 'FEB', title: 'Maulid Nabi Muhammad SAW', type: 'Perayaan' },
              { day: '15', month: 'FEB', title: 'Dauroh Kitab Intensif', type: 'Kajian' },
            ].map((event, i) => (
              <Link key={i} href="/agenda" className="group bg-white p-6 border-l-2 border-emerald-forest hover:shadow-card transition-shadow">
                <div className="flex gap-5">
                  <div className="text-center flex-shrink-0">
                    <span className="text-3xl font-serif font-bold text-emerald-forest">{event.day}</span>
                    <span className="block text-xs font-semibold tracking-wider text-warm-gray-500 mt-0.5">{event.month}</span>
                  </div>
                  <div>
                    <span className="category-pill text-[0.65rem]">{event.type}</span>
                    <h3 className="font-semibold text-charcoal mt-2 group-hover:text-emerald-forest transition-colors">
                      {event.title}
                    </h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* KOPERASI Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="label mb-2">Ekosistem</p>
              <h2 className="display-md text-charcoal">Koperasi Mahida</h2>
              <p className="mt-2 text-warm-gray-600 max-w-xl">Kitab, perlengkapan, dan kebutuhan santri.</p>
            </div>
            <Link href="/koperasi" className="hidden md:flex items-center gap-2 text-sm font-semibold text-emerald-forest hover:underline">
              Jelajahi Toko
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
            {[
              { name: 'Kitab', desc: 'Kitab kuning & pegangan' },
              { name: 'Buku', desc: 'Buku umum & referensi' },
              { name: 'ATK', desc: 'Alat tulis & kantor' },
              { name: 'Perlengkapan', desc: 'Kebutuhan santri' },
              { name: 'Paket Madrasah', desc: 'Paket lengkap' },
            ].map((product, i) => (
              <Link
                key={i}
                href="/koperasi"
                className="group p-5 bg-cream border border-mahida-150 hover:border-emerald-forest text-center transition-all"
              >
                <div className="w-12 h-12 mx-auto mb-3 bg-white rounded-sm shadow-elevated flex items-center justify-center">
                  <BookOpen size={20} className="text-emerald-forest/60" />
                </div>
                <h3 className="font-semibold text-sm text-charcoal group-hover:text-emerald-forest transition-colors">{product.name}</h3>
                <p className="text-xs text-warm-gray-500 mt-1">{product.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* GALERI Preview */}
      <section className="py-20 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="label mb-2">Dokumentasi</p>
              <h2 className="display-md text-charcoal">Galeri Foto</h2>
            </div>
            <Link href="/media/galeri" className="hidden md:flex items-center gap-2 text-sm font-semibold text-emerald-forest hover:underline">
              Semua Galeri
              <ArrowRight size={15} />
            </Link>
          </div>

          {/* Asymmetric Image Grid */}
          <div className="grid grid-cols-4 grid-rows-2 gap-2 auto-rows-[200px]">
            <div className="col-span-2 row-span-2 bg-mahida-200 rounded-sm overflow-hidden group cursor-pointer">
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-mahida-200 to-mahida-300">
                <p className="text-mahida-700 font-serif text-lg text-center px-6">Kehidupan Pondok</p>
              </div>
            </div>
            <div className="col-span-1 row-span-1 bg-mahida-150 rounded-sm overflow-hidden group cursor-pointer">
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-forest/20 to-emerald-forest/10">
                <p className="text-emerald-forest/60 text-xs text-center">Kajian</p>
              </div>
            </div>
            <div className="col-span-1 row-span-1 bg-mahida-180 rounded-sm overflow-hidden group cursor-pointer">
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brass/20 to-brass/10">
                <p className="text-brass-muted text-xs text-center">Upacara</p>
              </div>
            </div>
            <div className="col-span-2 row-span-1 bg-mahida-160 rounded-sm overflow-hidden group cursor-pointer">
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-warm-gray-300 to-warm-gray-200">
                <p className="text-warm-gray-600 text-xs text-center">Santri Belajar</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA / Kirim Karya */}
      <section className="py-20 bg-emerald-forest text-white relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-5"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}
        />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="label text-brass-light mb-4">Untuk Penulis</p>
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
            Punya Karya untuk Mahida?
          </h2>
          <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto">
            Kami menerima esai, terjemahan, sastra, riset, dan karya kreatif lainnya. 
            Kirimkan karyamu dan jadi bagian dari Mahida Digital.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/kirim-karya" className="bg-white text-emerald-forest px-8 py-3.5 font-semibold hover:bg-cream transition-colors flex items-center gap-2">
              <PenTool size={17} />
              Panduan Kirim Karya
            </Link>
            <a href="mailto:karya@mahida.co.id" className="border border-white/30 text-white px-8 py-3.5 font-medium hover:bg-white/10 transition-colors">
              Kirim via Email
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
