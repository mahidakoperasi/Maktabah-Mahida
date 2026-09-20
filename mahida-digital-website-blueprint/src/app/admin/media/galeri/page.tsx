import Link from 'next/link';
import { desc, eq, sql } from 'drizzle-orm';
import { Images, Plus } from 'lucide-react';
import { db } from '@/db';
import { galleries, galleryImages } from '@/db/schema';

export default async function AdminGalleryPage() {
  const readyResult = await db.execute(sql`select to_regclass('public.galleries') is not null and to_regclass('public.gallery_images') is not null as ready`);
  const ready = Boolean((readyResult.rows?.[0] as { ready?: boolean } | undefined)?.ready);
  if (!ready) return <MigrationNotice />;
  const rows = await db.select({ id: galleries.id, title: galleries.title, slug: galleries.slug, description: galleries.description, coverImage: galleries.coverImage, status: galleries.status, createdAt: galleries.createdAt, imageCount: sql<number>`count(${galleryImages.id})::int` }).from(galleries).leftJoin(galleryImages, eq(galleryImages.galleryId, galleries.id)).where(eq(galleries.type, 'album')).groupBy(galleries.id).orderBy(desc(galleries.createdAt));
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div><p className="label mb-2">Media</p><h1 className="text-3xl font-serif font-bold text-charcoal">Galeri</h1><p className="mt-1 text-sm text-warm-gray-500">{rows.length} album tersimpan.</p></div>
        <Link href="/admin/media/galeri/new" className="btn-primary"><Plus size={16} /> Tambah Galeri</Link>
      </div>
      <div className="overflow-hidden border border-warm-gray-200 bg-white">
        {rows.length === 0 ? <div className="px-6 py-14 text-center"><Images size={34} className="mx-auto mb-3 text-warm-gray-300" /><h2 className="font-semibold text-charcoal">Belum ada galeri</h2><p className="mt-1 text-sm text-warm-gray-500">Buat album pertama dari dokumentasi Mahida yang sudah ada.</p></div> : (
          <div className="divide-y divide-warm-gray-100">
            {rows.map((gallery) => (
              <div key={gallery.id} className="grid gap-4 px-5 py-4 md:grid-cols-[112px_1fr_100px_110px_90px] md:items-center">
                <div className="aspect-[4/3] bg-mahida-100 bg-cover bg-center" style={gallery.coverImage ? { backgroundImage: `url(${gallery.coverImage})` } : undefined} />
                <div className="min-w-0"><Link href={`/admin/media/galeri/${gallery.id}/edit`} className="font-semibold text-charcoal hover:text-emerald-forest">{gallery.title}</Link><p className="mt-1 line-clamp-1 text-sm text-warm-gray-500">{gallery.description || `/${gallery.slug}`}</p></div>
                <span className="text-sm text-warm-gray-500">{gallery.imageCount} foto</span>
                <span className={`inline-flex w-fit px-2.5 py-1 text-xs font-semibold ${gallery.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-warm-gray-100 text-warm-gray-600'}`}>{gallery.status === 'published' ? 'Terbit' : 'Draft'}</span>
                <Link href={`/admin/media/galeri/${gallery.id}/edit`} className="text-sm font-semibold text-emerald-forest hover:underline md:text-right">Edit</Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MigrationNotice() { return <div className="space-y-6"><div><p className="label mb-2">Media</p><h1 className="text-3xl font-serif font-bold text-charcoal">Galeri</h1></div><div className="border border-amber-200 bg-amber-50 p-6 text-amber-900">Database Media belum diaktifkan. Jalankan migration <code>0003_media_cms.sql</code> di Neon.</div></div>; }
