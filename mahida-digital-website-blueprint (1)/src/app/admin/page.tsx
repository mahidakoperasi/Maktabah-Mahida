import { Metadata } from 'next';
import Link from 'next/link';
import { FileText, PenTool, Newspaper, Video, Users, Eye, TrendingUp, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Admin Dashboard | Mahida Digital',
};

const stats = [
  { label: 'Total Konten', value: '1,247', icon: FileText, change: '+12' },
  { label: 'Draft', value: '18', icon: Clock, change: '-3' },
  { label: 'Total Pengguna', value: '342', icon: Users, change: '+28' },
  { label: 'Views Bulan Ini', value: '45.2K', icon: Eye, change: '+15%' },
];

const recentContent = [
  { type: 'Artikel', title: 'Tradisi Keilmuan Pesantren di Era Digital', status: 'published', date: '2 jam lalu', author: 'Ahmad F.' },
  { type: 'Berita', title: 'Kajian Kitab Al-Ajurumiyah Dimulai', status: 'published', date: '5 jam lalu', author: 'Admin' },
  { type: 'Karya', title: 'Terjemahan Matan Al-Bayquniyyah', status: 'draft', date: '1 hari lalu', author: 'Ust. Ibrahim' },
  { type: 'Video', title: 'Dokumentasi Kehidupan Santri 2026', status: 'published', date: '3 hari lalu', author: 'Media Team' },
  { type: 'Esai', title: 'Membaca Antara Garis: Santri dan Dunia Modern', status: 'review', date: '4 hari lalu', author: 'Fatimah A.' },
];

const quickActions = [
  { label: 'Buat Artikel Baru', href: '/admin/konten/artikel/new', icon: FileText },
  { label: 'Buat Berita', href: '/admin/konten/berita/new', icon: Newspaper },
  { label: 'Tambah Video', href: '/admin/media/youtube/new', icon: Video },
  { label: 'Upload Galeri', href: '/admin/media/galeri/new', icon: PenTool },
];

const upcomingEvents = [
  { title: 'Haflah Akhirussanah Genap', date: '27 Jan 2026', type: 'Akademik' },
  { title: 'Maulid Nabi 1447 H', date: '01 Feb 2026', type: 'Perayaan' },
  { title: 'Dauroh Kitab Intensif', date: '15 Feb 2026', type: 'Kajian' },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-charcoal">Dashboard</h1>
        <p className="text-sm text-warm-gray-500 mt-1">Ringkasan situasi Mahida Digital</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-sm border border-warm-gray-200">
            <div className="flex items-center justify-between mb-3">
              <stat.icon size={20} className="text-warm-gray-400" />
              <span className={`text-xs font-medium px-2 py-0.5 rounded-sm ${stat.change.startsWith('+') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {stat.change}
              </span>
            </div>
            <p className="text-2xl font-serif font-bold text-charcoal">{stat.value}</p>
            <p className="text-xs text-warm-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Content */}
        <div className="lg:col-span-2 bg-white rounded-sm border border-warm-gray-200">
          <div className="p-5 border-b border-warm-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-charcoal">Konten Terbaru</h2>
            <Link href="/admin/konten/artikel" className="text-sm text-emerald-forest hover:underline">Lihat Semua</Link>
          </div>
          <div className="divide-y divide-warm-gray-100">
            {recentContent.map((item, i) => (
              <div key={i} className="p-4 flex items-start gap-4 hover:bg-mahida-50/30 transition-colors">
                <span className={`category-pill text-[10px] py-px mt-0.5 flex-shrink-0 ${
                  item.type === 'Berita' ? 'bg-red-50 text-red-700' :
                  item.type === 'Video' ? 'bg-purple-50 text-purple-700' :
                  item.type === 'Karya' || item.type === 'Esai' ? 'bg-emerald-50 text-emerald-800' :
                  'bg-blue-50 text-blue-700'
                }`}>
                  {item.type}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm text-charcoal line-clamp-1">{item.title}</h3>
                  <p className="text-xs text-warm-gray-500 mt-0.5">{item.author} • {item.date}</p>
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-sm flex-shrink-0 ${
                  item.status === 'published' ? 'bg-green-50 text-green-700' :
                  item.status === 'draft' ? 'bg-warm-gray-100 text-warm-gray-600' :
                  'bg-yellow-50 text-yellow-700'
                }`}>
                  {item.status === 'published' ? 'Terbit' : item.status === 'draft' ? 'Draft' : 'Review'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-sm border border-warm-gray-200 p-5">
            <h2 className="font-semibold text-charcoal mb-4">Cepat</h2>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-2 p-3 bg-mahida-50 hover:bg-mahida-100 rounded-sm transition-colors"
                >
                  <action.icon size={16} className="text-emerald-600" />
                  <span className="text-xs font-medium text-charcoal">{action.label.split(' ').slice(1).join(' ')}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white rounded-sm border border-warm-gray-200 p-5">
            <h2 className="font-semibold text-charcoal mb-4">Agenda Mendatang</h2>
            <div className="space-y-3">
              {upcomingEvents.map((event, i) => (
                <div key={i} className="flex gap-3">
                  <div className="text-right flex-shrink-0 w-14">
                    <span className="text-lg font-serif font-bold text-emerald-forest">{event.date.split(' ')[0]}</span>
                    <span className="block text-[10px] text-warm-gray-500 uppercase">{event.date.split(' ')[1]} {event.date.split(' ')[2]}</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-charcoal line-clamp-2">{event.title}</h4>
                    <span className="tag-pill text-[10px] mt-0.5 inline-block">{event.type}</span>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/admin/kegiatan/agenda" className="text-sm text-emerald-400 hover:text-emerald-600 mt-4 inline-block">
              Kelola Agenda →
            </Link>
          </div>

          {/* Popular Content */}
          <div className="bg-white rounded-sm border border-warm-gray-200 p-5">
            <h2 className="font-semibold text-charcoal mb-4 flex items-center gap-2">
              <TrendingUp size={16} />
              Populer Minggu Ini
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-sm text-warm-gray-600">
              <li><span className="text-charcoal font-medium">Wisuda Tahfidz Angkatan V</span></li>
              <li><span className="text-charcoal font-medium">Profil Pondok Mahida</span></li>
              <li><span className="text-charcoal font-medium">Maulid Nabi 1447 H</span></li>
              <li><span className="text-charcoal font-medium">Katalog Koperasi</span></li>
              <li><span className="text-charcoal font-medium">Panduan Kirim Karya</span></li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
