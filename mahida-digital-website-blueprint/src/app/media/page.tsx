import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ExternalLink, Image as ImageIcon, Play } from 'lucide-react';
import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { galleries, galleryImages, socialPosts, videos } from '@/db/schema';
import { formatShortDate } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Media',
  description: 'Mahida TV, video dokumentasi, galeri foto, dan konten media dari Pondok Pesantren Mahida.',
};

export const dynamic = 'force-dynamic';

async function getMediaContent() {
  const readiness = await db.execute(sql`
    select
      to_regclass('public.videos') is not null as videos_ready,
      to_regclass('public.social_posts') is not null as social_ready,
      to_regclass('public.galleries') is not null as galleries_ready,
      to_regclass('public.gallery_images') is not null as images_ready
  `);
  const ready = readiness.rows?.[0] as {
    videos_ready?: boolean;
    social_ready?: boolean;
    galleries_ready?: boolean;
    images_ready?: boolean;
  } | undefined;

  const videoRows = ready?.videos_ready
    ? await db.select().from(videos).where(eq(videos.status, 'published')).orderBy(desc(videos.featured), desc(videos.publishedAt), desc(videos.createdAt)).limit(4)
    : [];
  const socialRows = ready?.social_ready
    ? await db.select().from(socialPosts).where(and(eq(socialPosts.platform, 'facebook'), eq(socialPosts.status, 'published'))).orderBy(desc(socialPosts.featured), desc(socialPosts.publishedAt), desc(socialPosts.createdAt)).limit(4)
    : [];
  const galleryRows = ready?.galleries_ready && ready?.images_ready
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
        .limit(5)
    : [];

  return { videoRows, socialRows, galleryRows };
}

