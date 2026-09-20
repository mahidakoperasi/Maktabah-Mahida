import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { and, asc, eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { galleries, galleryImages } from '@/db/schema';
import { formatShortDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

async function getGallery(slug: string) {
  const readiness = await db.execute(sql`select to_regclass('public.galleries') is not null and to_regclass('public.gallery_images') is not null as ready`);
  if (!Boolean((readiness.rows?.[0] as { ready?: boolean } | undefined)?.ready)) return null;
  const [gallery] = await db.select().from(galleries).where(and(eq(galleries.slug, slug), eq(galleries.type, 'album'), eq(galleries.status, 'published'))).limit(1);
  if (!gallery) return null;
  const images = await db.select().from(galleryImages).where(eq(galleryImages.galleryId, gallery.id)).orderBy(asc(galleryImages.sortOrder));
  return { ...gallery, images };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const gallery = await getGallery(slug);
  return gallery ? { title: gallery.title, description: gallery.description ?? `Galeri foto ${gallery.title}` } : { title: 'Galeri tidak ditemukan' };
}

export default async function GalleryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const gallery = await getGallery(slug);
  if (!gallery) notFound();

  return (
    <>
      <section className="bg-charcoal py-14 text-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Link href="/media/galeri" className="mb-5 inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={15} /> Semua Galeri</Link>
          <p className="label mb-3 text-brass-light">Dokumentasi Mahida</p>
          <h1 className="text-3xl font-serif font-bold md:text-4xl">{gallery.title}</h1>
          <p className="mt-3 text-sm text-white/55">{gallery.images.length} foto • {formatShortDate(gallery.createdAt)}</p>
          {gallery.description && <p className="mt-5 max-w-3xl leading-7 text-white/75">{gallery.description}</p>}
        </div>
      </section>
      <section className="bg-cream py-12">
        <div className="mx-auto columns-1 gap-4 px-4 sm:columns-2 sm:px-6 lg:max-w-7xl lg:columns-3 lg:px-8">
          {gallery.images.map((image, index) => (
            <figure key={image.id} className="mb-4 break-inside-avoid overflow-hidden border border-mahida-100 bg-white">
              <div className="aspect-[4/3] bg-mahida-100 bg-cover bg-center" style={{ backgroundImage: `url(${image.imageUrl})` }} role="img" aria-label={image.caption || `${gallery.title} — foto ${index + 1}`} />
              {image.caption && <figcaption className="px-4 py-3 text-sm leading-6 text-warm-gray-600">{image.caption}</figcaption>}
            </figure>
          ))}
          {gallery.images.length === 0 && <div className="border border-dashed border-warm-gray-300 bg-white p-8 text-sm text-warm-gray-500">Album ini belum memiliki foto.</div>}
        </div>
      </section>
    </>
  );
}
