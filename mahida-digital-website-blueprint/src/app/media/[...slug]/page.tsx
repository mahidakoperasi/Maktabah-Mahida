import { getPublicationPreview } from '@/lib/publication-store';
import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { and, asc, desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { galleries, galleryImages, posts, videos } from '@/db/schema';
import { getPublicPage, paragraphs } from '@/lib/cms';
import { getYoutubeViews } from '@/lib/youtube';
import {
  PublicContentList,
  PublicContentDetail,
} from '@/components/PublicContent';
import CmsPage from '@/components/CmsPage';
import { getCommerceSettings } from '@/lib/commerce';
import DetailEngagement from '@/components/DetailEngagement';
import RelatedContent from '@/components/RelatedContent';
import { socialMetadata } from '@/lib/social-metadata';
import GenericPageTemplate from '@/components/GenericPageTemplate';
import EditorialImage from '@/components/EditorialImage';
import GalleryLightbox from '@/components/GalleryLightbox';
import { publicGallery } from '@/lib/gallery-store';
import { getDesign } from '@/lib/design-store';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (slug.length !== 2) return {};
  if (['berita', 'kegiatan', 'pengumuman'].includes(slug[0])) {
    if (!(await getPublicPage(`/media/${slug[0]}`))) return {};
    const types = {
      berita: 'news',
      kegiatan: 'story',
      pengumuman: 'announcement',
    } as const;
    const [post] = await db
      .select({
        title: posts.title,
        excerpt: posts.excerpt,
        content: posts.content,
        featuredImage: posts.featuredImage,
        ogImage: posts.ogImage,
      })
      .from(posts)
      .where(
        and(
          eq(posts.slug, slug[1]),
          eq(posts.type, types[slug[0] as keyof typeof types]),
          eq(posts.status, 'published'),
        ),
      )
      .limit(1);
    return post
      ? socialMetadata({
          title: post.title,
          description: post.excerpt || post.content,
          image: post.ogImage || post.featuredImage,
          path: `/media/${slug[0]}/${slug[1]}`,
        })
      : {};
  }
  if (slug[0] === 'video' || slug[0] === 'tv') {
    if (!(await getPublicPage('/media/video'))) return {};
    const [video] = await db
      .select()
      .from(videos)
      .where(and(eq(videos.slug, slug[1]), eq(videos.status, 'published')))
      .limit(1);
    return video
      ? socialMetadata({
          title: video.title,
          description: video.description,
          image: `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`,
          path: `/media/${slug[0]}/${slug[1]}`,
        })
      : {};
  }
  if (slug[0] === 'galeri') {
    if (!(await getPublicPage('/media/galeri'))) return {};
    const [gallery] = await db
      .select()
      .from(galleries)
      .where(
        and(eq(galleries.slug, slug[1]), eq(galleries.status, 'published')),
      )
      .limit(1);
    if (!gallery) return {};
    const [photo] = await db
      .select({ imageUrl: galleryImages.imageUrl })
      .from(galleryImages)
      .where(eq(galleryImages.galleryId, gallery.id))
      .orderBy(asc(galleryImages.sortOrder), asc(galleryImages.id))
      .limit(1);
    return socialMetadata({
      title: gallery.title,
      description: gallery.description,
      image: photo?.imageUrl,
      path: `/media/galeri/${slug[1]}`,
    });
  }
  return {};
}

