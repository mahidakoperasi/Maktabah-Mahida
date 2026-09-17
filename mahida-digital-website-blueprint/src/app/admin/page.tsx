export default function AdminDashboard() {
  const stats = [
    { label: "Total Pengguna", value: "1,234", icon: "👥", trend: "+12%" },
    { label: "Total Artikel", value: "456", icon: "📝", trend: "+8%" },
    { label: "Total Karya", value: "892", icon: "🎨", trend: "+23%" },
    { label: "Total Views", value: "45.2K", icon: "👁️", trend: "+34%" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-slate-400">Selamat datang kembali, Admin</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-slate-600 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-400">{stat.label}</h3>
              <span className="text-2xl">{stat.icon}</span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-bold text-white">{stat.value}</div>
              <span className="text-sm font-medium text-emerald-400">{stat.trend}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Latest Articles */}
        <div className="lg:col-span-2 bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-lg font-bold text-white mb-4">Artikel Terbaru</h2>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-slate-900 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <div>
                  <h4 className="font-medium text-white">Judul Artikel Terbaru</h4>
                  <p className="text-sm text-slate-400">oleh Admin • 2 jam lalu</p>
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-emerald-500 text-white rounded">
                  Published
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-lg font-bold text-white mb-4">Tindakan Cepat</h2>
          <div className="space-y-3">
            <a
              href="/admin/konten/artikel"
              className="flex items-center gap-3 p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
            >
              <span>➕</span>
              <span className="text-sm font-medium">Artikel Baru</span>
            </a>
            <a
              href="/admin/media/galeri"
              className="flex items-center gap-3 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <span>🖼️</span>
              <span className="text-sm font-medium">Upload Media</span>
            </a>
            <a
              href="/admin/pengguna"
              className="flex items-center gap-3 p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <span>👥</span>
              <span className="text-sm font-medium">Kelola Pengguna</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