export default async function MediaPage() {
  const { videoRows, socialRows, galleryRows } = await getMediaContent();
  const featuredVideo = videoRows[0];
  const otherVideos = videoRows.slice(1);

  return (
    <>
      <section className="bg-charcoal py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="label mb-3 text-brass-light">Media</p>
          <h1 className="mb-2 text-3xl font-serif font-bold md:text-4xl">Media & Dokumentasi</h1>
          <p className="text-white/70">Mahida TV, video, galeri foto, dan publikasi media.</p>
        </div>
      </section>

      <section className="border-b border-mahida-200 bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="heading-xl flex items-center gap-3 text-charcoal"><span>Mahida TV</span><Play size={20} className="text-emerald-forest" /></h2>
              <p className="mt-1 text-sm text-warm-gray-500">Video terbaru dari kanal Mahida</p>
            </div>
          </div>

          {!featuredVideo ? (
            <MediaEmpty icon={<Play size={28} />} title="Video segera hadir" text="Konten YouTube terbit akan tampil otomatis di bagian ini." />
          ) : (
            <div className="grid gap-6 lg:grid-cols-12">
              <Link href={`https://www.youtube.com/watch?v=${featuredVideo.videoId}`} target="_blank" rel="noreferrer" className="group lg:col-span-7">
                <div className="relative aspect-video overflow-hidden rounded-sm bg-charcoal bg-cover bg-center" style={featuredVideo.thumbnailUrl ? { backgroundImage: `url(${featuredVideo.thumbnailUrl})` } : undefined}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 shadow-elevated transition-transform group-hover:scale-110"><Play size={24} className="ml-1 text-emerald-forest" fill="currentColor" /></div>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    {featuredVideo.featured && <span className="mb-2 inline-flex bg-brass px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-charcoal">Video unggulan</span>}
                    <h3 className="text-lg font-semibold text-white">{featuredVideo.title}</h3>
                    {featuredVideo.description && <p className="mt-1 line-clamp-2 text-sm text-white/70">{featuredVideo.description}</p>}
                    <span className="mt-2 block text-xs text-white/50">{formatShortDate(featuredVideo.publishedAt ?? featuredVideo.createdAt)}</span>
                  </div>
                </div>
              </Link>

              <div className="space-y-4 lg:col-span-5">
                {otherVideos.map((video) => (
                  <Link key={video.id} href={`https://www.youtube.com/watch?v=${video.videoId}`} target="_blank" rel="noreferrer" className="group -mx-3 flex gap-4 rounded-sm p-3 transition-colors hover:bg-mahida-50">
                    <div className="relative aspect-video w-36 shrink-0 overflow-hidden rounded-sm bg-mahida-100 bg-cover bg-center" style={video.thumbnailUrl ? { backgroundImage: `url(${video.thumbnailUrl})` } : undefined}>
                      <div className="absolute inset-0 flex items-center justify-center bg-black/10"><Play size={18} className="text-white drop-shadow" fill="currentColor" /></div>
                    </div>
                    <div className="min-w-0 flex-1 py-1"><h4 className="line-clamp-2 text-sm font-medium text-charcoal transition-colors group-hover:text-emerald-forest">{video.title}</h4><span className="mt-2 block text-xs text-warm-gray-400">{formatShortDate(video.publishedAt ?? video.createdAt)}</span></div>
                  </Link>
                ))}
                {otherVideos.length === 0 && <div className="flex min-h-36 items-center justify-center border border-dashed border-warm-gray-200 p-6 text-center text-sm text-warm-gray-400">Video berikutnya akan tampil di sini.</div>}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="border-b border-mahida-200 bg-cream py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between">
            <div><h2 className="heading-xl flex items-center gap-3 text-charcoal"><ImageIcon size={20} className="text-emerald-forest" /> Galeri Foto</h2><p className="mt-1 text-sm text-warm-gray-500">Dokumentasi visual kehidupan Mahida</p></div>
            {galleryRows.length > 0 && <Link href="/media/galeri" className="hidden items-center gap-2 text-sm font-semibold text-emerald-forest hover:underline md:flex">Lihat Semua Galeri <ArrowRight size={15} /></Link>}
          </div>
          {galleryRows.length === 0 ? (
            <MediaEmpty icon={<ImageIcon size={28} />} title="Galeri segera hadir" text="Album yang diterbitkan melalui Admin akan tampil otomatis di sini." />
          ) : (
            <div className="grid auto-rows-[180px] grid-cols-2 gap-3 md:grid-cols-4">
              {galleryRows.map((gallery, index) => (
                <article key={gallery.id} className={`group relative overflow-hidden rounded-sm bg-mahida-200 bg-cover bg-center ${index === 0 ? 'row-span-2 md:col-span-2' : index === 3 ? 'md:col-span-2' : ''}`} style={gallery.coverImage ? { backgroundImage: `url(${gallery.coverImage})` } : undefined}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent transition-colors group-hover:from-black/90" />
                  <div className="absolute inset-x-0 bottom-0 p-4 text-white"><h3 className="font-serif font-semibold">{gallery.title}</h3><p className="mt-1 text-xs text-white/65">{gallery.imageCount} foto</p></div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8"><h2 className="heading-xl flex items-center gap-3 text-charcoal"><span className="text-2xl font-bold text-blue-600">f</span> Postingan Facebook</h2><p className="mt-1 text-sm text-warm-gray-500">Kabar terbaru dari halaman Facebook Mahida</p></div>
          {socialRows.length === 0 ? (
            <MediaEmpty icon={<span className="text-2xl font-bold text-blue-600">f</span>} title="Postingan segera hadir" text="Postingan Facebook terbit akan tampil otomatis di bagian ini." />
          ) : (
            <div className="grid max-w-5xl gap-5 md:grid-cols-2">
              {socialRows.map((post) => (
                <Link key={post.id} href={post.postUrl} target="_blank" rel="noreferrer" className="group overflow-hidden border border-mahida-100 bg-mahida-50 transition-shadow hover:shadow-card">
                  {post.imageUrl && <div className="aspect-[16/8] bg-cover bg-center" style={{ backgroundImage: `url(${post.imageUrl})` }} />}
                  <div className="p-5">
                    <div className="mb-3 flex items-center gap-2"><span className="font-bold text-blue-600">f</span><span className="text-xs font-medium uppercase tracking-wide text-warm-gray-500">Facebook</span><span className="text-xs text-warm-gray-400">• {formatShortDate(post.publishedAt ?? post.createdAt)}</span>{post.featured && <span className="ml-auto bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">Unggulan</span>}</div>
                    <p className="line-clamp-4 text-sm leading-relaxed text-charcoal">{post.caption}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-emerald-forest">Lihat postingan asli <ExternalLink size={12} /></span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function MediaEmpty({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="border border-dashed border-warm-gray-300 bg-white/60 px-6 py-12 text-center"><div className="mx-auto mb-3 flex justify-center text-warm-gray-300">{icon}</div><h3 className="font-semibold text-charcoal">{title}</h3><p className="mt-1 text-sm text-warm-gray-500">{text}</p></div>;
}
