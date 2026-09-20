import Link from 'next/link';
import { desc, eq, sql } from 'drizzle-orm';
import { Plus, Share2 } from 'lucide-react';
import { db } from '@/db';
import { socialPosts } from '@/db/schema';

export default async function AdminFacebookPage() {
  const readyResult = await db.execute(sql`select to_regclass('public.social_posts') is not null as ready`);
  const ready = Boolean((readyResult.rows?.[0] as { ready?: boolean } | undefined)?.ready);
  if (!ready) return <MigrationNotice />;
  const rows = await db.select().from(socialPosts).where(eq(socialPosts.platform, 'facebook')).orderBy(desc(socialPosts.publishedAt), desc(socialPosts.createdAt));
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div><p className="label mb-2">Media</p><h1 className="text-3xl font-serif font-bold text-charcoal">Facebook</h1><p className="mt-1 text-sm text-warm-gray-500">{rows.length} postingan tersimpan.</p></div>
        <Link href="/admin/media/facebook/new" className="btn-primary"><Plus size={16} /> Tambah Postingan</Link>
      </div>
      <div className="overflow-hidden border border-warm-gray-200 bg-white">
        {rows.length === 0 ? <div className="px-6 py-14 text-center"><Share2 size={34} className="mx-auto mb-3 text-warm-gray-300" /><h2 className="font-semibold text-charcoal">Belum ada postingan</h2><p className="mt-1 text-sm text-warm-gray-500">Tambahkan tautan konten Facebook Mahida yang sudah tersedia.</p></div> : (
          <div className="divide-y divide-warm-gray-100">
            {rows.map((post) => (
              <div key={post.id} className="grid gap-4 px-5 py-4 md:grid-cols-[80px_1fr_110px_90px] md:items-center">
                <div className="aspect-square bg-blue-50 bg-cover bg-center" style={post.imageUrl ? { backgroundImage: `url(${post.imageUrl})` } : undefined}>{!post.imageUrl && <span className="flex h-full items-center justify-center font-bold text-blue-600">f</span>}</div>
                <div className="min-w-0"><Link href={`/admin/media/facebook/${post.id}/edit`} className="line-clamp-2 font-semibold text-charcoal hover:text-emerald-forest">{post.caption || 'Postingan Facebook'}</Link><p className="mt-1 truncate text-xs text-warm-gray-400">{post.postUrl}</p>{post.featured && <span className="mt-2 inline-flex bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">Unggulan</span>}</div>
                <span className={`inline-flex w-fit px-2.5 py-1 text-xs font-semibold ${post.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-warm-gray-100 text-warm-gray-600'}`}>{post.status === 'published' ? 'Terbit' : 'Draft'}</span>
                <Link href={`/admin/media/facebook/${post.id}/edit`} className="text-sm font-semibold text-emerald-forest hover:underline md:text-right">Edit</Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MigrationNotice() { return <div className="space-y-6"><div><p className="label mb-2">Media</p><h1 className="text-3xl font-serif font-bold text-charcoal">Facebook</h1></div><div className="border border-amber-200 bg-amber-50 p-6 text-amber-900">Database Media belum diaktifkan. Jalankan migration <code>0003_media_cms.sql</code> di Neon.</div></div>; }