export const dynamic = 'force-dynamic';
export default async function MediaSection({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  if (slug.length < 1 || slug.length > 4) notFound();
  if (
    slug[0] === 'berita' ||
    slug[0] === 'kegiatan' ||
    slug[0] === 'pengumuman'
  ) {
    if (slug.length > 2) notFound();
    return slug.length === 1 ? (
      <PublicContentList section={slug[0]} />
    ) : (
      <PublicContentDetail section={slug[0]} slug={slug[1]} />
    );
  }
  const kind = slug[0] === 'tv' ? 'video' : slug[0];
  if (kind !== 'video' && kind !== 'galeri')
    return <CmsPage path={`/media/${slug.join('/')}`} />;
  if (slug.length > 2) notFound();
  const path = `/media/${kind}`;
  const page = await getPublicPage(path);
  if (!page) notFound();
  if (kind === 'video') {
    if (slug.length === 2) {
      const [video] = await db
        .select()
        .from(videos)
        .where(and(eq(videos.slug, slug[1]), eq(videos.status, 'published')))
        .limit(1);
      if (!video) notFound();
      const views = await getYoutubeViews(video.youtubeId);
      const channel = (await getCommerceSettings()).youtubeChannelUrl;
      return (
        <div className="min-h-screen bg-cream">
          <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
            <Link href={path} className="text-sm text-emerald-forest">
              ← Semua video
            </Link>
            <h1 className="display-md mt-5">{video.title}</h1>
            <div className="mt-8 aspect-video overflow-hidden bg-black">
              <iframe
                className="h-full w-full"
                src={`https://www.youtube.com/embed/${video.youtubeId}`}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
            {video.description && (
              <p className="mt-6 text-warm-gray-600">{video.description}</p>
            )}
            <div className="mt-6 flex flex-wrap items-center gap-4">
              {views !== null && (
                <span className="text-sm">
                  {views.toLocaleString('id-ID')} penayangan di YouTube
                </span>
              )}
              <a
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
                href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
              >
                Tonton di YouTube ↗
              </a>
              {channel && (
                <a
                  href={channel}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded border border-emerald-forest px-4 py-2 text-sm font-semibold text-emerald-forest"
                >
                  Lihat kanal YouTube Mahida ↗
                </a>
              )}
            </div>
          </div>
          <DetailEngagement kind="video" id={video.id}>
            <RelatedContent kind="video" id={video.id} path={path} />
          </DetailEngagement>
        </div>
      );
    }
    const rows = await db
      .select()
      .from(videos)
      .where(eq(videos.status, 'published'))
      .orderBy(asc(videos.sortOrder), desc(videos.createdAt));
    const content = await getDesign(path, 'content');
    const spotlight = rows.find((v) => v.id === content?.featuredVideoId);
    return (
      <GenericPageTemplate
        path={path}
        title={page.title}
        intro={page.intro}
        paragraphs={page.body ? paragraphs(page.body) : []}
        section="Media Mahida"
      >
        {spotlight && (
          <section aria-label="Video sorotan" className="mb-8">
            <h2 className="mb-4 text-2xl font-bold">{spotlight.title}</h2>
            <div className="aspect-video">
              <iframe
                loading="lazy"
                title={spotlight.title}
                src={`https://www.youtube-nocookie.com/embed/${spotlight.youtubeId}`}
                allow="fullscreen; picture-in-picture"
                allowFullScreen
                className="h-full w-full border-0"
              />
            </div>
          </section>
        )}
        {rows.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rows
              .filter((v) => v.id !== spotlight?.id)
              .map((video) => (
                <Link
                  key={video.id}
                  href={`${path}/${video.slug}`}
                  className="group block border border-mahida-200 bg-white"
                >
                  <EditorialImage
                    hideFallback
                    url={`https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`}
                    label={`Thumbnail ${video.title}`}
                    className="aspect-video w-full"
                  />
                  <div className="p-5">
                    <h2 className="text-xl font-bold group-hover:text-emerald-rich">
                      {video.title}
                    </h2>
                    {video.description && (
                      <p className="mt-2 text-sm text-warm-gray-600">
                        {video.description}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
          </div>
        ) : (
          <p className="empty-state">Belum ada vidio terbit.</p>
        )}
      </GenericPageTemplate>
    );
  }
  if (slug.length === 2) {
    const [album] = await db
      .select()
      .from(galleries)
      .where(
        eq(galleries.slug, slug[1]),
      )
      .limit(1);
    const preview = album ? await getPublicationPreview(`gallery:${album.id}`) : null;
    if (!album || (!preview && album.status !== 'published')) notFound();
    const photos = await db
      .select()
      .from(galleryImages)
      .where(eq(galleryImages.galleryId, album.id))
      .orderBy(asc(galleryImages.sortOrder));
    const curated = preview?.type === 'gallery' ? preview.data : await publicGallery(album.id);
    const title = curated?.title ?? album.title;
    const description = curated?.description ?? album.description;
    return (
      <div className="min-h-screen bg-cream">
        <header className="bg-emerald-forest py-14 text-white">
          <div className="mx-auto max-w-5xl px-4">
            <h1 className="display-md text-white">{title}</h1>
            {description && (
              <p className="mt-3 text-white/80">{description}</p>
            )}
          </div>
        </header>
        <div className="mx-auto max-w-[1280px] px-5 py-12">
          {(curated?.photos ?? photos).length ? (
            <GalleryLightbox photos={curated?.photos ?? photos} title={title} layout={curated?.layout} />
          ) : (
            <p className="empty-state">Belum ada foto dalam galeri ini.</p>
          )}
        </div>
        <DetailEngagement kind="gallery" id={album.id}>
          <RelatedContent kind="gallery" id={album.id} path={path} />
        </DetailEngagement>
      </div>
    );
  }
  const rows = await db
    .select({
      id: galleries.id,
      slug: galleries.slug,
      title: galleries.title,
      description: galleries.description,
    })
    .from(galleries)
    .where(eq(galleries.status, 'published'))
    .orderBy(desc(galleries.createdAt));
  const photos = rows.length
    ? await db
        .select({
          galleryId: galleryImages.galleryId,
          imageUrl: galleryImages.imageUrl,
        })
        .from(galleryImages)
        .orderBy(asc(galleryImages.sortOrder), asc(galleryImages.id))
    : [];
  const covers = new Map<number, string>();
  for (const photo of photos)
    if (!covers.has(photo.galleryId))
      covers.set(photo.galleryId, photo.imageUrl);
  return (
    <GenericPageTemplate
      path={path}
      title={page.title}
      intro={page.intro}
      paragraphs={page.body ? paragraphs(page.body) : []}
      section="Media Mahida"
    >
      {rows.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((album) => (
            <Link
              key={album.id}
              href={`${path}/${album.slug}`}
              className="group block border border-mahida-200 bg-white"
            >
              <EditorialImage
                hideFallback
                url={covers.get(album.id)}
                label={`Sampul ${album.title}`}
                className="aspect-video w-full"
              />
              <div className="p-5">
                <h2 className="text-xl font-bold group-hover:text-emerald-rich">
                  {album.title}
                </h2>
                {album.description && (
                  <p className="mt-2 text-sm text-warm-gray-600">
                    {album.description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="empty-state">Belum ada galeri terbit.</p>
      )}
    </GenericPageTemplate>
  );
}
