import Link from 'next/link';
import { and, desc, eq, ne } from 'drizzle-orm';
import { db } from '@/db';
import { galleries, posts, products, videos } from '@/db/schema';
import type { EngagementKind } from '@/lib/engagement';

export default async function RelatedContent({ kind, id, path, category }: { kind: EngagementKind; id: number; path: string; category?: string | null }) {
  let items: { title: string; slug: string }[] = [];
  if (kind === 'post') {
    const [current] = await db.select({ type: posts.type }).from(posts).where(eq(posts.id, id)).limit(1);
    if (current) items = await db.select({ title: posts.title, slug: posts.slug }).from(posts).where(and(eq(posts.type, current.type), eq(posts.status, 'published'), ne(posts.id, id), ...(category ? [eq(posts.karyaCategory, category)] : []))).orderBy(desc(posts.publishedAt)).limit(3);
  } else if (kind === 'product') {
    const [current] = await db.select({ type: products.productType }).from(products).where(eq(products.id, id)).limit(1);
    if (current) items = await db.select({ title: products.name, slug: products.slug }).from(products).where(and(eq(products.productType, current.type), eq(products.status, 'published'), ne(products.id, id))).orderBy(desc(products.createdAt)).limit(3);
  } else if (kind === 'video') {
    items = await db.select({ title: videos.title, slug: videos.slug }).from(videos).where(and(eq(videos.status, 'published'), ne(videos.id, id))).orderBy(desc(videos.createdAt)).limit(3);
  } else {
    items = await db.select({ title: galleries.title, slug: galleries.slug }).from(galleries).where(and(eq(galleries.status, 'published'), ne(galleries.id, id))).orderBy(desc(galleries.createdAt)).limit(3);
  }
  return <section className="mt-8" aria-label="Rekomendasi konten"><h2 className="font-serif text-2xl font-bold">Bacaan / Konten Lain</h2>
    {items.length ? <div className="mt-4 grid gap-3 sm:grid-cols-3">{items.map((item) => <Link key={item.slug} href={`${path}/${item.slug}`} className="flex min-h-24 items-center rounded border border-mahida-200 bg-white p-4 font-semibold text-emerald-forest hover:border-emerald-forest">{item.title} →</Link>)}</div>
      : <p className="mt-3 text-sm text-warm-gray-600">Belum ada konten lain dalam kategori ini.</p>}
  </section>;
}
