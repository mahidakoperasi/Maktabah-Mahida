import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Images } from 'lucide-react';
import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { galleries, galleryImages } from '@/db/schema';
import { formatShortDate } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Galeri Foto',
  description: 'Arsip dokumentasi foto kegiatan dan kehidupan Pondok Pesantren Mahida.',
};

export const dynamic = 'force-dynamic';

export default async function GalleryArchivePage() {
  const readiness = await db.execute(sql`select to_regclass('public.galleries') is not null and to_regclass('public.gallery_images') is not null as ready`);
  const ready = Boolean((readiness.rows?.[0] as { ready?: boolean } | undefined)?.ready);
  const rows = ready
    ? await db.select({
        id: galleries.id,
        title: galleries.title,
        slug: galleries.slug,
        description: galleries.description,
        coverImage: galleries.coverImage,
        createdAt: galleries.createdAt,
        imageCount: sql<number>`count(${galleryImages.id})::int`,
      }).from(galleries)
        .leftJoin(galleryImages, eq(galleryImages.galleryId, galleries.id))
        .where(and(eq(galleries.type, 'album'), eq(galleries.status, 'published')))
        .groupBy(galleries.id)
        .orderBy(desc(galleries.createdAt))
    : [];

  return (
    <>
      <section className="bg-charcoal py-14 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><p className="label mb-3 text-brass-light">Media</p><h1 className="text-3xl font-serif font-bold md:text-4xl">Galeri Foto</h1><p className="mt-2 text-white/65">Arsip visual kegiatan dan kehidupan Mahida.</p></div>
      </section>
      <section className="bg-cream py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {rows.length === 0 ? (
            <div className="border border-dashed border-warm-gray-300 bg-white px-6 py-14 text-center"><Images size={34} className="mx-auto mb-3 text-warm-gray-300" /><h2 className="font-semibold text-charcoal">Belum ada album terbit</h2><p className="mt-1 text-sm text-warm-gray-500">Dokumentasi Mahida akan segera tersedia.</p></div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map((gallery) => (
                <Link key={gallery.id} href={`/media/galeri/${gallery.slug}`} className="group overflow-hidden border border-mahida-100 bg-white shadow-sm transition-shadow hover:shadow-card">
                  <div className="aspect-[4/3] bg-mahida-100 bg-cover bg-center transition-transform duration-500 group-hover:scale-[1.02]" style={gallery.coverImage ? { backgroundImage: `url(${gallery.coverImage})` } : undefined} />
                  <div className="p-5"><div className="mb-2 flex items-center justify-between gap-3 text-xs text-warm-gray-400"><span>{gallery.imageCount} foto</span><span>{formatShortDate(gallery.createdAt)}</span></div><h2 className="font-serif text-xl font-semibold text-charcoal transition-colors group-hover:text-emerald-forest">{gallery.title}</h2>{gallery.description && <p className="mt-2 line-clamp-2 text-sm leading-6 text-warm-gray-500">{gallery.description}</p>}<span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-emerald-forest">Buka album <ArrowRight size={13} /></span></div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
