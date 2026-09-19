import { Metadata } from 'next';
import Link from 'next/link';
import { desc, eq, sql } from 'drizzle-orm';
import { FileText, Clock, Users, CheckCircle2, Plus } from 'lucide-react';
import { db } from '@/db';
import { posts } from '@/db/schema';

export const metadata: Metadata = {
  title: 'Admin Dashboard | Mahida Digital',
};

function numberFromRow(value: unknown) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value) || 0;
  return 0;
}

export default async function AdminDashboard() {
  const readiness = await db.execute(sql`
    select
      to_regclass('public.users') is not null as users_ready,
      to_regclass('public.posts') is not null as posts_ready
  `);

  const readyRow = readiness.rows?.[0] as
    | { users_ready?: boolean; posts_ready?: boolean }
    | undefined;

  const usersReady = Boolean(readyRow?.users_ready);
  const postsReady = Boolean(readyRow?.posts_ready);

  let totalUsers = 0;
  let totalArticles = 0;
  let draftArticles = 0;
  let publishedArticles = 0;

  if (usersReady) {
    const result = await db.execute(sql`select count(*)::int as count from users`);
    totalUsers = numberFromRow((result.rows?.[0] as { count?: unknown } | undefined)?.count);
  }

  if (postsReady) {
    const result = await db.execute(sql`
      select
        count(*) filter (where type = 'article')::int as total_articles,
        count(*) filter (where type = 'article' and status = 'draft')::int as draft_articles,
        count(*) filter (where type = 'article' and status = 'published')::int as published_articles
      from posts
    `);
    const row = result.rows?.[0] as
      | { total_articles?: unknown; draft_articles?: unknown; published_articles?: unknown }
      | undefined;
    totalArticles = numberFromRow(row?.total_articles);
    draftArticles = numberFromRow(row?.draft_articles);
    publishedArticles = numberFromRow(row?.published_articles);
  }

  const recentArticles = postsReady
    ? await db
        .select({
          id: posts.id,
          title: posts.title,
          status: posts.status,
          updatedAt: posts.updatedAt,
        })
        .from(posts)
        .where(eq(posts.type, 'article'))
        .orderBy(desc(posts.updatedAt))
        .limit(6)
    : [];

  const stats = [
    { label: 'Total Artikel', value: totalArticles, icon: FileText },
    { label: 'Draft', value: draftArticles, icon: Clock },
    { label: 'Sudah Terbit', value: publishedArticles, icon: CheckCircle2 },
    { label: 'Total Pengguna', value: totalUsers, icon: Users },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-charcoal">Dashboard</h1>
          <p className="text-sm text-warm-gray-500 mt-1">Data aktual Mahida Digital dari database.</p>
        </div>
        <Link href="/admin/konten/artikel/new" className="btn-primary">
          <Plus size={16} />
          Artikel Baru
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-sm border border-warm-gray-200">
            <stat.icon size={20} className="text-warm-gray-400 mb-4" />
            <p className="text-2xl font-serif font-bold text-charcoal">{stat.value.toLocaleString('id-ID')}</p>
            <p className="text-xs text-warm-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {!postsReady && (
        <div className="border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          Database Artikel belum diaktifkan. Setelah migration CMS Artikel dijalankan, statistik artikel akan otomatis memakai data nyata.
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <section className="bg-white rounded-sm border border-warm-gray-200">
          <div className="p-5 border-b border-warm-gray-200 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-charcoal">Artikel Terbaru</h2>
              <p className="text-xs text-warm-gray-400 mt-1">Bukan data contoh — langsung dari database.</p>
            </div>
            <Link href="/admin/konten/artikel" className="text-sm text-emerald-forest hover:underline">Kelola Artikel</Link>
          </div>
          {recentArticles.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-warm-gray-500">
              Belum ada artikel. Artikel pertama yang Anda buat akan muncul di sini.
            </div>
          ) : (
            <div className="divide-y divide-warm-gray-100">
              {recentArticles.map((item) => (
                <div key={item.id} className="p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/admin/konten/artikel/${item.id}/edit`}
                      className="font-medium text-sm text-charcoal hover:text-emerald-forest line-clamp-1"
                    >
                      {item.title}
                    </Link>
                    <p className="text-xs text-warm-gray-400 mt-1">
                      {item.updatedAt
                        ? new Date(item.updatedAt).toLocaleString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </p>
                  </div>
                  <span className={item.status === 'published' ? 'bg-emerald-50 text-emerald-700 px-2.5 py-1 text-xs font-semibold' : 'bg-warm-gray-100 text-warm-gray-600 px-2.5 py-1 text-xs font-semibold'}>
                    {item.status === 'published' ? 'Terbit' : 'Draft'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-5">
          <div className="bg-white rounded-sm border border-warm-gray-200 p-5">
            <h2 className="font-semibold text-charcoal mb-4">Akses Cepat</h2>
            <div className="space-y-2">
              <Link href="/admin/konten/artikel/new" className="flex items-center justify-between bg-mahida-50 p-3 text-sm font-medium text-charcoal hover:bg-mahida-100">
                <span>Buat Artikel Baru</span>
                <span>→</span>
              </Link>
              <Link href="/admin/konten/artikel" className="flex items-center justify-between bg-mahida-50 p-3 text-sm font-medium text-charcoal hover:bg-mahida-100">
                <span>Kelola Artikel</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-sm border border-warm-gray-200 p-5">
            <h2 className="font-semibold text-charcoal mb-2">Modul Lain</h2>
            <p className="text-sm leading-relaxed text-warm-gray-500">
              Berita, Karya, Maktabah, Media, Agenda, dan Koperasi belum dihitung di dashboard sampai CMS masing-masing diaktifkan.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
