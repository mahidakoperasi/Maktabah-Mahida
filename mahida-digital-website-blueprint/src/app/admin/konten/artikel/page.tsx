"use client";

import { useState } from "react";
import Link from "next/link";

export default function ArtikelAdmin() {
  const [articles, setArticles] = useState([
    {
      id: 1,
      title: "Judl Artikel Pertama",
      author: "Admin",
      status: "published",
      date: "2024-01-15",
      views: 234,
    },
    {
      id: 2,
      title: "Judul Artikel Kedua",
      author: "Admin",
      status: "draft",
      date: "2024-01-14",
      views: 0,
    },
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Artikel</h1>
          <p className="text-slate-400">Kelola semua artikel Mahida Digital</p>
        </div>
        <Link
          href="/admin/konten/artikel/baru"
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
        >
          ➕ Artikel Baru
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <input
          type="text"
          placeholder="Cari artikel..."
          className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:border-emerald-600 outline-none transition-colors"
        />
        <select className="px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:border-emerald-600 outline-none transition-colors">
          <option>Semua Status</option>
          <option>Published</option>
          <option>Draft</option>
          <option>Scheduled</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-900">
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Judul</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Penulis</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Status</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Tanggal</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Views</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((article) => (
              <tr
                key={article.id}
                className="border-b border-slate-700 hover:bg-slate-700 transition-colors"
              >
                <td className="px-6 py-4 text-sm text-white">{article.title}</td>
                <td className="px-6 py-4 text-sm text-slate-300">{article.author}</td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      article.status === "published"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : article.status === "draft"
                        ? "bg-slate-500/20 text-slate-300"
                        : "bg-blue-500/20 text-blue-400"
                    }`}
                  >
                    {article.status === "published"
                      ? "Published"
                      : article.status === "draft"
                      ? "Draft"
                      : "Scheduled"}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-400">{article.date}</td>
                <td className="px-6 py-4 text-sm text-slate-400">{article.views}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex gap-2 justify-end">
                    <button className="px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors">
                      Edit
                    </button>
                    <button className="px-3 py-1 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors">
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-center gap-2">
        <button className="px-3 py-1 bg-slate-800 text-slate-400 hover:text-white rounded transition-colors">
          ← Sebelumnya
        </button>
        <button className="px-3 py-1 bg-emerald-600 text-white rounded">1</button>
        <button className="px-3 py-1 bg-slate-800 text-slate-400 hover:text-white rounded transition-colors">
          2
        </button>
        <button className="px-3 py-1 bg-slate-800 text-slate-400 hover:text-white rounded transition-colors">
          Selanjutnya →
        </button>
      </div>
    </div>
  );
}
