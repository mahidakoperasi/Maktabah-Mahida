import Link from 'next/link';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/db';
import { cmsPages, galleries, posts, products, videos } from '@/db/schema';
import { getPublicMenu } from '@/lib/cms';
import ArticleCover from './ArticleCover';

type Section = '/pesantren' | '/karya' | '/koperasi' | '/media' | '/tentang';
type Highlight = { title: string; href: string; description: string | null; date: Date | null; cover?: string | null };

function pickForToday(items: Highlight[]): Highlight | undefined {
  if (!items.length) return;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta', year: 'numeric', month: 'numeric', day: 'numeric',
  }).formatToParts(new Date());
  const part = (type: string) => Number(parts.find((item) => item.type === type)?.value);
  const day = Math.floor(Date.UTC(part('year'), part('month') - 1, part('day')) / 86400000);
  return items[day % items.length];
}

async function getHighlights(section: Section): Promise<Highlight[]> {
  if (section === '/pesantren' || section === '/tentang') {
    const paths = (await getPublicMenu()).find((item) => item.path === section)?.children.map((item) => item.path) ?? [];
    if (!paths.length) return [];
    const rows = await db.select({ title: cmsPages.title, path: cmsPages.path, intro: cmsPages.intro, date: cmsPages.updatedAt })
      .from(cmsPages).where(and(inArray(cmsPages.path, paths), eq(cmsPages.status, 'published'), sql`length(trim(coalesce(${cmsPages.body}, ''))) > 0`))
      .orderBy(desc(cmsPages.updatedAt)).limit(5);
    return rows.map((row) => ({ title: row.title, href: row.path, description: row.intro, date: row.date }));
  }
  if (section === '/koperasi') {
    const rows = await db.select({ title: products.name, slug: products.slug, description: products.description, type: products.productType, date: products.createdAt, cover: products.imageUrl })
      .from(products).where(eq(products.status, 'published')).orderBy(desc(products.createdAt)).limit(5);
    return rows.map((row) => ({ title: row.title, href: `/koperasi/${row.type === 'ebook' ? 'ebook' : 'buku'}/${row.slug}`, description: row.description, date: row.date, cover: row.cover }));
  }
  const allowed = section === '/karya' ? ['article', 'essay', 'work'] : ['news', 'story', 'announcement'];
  const rows = await db.select({ title: posts.title, slug: posts.slug, excerpt: posts.excerpt, type: posts.type, category: posts.karyaCategory, date: posts.publishedAt, cover: posts.featuredImage })
    .from(posts).where(and(inArray(posts.type, allowed as (typeof posts.type.enumValues)[number][]), eq(posts.status, 'published')))
    .orderBy(desc(posts.publishedAt), desc(posts.id)).limit(5);
  const found: Highlight[] = rows.map((row) => ({
    title: row.title,
    href: section === '/karya'
      ? `/karya/${row.type === 'article' ? 'artikel' : row.type === 'essay' ? 'esai' : row.category === 'manuskrip' ? 'manuskrip' : 'terjemahan'}/${row.slug}`
      : `/media/${row.type === 'news' ? 'berita' : row.type === 'story' ? 'kegiatan' : 'pengumuman'}/${row.slug}`,
    description: row.excerpt, date: row.date, cover: row.cover,
  }));
  if (section === '/media') {
    const [latestVideos, latestGalleries] = await Promise.all([
      db.select({ title: videos.title, slug: videos.slug, description: videos.description, date: videos.createdAt, youtubeId: videos.youtubeId }).from(videos)
        .where(eq(videos.status, 'published')).orderBy(desc(videos.createdAt)).limit(5),
      db.select({ title: galleries.title, slug: galleries.slug, description: galleries.description, date: galleries.createdAt,
        cover: sql<string | null>`(select image_url from gallery_images where gallery_id = ${galleries.id} order by sort_order, id limit 1)`,
      }).from(galleries)
        .where(eq(galleries.status, 'published')).orderBy(desc(galleries.createdAt)).limit(5),
    ]);
    found.push(...latestVideos.map((row) => ({ title: row.title, href: `/media/video/${row.slug}`, description: row.description, date: row.date, cover: `https://i.ytimg.com/vi/${row.youtubeId}/hqdefault.jpg` })));
    found.push(...latestGalleries.map((row) => ({ title: row.title, href: `/media/galeri/${row.slug}`, description: row.description, date: row.date, cover: row.cover })));
  }
  return found.sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0)).slice(0, 5);
}

export default async function DailyHighlight({ section }: { section: Section }) {
  const item = pickForToday(await getHighlights(section));
  if (!item) return null;
  return <section aria-label="Halaman Hari Ini" className="mx-auto max-w-5xl px-4 pt-8 sm:px-6">
    <div className="min-w-0 overflow-hidden rounded border border-mahida-200 bg-white shadow-sm sm:grid sm:grid-cols-[minmax(0,220px)_1fr]">
      <ArticleCover url={item.cover ?? null} />
      <div className="min-w-0 p-5 sm:p-7">
      <p className="label">Halaman Hari Ini</p>
      <h2 className="mt-2 break-words font-serif text-2xl font-bold text-charcoal">{item.title}</h2>
      {item.description && <p className="mt-2 line-clamp-2 text-sm text-warm-gray-600">{item.description}</p>}
      <Link href={item.href} className="mt-4 inline-flex min-h-11 items-center font-semibold text-emerald-forest underline-offset-4 hover:underline focus-visible:outline-2">Lihat konten →</Link>
      </div>
    </div>
  </section>;
}
