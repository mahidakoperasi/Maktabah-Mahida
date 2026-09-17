"use client";

import { useState } from "react";
import Link from "next/link";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("profile");

  const tabs = [
    { id: "profile", label: "Profil", icon: "👤" },
    { id: "bookmarks", label: "Bookmark", icon: "🔖" },
    { id: "collections", label: "Koleksi", icon: "📚" },
    { id: "history", label: "Histori Baca", icon: "📜" },
  ];

  return (
    <div>
      {/* Header */}
      <section className="py-12 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="container">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-24 h-24 bg-emerald-200 dark:bg-emerald-900 rounded-full flex items-center justify-center text-3xl">
              👤
            </div>
            <div className="flex-1">
              <h1 className="font-serif text-3xl font-bold text-slate-900 dark:text-slate-50">
                Nama Pengguna
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                pengguna@email.com
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
                Bergabung sejak Januari 2024
              </p>
              <button className="mt-4 px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-50 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors text-sm">
                ⚙️ Edit Profil
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 bg-white dark:bg-slate-950">
        <div className="container">
          {/* Tabs */}
          <div className="flex gap-6 mb-8 border-b border-slate-200 dark:border-slate-800">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-b-2 border-emerald-700 text-emerald-700 dark:text-emerald-400"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50"
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="max-w-2xl space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  defaultValue="Nama Pengguna"
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  defaultValue="pengguna@email.com"
                  disabled
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-50 rounded-lg opacity-50 cursor-not-allowed"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Email tidak dapat diubah untuk menjaga keamanan akun
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Bio
                </label>
                <textarea
                  rows={4}
                  defaultValue="Tuliskan sedikit tentang diri Anda..."
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                ></textarea>
              </div>

              <div className="flex gap-3">
                <button className="px-6 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-medium transition-colors">
                  Simpan Perubahan
                </button>
                <button className="px-6 py-2 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-50 rounded-lg font-medium hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                  Batal
                </button>
              </div>
            </div>
          )}

          {/* Bookmarks Tab */}
          {activeTab === "bookmarks" && (
            <div className="space-y-4">
              <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors cursor-pointer group">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-serif font-bold text-slate-900 dark:text-slate-50 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                      Judul Artikel yang Dibookmark
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Penulis • 5 min read
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                      Disimpan 2 hari lalu
                    </p>
                  </div>
                  <button className="text-slate-400 hover:text-red-500 transition-colors">
                    ✕
                  </button>
                </div>
              </div>

              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-serif font-bold text-slate-900 dark:text-slate-50 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                        Artikel Bookmark Lainnya
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        Penulis • Kategori
                      </p>
                    </div>
                    <button className="text-slate-400 hover:text-red-500 transition-colors">
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Collections Tab */}
          {activeTab === "collections" && (
            <div className="space-y-4">
              <button className="w-full px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-medium transition-colors">
                ➕ Koleksi Baru
              </button>

              {[
                { name: "Baca Nanti", count: 12 },
                { name: "Nahwu", count: 8 },
                { name: "Favorit", count: 24 },
              ].map((col) => (
                <div
                  key={col.name}
                  className="p-6 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-serif font-bold text-slate-900 dark:text-slate-50">
                        {col.name}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {col.count} item
                      </p>
                    </div>
                    <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                      →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* History Tab */}
          {activeTab === "history" && (
            <div className="space-y-4">
              <div className="text-right mb-4">
                <button className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300">
                  Hapus Semua Histori
                </button>
              </div>

              {[
                {
                  title: "Artikel yang Terakhir Dibaca",
                  progress: 75,
                  lastRead: "1 jam lalu",
                },
                {
                  title: "Artikel Sebelumnya",
                  progress: 100,
                  lastRead: "2 hari lalu",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-serif font-bold text-slate-900 dark:text-slate-50 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                        Terakhir dibaca: {item.lastRead}
                      </p>
                    </div>
                    <button className="text-slate-400 hover:text-red-500 transition-colors">
                      ✕
                    </button>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600"
                      style={{ width: `${item.progress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                    {item.progress}% selesai
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
