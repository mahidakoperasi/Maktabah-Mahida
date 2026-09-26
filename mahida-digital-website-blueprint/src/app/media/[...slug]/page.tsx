import Link from 'next/link';
import { notFound } from 'next/navigation';
import { and, asc, desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { galleries, galleryImages, videos } from '@/db/schema';
import { getPublicPage } from '@/lib/cms';
import { driveIdFromUrl } from '@/lib/media-links';
import { getYoutubeViews } from '@/lib/youtube';
import { PublicContentList, PublicContentDetail } from '@/components/PublicContent';
import CmsPage from '@/components/CmsPage';
import { getCommerceSettings } from '@/lib/commerce';

export const dynamic = 'force-dynamic';
export default async function MediaSection({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  if (slug.length < 1 || slug.length > 4) notFound();
  if (slug[0] === 'berita' || slug[0] === 'kegiatan' || slug[0] === 'pengumuman') {
    if (slug.length > 2) notFound();
    return slug.length === 1 ? <PublicContentList section={slug[0]} /> : <PublicContentDetail section={slug[0]} slug={slug[1]} />;
  }
  const kind = slug[0] === 'tv' ? 'video' : slug[0];
  if (kind !== 'video' && kind !== 'galeri') return <CmsPage path={`/media/${slug.join('/')}`} />;
  if (slug.length > 2) notFound();
  const path = `/media/${kind}`;
  const page = await getPublicPage(path);
  if (!page) notFound();
  if (kind === 'video') {
    if (slug.length === 2) {
      const [video] = await db.select().from(videos).where(and(eq(videos.slug, slug[1]),eq(videos.status,'published'))).limit(1);
      if (!video) notFound();
      const views = await getYoutubeViews(video.youtubeId);
      const channel = (await getCommerceSettings()).youtubeChannelUrl;
      return <div className="min-h-screen bg-cream"><div className="mx-auto max-w-5xl px-4 py-12 sm:px-6"><Link href={path} className="text-sm text-emerald-forest">← Semua video</Link><h1 className="display-md mt-5">{video.title}</h1><div className="mt-8 aspect-video overflow-hidden bg-black"><iframe className="h-full w-full" src={`https://www.youtube.com/embed/${video.youtubeId}`} title={video.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /></div>{video.description && <p className="mt-6 text-warm-gray-600">{video.description}</p>}<div className="mt-6 flex flex-wrap items-center gap-4">{views !== null && <span className="text-sm">{views.toLocaleString('id-ID')} penayangan di YouTube</span>}<a target="_blank" rel="noopener noreferrer" className="btn-primary" href={`https://www.youtube.com/watch?v=${video.youtubeId}`}>Tonton di YouTube ↗</a>{channel && <a href={channel} target="_blank" rel="noopener noreferrer" className="rounded border border-emerald-forest px-4 py-2 text-sm font-semibold text-emerald-forest">Lihat kanal YouTube Mahida ↗</a>}</div></div></div>;
    }
    const rows = await db.select().from(videos).where(eq(videos.status,'published')).orderBy(asc(videos.sortOrder),desc(videos.createdAt));
    return <div className="min-h-screen bg-cream"><header className="bg-emerald-forest py-14 text-white"><div className="mx-auto max-w-5xl px-4"><h1 className="display-md text-white">{page.title}</h1>{page.intro && <p className="mt-3">{page.intro}</p>}</div></header><div className="mx-auto grid max-w-5xl gap-5 px-4 py-12 sm:grid-cols-2">{rows.length ? rows.map((video) => <Link href={`${path}/${video.slug}`} key={video.id} className="overflow-hidden border border-mahida-200 bg-white"><div className="relative aspect-video bg-black"><img src={`https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`} alt="" className="h-full w-full object-cover" /><span className="absolute bottom-3 right-3 rounded bg-emerald-forest px-3 py-2 text-xs font-semibold text-white">Tonton →</span></div><div className="p-5"><h2 className="font-serif text-xl font-bold">{video.title}</h2>{video.description && <p className="mt-2 line-clamp-2 text-sm text-warm-gray-600">{video.description}</p>}</div></Link>) : <p className="empty-state sm:col-span-2">Belum ada video terbit.</p>}</div></div>;
  }
  if (slug.length === 2) {
    const [album] = await db.select().from(galleries).where(and(eq(galleries.slug,slug[1]),eq(galleries.status,'published'))).limit(1);
    if (!album) notFound();
    const photos = await db.select().from(galleryImages).where(eq(galleryImages.galleryId,album.id)).orderBy(asc(galleryImages.sortOrder));
    return <div className="min-h-screen bg-cream"><header className="bg-emerald-forest py-14 text-white"><div className="mx-auto max-w-5xl px-4"><h1 className="display-md text-white">{album.title}</h1>{album.description && <p className="mt-3 text-white/80">{album.description}</p>}</div></header><div className="mx-auto grid max-w-5xl gap-5 px-4 py-12 sm:grid-cols-2">{photos.length ? photos.map((photo) => { const id = driveIdFromUrl(photo.imageUrl); return <figure key={photo.id} className="border bg-white p-3"><iframe loading="lazy" title={photo.caption || album.title} src={`https://drive.google.com/file/d/${id}/preview`} className="aspect-square w-full" /><figcaption className="mt-3 text-sm text-warm-gray-600">{photo.caption} <a href={photo.imageUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-forest">Lihat di Drive ↗</a></figcaption></figure>; }) : <p className="empty-state sm:col-span-2">Belum ada foto dalam galeri ini.</p>}</div></div>;
  }
  const rows = await db.select().from(galleries).where(eq(galleries.status,'published')).orderBy(desc(galleries.createdAt));
  return <div className="min-h-screen bg-cream"><header className="bg-emerald-forest py-14 text-white"><div className="mx-auto max-w-5xl px-4"><h1 className="display-md text-white">{page.title}</h1></div></header><div className="mx-auto grid max-w-5xl gap-5 px-4 py-12 sm:grid-cols-2">{rows.length ? rows.map((album) => <Link key={album.id} href={`${path}/${album.slug}`} className="border bg-white p-6"><h2 className="font-serif text-xl font-bold">{album.title}</h2>{album.description && <p className="mt-3 text-sm text-warm-gray-600">{album.description}</p>}<span className="mt-4 inline-block text-sm text-emerald-forest">Buka galeri →</span></Link>) : <p className="empty-state sm:col-span-2">Belum ada galeri terbit.</p>}</div></div>;
}
