import Link from 'next/link';
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { FileText, Plus, Search } from 'lucide-react';
import { db } from '@/db';
import { posts } from '@/db/schema';

export default async function AdminArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? '').trim();
  const status = (params.status ?? '').trim();

  const readyResult = await db.execute(sql\`
    select to_regclass('public.posts') is not null as ready
  \`);
  const ready = Boolean((readyResult.rows?.[0] as { ready?: boolean } | undefined)?.ready);

  if (!ready) {
    return (
      <div className="space-y-6">
        <div>
          <p className="label mb-2">Konten</p>
          <h1 className="text-3xl font-serif font-bold text-charcoal">Artikel</h1>
        </div>
        <div className="border border-amber-200 bg-amber-50 p-6 text-amber-900">
          Database Artikel belum diaktifkan. Jalankan migration CMS Artikel di Neon terlebih dahulu.
        </div>
      </div>
    );
  }

  const conditions = [eq(posts.type, 'article')];

  if (status === 'draft' || status === 'published' || status === 'scheduled' || status === 'archived') {
    conditions.push(eq(posts.status, status));
  }

  if (q) {
    const search = or(
      ilike(posts.title, \`%\${q}%\`),
      ilike(posts.slug, \`%\${q}%\`),
      ilike(posts.excerpt, \`%\${q}%\`)
    );
    if (search) conditions.push(search);
  }

  const articles = await db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      excerpt: posts.excerpt,
      status: posts.status,
      publishedAt: posts.publishedAt,
      updatedAt: posts.updatedAt,
      viewCount: posts.viewCount,
    })
    .from(posts)
    .where(and(...conditions))
    .orderBy(desc(posts.updatedAt));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="label mb-2">Konten</p>
          <h1 className="text-3xl font-serif font-bold text-charcoal">Artikel</h1>
          <p className="mt-1 text-sm text-warm-gray-500">
            {articles.length} artikel sesuai filter saat ini.
          </p>
        </div>
        <Link href="/admin/konten/artikel/new" className="btn-primary">
          <Plus size={16} />
          Tambah Artikel
        </Link>
      </div>

      <form className="grid gap-3 bg-white border border-warm-gray-200 p-4 md:grid-cols-[1fr_200px_auto]">
        <div className="relative">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray-400" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Cari judul, slug, ringkasan..."
            className="w-full border border-warm-gray-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-emerald-forest"
          />
        </div>
        <select
          name="status"
          defaultValue={status}
          className="border border-warm-gray-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-forest"
        >
          <option value="">Semua status</option>
          <option value="draft">Draft</option>
          <option value="published">Terbit</option>
          <option value="archived">Arsip</option>
        </select>
        <button className="btn-secondary justify-center" type="submit">Filter</button>
      </form>

      <div className="overflow-hidden bg-white border border-warm-gray-200">
        {articles.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <FileText size={34} className="mx-auto mb-3 text-warm-gray-300" />
            <h2 className="font-semibold text-charcoal">Belum ada artikel</h2>
            <p className="mt-1 text-sm text-warm-gray-500">
              Buat artikel pertama Mahida Digital dari tombol Tambah Artikel.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-warm-gray-100">
            {articles.map((article) => (
              <div key={article.id} className="grid gap-4 px-5 py-4 md:grid-cols-[1fr_110px_120px_90px] md:items-center">
                <div className="min-w-0">
                  <Link
                    href={\`/admin/konten/artikel/\${article.id}/edit\`}
                    className="font-semibold text-charcoal hover:text-emerald-forest"
                  >
                    {article.title}
                  </Link>
                  <p className="mt-1 truncate text-xs text-warm-gray-400">/{article.slug}</p>
                  {article.excerpt && (
                    <p className="mt-1 line-clamp-1 text-sm text-warm-gray-500">{article.excerpt}</p>
                  )}
                </div>
                <div>
                  <span className={\`inline-flex px-2.5 py-1 text-xs font-semibold \${
                    article.status === 'published'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-warm-gray-100 text-warm-gray-600'
                  }\`}>
                    {article.status === 'published' ? 'Terbit' : 'Draft'}
                  </span>
                </div>
                <div className="text-xs text-warm-gray-500">
                  {article.updatedAt
                    ? new Date(article.updatedAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—'}
                </div>
                <div className="flex md:justify-end">
                  <Link
                    href={\`/admin/konten/artikel/\${article.id}/edit\`}
                    className="text-sm font-semibold text-emerald-forest hover:underline"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
