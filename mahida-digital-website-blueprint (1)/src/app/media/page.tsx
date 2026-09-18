import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Play, Image as ImageIcon } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Media',
  description: 'Mahida TV, video dokumentasi, galeri foto, dan konten media dari Pondok Pesantren Mahida.',
};

const videoCategories = [
  'Kajian', 'Dokumentasi', 'Pendidikan', 'Wawancara', 'Kegiatan', 'Karya', 'Short Video'
];

const videos = [
  {
    id: 1,
    title: 'Dokumentasi Kehidupan Santri Mahida 2026',
    description: 'Suasana keseharian santri dalam belajar, beraktivitas, dan beribadah di pondok.',
    thumbnail: null,
    duration: '12:34',
    views: '1.2K',
    date: '3 hari lalu',
    category: 'Dokumentasi',
    featured: true,
  },
  {
    id: 2,
    title: 'Kajian Kitab Tauhid Bersama Ustadz Pengasuh',
    description: 'Pengajian rutin kitab tauhid yang dihadiri seluruh santri.',
    thumbnail: null,
    duration: '45:21',
    views: '856',
    date: '1 minggu lalu',
    category: 'Kajian',
    featured: false,
  },
  {
    id: 3,
    title: 'Wisuda Tahfidz Angkatan Ke-V',
    description: 'Prosesi wisuda dan penyerahan sertifikat kepada santri hafidz/hafidzah baru.',
    thumbnail: null,
    duration: '8:45',
    views: '2.3K',
    date: '2 minggu lalu',
    category: 'Kegiatan',
    featured: false,
  },
  {
    id: 4,
    title: 'Wawancara: Kehidupan Santri Baru',
    description: 'Cerita pengalaman santri baru dalam memulai kehidupan di pesantren.',
    thumbnail: null,
    duration: '15:10',
    views: '567',
    date: '2 minggu lalu',
    category: 'Wawancara',
    featured: false,
  },
];

const socialPosts = [
  { platform: 'facebook', caption: 'Maulid Nabi 1447 H — Semoga kita bisa meneladani akhlak Rasulullah SAW.', time: '3 hari lalu' },
  { platform: 'facebook', caption: 'Selamat kepada para juara MTQ tingkat kabupaten. Semoga ilmu yang diraih bermanfaat.', time: '1 minggu lalu' },
];

export default function MediaPage() {
  return (
    <>
      <section className="bg-charcoal text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="label text-brass-light mb-3">Media</p>
          <h1 className="text-3xl md:text-4xl font-serif font-bold mb-2">Media & Dokumentasi</h1>
          <p className="text-white/70">Mahida TV, video, galeri foto, dan publikasi media.</p>
        </div>
      </section>

      {/* MAHIDA TV - Main Section */}
      <section className="py-16 bg-white border-b border-mahida-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="heading-xl text-charcoal flex items-center gap-3">
                <span>Mahida TV</span>
                <Play size={20} className="text-emerald-forest" />
              </h2>
              <p className="text-sm text-warm-gray-500 mt-1">Video editorial dari Mahida</p>
            </div>
            <Link href="/media/tv" className="hidden md:flex items-center gap-2 text-sm font-semibold text-emerald-forest hover:underline">
              Semua Video
              <ArrowRight size={15} />
            </Link>
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap gap-2 mb-8">
            {videoCategories.map((cat) => (
              <button key={cat} className="category-pill cursor-pointer hover:bg-emerald-100">{cat}</button>
            ))}
          </div>

          {/* Featured Video + Grid */}
          <div className="grid lg:grid-cols-12 gap-6">
            {/* Main / Featured Video */}
            {videos[0] && (
              <div className="lg:col-span-7 group cursor-pointer">
                <div className="aspect-video bg-charcoal rounded-sm overflow-hidden relative">
                  <div className="absolute inset-0 flex items-center justify-center bg-emerald-forest/10">
                    <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-elevated group-hover:scale-110 transition-transform">
                      <Play size={24} className="text-emerald-forest ml-1" fill="currentColor" />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/80 to-transparent">
                    <h3 className="font-semibold text-white text-lg">{videos[0].title}</h3>
                    <p className="text-white/70 text-sm mt-1">{videos[0].description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-white/50">
                      <span>{videos[0].duration}</span>
                      <span>{videos[0].views} views</span>
                      <span>{videos[0].date}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Video List */}
            <div className="lg:col-span-5 space-y-4">
              {videos.slice(1).map((video) => (
                <Link key={video.id} href={`/media/video/${video.id}`} className="group flex gap-4 p-3 -mx-3 rounded-sm hover:bg-mahida-50 transition-colors">
                  <div className="flex-shrink-0 w-36 aspect-video bg-mahida-100 rounded-sm overflow-hidden relative">
                    <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 rounded-sm">{video.duration}</div>
                    <div className="w-full h-full flex items-center justify-center">
                      <Play size={14} className="text-mahida-400" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 py-1">
                    <span className="tag-pill text-[10px]">{video.category}</span>
                    <h4 className="font-medium text-sm text-charcoal group-hover:text-emerald-forest transition-colors line-clamp-2 mt-1">
                      {video.title}
                    </h4>
                    <span className="text-xs text-warm-gray-400 mt-1 block">{video.views} • {video.date}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Galeri Preview */}
      <section className="py-16 bg-cream border-b border-mahida-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="heading-xl text-charcoal flex items-center gap-3">
                <ImageIcon size={20} className="text-emerald-forest" />
                Galeri Foto
              </h2>
              <p className="text-sm text-warm-gray-500 mt-1">Dokumentasi visual kehidupan Mahida</p>
            </div>
            <Link href="/media/galeri" className="hidden md:flex items-center gap-2 text-sm font-semibold text-emerald-forest hover:underline">
              Lihat Semua Galeri
              <ArrowRight size={15} />
            </Link>
          </div>

          {/* Asymmetric Grid */}
          <div className="grid grid-cols-4 grid-rows-2 gap-2 auto-rows-[180px] max-w-4xl">
            <div className="col-span-2 row-span-2 bg-mahida-200 rounded-sm overflow-hidden group cursor-pointer relative">
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-mahida-200 to-mahida-300">
                <p className="text-mahida-700 font-serif text-base text-center px-4">Kehidupan<br/>Sehari-hari</p>
              </div>
            </div>
            <div className="bg-mahida-150 rounded-sm overflow-hidden group cursor-pointer">
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-forest/15 to-emerald-forest/5">
                <p className="text-emerald-forest/60 text-xs text-center px-2">Kajian</p>
              </div>
            </div>
            <div className="bg-mahida-180 rounded-sm overflow-hidden group cursor-pointer">
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brass/20 to-brass/5">
                <p className="text-brass-muted text-xs text-center px-2">Upacara</p>
              </div>
            </div>
            <div className="col-span-2 bg-mahida-160 rounded-sm overflow-hidden group cursor-pointer">
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-warm-gray-300 to-warm-gray-200">
                <p className="text-warm-gray-600 text-xs text-center">Santri Belajar</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Posts */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="heading-xl text-charcoal flex items-center gap-3">
                <span className="text-2xl">f</span>
                Postingan Sosial
              </h2>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5 max-w-3xl">
            {socialPosts.map((post, i) => (
              <div key={i} className="p-5 bg-mahida-50 rounded-sm border-l-2 border-blue-500">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-blue-600 font-bold">f</span>
                  <span className="text-xs font-medium text-warm-gray-500 uppercase tracking-wide">Facebook</span>
                  <span className="text-xs text-warm-gray-400">• {post.time}</span>
                </div>
                <p className="text-sm text-charcoal leading-relaxed">{post.caption}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
